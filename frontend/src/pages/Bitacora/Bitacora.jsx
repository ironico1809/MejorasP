import { useState, useEffect } from "react";
import { Calendar, User, Activity, Search } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import api from "../../api/axios";
import useIsMobile from "../../hooks/useIsMobile";

import "./Bitacora.css";

function safeParseJson(text) {
  if (typeof text !== "string") return null;
  try {
    const first = JSON.parse(text);
    if (typeof first === "string") {
      const trimmed = first.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          return JSON.parse(trimmed);
        } catch {
          return first;
        }
      }
    }
    return first;
  } catch {
    // Algunos registros antiguos pueden venir como string estilo Python dict:
    //   {'nombre':"Gato"}  o  {'modo': 'replace', 'permisos': []}
    // Intentamos una conversión sencilla a JSON.
    const trimmed = text.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;

    const normalized = trimmed
      .replace(/\bNone\b/g, "null")
      .replace(/\bTrue\b/g, "true")
      .replace(/\bFalse\b/g, "false")
      .replace(/'/g, '"');

    try {
      return JSON.parse(normalized);
    } catch {
      // Si viene con escapes raros (p.ej. {"k":\"v\"}), intentamos des-escapar.
      try {
        return JSON.parse(normalized.replace(/\\"/g, '"'));
      } catch {
        return null;
      }
    }
  }
}

function formatValueForCell(value) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  try {
    const asText = JSON.stringify(value);
    return asText.length > 180 ? `${asText.slice(0, 177)}...` : asText;
  } catch {
    return String(value);
  }
}

function titleCase(text) {
  if (!text) return "";
  return String(text)
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ");
}

function getEntidadLabel(entidad) {
  const e = String(entidad ?? "").toLowerCase();
  if (!e) return null;

  const map = {
    usuario: "Usuario",
    usuarios: "Usuario",
    rol: "Rol",
    roles: "Rol",
    permiso: "Permiso",
    permisos: "Permiso",
    galpon: "Galpón",
    galpones: "Galpón",
    lote: "Lote",
    lotes: "Lote",
    bitacora: "Bitácora",
  };

  return map[e] ?? titleCase(e);
}

function buildAccionLegible(accion, parsed) {
  const raw = String(accion ?? "")
    .toLowerCase()
    .trim();
  const entidadLabel = getEntidadLabel(parsed?.entidad);

  if (!raw) return "-";

  if (raw === "login") return "Inició sesión";
  if (raw === "logout") return "Cerró sesión";
  if (raw === "asignar_permisos") return "Asignó permisos";

  if (raw === "crear")
    return entidadLabel ? `Registró ${entidadLabel}` : "Registró";
  if (raw === "editar") return entidadLabel ? `Editó ${entidadLabel}` : "Editó";
  if (raw === "eliminar")
    return entidadLabel ? `Eliminó ${entidadLabel}` : "Eliminó";

  return titleCase(raw);
}

function getEntidadNombre(parsed) {
  if (!parsed || typeof parsed !== "object") return null;

  const value =
    parsed.entidad_nombre ??
    parsed.nombre ??
    parsed.nom_usuario ??
    parsed.detalle?.nom_usuario ??
    parsed.detalle?.nombre;

  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function buildDetallesLegibles(parsed, fallbackText) {
  if (!parsed || typeof parsed !== "object") {
    return fallbackText ? String(fallbackText) : "-";
  }

  // Mejor fuente: `detalle` ya viene como texto humano.
  if (parsed.detalle) {
    if (typeof parsed.detalle === "string") return parsed.detalle;

    // Si `detalle` viene como objeto (muy común), intentamos sacar un resumen legible.
    if (typeof parsed.detalle === "object") {
      const entidadLabel = getEntidadLabel(parsed.entidad);
      const nombreDetalle =
        parsed.detalle?.nom_usuario ??
        parsed.detalle?.nombre ??
        parsed.detalle?.entidad_nombre;

      if (entidadLabel && nombreDetalle) {
        return `${entidadLabel}: ${String(nombreDetalle)}`;
      }

      // Fallback: mostramos el primer campo como resumen.
      const entries = Object.entries(parsed.detalle).filter(
        ([, v]) => v !== null && v !== undefined && v !== "",
      );
      if (entries.length) {
        const [k, v] = entries[0];
        return `${titleCase(k)}: ${formatValueForCell(v)}`;
      }
    }

    return formatValueForCell(parsed.detalle);
  }

  const entidadLabel = getEntidadLabel(parsed.entidad);

  // Si el backend provee el nombre de la entidad afectada, lo usamos.
  if (entidadLabel && parsed.entidad_nombre) {
    return `${entidadLabel}: ${String(parsed.entidad_nombre)}`;
  }

  // Casos frecuentes.
  if (entidadLabel && (parsed.nombre || parsed.nom_usuario)) {
    return `${entidadLabel}: ${String(parsed.nombre ?? parsed.nom_usuario)}`;
  }
  if (entidadLabel && parsed.entidad_id) {
    return `${entidadLabel} ID: ${String(parsed.entidad_id)}`;
  }

  // Si solo viene un objeto simple tipo { nombre: "X" }, lo hacemos legible.
  const ignored = new Set(["modulo", "entidad", "entidad_id", "http"]);
  const entries = Object.entries(parsed).filter(
    ([k, v]) => !ignored.has(k) && v !== null && v !== undefined && v !== "",
  );

  if (entries.length === 0) return fallbackText ? String(fallbackText) : "-";

  const [k, v] = entries[0];
  return `${titleCase(k)}: ${formatValueForCell(v)}`;
}

function buildDetallesFrase(log, parsed) {
  const actor = String(log.usuario_nombre ?? log.usuario_id ?? "Sistema");
  const rawAccion = String(log.accion ?? "")
    .toLowerCase()
    .trim();

  if (rawAccion === "login") return `${actor} inició sesión`;
  if (rawAccion === "logout") return `${actor} cerró sesión`;
  if (rawAccion === "asignar_permisos") {
    const target = getEntidadNombre(parsed);
    return target
      ? `${actor} asignó permisos a ${target}`
      : `${actor} asignó permisos`;
  }
  if (rawAccion === "asignar_roles") {
    const target = getEntidadNombre(parsed);
    return target
      ? `${actor} asignó roles a ${target}`
      : `${actor} asignó roles`;
  }

  const verboMap = {
    crear: "registró",
    editar: "editó",
    eliminar: "eliminó",
  };
  const verbo = verboMap[rawAccion];

  const entidadLabel = getEntidadLabel(parsed?.entidad);
  const entidadLower = entidadLabel ? entidadLabel.toLowerCase() : null;
  const targetName = getEntidadNombre(parsed);
  const targetId = parsed?.entidad_id ? String(parsed.entidad_id) : null;

  if (!verbo) {
    const resumen = buildDetallesLegibles(parsed, log.descripcion);
    return resumen && resumen !== "-" ? `${actor}: ${resumen}` : actor;
  }

  if (entidadLower === "usuario") {
    if (targetName) return `${actor} ${verbo} el usuario de ${targetName}`;
    if (targetId) return `${actor} ${verbo} el usuario ID ${targetId}`;
    return `${actor} ${verbo} un usuario`;
  }

  if (entidadLabel) {
    if (targetName) {
      const tn = targetName.toLowerCase();
      // Evita duplicados como: "editó lote: Lote 3".
      if (
        entidadLower &&
        (tn.startsWith(entidadLower) ||
          tn.startsWith(entidadLabel.toLowerCase()))
      ) {
        return `${actor} ${verbo} ${targetName}`;
      }
      return `${actor} ${verbo} ${entidadLower}: ${targetName}`;
    }
    if (targetId) return `${actor} ${verbo} ${entidadLower} ID ${targetId}`;
    return `${actor} ${verbo} ${entidadLower}`;
  }

  return `${actor} ${verbo}`;
}

function formatFecha(fechaIso) {
  if (!fechaIso) return "-";
  const date = new Date(fechaIso);
  if (Number.isNaN(date.getTime())) return String(fechaIso);
  return date.toLocaleString();
}

function Bitacora() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    fetchBitacora();
  }, []);

  const fetchBitacora = async () => {
    try {
      // Ajusta la URL según tu backend, ej: /bitacora/ o /usuarios/bitacora/
      const res = await api.get("/bitacora/");
      setLogs(res.data);
    } catch (error) {
      console.error("Error al cargar bitácora", error);
    } finally {
      setLoading(false);
    }
  };

  const logsEnriquecidos = logs.map((log) => {
    const parsed = safeParseJson(log.descripcion);
    const http = parsed?.http ?? null;

    const accionLegible = buildAccionLegible(log.accion, parsed);
    const detallesLegibles = buildDetallesLegibles(parsed, log.descripcion);
    const detallesFrase = buildDetallesFrase(log, parsed);

    return {
      ...log,
      _parsedDescripcion: parsed,
      _modulo: parsed?.modulo ?? null,
      _entidad: parsed?.entidad ?? null,
      _entidadId: parsed?.entidad_id ?? null,
      _detalle: parsed?.detalle ?? null,
      _metodo: http?.metodo ?? null,
      _ruta: http?.path ?? null,
      _ip: http?.ip ?? null,
      _accionLegible: accionLegible,
      _detallesLegibles: detallesLegibles,
      _detallesFrase: detallesFrase,
    };
  });

  // Filtrado simple por usuario_id, acción y campos importantes dentro de descripcion(JSON)
  const logsFiltrados = logsEnriquecidos.filter((log) => {
    const term = filtro.toLowerCase();
    return (
      String(log.usuario_nombre ?? "")
        .toLowerCase()
        .includes(term) ||
      String(log.usuario_id ?? "")
        .toLowerCase()
        .includes(term) ||
      String(log.accion ?? "")
        .toLowerCase()
        .includes(term) ||
      String(log._accionLegible ?? "")
        .toLowerCase()
        .includes(term) ||
      String(log._modulo ?? "")
        .toLowerCase()
        .includes(term) ||
      String(log._entidad ?? "")
        .toLowerCase()
        .includes(term) ||
      String(log._entidadId ?? "")
        .toLowerCase()
        .includes(term) ||
      String(log._ruta ?? "")
        .toLowerCase()
        .includes(term) ||
      String(log._ip ?? "")
        .toLowerCase()
        .includes(term) ||
      String(log._detallesFrase ?? "")
        .toLowerCase()
        .includes(term) ||
      String(log._detallesLegibles ?? "")
        .toLowerCase()
        .includes(term) ||
      String(log._detalle ?? "")
        .toLowerCase()
        .includes(term) ||
      String(log.descripcion ?? "")
        .toLowerCase()
        .includes(term)
    );
  });

  return (
    <div className="bita-layout">
      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        showMobileTrigger={false}
      />

      <main
        className="bita-main"
        style={{ marginLeft: isMobile ? "0" : sidebarOpen ? "240px" : "70px" }}
      >
        <Topbar
          titulo="Bitácora"
          subtitulo="Historial de actividades del sistema"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Buscador */}
        <div className="bita-search">
          <Search size={18} color="#9ca3af" />
          <input
            type="text"
            placeholder="Buscar por usuario, acción, detalles, IP..."
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>

        <div className="bita-card">
          {loading ? (
            <p className="bita-loading">Cargando historial...</p>
          ) : (
            <div className="bita-tableWrap">
              <table className="bita-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>
                      <User size={14} className="bita-icon" /> Usuario
                    </th>
                    <th>
                      <Activity size={14} className="bita-icon" /> Acción
                    </th>
                    <th>Detalles</th>
                    <th>IP</th>
                    <th>
                      <Calendar size={14} className="bita-icon" /> Fecha y Hora
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logsFiltrados.map((log, i) => (
                    <tr key={log.id ?? i}>
                      <td>{log.id}</td>
                      <td>
                        <strong>
                          {log.usuario_nombre ?? log.usuario_id ?? "-"}
                        </strong>
                      </td>
                      <td>{log._accionLegible ?? log.accion}</td>
                      <td>{log._detallesFrase ?? "-"}</td>
                      <td>{log._ip ?? "-"}</td>
                      <td>{formatFecha(log.fecha_hora)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Bitacora;
