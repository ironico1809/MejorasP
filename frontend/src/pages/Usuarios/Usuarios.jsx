import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Modal from "../../components/Modal";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import api from "../../api/axios";
import useIsMobile from "../../hooks/useIsMobile";

import "./Usuarios.css";

function Usuarios() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modales
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [filtro, setFiltro] = useState("");

  const [form, setForm] = useState({
    nom_usuario: "",
    email: "",
    password: "",
    tipo_usuario: "Operario",
    estado: "Activo",
  });

  useEffect(() => {
    fetchUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsuarios = async () => {
    try {
      const res = await api.get("/usuarios/");
      setUsuarios(res.data);
    } catch {
      setError("Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError("");
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Ruta de registro confirmada por tu mapa de Django
      await api.post("/usuarios/registro/", form);
      setShowModal(false);
      resetForm();
      fetchUsuarios();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Error al crear el usuario");
    } finally {
      setSaving(false);
    }
  };

  const handleEditarClick = (u) => {
    setUsuarioSeleccionado(u);
    setForm({
      nom_usuario: u.nom_usuario,
      email: u.email,
      password: "", // Obligatorio llenar por el backend
      tipo_usuario: u.tipo_usuario || "Operario",
      estado: u.estado,
    });
    setShowEditModal(true);
  };

  const handleEditar = async (e) => {
    e.preventDefault();
    if (!form.password) {
      setFormError("El servidor requiere la contraseña para aplicar cambios.");
      return;
    }
    setSaving(true);
    try {
      // Usamos PATCH y la ruta con ID
      await api.patch(`/usuarios/${usuarioSeleccionado.id}/`, form);
      setShowEditModal(false);
      fetchUsuarios();
    } catch (err) {
      setFormError(err.response?.data?.password?.[0] || "Error al editar");
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    setSaving(true);
    try {
      await api.delete(`/usuarios/${usuarioSeleccionado.id}/`);
      setShowDeleteModal(false);
      fetchUsuarios();
    } catch {
      setFormError("Error al eliminar");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      nom_usuario: "",
      email: "",
      password: "",
      tipo_usuario: "Operario",
      estado: "Activo",
    });
    setFormError("");
  };

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nom_usuario.toLowerCase().includes(filtro.toLowerCase()) ||
      u.email.toLowerCase().includes(filtro.toLowerCase()),
  );

  const isActivo = (estado) =>
    String(estado || "")
      .toLowerCase()
      .trim() === "activo";

  const formFields = (
    <form
      onSubmit={showEditModal ? handleEditar : handleCrear}
      className="users-form"
    >
      <InputField
        name="nom_usuario"
        placeholder="Nombre de usuario"
        onChange={handleChange}
        value={form.nom_usuario}
      />
      <InputField
        name="email"
        type="email"
        placeholder="Correo electrónico"
        onChange={handleChange}
        value={form.email}
      />

      <div className="users-securitySection">
        {showEditModal && (
          <p className="users-securityNote">
            Confirmar contraseña actual o ingresar nueva:
          </p>
        )}
        <InputField
          name="password"
          type="password"
          placeholder="Contraseña"
          onChange={handleChange}
          value={form.password}
        />
      </div>

      <div className="users-selectWrap">
        <select
          name="tipo_usuario"
          onChange={handleChange}
          value={form.tipo_usuario}
          className="users-select"
        >
          <option value="Administrador">Administrador</option>
          <option value="Veterinario">Veterinario</option>
          <option value="Operario">Operario</option>
        </select>
      </div>

      <div className="users-selectWrap">
        <select
          name="estado"
          onChange={handleChange}
          value={form.estado}
          className="users-select"
        >
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>
      </div>

      {formError && <p className="users-dangerText">⚠️ {formError}</p>}
      <Button
        text={showEditModal ? "Guardar Cambios" : "Registrar Usuario"}
        loading={saving}
        icon={<Plus size={18} />}
      />
    </form>
  );

  return (
    <div className="users-layout">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <main
        className="users-main"
        style={{
          marginLeft: isMobile ? "0" : sidebarOpen ? "240px" : "70px",
          paddingLeft: isMobile && !sidebarOpen ? "64px" : undefined,
        }}
      >
        <div className="users-header">
          <div>
            <h1 className="users-title">Gestión de Usuarios</h1>
            <p className="users-subtitle">
              Administrar los usuarios del sistema
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="users-addBtn"
          >
            <Plus size={18} /> Agregar Usuario
          </button>
        </div>

        <div className="users-card">
          <div className="users-search">
            <Search size={18} color="#9ca3af" />
            <input
              type="text"
              placeholder="Buscar usuario..."
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>

          <div className="users-tableWrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.nom_usuario}</strong>
                    </td>
                    <td className="users-email">{u.email}</td>
                    <td>{u.tipo_usuario || "Operario"}</td>
                    <td>
                      <span
                        className={
                          "users-badge " +
                          (isActivo(u.estado)
                            ? "users-badge--active"
                            : "users-badge--inactive")
                        }
                      >
                        {u.estado}
                      </span>
                    </td>
                    <td>
                      <div className="users-actions">
                        <button
                          onClick={() => handleEditarClick(u)}
                          className="users-actionBtn users-actionBtn--amber"
                          aria-label="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setUsuarioSeleccionado(u);
                            setShowDeleteModal(true);
                          }}
                          className="users-actionBtn users-actionBtn--red"
                          aria-label="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="users-footer">
            <span className="users-footerText">
              Mostrando {usuariosFiltrados.length} usuarios
            </span>
            <div className="users-pagination">
              <button className="users-pageBtn" type="button">
                <ChevronLeft size={16} /> Anterior
              </button>
              <button
                className="users-pageBtn users-pageBtn--active"
                type="button"
              >
                1
              </button>
              <button className="users-pageBtn" type="button">
                Siguiente <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {showModal && (
        <Modal titulo="Nuevo Usuario" onClose={() => setShowModal(false)}>
          {formFields}
        </Modal>
      )}
      {showEditModal && (
        <Modal titulo="Editar Usuario" onClose={() => setShowEditModal(false)}>
          {formFields}
        </Modal>
      )}
      {showDeleteModal && (
        <Modal
          titulo="Eliminar Usuario"
          onClose={() => setShowDeleteModal(false)}
        >
          <p style={{ color: "#4b5563", marginBottom: "20px" }}>
            ¿Eliminar a <strong>{usuarioSeleccionado?.nom_usuario}</strong>?
          </p>
          <div className="users-deleteActions">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="users-cancelBtn"
              type="button"
            >
              Cancelar
            </button>
            <button
              onClick={handleEliminar}
              className="users-deleteBtn"
              disabled={saving}
              type="button"
            >
              {saving ? "Eliminando..." : "Sí, eliminar"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Usuarios;
