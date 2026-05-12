import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Wheat } from "lucide-react";

import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import Modal from "../../components/Modal";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import AlertItem from "../../components/AlertItem";
import api from "../../api/axios";
import useIsMobile from "../../hooks/useIsMobile";

import "./Alimentacion.css";

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function todayISO() {
  try {
    return new Date().toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function Alimentacion() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [lotes, setLotes] = useState([]);
  const [rows, setRows] = useState([]);

  // filtros CU12
  const [filtroLote, setFiltroLote] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // UI
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  // form CU11
  const [form, setForm] = useState({
    id_lote: "",
    fecha: todayISO(),
    cantidad_kg: "",
    tipo_alimento: "",
    observacion: "",
  });

  useEffect(() => {
    fetchInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInitial = async () => {
    setLoading(true);
    setFormError("");
    try {
      const [lotesRes, alimentRes] = await Promise.all([
        api.get("/lotes/"),
        api.get("/alimentacion/"),
      ]);

      setLotes(Array.isArray(lotesRes.data) ? lotesRes.data : []);
      setRows(Array.isArray(alimentRes.data) ? alimentRes.data : []);
    } catch (e) {
      console.error("Error al cargar alimentación", e);
      setFormError("No se pudo cargar la información de alimentación.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistorial = async () => {
    setLoading(true);
    setFormError("");
    setSuccess("");
    try {
      const params = {};
      if (filtroLote) params.id_lote = filtroLote;
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;

      const res = await api.get("/alimentacion/", { params });
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      const detail = e?.response?.data?.detail;
      setFormError(String(detail || "Error al consultar el historial."));
    } finally {
      setLoading(false);
    }
  };

  const lotesOptions = useMemo(() => {
    return (Array.isArray(lotes) ? lotes : [])
      .slice()
      .sort((a, b) => (toNumber(b?.id_lote) ?? 0) - (toNumber(a?.id_lote) ?? 0))
      .map((l) => ({
        value: String(l?.id_lote ?? ""),
        label: `Lote ${l?.id_lote}`,
      }))
      .filter((o) => o.value);
  }, [lotes]);

  const resetForm = () => {
    setForm({
      id_lote: "",
      fecha: todayISO(),
      cantidad_kg: "",
      tipo_alimento: "",
      observacion: "",
    });
    setFormError("");
    setSuccess("");
  };

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormError("");
    setSuccess("");
  };

  const handleRegistrar = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccess("");

    const id_lote = toNumber(form.id_lote);
    const cantidad_kg = toNumber(form.cantidad_kg);

    if (!id_lote) return setFormError("Selecciona un lote.");
    if (!form.fecha) return setFormError("Selecciona una fecha.");
    if (!cantidad_kg || cantidad_kg <= 0)
      return setFormError("La cantidad (kg) debe ser mayor a 0.");

    setSaving(true);
    try {
      await api.post("/alimentacion/", {
        id_lote,
        fecha: form.fecha,
        cantidad_kg,
        tipo_alimento: String(form.tipo_alimento || "").trim() || null,
        observacion: String(form.observacion || "").trim() || null,
      });

      setSuccess("Registro de alimentación guardado.");
      setShowModal(false);
      await fetchHistorial();
    } catch (err) {
      const data = err?.response?.data;
      const firstFieldError =
        (data &&
          typeof data === "object" &&
          (data?.detail ||
            data?.cantidad_kg?.[0] ||
            data?.fecha?.[0] ||
            data?.id_lote?.[0] ||
            data?.non_field_errors?.[0])) ||
        null;
      setFormError(
        String(firstFieldError || "Error al registrar la alimentación."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="alim-layout">
      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        showMobileTrigger={false}
      />

      <main
        className="alim-main"
        style={{ marginLeft: isMobile ? "0" : sidebarOpen ? "240px" : "70px" }}
      >
        <Topbar
          titulo="Alimentación"
          subtitulo="Registrar consumo por lote y consultar historial"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <div className="alim-card">
          <div className="alim-cardHeader">
            <div>
              <h2 className="alim-title">Historial de alimentación</h2>
              <p className="alim-subtitle">
                Filtra por lote y rango de fechas
              </p>
            </div>

            <button className="alim-primaryBtn" onClick={handleOpenModal}>
              <Plus size={18} />
              Registrar
            </button>
          </div>

          {(formError || success) && (
            <div className="alim-alerts">
              {formError && (
                <AlertItem
                  type="danger"
                  icon={<Search size={18} />}
                  title="Atención"
                  desc={formError}
                />
              )}
              {success && (
                <AlertItem
                  type="info"
                  icon={<Wheat size={18} />}
                  title="Listo"
                  desc={success}
                />
              )}
            </div>
          )}

          <div className="alim-filters">
            <div className="alim-filter">
              <label className="alim-label">Lote</label>
              <div className="alim-selectWrap">
                <select
                  className="alim-select"
                  value={filtroLote}
                  onChange={(e) => setFiltroLote(e.target.value)}
                >
                  <option value="">Todos</option>
                  {lotesOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="alim-filter">
              <label className="alim-label">Desde</label>
              <InputField
                type="date"
                name="fecha_inicio"
                required={false}
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>

            <div className="alim-filter">
              <label className="alim-label">Hasta</label>
              <InputField
                type="date"
                name="fecha_fin"
                required={false}
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>

            <div className="alim-actions">
              <button
                className="alim-secondaryBtn"
                onClick={() => {
                  setFiltroLote("");
                  setFechaInicio("");
                  setFechaFin("");
                  setSuccess("");
                  setFormError("");
                  fetchInitial();
                }}
                type="button"
              >
                Limpiar
              </button>
              <button
                className="alim-primaryBtn"
                onClick={fetchHistorial}
                type="button"
              >
                <Search size={18} />
                Buscar
              </button>
            </div>
          </div>

          <div className="alim-tableWrap">
            <table className="alim-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Lote</th>
                  <th>Fecha</th>
                  <th>Cantidad (kg)</th>
                  <th>Tipo</th>
                  <th>Observación</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="alim-empty">
                      Cargando...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="alim-empty">
                      No hay registros.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id_alimentacion}>
                      <td>
                        <strong>{r.id_alimentacion}</strong>
                      </td>
                      <td>Lote {r.id_lote}</td>
                      <td>{r.fecha}</td>
                      <td>{r.cantidad_kg}</td>
                      <td className="alim-muted">{r.tipo_alimento || "-"}</td>
                      <td className="alim-muted">{r.observacion || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="alim-footer">
            <span className="alim-footerText">
              Mostrando {rows.length} registros
            </span>
          </div>
        </div>
      </main>

      {showModal && (
        <Modal
          titulo="Registrar alimentación"
          onClose={() => setShowModal(false)}
        >
          <form className="alim-form" onSubmit={handleRegistrar}>
            <div>
              <label className="alim-label">Lote</label>
              <div className="alim-selectWrap">
                <select
                  className="alim-select"
                  name="id_lote"
                  value={form.id_lote}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Seleccionar lote</option>
                  {lotesOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="alim-label">Fecha</label>
              <InputField
                type="date"
                name="fecha"
                value={form.fecha}
                onChange={handleFormChange}
              />
            </div>

            <div>
              <label className="alim-label">Cantidad (kg)</label>
              <InputField
                type="number"
                name="cantidad_kg"
                placeholder="Ej: 25.50"
                value={form.cantidad_kg}
                onChange={handleFormChange}
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label className="alim-label">Tipo de alimento</label>
              <InputField
                name="tipo_alimento"
                placeholder="Ej: Iniciador"
                required={false}
                value={form.tipo_alimento}
                onChange={handleFormChange}
              />
            </div>

            <div>
              <label className="alim-label">Observación</label>
              <textarea
                className="alim-textarea"
                name="observacion"
                placeholder="(Opcional)"
                value={form.observacion}
                onChange={handleFormChange}
                rows={3}
              />
            </div>

            {formError && <p className="alim-formError">⚠️ {formError}</p>}

            <Button
              text="Guardar"
              loadingText="Guardando..."
              loading={saving}
              icon={<Plus size={18} />}
            />
          </form>
        </Modal>
      )}
    </div>
  );
}

export default Alimentacion;
