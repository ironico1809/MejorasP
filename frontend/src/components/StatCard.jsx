function StatCard({ label, value, trend, trendType, icon, iconBg }) {
  const trendColors = {
    'trend-up':   { background: '#dcfce7', color: '#16a34a' },
    'trend-down': { background: '#fee2e2', color: '#dc2626' },
    'trend-warn': { background: '#fef3c7', color: '#d97706' },
  }

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <div style={{ ...iconWrapperStyle, background: iconBg }}>
          {icon}
        </div>
        <span style={{ ...trendStyle, ...trendColors[trendType] }}>
          {trend}
        </span>
      </div>
      <div style={valueStyle}>{value}</div>
      <div style={labelStyle}>{label}</div>
    </div>
  )
}

const cardStyle = {
  background: 'white',
  borderRadius: '20px',
  padding: '24px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
}
const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}
const iconWrapperStyle = {
  width: '48px', height: '48px',
  borderRadius: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
const trendStyle = {
  fontSize: '12px',
  fontWeight: '600',
  padding: '4px 10px',
  borderRadius: '20px',
}
const valueStyle = {
  fontSize: '32px',
  fontWeight: '700',
  color: '#1c1c1c',
}
const labelStyle = {
  fontSize: '13px',
  color: '#9ca3af',
  fontWeight: '500',
}

export default StatCard