import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authService } from '../../services/authService';

function Navbar() {
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

    const isAdminOrSecretaria = user && (user.tipo_utilizador === 'ADMIN' || user.tipo_utilizador === 'SECRETARIA');

    return (
        <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.5rem 2rem',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(10px)'
        }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'Outfit' }}>
                <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
                    A.M.I.G.<span style={{ color: 'var(--primary)' }}>O</span>
                </Link>
            </div>

            {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>

                    {isAdminOrSecretaria && (
                        <>
                            <Link to="/candidaturas" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>
                                Candidaturas
                            </Link>
                            <Link to="/users" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>
                                Gerir Utilizadores
                            </Link>
                        </>
                    )}

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
    );
}

export default Navbar;
