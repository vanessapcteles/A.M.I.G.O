import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { turmaService } from '../services/turmaService';
import { authService } from '../services/authService';

import { motion } from 'framer-motion';
import {
    Users,
    Plus,
    Search,
    Calendar as CalendarIcon,
    BookOpen,
    Edit2,
    Trash2,
    X,
    Save,
    Clock,
    CheckCircle2
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/common/ConfirmDialog';

function TurmasPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [turmas, setTurmas] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingTurma, setEditingTurma] = useState(null);

    // Confirm Dialog State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [turmaToDelete, setTurmaToDelete] = useState(null);

    const [formData, setFormData] = useState({
        id_curso: '',
        codigo_turma: '',
        data_inicio: '',
        data_fim: '',
        estado: 'planeado'
    });

    const user = authService.getCurrentUser();
    const role = user?.tipo_utilizador?.toUpperCase();
    const isAdmin = role === 'ADMIN' || role === 'SECRETARIA';
    const isFormador = role === 'FORMADOR';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [turmasData, cursosData] = await Promise.all([
                turmaService.getAllTurmas(),
                turmaService.getCursos()
            ]);

            // Se for formador, filtrar turmas (assumindo que turmasData tem id_formador ou link similar)
            // Por agora, mostramos todas mas escondemos ações de escrita.
            // Para filtrar realmente precisaríamos de endpoint específico ou campo na DB.
            setTurmas(turmasData);
            setCursos(cursosData);
        } catch (error) {
            console.error(error);
            toast('Erro ao carregar dados', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAdmin) return;
        try {
            if (editingTurma) {
                await turmaService.updateTurma(editingTurma.id, formData);
                toast('Turma atualizada com sucesso!', 'success');
            } else {
                await turmaService.createTurma(formData);
                toast('Turma criada com sucesso!', 'success');
            }
            setShowModal(false);
            setEditingTurma(null);
            setFormData({ id_curso: '', codigo_turma: '', data_inicio: '', data_fim: '', estado: 'planeado' });
            loadData();
        } catch (error) {
            toast(error.message, 'error');
        }
    };

    const handleDelete = (id) => {
        if (!isAdmin) return;
        setTurmaToDelete(id);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!turmaToDelete) return;
        try {
            await turmaService.deleteTurma(turmaToDelete);
            toast('Turma eliminada com sucesso!', 'success');
            loadData();
        } catch (error) {
            toast(error.message, 'error');
        }
    };

    const openEdit = (turma) => {
        if (!isAdmin) return;
        setEditingTurma(turma);
        setFormData({
            id_curso: turma.id_curso,
            codigo_turma: turma.codigo_turma,
            data_inicio: turma.data_inicio.split('T')[0],
            data_fim: turma.data_fim.split('T')[0],
            estado: turma.estado
        });
        setShowModal(true);
    };

    const getStatusColor = (estado) => {
        switch (estado) {
            case 'a decorrer': return '#3b82f6';
            case 'terminado': return '#10b981';
            default: return '#94a3b8';
        }
    };

    const filteredTurmas = turmas.filter(turma =>
        turma.codigo_turma.toLowerCase().includes(searchTerm.toLowerCase()) ||
        turma.nome_curso.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar turma ou curso..."
                        className="input-field"
                        style={{ paddingLeft: '3rem' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {isAdmin && (
                    <button className="btn-primary" onClick={() => { setEditingTurma(null); setFormData({ id_curso: '', codigo_turma: '', data_inicio: '', data_fim: '', estado: 'planeado' }); setShowModal(true); }}>
                        <Plus size={20} /> Nova Turma
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando turmas...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {filteredTurmas.map((turma) => (
                        <motion.div
                            key={turma.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card"
                            style={{ position: 'relative' }}
                        >
                            <div style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                display: 'flex',
                                gap: '0.5rem'
                            }}>
                                <button onClick={() => navigate(`/turmas/${turma.id}/schedule`)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Horário">
                                    <CalendarIcon size={16} />
                                </button>
                                <button onClick={() => navigate(`/turmas/${turma.id}`)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Gerir Módulos">
                                    <BookOpen size={16} />
                                </button>
                                {isAdmin && (
                                    <>
                                        <button onClick={() => openEdit(turma)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(turma.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <span style={{
                                    fontSize: '0.7rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    color: getStatusColor(turma.estado),
                                    fontWeight: 'bold',
                                    display: 'block',
                                    marginBottom: '0.5rem'
                                }}>
                                    {turma.estado}
                                </span>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: '700' }}>{turma.codigo_turma}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{turma.nome_curso}</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    <CalendarIcon size={16} />
                                    <span>{new Date(turma.data_inicio).toLocaleDateString()} - {new Date(turma.data_fim).toLocaleDateString()}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    <Users size={16} />
                                    <span>Gestão de Formandos</span>
                                </div>
                            </div>


                        </motion.div>
                    ))}
                </div>
            )}

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card"
                        style={{ maxWidth: '500px', width: '90%', padding: '2.5rem' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{editingTurma ? 'Editar Turma' : 'Configurar Nova Turma'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Código da Turma</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    required
                                    value={formData.codigo_turma}
                                    onChange={(e) => setFormData({ ...formData, codigo_turma: e.target.value })}
                                    placeholder="Ex: TPSI-0124"
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Curso Associado</label>
                                <select
                                    className="input-field"
                                    required
                                    value={formData.id_curso}
                                    onChange={(e) => setFormData({ ...formData, id_curso: e.target.value })}
                                >
                                    <option value="">Selecionar Curso...</option>
                                    {cursos.map(curso => (
                                        <option key={curso.id} value={curso.id}>{curso.nome_curso}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Data Início</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        required
                                        value={formData.data_inicio}
                                        onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Data Fim</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        required
                                        value={formData.data_fim}
                                        onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estado da Turma</label>
                                <select
                                    className="input-field"
                                    value={formData.estado}
                                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                >
                                    <option value="planeado">Planeado</option>
                                    <option value="a decorrer">A Decorrer</option>
                                    <option value="terminado">Terminado</option>
                                </select>
                            </div>

                            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}>
                                <Save size={20} /> {editingTurma ? 'Atualizar Turma' : 'Criar Turma'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="Eliminar Turma"
                message="Tem a certeza que deseja eliminar esta turma? Esta ação não pode ser desfeita."
                isDestructive={true}
            />
        </>
    );
}

export default TurmasPage;
