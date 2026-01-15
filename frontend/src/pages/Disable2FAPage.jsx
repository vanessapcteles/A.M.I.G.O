import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';

function Disable2FAPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [status, setStatus] = useState('loading'); // loading, success, error
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
                setStatus('success');
                setMessage('2FA desativado com sucesso! Já pode entrar na sua conta.');
                setTimeout(() => navigate('/login'), 3000);
            } catch (error) {
                setStatus('error');
                setMessage(error.message || 'Erro ao desativar 2FA.');
            }
        };

        disable();
    }, [token, navigate]);

    return (
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <div className="glass-card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'white' }}>Recuperação de 2FA</h2>

                {status === 'loading' && (
                    <p style={{ color: 'var(--text-dim)' }}>⏳ A validar token...</p>
                )}

                {status === 'success' && (
                    <div style={{ padding: '1rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                        <p style={{ color: '#4ade80', marginBottom: '1rem' }}>{message}</p>
                        <Link to="/login" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                            Ir para Login
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <p style={{ color: '#f87171', marginBottom: '1rem' }}>{message}</p>
                        <Link to="/login" style={{ color: 'var(--text-dim)', textDecoration: 'underline' }}>
                            Voltar ao Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Disable2FAPage;
