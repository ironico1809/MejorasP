import { useState } from 'react'
import { User, Lock, LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { styles } from './Login.styles'

function Login() {
  const [form, setForm] = useState({ nom_usuario: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/usuarios/login/', form)
      localStorage.setItem('access_token', res.data.access)
      localStorage.setItem('refresh_token', res.data.refresh)
      localStorage.setItem('usuario', JSON.stringify(res.data.usuario))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.pageBg} />

      <div style={styles.card}>
        <div style={styles.topPanel}>
          <div style={styles.topOverlay} />
          <div style={styles.topContent}>
            <div style={styles.logoWrapper}>
              <img src="/logo.png" alt="Logo" style={styles.logo} />
            </div>
            <h1 style={styles.brandTitle}>AviGranja</h1>
            <p style={styles.brandSubtitle}>Sistema de Gestión Avícola</p>
          </div>
        </div>

        <div style={styles.bottomPanel}>
          <h2 style={styles.welcomeText}>Iniciar Sesión</h2>
          <p style={styles.welcomeSub}>Ingresa tus credenciales para continuar</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <User size={18} color="#9ca3af" style={styles.inputIcon} />
              <input
                name="nom_usuario"
                placeholder="Usuario"
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <Lock size={18} color="#9ca3af" style={styles.inputIcon} />
              <input
                name="password"
                type="password"
                placeholder="Contraseña"
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>

            {error && <p style={styles.error}>⚠️ {error}</p>}

            <button
              type="submit"
              style={loading ? { ...styles.button, ...styles.buttonLoading } : styles.button}
              disabled={loading}
            >        
              <LogIn size={18} style={{ marginRight: '8px' }} />
              {loading ? 'Ingresando...' : 'Ingresar al Sistema'}
            </button>
             <button
                type="button"
                onClick={() => navigate('/register')}
                style={{
                  background: 'transparent',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#6b7280',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  fontFamily: "'Poppins', sans-serif",
                  marginTop: '4px',
                }}
              >
                ¿No tienes cuenta? Regístrate
              </button>
          </form>
          <p style={styles.footer}>UAGRM · Sistema Avícola 2026</p>
        </div>
      </div>
    </div>
  )
}

export default Login