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
    FileText
} from 'lucide-react';

const Sidebar = () => {
    const navigate = useNavigate();

    const user = authService.getCurrentUser();
    // Verificações de Funções
    const role = user?.tipo_utilizador?.toUpperCase();
    const isAdmin = role === 'ADMIN';
    const isSecretaria = role === 'SECRETARIA';
    const canManageRooms = ['ADMIN', 'SECRETARIA', 'FORMADOR'].includes(role);
    const canManageCandidacies = ['ADMIN', 'SECRETARIA'].includes(role);
    const isCandidato = role === 'CANDIDATO';

    const menuItems = [
        // Dashboard para todos (Redirects to Home/Landing for Candidate if not allowed? Dashboard route is internalRoles)
        // Wait, Candidate dashboard route is /candidato, regular dashboard is /dashboard.
        // Let's make "Dashboard" point to /candidato for candidates.
        {
            icon: LayoutDashboard,
            label: isCandidato ? 'Minha Candidatura' : 'Dashboard',
            path: isCandidato ? '/candidato' : '/dashboard'
        },

        ...(canManageCandidacies ? [{ icon: FileText, label: 'Candidaturas', path: '/candidaturas' }] : []),
        ...(isAdmin || isSecretaria ? [{ icon: Users, label: 'Gerir Utilizadores', path: '/users' }] : []),

        // Cursos pode ser público/candidato
        { icon: BookOpen, label: 'Cursos', path: '/courses' },

        // Internal Only
        ...(!isCandidato ? [
            { icon: Users, label: 'Turmas', path: '/turmas' },
            { icon: GraduationCap, label: 'Módulos', path: '/modules' },
            { icon: Users, label: 'Formandos', path: '/formandos' },
            { icon: Users, label: 'Formadores', path: '/formadores' },
            ...(canManageRooms ? [{ icon: DoorOpen, label: 'Salas', path: '/rooms' }] : []),
            { icon: Calendar, label: 'Horários', path: '/schedules' },
        ] : [])
    ];

    const handleLogout = () => {
        authService.logout();
        navigate('/'); // Redirecionar para a Landing Page
    };

    return (
        <aside className="sidebar">
            <div style={{ padding: '1rem 0 2rem 0', textAlign: 'center' }}>
                <h2 className="text-gradient" style={{ fontSize: '1.5rem' }}>ATEC Academy</h2>
            </div>

            <nav style={{ flex: 1 }}>
                {menuItems.map((item, index) => (
                    <NavLink
                        key={index}
                        to={item.path}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
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
