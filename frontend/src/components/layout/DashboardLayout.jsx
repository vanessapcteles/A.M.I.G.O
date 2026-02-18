import Sidebar from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { authService, API_URL } from '../../services/authService';
import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Menu } from 'lucide-react';

const DashboardLayout = ({ children }) => {
    const { isDarkMode } = useTheme();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const user = authService.getCurrentUser();
    const role = user?.tipo_utilizador?.toUpperCase();
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
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Overlay para fechar sidebar no mobile */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                            zIndex: 1000, display: 'none'
                        }}
                        id="sidebar-overlay"
                    />
                )}
            </AnimatePresence>

            <main className="main-content">
                <header style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem',
                    padding: '0.5rem 0',
                    position: 'relative',
                    zIndex: 100
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="btn-glass"
                            style={{
                                display: 'none',
                                width: '44px',
                                height: '44px',
                                padding: '0',
                                borderRadius: '12px',
                                justifyContent: 'center',
                                border: '1px solid var(--border-glass)',
                                background: 'var(--bg-card)'
                            }}
                            id="mobile-hamburger-btn"
                        >
                            <Menu size={24} />
                        </button>

                        <h1 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', fontWeight: '800', letterSpacing: '-0.02em', lineHeight: '1' }}>
                            Olá, <span className="text-gradient">{userName.split(' ')[0]}</span> 👋
                        </h1>
                    </div>

                    <Link to="/profile" style={{ textDecoration: 'none' }}>
                        <div className="glass-card profile-pill" style={{
                            padding: '0.4rem 1.25rem 0.4rem 0.4rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            cursor: 'pointer',
                            borderRadius: '50px',
                            background: isDarkMode ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.5)',
                            border: '1px solid var(--border-glass)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                            transition: 'all 0.3s ease'
                        }}>
                            <div style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                border: '2px solid var(--primary)',
                                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                color: 'white',
                                overflow: 'hidden',
                                boxShadow: '0 0 10px var(--primary-glow)'
                            }}>
                                {profilePhoto ? (
                                    <img src={profilePhoto} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ fontSize: '0.8rem' }}>
                                        {userName.substring(0, 1).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }} className="hidden-mobile">
                                <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{userName}</span>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{role}</span>
                            </div>
                        </div>
                    </Link>
                </header>

                <style>
                    {`
                        @media (max-width: 1024px) {
                            #sidebar-overlay { display: block !important; }
                            #mobile-hamburger-btn { display: flex !important; }
                            .hidden-mobile { display: none !important; }
                            .profile-pill { padding: 0.4rem !important; }
                        }
                        @media (max-width: 480px) {
                             h1 { font-size: 1.2rem !important; }
                             .profile-pill { padding: 0.25rem !important; gap: 0.5rem !important; }
                        }
                    `}
                </style>


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
