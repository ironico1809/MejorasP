import { User, Menu } from 'lucide-react'

function Topbar({ titulo, subtitulo, sidebarOpen, setSidebarOpen }) {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')

  return (
    <div style={topbarStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {!sidebarOpen && (
          <button onClick={() => setSidebarOpen(true)} style={menuBtnStyle}>
            <Menu size={20} color="#78350f" />
          </button>
        )}
        <div>
          <h1 style={titleStyle}>{titulo}</h1>
          <p style={subtitleStyle}>{subtitulo}</p>
        </div>
      </div>
      <div style={badgeStyle}>
        <User size={18} color="#78350f" />
        <span style={badgeTextStyle}>{usuario.nom_usuario || 'Usuario'}</span>
      </div>
    </div>
  )
}

const topbarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '32px',
}
const menuBtnStyle = {
  background: 'white',
  border: '1.5px solid #e5e7eb',
  borderRadius: '10px',
  padding: '8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  flexShrink: 0,
}
const titleStyle = {
  fontSize: '22px', fontWeight: '700',
  color: '#1c1c1c', margin: 0,
}
const subtitleStyle = {
  fontSize: '13px', color: '#9ca3af', marginTop: '2px',
}
const badgeStyle = {
  display: 'flex', alignItems: 'center',
  gap: '10px', background: 'white',
  padding: '8px 16px', borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
}
const badgeTextStyle = {
  fontSize: '13px', fontWeight: '600', color: '#78350f',
}

export default Topbar