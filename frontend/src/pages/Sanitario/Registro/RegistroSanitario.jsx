import { useEffect, useMemo, useState } from "react";
import { Plus, Stethoscope, Edit, Trash2 } from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import Topbar from "../../../components/Topbar";
import Modal from "../../../components/Modal";
import InputField from "../../../components/InputField";
import ComboBox from "../../../components/ComboBox";
import Button from "../../../components/Button";
import api from "../../../api/axios";
import useIsMobile from "../../../hooks/useIsMobile";
import "../../Inventario/Inventario.css";

function RegistroSanitario() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();

  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [loading, setLoading] = useState(true);
  const [lotes, setLotes] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [aplicaciones, setAplicaciones] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  const defaultForm = {
    lote: "",
    insumo: "",
    tipo_tratamiento: "Vacuna",
    dosis: "",
    unidad_dosis: "ml",
    fecha_aplicacion: new Date().toISOString().split("T")[0],
    responsable: "",
    observacion: "",
    estado_enfermedad: "Preventivo"
  };

  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    try {
      const uStr = localStorage.getItem("usuario");
      if (uStr) {
        const u = JSON.parse(uStr);
        setForm((prev) => ({
          ...prev,
          responsable: u.nom_usuario || u.email || "",
        }));
      }
    } catch {
      // Ignorar errores
    }
    fetchData();

    const id = setInterval(() => fetchData({ silent: true }), 15000);
    return () => clearInterval(id);
  }, []);

  const fetchData = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [lotesRes, insRes, appsRes, usuariosRes] = await Promise.all([
        api.get("/lotes/"),
        api.get("/insumos/catalogo/"),
        api.get("/sanitario/aplicaciones/"),
        api.get("/usuarios/"),
      ]);

      setLotes(lotesRes.data);

      const sanitarios = (insRes.data || []).filter((i) =>
        ["Vacuna", "Medicamento", "Suministro"].includes(i.tipo),
      );
      setInsumos(sanitarios);

      setAplicaciones(appsRes.data);
      setUsuarios(Array.isArray(usuariosRes.data) ? usuariosRes.data : []);
    } catch (e) {
      console.error("Error cargando datos sanitarios", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await api.post("/sanitario/aplicaciones/", {
        lote: Number(form.lote),
        insumo: form.insumo ? Number(form.insumo) : null,
        tipo_tratamiento: form.tipo_tratamiento,
        dosis: Number(form.dosis),
        unidad_dosis: form.unidad_dosis,
        fecha_aplicacion: form.fecha_aplicacion,
        responsable: form.responsable,
        observacion: form.observacion,
        estado_enfermedad: form.estado_enfermedad,
      });
      setShowModal(false);
      setForm(defaultForm);
      fetchData();
    } catch (e) {
      setFormError(
        e.response?.data?.detail ||
          e.response?.data?.dosis?.[0] ||
          e.response?.data?.lote?.[0] ||
          "Error al registrar aplicación sanitaria"
      );
      console.error("Error al registrar aplicación sanitaria", e);
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setForm({
      lote: item.lote,
      insumo: item.insumo || "",
      tipo_tratamiento: item.tipo_tratamiento || "Vacuna",
      dosis: item.dosis || "",
      unidad_dosis: item.unidad_dosis || "ml",
      fecha_aplicacion: item.fecha_aplicacion || "",
      responsable: item.responsable || "",
      observacion: item.observacion || "",
      estado_enfermedad: item.estado_enfermedad || "Preventivo"
    });
    setFormError("");
    setShowEditModal(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await api.patch(`/sanitario/aplicaciones/${editingItem.id}/`, {
        lote: Number(form.lote),
        insumo: form.insumo ? Number(form.insumo) : null,
        tipo_tratamiento: form.tipo_tratamiento,
        dosis: Number(form.dosis),
        unidad_dosis: form.unidad_dosis,
        fecha_aplicacion: form.fecha_aplicacion,
        responsable: form.responsable,
        observacion: form.observacion,
        estado_enfermedad: form.estado_enfermedad,
      });
      setShowEditModal(false);
      setEditingItem(null);
      setForm(defaultForm);
      fetchData();
    } catch (e) {
      setFormError(
        e.response?.data?.detail ||
          e.response?.data?.dosis?.[0] ||
          e.response?.data?.lote?.[0] ||
          "Error al editar registro sanitario"
      );
      console.error("Error al editar registro sanitario", e);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setSaving(true);
    setFormError("");
    try {
      await api.delete(`/sanitario/aplicaciones/${editingItem.id}/`);
      setShowDeleteModal(false);
      setEditingItem(null);
      fetchData();
    } catch (e) {
      setFormError(
        e.response?.data?.detail ||
          e.response?.data?.error ||
          "Error al eliminar el registro."
      );
      console.error("Error al eliminar el registro:", e);
    } finally {
      setSaving(false);
    }
  };

  const last10 = useMemo(
    () => (aplicaciones || []).slice(0, 10),
    [aplicaciones],
  );

  const responsablesUnicos = useMemo(() => {
    return Array.from(
      new Set((aplicaciones || []).map((a) => a.responsable).filter(Boolean)),
    );
  }, [aplicaciones]);

  const unidadesUnicas = useMemo(() => {
    return Array.from(
      new Set((aplicaciones || []).map((a) => a.unidad_dosis).filter(Boolean)),
    );
  }, [aplicaciones]);

  const formFields = (isEdit = false) => (
    <>
      <ComboBox
        label="Lote de Aves"
        value={form.lote}
        onChange={(val) => setForm({ ...form, lote: val })}
        options={lotes
          .filter((l) => isEdit || l.estado !== "Finalizado") // Al editar permitimos ver el lote aunque esté finalizado (si ya lo tenía)
          .map((l) => ({
            value: l.id_lote,
            label: `Lote ${l.id_lote} - ${l.raza_tipo || "Sin raza"} (${l.estado})`,
        }))}
        placeholder="Seleccionar lote..."
        required
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <ComboBox
          label="Insumo Utilizado"
          value={form.insumo}
          onChange={(val) => setForm({ ...form, insumo: val })}
          options={insumos.map((i) => ({
            value: i.id_insumo,
            label: i.nombre,
          }))}
          placeholder="Ninguno / Genérico"
        />

        <ComboBox
          label="Tipo de Tratamiento"
          value={form.tipo_tratamiento}
          onChange={(val) => setForm({ ...form, tipo_tratamiento: val })}
          options={[
            { value: "Vacuna", label: "Vacuna" },
            { value: "Medicamento", label: "Medicamento" },
            { value: "Vitamina", label: "Vitamina" },
            { value: "Antibiotico", label: "Antibiótico" },
            { value: "Desinfectante", label: "Desinfectante" },
            { value: "Otro", label: "Otro" },
          ]}
          placeholder="Seleccionar tipo..."
          required
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <InputField
          label="Cantidad / Dosis"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={form.dosis}
          onChange={(e) => setForm({ ...form, dosis: e.target.value })}
          required
        />

        <ComboBox
          label="Unidad (ej: ml, gr, dosis)"
          value={form.unidad_dosis}
          onChange={(val) => setForm({ ...form, unidad_dosis: val })}
          allowCustom={true}
          options={[
            { value: "ml", label: "ml" },
            { value: "gr", label: "gr" },
            { value: "mg", label: "mg" },
            { value: "dosis", label: "dosis" },
            { value: "gotas", label: "gotas" },
            ...unidadesUnicas.map((u) => ({ value: u, label: u })),
          ].filter((v, i, a) => a.findIndex((t) => t.value === v.value) === i)}
          placeholder="Escribe o selecciona..."
          required
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <InputField
          label="Fecha de Aplicación"
          type="date"
          value={form.fecha_aplicacion}
          onChange={(e) => setForm({ ...form, fecha_aplicacion: e.target.value })}
          required
        />
        <ComboBox
          label="Estado Enfermedad"
          value={form.estado_enfermedad}
          onChange={(val) => setForm({ ...form, estado_enfermedad: val })}
          allowCustom={true}
          options={[
            { value: "Preventivo", label: "Preventivo" },
            { value: "En Tratamiento", label: "En Tratamiento" },
            { value: "Recuperado", label: "Recuperado" },
            { value: "Pendiente", label: "Pendiente" },
          ]}
          placeholder="Seleccionar estado..."
        />
      </div>

      <ComboBox
        label="Personal Responsable"
        value={form.responsable}
        onChange={(val) => setForm({ ...form, responsable: val })}
        allowCustom={true}
        options={[
          ...usuarios.map((u) => ({
            value: u.nom_usuario,
            label: u.nom_usuario,
          })),
          ...responsablesUnicos.map((r) => ({ value: r, label: r })),
        ].filter((v, i, a) => a.findIndex((t) => t.value === v.value) === i)}
        placeholder="Nombre del encargado"
      />

      <InputField
        label="Observaciones Adicionales"
        placeholder="Detalles sobre la aplicación..."
        value={form.observacion}
        onChange={(e) => setForm({ ...form, observacion: e.target.value })}
      />
    </>
  );

  return (
    <div className="inv-layout">
      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        showMobileTrigger={false}
      />

      <main
        className="inv-main"
        style={{
          marginLeft: isMobile ? "0" : sidebarOpen ? "240px" : "70px",
          padding: isMobile ? "16px" : "32px",
          paddingTop: isMobile ? "80px" : "32px",
          transition: "margin-left 0.3s ease",
          flex: 1,
        }}
      >
        <Topbar
          titulo="Registro de Aplicaciones Sanitarias"
          subtitulo="Vacunas, medicamentos y tratamientos por lote"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <div className="inv-header" style={{ marginBottom: "20px" }}>
          <div style={{ flex: 1 }} />
          <div className="inv-header-actions">
            <button
              className="inv-btn-primary"
              onClick={() => {
                setForm(defaultForm);
                setFormError("");
                setShowModal(true);
              }}
            >
              <Plus size={16} /> Registrar aplicación
            </button>
          </div>
        </div>

        <section className="inv-panel">
          <div className="inv-panel-header">
            <h3 className="inv-panel-title">
              <Stethoscope size={18} /> Últimas aplicaciones
            </h3>
          </div>

          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Lote</th>
                  <th>Tipo / Insumo</th>
                  <th>Estado</th>
                  <th>Dosis</th>
                  <th>Responsable</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="inv-empty">Cargando...</td>
                  </tr>
                ) : last10.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="inv-empty">No hay registros.</td>
                  </tr>
                ) : (
                  last10.map((a) => (
                    <tr key={a.id}>
                      <td style={{ fontSize: 12 }}>{a.fecha_aplicacion}</td>
                      <td><strong>Lote {a.lote}</strong></td>
                      <td>
                        {a.tipo_tratamiento}
                        <br />
                        <span style={{ fontSize: "0.85em", color: "#666" }}>{a.insumo_nombre || "-"}</span>
                      </td>
                      <td>
                        <span style={{ 
                          padding: "2px 8px", 
                          borderRadius: "12px", 
                          fontSize: "0.8em", 
                          backgroundColor: "#f0fdf4", 
                          color: "#16a34a",
                          border: "1px solid #bbf7d0" 
                        }}>
                          {a.estado_enfermedad || "Preventivo"}
                        </span>
                      </td>
                      <td><strong>{a.dosis}</strong> {a.unidad_dosis}</td>
                      <td>{a.responsable || "-"}</td>
                       <td style={{ textAlign: "right" }}>
                        <div className="btn-action-group">
                          <button
                            onClick={() => handleEditClick(a)}
                            className="btn-action btn-action--edit"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingItem(a);
                              setFormError("");
                              setShowDeleteModal(true);
                            }}
                            className="btn-action btn-action--delete"
                            title="Eliminar"
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
        </section>
      </main>

      {/* Modal Crear */}
      {showModal && (
        <Modal titulo="Registrar Aplicación" onClose={() => setShowModal(false)}>
          <form className="inv-form" onSubmit={handleCreate}>
            {formFields(false)}
            {formError && (
              <p style={{ color: "#dc2626", fontSize: "13px", margin: "10px 0 0 0", fontWeight: "600" }}>
                ⚠️ {formError}
              </p>
            )}
            <Button text="Guardar" icon={<Plus size={18} />} loading={saving} />
          </form>
        </Modal>
      )}

      {/* Modal Editar */}
      {showEditModal && (
        <Modal titulo="Editar Aplicación" onClose={() => setShowEditModal(false)}>
          <form className="inv-form" onSubmit={submitEdit}>
            {formFields(true)}
            {formError && (
              <p style={{ color: "#dc2626", fontSize: "13px", margin: "10px 0 0 0", fontWeight: "600" }}>
                ⚠️ {formError}
              </p>
            )}
            <Button text="Actualizar" icon={<Edit size={18} />} loading={saving} />
          </form>
        </Modal>
      )}

      {/* Modal Eliminar */}
      {showDeleteModal && (
        <Modal
          titulo="Eliminar Aplicación"
          onClose={() => {
            setShowDeleteModal(false);
            setEditingItem(null);
          }}
        >
          <div style={{ padding: "10px 0 20px" }}>
            <p style={{ color: "#4b5563", fontSize: 14 }}>
              ¿Estás seguro de eliminar el registro sanitario del lote <strong>Lote {editingItem?.lote}</strong>?
            </p>
            <p
              style={{
                color: "#ef4444",
                fontSize: 12,
                marginTop: 8,
                fontWeight: 600,
              }}
            >
              Esta acción no se puede deshacer y devolverá el stock utilizado del insumo al inventario.
            </p>
          </div>
          {formError && (
            <p style={{ color: "#dc2626", fontSize: "12px", margin: "0 0 12px 0", fontWeight: "600" }}>
              ⚠️ {formError}
            </p>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button
              className="inv-btn-ghost"
              onClick={() => {
                setShowDeleteModal(false);
                setEditingItem(null);
              }}
            >
              Cancelar
            </button>
            <button
              className="inv-btn-danger"
              onClick={confirmDelete}
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

export default RegistroSanitario;
