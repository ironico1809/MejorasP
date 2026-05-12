import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
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

import "./Galpones.css";

function Galpones() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  const [galpones, setGalpones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showVerModal, setShowVerModal] = useState(false);
  const [galponSeleccionado, setGalponSeleccionado] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    capacidad: "",
    descripcion: "",
    estado: "activo",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchGalpones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGalpones = async () => {
    try {
      const res = await api.get("/galpones/");
      setGalpones(res.data);
    } catch {
      console.error("Error al cargar galpones");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError("");
  };

  const resetForm = () => {
    setForm({ nombre: "", capacidad: "", descripcion: "", estado: "activo" });
    setFormError("");
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/galpones/", {
        ...form,
        capacidad: Number(form.capacidad),
      });
      setShowModal(false);
      resetForm();
      fetchGalpones();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Error al crear el galpón");
    } finally {
      setSaving(false);
    }
  };

  const handleEditarClick = (g) => {
    setGalponSeleccionado(g);
    setForm({
      nombre: g.nombre,
      capacidad: g.capacidad,
      descripcion: g.descripcion || "",
      estado: g.estado,
    });
    setShowEditModal(true);
  };

  const handleEditar = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/galpones/${galponSeleccionado.id}/`, {
        ...form,
        capacidad: Number(form.capacidad),
      });
      setShowEditModal(false);
      fetchGalpones();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Error al editar el galpón");
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    setSaving(true);
    try {
      await api.delete(`/galpones/${galponSeleccionado.id}/`);
      setShowDeleteModal(false);
      fetchGalpones();
    } finally {
      setSaving(false);
    }
  };

  const galponesFiltrados = galpones.filter(
    (g) =>
      g.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      (g.descripcion || "").toLowerCase().includes(filtro.toLowerCase()),
  );

  const estadoBadge = (estado) => ({
    background: estado === "activo" ? "#dcfce7" : "#fee2e2",
    color: estado === "activo" ? "#16a34a" : "#dc2626",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  });

  const formFields = (
    <form
      onSubmit={showEditModal ? handleEditar : handleCrear}
      style={{ display: "flex", flexDirection: "column", gap: "14px" }}
    >
      <InputField
        name="nombre"
        placeholder="Nombre del galpón"
        onChange={handleChange}
        value={form.nombre}
      />
      <InputField
        name="capacidad"
        type="number"
        placeholder="Capacidad (aves)"
        onChange={handleChange}
        value={form.capacidad}
      />
      <InputField
        name="descripcion"
        placeholder="Descripción (opcional)"
        onChange={handleChange}
        value={form.descripcion}
      />
      <div className="galp-selectWrap">
        <select
          name="estado"
          onChange={handleChange}
          value={form.estado}
          className="galp-select"
        >
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>
      {formError && <p className="galp-dangerText">⚠️ {formError}</p>}
      <Button
        text={showEditModal ? "Guardar Cambios" : "Crear Galpón"}
        loadingText="Guardando..."
        loading={saving}
        icon={<Plus size={18} />}
      />
    </form>
  );

  return (
    <div className="galp-layout">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <main
        className="galp-main"
        style={{
          marginLeft: isMobile ? "0" : sidebarOpen ? "240px" : "70px",
          paddingLeft: isMobile && !sidebarOpen ? "64px" : undefined,
        }}
      >
        <div className="galp-header">
          <div>
            <h1 className="galp-title">Gestión de Galpones</h1>
            <p className="galp-subtitle">
              Administrar los galpones de la granja
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="galp-addBtn"
          >
            <Plus size={18} /> Nuevo Galpón
          </button>
        </div>

        <div className="galp-card">
          <div className="galp-search">
            <Search size={18} color="#9ca3af" />
            <input
              type="text"
              placeholder="Buscar galpón..."
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>

          <div className="galp-tableWrap">
            <table className="galp-table">
              <thead>
                <tr style={theadRowStyle}>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Capacidad</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="galp-muted"
                      style={{ padding: "24px" }}
                    >
                      Cargando...
                    </td>
                  </tr>
                ) : galponesFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="galp-muted"
                      style={{ padding: "24px" }}
                    >
                      No hay galpones registrados.
                    </td>
                  </tr>
                ) : (
                  galponesFiltrados.map((g) => (
                    <tr key={g.id}>
                      <td>
                        <strong>{g.nombre}</strong>
                      </td>
                      <td className="galp-muted">
                        {g.descripcion || "Sin descripción"}
                      </td>
                      <td>{g.capacidad} aves</td>
                      <td>
                        <span style={estadoBadge(g.estado)}>{g.estado}</span>
                      </td>
                      <td>
                        <div className="galp-actions">
                          <button
                            onClick={() => {
                              setGalponSeleccionado(g);
                              setShowVerModal(true);
                            }}
                            className="galp-actionBtn galp-actionBtn--blue"
                            aria-label="Ver"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditarClick(g)}
                            className="galp-actionBtn galp-actionBtn--amber"
                            aria-label="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setGalponSeleccionado(g);
                              setShowDeleteModal(true);
                            }}
                            className="galp-actionBtn galp-actionBtn--red"
                            aria-label="Eliminar"
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

          <div className="galp-footer">
            <span className="galp-footerText">
              Mostrando {galponesFiltrados.length} galpones
            </span>
            <div className="galp-pagination">
              <button className="galp-pageBtn" type="button">
                <ChevronLeft size={16} /> Anterior
              </button>
              <button
                className="galp-pageBtn galp-pageBtn--active"
                type="button"
              >
                1
              </button>
              <button className="galp-pageBtn" type="button">
                Siguiente <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {showModal && (
        <Modal titulo="Nuevo Galpón" onClose={() => setShowModal(false)}>
          {formFields}
        </Modal>
      )}
      {showEditModal && (
        <Modal titulo="Editar Galpón" onClose={() => setShowEditModal(false)}>
          {formFields}
        </Modal>
      )}

      {showDeleteModal && (
        <Modal
          titulo="Eliminar Galpón"
          onClose={() => setShowDeleteModal(false)}
        >
          <p style={{ color: "#4b5563", marginBottom: "20px" }}>
            ¿Eliminar <strong>{galponSeleccionado?.nombre}</strong>?
          </p>
          <div className="galp-deleteActions">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="galp-cancelBtn"
              type="button"
            >
              Cancelar
            </button>
            <button
              onClick={handleEliminar}
              className="galp-deleteBtn"
              disabled={saving}
              type="button"
            >
              {saving ? "Eliminando..." : "Sí, eliminar"}
            </button>
          </div>
        </Modal>
      )}

      {showVerModal && galponSeleccionado && (
        <Modal titulo="Detalle Galpón" onClose={() => setShowVerModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {[
              { label: "Nombre", value: galponSeleccionado.nombre },
              {
                label: "Capacidad",
                value: `${galponSeleccionado.capacidad} aves`,
              },
              {
                label: "Descripción",
                value: galponSeleccionado.descripcion || "Sin descripción",
              },
              { label: "Estado", value: galponSeleccionado.estado },
            ].map((item, i) => (
              <div key={i} className="galp-detailRow">
                <span className="galp-detailLabel">{item.label}</span>
                <span className="galp-detailValue">{item.value}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

const theadRowStyle = { borderBottom: "1px solid #f3f4f6" };

export default Galpones;
