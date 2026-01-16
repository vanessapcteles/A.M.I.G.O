import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

function ProfilePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [qrCode, setQrCode] = useState(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [step, setStep] = useState('initial'); // initial, setup, verified

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
            navigate('/login');
            return;
        }
        setUser(currentUser);
    }, [navigate]);

    const handleEnable2FA = async () => {
        try {
            const data = await authService.setup2FA(user.id);
            setQrCode(data.qrCode);
            setStep('setup');
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
        }
    };

    const handleVerify2FA = async () => {
        try {
            await authService.verify2FA(user.id, verificationCode);
            setMessage({ text: '2FA ativado com sucesso!', type: 'success' });
            setStep('verified');
            setQrCode(null);
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
        }
    };

    if (!user) return null;

    return (
        <div className="container">
            <Navbar />
            <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', marginTop: '80px' }}>
                <div className="glass-card">
                    <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'white' }}>O Meu Perfil</h2>

                    <div style={{ marginBottom: '2rem' }}>
                        <p style={{ color: 'var(--text-dim)' }}>Nome: <span style={{ color: 'white' }}>{user.nome || user.nome_completo}</span></p>
                        <p style={{ color: 'var(--text-dim)' }}>Email: <span style={{ color: 'white' }}>{user.email}</span></p>
                        <p style={{ color: 'var(--text-dim)' }}>Cargo: <span style={{ color: 'var(--primary)' }}>{user.tipo_utilizador}</span></p>
                    </div>

                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'white' }}>Segurança (2FA)</h3>

                        {step === 'initial' && (
                            <div>
                                <p style={{ color: 'var(--text-dim)', marginBottom: '1rem' }}>
                                    A autenticação de dois fatores adiciona uma camada extra de segurança à sua conta.
                                </p>
                                <button onClick={handleEnable2FA} className="btn-primary" style={{ width: 'auto' }}>
                                    Ativar 2FA
                                </button>
                            </div>
                        )}

                        {step === 'setup' && (
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', color: 'white' }}>1. Digitalize este QR Code com o Google Authenticator:</p>
                                {qrCode && <img src={qrCode} alt="2FA QR Code" style={{ borderRadius: '12px', border: '5px solid white', marginBottom: '1rem' }} />}

                                <p style={{ marginBottom: '0.5rem', marginTop: '1rem', color: 'white' }}>2. Insira o código gerado:</p>
                                <input
                                    type="text"
                                    className="custom-input"
                                    style={{ maxWidth: '200px', textAlign: 'center', letterSpacing: '2px', fontSize: '1.2rem' }}
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    placeholder="000 000"
                                />

                                <div style={{ marginTop: '1rem' }}>
                                    <button onClick={handleVerify2FA} className="btn-primary" style={{ width: 'auto' }}>
                                        Verificar e Ativar
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'verified' && (
                            <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                <h4 style={{ color: '#4ade80', fontSize: '1.2rem' }}>✅ 2FA Ativo</h4>
                                <p style={{ color: 'var(--text-dim)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>A sua conta está protegida.</p>
                                <button onClick={() => navigate('/')} className="btn-primary" style={{ width: 'auto', backgroundColor: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.5)', color: '#4ade80' }}>
                                    Voltar à Página Principal
                                </button>
                            </div>
                        )}

                        {message.text && (
                            <div style={{
                                marginTop: '1.5rem',
                                padding: '1rem',
                                borderRadius: '12px',
                                backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: message.type === 'success' ? '#4ade80' : '#f87171',
                                border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                                textAlign: 'center'
                            }}>
                                {message.text}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
