import { useEffect, useMemo, useState } from "react";
import { Bird, Thermometer } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import StatCard from "../../components/StatCard";
import api from "../../api/axios";
import useIsMobile from "../../hooks/useIsMobile";

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isActivo(estado) {
  return String(estado || "").toLowerCase() === "activo";
}

function Estado() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  const [galpones, setGalpones] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    let alive = true;

    const tick = async () => {
      try {
        const [galRes, lotRes] = await Promise.all([
          api.get("/galpones/"),
          api.get("/lotes/"),
        ]);
        if (!alive) return;
        setGalpones(Array.isArray(galRes.data) ? galRes.data : []);
        setLotes(Array.isArray(lotRes.data) ? lotRes.data : []);
        setLastUpdated(new Date());
      } catch (e) {
        console.error("Error al cargar estado", e);
      } finally {
        if (alive) setLoading(false);
      }
    };

    tick();
    const id = setInterval(tick, 10000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const galponesActivos = useMemo(
    () => galpones.filter((g) => isActivo(g?.estado)),
    [galpones],
  );

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

  const totalLotes = lotes.length;
  const totalAves = useMemo(() => {
    return lotes.reduce(
      (acc, l) => acc + (toNumber(l?.cantidad_actual) ?? 0),
      0,
    );
  }, [lotes]);

  const buildBadge = (tipo) => {
    if (tipo === "riesgo") {
      return {
        background: "#fee2e2",
        color: "#dc2626",
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "700",
      };
    }
    return {
      background: "#dcfce7",
      color: "#16a34a",
      padding: "6px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "700",
    };
  };

  const rowsGalpones = useMemo(() => {
    return galponesActivos.map((g) => {
      const gid = Number(g.id);
      const usado = avesPorGalpon.get(gid) || 0;
      const cap = toNumber(g.capacidad) ?? 0;
      const pct = cap > 0 ? usado / cap : 0;
      const tipo = pct >= 0.9 ? "riesgo" : "normal";
      return {
        ...g,
        _aves: usado,
        _cap: cap,
        _pct: pct,
        _tipo: tipo,
      };
    });
  }, [galponesActivos, avesPorGalpon]);

  const lotesEnriquecidos = useMemo(() => {
    const galponMap = new Map(galpones.map((g) => [Number(g.id), g]));
    return lotes
      .slice()
      .sort((a, b) => (toNumber(b?.id_lote) ?? 0) - (toNumber(a?.id_lote) ?? 0))
      .map((l) => {
        const gid = toNumber(l?.id_galpon);
        const g = gid !== null ? galponMap.get(gid) : null;
        return {
          ...l,
          _galponNombre: g?.nombre || (gid !== null ? `Galpón ${gid}` : "-"),
        };
      });
  }, [lotes, galpones]);

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
            <h1 style={titleStyle}>Estado de Galpones y Lotes</h1>
            <p style={subtitleStyle}>
              Monitoreo en tiempo real (actualiza automáticamente)
            </p>
          </div>
          <div style={rightHeaderStyle}>
            <span style={refreshHintStyle}>Actualiza cada 10s</span>
            <span style={updatedStyle}>
              {lastUpdated
                ? `Última actualización: ${lastUpdated.toLocaleTimeString()}`
                : ""}
            </span>
          </div>
        </div>

        <div style={statsGridStyle}>
          <StatCard
            label="Galpones activos"
            value={loading ? "—" : String(galponesActivos.length)}
            trend={loading ? "Cargando" : "En línea"}
            trendType={loading ? "trend-warn" : "trend-up"}
            icon={<Bird size={22} color="#92400e" />}
            iconBg="#fef3c7"
          />
          <StatCard
            label="Lotes"
            value={loading ? "—" : String(totalLotes)}
            trend={loading ? "Cargando" : "Total"}
            trendType={loading ? "trend-warn" : "trend-up"}
            icon={<Thermometer size={22} color="#92400e" />}
            iconBg="#fef3c7"
          />
          <StatCard
            label="Aves actuales"
            value={loading ? "—" : String(totalAves)}
            trend={loading ? "Cargando" : "Acumulado"}
            trendType={loading ? "trend-warn" : "trend-up"}
            icon={<Bird size={22} color="#92400e" />}
            iconBg="#fef3c7"
          />
        </div>

        <div style={gridStyle}>
          <div style={panelStyle}>
            <h3 style={panelTitleStyle}>Galpones activos</h3>
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr style={theadRowStyle}>
                    <th style={thStyle}>Galpón</th>
                    <th style={thStyle}>Capacidad</th>
                    <th style={thStyle}>Ocupado</th>
                    <th style={thStyle}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} style={emptyTdStyle}>
                        Cargando...
                      </td>
                    </tr>
                  ) : rowsGalpones.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={emptyTdStyle}>
                        No hay galpones activos.
                      </td>
                    </tr>
                  ) : (
                    rowsGalpones.map((g) => (
                      <tr key={g.id} style={trStyle}>
                        <td style={tdStyle}>
                          <strong>{g.nombre}</strong>
                        </td>
                        <td style={tdStyle}>{g._cap} aves</td>
                        <td style={tdStyle}>{g._aves} aves</td>
                        <td style={tdStyle}>
                          <span style={buildBadge(g._tipo)}>
                            {g._tipo === "riesgo" ? "Riesgo" : "Normal"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={panelStyle}>
            <h3 style={panelTitleStyle}>Lotes</h3>
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr style={theadRowStyle}>
                    <th style={thStyle}>Lote</th>
                    <th style={thStyle}>Galpón</th>
                    <th style={thStyle}>Aves</th>
                    <th style={thStyle}>Inicio</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} style={emptyTdStyle}>
                        Cargando...
                      </td>
                    </tr>
                  ) : lotesEnriquecidos.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={emptyTdStyle}>
                        No hay lotes registrados.
                      </td>
                    </tr>
                  ) : (
                    lotesEnriquecidos.map((l) => (
                      <tr key={l.id_lote} style={trStyle}>
                        <td style={tdStyle}>
                          <strong>#{l.id_lote}</strong>
                        </td>
                        <td style={tdStyle}>{l._galponNombre}</td>
                        <td style={tdStyle}>
                          {toNumber(l.cantidad_actual) ?? 0}
                        </td>
                        <td style={tdStyle}>
                          {String(l.fecha_ingreso || "-")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
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
  marginBottom: "24px",
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
const rightHeaderStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "4px",
};
const refreshHintStyle = {
  fontSize: "12px",
  fontWeight: "700",
  color: "#92400e",
  background: "#fef3c7",
  borderRadius: "999px",
  padding: "6px 10px",
};
const updatedStyle = {
  fontSize: "12px",
  color: "#9ca3af",
};
const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "18px",
  marginBottom: "24px",
};
const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "24px",
};
const panelStyle = {
  background: "white",
  borderRadius: "20px",
  padding: "24px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
};
const panelTitleStyle = {
  fontSize: "15px",
  fontWeight: "700",
  color: "#1c1c1c",
  margin: "0 0 16px 0",
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
const emptyTdStyle = { padding: "24px", color: "#9ca3af" };

export default Estado;
