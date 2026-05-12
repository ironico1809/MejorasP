import { useState } from "react";
import { Bird, Skull, Package, Thermometer } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import StatCard from "../../components/StatCard";
import AlertItem from "../../components/AlertItem";
import useIsMobile from "../../hooks/useIsMobile";

const cards = [
  {
    label: "Total de Pollos",
    value: "4,280",
    trend: "+120 hoy",
    trendType: "trend-up",
    icon: <Bird size={24} color="#f59e0b" />,
    iconBg: "#fef3c7",
  },
  {
    label: "Mortalidad del Día",
    value: "12",
    trend: "+3 vs ayer",
    trendType: "trend-down",
    icon: <Skull size={24} color="#dc2626" />,
    iconBg: "#fee2e2",
  },
  {
    label: "Stock de Alimento",
    value: "850 kg",
    trend: "Bajo stock",
    trendType: "trend-warn",
    icon: <Package size={24} color="#d97706" />,
    iconBg: "#fef3c7",
  },
  {
    label: "Temperatura Galpón",
    value: "28°C",
    trend: "Normal",
    trendType: "trend-up",
    icon: <Thermometer size={24} color="#2563eb" />,
    iconBg: "#dbeafe",
  },
];

const alerts = [
  {
    type: "warn",
    icon: <Package size={20} color="#d97706" />,
    title: "Stock de alimento bajo",
    desc: "Quedan menos de 1000 kg en inventario",
  },
  {
    type: "danger",
    icon: <Thermometer size={20} color="#dc2626" />,
    title: "Temperatura crítica en Galpón 3",
    desc: "Se detectaron 35°C, revisar ventilación",
  },
  {
    type: "info",
    icon: <Bird size={20} color="#2563eb" />,
    title: "Lote #5 listo para comercialización",
    desc: "800 pollos alcanzaron el peso ideal",
  },
];

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f9fafb",
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
          padding: "32px",
          transition: "margin-left 0.3s ease",
        }}
      >
        <Topbar
          titulo="Dashboard"
          subtitulo="Resumen general de la granja"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            marginBottom: "32px",
          }}
        >
          {cards.map((card, i) => (
            <StatCard key={i} {...card} />
          ))}
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "700",
              color: "#1c1c1c",
              marginBottom: "16px",
            }}
          >
            Alertas Recientes
          </h2>
          {alerts.map((alert, i) => (
            <AlertItem key={i} {...alert} />
          ))}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
