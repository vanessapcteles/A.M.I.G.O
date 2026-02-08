import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '../services/authService'
import { motion } from 'framer-motion'
import { LogIn, Eye, EyeOff } from 'lucide-react'

function LoginPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ text: '', type: '' })
    const [show2FA, setShow2FA] = useState(false)
    const [twoFACode, setTwoFACode] = useState('')
    const [showResend, setShowResend] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        const token = searchParams.get('token')
        const userEmail = searchParams.get('user') || searchParams.get('email')
        const userName = searchParams.get('name')
        const userId = searchParams.get('id')
        const userRole = searchParams.get('role')
        const is2FARequired = searchParams.get('requires2FA')

        if (is2FARequired === 'true') {
            setEmail(userEmail)
            setShow2FA(true)
            setMessage({ text: 'Segurança Google: Insira o seu código 2FA.', type: 'info' })
            return;
        }

        if (token) {
            localStorage.setItem('auth_token', token)
            if (userEmail) {
                localStorage.setItem('user', JSON.stringify({
                    id: userId,
                    email: userEmail,
                    nome_completo: userName || 'Utilizador Google',
                    nome: userName,
                    tipo_utilizador: userRole
                }))
            }
            setMessage({ text: 'Login com Google efetuado! A redirecionar...', type: 'success' })
            setTimeout(() => {
                navigate('/dashboard')
            }, 1000)
        }
    }, [searchParams, navigate])

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage({ text: '', type: '' })

        try {
            if (show2FA) {
                const response = await authService.validate2FA(email, twoFACode)
                finishLogin(response)
                return
            }

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
            if (error.message && error.message.toLowerCase().includes('ativada')) {
                setShowResend(true)
            }
        }
    }

    const finishLogin = (response) => {
        if (response.token) localStorage.setItem('auth_token', response.token);
        if (response.user) {
            localStorage.setItem('user', JSON.stringify(response.user));
            setMessage({ text: `Bem-vindo de volta!`, type: 'success' })
            setTimeout(() => {
                navigate('/dashboard')
            }, 800)
        }
    }

    const handleRecover2FA = async () => {
        if (!email) {
            setMessage({ text: 'Por favor, insira o seu email primeiro.', type: 'error' });
            return;
        }
        try {
            setLoading(true);
            await authService.recover2FA(email);
            setMessage({ text: 'Se a conta tiver 2FA, enviámos instruções para o email.', type: 'success' });
        } catch (error) {
            setMessage({ text: 'Erro ao pedir recuperação de 2FA.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    const handleResendActivation = async () => {
        if (!email) {
            setMessage({ text: 'Por favor, insira o seu email no campo acima primeiro.', type: 'info' });
            return;
        }
        try {
            setLoading(true);
            const res = await authService.resendActivation(email);
            setMessage({ text: res.message, type: 'success' });
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    const handleGoogleLogin = () => {
        window.location.href = `${authService.API_URL}/api/auth/google`;
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at center, var(--bg-gradient-start), var(--bg-gradient-end))',
            padding: '2rem'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card"
                style={{ maxWidth: '480px', width: '100%', padding: '3rem' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>A.M.I.G.O</h1>
                    </Link>
                    <p style={{ color: 'var(--text-secondary)' }}>Aceda à sua área de gestão</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {!show2FA ? (
                        <>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Endereço de Email</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    placeholder="exemplo@atec.pt"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Palavra-passe</label>
                                    <Link to="/forgot-password" style={{ color: 'var(--primary)', fontSize: '0.8rem', textDecoration: 'none' }}>Esqueceu-se?</Link>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="input-field"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        style={{ paddingRight: '3rem' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '1rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--text-muted)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '0.2rem'
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div>
                            <label style={{ display: 'block', marginBottom: '1rem', textAlign: 'center', color: 'var(--primary)' }}>Código 2FA</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="000 000"
                                value={twoFACode}
                                onChange={(e) => setTwoFACode(e.target.value)}
                                style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem' }}
                                required
                                autoFocus
                            />
                        </div>
                    )}

                    {message.text && (
                        <div style={{
                            padding: '0.75rem',
                            borderRadius: '10px',
                            backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: message.type === 'success' ? '#10b981' : '#f87171',
                            fontSize: '0.85rem',
                            textAlign: 'center',
                            border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                        }}>
                            {message.text}
                        </div>
                    )}

                    <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', padding: '1rem' }}>
                        {loading ? 'A processar...' : <><LogIn size={20} /> Entrar na Conta</>}
                    </button>

                    {showResend && (
                        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                            <button
                                type="button"
                                onClick={handleResendActivation}
                                style={{
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                    borderRadius: '8px',
                                    color: 'var(--primary)',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    padding: '0.5rem 1rem',
                                    fontWeight: '500',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.2s'
                                }}
                                disabled={loading}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                Reenviar Email de Ativação
                            </button>
                        </div>
                    )}

                    {show2FA && (
                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <button
                                type="button"
                                onClick={handleRecover2FA}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
                                disabled={loading}
                            >
                                Perdeu o acesso ao autenticador?
                            </button>
                        </div>
                    )}

                    {!show2FA && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
                                <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }}></div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>OU</span>
                                <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }}></div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <button type="button" onClick={handleGoogleLogin} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.75rem',
                                    padding: '0.85rem',
                                    background: 'var(--card-hover-bg)',
                                    border: '1px solid var(--border-glass)',
                                    borderRadius: '12px',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    transition: 'var(--transition)',
                                    fontSize: '0.95rem',
                                    width: '100%',
                                    fontWeight: '500'
                                }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Continuar com o Google
                                </button>
                            </div>
                        </>
                    )}
                </form>

                <p style={{ marginTop: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Novo na plataforma? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>Criar conta</Link>
                </p>
            </motion.div>
        </div>
    )
}

export default LoginPage;
