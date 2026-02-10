import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, CheckCircle2, AlertCircle, Loader } from 'lucide-react';
import { authService, API_URL } from '../services/authService';

function GradesPage() {
    const [user] = useState(authService.getCurrentUser());
    const [gradesData, setGradesData] = useState({ grades: [], curso: '', turma: '' });
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ media: 0, concluidos: 0, abertos: '0' });

    const calculateStats = (grades) => {
        let total = 0;
        let count = 0;
        let concluidos = 0;
        let abertos = 0;

        grades.forEach(g => {
            if (g.nota) {
                total += parseFloat(g.nota);
                count++;
                if (parseFloat(g.nota) >= 9.5) {
                    concluidos++;
                } else {
                    // Reprovada conta como não concluída, mas neste contexto 'abertos' seriam os sem nota
                    // Se quisermos contar reprovadas como 'abertos' (para refazer), podemos ajustar.
                    // Mas a lógica original era (sem nota) -> abertos.
                }
            } else {
                abertos++;
            }
        });

        // Safe division
        const mediaFinal = count > 0 ? (total / count).toFixed(1) : 0;

        setStats({
            media: mediaFinal,
            concluidos,
            abertos
        });
    };

    useEffect(() => {
        const fetchGrades = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                if (!token || !user) return;

                const res = await fetch(`${API_URL}/api/formandos/${user.id}/grades`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setGradesData(data || { grades: [] });
                    calculateStats(data.grades || []);
                }
            } catch (error) {
                console.error("Erro ao carregar notas", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGrades();
    }, [user]);



    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60dvh' }}>
            <Loader size={40} className="spin-animation" color="var(--primary)" />
        </div>
    );

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Minhas Avaliações</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Turma: <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{gradesData.turma || 'Sem turma'}</span>
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <Award size={40} color="#fbbf24" style={{ margin: '0 auto 1rem' }} />
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.media}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Média Atual</p>
                </div>
                <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 1rem' }} />
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.concluidos}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Módulos Concluídos</p>
                </div>
                <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <AlertCircle size={40} color="#f87171" style={{ margin: '0 auto 1rem' }} />
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.abertos}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Módulos em Aberto</p>
                </div>
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-glass)' }}>
                        <tr>
                            <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Módulo</th>
                            <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Carga Horária</th>
                            <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Data Avaliação</th>
                            <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nota</th>
                            <th style={{ padding: '1.25rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {gradesData.grades.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    Ainda não existem registos de avaliação.
                                </td>
                            </tr>
                        ) : (
                            gradesData.grades.map((item, index) => {
                                const nota = item.nota ? parseFloat(item.nota) : null;
                                let status = 'Em Curso';
                                let statusColor = '#3b82f6'; // blue

                                if (nota !== null) {
                                    if (nota >= 9.5) {
                                        status = 'Aprovado';
                                        statusColor = '#10b981'; // green
                                    } else {
                                        status = 'Reprovado';
                                        statusColor = '#f87171'; // red
                                    }
                                }

                                return (
                                    <motion.tr
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        style={{ borderBottom: '1px solid var(--border-glass)' }}
                                        className="hover-row"
                                    >
                                        <td style={{ padding: '1.25rem', fontWeight: '500' }}>{item.nome_modulo}</td>
                                        <td style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{item.carga_horaria}h</td>
                                        <td style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            {item.data_avaliacao ? new Date(item.data_avaliacao).toLocaleDateString() : '-'}
                                        </td>
                                        <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                                            {nota !== null ? (
                                                <span style={{
                                                    fontSize: '1.1rem', fontWeight: 'bold',
                                                    color: nota >= 9.5 ? '#10b981' : '#f87171'
                                                }}>
                                                    {nota} val
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                                            <span style={{
                                                padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600',
                                                background: `rgba(${statusColor === '#10b981' ? '16, 185, 129' : statusColor === '#f87171' ? '239, 68, 68' : '59, 130, 246'}, 0.1)`,
                                                color: statusColor,
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {status}
                                            </span>
                                        </td>
                                    </motion.tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default GradesPage;
