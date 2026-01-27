import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Mail, Save, Smartphone, ShieldAlert, CheckCircle2, Upload, Camera } from 'lucide-react';
import { API_URL, getAuthHeader } from '../services/authService';
import { motion } from 'framer-motion';

function ProfilePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [nome_completo, setNomeCompleto] = useState('');
    const [qrCode, setQrCode] = useState(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [step, setStep] = useState('initial');
    const [loading, setLoading] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
            navigate('/login');
            return;
        }
        setUser(currentUser);
        setNomeCompleto(currentUser.nome_completo || currentUser.nome || '');
        // Corrigido para o nome correto da coluna na DB
        if (currentUser.two_fa_enabled) setStep('verified');
        loadProfilePhoto(currentUser.id);
    }, [navigate]);

    const loadProfilePhoto = async (userId) => {
        try {
            const response = await fetch(`${API_URL}/api/files/user/${userId}/photo`, {
                headers: getAuthHeader()
            });
            if (response.ok) {
                const blob = await response.blob();
                const base64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
                setProfilePhoto(base64);
            }
        } catch (e) {
            console.log("Sem foto de perfil");
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('categoria', 'foto');

        setUploading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/api/files/user/${user.id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                loadProfilePhoto(user.id);
                setMessage({ text: 'Foto de perfil atualizada!', type: 'success' });
                // Trigger refresh in potential other components (like DashboardLayout)
                window.dispatchEvent(new Event('storage'));
            }
        } catch (error) {
            setMessage({ text: 'Erro ao carregar foto', type: 'error' });
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            await authService.updateProfile(user.id, { nome_completo });
            setMessage({ text: 'Perfil atualizado com sucesso!', type: 'success' });

            // Atualizar o estado local sem reload
            const updated = { ...user, nome_completo };
            setUser(updated);
            localStorage.setItem('user', JSON.stringify(updated));

        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

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
            const response = await authService.verify2FA(user.id, verificationCode);

            // Sincronizar o utilizador no localStorage para não perder a ROLE
            if (response.user) {
                const updatedUser = { ...response.user, two_fa_enabled: true };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
            }

            setMessage({ text: 'Proteção 2FA configurada e ativa!', type: 'success' });
            setStep('verified');
            setQrCode(null);
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
        }
    };

    const handleDisable2FAAuthenticated = async () => {
        if (!window.confirm('Tem a certeza que deseja desativar a proteção 2FA?')) return;

        try {
            setLoading(true);
            // Fazemos o pedido de recuperação para o email por segurança
            await authService.recover2FA(user.email);
            setMessage({
                text: 'Enviámos um link de desativação para o seu email por motivos de segurança.',
                type: 'success'
            });
        } catch (error) {
            setMessage({ text: 'Erro ao processar pedido.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Informações Básicas */}
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <User className="text-gradient" size={24} />
                        <h3 style={{ fontSize: '1.5rem' }}>Informações Pessoais</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '30px',
                                border: '3px solid var(--primary)',
                                background: 'rgba(255,255,255,0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                            }}>
                                {profilePhoto ? (
                                    <img src={profilePhoto} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <User size={60} style={{ opacity: 0.2 }} />
                                )}
                            </div>
                            <label style={{
                                position: 'absolute',
                                bottom: '-10px',
                                right: '-10px',
                                width: '40px',
                                height: '40px',
                                backgroundColor: 'var(--primary)',
                                borderRadius: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                border: '4px solid #0f172a',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                transition: 'transform 0.2s'
                            }} className="hover-scale">
                                <Camera size={20} color="white" />
                                <input type="file" onChange={handlePhotoUpload} style={{ display: 'none' }} disabled={uploading} />
                            </label>
                        </div>
                        <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {uploading ? 'A carregar...' : 'Clique na câmara para alterar a sua foto'}
                        </p>
                    </div>

                    <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Nome Completo</label>
                            <input
                                type="text"
                                className="input-field"
                                value={nome_completo}
                                onChange={(e) => setNomeCompleto(e.target.value)}
                                placeholder="Seu nome"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Endereço de Email</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '10px' }}>
                                <Mail size={18} color="var(--text-muted)" />
                                <span style={{ color: 'var(--text-muted)' }}>{user.email}</span>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: 'auto', alignSelf: 'flex-start' }}>
                            <Save size={18} />
                            {loading ? 'A guardar...' : 'Guardar Alterações'}
                        </button>
                    </form>
                </div>

                {/* Segurança / 2FA */}
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <Shield className="text-gradient" size={24} />
                        <h3 style={{ fontSize: '1.5rem' }}>Segurança da Conta</h3>
                    </div>

                    {step === 'initial' && (
                        <div>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                A autenticação de dois fatores (2FA) adiciona uma camada extra de proteção.
                            </p>
                            <button onClick={handleEnable2FA} className="btn-primary" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', border: '1px solid var(--primary)' }}>
                                <Smartphone size={18} />
                                Configurar 2FA
                            </button>
                        </div>
                    )}

                    {step === 'setup' && (
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>1. Digitalize o QR Code com a sua App:</p>
                            {qrCode && (
                                <div style={{ background: 'white', padding: '1rem', borderRadius: '15px', display: 'inline-block', marginBottom: '1.5rem' }}>
                                    <img src={qrCode} alt="2FA" style={{ display: 'block' }} />
                                </div>
                            )}
                            <input
                                type="text"
                                className="input-field"
                                style={{ maxWidth: '200px', textAlign: 'center', letterSpacing: '5px', fontSize: '1.25rem', marginBottom: '1.5rem' }}
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder="000000"
                            />
                            <button onClick={handleVerify2FA} className="btn-primary" style={{ width: '100%' }}>
                                Verificar e Ativar
                            </button>
                        </div>
                    )}

                    {step === 'verified' && (
                        <div style={{
                            padding: '2rem',
                            borderRadius: '15px',
                            background: 'rgba(16, 185, 129, 0.05)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            textAlign: 'center'
                        }}>
                            <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 1rem' }} />
                            <h4 style={{ color: '#10b981', marginBottom: '0.5rem' }}>Proteção Digital Ativa</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem' }}>O seu acesso está protegido por 2FA.</p>

                            <button
                                onClick={handleDisable2FAAuthenticated}
                                style={{
                                    background: 'none',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#f87171',
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    margin: '0 auto'
                                }}
                            >
                                <ShieldAlert size={16} />
                                Desativar Proteção
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {
                message.text && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            position: 'fixed',
                            bottom: '2rem',
                            right: '2rem',
                            padding: '1rem 2rem',
                            borderRadius: '12px',
                            background: message.type === 'success' ? '#10b981' : '#f87171',
                            color: 'white',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
                            zIndex: 1000
                        }}
                    >
                        {message.text}
                    </motion.div>
                )
            }
        </>
    );
}

export default ProfilePage;
