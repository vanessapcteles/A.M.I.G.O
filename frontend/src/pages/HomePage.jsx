import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

function HomePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
    }, []);

    const handleLogout = () => {
        authService.logout();
        setUser(null);
        navigate('/login');
    };

    return (
        <div className="container">
            <nav style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.5rem 2rem',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100
            }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'Outfit' }}>
                    Academy Manager <span style={{ color: 'var(--primary)' }}>ATEC</span>
                </div>

                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Link to="/profile" style={{ textDecoration: 'none' }}>
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem', cursor: 'pointer' }}>
                                Olá, <span style={{ color: 'white', fontWeight: 'bold' }}>{user.nome || user.nome_completo || user.email.split('@')[0]}</span>
                            </span>
                        </Link>
                        <button onClick={handleLogout} className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1.5rem', fontSize: '0.9rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#f87171' }}>
                            Sair
                        </button>
                    </div>
                ) : (
                    <Link to="/login" className="btn-primary" style={{ width: 'auto', padding: '0.6rem 2rem', textDecoration: 'none' }}>
                        Entrar
                    </Link>
                )}
            </nav>

            <main style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                textAlign: 'center',
                padding: '2rem'
            }}>
                <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem', maxWidth: '800px' }}>
                    A gestão da sua academia num só <span style={{ color: 'var(--primary)' }}>Lugar</span>.
                </h1>
                <p style={{ color: 'var(--text-dim)', fontSize: '1.25rem', maxWidth: '600px', marginBottom: '3rem' }}>
                    Uma plataforma integrada para gerir alunos, cursos e autenticação de forma simples e segura.
                </p>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-primary" style={{ width: 'auto', padding: '1rem 3rem' }}>
                        Saiba Mais
                    </button>
                    <Link to="/register" className="social-btn" style={{ width: 'auto', padding: '1rem 3rem', margin: 0, textDecoration: 'none' }}>
                        Registar Agora
                    </Link>
                </div>

                <div className="glass-card" style={{ marginTop: '5rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', textAlign: 'left' }}>
                    <div>
                        <h3 style={{ color: 'var(--primary)' }}>Segurança</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Autenticação 2FA e encriptação de dados de última geração.</p>
                    </div>
                    <div>
                        <h3 style={{ color: 'var(--primary)' }}>Simplicidade</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Interface intuitiva desenhada para a melhor experiência do utilizador.</p>
                    </div>
                    <div>
                        <h3 style={{ color: 'var(--primary)' }}>Integração</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Login social com Google e Facebook integrado.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default HomePage;
