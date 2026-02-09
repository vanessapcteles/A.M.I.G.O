
import { useState, useEffect } from 'react';
import { formadorService } from '../services/formadorService';
import { evaluationService } from '../services/evaluationService';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { BookOpen, Save, ChevronRight, AlertCircle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Pagination from '../components/common/Pagination';

function TrainerGradesPage() {
    const { toast } = useToast();
    const user = authService.getCurrentUser();

    const [history, setHistory] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null); // { turmaId, moduloId, nome_modulo, codigo_turma }
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const data = await formadorService.getHistory(user.id);
            // The history usually has id_turma, id_modulo, etc.
            // Let's check the backend query in formadorController
            // Need to make sure it returns enough IDs.
            setHistory(data);
        } catch (error) {
            toast('Erro ao carregar os seus módulos.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAssignment = async (item) => {
        setLoading(true);
        setSelectedAssignment(item);
        try {
            // Need to make sure item has id_turma and id_modulo
            // Let's verify the query in getFormadorHistory
            const data = await evaluationService.getStudentsForEvaluation(item.id_turma, item.id_modulo);
            setStudents(data.map(s => ({
                ...s,
                nota: s.nota || '',
                observacoes: s.observacoes || ''
            })));
        } catch (error) {
            toast(error.message, 'error');
            setSelectedAssignment(null);
        } finally {
            setLoading(false);
        }
    };

    const handleGradeChange = (index, value) => {
        const newStudents = [...students];
        newStudents[index].nota = value;
        setStudents(newStudents);
    };

    const handleObsChange = (index, value) => {
        const newStudents = [...students];
        newStudents[index].observacoes = value;
        setStudents(newStudents);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const gradesToSubmit = students.map(s => ({
                id_inscricao: s.id_inscricao,
                nota: s.nota === '' ? null : s.nota,
                observacoes: s.observacoes
            })).filter(s => s.nota !== null);

            if (gradesToSubmit.length === 0) {
                toast('Insira pelo menos uma nota.', 'warning');
                return;
            }

            await evaluationService.submitGrades(selectedAssignment.id_modulo, gradesToSubmit);
            toast('Notas guardadas com sucesso!', 'success');
        } catch (error) {
            toast(error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading && history.length === 0) return <div style={{ padding: '2rem' }}>Carregando...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <header>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Avaliações</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Lançamento de notas por Turma e Módulo</p>
            </header>

            {!selectedAssignment ? (
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BookOpen size={20} color="var(--primary)" /> Selecione o Módulo para Avaliar
                    </h3>

                    {history.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                            <AlertCircle size={48} style={{ margin: '0 auto 1rem' }} />
                            <p>Não foram encontrados módulos atribuídos a si.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.2rem' }}>
                                {history
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((item, idx) => (
                                        <motion.div
                                            key={idx}
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => handleSelectAssignment(item)}
                                            className="glass-card full-hover"
                                            style={{ padding: '1.5rem', cursor: 'pointer', border: '1px solid var(--border-glass)' }}
                                        >
                                            <div style={{ color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.5rem' }}>{item.codigo_turma}</div>
                                            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{item.nome_modulo}</h4>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.nome_curso}</div>
                                            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                                <ChevronRight size={20} color="var(--primary)" />
                                            </div>
                                        </motion.div>
                                    ))}
                            </div>

                            {history.length > itemsPerPage && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={Math.ceil(history.length / itemsPerPage)}
                                    onPageChange={setCurrentPage}
                                />
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <button
                                onClick={() => setSelectedAssignment(null)}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', marginBottom: '0.5rem', fontSize: '0.9rem' }}
                            >
                                ← Voltar à lista
                            </button>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
                                {selectedAssignment.nome_modulo} <span style={{ opacity: 0.5 }}>-</span> {selectedAssignment.codigo_turma}
                            </h2>
                        </div>
                        <button
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 2rem' }}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            <Save size={18} /> {saving ? 'A guardar...' : 'Guardar Notas'}
                        </button>
                    </div>

                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: '400px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                            <input
                                type="text"
                                placeholder="Pesquisar formando..."
                                className="input-field"
                                style={{ paddingLeft: '40px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '1rem' }}>Formando</th>
                                    <th style={{ padding: '1rem', width: '120px' }}>Nota (0-20)</th>
                                    <th style={{ padding: '1rem' }}>Observações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students
                                    .filter(s => s.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map((s, idx) => (
                                        <tr key={s.id_inscricao} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: '600' }}>{s.nome_completo}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.email}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <input
                                                    type="number"
                                                    min="0" max="20" step="0.1"
                                                    className="input-field"
                                                    style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}
                                                    value={s.nota}
                                                    onChange={(e) => handleGradeChange(idx, e.target.value)}
                                                />
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <input
                                                    type="text"
                                                    className="input-field"
                                                    placeholder="Notas internas..."
                                                    value={s.observacoes}
                                                    onChange={(e) => handleObsChange(idx, e.target.value)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TrainerGradesPage;
