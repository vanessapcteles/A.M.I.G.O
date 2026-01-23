import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, BookOpen, Users, Layout, ShieldCheck } from 'lucide-react';

const LandingPage = () => {
    return (
        <div style={{ background: 'var(--bg-main)', minHeight: '100vh' }}>
            {/* Navigation */}
            <nav style={{
                padding: '1.5rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-glass)',
                backdropFilter: 'blur(10px)',
                position: 'fixed',
                top: 0,
                width: '100%',
                zIndex: 1000
            }}>
                <h2 className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>ATEC Academy</h2>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <Link to="/login" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '500' }}>Login</Link>
                    <Link to="/register" className="btn-primary">Criar Conta </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{
                padding: '10rem 2rem 5rem',
                textAlign: 'center',
                background: 'radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.15), transparent 50%)'
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 style={{ fontSize: '4.5rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>
                        Gerencie sua <span className="text-gradient">Academia</span> <br />
                        com Inteligência.
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto 3rem' }}>
                        A plataforma completa para gestão de cursos, formadores e horários.
                        Simples, intuitiva e pensada para a excelência educacional da ATEC.
                    </p>
                    <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                        <Link to="/register" className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
                            Começar Agora
                        </Link>
                        <Link to="/login" className="glass-card" style={{ padding: '1rem 2.5rem', textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Ver Demonstração
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    {[
                        {
                            icon: BookOpen,
                            title: 'Gestão de Cursos',
                            desc: 'Organize módulos, turmas e conteúdos de forma centralizada.'
                        },
                        {
                            icon: Layout,
                            title: 'Horários Automáticos',
                            desc: 'Gere horários inteligentes sem conflitos de salas ou formadores.'
                        },
                        {
                            icon: ShieldCheck,
                            title: 'Segurança Máxima',
                            desc: 'Proteção de dados com autenticação 2FA e criptografia de ponta.'
                        }
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -10 }}
                            className="glass-card"
                            style={{ textAlign: 'center' }}
                        >
                            <div style={{
                                width: '60px',
                                height: '60px',
                                background: 'var(--primary-glow)',
                                borderRadius: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem',
                                color: 'var(--primary)'
                            }}>
                                <feature.icon size={30} />
                            </div>
                            <h3 style={{ marginBottom: '1rem' }}>{feature.title}</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ATEC Banner */}
            <section style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                <div className="glass-card" style={{
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(56, 189, 248, 0.05))',
                    padding: '4rem'
                }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Pronto para otimizar seus processos?</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
                        Junte-se a centenas de utilizadores que já utilizam o Academy Manager para transformar a gestão educacional.
                    </p>
                    <Link to="/register" className="btn-primary" style={{ padding: '1rem 3rem' }}>
                        Registar
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '3rem 2rem', borderTop: '1px solid var(--border-glass)', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>&copy; 2026 ATEC Academy Manager. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
