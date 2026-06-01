import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Stethoscope,
  Plus,
  ShieldAlert,
} from "lucide-react";

import Sidebar from "../../../components/Sidebar";
import Topbar from "../../../components/Topbar";
import Modal from "../../../components/Modal";
import InputField from "../../../components/InputField";
import ComboBox from "../../../components/ComboBox";
import api from "../../../api/axios";
import useIsMobile from "../../../hooks/useIsMobile";

import "../../Inventario/Inventario.css";
import "./AlertasSanitarias.css";

function AlertasSanitarias() {
  /*
    sidebarOpen:
    Controla si el menú lateral está abierto o cerrado.
  */
  const [sidebarOpen, setSidebarOpen] = useState(true);

  /*
    isMobile:
    Detecta si la pantalla está en modo móvil.
  */
  const isMobile = useIsMobile();

  /*
    loading:
    Sirve para mostrar el mensaje de carga cuando se están trayendo datos.
  */
  const [loading, setLoading] = useState(true);

  /*
    alertas:
    Aquí se guardan las alertas sanitarias que llegan del backend.
  */
  const [alertas, setAlertas] = useState([]);

  /*
    lotes:
    Aquí se guardan los lotes para poder seleccionarlos
    cuando se registra una enfermedad.
  */
  const [lotes, setLotes] = useState([]);

  /*
    showModal:
    Controla si se muestra o no el formulario modal.
  */
  const [showModal, setShowModal] = useState(false);

  /*
    mensaje:
    Mensaje de éxito.
  */
  const [mensaje, setMensaje] = useState("");

  /*
    error:
    Mensaje de error.
  */
  const [error, setError] = useState("");

  /*
    filtroEstado:
    Controla qué alertas se muestran.
    "" = Todas
    Pendiente = solo pendientes
    Atendida = solo atendidas
    Resuelta = solo resueltas
  */
  const [filtroEstado, setFiltroEstado] = useState("Pendiente");

  /*
    formEnfermedad:
    Guarda los datos del formulario para registrar enfermedad por lote.
  */
  const [formEnfermedad, setFormEnfermedad] = useState({
    lote: "",
    nombre_enfermedad: "",
    aves_afectadas: "",
    descripcion: "",
  });

  /*
    useEffect inicial:
    Carga los lotes una sola vez al entrar a la pantalla.
    Las alertas se cargan en otro useEffect, respetando el filtro.
  */
  useEffect(() => {
    cargarLotes();
  }, []);

  /*
    useEffect del filtro:
    Cada vez que cambia el filtro, carga las alertas correspondientes.
    Además, mantiene un intervalo que respeta el filtro seleccionado.
  */
  useEffect(() => {
    cargarAlertas({
      estadoSeleccionado: filtroEstado,
    });

    const intervalo = setInterval(() => {
      cargarAlertas({
        silent: true,
        estadoSeleccionado: filtroEstado,
      });
    }, 10000);

    return () => clearInterval(intervalo);
  }, [filtroEstado]);

  /*
    cargarLotes:
    Trae los lotes registrados desde el backend.
  */
  const cargarLotes = async () => {
    try {
      const res = await api.get("/lotes/");
      setLotes(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Error cargando lotes:", e);
      setError("No se pudieron cargar los lotes.");
    }
  };

  /*
    cargarAlertas:
    Trae las alertas sanitarias desde el backend.

    Si estadoSeleccionado tiene valor:
    GET /sanitario/alertas/?estado=Pendiente

    Si estadoSeleccionado está vacío:
    GET /sanitario/alertas/
  */
  const cargarAlertas = async ({
    silent = false,
    estadoSeleccionado = filtroEstado,
  } = {}) => {
    if (!silent) setLoading(true);

    try {
      const params = {};

      /*
        Si hay un estado seleccionado, se manda como filtro.
        Si está vacío, significa "Todas".
      */
      if (estadoSeleccionado) {
        params.estado = estadoSeleccionado;
      }

      const res = await api.get("/sanitario/alertas/", { params });

      setAlertas(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Error cargando alertas sanitarias:", e);
      setError("No se pudieron cargar las alertas sanitarias.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  /*
    handleChangeEnfermedad:
    Actualiza el formulario cuando el usuario escribe.
  */
  const handleChangeEnfermedad = (e) => {
    const { name, value } = e.target;

    setFormEnfermedad({
      ...formEnfermedad,
      [name]: value,
    });
  };

  /*
    registrarEnfermedad:
    Registra una enfermedad por lote.

    El backend:
    1. Guarda la enfermedad.
    2. Calcula el porcentaje de aves afectadas.
    3. Si supera el 5%, genera una alerta sanitaria.
  */
  const registrarEnfermedad = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setMensaje("");

      if (
        !formEnfermedad.lote ||
        !formEnfermedad.nombre_enfermedad ||
        !formEnfermedad.aves_afectadas
      ) {
        setError(
          "Debe seleccionar un lote, ingresar la enfermedad y la cantidad de aves afectadas."
        );
        return;
      }

      const res = await api.post("/sanitario/enfermedades/", {
        lote: Number(formEnfermedad.lote),
        nombre_enfermedad: formEnfermedad.nombre_enfermedad,
        aves_afectadas: Number(formEnfermedad.aves_afectadas),
        descripcion: formEnfermedad.descripcion,
      });

      const cantidadAlertas = res.data?.alertas_generadas?.length || 0;

      if (cantidadAlertas > 0) {
        setMensaje(
          `Enfermedad registrada. Se generó ${cantidadAlertas} alerta sanitaria.`
        );
      } else {
        setMensaje(
          "Enfermedad registrada. No supera el umbral de alerta sanitaria."
        );
      }

      setFormEnfermedad({
        lote: "",
        nombre_enfermedad: "",
        aves_afectadas: "",
        descripcion: "",
      });

      setShowModal(false);

      await cargarAlertas({
        estadoSeleccionado: filtroEstado,
      });
    } catch (e) {
      console.error("Error registrando enfermedad:", e);

      const detalle = e.response?.data;

      if (detalle?.aves_afectadas) {
        setError(detalle.aves_afectadas[0]);
      } else if (detalle?.lote) {
        setError(detalle.lote[0]);
      } else {
        setError("No se pudo registrar la enfermedad.");
      }
    }
  };

  /*
    evaluarRiesgoSanitario:
    Ejecuta la evaluación general del CU17.

    El backend revisa:
    - Enfermedades activas.
    - Mortandad posterior a enfermedad.
    - Stock bajo de medicamentos críticos.
  */
  const evaluarRiesgoSanitario = async () => {
    try {
      setError("");
      setMensaje("");

      const res = await api.post("/sanitario/alertas/evaluar/", {});

      setMensaje(
        `Evaluación realizada. Alertas detectadas: ${
          res.data?.cantidad_alertas || 0
        }.`
      );

      await cargarAlertas({
        estadoSeleccionado: filtroEstado,
      });
    } catch (e) {
      console.error("Error evaluando riesgo sanitario:", e);
      setError("No se pudo evaluar el riesgo sanitario.");
    }
  };

  /*
    cambiarEstadoAlerta:
    Cambia el estado de la alerta sanitaria.

    Puede cambiar a:
    - Atendida
    - Resuelta
  */
  const cambiarEstadoAlerta = async (alertaId, estado) => {
    try {
      setError("");
      setMensaje("");

      await api.patch(`/sanitario/alertas/${alertaId}/estado/`, {
        estado,
      });

      setMensaje(`Alerta marcada como ${estado}.`);

      await cargarAlertas({
        estadoSeleccionado: filtroEstado,
      });
    } catch (e) {
      console.error("Error cambiando estado de alerta:", e);
      setError("No se pudo cambiar el estado de la alerta.");
    }
  };

  /*
    alertasPendientes:
    Cuenta las alertas pendientes que se están mostrando.
  */
  const alertasPendientes = useMemo(() => {
    return alertas.filter((a) => a.estado === "Pendiente").length;
  }, [alertas]);

  /*
    alertasCriticas:
    Cuenta las alertas críticas que se están mostrando.
  */
  const alertasCriticas = useMemo(() => {
    return alertas.filter((a) => a.nivel === "Critica").length;
  }, [alertas]);

  /*
    obtenerClaseNivel:
    Devuelve una clase CSS según el nivel de la alerta.
  */
  const obtenerClaseNivel = (nivel) => {
    if (nivel === "Critica") return "alerta-sanitaria-critica";
    if (nivel === "Alta") return "alerta-sanitaria-alta";
    return "alerta-sanitaria-media";
  };

  /*
    formatearFecha:
    Convierte la fecha del backend a formato más entendible.
  */
  const formatearFecha = (fecha) => {
    if (!fecha) return "-";

    return new Date(fecha).toLocaleString("es-BO", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  return (
    <div className="inv-layout">
      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        showMobileTrigger={false}
      />

      <main
        className="inv-main"
        style={{
          marginLeft: isMobile ? "0" : sidebarOpen ? "240px" : "70px",
          padding: isMobile ? "16px" : "32px",
          paddingTop: isMobile ? "80px" : "32px",
          transition: "margin-left 0.3s ease",
          flex: 1,
        }}
      >
        <Topbar
          titulo="Alertas Sanitarias"
          subtitulo="CU17 - Generación de alertas por riesgo sanitario"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {error && <div className="alerta-sanitaria-error">{error}</div>}

        {mensaje && <div className="alerta-sanitaria-ok">{mensaje}</div>}

        <section className="alertas-sanitarias-resumen">
          <div className="alerta-resumen-card">
            <div>
              <span>Alertas visibles</span>
              <strong>{alertas.length}</strong>
            </div>
            <ShieldAlert size={30} />
          </div>

          <div className="alerta-resumen-card">
            <div>
              <span>Pendientes</span>
              <strong>{alertasPendientes}</strong>
            </div>
            <AlertTriangle size={30} />
          </div>

          <div className="alerta-resumen-card">
            <div>
              <span>Críticas</span>
              <strong>{alertasCriticas}</strong>
            </div>
            <Stethoscope size={30} />
          </div>
        </section>

        <div className="inv-header" style={{ marginBottom: "20px" }}>
          <div className="alertas-sanitarias-filtros">
            <div className="filtro-estado-alertas">
              <label>Filtrar por estado</label>

              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="">Todas</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Atendida">Atendida</option>
                <option value="Resuelta">Resuelta</option>
              </select>
            </div>
          </div>

          <div className="inv-header-actions">
            <button
              className="inv-btn-secondary"
              type="button"
              onClick={evaluarRiesgoSanitario}
            >
              <RefreshCw size={16} /> Evaluar riesgo
            </button>

            <button
              className="inv-btn-primary"
              type="button"
              onClick={() => setShowModal(true)}
            >
              <Plus size={16} /> Registrar enfermedad
            </button>
          </div>
        </div>

        <section className="inv-panel">
          <div className="inv-panel-header">
            <h3 className="inv-panel-title">
              <AlertTriangle size={18} /> Alertas sanitarias registradas
            </h3>
          </div>

          {loading ? (
            <div className="inv-empty">Cargando alertas sanitarias...</div>
          ) : alertas.length === 0 ? (
            <div className="inv-empty">
              No hay alertas sanitarias para el filtro seleccionado.
            </div>
          ) : (
            <div className="alertas-sanitarias-grid">
              {alertas.map((alerta) => (
                <div
                  key={alerta.id}
                  className={`alerta-sanitaria-card ${obtenerClaseNivel(
                    alerta.nivel
                  )}`}
                >
                  <div className="alerta-sanitaria-card-header">
                    <div>
                      <h3>{alerta.titulo}</h3>
                      <span>{alerta.tipo_alerta}</span>
                    </div>

                    <strong>{alerta.nivel}</strong>
                  </div>

                  <p>{alerta.descripcion}</p>

                  <div className="alerta-sanitaria-detalle">
                    <div>
                      <span>Lote</span>
                      <strong>{alerta.lote_codigo || "-"}</strong>
                    </div>

                    <div>
                      <span>Galpón</span>
                      <strong>{alerta.galpon_nombre || "-"}</strong>
                    </div>

                    <div>
                      <span>Causa</span>
                      <strong>{alerta.causa || "-"}</strong>
                    </div>

                    <div>
                      <span>Estado</span>
                      <strong>{alerta.estado}</strong>
                    </div>

                    <div>
                      <span>Afectadas</span>
                      <strong>{alerta.cantidad_afectada ?? "-"}</strong>
                    </div>

                    <div>
                      <span>% afectado</span>
                      <strong>
                        {alerta.porcentaje_afectado
                          ? `${alerta.porcentaje_afectado}%`
                          : "-"}
                      </strong>
                    </div>

                    <div>
                      <span>Fecha</span>
                      <strong>{formatearFecha(alerta.fecha_hora)}</strong>
                    </div>
                  </div>

                  {alerta.estado === "Pendiente" && (
                    <div className="alerta-sanitaria-actions">
                      <button
                        type="button"
                        className="btn-alerta-atendida"
                        onClick={() =>
                          cambiarEstadoAlerta(alerta.id, "Atendida")
                        }
                      >
                        <CheckCircle size={16} /> Atendida
                      </button>

                      <button
                        type="button"
                        className="btn-alerta-resuelta"
                        onClick={() =>
                          cambiarEstadoAlerta(alerta.id, "Resuelta")
                        }
                      >
                        Resolver
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {showModal && (
        <Modal
          titulo="Registrar enfermedad por lote"
          onClose={() => setShowModal(false)}
        >
          <form className="inv-form" onSubmit={registrarEnfermedad}>
            <ComboBox
              label="Lote afectado"
              value={formEnfermedad.lote}
              onChange={(val) =>
                setFormEnfermedad({
                  ...formEnfermedad,
                  lote: val,
                })
              }
              options={lotes.map((l) => ({
                value: String(l.id_lote),
                label: `Lote ${l.id_lote} - ${
                  l.raza_tipo || "Sin raza"
                } (${l.cantidad_actual} aves)`,
              }))}
              placeholder="Seleccionar lote..."
              required
            />

            <InputField
              label="Nombre de la enfermedad"
              name="nombre_enfermedad"
              placeholder="Ejemplo: Newcastle, Bronquitis, Coccidiosis"
              value={formEnfermedad.nombre_enfermedad}
              onChange={handleChangeEnfermedad}
              required
            />

            <InputField
              label="Aves afectadas"
              type="number"
              name="aves_afectadas"
              placeholder="Ejemplo: 6"
              value={formEnfermedad.aves_afectadas}
              onChange={handleChangeEnfermedad}
              required
            />

            <InputField
              label="Descripción"
              name="descripcion"
              placeholder="Detalle de síntomas u observaciones..."
              value={formEnfermedad.descripcion}
              onChange={handleChangeEnfermedad}
            />

            <button className="inv-btn-primary" type="submit">
              <Plus size={16} /> Guardar y evaluar alerta
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default AlertasSanitarias;