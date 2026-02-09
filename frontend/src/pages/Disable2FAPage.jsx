import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { motion } from 'framer-motion';
import { ShieldOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';

function Disable2FAPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('A processar o pedido...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Token inválido ou em falta.');
            return;
        }

        const disable = async () => {
            try {
                await authService.disable2FA(token);
                // LIMPEZA CRÍTICA: Garantir que não fica lixo de sessões antigas
                localStorage.removeItem('user');
                localStorage.removeItem('auth_token');

                setStatus('success');
                setMessage('2FA desativado com sucesso! Já pode entrar na sua conta sem código.');
                setTimeout(() => navigate('/login'), 4000);
            } catch (error) {
                setStatus('error');
                setMessage(error.message || 'Erro ao desativar 2FA.');
            }
        };

        disable();
    }, [token, navigate]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #020617 100%)',
            padding: '2rem'
        }}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="glass-card"
                style={{ maxWidth: '450px', width: '100%', textAlign: 'center', padding: '3rem', visibility: 'visible' }}
            >
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    color: 'var(--primary)'
                }}>
                    <ShieldOff size={32} />
                </div>

                <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: 'white' }}>Segurança 2FA</h2>

                {status === 'loading' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <Loader2 className="animate-spin" size={24} color="var(--primary)" />
                        <p style={{ color: 'var(--text-muted)' }}>{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        <CheckCircle size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
                        <p style={{ color: '#d1d5db', marginBottom: '2rem', lineHeight: '1.6' }}>{message}</p>
                        <Link to="/login" className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                            Concluir e Fazer Login
                        </Link>
                    </motion.div>
                )}

                {status === 'error' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        <XCircle size={48} color="#f87171" style={{ marginBottom: '1rem' }} />
                        <p style={{ color: '#f87171', marginBottom: '2rem', lineHeight: '1.6' }}>{message}</p>
                        <Link to="/login" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>
                            Voltar ao Portal de Login
                        </Link>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}

export default Disable2FAPage;
