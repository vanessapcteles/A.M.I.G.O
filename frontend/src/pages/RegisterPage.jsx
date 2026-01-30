import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { motion } from 'framer-motion'
import { UserPlus, Mail, Lock, User, ArrowRight } from 'lucide-react'

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
            setMessage({ text: 'Registo efetuado com sucesso! Redirecionando para o login...', type: 'success' })

            setTimeout(() => {
                navigate('/login')
            }, 2500)
        } catch (error) {
            setMessage({ text: error.message, type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at 50% 50%, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%)',
            padding: '2rem'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
                style={{ maxWidth: '480px', width: '100%', padding: '2.5rem' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        boxShadow: '0 8px 16px rgba(14, 165, 233, 0.2)'
                    }}>
                        <UserPlus size={32} color="white" />
                    </div>
                    <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                        Criar Conta
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Junte-se à comunidade Academy Manager
                    </p>
                </div>

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ position: 'relative' }}>
                        <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            name="nome_completo"
                            className="input-field"
                            placeholder="Nome Completo"
                            style={{ paddingLeft: '3rem' }}
                            value={formData.nome_completo}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="email"
                            name="email"
                            className="input-field"
                            placeholder="Email Institucional"
                            style={{ paddingLeft: '3rem' }}
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="password"
                            name="password"
                            className="input-field"
                            placeholder="Palavra-passe"
                            style={{ paddingLeft: '3rem' }}
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="password"
                            name="confirmPassword"
                            className="input-field"
                            placeholder="Confirmar Palavra-passe"
                            style={{ paddingLeft: '3rem' }}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {message.text && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                padding: '1rem',
                                borderRadius: '12px',
                                background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: message.type === 'success' ? '#4ade80' : '#f87171',
                                border: '1px solid currentColor',
                                fontSize: '0.9rem',
                                textAlign: 'center'
                            }}
                        >
                            {message.text}
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ width: '100%', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
                    >
                        {loading ? 'A processar...' : 'Registar Conta'}
                        {!loading && <ArrowRight size={20} />}
                    </button>
                </form>

                <p style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Já tem uma conta? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>Iniciar Sessão</Link>
                </p>
            </motion.div>
        </div>
    )
}

export default RegisterPage;
