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
    Clock
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Sidebar = () => {
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

    const menuItems = [
        // Dashboard para quase todos
        {
            icon: LayoutDashboard,
            label: isCandidato ? 'Minha Candidatura' : 'Dashboard',
            path: isCandidato ? '/candidato' : '/dashboard'
        },

        // Secretaria/Admin
        ...(isStaff ? [
            { icon: FileText, label: 'Candidaturas', path: '/candidaturas' },
            { icon: Users, label: 'Gerir Utilizadores', path: '/users' },
            { icon: BookOpen, label: 'Cursos', path: '/courses' },
            { icon: Users, label: 'Turmas', path: '/turmas' },
            { icon: GraduationCap, label: 'Módulos', path: '/modules' },
            { icon: Users, label: 'Formandos', path: '/formandos' },
            { icon: Users, label: 'Formadores', path: '/formadores' },
            { icon: DoorOpen, label: 'Salas', path: '/rooms' },
            { icon: Calendar, label: 'Horários', path: '/schedules' },
        ] : []),

        // Formando
        ...(isFormando ? [
            { icon: BookOpen, label: 'Meu Curso', path: '/my-course' },
            { icon: Calendar, label: 'Meus Horários', path: '/schedules' },
            { icon: GraduationCap, label: 'Avaliações', path: '/grades' },
            { icon: FileText, label: 'Ficha de Formando', path: '/formando-ficha' },
        ] : []),

        // Formador
        ...(isFormador ? [
            { icon: Users, label: 'Minhas Turmas', path: '/turmas' },
            { icon: Calendar, label: 'Horários', path: '/schedules' },
            { icon: Clock, label: 'Minha Disponibilidade', path: '/trainer-availability' },
            { icon: GraduationCap, label: 'Lançar Notas', path: '/trainer-grades' },
            { icon: DoorOpen, label: 'Salas e Aulas', path: '/rooms' },
            { icon: FileText, label: 'Ficha de Formador', path: '/formador-ficha' },
        ] : []),

        // Candidato
        ...(isCandidato ? [
            { icon: BookOpen, label: 'Cursos Disponíveis', path: '/courses' },
        ] : [])
    ];

    const handleLogout = () => {
        authService.logout();
        navigate('/'); // Redirecionar para a Landing Page
    };

    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <aside className="sidebar">
            <div style={{ padding: '1rem 0 2rem 0', textAlign: 'center' }}>
                <h2 className="text-gradient" style={{ fontSize: '1.5rem' }}>Academy Manager</h2>
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
