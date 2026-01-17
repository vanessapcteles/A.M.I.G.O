import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

function HomePage() {
    return (
        <div className="container">
            <Navbar />

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
                    Academy Manager <span style={{ color: 'var(--primary)' }}>Your Best Choice</span>.
                </h1>
                <p style={{ color: 'var(--text-dim)', fontSize: '1.25rem', maxWidth: '600px', marginBottom: '3rem' }}>
                    Organiza tudo da melhor forma com esta plataforma.
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
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Autenticação 2FA e encriptação de dados.</p>
                    </div>
                    <div>
                        <h3 style={{ color: 'var(--primary)' }}>Simplicidade</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Interface intuitiva.</p>
                    </div>
                    <div>
                        <h3 style={{ color: 'var(--primary)' }}>Integração</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Login social com Google.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default HomePage;
