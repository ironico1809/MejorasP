import {
  LayoutDashboard,
  Bird,
  Package,
  Thermometer,
  Wheat,
  LogOut,
  ChevronLeft,
  Menu,
  Users,
  ShieldCheck,
  ClipboardList,
  BarChart3,
  Truck,
  History,
  Stethoscope,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Globe,
  CreditCard,
  Database,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUsuario } from "../hooks/useUsuario";

// ─── Menús por rol ────────────────────────────────────────────────────────────

const MENU_SUPERADMIN = [
  {
    type: "single",
    icon: <Globe size={20} />,
    label: "Panel Global",
    path: "/superadmin",
  },
  {
    type: "single",
    icon: <Database size={20} />,
    label: "Mantenimiento Técnico",
    path: "/mantenimiento",
  },
];

const MENU_ADMIN_OPERADOR = [
  {
    type: "single",
    icon: <LayoutDashboard size={20} />,
    label: "Dashboard",
    path: "/dashboard",
  },
  {
    type: "group",
    label: "Gestión de Producción",
    icon: <Bird size={20} />,
    items: [
      { icon: <Bird size={18} />, label: "Galpones", path: "/galpones" },
      { icon: <Package size={18} />, label: "Lotes", path: "/lotes" },
      { icon: <AlertTriangle size={18} />, label: "Mortandad", path: "/mortandad" },
      { icon: <Stethoscope size={18} />, label: "Registro Sanitario", path: "/sanitario/registro" },
      { icon: <ClipboardList size={18} />, label: "Historial Clínico", path: "/sanitario/historial" },
      { icon: <AlertTriangle size={18} />, label: "Alertas Sanitarias", path: "/sanitario/alertas" },
    ],
  },
  {
    type: "group",
    label: "Control Operativo",
    icon: <Thermometer size={20} />,
    items: [
      { icon: <Wheat size={18} />, label: "Alimentación", path: "/alimentacion" },
      { icon: <Thermometer size={18} />, label: "Temperatura", path: "/temperatura" },
      { icon: <BarChart3 size={18} />, label: "Predicción IA", path: "/prediccion" },
      { icon: <ClipboardList size={18} />, label: "Estado", path: "/estado" },
    ],
  },
  {
    type: "group",
    label: "Inventario",
    icon: <Package size={20} />,
    items: [
      { icon: <Package size={18} />, label: "Insumos", path: "/inventario/insumos" },
      { icon: <Truck size={18} />, label: "Proveedores", path: "/inventario/proveedores" },
      { icon: <History size={18} />, label: "Movimientos", path: "/inventario/movimientos" },
    ],
  },
  // Solo Admin ve Seguridad y Admin
  {
    type: "group",
    label: "Seguridad y Admin",
    icon: <ShieldCheck size={20} />,
    soloAdmin: true,   // flag para filtrar
    items: [
      { icon: <Users size={18} />, label: "Usuarios", path: "/usuarios" },
      { icon: <ShieldCheck size={18} />, label: "Roles", path: "/roles" },
      { icon: <ShieldCheck size={18} />, label: "Permisos", path: "/permisos" },
      { icon: <History size={18} />, label: "Bitácora", path: "/bitacora" },
    ],
  },
  {
    type: "single",
    icon: <BarChart3 size={20} />,
    label: "Reportes",
    path: "/reportes",
  },
];

// ─── Componente ───────────────────────────────────────────────────────────────

function Sidebar({ open, setOpen, showMobileTrigger = true }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [openGroups, setOpenGroups] = useState({});
  const { esSuperAdmin, esAdmin } = useUsuario();

  // Seleccionar menú según rol
  const menuGroups = esSuperAdmin
    ? MENU_SUPERADMIN
    : MENU_ADMIN_OPERADOR.filter((g) => {
        if (g.soloAdmin && !esAdmin) return false;
        return true;
      });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 900px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (isMobile && open) setOpen(false);
  }, [isMobile]);

  const toggleGroup = (label) => {
    if (!open && !isMobile) {
      setOpen(true);
      setOpenGroups({ [label]: true });
      return;
    }
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) setOpen(false);
  };

  const sidebarWidth = isMobile ? "280px" : open ? "260px" : "70px";

  return (
    <>
      {isMobile && open && (
        <div style={backdropStyle} onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      {isMobile && !open && showMobileTrigger && (
        <button onClick={() => setOpen(true)} style={mobileOpenBtnStyle} type="button">
          <Menu size={20} color="#78350f" />
        </button>
      )}

      <aside
        style={{
          ...sidebarStyle,
          width: sidebarWidth,
          transform: isMobile && !open ? "translateX(-100%)" : "translateX(0)",
        }}
      >
        <div style={logoStyle}>
          {open && <img src="/logo.png" alt="logo" style={imgStyle} />}
          {open && <span style={logoTextStyle}>AviGranja</span>}
          <button onClick={() => setOpen(!open)} style={toggleStyle} type="button">
            {open ? (
              <ChevronLeft size={18} color="#fef3c7" />
            ) : (
              <img src="/logo.png" style={{ width: 24, height: 24 }} alt="" />
            )}
          </button>
        </div>

        <nav style={navStyle}>
          {menuGroups.map((group, i) => {
            if (group.type === "single") {
              const isActive = location.pathname === group.path;
              return (
                <button
                  key={i}
                  onClick={() => handleNavigate(group.path)}
                  style={{
                    ...navItemStyle,
                    justifyContent: open ? "flex-start" : "center",
                    ...(isActive ? activeStyle : {}),
                  }}
                  title={group.label}
                >
                  <span style={iconStyle}>{group.icon}</span>
                  {open && <span style={labelStyle}>{group.label}</span>}
                </button>
              );
            }

            const isGroupOpen = openGroups[group.label];
            const hasActiveChild = group.items.some(
              (item) => location.pathname === item.path
            );

            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  style={{
                    ...navItemStyle,
                    justifyContent: open ? "flex-start" : "center",
                    background:
                      hasActiveChild && !isGroupOpen
                        ? "rgba(255,255,255,0.1)"
                        : "transparent",
                  }}
                  title={group.label}
                >
                  <span style={iconStyle}>{group.icon}</span>
                  {open && (
                    <>
                      <span style={{ ...labelStyle, flex: 1 }}>{group.label}</span>
                      {isGroupOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </>
                  )}
                </button>

                {open && isGroupOpen && (
                  <div style={subGroupStyle}>
                    {group.items.map((item, idx) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleNavigate(item.path)}
                          style={{
                            ...subItemStyle,
                            ...(isActive ? subActiveStyle : {}),
                          }}
                        >
                          <span style={iconStyle}>{item.icon}</span>
                          <span style={{ fontSize: "13px" }}>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div style={footerStyle}>
          <button
            style={{
              ...logoutStyle,
              justifyContent: open ? "flex-start" : "center",
            }}
            onClick={() => {
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
              localStorage.removeItem("usuario");
              handleNavigate("/login");
            }}
            type="button"
          >
            <span style={iconStyle}>
              <LogOut size={20} />
            </span>
            {open && <span style={labelStyle}>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const sidebarStyle = {
  background: "linear-gradient(180deg, #78350f 0%, #92400e 100%)",
  display: "flex",
  flexDirection: "column",
  position: "fixed",
  top: 0,
  left: 0,
  height: "100dvh",
  zIndex: 100,
  transition: "width 0.3s ease, transform 0.3s ease",
  overflow: "hidden",
};

const backdropStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  backdropFilter: "blur(4px)",
  zIndex: 90,
};

const mobileOpenBtnStyle = {
  position: "fixed",
  top: "14px",
  left: "14px",
  zIndex: 110,
  background: "white",
  border: "1.5px solid #e5e7eb",
  borderRadius: "10px",
  padding: "8px",
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
};

const logoStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "16px 14px",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
  minHeight: "70px",
};

const imgStyle = {
  width: "34px",
  height: "34px",
  borderRadius: "50%",
  border: "2px solid #fbbf24",
};

const logoTextStyle = {
  fontSize: "17px",
  fontWeight: "800",
  color: "#fef3c7",
  flex: 1,
};

const toggleStyle = {
  background: "rgba(255,255,255,0.1)",
  border: "none",
  borderRadius: "8px",
  padding: "6px",
  cursor: "pointer",
};

const navStyle = {
  display: "flex",
  flexDirection: "column",
  padding: "12px 8px",
  gap: "4px",
  flex: 1,
  overflowY: "auto",
};

const navItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "10px 12px",
  borderRadius: "10px",
  color: "rgba(255,255,255,0.9)",
  cursor: "pointer",
  border: "none",
  background: "transparent",
  width: "100%",
  fontFamily: "inherit",
  transition: "all 0.2s",
};

const activeStyle = { background: "#f59e0b", color: "white", fontWeight: "600" };

const labelStyle = { fontSize: "14px", whiteSpace: "nowrap", textAlign: "left" };

const iconStyle = { display: "flex", alignItems: "center", flexShrink: 0 };

const subGroupStyle = {
  display: "flex",
  flexDirection: "column",
  paddingLeft: "12px",
  gap: "2px",
  marginTop: "2px",
  marginBottom: "4px",
};

const subItemStyle = {
  ...navItemStyle,
  padding: "8px 12px",
  color: "rgba(255,255,255,0.7)",
  borderRadius: "8px",
};

const subActiveStyle = {
  color: "#fbbf24",
  background: "rgba(255,255,255,0.08)",
  fontWeight: "600",
};

const footerStyle = {
  padding: "12px 8px",
  borderTop: "1px solid rgba(255,255,255,0.1)",
};

const logoutStyle = { ...navItemStyle, color: "rgba(255,255,255,0.6)" };

export default Sidebar;
