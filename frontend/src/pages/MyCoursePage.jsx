import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, GraduationCap, Calendar, CheckCircle } from 'lucide-react';
import { authService, API_URL } from '../services/authService';

function MyCoursePage() {
    const [inscricao, setInscricao] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyCourse = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const res = await fetch(`${API_URL}/api/candidatos/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setInscricao(data);
            } catch (error) {
                console.error("Erro ao carregar curso:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMyCourse();
    }, []);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando dados do curso...</div>;

    if (!inscricao) return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3>Ainda não está inscrito em nenhum curso.</h3>
        </div>
    );

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
                style={{ marginBottom: '2rem' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '15px', color: 'var(--primary)' }}>
                        <GraduationCap size={40} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{inscricao.nome_curso}</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Status da Matrícula: <span style={{ color: '#10b981', fontWeight: 'bold' }}>ATIVA</span></p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <h4 style={{ marginBottom: '1rem' }}>Duração da Turma</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Data de Início:</span>
                                <span style={{ fontWeight: '500' }}>{inscricao.data_inicio ? new Date(inscricao.data_inicio).toLocaleDateString() : 'A definir'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Data de Fim:</span>
                                <span style={{ fontWeight: '500' }}>{inscricao.data_fim ? new Date(inscricao.data_fim).toLocaleDateString() : 'A definir'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <h4 style={{ marginBottom: '1rem' }}>Módulos Concluídos</h4>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>12 / 24</div>
                    </div>
                </div>
            </motion.div>

            <h3 style={{ marginBottom: '1.5rem' }}>Próximas Atividades</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[1, 2, 3].map(i => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card"
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Calendar size={20} color="var(--primary)" />
                            </div>
                            <div>
                                <h5 style={{ fontWeight: '600' }}>Teste Prático - Módulo {i + 5}</h5>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sexta-feira, às 09:00</p>
                            </div>
                        </div>
                        <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--primary)', borderRadius: '5px' }}>Agendado</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

export default MyCoursePage;
