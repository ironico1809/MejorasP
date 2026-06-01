import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage/LandingPage";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Register from "./pages/Register/Register";
import Galpones from "./pages/Galpones/Galpones";
import Usuarios from "./pages/Usuarios/Usuarios";
import Bitacora from "./pages/Bitacora/Bitacora";
import Permisos from "./pages/Permisos/Permisos";
import Roles from "./pages/Roles/Roles";
import Lotes from "./pages/Lotes/Lotes";
import Estado from "./pages/Estado/Estado";
import Alimentacion from "./pages/Alimentacion/Alimentacion";
import Reportes from "./pages/Reportes/Reportes";
import Inventario from "./pages/Inventario/Inventario";

import Insumos from "./pages/Inventario/Insumos/Insumos";
import Proveedores from "./pages/Inventario/Proveedores/Proveedores";
import Movimientos from "./pages/Inventario/Movimientos/Movimientos";
import RegistroEnfermedad from "./pages/Sanitario/Enfermedades/RegistroEnfermedad";
import RegistroSanitario from "./pages/Sanitario/Registro/RegistroSanitario";
import HistorialClinico from "./pages/Sanitario/Historial/HistorialClinico";
import AlertasSanitarias from "./pages/Sanitario/Alertas/AlertasSanitarias";
import Temperatura from "./pages/Temperatura/Temperatura";
import PrediccionTemperatura from "./pages/PrediccionTemperatura/PrediccionTemperatura";
import TemperatureAlert from "./components/TemperatureAlert";
import Mortandad from "./pages/Mortandad/Mortandad";
import ChangePasswordPage from "./pages/ChangePasswordPage/ChangePasswordPage";
import SuccessPage from "./pages/SuccessPage/SuccessPage";
import ProtectedRoute from "./components/ProtectedRoute";
import SuperAdmin from "./pages/SuperAdmin/SuperAdmin";
import MantenimientoPage from "./pages/MantenimientoPage/MantenimientoPage";
import MaintenanceScreen from "./components/MaintenanceScreen";

// ── Intervalo de polling al endpoint público de estado (ms) ──────────────────
const POLLING_INTERVAL_MS = 10_000; // 10 segundos
const API_BASE = import.meta.env.VITE_API_URL
  ? String(import.meta.env.VITE_API_URL).replace(/\/+$/, "")
  : "http://localhost:8000";

/**
 * Determina si el usuario actual es SuperAdmin consultando localStorage.
 * El SuperAdmin NUNCA ve la pantalla de bloqueo.
 */
function usuarioEsSuperAdmin() {
  try {
    const raw = localStorage.getItem("usuario");
    if (!raw) return false;
    const user = JSON.parse(raw);
    return (
      user?.tipo_usuario === "Superusuario" ||
      user?.is_superuser === true
    );
  } catch {
    return false;
  }
}

function App() {
  const [enMantenimiento, setEnMantenimiento] = useState(false);
  const [estadoMnt, setEstadoMnt] = useState({ hasta: null, segundos_restantes: 300 });

  useEffect(() => {
    let mounted = true;

    const verificarEstado = async () => {
      // SuperAdmin nunca ve la pantalla de bloqueo
      if (usuarioEsSuperAdmin()) return;

      try {
        const res = await fetch(`${API_BASE}/mantenimiento/estado/`);
        if (!res.ok) return;
        const data = await res.json();

        if (!mounted) return;

        if (data.en_mantenimiento) {
          setEnMantenimiento(true);
          setEstadoMnt({
            hasta: data.hasta,
            segundos_restantes: data.segundos_restantes ?? 300,
          });
        } else {
          setEnMantenimiento(false);
          setEstadoMnt({ hasta: null, segundos_restantes: 300 });
        }
      } catch {
        // Error de red durante mantenimiento — ignorar silenciosamente
      }
    };

    // Verificación inmediata al cargar
    verificarEstado();

    // Polling cada 10 segundos
    const interval = setInterval(verificarEstado, POLLING_INTERVAL_MS);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // ── Pantalla de bloqueo global ─────────────────────────────────────────────
  if (enMantenimiento && !usuarioEsSuperAdmin()) {
    return (
      <MaintenanceScreen
        hasta={estadoMnt.hasta}
        segundosInit={estadoMnt.segundos_restantes}
      />
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Zona pública: Landing y Auth ────────────────── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pago-exitoso" element={<SuccessPage />} />

        {/* ── Cambio de contraseña obligatorio (requiere token) ── */}
        <Route path="/cambio-password" element={<ChangePasswordPage />} />

        {/* ── Zona privada: Sistema de gestión avícola ────── */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/galpones" element={<ProtectedRoute><Galpones /></ProtectedRoute>} />
        <Route path="/lotes" element={<ProtectedRoute><Lotes /></ProtectedRoute>} />
        <Route path="/alimentacion" element={<ProtectedRoute><Alimentacion /></ProtectedRoute>} />
        <Route path="/inventario" element={<ProtectedRoute><Inventario /></ProtectedRoute>} />
        <Route path="/inventario/insumos" element={<ProtectedRoute><Insumos /></ProtectedRoute>} />
        <Route path="/inventario/proveedores" element={<ProtectedRoute><Proveedores /></ProtectedRoute>} />
        <Route path="/inventario/movimientos" element={<ProtectedRoute><Movimientos /></ProtectedRoute>} />

        <Route path="/sanitario/registro" element={<ProtectedRoute><RegistroSanitario /></ProtectedRoute>} />
        <Route path="/sanitario/historial" element={<ProtectedRoute><HistorialClinico /></ProtectedRoute>} />
        <Route path="/sanitario/enfermedades" element={<ProtectedRoute><RegistroEnfermedad /></ProtectedRoute>} />
        <Route path="/sanitario/alertas" element={<ProtectedRoute><AlertasSanitarias /></ProtectedRoute>} />
        <Route path="/reportes" element={<ProtectedRoute><Reportes /></ProtectedRoute>} />
        <Route path="/mortandad" element={<ProtectedRoute><Mortandad /></ProtectedRoute>} />
        <Route path="/estado" element={<ProtectedRoute><Estado /></ProtectedRoute>} />
        <Route path="/usuarios" element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
        <Route path="/bitacora" element={<ProtectedRoute><Bitacora /></ProtectedRoute>} />
        <Route path="/permisos" element={<ProtectedRoute><Permisos /></ProtectedRoute>} />
        <Route path="/roles" element={<ProtectedRoute><Roles /></ProtectedRoute>} />
        <Route path="/temperatura" element={<ProtectedRoute><Temperatura /></ProtectedRoute>} />
        <Route path="/prediccion" element={<ProtectedRoute><PrediccionTemperatura /></ProtectedRoute>} />

        {/* ── Zona SuperAdmin ──────────────────────────────── */}
        <Route path="/superadmin" element={<ProtectedRoute><SuperAdmin /></ProtectedRoute>} />
        <Route path="/mantenimiento" element={<ProtectedRoute><MantenimientoPage /></ProtectedRoute>} />
      </Routes>
      <TemperatureAlert />
    </BrowserRouter>
  );
}

export default App;
