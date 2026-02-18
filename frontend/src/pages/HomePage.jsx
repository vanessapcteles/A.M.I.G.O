import { useState, useEffect } from 'react';
import { BookOpen, Users, GraduationCap, Calendar, BarChart3, TrendingUp, CheckCircle2 } from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { motion } from 'framer-motion';

function HomePage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const statsData = await dashboardService.getStats();
                setData(statsData);
            } catch (error) {
                console.error("Erro ao carregar dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    const stats = [
        {
            label: 'Cursos Terminados',
            value: data?.stats.cursosTerminados || '0',
            icon: CheckCircle2,
            color: '#10b981', // Verde para sucesso/conclusão
            desc: 'Histórico concluído'
        },
        {
            label: 'Cursos a Decorrer',
            value: data?.stats.cursosADecorrer || '0',
            icon: BookOpen,
            color: 'var(--primary)',
            desc: 'Em curso atualmente'
        },
        {
            label: 'Formandos Ativos',
            value: data?.stats.formandosAtivos || '0',
            icon: Users,
            color: 'var(--secondary)',
            desc: 'Frequentando no momento'
        }
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: '1.5rem' }}>
                <div className="loader"></div>
                <p style={{ color: 'var(--text-secondary)', fontWeight: '500', letterSpacing: '0.5px' }}>Preparando a sua área pessoal...</p>
            </div>
        );
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '2.5rem' }}
            >
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.25rem', letterSpacing: '-1px' }}>Dashboard <span className="text-gradient">Geral</span></h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Estatísticas em tempo real da rede A.M.I.G.O.</p>
            </motion.div >

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-card"
                        style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative', overflow: 'hidden' }}
                    >
                        <div style={{
                            padding: '1rem',
                            borderRadius: '12px',
                            background: `rgba(${stat.color === 'var(--primary)' ? '56, 189, 248' : stat.color === 'var(--secondary)' ? '99, 102, 241' : '16, 185, 129'}, 0.1)`,
                            color: stat.color
                        }}>
                            <stat.icon size={28} />
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{stat.label}</p>
                            <h3 style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '0.25rem' }}>{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="dashboard-grid-bottom" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <style>
                    {`
                        @media (max-width: 1200px) {
                            .dashboard-grid-bottom { grid-template-columns: 1fr !important; }
                        }
                        @media (max-width: 768px) {
                            .dashboard-grid-bottom { gap: 1rem !important; }
                        }
                    `}
                </style>
                <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <TrendingUp size={20} color="var(--primary)" /> Top 10 Formadores (Horas)
                        </h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {data?.charts.topFormadores.length > 0 ? (
                            data.charts.topFormadores.map((formador, i) => (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    background: 'var(--card-hover-bg)',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%', background: 'var(--sidebar-item-hover)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold'
                                        }}>
                                            {i + 1}
                                        </div>
                                        <p style={{ fontWeight: '500' }}>{formador.nome_completo}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span className="text-gradient" style={{ fontWeight: '700' }}>{formador.total_horas}h</span>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>lecionadas</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Ainda não há dados de aulas registadas.</p>
                        )}
                    </div>
                </div>

                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BarChart3 size={20} color="var(--secondary)" /> Cursos por Área
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
                        {data?.charts.cursosPorArea.map((item, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem',
                                background: 'rgba(56, 189, 248, 0.03)',
                                border: '1px solid var(--border-glass)',
                                borderRadius: '12px',
                                transition: 'all 0.3s'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: i % 2 === 0 ? 'var(--primary)' : 'var(--secondary)' }}></div>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{item.area}</span>
                                </div>
                                <span style={{
                                    fontWeight: '700',
                                    color: 'var(--primary)',
                                    background: 'var(--primary-glow)',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem'
                                }}>{item.count}</span>
                            </div>
                        ))}
                        {data?.charts.cursosPorArea.length === 0 && (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Sem cursos registados.</p>
                        )}
                    </div>


                </div>
            </div>
        </>
    );
}

export default HomePage;
