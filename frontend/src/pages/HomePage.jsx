import DashboardLayout from '../components/layout/DashboardLayout';
import { BookOpen, Users, GraduationCap, Calendar } from 'lucide-react';

function HomePage() {
    const stats = [
        { label: 'Cursos Ativos', value: '12', icon: BookOpen, color: 'var(--primary)' },
        { label: 'Total Formandos', value: '156', icon: Users, color: 'var(--secondary)' },
        { label: 'Módulos', value: '48', icon: GraduationCap, color: 'var(--accent)' },
        { label: 'Aulas Hoje', value: '8', icon: Calendar, color: '#10b981' },
    ];

    return (
        <DashboardLayout>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {stats.map((stat, index) => (
                    <div key={index} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{
                            padding: '1rem',
                            borderRadius: '12px',
                            background: `rgba(${stat.color === 'var(--primary)' ? '56, 189, 248' : '99, 102, 241'}, 0.1)`,
                            color: stat.color
                        }}>
                            <stat.icon size={28} />
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{stat.label}</p>
                            <h3 style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div className="glass-card">
                    <h3 style={{ marginBottom: '1.5rem' }}>Próximas Atividades</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)' }}>
                                <div>
                                    <p style={{ fontWeight: '500' }}>Aula de Programação Avançada</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sala 12 • 14:00 - 17:00</p>
                                </div>
                                <span className="text-gradient" style={{ fontWeight: '600' }}>Em breve</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Estado do Sistema</h3>
                    <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1.5rem' }}>
                        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--primary)" strokeWidth="3" strokeDasharray="85, 100" />
                        </svg>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                            <h2 style={{ fontSize: '1.5rem' }}>85%</h2>
                        </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Capacidade utilizada das salas hoje.</p>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default HomePage;
