function Button({ text, loadingText = 'Cargando...', loading = false, icon, onClick, type = 'submit' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      style={loading ? { ...buttonStyle, ...buttonLoadingStyle } : buttonStyle}
    >
      {!loading && icon && <span style={{ marginRight: '8px', display: 'flex' }}>{icon}</span>}
      {loading ? loadingText : text}
    </button>
  )
}

const buttonStyle = {
  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  padding: '15px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
  boxShadow: '0 6px 20px rgba(245,158,11,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  fontFamily: "'Poppins', sans-serif",
  transition: 'opacity 0.2s',
}

const buttonLoadingStyle = {
  background: '#d1d5db',
  boxShadow: 'none',
  cursor: 'not-allowed',
}

export default Button