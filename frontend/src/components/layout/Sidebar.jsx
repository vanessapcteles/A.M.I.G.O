import { NavLink, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import {
    LayoutDashboard,
    BookOpen,
    Users,
    GraduationCap,
    Calendar,
    DoorOpen,
    Settings,
    LogOut,
    FileText,
    Sun,
    Moon,
    Clock,
    X
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Sidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    const user = authService.getCurrentUser();
    const role = user?.tipo_utilizador?.toUpperCase();

    // Perfils simplificados
    const isAdmin = role === 'ADMIN';
    const isSecretaria = role === 'SECRETARIA';
    const isStaff = isAdmin || isSecretaria;
    const isFormando = role === 'FORMANDO';
    const isFormador = role === 'FORMADOR';
    const isCandidato = role === 'CANDIDATO';

    const menuGroups = [
        {
            title: 'Menu Principal',
            items: [
                {
                    icon: LayoutDashboard,
                    label: isCandidato ? 'Minha Candidatura' : 'Dashboard',
                    path: isCandidato ? '/candidato' : '/dashboard'
                },
                ...(isFormando ? [
                    { icon: BookOpen, label: 'Meu Curso', path: '/my-course' },
                    { icon: Calendar, label: 'Horário', path: '/schedules' },
                    { icon: GraduationCap, label: 'Avaliações', path: '/grades' },
                    { icon: FileText, label: 'Minha Ficha', path: '/formando-ficha' },
                ] : []),
                ...(isFormador ? [
                    { icon: FileText, label: 'Minha Ficha', path: '/formador-ficha' },
                    { icon: Clock, label: 'Disponibilidade', path: '/trainer-availability' },
                ] : [])
            ]
        },
        ...(isStaff ? [
            {
                title: 'Gestão Escolar',
                items: [
                    { icon: FileText, label: 'Candidaturas', path: '/candidaturas' },
                    { icon: Users, label: 'Formandos', path: '/formandos' },
                    { icon: Users, label: 'Formadores', path: '/formadores' },
                    { icon: BookOpen, label: 'Cursos', path: '/courses' },
                    { icon: GraduationCap, label: 'Módulos', path: '/modules' },
                ]
            },
            {
                title: 'Logística',
                items: [
                    { icon: Users, label: 'Turmas', path: '/turmas' },
                    { icon: DoorOpen, label: 'Salas', path: '/rooms' },
                    { icon: Calendar, label: 'Planeamento', path: '/schedules' },
                ]
            }
        ] : []),
        ...(isFormador ? [
            {
                title: 'Aulas & Notas',
                items: [
                    { icon: Users, label: 'Minhas Turmas', path: '/turmas' },
                    { icon: GraduationCap, label: 'Lançar Notas', path: '/trainer-grades' },
                    { icon: Calendar, label: 'Horários', path: '/schedules' },
                ]
            }
        ] : [])
    ];

    const handleLogout = () => {
        authService.logout();
        navigate('/'); // Redirecionar para a Landing Page
    };

    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{ boxShadow: isOpen ? '20px 0 50px rgba(0,0,0,0.3)' : 'none' }}>
            <button
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: '1.25rem',
                    right: '1rem',
                    display: 'none',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10
                }}
                id="sidebar-close-btn"
            >
                <X size={20} />
            </button>
            <style>
                {`
                    @media (max-width: 1024px) {
                        #sidebar-close-btn { display: flex !important; }
                    }
                `}
            </style>

            <div style={{
                padding: '1.5rem 0 2rem 0',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem'
            }}>
                <img
                    src="/logo_website.png"
                    alt="Logo"
                    style={{
                        maxHeight: '70px',
                        width: 'auto',
                        objectFit: 'contain',
                        borderRadius: '12px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                    }}
                />

                <h1 className="text-gradient" style={{
                    fontSize: '1.8rem',
                    fontWeight: '900',
                    letterSpacing: '3px',
                    margin: 0,
                    lineHeight: 1
                }}>
                    A.M.I.G.<span style={{ color: 'var(--primary)' }}>O</span>
                </h1>
            </div>

            <nav style={{ flex: 1, overflowY: 'auto', margin: '0 -0.5rem', padding: '0 0.5rem' }}>
                {menuGroups.map((group, gIndex) => (
                    <div key={gIndex} style={{ marginBottom: '1.5rem' }}>
                        <div className="sidebar-group-title">{group.title}</div>
                        {group.items.map((item, index) => (
                            <NavLink
                                key={index}
                                to={item.path}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                onClick={() => {
                                    if (window.innerWidth <= 1024) onClose();
                                }}
                            >
                                <item.icon size={18} />
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                ))}

                {isStaff && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div className="sidebar-group-title">Administração</div>
                        <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <Users size={18} />
                            <span>Utilizadores</span>
                        </NavLink>
                    </div>
                )}
            </nav>

            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
                <button
                    onClick={toggleTheme}
                    className="nav-link"
                    style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    <span>{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
                </button>

                <NavLink to="/profile" className="nav-link">
                    <Settings size={20} />
                    <span>Configurações</span>
                </NavLink>
                <button
                    onClick={handleLogout}
                    className="nav-link"
                    style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                    <LogOut size={20} />
                    <span>Sair</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
