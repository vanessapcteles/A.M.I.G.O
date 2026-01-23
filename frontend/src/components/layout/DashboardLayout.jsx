import Sidebar from './Sidebar';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';

const DashboardLayout = ({ children }) => {
    const user = authService.getCurrentUser();
    const userName = user ? (user.nome_completo || user.nome || user.email.split('@')[0]) : 'Utilizador';

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
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                color: 'white'
                            }}>
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: '500' }}>{userName}</span>
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
