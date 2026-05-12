import { useEffect, useState } from "react";
import api from "../../api/axios";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import "./Temperatura.css";

function Temperatura() {
  /*
    temperaturas:
    Guarda la temperatura actual de cada galpón.
    Estos datos vienen del endpoint:
    GET /temperatura/tiempo-real/
  */
  const [temperaturas, setTemperaturas] = useState([]);

  /*
    historial:
    Guarda los últimos registros de temperatura.
    Estos datos vienen del endpoint:
    GET /temperatura/historial/
  */
  const [historial, setHistorial] = useState([]);

  /*
    galpones:
    Guarda la lista de galpones.
    Se usa para el formulario manual.
  */
  const [galpones, setGalpones] = useState([]);

  /*
    cargando:
    Sirve para mostrar un mensaje mientras se cargan los datos.
  */
  const [cargando, setCargando] = useState(true);

  /*
    error:
    Guarda mensajes de error cuando algo falla.
  */
  const [error, setError] = useState("");

  /*
    formManual:
    Guarda los datos del formulario manual.
    id_galpon = galpón seleccionado.
    temperatura = temperatura escrita por el usuario.
  */
  const [formManual, setFormManual] = useState({
    id_galpon: "",
    temperatura: "",
  });

  /*
    mensajeManual:
    Muestra mensaje cuando se registra una temperatura manual.
  */
  const [mensajeManual, setMensajeManual] = useState("");

  /*
    useEffect:
    Se ejecuta cuando entra a la pantalla.
    Primero carga galpones, temperaturas e historial.
    Luego activa un intervalo para actualizar cada 5 segundos.
  */
  useEffect(() => {
    cargarDatosIniciales();

    /*
      setInterval:
      Esto hace que el sistema consulte el backend cada 5 segundos.
      Así simulamos el monitoreo en tiempo real.
    */
    const intervalo = setInterval(() => {
        /*
      Actualiza en paralelo para que no tarde.
         */
         Promise.all([
          cargarTemperaturasTiempoReal(),
          cargarHistorial(),
         ]);
    }, 15000);

    /*
      return:
      Limpia el intervalo cuando el usuario sale de la pantalla.
      Esto evita que React siga consultando al backend innecesariamente.
    */
    return () => clearInterval(intervalo);
  }, []);

  /*
    cargarDatosIniciales:
    Carga todo lo necesario al abrir la pantalla.
  */
const cargarDatosIniciales = async () => {
  try {
    setCargando(true);
    setError("");

    /*
      Promise.all ejecuta las 3 peticiones al mismo tiempo.
      Antes se ejecutaban una por una, por eso podía tardar más.
    */
    await Promise.all([
      cargarGalpones(),
      cargarTemperaturasTiempoReal(),
      cargarHistorial(),
    ]);
  } catch (err) {
    console.error("Error cargando temperaturas:", err);
    setError("No se pudieron cargar los datos de temperatura.");
  } finally {
    setCargando(false);
  }
};

  /*
    cargarGalpones:
    Trae los galpones registrados.
    Se usa para llenar el select del formulario manual.
  */
  const cargarGalpones = async () => {
    const respuesta = await api.get("/galpones/");
    setGalpones(respuesta.data);
  };

  /*
    cargarTemperaturasTiempoReal:
    Llama al endpoint que genera temperaturas simuladas.

    IMPORTANTE:
    Cada vez que se llama a este endpoint, el backend:
    1. Genera temperatura nueva.
    2. Calcula estado.
    3. Guarda en BD.
    4. Devuelve datos al frontend.
  */
  const cargarTemperaturasTiempoReal = async () => {
    const respuesta = await api.get("/temperatura/tiempo-real/");
    setTemperaturas(respuesta.data);
  };

  /*
    cargarHistorial:
    Trae los últimos registros de temperatura guardados en BD.
  */
  const cargarHistorial = async () => {
    const respuesta = await api.get("/temperatura/historial/");
    setHistorial(respuesta.data);
  };

  /*
    handleChangeManual:
    Actualiza los datos del formulario manual
    cuando el usuario escribe o selecciona un galpón.
  */
  const handleChangeManual = (e) => {
    const { name, value } = e.target;

    setFormManual({
      ...formManual,
      [name]: value,
    });
  };

  /*
    registrarTemperaturaManual:
    Envía una temperatura escrita manualmente al backend.
    Esto sirve para probar alertas de frío o calor.
  */
  const registrarTemperaturaManual = async (e) => {
    e.preventDefault();

    try {
      setMensajeManual("");
      setError("");

      if (!formManual.id_galpon || !formManual.temperatura) {
        setError("Debe seleccionar un galpón e ingresar una temperatura.");
        return;
      }

      await api.post("/temperatura/manual/", {
        id_galpon: formManual.id_galpon,
        temperatura: formManual.temperatura,
      });

      setMensajeManual("Temperatura registrada correctamente.");

      setFormManual({
        id_galpon: "",
        temperatura: "",
      });

      /*
        Después de registrar manualmente,
        recargamos temperatura e historial.
      */
      await cargarTemperaturasTiempoReal();
      await cargarHistorial();
    } catch (err) {
      setError("No se pudo registrar la temperatura manual.");
    }
  };

  /*
    obtenerClaseEstado:
    Devuelve una clase CSS según el estado.
    Esto sirve para cambiar color visualmente.
  */
  const obtenerClaseEstado = (estado) => {
    if (estado === "FRIO") return "estado-frio";
    if (estado === "CALOR") return "estado-calor";
    if (estado === "NORMAL") return "estado-normal";
    return "estado-sin-datos";
  };

  /*
    formatearFecha:
    Convierte la fecha del backend a un formato más entendible.
  */
  const formatearFecha = (fecha) => {
    if (!fecha) return "Sin fecha";

    return new Date(fecha).toLocaleString("es-BO", {
      dateStyle: "short",
      timeStyle: "medium",
    });
  };

  return (
    <div className="layout">
      <Sidebar />

      <main className="main-content">
        <Topbar title="Monitoreo de Temperatura" />

        <div className="temperatura-page">
          <div className="temperatura-header">
            <div>
              <h1>Monitoreo de Temperatura en tiempo real</h1>
            </div>

            <button
              className="btn-actualizar"
              onClick={() => {
                cargarTemperaturasTiempoReal();
                cargarHistorial();
              }}
            >
              Actualizar ahora
            </button>
          </div>

          {error && <div className="alerta-error">{error}</div>}

          {mensajeManual && <div className="alerta-ok">{mensajeManual}</div>}

          {cargando ? (
            <div className="cargando">Cargando temperaturas...</div>
          ) : (
            <>
              <section className="temperatura-grid">
                {temperaturas.map((item) => (
                  <div
                    key={item.id_galpon}
                    className={`temperatura-card ${obtenerClaseEstado(item.estado)}`}
                  >
                    <div className="temperatura-card-header">
                      <h2>{item.galpon_nombre}</h2>
                      <span>{item.fuente}</span>
                    </div>

                    <div className="temperatura-valor">
                      {item.temperatura}°C
                    </div>

                    <div className="temperatura-estado">
                      Estado: <strong>{item.estado}</strong>
                    </div>

                    <p className="temperatura-mensaje">
                      {item.mensaje}
                    </p>

                    <small>
                      Última actualización: {formatearFecha(item.fecha_hora)}
                    </small>
                  </div>
                ))}
              </section>

              <section className="temperatura-secciones">
                <div className="temperatura-formulario">
                  <h2>Registrar temperatura manual</h2>
                  <p>
                    Esta opción sirve para probar alertas sin esperar la simulación automática.
                  </p>

                  <form onSubmit={registrarTemperaturaManual}>
                    <label>Galpón</label>
                    <select
                      name="id_galpon"
                      value={formManual.id_galpon}
                      onChange={handleChangeManual}
                    >
                      <option value="">Seleccione un galpón</option>

                      {galpones.map((galpon) => (
                        <option key={galpon.id} value={galpon.id}>
                          {galpon.nombre}
                        </option>
                      ))}
                    </select>

                    <label>Temperatura °C</label>
                    <input
                      type="number"
                      name="temperatura"
                      value={formManual.temperatura}
                      onChange={handleChangeManual}
                      placeholder="Ejemplo: 38"
                      step="0.01"
                    />

                    <button type="submit">
                      Guardar temperatura
                    </button>
                  </form>
                </div>

                <div className="temperatura-historial">
                  <h2>Historial reciente</h2>

                  <table>
                    <thead>
                      <tr>
                        <th>Galpón</th>
                        <th>Temperatura</th>
                        <th>Estado</th>
                        <th>Fuente</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>

                    <tbody>
                      {historial.map((item) => (
                        <tr key={item.id}>
                          <td>{item.galpon_nombre}</td>
                          <td>{item.temperatura}°C</td>
                          <td>
                            <span className={`badge ${obtenerClaseEstado(item.estado)}`}>
                              {item.estado}
                            </span>
                          </td>
                          <td>{item.fuente}</td>
                          <td>{formatearFecha(item.fecha_hora)}</td>
                        </tr>
                      ))}

                      {historial.length === 0 && (
                        <tr>
                          <td colSpan="5">
                            No hay registros de temperatura todavía.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default Temperatura;