import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'

function RegisterPage() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        nome_completo: '',
        email: '',
        password: '',
        confirmPassword: '',
        tipo_utilizador: 'candidato'
    })
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ text: '', type: '' })

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage({ text: '', type: '' })

        if (formData.password !== formData.confirmPassword) {
            setMessage({ text: 'As palavras-passe não coincidem.', type: 'error' })
            setLoading(false)
            return
        }

        try {
            const { confirmPassword, ...registerData } = formData
            await authService.register(registerData)
            setMessage({ text: 'Registo efetuado com sucesso! Redirecionando...', type: 'success' })

            setTimeout(() => {
                navigate('/login')
            }, 2000)
        } catch (error) {
            setMessage({ text: error.message, type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem 0' }}>
            <div className="glass-card" style={{ maxWidth: '450px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <Link to="/" style={{ textDecoration: 'none', fontSize: '2rem', fontWeight: 'bold', fontFamily: 'Outfit', color: 'white' }}>
                        Academy <span style={{ color: 'var(--primary)' }}>Manager</span>
                    </Link>
                    <p style={{ color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                        Crie a sua conta para começar
                    </p>
                </div>

                <form onSubmit={handleRegister}>
                    <div className="input-group">
                        <label className="input-label">Nome Completo</label>
                        <input
                            type="text"
                            name="nome_completo"
                            className="custom-input"
                            placeholder="João Silva"
                            value={formData.nome_completo}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="custom-input"
                            placeholder="exemplo@atec.pt"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>



                    <div className="input-group">
                        <label className="input-label">Palavra-passe</label>
                        <input
                            type="password"
                            name="password"
                            className="custom-input"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Confirmar Palavra-passe</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="custom-input"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {message.text && (
                        <div style={{
                            padding: '1rem',
                            borderRadius: '12px',
                            marginBottom: '1.5rem',
                            backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: message.type === 'success' ? '#4ade80' : '#f87171',
                            border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                            fontSize: '0.875rem',
                            textAlign: 'center'
                        }}>
                            {message.text}
                        </div>
                    )}

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'A registar...' : 'Criar Conta'}
                    </button>
                </form>

                <p style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                    Já tem conta? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>Inicie Sessão</Link>
                </p>
            </div>
        </div>
    )
}

export default RegisterPage;
