import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, GraduationCap, Calendar, CheckCircle } from 'lucide-react';
import { authService, API_URL } from '../services/authService';

function MyCoursePage() {
    const [inscricao, setInscricao] = useState(null);
    const [grades, setGrades] = useState([]);
    const [stats, setStats] = useState({ concluidos: 0, total: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const user = authService.getCurrentUser();

                if (!token || !user) return;


                // 1. Obter Informações do Curso (Candidatura/Inscrição)

                const resInscricao = await fetch(`${API_URL}/api/candidatos/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const dataInscricao = await resInscricao.json();
                setInscricao(dataInscricao);

                // 2. Obter Notas (Módulos)
                const resGrades = await fetch(`${API_URL}/api/formandos/${user.id}/grades`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (resGrades.ok) {
                    const dataGrades = await resGrades.json();
                    const gradesList = dataGrades.grades || [];
                    setGrades(gradesList);

                    // Calcular Estatísticas
                    const total = gradesList.length;
                    const concluidos = gradesList.filter(g => g.nota && parseFloat(g.nota) >= 9.5).length;

                    setStats({ concluidos, total });
                }

            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando dados do curso...</div>;

    if (!inscricao) return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3>Ainda não está inscrito em nenhum curso.</h3>
        </div>
    );

    // Filtrar módulos com notas definidas para a lista
    const completedModules = grades.filter(g => g.nota !== null);

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

                <div className="course-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <style>{`
                        @media (max-width: 768px) {
                            .course-info-grid { grid-template-columns: 1fr !important; gap: 1rem !important; }
                        }
                    `}</style>
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
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {stats.concluidos} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>/ {stats.total}</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            <h3 style={{ marginBottom: '1.5rem' }}>Módulos Concluídos</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {completedModules.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        Ainda não concluiu nenhuma unidade curricular.
                    </div>
                ) : (
                    completedModules.map((modulo, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="glass-card"
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CheckCircle size={20} color="#10b981" />
                                </div>
                                <div>
                                    <h5 style={{ fontWeight: '600', marginBottom: '0.2rem' }}>{modulo.nome_modulo}</h5>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        Concluído em: {modulo.data_avaliacao ? new Date(modulo.data_avaliacao).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold',
                                    color: parseFloat(modulo.nota) >= 9.5 ? '#10b981' : '#f87171'
                                }}>
                                    {modulo.nota} val
                                </span>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}

export default MyCoursePage;
