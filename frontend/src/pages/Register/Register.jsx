import { useState } from 'react'
import { User, Lock, Mail, UserPlus, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import InputField from '../../components/InputField'
import Button from '../../components/Button'
import { styles } from '../Login/Login.styles'
import { registerStyles } from './Register.styles'

function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nom_usuario: '', email: '', password: '', confirmar_password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmar_password) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/usuarios/registro/', {
        nom_usuario: form.nom_usuario,
        email: form.email,
        password: form.password,
      })
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar usuario')
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
            <div style={registerStyles.iconWrapper}>
              <UserPlus size={48} color="#fbbf24" />
            </div>
            <h1 style={styles.brandTitle}>AviGranja</h1>
            <p style={styles.brandSubtitle}>Crear nueva cuenta</p>
          </div>
        </div>

        <div style={styles.bottomPanel}>
          <h2 style={styles.welcomeText}>Registro</h2>
          <p style={styles.welcomeSub}>Completa los datos para registrarte</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <InputField
              icon={<User size={18} color="#9ca3af" />}
              name="nom_usuario"
              placeholder="Nombre de usuario"
              onChange={handleChange}
            />
            <InputField
              icon={<Mail size={18} color="#9ca3af" />}
              name="email"
              type="email"
              placeholder="Correo electrónico"
              onChange={handleChange}
            />
            <InputField
              icon={<Lock size={18} color="#9ca3af" />}
              name="password"
              type="password"
              placeholder="Contraseña"
              onChange={handleChange}
            />
            <InputField
              icon={<Lock size={18} color="#9ca3af" />}
              name="confirmar_password"
              type="password"
              placeholder="Confirmar contraseña"
              onChange={handleChange}
            />

            {error && <p style={styles.error}>⚠️ {error}</p>}

            <Button
              text="Crear cuenta"
              loadingText="Registrando..."
              loading={loading}
              icon={<UserPlus size={18} />}
            />

            <button
              type="button"
              onClick={() => navigate('/')}
              style={registerStyles.backButton}
            >
              <ArrowLeft size={16} style={{ marginRight: '6px' }} />
              Volver al inicio de sesión
            </button>
          </form>

          <p style={styles.footer}>UAGRM · Sistema Avícola 2026</p>
        </div>
      </div>
    </div>
  )
}

export default Register