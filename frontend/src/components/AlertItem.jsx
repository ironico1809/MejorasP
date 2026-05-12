function AlertItem({ type, icon, title, desc }) {
  const colors = {
    warn:   '#fef3c7',
    danger: '#fee2e2',
    info:   '#dbeafe',
  }

  return (
    <div style={{ ...itemStyle, background: colors[type] }}>
      <div style={iconStyle}>{icon}</div>
      <div>
        <strong style={titleStyle}>{title}</strong>
        <span style={descStyle}>{desc}</span>
      </div>
    </div>
  )
}

const itemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  padding: '14px',
  borderRadius: '12px',
  marginBottom: '10px',
}
const iconStyle = {
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
}
const titleStyle = {
  display: 'block',
  fontSize: '14px',
  color: '#1c1c1c',
  fontWeight: '600',
}
const descStyle = {
  display: 'block',
  fontSize: '12px',
  color: '#6b7280',
  marginTop: '2px',
}

export default AlertItem