import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import api from "../api/axios";
import "./TemperatureAlert.css";
import { useLocation } from "react-router-dom";

function TemperatureAlert() {
    const location = useLocation();
  /*
    alertas:
    Aquí guardamos las alertas que devuelve el backend.
    Si no hay alertas, queda como arreglo vacío [].
  */
  const [alertas, setAlertas] = useState([]);

  /*
    visible:
    Controla si la alerta flotante se muestra o no.
    Si el usuario cierra la alerta, visible pasa a false.
  */
  const [visible, setVisible] = useState(true);

  /*
    useEffect:
    Se ejecuta cuando carga la aplicación.
    Consulta las alertas de temperatura cada 10 segundos.
  */
  useEffect(() => {
    cargarAlertas();

    const intervalo = setInterval(() => {
      cargarAlertas();
    }, 3000);

    return () => clearInterval(intervalo);
  }, []);

  /*
    cargarAlertas:
    Consulta el endpoint del backend:
    GET /temperatura/alertas/

    Ese endpoint devuelve solamente temperaturas con estado FRIO o CALOR.
  */
  const cargarAlertas = async () => {
    try {
      const respuesta = await api.get("/temperatura/alertas/");

      setAlertas(respuesta.data);

      /*
        Si llegan nuevas alertas, volvemos a mostrar la caja.
        Esto sirve por si el usuario la cerró antes.
      */
      if (respuesta.data.length > 0) {
        setVisible(true);
      }
    } catch (error) {
      /*
        Si falla, no rompemos la pantalla.
        Solo mostramos el error en consola.
      */
      console.error("Error al cargar alertas de temperatura:", error);
    }
  };

     const rutasSinAlerta = [
  "/",
  "/register",

  // No mostrar alerta global
  // en la vista de monitoreo de temperatura.
  "/temperatura",
];
        if (rutasSinAlerta.includes(location.pathname)) {
         return null;
    }

  /*
    Si no hay alertas, no mostramos nada.
  */
  if (!visible || alertas.length === 0) {
    return null;
  }

  /*
    Tomamos la primera alerta para mostrarla arriba.
    Si hay más de una, abajo mostramos el contador.
  */
  const alertaPrincipal = alertas[0];

  return (
  <div className="temperature-alert alerta-multiple">
    <div className="temperature-alert-icon">
      <AlertTriangle size={24} />
    </div>

    <div className="temperature-alert-content">
      <h3>
        {alertas.length === 1
          ? "Alerta de temperatura"
          : "Alertas de temperatura"}
      </h3>

      <p>
        {alertas.length === 1
          ? "Se detectó 1 galpón con temperatura fuera del rango normal."
          : `Se detectaron ${alertas.length} galpones con temperatura fuera del rango normal.`}
      </p>

      <div className="temperature-alert-list">
        {alertas.map((alerta) => (
          <div
            key={alerta.id}
            className={`temperature-alert-item ${
              alerta.estado === "CALOR" ? "item-calor" : "item-frio"
            }`}
          >
            <strong>{alerta.galpon_nombre}</strong>

            <span>
              {alerta.estado === "CALOR"
                ? "Alerta de calor"
                : "Alerta de frío"}{" "}
              - {alerta.temperatura}°C
            </span>
          </div>
        ))}
      </div>
    </div>

    <button
      className="temperature-alert-close"
      onClick={() => setVisible(false)}
      type="button"
    >
      <X size={18} />
    </button>
  </div>
);
}

export default TemperatureAlert;