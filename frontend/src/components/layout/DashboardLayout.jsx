import Sidebar from './Sidebar';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { authService, API_URL } from '../../services/authService';
import { useState, useEffect } from 'react';

const DashboardLayout = ({ children }) => {
    const user = authService.getCurrentUser();
    const [profilePhoto, setProfilePhoto] = useState(null);
    const userName = user ? (user.nome_completo || user.nome || user.email.split('@')[0]) : 'Utilizador';

    useEffect(() => {
        if (user && user.id) {
            loadProfilePhoto();
        }
    }, [user?.id]);

    const loadProfilePhoto = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/api/files/user/${user.id}/photo`, {
                headers: { 'Authorization': `Bearer ${token}` }
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
            console.log("Erro ao carregar foto do dashboard");
        }
    };


    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                <header style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem'
                }}>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Bem-vindo de volta,</h1>
                        <h2 style={{ fontSize: '1.75rem' }}>{userName}</h2>
                    </div>

                    <Link to="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="glass-card" style={{
                            padding: '0.5rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            cursor: 'pointer'
                        }}>
                            <div style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '12px', // Estilo Squircle moderno
                                border: '2px solid var(--primary)',
                                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(59, 130, 246, 0.2))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                color: 'white',
                                overflow: 'hidden',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                                {profilePhoto ? (
                                    <img src={profilePhoto} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ fontSize: '1.2rem', letterSpacing: '1px' }}>
                                        {userName.substring(0, 1).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: '600', fontSize: '0.95rem', color: 'white' }}>{userName}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ver Perfil</span>
                            </div>
                        </div>
                    </Link>
                </header>


                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {children}
                </motion.div>
            </main>
        </div>
    );
};

export default DashboardLayout;
