import { useState, useEffect } from "react";
import { Save, Shield, ShieldCheck, Plus } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Modal from "../../components/Modal";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import api from "../../api/axios";
import useIsMobile from "../../hooks/useIsMobile";

function Permisos() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [permisosDelRol, setPermisosDelRol] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nombre: "", descripcion: "" });
  const [formError, setFormError] = useState("");
  const [savingForm, setSavingForm] = useState(false);

  useEffect(() => {
    fetchRoles();
    fetchPermisos();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await api.get("/usuarios/roles/");
      setRoles(res.data);
    } catch {
      console.error("Error roles");
    }
  };

  const fetchPermisos = async () => {
    try {
      const res = await api.get("/permisos/");
      setPermisos(res.data);
    } catch {
      console.error("Error permisos");
    }
  };

  const handleSeleccionarRol = async (rol) => {
    setRolSeleccionado(rol);
    setMensaje("");
    try {
      const res = await api.get(`/permisos/roles/${rol.id_rol}/permisos/`);
      setPermisosDelRol(res.data);
      setSeleccionados(res.data.map((p) => p.id_permiso));
    } catch {
      console.error("Error al cargar permisos del rol");
    }
  };

  const togglePermiso = (id_permiso) => {
    setSeleccionados((prev) =>
      prev.includes(id_permiso)
        ? prev.filter((id) => id !== id_permiso)
        : [...prev, id_permiso],
    );
  };

  const handleGuardar = async () => {
    if (!rolSeleccionado) return;
    setSaving(true);
    setMensaje("");
    try {
      await api.put(`/permisos/roles/${rolSeleccionado.id_rol}/permisos/`, {
        permisos: seleccionados,
      });
      setMensaje("Permisos guardados correctamente");
    } catch {
      setMensaje("Error al guardar permisos");
    } finally {
      setSaving(false);
    }
  };

  const handleCrearPermiso = async (e) => {
    e.preventDefault();
    setSavingForm(true);
    setFormError("");
    try {
      await api.post("/permisos/", form);
      setShowModal(false);
      setForm({ nombre: "", descripcion: "" });
      fetchPermisos();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Error al crear permiso");
    } finally {
      setSavingForm(false);
    }
  };

  return (
    <div style={layoutStyle}>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <main
        style={{
          ...mainStyle,
          marginLeft: isMobile ? "0" : sidebarOpen ? "240px" : "70px",
          paddingLeft: isMobile && !sidebarOpen ? "64px" : undefined,
        }}
      >
        <div style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Gestión de Permisos</h1>
            <p style={subtitleStyle}>Asigna permisos a cada rol del sistema</p>
          </div>
          <button onClick={() => setShowModal(true)} style={btnAgregarStyle}>
            <Plus size={18} style={{ marginRight: "8px" }} /> Nuevo Permiso
          </button>
        </div>

        <div style={contentStyle}>
          <div style={rolesPanel}>
            <h3 style={panelTitleStyle}>Roles</h3>
            {roles.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: "13px" }}>
                No hay roles.
              </p>
            ) : (
              roles.map((r) => (
                <button
                  key={r.id_rol}
                  onClick={() => handleSeleccionarRol(r)}
                  style={{
                    ...rolBtnStyle,
                    ...(rolSeleccionado?.id_rol === r.id_rol
                      ? rolActivoStyle
                      : {}),
                  }}
                >
                  <Shield
                    size={16}
                    style={{ marginRight: "10px", flexShrink: 0 }}
                  />
                  {r.nombre}
                </button>
              ))
            )}
          </div>

          <div style={permisosPanel}>
            {!rolSeleccionado ? (
              <div style={emptyStyle}>
                <ShieldCheck size={48} color="#e5e7eb" />
                <p style={{ color: "#9ca3af", marginTop: "16px" }}>
                  Selecciona un rol para ver sus permisos
                </p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "24px",
                  }}
                >
                  <h3 style={panelTitleStyle}>
                    Permisos — {rolSeleccionado.nombre}
                  </h3>
                  <button
                    onClick={handleGuardar}
                    disabled={saving}
                    style={btnGuardarStyle}
                  >
                    <Save size={16} style={{ marginRight: "8px" }} />
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>

                {mensaje && (
                  <p
                    style={{
                      color: mensaje.includes("Error") ? "#dc2626" : "#16a34a",
                      fontSize: "13px",
                      marginBottom: "16px",
                    }}
                  >
                    {mensaje}
                  </p>
                )}

                {permisos.length === 0 ? (
                  <p style={{ color: "#9ca3af" }}>
                    No hay permisos registrados. Crea uno con el botón "Nuevo
                    Permiso".
                  </p>
                ) : (
                  <div style={permisosGridStyle}>
                    {permisos.map((p) => (
                      <div
                        key={p.id_permiso}
                        onClick={() => togglePermiso(p.id_permiso)}
                        style={{
                          ...permisoCardStyle,
                          ...(seleccionados.includes(p.id_permiso)
                            ? permisoActivoStyle
                            : {}),
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              ...checkboxStyle,
                              ...(seleccionados.includes(p.id_permiso)
                                ? checkboxActivoStyle
                                : {}),
                            }}
                          >
                            {seleccionados.includes(p.id_permiso) && "✓"}
                          </div>
                          <div>
                            <p style={permisoNombreStyle}>{p.nombre}</p>
                            <p style={permisoDescStyle}>
                              {p.descripcion || "Sin descripción"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <Modal titulo="Nuevo Permiso" onClose={() => setShowModal(false)}>
          <form
            onSubmit={handleCrearPermiso}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <InputField
              name="nombre"
              placeholder="Nombre del permiso"
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              value={form.nombre}
            />
            <InputField
              name="descripcion"
              placeholder="Descripción (opcional)"
              onChange={(e) =>
                setForm({ ...form, descripcion: e.target.value })
              }
              value={form.descripcion}
            />
            {formError && (
              <p style={{ color: "#dc2626", fontSize: "12px", margin: 0 }}>
                ⚠️ {formError}
              </p>
            )}
            <Button
              text="Crear Permiso"
              loadingText="Guardando..."
              loading={savingForm}
              icon={<Plus size={18} />}
            />
          </form>
        </Modal>
      )}
    </div>
  );
}

const layoutStyle = {
  display: "flex",
  minHeight: "100vh",
  background: "#f9fafb",
  fontFamily: "'Poppins', sans-serif",
};
const mainStyle = {
  flex: 1,
  padding: "40px",
  transition: "margin-left 0.3s ease",
};
const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "32px",
};
const titleStyle = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#1c1c1c",
  margin: 0,
};
const subtitleStyle = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "4px 0 0 0",
};
const btnAgregarStyle = {
  background: "#f59e0b",
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "10px 20px",
  fontWeight: "600",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  boxShadow: "0 4px 12px rgba(245,158,11,0.2)",
  fontFamily: "'Poppins', sans-serif",
};
const contentStyle = { display: "flex", gap: "24px" };
const rolesPanel = {
  width: "240px",
  flexShrink: 0,
  background: "white",
  borderRadius: "20px",
  padding: "24px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
  height: "fit-content",
};
const permisosPanel = {
  flex: 1,
  background: "white",
  borderRadius: "20px",
  padding: "24px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
  minHeight: "400px",
};
const panelTitleStyle = {
  fontSize: "15px",
  fontWeight: "700",
  color: "#1c1c1c",
  margin: "0 0 16px 0",
};
const rolBtnStyle = {
  display: "flex",
  alignItems: "center",
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "#4b5563",
  fontSize: "14px",
  fontFamily: "'Poppins', sans-serif",
  marginBottom: "4px",
  transition: "all 0.2s",
};
const rolActivoStyle = {
  background: "#fef3c7",
  color: "#92400e",
  fontWeight: "600",
};
const emptyStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "300px",
};
const btnGuardarStyle = {
  background: "linear-gradient(135deg, #f59e0b, #d97706)",
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "10px 20px",
  fontWeight: "600",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  fontFamily: "'Poppins', sans-serif",
};
const permisosGridStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};
const permisoCardStyle = {
  display: "flex",
  alignItems: "center",
  padding: "16px",
  borderRadius: "12px",
  border: "1.5px solid #e5e7eb",
  cursor: "pointer",
  transition: "all 0.2s",
};
const permisoActivoStyle = {
  border: "1.5px solid #f59e0b",
  background: "#fffbeb",
};
const checkboxStyle = {
  width: "22px",
  height: "22px",
  borderRadius: "6px",
  border: "2px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
  fontWeight: "700",
  flexShrink: 0,
  transition: "all 0.2s",
};
const checkboxActivoStyle = {
  background: "#f59e0b",
  border: "2px solid #f59e0b",
  color: "white",
};
const permisoNombreStyle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#1c1c1c",
  margin: 0,
};
const permisoDescStyle = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: "2px 0 0 0",
};

export default Permisos;
