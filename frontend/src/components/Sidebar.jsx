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
  Shield,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";


const navItems = [
  {
    icon: <LayoutDashboard size={20} />,
    label: "Dashboard",
    path: "/dashboard",
  },
  { icon: <Bird size={20} />, label: "Galpones", path: "/galpones" },
  { icon: <Package size={20} />, label: "Lotes", path: "/lotes" },
  { icon: <Wheat size={20} />, label: "Alimentación", path: "/alimentacion" },
  { icon: <Thermometer size={20} />, label: "Temperatura", path: "/temperatura" },
  { icon: <Users size={20} />, label: "Usuarios", path: "/usuarios" }, // NUEVO
  { icon: <ShieldCheck size={20} />, label: "Permisos", path: "/permisos" }, // NUEVO
  { icon: <ShieldCheck size={20} />, label: "Roles", path: "/roles" },
  { icon: <ClipboardList size={20} />, label: "Bitácora", path: "/bitacora" }, // NUEVO
  { icon: <Thermometer size={20} />, label: "Estado", path: "/estado" },
];

function Sidebar({ open, setOpen, showMobileTrigger = true }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(max-width: 900px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }

    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);

  // Al entrar a móvil, cerramos para no estorbar.
  useEffect(() => {
    if (isMobile && open) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  const sidebarWidth = isMobile ? "240px" : open ? "240px" : "70px";
  const sidebarTransform = isMobile
    ? open
      ? "translateX(0)"
      : "translateX(-100%)"
    : "translateX(0)";

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) setOpen(false);
  };

  return (
    <>
      {isMobile && open && (
        <div
          style={backdropStyle}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {isMobile && !open && showMobileTrigger && (
        <button
          onClick={() => setOpen(true)}
          style={mobileOpenBtnStyle}
          aria-label="Abrir menú"
          type="button"
        >
          <Menu size={20} color="#78350f" />
        </button>
      )}

      <aside
        style={{
          ...sidebarStyle,
          width: sidebarWidth,
          transform: sidebarTransform,
          transition: isMobile ? "transform 0.25s ease" : "width 0.3s ease",
          boxShadow: isMobile && open ? "0 8px 24px rgba(0,0,0,0.18)" : "none",
        }}
      >
        <div style={logoStyle}>
          {open && <img src="/logo.png" alt="logo" style={imgStyle} />}
          {open && <span style={logoTextStyle}>AviGranja</span>}
          <button
            onClick={() => setOpen(isMobile ? false : !open)}
            style={{ ...toggleStyle, marginLeft: open ? "auto" : "0" }}
            type="button"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
          >
            {open ? (
              <ChevronLeft size={18} color="#fef3c7" />
            ) : (
              <img
                src="/logo.png"
                alt=""
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #fbbf24",
                }}
              />
            )}
          </button>
        </div>

        <nav style={navStyle}>
          {navItems.map((item, i) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={i}
                title={item.label}
                onClick={() => handleNavigate(item.path)}
                style={{
                  ...navItemStyle,
                  justifyContent: open ? "flex-start" : "center",
                  ...(isActive ? activeStyle : {}),
                }}
                type="button"
              >
                <span style={iconStyle}>{item.icon}</span>
                {open && (
                  <span style={{ fontSize: "14px", whiteSpace: "nowrap" }}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div style={footerStyle}>
          <button
            title="Cerrar Sesión"
            style={{
              ...logoutStyle,
              justifyContent: open ? "flex-start" : "center",
            }}
            onClick={() => handleNavigate("/")}
            type="button"
          >
            <span style={iconStyle}>
              <LogOut size={20} />
            </span>
            {open && (
              <span style={{ fontSize: "14px", whiteSpace: "nowrap" }}>
                Cerrar Sesión
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

const sidebarStyle = {
  background: "linear-gradient(180deg, #78350f 0%, #92400e 100%)",
  display: "flex",
  flexDirection: "column",
  position: "fixed",
  top: 0,
  left: 0,
  height: "100vh",
  zIndex: 100,
  transition: "width 0.3s ease",
  overflow: "hidden",
};

const backdropStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
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
  display: "flex",
  alignItems: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};
const logoStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "16px 14px",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
  minHeight: "70px",
};
const imgStyle = {
  width: "38px",
  height: "38px",
  borderRadius: "50%",
  objectFit: "cover",
  border: "2px solid #fbbf24",
  flexShrink: 0,
};
const logoTextStyle = {
  fontSize: "17px",
  fontWeight: "700",
  color: "#fef3c7",
  flex: 1,
  whiteSpace: "nowrap",
};
const toggleStyle = {
  background: "rgba(255,255,255,0.15)",
  border: "none",
  borderRadius: "8px",
  padding: "6px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  flexShrink: 0,
};
const navStyle = {
  display: "flex",
  flexDirection: "column",
  padding: "16px 10px",
  gap: "4px",
  flex: 1,
};
const navItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px 14px",
  borderRadius: "12px",
  color: "rgba(255,255,255,0.75)",
  cursor: "pointer",
  border: "none",
  background: "transparent",
  width: "100%",
  fontFamily: "'Poppins', sans-serif",
  transition: "all 0.2s",
};
const activeStyle = { background: "#f59e0b", color: "white" };
const iconStyle = { display: "flex", alignItems: "center", flexShrink: 0 };
const footerStyle = {
  padding: "16px 10px",
  borderTop: "1px solid rgba(255,255,255,0.1)",
};
const logoutStyle = { ...navItemStyle, color: "rgba(255,255,255,0.75)" };

export default Sidebar;
