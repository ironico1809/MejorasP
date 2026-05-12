import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  Eye,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Modal from "../../components/Modal";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import api from "../../api/axios";
import useIsMobile from "../../hooks/useIsMobile";

function Roles() {
  const [showVerModal, setShowVerModal] = useState(false);
  const [permisosDelRol, setPermisosDelRol] = useState([]);
  const [loadingPermisos, setLoadingPermisos] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [form, setForm] = useState({ nombre: "", descripcion: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await api.get("/usuarios/roles/");
      setRoles(res.data);
    } catch {
      console.error("Error al cargar roles");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError("");
  };

  const resetForm = () => {
    setForm({ nombre: "", descripcion: "" });
    setFormError("");
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/usuarios/roles/", form);
      setShowModal(false);
      resetForm();
      fetchRoles();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Error al crear el rol");
    } finally {
      setSaving(false);
    }
  };

  const handleEditarClick = (r) => {
    setRolSeleccionado(r);
    setForm({ nombre: r.nombre, descripcion: r.descripcion || "" });
    setShowEditModal(true);
  };

  const handleEditar = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/usuarios/roles/${rolSeleccionado.id_rol}/`, form);
      setShowEditModal(false);
      fetchRoles();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Error al editar el rol");
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    setSaving(true);
    try {
      await api.delete(`/usuarios/roles/${rolSeleccionado.id_rol}/`);
      setShowDeleteModal(false);
      fetchRoles();
    } finally {
      setSaving(false);
    }
  };

  const handleVerPermisos = async (r) => {
    setRolSeleccionado(r);
    setShowVerModal(true);
    setLoadingPermisos(true);
    try {
      const res = await api.get(`/permisos/roles/${r.id_rol}/permisos/`);
      setPermisosDelRol(res.data);
    } catch {
      setPermisosDelRol([]);
    } finally {
      setLoadingPermisos(false);
    }
  };

  const rolesFiltrados = roles.filter(
    (r) =>
      r.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      (r.descripcion || "").toLowerCase().includes(filtro.toLowerCase()),
  );

  const formFields = (
    <form
      onSubmit={showEditModal ? handleEditar : handleCrear}
      style={{ display: "flex", flexDirection: "column", gap: "14px" }}
    >
      <InputField
        name="nombre"
        placeholder="Nombre del rol"
        onChange={handleChange}
        value={form.nombre}
      />
      <InputField
        name="descripcion"
        placeholder="Descripción (opcional)"
        onChange={handleChange}
        value={form.descripcion}
      />
      {formError && (
        <p style={{ color: "#dc2626", fontSize: "12px", margin: 0 }}>
          ⚠️ {formError}
        </p>
      )}
      <Button
        text={showEditModal ? "Guardar Cambios" : "Crear Rol"}
        loadingText="Guardando..."
        loading={saving}
        icon={<Shield size={18} />}
      />
    </form>
  );

  return (
    <div style={layoutStyle}>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <main
        style={{
          ...mainContentStyle,
          marginLeft: isMobile ? "0" : sidebarOpen ? "240px" : "70px",
          paddingLeft: isMobile && !sidebarOpen ? "64px" : undefined,
        }}
      >
        <div style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Gestión de Roles</h1>
            <p style={subtitleStyle}>Administrar los roles del sistema</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            style={btnAgregarStyle}
          >
            <Plus size={18} style={{ marginRight: "8px" }} /> Nuevo Rol
          </button>
        </div>

        <div style={containerStyle}>
          <div style={searchWrapperStyle}>
            <Search size={18} color="#9ca3af" />
            <input
              type="text"
              placeholder="Buscar rol..."
              style={searchInputStyle}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>

          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={theadRowStyle}>
                  <th style={thStyle}>Nombre</th>
                  <th style={thStyle}>Descripción</th>
                  <th style={thStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={3}
                      style={{ padding: "24px", color: "#9ca3af" }}
                    >
                      Cargando...
                    </td>
                  </tr>
                ) : rolesFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      style={{ padding: "24px", color: "#9ca3af" }}
                    >
                      No hay roles registrados.
                    </td>
                  </tr>
                ) : (
                  rolesFiltrados.map((r) => (
                    <tr key={r.id_rol} style={trStyle}>
                      <td style={tdStyle}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <div style={iconWrapperStyle}>
                            <Shield size={16} color="#f59e0b" />
                          </div>
                          <strong>{r.nombre}</strong>
                        </div>
                      </td>
                      <td style={tdGrayStyle}>
                        {r.descripcion || "Sin descripción"}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleVerPermisos(r)}
                            style={actionBtnStyle("#2563eb")}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditarClick(r)}
                            style={actionBtnStyle("#f59e0b")}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setRolSeleccionado(r);
                              setShowDeleteModal(true);
                            }}
                            style={actionBtnStyle("#dc2626")}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={tableFooterStyle}>
            <span style={footerTextStyle}>
              Mostrando {rolesFiltrados.length} roles
            </span>
            <div style={paginationStyle}>
              <button style={pageBtnStyle}>
                <ChevronLeft size={16} /> Anterior
              </button>
              <button style={activePageBtnStyle}>1</button>
              <button style={pageBtnStyle}>
                Siguiente <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {showModal && (
        <Modal titulo="Nuevo Rol" onClose={() => setShowModal(false)}>
          {formFields}
        </Modal>
      )}
      {showEditModal && (
        <Modal titulo="Editar Rol" onClose={() => setShowEditModal(false)}>
          {formFields}
        </Modal>
      )}
      {showVerModal && rolSeleccionado && (
        <Modal
          titulo={`Permisos — ${rolSeleccionado.nombre}`}
          onClose={() => setShowVerModal(false)}
        >
          {loadingPermisos ? (
            <p style={{ color: "#9ca3af" }}>Cargando permisos...</p>
          ) : permisosDelRol.length === 0 ? (
            <p style={{ color: "#9ca3af" }}>
              Este rol no tiene permisos asignados.
            </p>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {permisosDelRol.map((p) => (
                <div
                  key={p.id_permiso}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
                    borderRadius: "10px",
                    background: "#fffbeb",
                    border: "1.5px solid #f59e0b",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#f59e0b",
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#1c1c1c",
                        margin: 0,
                      }}
                    >
                      {p.nombre}
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#9ca3af",
                        margin: "2px 0 0 0",
                      }}
                    >
                      {p.descripcion || "Sin descripción"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
      {showDeleteModal && (
        <Modal titulo="Eliminar Rol" onClose={() => setShowDeleteModal(false)}>
          <p style={{ color: "#4b5563", marginBottom: "20px" }}>
            ¿Eliminar el rol <strong>{rolSeleccionado?.nombre}</strong>?
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => setShowDeleteModal(false)}
              style={btnCancelarStyle}
            >
              Cancelar
            </button>
            <button
              onClick={handleEliminar}
              style={btnEliminarStyle}
              disabled={saving}
            >
              {saving ? "Eliminando..." : "Sí, eliminar"}
            </button>
          </div>
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
const mainContentStyle = {
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
const containerStyle = {
  background: "white",
  borderRadius: "20px",
  padding: "24px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
};
const searchWrapperStyle = {
  display: "flex",
  alignItems: "center",
  background: "#f9fafb",
  padding: "10px 16px",
  borderRadius: "12px",
  width: "300px",
  marginBottom: "24px",
  border: "1px solid #f3f4f6",
};
const searchInputStyle = {
  border: "none",
  background: "transparent",
  outline: "none",
  marginLeft: "10px",
  fontSize: "14px",
  width: "100%",
};
const tableWrapperStyle = { overflowX: "auto" };
const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "left",
};
const theadRowStyle = { borderBottom: "1px solid #f3f4f6" };
const thStyle = {
  padding: "16px",
  color: "#6b7280",
  fontSize: "14px",
  fontWeight: "500",
};
const trStyle = { borderBottom: "1px solid #f8fafc" };
const tdStyle = { padding: "16px", fontSize: "14px", color: "#1c1c1c" };
const tdGrayStyle = { ...tdStyle, color: "#9ca3af" };
const iconWrapperStyle = {
  width: "32px",
  height: "32px",
  borderRadius: "8px",
  background: "#fef3c7",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};
const actionBtnStyle = (color) => ({
  background: color,
  color: "white",
  border: "none",
  borderRadius: "6px",
  padding: "6px",
  cursor: "pointer",
  display: "flex",
});
const tableFooterStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "24px",
};
const footerTextStyle = { fontSize: "13px", color: "#6b7280" };
const paginationStyle = { display: "flex", gap: "8px" };
const pageBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  padding: "8px 12px",
  borderRadius: "8px",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "#6b7280",
  fontSize: "13px",
};
const activePageBtnStyle = {
  ...pageBtnStyle,
  background: "#fff",
  border: "1px solid #e5e7eb",
  color: "#1c1c1c",
};
const btnCancelarStyle = {
  flex: 1,
  padding: "12px",
  borderRadius: "12px",
  border: "1.5px solid #e5e7eb",
  background: "transparent",
  cursor: "pointer",
  color: "#6b7280",
  fontWeight: "600",
  fontFamily: "'Poppins', sans-serif",
};
const btnEliminarStyle = {
  flex: 1,
  padding: "12px",
  borderRadius: "12px",
  border: "none",
  background: "#dc2626",
  color: "white",
  cursor: "pointer",
  fontWeight: "600",
  fontFamily: "'Poppins', sans-serif",
};

export default Roles;
