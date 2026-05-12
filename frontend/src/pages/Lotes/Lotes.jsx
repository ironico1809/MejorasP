import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
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

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isActivo(estado) {
  return (
    String(estado || "")
      .toLowerCase()
      .trim() === "activo"
  );
}

const RAZA_TIPO_PRESETS = [
  "Broiler",
  "Cobb 500",
  "Ross 308",
  "Hubbard",
  "Criollo",
];

function Lotes() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );
  const [galpones, setGalpones] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loteSeleccionado, setLoteSeleccionado] = useState(null);
  const [filtro, setFiltro] = useState("");
  const [filtroGalpon, setFiltroGalpon] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  // Selector de galpón escribible (typeahead)
  const [galponQuery, setGalponQuery] = useState("");
  const [galponDropdownOpen, setGalponDropdownOpen] = useState(false);

  const [form, setForm] = useState({
    id_galpon: "",
    raza_tipo: "",
    raza_tipo_custom: "",
    cantidad_inicial: "",
    cantidad_actual: "",
    peso_inicial: "",
    fecha_ingreso: "",
    fecha_salida_estimada: "",
    estado: "Crianza",
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isNarrow = viewportWidth < 900;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [galRes, lotRes] = await Promise.all([
        api.get("/galpones/"),
        api.get("/lotes/"),
      ]);

      setGalpones(Array.isArray(galRes.data) ? galRes.data : []);
      setLotes(Array.isArray(lotRes.data) ? lotRes.data : []);
    } catch (e) {
      console.error("Error al cargar datos", e);
    } finally {
      setLoading(false);
    }
  };

  const avesPorGalpon = useMemo(() => {
    const map = new Map();
    for (const l of lotes) {
      const gid = toNumber(l?.id_galpon);
      const aves = toNumber(l?.cantidad_actual) ?? 0;
      if (gid === null) continue;
      map.set(gid, (map.get(gid) || 0) + aves);
    }
    return map;
  }, [lotes]);

  const galponNombrePorId = useMemo(() => {
    const map = new Map();
    for (const g of galpones) {
      const id = toNumber(g?.id);
      if (id === null) continue;
      map.set(id, g?.nombre);
    }
    return map;
  }, [galpones]);

  const lotesEnriquecidos = useMemo(() => {
    return (Array.isArray(lotes) ? lotes : [])
      .slice()
      .sort((a, b) => (toNumber(b?.id_lote) ?? 0) - (toNumber(a?.id_lote) ?? 0))
      .map((l) => {
        const gid = toNumber(l?.id_galpon);
        return {
          ...l,
          _galponNombre:
            gid !== null ? galponNombrePorId.get(gid) || `Galpón ${gid}` : "-",
        };
      });
  }, [lotes, galponNombrePorId]);

  const galponesActivos = useMemo(
    () => galpones.filter((g) => isActivo(g?.estado)),
    [galpones],
  );

  const selectedGalpon = useMemo(() => {
    const gid = toNumber(form.id_galpon);
    if (gid === null) return null;
    return galponesActivos.find((g) => Number(g.id) === gid) || null;
  }, [form.id_galpon, galponesActivos]);

  const ocupacion = useMemo(() => {
    if (!selectedGalpon) return null;
    const gid = Number(selectedGalpon.id);
    const usado = avesPorGalpon.get(gid) || 0;
    const capacidad = toNumber(selectedGalpon.capacidad) ?? 0;

    let usadoEfectivo = usado;
    if (showEditModal && loteSeleccionado) {
      const loteGalpon = toNumber(loteSeleccionado?.id_galpon);
      const loteActual = toNumber(loteSeleccionado?.cantidad_actual) ?? 0;
      if (loteGalpon !== null && loteGalpon === gid) {
        usadoEfectivo = Math.max(0, usado - loteActual);
      }
    }
    return {
      usado: usadoEfectivo,
      capacidad,
      disponible: Math.max(0, capacidad - usadoEfectivo),
    };
  }, [selectedGalpon, avesPorGalpon, showEditModal, loteSeleccionado]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      if (name === "raza_tipo") {
        return {
          ...prev,
          raza_tipo: value,
          raza_tipo_custom: value === "__otro__" ? prev.raza_tipo_custom : "",
        };
      }

      if (name === "raza_tipo_custom") {
        return {
          ...prev,
          raza_tipo: "__otro__",
          raza_tipo_custom: value,
        };
      }

      return { ...prev, [name]: value };
    });
    setFormError("");
    setSuccess("");
  };

  const resetForm = () => {
    setForm({
      id_galpon: "",
      raza_tipo: "",
      raza_tipo_custom: "",
      cantidad_inicial: "",
      cantidad_actual: "",
      peso_inicial: "",
      fecha_ingreso: "",
      fecha_salida_estimada: "",
      estado: "Crianza",
    });
    setGalponQuery("");
    setGalponDropdownOpen(false);
    setFormError("");
    setSuccess("");
  };

  const validateCommon = ({
    id_galpon,
    cantidad_inicial,
    cantidad_actual,
    fecha_ingreso,
    estado,
  }) => {
    if (!id_galpon) return "Selecciona un galpón.";
    if (!cantidad_inicial || cantidad_inicial <= 0)
      return "La cantidad inicial debe ser mayor a 0.";
    if (cantidad_actual === null || cantidad_actual === undefined)
      return "La cantidad actual es inválida.";
    if (cantidad_actual < 0) return "La cantidad actual no puede ser negativa.";
    if (cantidad_actual > cantidad_inicial)
      return "La cantidad actual no puede ser mayor a la inicial.";
    if (!fecha_ingreso) return "Selecciona la fecha de inicio.";
    if (!estado) return "Selecciona el estado.";
    return null;
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccess("");

    const id_galpon = toNumber(form.id_galpon);
    const raza_tipo =
      form.raza_tipo === "__otro__"
        ? String(form.raza_tipo_custom || "").trim() || null
        : String(form.raza_tipo || "").trim() || null;
    const cantidad_inicial = toNumber(form.cantidad_inicial);
    const cantidad_actual = cantidad_inicial;
    const peso_inicial = toNumber(form.peso_inicial);
    const fecha_ingreso = form.fecha_ingreso;
    const fecha_salida_estimada = form.fecha_salida_estimada || null;
    const estado = form.estado;

    if (peso_inicial !== null && peso_inicial < 0) {
      return setFormError("El peso inicial no puede ser negativo.");
    }

    const msg = validateCommon({
      id_galpon,
      cantidad_inicial,
      cantidad_actual,
      fecha_ingreso,
      estado,
    });
    if (msg) return setFormError(msg);

    const disponible = ocupacion?.disponible;
    if (typeof disponible === "number" && cantidad_inicial > disponible) {
      return setFormError(
        "El galpón no tiene capacidad disponible suficiente.",
      );
    }

    setSaving(true);
    try {
      await api.post("/lotes/", {
        id_galpon,
        raza_tipo,
        cantidad_inicial,
        cantidad_actual,
        peso_inicial,
        fecha_ingreso,
        fecha_salida_estimada,
        estado,
      });

      setSuccess("Lote registrado correctamente.");
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        "Error al registrar el lote.";
      setFormError(String(detail));
    } finally {
      setSaving(false);
    }
  };

  const handleEditarClick = (l) => {
    setLoteSeleccionado(l);
    const gid = toNumber(l?.id_galpon);
    const nombre =
      gid !== null ? galponNombrePorId.get(gid) || `Galpón ${gid}` : "";
    setForm({
      id_galpon: String(l?.id_galpon ?? ""),
      raza_tipo: (() => {
        const r = String(l?.raza_tipo ?? "").trim();
        if (!r) return "";
        return RAZA_TIPO_PRESETS.includes(r) ? r : "__otro__";
      })(),
      raza_tipo_custom: (() => {
        const r = String(l?.raza_tipo ?? "").trim();
        if (!r) return "";
        return RAZA_TIPO_PRESETS.includes(r) ? "" : r;
      })(),
      cantidad_inicial: String(l?.cantidad_inicial ?? ""),
      cantidad_actual: String(l?.cantidad_actual ?? ""),
      peso_inicial: String(l?.peso_inicial ?? ""),
      fecha_ingreso: String(l?.fecha_ingreso ?? ""),
      fecha_salida_estimada: String(l?.fecha_salida_estimada ?? ""),
      estado: String(l?.estado ?? "Crianza"),
    });
    setGalponQuery(nombre);
    setGalponDropdownOpen(false);
    setFormError("");
    setSuccess("");
    setShowEditModal(true);
  };

  const handleEditar = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccess("");

    const id_lote = loteSeleccionado?.id_lote;
    if (!id_lote) return setFormError("No se encontró el lote a editar.");

    const id_galpon = toNumber(form.id_galpon);
    const raza_tipo =
      form.raza_tipo === "__otro__"
        ? String(form.raza_tipo_custom || "").trim() || null
        : String(form.raza_tipo || "").trim() || null;
    const cantidad_inicial = toNumber(form.cantidad_inicial);
    const cantidad_actual = toNumber(form.cantidad_actual);
    const peso_inicial = toNumber(form.peso_inicial);
    const fecha_ingreso = form.fecha_ingreso;
    const fecha_salida_estimada = form.fecha_salida_estimada || null;
    const estado = form.estado;

    if (peso_inicial !== null && peso_inicial < 0) {
      return setFormError("El peso inicial no puede ser negativo.");
    }

    const msg = validateCommon({
      id_galpon,
      cantidad_inicial,
      cantidad_actual,
      fecha_ingreso,
      estado,
    });
    if (msg) return setFormError(msg);

    const disponible = ocupacion?.disponible;
    if (typeof disponible === "number" && cantidad_inicial > disponible) {
      return setFormError(
        "El galpón no tiene capacidad disponible suficiente.",
      );
    }

    setSaving(true);
    try {
      await api.patch(`/lotes/${id_lote}/`, {
        id_galpon,
        raza_tipo,
        cantidad_inicial,
        cantidad_actual,
        peso_inicial,
        fecha_ingreso,
        fecha_salida_estimada,
        estado,
      });

      setShowEditModal(false);
      setLoteSeleccionado(null);
      resetForm();
      fetchData();
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        err?.response?.data?.cantidad_actual?.[0] ||
        err?.response?.data?.cantidad_inicial?.[0] ||
        "Error al editar el lote.";
      setFormError(String(detail));
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    const id_lote = loteSeleccionado?.id_lote;
    if (!id_lote) return;

    setSaving(true);
    try {
      await api.delete(`/lotes/${id_lote}/`);
      setShowDeleteModal(false);
      setLoteSeleccionado(null);
      fetchData();
    } catch (err) {
      setFormError(err?.response?.data?.detail || "Error al eliminar el lote.");
    } finally {
      setSaving(false);
    }
  };

  const estadoBadgeStyle = (estado) => {
    const e = String(estado || "").toLowerCase();

    if (e.includes("final") || e.includes("cerr") || e.includes("inact")) {
      return {
        background: "#fee2e2",
        color: "#dc2626",
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "600",
      };
    }

    if (e.includes("crian") || e.includes("crec") || e.includes("eng")) {
      return {
        background: "#fef3c7",
        color: "#d97706",
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "600",
      };
    }

    return {
      background: "#dcfce7",
      color: "#16a34a",
      padding: "6px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
    };
  };

  const estadosDisponibles = useMemo(() => {
    const set = new Set();
    for (const l of lotesEnriquecidos) {
      const e = String(l?.estado || "").trim();
      if (e) set.add(e);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [lotesEnriquecidos]);

  const lotesFiltrados = useMemo(() => {
    const term = filtro.toLowerCase().trim();

    return lotesEnriquecidos.filter((l) => {
      const byTerm =
        !term ||
        String(l.id_lote ?? "")
          .toLowerCase()
          .includes(term) ||
        String(l._galponNombre ?? "")
          .toLowerCase()
          .includes(term) ||
        String(l.raza_tipo ?? "")
          .toLowerCase()
          .includes(term) ||
        String(l.estado ?? "")
          .toLowerCase()
          .includes(term) ||
        String(l.fecha_ingreso ?? "")
          .toLowerCase()
          .includes(term) ||
        String(l.fecha_salida_estimada ?? "")
          .toLowerCase()
          .includes(term);

      const byGalpon =
        !filtroGalpon || String(l.id_galpon ?? "") === String(filtroGalpon);

      const byEstado =
        !filtroEstado || String(l.estado ?? "") === String(filtroEstado);

      return byTerm && byGalpon && byEstado;
    });
  }, [lotesEnriquecidos, filtro, filtroGalpon, filtroEstado]);

  const galponesDisponibles = useMemo(() => {
    return galponesActivos
      .map((g) => {
        const gid = Number(g.id);
        const usado = avesPorGalpon.get(gid) || 0;
        const cap = toNumber(g.capacidad) ?? 0;
        const disp = Math.max(0, cap - usado);
        return { ...g, _disp: disp, _cap: cap };
      })
      .sort((a, b) =>
        String(a?.nombre || "").localeCompare(String(b?.nombre || "")),
      );
  }, [galponesActivos, avesPorGalpon]);

  const hayGalponConCupo = useMemo(() => {
    return galponesDisponibles.some((g) => (toNumber(g?._disp) ?? 0) > 0);
  }, [galponesDisponibles]);

  const galponesParaEditar = useMemo(() => {
    const loteGalpon = toNumber(loteSeleccionado?.id_galpon);
    const loteActual = toNumber(loteSeleccionado?.cantidad_actual) ?? 0;

    return galponesActivos.map((g) => {
      const gid = Number(g.id);
      const usado = avesPorGalpon.get(gid) || 0;
      const cap = toNumber(g.capacidad) ?? 0;
      const usadoEfectivo =
        loteGalpon !== null && loteGalpon === gid
          ? Math.max(0, usado - loteActual)
          : usado;
      const disp = Math.max(0, cap - usadoEfectivo);
      return { ...g, _disp: disp, _cap: cap };
    });
  }, [galponesActivos, avesPorGalpon, loteSeleccionado]);

  const galponOptions = showEditModal
    ? galponesParaEditar
    : galponesDisponibles;

  const galponOptionsFiltrados = useMemo(() => {
    const q = String(galponQuery || "")
      .toLowerCase()
      .trim();
    if (!q) return galponOptions;
    return galponOptions.filter((g) => {
      const id = String(g?.id ?? "").toLowerCase();
      const nombre = String(g?.nombre ?? "").toLowerCase();
      return id.includes(q) || nombre.includes(q);
    });
  }, [galponOptions, galponQuery]);

  const handleGalponQueryChange = (e) => {
    const value = e.target.value;
    setGalponQuery(value);
    setForm((prev) => ({ ...prev, id_galpon: "" }));
    setFormError("");
    setSuccess("");
    setGalponDropdownOpen(true);
  };

  const handleSelectGalpon = (g) => {
    setForm((prev) => ({ ...prev, id_galpon: String(g?.id ?? "") }));
    setGalponQuery(String(g?.nombre ?? ""));
    setGalponDropdownOpen(false);
    setFormError("");
    setSuccess("");
  };

  const formFields = (
    <form
      onSubmit={showEditModal ? handleEditar : handleCrear}
      style={{ display: "flex", flexDirection: "column", gap: "14px" }}
    >
      <div style={comboWrapperStyle}>
        <input
          type="text"
          value={galponQuery}
          placeholder="Selecciona un galpón (escribe para buscar)"
          onChange={handleGalponQueryChange}
          onFocus={() => setGalponDropdownOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setGalponDropdownOpen(false), 120);
          }}
          style={comboInputStyle}
        />
        <ChevronDown size={18} color="#9ca3af" />

        {galponDropdownOpen && (
          <div style={comboDropdownStyle}>
            {galponOptionsFiltrados.length === 0 ? (
              <div style={comboEmptyStyle}>No hay galpones que coincidan.</div>
            ) : (
              galponOptionsFiltrados.map((g) => {
                const disabled = (toNumber(g?._disp) ?? 0) <= 0;
                return (
                  <button
                    key={g.id}
                    type="button"
                    style={comboOptionStyle(disabled)}
                    disabled={disabled}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (!disabled) handleSelectGalpon(g);
                    }}
                    title={
                      disabled
                        ? "Sin capacidad disponible"
                        : "Seleccionar galpón"
                    }
                  >
                    <span style={comboOptionTitleStyle}>
                      {g.nombre} (#{g.id})
                    </span>
                    <span style={comboOptionMetaStyle}>
                      Disp: {g._disp} / {g._cap}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      <div style={selectGroupStyle}>
        <select
          name="raza_tipo"
          onChange={handleChange}
          value={form.raza_tipo}
          style={selectStyle}
          required={false}
        >
          <option value="">Raza / tipo (opcional)</option>
          {RAZA_TIPO_PRESETS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
          <option value="__otro__">Otro (escribir)</option>
        </select>
        <ChevronDown size={18} color="#9ca3af" />
      </div>

      {form.raza_tipo === "__otro__" && (
        <InputField
          name="raza_tipo_custom"
          type="text"
          placeholder="Escribe la raza/tipo"
          onChange={handleChange}
          value={form.raza_tipo_custom}
          required={false}
        />
      )}

      <InputField
        name="cantidad_inicial"
        type="number"
        placeholder="Cantidad inicial de pollos"
        onChange={handleChange}
        value={form.cantidad_inicial}
        min={1}
      />

      {showEditModal && (
        <InputField
          name="cantidad_actual"
          type="number"
          placeholder="Cantidad actual"
          onChange={handleChange}
          value={form.cantidad_actual}
          min={0}
        />
      )}

      <InputField
        name="peso_inicial"
        type="number"
        placeholder="Peso inicial (opcional)"
        onChange={handleChange}
        value={form.peso_inicial}
        required={false}
        min={0}
        step={0.01}
      />

      <InputField
        name="fecha_ingreso"
        type="date"
        placeholder="Fecha de inicio"
        onChange={handleChange}
        value={form.fecha_ingreso}
      />

      <InputField
        name="fecha_salida_estimada"
        type="date"
        placeholder="Fecha de salida estimada (opcional)"
        onChange={handleChange}
        value={form.fecha_salida_estimada}
        required={false}
      />

      <div style={selectGroupStyle}>
        <select
          name="estado"
          onChange={handleChange}
          value={form.estado}
          style={selectStyle}
          required
        >
          <option value="Crianza">Crianza</option>
          <option value="Crecimiento">Crecimiento</option>
          <option value="Engorde">Engorde</option>
          <option value="Finalizado">Finalizado</option>
        </select>
        <ChevronDown size={18} color="#9ca3af" />
      </div>

      {selectedGalpon && ocupacion && (
        <div style={infoBoxStyle}>
          <div style={infoRowStyle}>
            <span style={infoLabelStyle}>Galpón</span>
            <span style={infoValueStyle}>{selectedGalpon.nombre}</span>
          </div>
          <div style={infoRowStyle}>
            <span style={infoLabelStyle}>Capacidad</span>
            <span style={infoValueStyle}>{ocupacion.capacidad} aves</span>
          </div>
          <div style={infoRowStyle}>
            <span style={infoLabelStyle}>Ocupado</span>
            <span style={infoValueStyle}>{ocupacion.usado} aves</span>
          </div>
          <div style={{ ...infoRowStyle, borderBottom: "none" }}>
            <span style={infoLabelStyle}>Disponible</span>
            <span style={infoValueStyle}>{ocupacion.disponible} aves</span>
          </div>
        </div>
      )}

      {formError && <p style={messageErrorStyle}>⚠️ {formError}</p>}
      {success && <p style={messageSuccessStyle}>✓ {success}</p>}

      <Button
        text={showEditModal ? "Guardar Cambios" : "Registrar Lote"}
        loadingText="Guardando..."
        loading={saving}
        icon={<Plus size={18} />}
      />
    </form>
  );

  return (
    <div style={layoutStyle}>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <main
        style={{
          ...mainContentStyle,
          marginLeft: isNarrow ? "0px" : sidebarOpen ? "240px" : "70px",
          paddingLeft: isNarrow && !sidebarOpen ? "64px" : undefined,
        }}
      >
        <div
          style={{
            ...headerStyle,
            flexDirection: isNarrow ? "column" : "row",
            alignItems: isNarrow ? "stretch" : "center",
          }}
        >
          <div>
            <h1 style={titleStyle}>Lotes</h1>
            <p style={subtitleStyle}>
              Registra lotes y visualiza el estado por galpón
            </p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setLoteSeleccionado(null);
              setShowModal(true);
            }}
            style={{
              ...btnAgregarStyle,
              width: isNarrow ? "100%" : "auto",
              justifyContent: "center",
            }}
          >
            <Plus size={18} style={{ marginRight: "8px" }} /> Registrar Lote
          </button>
        </div>

        <div style={containerStyle}>
          <div
            style={{
              ...filtersRowStyle,
              flexDirection: isNarrow ? "column" : "row",
              alignItems: isNarrow ? "stretch" : "center",
            }}
          >
            <div style={searchWrapperStyle}>
              <Search size={18} color="#9ca3af" />
              <input
                type="text"
                placeholder="Buscar por ID, galpón, estado o fecha..."
                style={searchInputStyle}
                onChange={(e) => setFiltro(e.target.value)}
                value={filtro}
              />
            </div>

            <div style={filtersRightStyle}>
              <div style={selectGroupStyle}>
                <select
                  value={filtroGalpon}
                  onChange={(e) => setFiltroGalpon(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Todos los galpones</option>
                  {galpones.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nombre}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} color="#9ca3af" />
              </div>

              <div style={selectGroupStyle}>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Todos los estados</option>
                  {estadosDisponibles.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} color="#9ca3af" />
              </div>
            </div>
          </div>

          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={theadRowStyle}>
                  <th style={thStyle}>Lote</th>
                  <th style={thStyle}>ID Galpón</th>
                  <th style={thStyle}>Galpón</th>
                  <th style={thStyle}>Raza / Tipo</th>
                  <th style={thStyle}>Ingreso</th>
                  <th style={thStyle}>Salida Est.</th>
                  <th style={thStyle}>Cant. Inicial</th>
                  <th style={thStyle}>Cant. Actual</th>
                  <th style={thStyle}>Peso Inicial</th>
                  <th style={thStyle}>Estado</th>
                  <th style={thStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} style={emptyTdStyle}>
                      Cargando...
                    </td>
                  </tr>
                ) : lotesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={emptyTdStyle}>
                      No hay lotes que coincidan con el filtro.
                    </td>
                  </tr>
                ) : (
                  lotesFiltrados.map((l) => (
                    <tr key={l.id_lote} style={trStyle}>
                      <td style={tdStyle}>
                        <strong>#{l.id_lote}</strong>
                      </td>
                      <td style={tdStyle}>{String(l.id_galpon ?? "-")}</td>
                      <td style={tdGrayStyle}>{l._galponNombre}</td>
                      <td style={tdStyle}>{String(l.raza_tipo || "-")}</td>
                      <td style={tdStyle}>{String(l.fecha_ingreso || "-")}</td>
                      <td style={tdStyle}>
                        {String(l.fecha_salida_estimada || "-")}
                      </td>
                      <td style={tdStyle}>
                        {toNumber(l.cantidad_inicial) ?? 0}
                      </td>
                      <td style={tdStyle}>
                        {toNumber(l.cantidad_actual) ?? 0}
                      </td>
                      <td style={tdStyle}>
                        {l.peso_inicial === null || l.peso_inicial === undefined
                          ? "-"
                          : String(l.peso_inicial)}
                      </td>
                      <td style={tdStyle}>
                        <span style={estadoBadgeStyle(l.estado)}>
                          {String(l.estado || "-")}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleEditarClick(l)}
                            style={actionBtnStyle("#f59e0b")}
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setLoteSeleccionado(l);
                              setShowDeleteModal(true);
                            }}
                            style={actionBtnStyle("#dc2626")}
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

          <div style={tableFooterStyle}>
            <span style={footerTextStyle}>
              Mostrando {loading ? "—" : lotesFiltrados.length} lotes
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
        <Modal titulo="Registrar Lote" onClose={() => setShowModal(false)}>
          {!hayGalponConCupo && !loading ? (
            <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
              No hay galpones activos con capacidad disponible.
            </p>
          ) : (
            formFields
          )}
        </Modal>
      )}

      {showEditModal && (
        <Modal
          titulo={`Editar Lote #${loteSeleccionado?.id_lote ?? ""}`}
          onClose={() => {
            setShowEditModal(false);
            setLoteSeleccionado(null);
            resetForm();
          }}
        >
          {formFields}
        </Modal>
      )}

      {showDeleteModal && (
        <Modal
          titulo="Eliminar Lote"
          onClose={() => {
            setShowDeleteModal(false);
            setLoteSeleccionado(null);
          }}
        >
          <p style={{ color: "#4b5563", marginBottom: "20px" }}>
            ¿Eliminar el lote <strong>#{loteSeleccionado?.id_lote}</strong>?
          </p>
          {formError && (
            <p
              style={{
                color: "#dc2626",
                fontSize: "12px",
                margin: "0 0 12px 0",
              }}
            >
              ⚠️ {formError}
            </p>
          )}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setLoteSeleccionado(null);
              }}
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
  backgroundColor: "#f9fafb",
};

const mainContentStyle = {
  flex: 1,
  padding: "clamp(16px, 3vw, 32px)",
  transition: "margin-left 0.3s",
  width: "100%",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  gap: "12px",
  flexWrap: "wrap",
};

const titleStyle = {
  fontSize: "28px",
  fontWeight: "700",
  color: "#1c1c1c",
};

const subtitleStyle = {
  marginTop: "6px",
  fontSize: "14px",
  color: "#6b7280",
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
};

const containerStyle = {
  background: "white",
  borderRadius: "20px",
  padding: "24px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
};

const filtersRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  marginBottom: "18px",
  flexWrap: "wrap",
};

const searchWrapperStyle = {
  display: "flex",
  alignItems: "center",
  background: "#f9fafb",
  padding: "10px 16px",
  borderRadius: "12px",
  width: "min(380px, 100%)",
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

const filtersRightStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  width: "min(520px, 100%)",
};

const selectGroupStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  background: "#f9fafb",
  border: "1.5px solid #e5e7eb",
  borderRadius: "12px",
  padding: "0 12px",
  gap: "8px",
  minWidth: "min(180px, 100%)",
  flex: "0 0 auto",
  minHeight: "38px",
  height: "44px",
  boxSizing: "border-box",
};

const comboWrapperStyle = {
  ...selectGroupStyle,
  position: "relative",
  padding: "0 16px",
};

const comboInputStyle = {
  width: "100%",
  border: "none",
  background: "transparent",
  padding: "14px 0",
  fontSize: "14px",
  color: "#111827",
  outline: "none",
  minWidth: 0,
};

const comboDropdownStyle = {
  position: "absolute",
  left: 0,
  right: 0,
  top: "calc(100% + 6px)",
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  overflow: "hidden",
  maxHeight: "240px",
  overflowY: "auto",
  zIndex: 20,
  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
};

const comboEmptyStyle = {
  padding: "12px 14px",
  fontSize: "13px",
  color: "#6b7280",
};

const comboOptionStyle = (disabled) => ({
  width: "100%",
  textAlign: "left",
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  padding: "10px 14px",
  border: "none",
  background: "white",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.55 : 1,
});

const comboOptionTitleStyle = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#111827",
};

const comboOptionMetaStyle = {
  fontSize: "12px",
  color: "#6b7280",
  fontWeight: "600",
};

const selectStyle = {
  width: "100%",
  border: "none",
  background: "transparent",
  padding: "10px 0",
  fontSize: "13px",
  color: "#111827",
  outline: "none",
  appearance: "none",
  minHeight: "28px",
  height: "32px",
  boxSizing: "border-box",
};

const infoBoxStyle = {
  background: "#fff7ed",
  border: "1px solid rgba(245,158,11,0.18)",
  borderRadius: "14px",
  padding: "14px",
};

const infoRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 0",
  borderBottom: "1px solid rgba(245,158,11,0.18)",
};

const infoLabelStyle = {
  fontSize: "13px",
  color: "#92400e",
  fontWeight: "600",
};

const infoValueStyle = {
  fontSize: "13px",
  color: "#1c1c1c",
  fontWeight: "700",
};

const messageErrorStyle = {
  color: "#dc2626",
  fontSize: "13px",
  margin: 0,
  fontWeight: "600",
};

const messageSuccessStyle = {
  color: "#16a34a",
  fontSize: "13px",
  margin: 0,
  fontWeight: "600",
};

const tableWrapperStyle = { overflowX: "auto" };

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "left",
};

const theadRowStyle = { borderBottom: "1px solid #f3f4f6" };

const thStyle = {
  padding: "14px",
  color: "#6b7280",
  fontSize: "13px",
  fontWeight: "600",
};

const trStyle = { borderBottom: "1px solid #f8fafc" };

const tdStyle = { padding: "14px", fontSize: "14px", color: "#1c1c1c" };

const tdGrayStyle = { ...tdStyle, color: "#9ca3af" };

const emptyTdStyle = { padding: "24px", color: "#9ca3af" };

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

const actionBtnStyle = (color) => ({
  background: color,
  color: "white",
  border: "none",
  borderRadius: "6px",
  padding: "6px",
  cursor: "pointer",
  display: "flex",
});

const btnCancelarStyle = {
  flex: 1,
  padding: "12px",
  borderRadius: "12px",
  border: "1.5px solid #e5e7eb",
  background: "transparent",
  cursor: "pointer",
  color: "#6b7280",
  fontWeight: "600",
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
};

export default Lotes;
