import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    Monitor
} from 'lucide-react';
import { publicService } from '../services/publicService';
import { authService } from '../services/authService';

const LandingPage = () => {
    const [user, setUser] = useState(null);
    const [courses, setCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setUser(authService.getCurrentUser());
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            const data = await publicService.getCourses();
            setCourses(data);
            setFilteredCourses(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const filtered = courses.filter(c =>
            c.nome_curso.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.area.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCourses(filtered);
    }, [searchTerm, courses]);

    const areas = [
        { name: 'Informática', icon: Monitor, color: '#3b82f6' },
        { name: 'Robótica', icon: Cpu, color: '#8b5cf6' },
        { name: 'Electrónica', icon: Zap, color: '#f59e0b' },
        { name: 'Gestão', icon: Globe, color: '#10b981' }
    ];

    return (
        <div style={{ background: '#020617', color: 'white', minHeight: '100vh', fontFamily: 'Outfit, sans-serif' }}>
            {/* Header / Navbar */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
                padding: '1.25rem 5%', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', background: 'rgba(2, 6, 23, 0.7)', backdropFilter: 'blur(15px)',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ padding: '8px', background: 'var(--primary)', borderRadius: '10px' }}>
                        <BookOpen size={20} color="white" />
                    </div>
                    <span>ATEC <span style={{ color: 'var(--primary)' }}>ACADEMY</span></span>
                </div>

                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    {user ? (
                        user.tipo_utilizador === 'CANDIDATO' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <Link to="/candidato" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'var(--primary)', border: 'none' }}>
                                    Minha Candidatura
                                </Link>
                                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Olá, {user.nome_completo || 'Candidato'}</span>
                                <button
                                    onClick={() => { authService.logout(); window.location.reload(); }}
                                    className="btn-glass"
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                >
                                    Sair
                                </button>
                            </div>
                        ) : (
                            <Link to="/dashboard" className="btn-primary" style={{ padding: '0.6rem 1.5rem' }}>Ir para Dashboard</Link>
                        )
                    ) : (
                        <>
                            <Link to="/login" style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>Entrar</Link>
                            <Link to="/register" className="btn-primary" style={{ padding: '0.6rem 1.5rem' }}>Criar Conta</Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <header style={{
                padding: '12rem 5% 6rem', textAlign: 'center',
                background: 'radial-gradient(circle at 50% 30%, rgba(59, 130, 246, 0.15), transparent 60%)',
                position: 'relative', overflow: 'hidden'
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <span style={{
                        background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)',
                        padding: '0.5rem 1.25rem', borderRadius: '100px', fontSize: '0.85rem',
                        fontWeight: '600', textTransform: 'uppercase', letterSpacing: '2px',
                        border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}>
                        Excelência na Formação Profissional
                    </span>
                    <h1 style={{ fontSize: '4.5rem', fontWeight: '800', marginTop: '2rem', lineHeight: '1.1' }}>
                        Transforme o seu <span className="text-gradient">Futuro</span> <br />
                        na ATEC Academy.
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.25rem', maxWidth: '750px', margin: '2rem auto 3rem', lineHeight: '1.6' }}>
                        Seja um especialista em tecnologia com os nossos cursos certificados.
                        Aprenda com formadores de topo em laboratórios de última geração.
                    </p>

                    {/* Public Search Bar */}
                    <div style={{
                        maxWidth: '650px', margin: '0 auto', position: 'relative',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}>
                        <Search size={20} style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                        <input
                            type="text"
                            placeholder="Pesquise por curso ou área (ex: C++, Robótica)..."
                            style={{
                                width: '100%', padding: '1.25rem 1.5rem 1.25rem 4rem',
                                borderRadius: '15px', background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)', color: 'white',
                                fontSize: '1.1rem', outline: 'none'
                            }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </motion.div>
            </header>

            {/* Main Content */}
            <main style={{ padding: '2rem 5% 10rem', maxWidth: '1400px', margin: '0 auto' }}>



                {/* Areas Grid */}
                <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '3rem' }}>Áreas de <span style={{ color: 'var(--primary)' }}>Especialização</span></h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '8rem' }}>
                    {areas.map((area, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -5, background: 'rgba(255,255,255,0.05)' }}
                            style={{
                                padding: '2rem', borderRadius: '20px', background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer'
                            }}
                        >
                            <div style={{
                                width: '50px', height: '50px', borderRadius: '12px',
                                background: `${area.color}20`, display: 'flex',
                                alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem',
                                color: area.color
                            }}>
                                <area.icon size={24} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>{area.name}</h3>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                Domine as ferramentas mais requisitadas do mercado atual.
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Course List Section */}
                <div style={{ id: 'cursos' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                        <div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: '800' }}>Cursos <span style={{ color: 'var(--primary)' }}>Disponíveis</span></h2>
                            <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>Encontre a formação ideal para o seu perfil.</p>
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                            Mostrando {filteredCourses.length} resultados
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '5rem' }}>A carregar catálogo...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                            {filteredCourses.map(course => (
                                <motion.div
                                    key={course.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="glass-card"
                                    style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                                >
                                    <div style={{
                                        height: '10px',
                                        background: course.area === 'Informática' ? 'var(--primary)' :
                                            course.area === 'Robótica' ? '#8b5cf6' :
                                                course.area === 'Electrónica' ? '#f59e0b' : '#10b981'
                                    }} />

                                    <div style={{ padding: '2rem' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem', letterSpacing: '1px' }}>
                                            {course.area}
                                        </div>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', minHeight: '3.5rem' }}>
                                            {course.nome_curso}
                                        </h3>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Zap size={14} />
                                            </div>
                                            <span>Próxima Turma: {course.proxima_data_inicio ? new Date(course.proxima_data_inicio).toLocaleDateString() : 'A anunciar'}</span>
                                        </div>

                                        {user ? (
                                            <Link
                                                to="/candidato"
                                                state={{ interestedIn: course.id }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                    padding: '0.85rem', width: '100%', borderRadius: '12px',
                                                    background: 'rgba(255,255,255,0.05)', color: 'white', textDecoration: 'none',
                                                    fontWeight: '600', border: '1px solid rgba(255,255,255,0.1)',
                                                    transition: 'all 0.2s'
                                                }}
                                                className="hover-glow"
                                            >
                                                Quero me Candidatar <ArrowRight size={18} />
                                            </Link>
                                        ) : (
                                            <Link
                                                to="/register"
                                                state={{ interestedIn: course.id }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                    padding: '0.85rem', width: '100%', borderRadius: '12px',
                                                    background: 'rgba(255,255,255,0.05)', color: 'white', textDecoration: 'none',
                                                    fontWeight: '600', border: '1px solid rgba(255,255,255,0.1)',
                                                    transition: 'all 0.2s'
                                                }}
                                                className="hover-glow"
                                            >
                                                Quero me Candidatar <ArrowRight size={18} />
                                            </Link>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer style={{
                borderTop: '1px solid rgba(255,255,255,0.05)', padding: '5rem 5% 2rem',
                background: '#010410'
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4rem', marginBottom: '5rem' }}>
                    <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            ATEC <span style={{ color: 'var(--primary)' }}>ACADEMY</span>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                            Formação profissional de alta qualidade financiada pela União Europeia e pelo Estado Português.
                        </p>
                    </div>
                    <div>
                        <h4 style={{ marginBottom: '1.5rem' }}>Cursos</h4>
                        <ul style={{ listStyle: 'none', padding: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <li>Cursos de Aprendizagem</li>
                            <li>Cursos CET (Nível 5)</li>
                            <li>Formação Modular</li>
                            <li>Especialização</li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ marginBottom: '1.5rem' }}>Links Úteis</h4>
                        <ul style={{ listStyle: 'none', padding: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <li>Sobre a ATEC</li>
                            <li>Como se Candidatar</li>
                            <li>Contactos</li>
                            <li>FAQs</li>
                        </ul>
                    </div>
                </div>
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>
                    &copy; 2026 ATEC Academy Manager &bull; Desenvolvido para Excelência de Gestão
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
