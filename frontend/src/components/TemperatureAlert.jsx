import { useEffect, useState, useCallback } from "react";
import { Thermometer, Brain, X } from "lucide-react";
import api from "../api/axios";
import { useLocation } from "react-router-dom";
import { useUsuario } from "../hooks/useUsuario";
import "./TemperatureAlert.css";

function TemperatureAlert() {
  const location = useLocation();
  const { esSuperAdmin } = useUsuario();

  const POLL_MS = 30000;

  const [alertas, setAlertas] = useState([]);
  const [predictivas, setPredictivas] = useState([]);
  const [dismissed, setDismissed] = useState(false);

  const token = localStorage.getItem("access_token");
  const estaAutenticado = token && token !== "null" && token !== "undefined";

  const ocultar =
    !estaAutenticado ||
    esSuperAdmin ||
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/cambio-password" ||
    location.pathname === "/pago-exitoso";

  const cargarAlertas = useCallback(async () => {
    try {
      const [resAlertas, resPred] = await Promise.all([
        api.get("/temperatura/alertas/"),
        api.get("/temperatura/prediccion/ultimas/"),
      ]);

      const rawAlertas = Array.isArray(resAlertas.data) ? resAlertas.data : [];
      const filtradas = rawAlertas.filter((a) => {
        const temp = parseFloat(a?.temperatura);
        return !isNaN(temp) && temp >= 0 && temp <= 60;
      });

      const preds = Array.isArray(resPred.data) ? resPred.data : [];
      const alertasPred = preds.filter((p) => p.umbral_superado);

      setAlertas(filtradas);
      setPredictivas(alertasPred);
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    if (ocultar) return;
    cargarAlertas();
    const intervalo = setInterval(cargarAlertas, POLL_MS);
    return () => clearInterval(intervalo);
  }, [ocultar, cargarAlertas]);

  // Re-mostrar si hay nuevas alertas
  useEffect(() => {
    if (alertas.length > 0 || predictivas.length > 0) {
      setDismissed(false);
    }
  }, [alertas.length, predictivas.length]);

  const total = alertas.length + predictivas.length;
  if (ocultar || total === 0 || dismissed) return null;

  const tipoAlerta =
    predictivas.length > 0 && alertas.length === 0
      ? "predictiva"
      : alertas.length > 0 && predictivas.length === 0
        ? "directa"
        : "mixta";

  const getBorderClass = () => {
    if (tipoAlerta === "predictiva") return "alerta-frio";
    if (tipoAlerta === "directa") {
      const hayCalor = alertas.some((a) => a.estado === "CALOR");
      return hayCalor ? "alerta-calor" : "alerta-frio";
    }
    return "alerta-multiple";
  };

  return (
    <div className={`temperature-alert ${getBorderClass()}`}>
      <div className="temperature-alert-icon">
        {tipoAlerta === "predictiva" ? (
          <Brain size={24} color="#7c3aed" />
        ) : (
          <Thermometer size={24} color={tipoAlerta === "mixta" ? "#f59e0b" : "#ef4444"} />
        )}
      </div>

      <div className="temperature-alert-content">
        <h3>
          {tipoAlerta === "predictiva"
            ? "Alerta Predictiva de Temperatura"
            : tipoAlerta === "mixta"
              ? "Alertas de Temperatura"
              : "Alerta de Temperatura"}
        </h3>

        {predictivas.length > 0 && (
          <div className="temperature-alert-list">
            {predictivas.map((p) => (
              <div
                key={`pred-${p.id}`}
                className={`temperature-alert-item ${p.estado_predicho === "CALOR" ? "item-calor" : "item-frio"}`}
              >
                <strong>{p.galpon_nombre}</strong>
                <span>{p.mensaje}</span>
              </div>
            ))}
          </div>
        )}

        {alertas.length > 0 && (
          <div className="temperature-alert-list">
            {alertas.map((a) => (
              <div
                key={`alert-${a.id}`}
                className={`temperature-alert-item ${a.estado === "CALOR" ? "item-calor" : "item-frio"}`}
              >
                <strong>{a.galpon_nombre}</strong>
                <span>
                  {a.temperatura}°C — {a.mensaje}
                </span>
              </div>
            ))}
          </div>
        )}

        {total === 1 && alertas[0] && (
          <>
            <p>{alertas[0].galpon_nombre}: {alertas[0].temperatura}°C</p>
            <span>{alertas[0].mensaje}</span>
            <small>Haga clic en Temperatura para ver detalles</small>
          </>
        )}

        {total === 1 && predictivas[0] && (
          <>
            <p>{predictivas[0].galpon_nombre}</p>
            <span>{predictivas[0].mensaje}</span>
            <small>Revise la sección Predicción IA</small>
          </>
        )}
      </div>

      <button
        className="temperature-alert-close"
        onClick={() => setDismissed(true)}
        type="button"
        aria-label="Cerrar alerta"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default TemperatureAlert;  
