import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '../services/authService'

function LoginPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ text: '', type: '' })

    // Estados para 2FA
    const [show2FA, setShow2FA] = useState(false)
    const [twoFACode, setTwoFACode] = useState('')

    // Validar token do Google (se existir na URL) ou pedido de 2FA
    useEffect(() => {
        const token = searchParams.get('token')
        const userEmail = searchParams.get('user') || searchParams.get('email') // Pode vir como 'email' no caso do 2FA
        const userName = searchParams.get('name')
        const userId = searchParams.get('id')
        const is2FARequired = searchParams.get('requires2FA')

        // Caso 1: Login Google com 2FA necessário
        if (is2FARequired === 'true') {
            setEmail(userEmail)
            setShow2FA(true)
            setMessage({ text: 'Segurança Google: Insira o seu código 2FA.', type: 'info' })
            return;
        }

        // Caso 2: Login com Sucesso (Local ou Google sem 2FA)
        if (token) {
            // Guardar token
            localStorage.setItem('auth_token', token)

            // Guardar dados do user (com nome real e ID vindos do backend)
            if (userEmail) {
                localStorage.setItem('user', JSON.stringify({
                    id: userId,
                    email: userEmail,
                    nome_completo: userName || 'Utilizador Google',
                    nome: userName // Fallback
                }))
            }

            setMessage({ text: 'Login com Google efetuado! A redirecionar...', type: 'success' })

            // Redirecionar após breve delay visual
            setTimeout(() => {
                navigate('/')
                window.location.reload() // Forçar reload para atualizar navbar
            }, 1500)
        }
    }, [searchParams, navigate])

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage({ text: '', type: '' })

        try {
            // Se já estivermos no passo 2FA, validamos o token
            if (show2FA) {
                const response = await authService.validate2FA(email, twoFACode)
                finishLogin(response)
                return
            }

            // Passo 1: Login normal
            const response = await authService.login(email, password)

            if (response.requires2FA) {
                setShow2FA(true)
                setMessage({ text: 'Por favor, insira o código 2FA da sua app.', type: 'info' })
                setLoading(false)
            } else {
                finishLogin(response)
            }

        } catch (error) {
            setMessage({ text: error.message, type: 'error' })
            setLoading(false)
        }
    }

    const finishLogin = (response) => {
        if (response.token) {
            localStorage.setItem('auth_token', response.token);
        }

        if (response.user) {
            localStorage.setItem('user', JSON.stringify(response.user));

            setMessage({ text: `Bem-vindo, ${response.user.nome_completo}!`, type: 'success' })
            setTimeout(() => {
                navigate('/')
                window.location.reload()
            }, 1000)
        }
    }

    const handleGoogleLogin = () => {
        // Redirecionar para o backend que inicia o OAuth
        window.location.href = `${authService.API_URL}/api/auth/google`;
    }

    const handleRecover2FA = async () => {
        if (!email) return;
        try {
            setMessage({ text: 'A enviar instruções para o seu email...', type: 'info' })
            const res = await authService.recover2FA(email);
            setMessage({ text: res.message, type: 'success' })
        } catch (error) {
            setMessage({ text: 'Erro ao enviar pedido.', type: 'error' })
        }
    }

    return (
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <div className="glass-card" style={{ maxWidth: '450px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <Link to="/" style={{ textDecoration: 'none', fontSize: '2rem', fontWeight: 'bold', fontFamily: 'Outfit', color: 'white' }}>
                        Academy <span style={{ color: 'var(--primary)' }}>Manager</span>
                    </Link>
                    <p style={{ color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                        Inicie sessão para gerir a sua academia
                    </p>
                </div>

                <form onSubmit={handleLogin}>
                    {!show2FA ? (
                        <>
                            <div className="input-group">
                                <label className="input-label">Email</label>
                                <input
                                    type="email"
                                    className="custom-input"
                                    placeholder="exemplo@atec.pt"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Palavra-passe</label>
                                <input
                                    type="password"
                                    className="custom-input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
                                <Link to="/forgot-password" style={{ color: 'var(--primary)', fontSize: '0.875rem', textDecoration: 'none' }}>
                                    Esqueceu a palavra-passe?
                                </Link>
                            </div>
                        </>
                    ) : (
                        <div className="input-group">
                            <label className="input-label" style={{ color: '#4ade80' }}>Código de Autenticação (2FA)</label>
                            <input
                                type="text"
                                className="custom-input"
                                placeholder="000 000"
                                value={twoFACode}
                                onChange={(e) => setTwoFACode(e.target.value)}
                                style={{ textAlign: 'center', letterSpacing: '3px', fontSize: '1.2rem', borderColor: '#4ade80' }}
                                required
                                autoFocus
                            />
                            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                                <button type="button" onClick={handleRecover2FA} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>
                                    Perdeu o acesso ao autenticador?
                                </button>
                            </div>
                        </div>
                    )}

                    {message.text && (
                        <div style={{
                            padding: '1rem',
                            borderRadius: '12px',
                            marginBottom: '1.5rem',
                            backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : (message.type === 'info' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)'),
                            color: message.type === 'success' ? '#4ade80' : (message.type === 'info' ? '#60a5fa' : '#f87171'),
                            border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : (message.type === 'info' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)')}`,
                            fontSize: '0.875rem',
                            textAlign: 'center'
                        }}>
                            {message.text}
                        </div>
                    )}

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'A validar...' : (show2FA ? 'Confirmar Código' : 'Entrar')}
                    </button>

                    {!show2FA && (
                        <>
                            <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>OU</span>
                                <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                            </div>

                            <button type="button" className="social-btn" onClick={handleGoogleLogin}>
                                <img src="https://www.svgrepo.com/show/475656/google.svg" width="20" alt="Google" />
                                Continuar com Google
                            </button>

                            <button type="button" className="social-btn">
                                <img src="https://www.svgrepo.com/show/475647/facebook.svg" width="20" alt="Facebook" />
                                Continuar com Facebook
                            </button>
                        </>
                    )}
                </form>

                <p style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                    Ainda não tem conta? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>Registe-se</Link>
                </p>
            </div>
        </div>
    )
}

export default LoginPage;
