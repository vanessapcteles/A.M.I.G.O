import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    ChevronRight,
    BookOpen,
    Users,
    Award,
    ArrowRight,
    Globe,
    Zap,
    Cpu,
    Monitor,
    Mail,
    X,
    Clock,
    Menu, 
    Sun, 
    Moon 
} from 'lucide-react';
import { publicService } from '../services/publicService';
import { authService } from '../services/authService';
import { useTheme } from '../context/ThemeContext';


const LandingPage = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const [user, setUser] = useState(null);
    const [courses, setCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ cursos: 0, formandos: 0, empregabilidade: '94%' });
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 

    // Estados para o Modal de Detalhes
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [courseModules, setCourseModules] = useState([]);
    const [loadingModules, setLoadingModules] = useState(false);

    useEffect(() => {
        setUser(authService.getCurrentUser());
        loadCourses();
        loadStats();

        // Ativar scroll suave globalmente
        document.documentElement.style.scrollBehavior = 'smooth';

        if (window.location.hash) {
            const id = window.location.hash.replace('#', '');
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 500);
        }

        return () => {
            document.documentElement.style.scrollBehavior = 'auto';
        };
    }, []);

    const handleNavClick = (e, id) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            window.history.pushState(null, null, `#${id} `);
        }
    };

    const loadStats = async () => {
        try {
            const data = await publicService.getStats();
            setStats(data);
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    };

    const loadCourses = async () => {
        try {
            const data = await publicService.getCourses();
            setCourses(Array.isArray(data) ? data : data.courses || []);
            setFilteredCourses(Array.isArray(data) ? data : data.courses || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleShowDetails = async (course) => {
        setSelectedCourse(course);
        setLoadingModules(true);
        try {
            const modules = await publicService.getCourseModules(course.id);
            setCourseModules(modules);
        } catch (error) {
            console.error('Erro ao carregar módulos:', error);
        } finally {
            setLoadingModules(false);
        }
    };

    useEffect(() => {
        const filtered = courses.filter(c =>
            c.nome_curso.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.area.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Ordenar
        const sorted = [...filtered].sort((a, b) => {
            const yearA = a.proxima_data_inicio ? new Date(a.proxima_data_inicio).getFullYear() : 0;
            const yearB = b.proxima_data_inicio ? new Date(b.proxima_data_inicio).getFullYear() : 0;

            if (yearA === 2026 && yearB !== 2026) return -1;
            if (yearB === 2026 && yearA !== 2026) return 1;
            return 0;
        });

        setFilteredCourses(sorted);
    }, [searchTerm, courses]);

    const formatArea = (areaCode) => {
        const mapping = {
            'TPSI 0525': 'Informática',
            'CISEG 0525': 'Cibersegurança',
            'GCE 0525': 'Energias Renováveis',
            'MECA 0525': 'Mecatrónica'
        };
        return mapping[areaCode] || areaCode;
    };

    const areas = [
        { name: 'Informática', icon: Monitor, color: '#38bdf8' },
        { name: 'Robótica', icon: Cpu, color: '#818cf8' },
        { name: 'Electrónica', icon: Zap, color: '#fbbf24' },
        { name: 'Gestão', icon: Globe, color: '#34d399' }
    ];

    const steps = [
        { title: 'Explora', desc: 'Descobre o catálogo de cursos financiados e escolhe o teu caminho.', icon: Search },
        { title: 'Candidata-te', desc: 'Processo 100% digital e rápido. Recebe resposta em poucos dias.', icon: ArrowRight },
        { title: 'Evolui', desc: 'Aprende com especialistas e entra no mercado de trabalho com confiança.', icon: Award }
    ];

    return (
        <div style={{ background: 'var(--bg-main)', color: 'var(--text-primary)', minHeight: '100vh', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>
            <style>
                {`
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                    .animate-fade { animation: fadeIn 0.6s ease-out forwards; }
                    
                    @media (max-width: 900px) {
                        .nav-links-desktop { display: none !important; }
                        h1 { font-size: 2.2rem !important; line-height: 1.1 !important; }
                        h2 { font-size: 1.8rem !important; }
                        header { padding: 8rem 5% 4rem !important; }
                        .quick-stats { gap: 1.5rem !important; flex-direction: column !important; align-items: center !important; }
                        .btn-primary, .btn-glass { width: 100% !important; justify-content: center !important; padding: 1rem !important; }
                        .search-container { flex-direction: column !important; gap: 1rem !important; }
                        nav { padding: 1rem 5% !important; }
                        .logo-subtitle { display: none !important; }
                        .courses-grid { grid-template-columns: 1fr !important; padding: 0 1rem !important; }
                    }

                    @media (min-width: 901px) and (max-width: 1200px) {
                        h1 { font-size: 3.5rem !important; }
                        .courses-grid { grid-template-columns: repeat(2, 1fr) !important; }
                    }
                `}
            </style>
            {/* Navbar Premium */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
                padding: '1rem 5%', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center',
                background: isDarkMode ? 'rgba(2, 6, 23, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid var(--border-glass)',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.6rem', fontFamily: 'Outfit, sans-serif' }}>
                    <img src="/logo_website.png" alt="Logo" style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '50%' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ lineHeight: '1' }}>A.M.I.G.<span className="text-gradient">O</span></span>
                        <span className="logo-subtitle" style={{ fontSize: '0.6rem', fontWeight: '500', color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: '2px' }}>
                            Academy Management Interactive Guide & Organizer
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div className="nav-links-desktop" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        <a href="#cursos" onClick={(e) => handleNavClick(e, 'cursos')} style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.9rem', transition: 'color 0.3s' }}>Cursos</a>
                        <a href="#como-funciona" onClick={(e) => handleNavClick(e, 'como-funciona')} style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.9rem', transition: 'color 0.3s' }}>Como Funciona</a>

                        {user ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <Link to={user.tipo_utilizador === 'CANDIDATO' ? "/candidato" : "/dashboard"} className="btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', width: 'auto' }}>
                                    Aceder à Área Pessoal
                                </Link>
                                <button
                                    onClick={() => { authService.logout(); window.location.reload(); }}
                                    className="btn-glass"
                                    style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', width: 'auto' }}
                                >
                                    Sair
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                <Link to="/login" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.9rem' }}>Entrar</Link>
                                <Link to="/register" className="btn-primary" style={{ padding: '0.7rem 1.7rem', fontSize: '0.9rem', width: 'auto' }}>Começar Agora</Link>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="btn-glass"
                        style={{ width: '40px', height: '40px', padding: '0', borderRadius: '12px', justifyContent: 'center', zIndex: 1100 }}
                    >
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    <button
                        className="btn-glass"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        style={{ width: '40px', height: '40px', padding: '0', borderRadius: '12px', justifyContent: 'center', display: 'none', zIndex: 1100 }}
                        id="mobile-menu-btn"
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <style>
                        {`
                            @media (max-width: 900px) {
                                #mobile-menu-btn { display: flex !important; }
                            }
                        `}
                    </style>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            style={{
                                position: 'fixed', top: '70px', left: 0, right: 0,
                                background: 'var(--bg-main)', padding: '2rem',
                                borderBottom: '1px solid var(--border-glass)',
                                display: 'flex', flexDirection: 'column', gap: '1.5rem',
                                zIndex: 999, boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                            }}
                        >
                            <a href="#cursos" onClick={(e) => { handleNavClick(e, 'cursos'); setIsMobileMenuOpen(false); }} style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: '600' }}>Cursos</a>
                            <a href="#como-funciona" onClick={(e) => { handleNavClick(e, 'como-funciona'); setIsMobileMenuOpen(false); }} style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: '600' }}>Como Funciona</a>
                            <div style={{ height: '1px', background: 'var(--border-glass)' }} />
                            {user ? (
                                <>
                                    <Link to={user.tipo_utilizador === 'CANDIDATO' ? "/candidato" : "/dashboard"} className="btn-primary" onClick={() => setIsMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>Área Pessoal</Link>
                                    <button onClick={() => { authService.logout(); window.location.reload(); }} className="btn-glass">Sair</button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="btn-glass" onClick={() => setIsMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>Entrar</Link>
                                    <Link to="/register" className="btn-primary" onClick={() => setIsMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>Começar Agora</Link>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Hero Section Reimagined */}
            <header style={{
                padding: '10rem 5% 5rem', textAlign: 'center',
                background: isDarkMode
                    ? 'radial-gradient(circle at 50% 30%, rgba(56, 189, 248, 0.15), transparent 70%)'
                    : 'radial-gradient(circle at 50% 30%, rgba(56, 189, 248, 0.08), transparent 70%)',
                position: 'relative'
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card-hover-bg)', padding: '0.6rem 1.25rem', borderRadius: '100px', border: '1px solid var(--border-glass)', marginBottom: '2.5rem' }}>
                        <Zap size={16} color="var(--primary)" />
                        <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-secondary)' }}>Inscrições Abertas 2026</span>
                    </div>

                    <h1 style={{ fontSize: 'min(4.5rem, 10vw)', fontWeight: '900', lineHeight: '1', letterSpacing: '-0.04em', fontFamily: 'Outfit, sans-serif', marginBottom: '2rem' }}>
                        O teu futuro profissional <br />
                        começa com o <span className="text-gradient">A.M.I.G.O.</span>
                    </h1>
                    <div style={{ marginBottom: '2rem', fontSize: '1rem', fontWeight: '600', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        Academy Management Interactive Guide & Organizer
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '800px', margin: '0 auto 4rem', lineHeight: '1.7', fontWeight: '400' }}>
                        O teu guia interativo e organizador de formação profissional. <br />
                        Explora cursos certificados, consulta planos curriculares e gere o teu percurso académico com total facilidade.
                    </p>

                    <div className="search-container" style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <a href="#cursos" className="btn-primary" style={{ padding: '1.2rem 2.5rem', borderRadius: '16px', fontSize: '1.05rem' }}>
                            Ver Cursos
                        </a>
                    </div>

                    {/* Quick Stats Grid */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', marginTop: '6rem', flexWrap: 'wrap' }}>
                        {[
                            { label: 'Cursos Ativos', val: `+ ${stats.cursos} ` },
                            { label: 'Formandos', val: `+ ${stats.formandos} ` },
                            { label: 'Empregabilidade', val: stats.empregabilidade }
                        ].map((s, i) => (
                            <div key={i} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif' }}>{s.val}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </header>

            {/* Como funciona */}
            <section id="como-funciona" style={{ padding: '8rem 5%', background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif', marginBottom: '1rem' }}>Como Funciona?</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>O teu percurso simplificado em três etapas fundamentais.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
                        {steps.map((step, i) => (
                            <div key={i} style={{ position: 'relative', textAlign: 'center' }}>
                                <div style={{
                                    width: '80px', height: '80px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
                                    borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 2rem', color: 'var(--primary)', boxShadow: '0 10px 20px rgba(0,0,0,0.05)'
                                }}>
                                    <step.icon size={32} />
                                </div>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1rem' }}>{step.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>{step.desc}</p>
                                {i < 2 && (
                                    <div className="hidden-mobile" style={{ position: 'absolute', top: '40px', right: '-20%', width: '40%', height: '1px', background: 'var(--border-glass)', zIndex: -1 }}></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Cursos */}
            <main id="cursos" style={{ padding: '8rem 5% 10rem', maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem' }}>
                    <div>
                        <h2 style={{ fontSize: '2.8rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif' }}>Explora o teu <br /><span className="text-gradient">Futuro Próximo</span></h2>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '1.1rem' }}>Cursos com inscrições abertas para 2026 e ofertas contínuas.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--text-muted)', background: 'var(--card-hover-bg)', padding: '0.6rem 1.2rem', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                        <Monitor size={16} />
                        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{filteredCourses.length} Cursos Encontrados</span>
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem' }}><div className="loader"></div></div>
                ) : (
                    <div className="courses-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))',
                        gap: '2rem'
                    }}>
                        {filteredCourses.map(course => (
                            <motion.div
                                key={course.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ y: -10 }}
                                className="glass-card"
                                style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                            >
                                <div style={{
                                    height: '6px',
                                    background: course.area.includes('Infor') ? 'var(--primary)' :
                                        course.area.includes('Robo') ? 'var(--secondary)' :
                                            course.area.includes('Eletr') ? 'var(--accent)' : '#10b981'
                                }} />

                                <div style={{ padding: '2.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                        {new Date(course.proxima_data_inicio).getFullYear() === 2026 ? (
                                            <div style={{
                                                padding: '0.4rem 1.2rem',
                                                background: 'linear-gradient(135deg, #059669, #10b981)',
                                                borderRadius: '20px',
                                                fontSize: '0.7rem',
                                                fontWeight: '900',
                                                color: 'white',
                                                letterSpacing: '0.5px',
                                                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                textTransform: 'uppercase'
                                            }}>
                                                Inscrições 2026
                                            </div>
                                        ) : (
                                            <div style={{
                                                padding: '0.4rem 1rem',
                                                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(79, 70, 229, 0.1)',
                                                borderRadius: '8px',
                                                fontSize: '0.7rem',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                color: 'var(--primary)',
                                                letterSpacing: '1px',
                                                border: '1px solid var(--border-glass)'
                                            }}>
                                                12 Meses
                                            </div>
                                        )}

                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Área</div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>{formatArea(course.area)}</div>
                                        </div>
                                    </div>

                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', lineHeight: '1.3', minHeight: '4rem' }}>
                                        {course.nome_curso}
                                    </h3>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            <Globe size={16} color="var(--primary)" />
                                            <span>Estado: <span style={{
                                                color: new Date(course.proxima_data_inicio) > new Date() ? '#10b981' : 'var(--text-primary)',
                                                fontWeight: '700'
                                            }}>
                                                {new Date(course.proxima_data_inicio) > new Date() ? 'Inscrições Abertas' : 'Oferta Formativa / Em Curso'}
                                            </span></span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            <Clock size={16} color="var(--primary)" />
                                            <span>Duração: <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>12 Meses</span></span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleShowDetails(course)}
                                        className="btn-primary"
                                        style={{ width: '100%', justifyContent: 'center', padding: '1rem', borderRadius: '12px', fontWeight: '700' }}
                                    >
                                        Saber Mais <ArrowRight size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Detalhes do Curso */}
            <AnimatePresence>
                {selectedCourse && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '1rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            style={{
                                width: '100%', maxWidth: '800px', maxHeight: '90vh',
                                background: 'var(--bg-main)', borderRadius: '30px',
                                border: '1px solid var(--border-glass)', overflow: 'hidden',
                                display: 'flex', flexDirection: 'column', boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
                            }}
                        >
                            {/* Modal Header */}
                            <div style={{
                                padding: '2rem 2.5rem', borderBottom: '1px solid var(--border-glass)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                background: 'var(--bg-sidebar)'
                            }}>
                                <div>
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '0.4rem 1rem',
                                        background: isDarkMode ? 'var(--primary-glow)' : 'var(--primary)',
                                        color: 'white',
                                        borderRadius: '8px',
                                        fontSize: '0.75rem',
                                        fontWeight: '800',
                                        textTransform: 'uppercase',
                                        marginBottom: '1rem'
                                    }}>
                                        12 Meses
                                    </div>
                                    <h2 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif' }}>{selectedCourse.nome_curso}</h2>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600', marginTop: '0.5rem' }}>Área: {formatArea(selectedCourse.area)}</div>
                                </div>
                                <button
                                    onClick={() => setSelectedCourse(null)}
                                    className="btn-glass"
                                    style={{ padding: '0.7rem', borderRadius: '12px' }}
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div style={{ padding: '2.5rem', overflowY: 'auto', flex: 1 }}>
                                <div style={{ marginBottom: '2.5rem' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <BookOpen size={20} color="var(--primary)" />
                                        Plano Curricular
                                    </h3>

                                    {loadingModules ? (
                                        <div style={{ textAlign: 'center', padding: '3rem' }}>A carregar detalhes...</div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                                            {courseModules.length > 0 ? courseModules.map((m, idx) => (
                                                <div key={m.id} style={{
                                                    padding: '1.25rem', background: 'var(--card-hover-bg)',
                                                    borderRadius: '16px', border: '1px solid var(--border-glass)',
                                                    display: 'flex', alignItems: 'center', gap: '1.25rem'
                                                }}>
                                                    <div style={{
                                                        width: '40px', height: '40px', borderRadius: '10px',
                                                        background: 'var(--bg-main)', border: '1px solid var(--border-glass)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary)'
                                                    }}>
                                                        {idx + 1}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '1rem', fontWeight: '600' }}>{m.nome_modulo}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.carga_horaria} horas</div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                    Planificação curricular em atualização.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Contact Support */}
                                <div style={{
                                    padding: '2rem', background: 'var(--card-hover-bg)', borderRadius: '20px',
                                    border: '1px dashed var(--primary)', textAlign: 'center'
                                }}>
                                    <p style={{ marginBottom: '1.5rem', fontWeight: '500' }}>Ainda tens dúvidas sobre este curso?</p>
                                    <a
                                        href={`mailto:academymanager28 @gmail.com?subject = Dúvida sobre o curso: ${selectedCourse.nome_curso} `}
                                        className="btn-glass"
                                        style={{ gap: '0.8rem', padding: '0.8rem 2rem' }}
                                    >
                                        <Mail size={18} /> Falar com Orientador
                                    </a>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div style={{ padding: '2rem 2.5rem', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '1.5rem', background: 'var(--bg-sidebar)' }}>
                                <button
                                    onClick={() => setSelectedCourse(null)}
                                    className="btn-glass"
                                    style={{ padding: '1.1rem 2rem', borderRadius: '14px', flex: 1 }}
                                >
                                    Voltar
                                </button>
                                <Link
                                    to={user ? "/candidato" : "/register"}
                                    state={{ interestedIn: selectedCourse.id }}
                                    className="btn-primary"
                                    style={{ padding: '1.1rem 3rem', borderRadius: '14px', flex: 2, justifyContent: 'center', textDecoration: 'none', fontWeight: '700' }}
                                >
                                    Candidatar-me a este Curso
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* CTA Final */}
            <section style={{ padding: '6rem 5% 8rem' }}>
                <div className="glass-card" style={{
                    maxWidth: '1000px', margin: '0 auto', padding: '5rem 2rem', textAlign: 'center',
                    background: 'linear-gradient(135deg, var(--bg-sidebar), rgba(56, 189, 248, 0.05))',
                    border: '1px solid var(--primary)'
                }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>Estás pronto para o próximo nível?</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
                        Junta-te a centenas de alunos que já transformaram as suas carreiras connosco.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/register" className="btn-primary" style={{ padding: '1.2rem 3rem', fontSize: '1.1rem', borderRadius: '14px' }}>Criar Perfil Grátis</Link>
                        <Link to="/login" className="btn-glass" style={{ padding: '1.2rem 3rem', fontSize: '1.1rem', borderRadius: '14px' }}>Área de Aluno</Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid var(--border-glass)', padding: '6rem 5% 3rem', background: 'var(--bg-sidebar)' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '4rem', marginBottom: '6rem' }}>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2rem', fontFamily: 'Outfit, sans-serif' }}>
                            <img src="/logo_website.png" alt="Logo" style={{ width: '35px', height: '35px', objectFit: 'cover', borderRadius: '50%' }} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ lineHeight: '1' }}>A.M.I.G.<span style={{ color: 'var(--primary)' }}>O</span></span>
                                <span style={{ fontSize: '0.55rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>
                                    Academy Management Interactive Guide & Organizer
                                </span>
                            </div>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.8' }}>
                            Líder na formação tecnológica e profissional, focada na inovação e no sucesso real dos seus formandos.
                        </p>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>Recursos</h4>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <li><Link to="/register" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.95rem' }}>Candidaturas Digitais</Link></li>
                            <li><Link to="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.95rem' }}>Portal de Formandos</Link></li>
                            <li><Link to="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.95rem' }}>Área de Formadores</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>Contactos</h4>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            <li style={{ display: 'flex', gap: '0.5rem' }}><Globe size={18} /> www.amigo.pt</li>
                            <li>Email: academymanager28@gmail.com</li>
                            <li>Local: Lisboa | Palmela | Porto</li>
                        </ul>
                    </div>
                </div>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', paddingTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                    &copy; 2026 A.M.I.G.O &bull; Designed for Excellence
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
