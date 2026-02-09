import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', text: '' });

        try {
            await authService.forgotPassword(email);
            setStatus({
                type: 'success',
                text: 'Se este email estiver registado, receberá um link de recuperação em breve.'
            });
        } catch (err) {
            setStatus({
                type: 'error',
                text: 'Ocorreu um erro ao processar o seu pedido. Tente novamente.'
            });
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="glass-card"
                style={{ maxWidth: '480px', width: '100%', padding: '3rem' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'rgba(56, 189, 248, 0.1)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        border: '1px solid var(--border-glass)'
                    }}>
                        <Mail size={30} color="var(--primary)" />
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.75rem' }}>Recuperar Acesso</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        Introduza o seu email institucional para receber as instruções de recuperação.
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {status.text ? (
                        <motion.div
                            key="status"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                padding: '1.25rem',
                                borderRadius: '12px',
                                backgroundColor: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: status.type === 'success' ? '#10b981' : '#f87171',
                                fontSize: '0.9rem',
                                textAlign: 'center',
                                border: `1px solid ${status.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                                marginBottom: '2rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}
                        >
                            {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                            <span style={{ flex: 1 }}>{status.text}</span>
                        </motion.div>
                    ) : null}
                </AnimatePresence>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                            Endereço de Email
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="email"
                                className="input-field"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ paddingLeft: '3rem' }}
                                placeholder="exemplo@atec.pt"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading || (status.type === 'success')}
                        style={{ justifyContent: 'center', padding: '1rem', width: '100%' }}
                    >
                        {loading ? 'A enviar...' : (
                            <>
                                <Send size={18} />
                                {status.type === 'success' ? 'Link Enviado' : 'Enviar Link de Recuperação'}
                            </>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                    <Link to="/login" style={{
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'var(--transition)'
                    }} className="btn-glass">
                        <ArrowLeft size={16} /> Voltar ao Início de Sessão
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
