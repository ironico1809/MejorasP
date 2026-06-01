/*import { useState, useEffect } from "react";
import { Bird, Skull, Package, Thermometer, Zap, AlertCircle, Brain, TrendingUp } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import StatCard from "../../components/StatCard";
import AlertItem from "../../components/AlertItem";
import api from "../../api/axios";
import useIsMobile from "../../hooks/useIsMobile";


import { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";*/
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  Bird,
  Skull,
  Package,
  Thermometer,
  Zap,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  Brain,
  TrendingUp,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import StatCard from "../../components/StatCard";
import AlertItem from "../../components/AlertItem";
import api from "../../api/axios";
import useIsMobile from "../../hooks/useIsMobile";


function Dashboard() {
  const navigate = useNavigate();

/*
  alertasSanitarias:
  Guarda las alertas sanitarias pendientes que vienen del backend.

  Endpoint usado:
  GET /sanitario/alertas/?estado=Pendiente
*/
const [alertasSanitarias, setAlertasSanitarias] = useState([]);

/*
  cargandoAlertas:
  Sirve para controlar si el Dashboard está cargando las alertas sanitarias.
*/
const [cargandoAlertas, setCargandoAlertas] = useState(false);


  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAves: 0,
    lotesActivos: 0,
    alertasInventario: 0,
    galponesActivos: 0,
    predicciones: 0,
    alertasPredictivas: 0,
  });
  const [predicciones, setPredicciones] = useState([]);

  const cargarAlertasSanitarias = async () => {
  try {
    setCargandoAlertas(true);

    /*
      Pedimos solo alertas sanitarias pendientes.
      Estas son las que el administrador debe revisar.
    */
    const respuesta = await api.get("/sanitario/alertas/", {
      params: {
        estado: "Pendiente",
      },
    });

    /*
      Si el backend devuelve una lista, la guardamos.
      Si no devuelve lista, dejamos arreglo vacío.
    */
    setAlertasSanitarias(
      Array.isArray(respuesta.data) ? respuesta.data : []
    );
  } catch (error) {
    console.error("Error cargando alertas sanitarias:", error);
  } finally {
    setCargandoAlertas(false);
  }
};

  useEffect(() => {
  /*
    Carga las estadísticas normales del Dashboard.
  */
  fetchStats();

  /*
    Carga las alertas sanitarias pendientes apenas entra al Dashboard.
  */
  cargarAlertasSanitarias();

  /*
    Cada 5 segundos vuelve a revisar si hay nuevas alertas sanitarias.
    Esto hace que la alerta aparezca casi inmediatamente en el Dashboard.
  */
  const intervaloAlertas = setInterval(() => {
    cargarAlertasSanitarias();
  }, 5000);

  /*
    Cuando el usuario sale del Dashboard,
    se limpia el intervalo para evitar consumo innecesario.
  */
  return () => clearInterval(intervaloAlertas);
}, []);





  const fetchStats = async () => {
    setLoading(true);
    try {
      const [lotRes, galRes, insRes, predRes] = await Promise.all([
        api.get("/lotes/"),
        api.get("/galpones/"),
        api.get("/insumos/catalogo/"),
        api.get("/temperatura/prediccion/ultimas/"),
      ]);

      const lotes = Array.isArray(lotRes.data) ? lotRes.data : [];
      const activos = lotes.filter(l => ["crianza", "crecimiento", "engorde", "activo"].includes(l.estado.toLowerCase()));
      const aves = activos.reduce((acc, l) => acc + (Number(l.cantidad_actual) || 0), 0);
      
      const insumos = Array.isArray(insRes.data) ? insRes.data : [];
      const alertas = insumos.filter(i => Number(i.stock_actual) <= Number(i.stock_minimo)).length;

      const preds = Array.isArray(predRes.data) ? predRes.data : [];
      const alertasPred = preds.filter(p => p.umbral_superado).length;

      setPredicciones(preds);
      setStats({
        totalAves: aves,
        lotesActivos: activos.length,
        alertasInventario: alertas,
        galponesActivos: (galRes.data || []).filter(g => g.estado === 'activo').length,
        predicciones: preds.length,
        alertasPredictivas: alertasPred,
      });
    } catch (e) {
      console.error("Error al cargar estadísticas", e);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      label: "Población Total",
      value: loading ? "—" : stats.totalAves.toLocaleString(),
      trend: "Aves",
      trendType: "trend-up",
      icon: <Bird size={24} color="#f59e0b" />,
      iconBg: "#fef3c7",
    },
    {
      label: "Lotes Activos",
      value: loading ? "—" : stats.lotesActivos,
      trend: "En curso",
      trendType: "trend-up",
      icon: <Zap size={24} color="#3b82f6" />,
      iconBg: "#dbeafe",
    },
    {
      label: "Alertas Inventario",
      value: loading ? "—" : stats.alertasInventario,
      trend: stats.alertasInventario > 0 ? "Bajo Stock" : "OK",
      trendType: stats.alertasInventario > 0 ? "trend-down" : "trend-up",
      icon: <Package size={24} color="#d97706" />,
      iconBg: "#fef3c7",
    },
    {
      label: "Galpones en Uso",
      value: loading ? "—" : stats.galponesActivos,
      trend: "Activos",
      trendType: "trend-up",
      icon: <Bird size={24} color="#16a34a" />,
      iconBg: "#dcfce7",
    },
    {
      label: "Predicciones IA",
      value: loading ? "—" : stats.predicciones,
      trend: stats.alertasPredictivas > 0 ? `${stats.alertasPredictivas} alertas` : "Sin novedades",
      trendType: stats.alertasPredictivas > 0 ? "trend-down" : "trend-up",
      icon: <Brain size={24} color="#7c3aed" />,
      iconBg: "#f3e8ff",
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        showMobileTrigger={false}
      />

      <main
        style={{
          marginLeft: isMobile ? "0" : sidebarOpen ? "240px" : "70px",
          flex: 1,
          padding: isMobile ? "20px" : "32px",
          paddingTop: isMobile ? "80px" : "32px",
          transition: "margin-left 0.3s ease",
          display: "flex",
          flexDirection: "column",
          gap: "24px"
        }}
      >
        <Topbar titulo="Resumen de la Granja" subtitulo="Vista general de producción" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        {alertasSanitarias.length > 0 && (
  <div
    style={{
      background: "white",
      borderRadius: "24px",
      padding: "24px",
      marginBottom: "24px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
      border: "1px solid #fed7aa",
      borderLeft: "6px solid #f97316",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "16px",
        marginBottom: "18px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "16px",
            background: "#ffedd5",
            color: "#ea580c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ShieldAlert size={26} />
        </div>

        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: "800",
              color: "#111827",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertTriangle size={20} color="#f97316" />
            Alerta sanitaria activa
          </h2>

          <p
            style={{
              margin: "6px 0 0",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            El sistema detectó riesgo sanitario en uno o más lotes.
          </p>
        </div>
      </div>

      <span
        style={{
          background: "#fee2e2",
          color: "#dc2626",
          padding: "7px 13px",
          borderRadius: "999px",
          fontSize: "13px",
          fontWeight: "800",
          whiteSpace: "nowrap",
        }}
      >
        {alertasSanitarias.length} pendiente
        {alertasSanitarias.length > 1 ? "s" : ""}
      </span>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "14px",
      }}
    >
      {alertasSanitarias.slice(0, 3).map((alerta) => (
        <div
          key={alerta.id}
          style={{
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            borderRadius: "16px",
            padding: "14px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "10px",
              marginBottom: "10px",
            }}
          >
            <strong
              style={{
                color: "#111827",
                fontSize: "14px",
                lineHeight: "1.3",
              }}
            >
              {alerta.titulo}
            </strong>

            <span
              style={{
                background: "#ffedd5",
                color: "#c2410c",
                padding: "4px 8px",
                borderRadius: "999px",
                fontSize: "11px",
                fontWeight: "800",
                whiteSpace: "nowrap",
              }}
            >
              {alerta.nivel}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "5px",
              color: "#475569",
              fontSize: "13px",
            }}
          >
            <span>
              <strong style={{ color: "#334155" }}>Lote:</strong>{" "}
              {alerta.lote_codigo || "Sin lote"}
            </span>

            <span>
              <strong style={{ color: "#334155" }}>Galpón:</strong>{" "}
              {alerta.galpon_nombre || "No especificado"}
            </span>

            <span>
              <strong style={{ color: "#334155" }}>Causa:</strong>{" "}
              {alerta.causa || "No especificada"}
            </span>

            {alerta.porcentaje_afectado && (
              <span>
                <strong style={{ color: "#334155" }}>% afectado:</strong>{" "}
                {alerta.porcentaje_afectado}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>

    {alertasSanitarias.length > 3 && (
      <p
        style={{
          margin: "14px 0 0",
          color: "#92400e",
          fontSize: "14px",
          fontWeight: "700",
        }}
      >
        Hay más alertas sanitarias pendientes por revisar.
      </p>
    )}

    <button
      type="button"
      onClick={() => navigate("/sanitario/alertas")}
      style={{
        marginTop: "18px",
        background: "#f97316",
        color: "white",
        border: "none",
        borderRadius: "12px",
        padding: "11px 16px",
        fontWeight: "800",
        cursor: "pointer",
      }}
    >
      Ver alertas sanitarias
    </button>
  </div>
)}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px",
          }}
        >
          {cards.map((card, i) => (
            <StatCard key={i} {...card} />
          ))}
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "24px",
            padding: "28px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            border: "1px solid #f1f5f9",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "700",
              color: "#334155",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <AlertCircle size={18} color="#ef4444" /> Centro de Notificaciones
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {stats.alertasInventario > 0 ? (
              <AlertItem 
                type="danger" 
                title="Atención: Insumos Críticos" 
                desc={`Hay ${stats.alertasInventario} productos con stock por debajo del mínimo.`} 
                icon={<Package size={18} color="#dc2626" />}
              />
            ) : (
              <AlertItem 
                type="info" 
                title="Inventario Saludable" 
                desc="Todos los insumos tienen stock suficiente." 
                icon={<Package size={18} color="#16a34a" />}
              />
            )}
            
            <AlertItem 
              type="info" 
              title="Monitoreo Activo" 
              desc={`Actualmente gestionando ${stats.lotesActivos} lotes en producción.`} 
              icon={<Bird size={18} color="#3b82f6" />}
            />

            {stats.alertasPredictivas > 0 ? (
              <AlertItem 
                type="danger" 
                title="Alerta Predictiva de Temperatura" 
                desc={`${stats.alertasPredictivas} predicción(es) superan el umbral crítico. Revise la sección Predicción IA.`} 
                icon={<Brain size={18} color="#dc2626" />}
              />
            ) : stats.predicciones > 0 ? (
              <AlertItem 
                type="info" 
                title="Predicción IA Activa" 
                desc={`${stats.predicciones} predicción(es) generadas. Sin alertas críticas.`} 
                icon={<TrendingUp size={18} color="#7c3aed" />}
              />
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;





