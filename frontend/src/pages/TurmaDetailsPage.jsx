import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { turmaService } from '../services/turmaService';
import { moduleService } from '../services/moduleService';
import { roomService } from '../services/roomService';
import { API_URL } from '../services/authService';
import { ArrowLeft, Save, Trash2, Plus, AlertCircle, Users, Download, BookOpen } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/common/ConfirmDialog';

function TurmaDetailsPage() {
    const { id } = useParams(); // Turma ID
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [turmaInfo, setTurmaInfo] = useState(null);
    const [turmaModules, setTurmaModules] = useState([]);
    const [turmaFormandos, setTurmaFormandos] = useState([]);

    // Confirmation State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [moduleToRemove, setModuleToRemove] = useState(null);
    const [editingModule, setEditingModule] = useState(null);

    // Listas para os Dropdowns
    const [availableModules, setAvailableModules] = useState([]);
    const [availableTrainers, setAvailableTrainers] = useState([]);
    const [availableRooms, setAvailableRooms] = useState([]);

    // Form Stats
    const [formData, setFormData] = useState({
        id_modulo: '',
        id_formador: '',
        id_sala: '',
        horas_planeadas: '',
        sequencia: ''
    });

    const getAuthHeader = () => ({
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            // 1. Fetch Turma Details FIRST to get Course ID
            const turmaDetails = await turmaService.getTurma(id);
            setTurmaInfo(turmaDetails);

            // 2. Fetch dependencies with Course Context
            const [modules, formandos, allModules, rooms, trainersRes] = await Promise.all([
                turmaService.getTurmaModules(id),
                turmaService.getTurmaFormandos(id),
                moduleService.getAllModules({ limit: 1000, courseId: turmaDetails.id_curso }), // Filter by Course
                roomService.getAllRooms(),
                fetch(`${API_URL}/api/formadores`, { headers: getAuthHeader() })
            ]);

            setTurmaModules(modules);
            setTurmaFormandos(formandos);

            // Handle pagination response format for modules
            const modulesList = Array.isArray(allModules) ? allModules : (allModules.data || []);
            setAvailableModules(modulesList);

            setAvailableRooms(rooms);

            const trainersData = await trainersRes.json();
            setAvailableTrainers(trainersData);

        } catch (error) {
            console.error(error);
            toast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitModule = async (e) => {
        e.preventDefault();
        try {
            if (editingModule) {
                // Update existing assignment
                await turmaService.updateTurmaModule(editingModule.id, formData);
                toast('Atribuição atualizada!', 'success');
            } else {
                // Add new module (extra)
                await turmaService.addModuleToTurma(id, formData);
                toast('Módulo adicionado com sucesso!', 'success');
            }

            // Refresh
            const updatedModules = await turmaService.getTurmaModules(id);
            setTurmaModules(updatedModules);

            // Reset form
            setEditingModule(null);
            setFormData({
                id_modulo: '', id_formador: '', id_sala: '', horas_planeadas: '',
                sequencia: String(updatedModules.length + 2)
            });
        } catch (error) {
            toast(error.message, 'error');
        }
    };

    const startEdit = (module) => {
        setEditingModule(module);
        setFormData({
            id_modulo: module.id_modulo,
            id_formador: module.id_formador || '',
            id_sala: module.id_sala || '',
            horas_planeadas: module.horas_planeadas,
            sequencia: module.sequencia
        });
        // Scroll to form (optional)
        document.getElementById('module-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingModule(null);
        setFormData({
            id_modulo: '', id_formador: '', id_sala: '', horas_planeadas: '',
            sequencia: String(turmaModules.length + 1)
        });
    };

    const confirmRemoveModule = (detalheId) => {
        setModuleToRemove(detalheId);
        setConfirmOpen(true);
    };

    const handleRemoveModule = async () => {
        if (!moduleToRemove) return;
        try {
            await turmaService.removeModuleFromTurma(moduleToRemove);
            setTurmaModules(prev => prev.filter(m => m.id !== moduleToRemove));
            toast('Módulo removido com sucesso!', 'success');
        } catch (error) {
            toast(error.message, 'error');
        }
    };

    // Auto-fill hours when module is selected OR check if already exists
    // Auto-fill hours when module is selected OR check if already exists
    const handleModuleChange = (moduleId) => {
        const idInt = parseInt(moduleId);

        // Check if module is already assigned to this class
        const existing = turmaModules.find(tm => tm.id_modulo === idInt);
        if (existing) {
            startEdit(existing);
            toast("Módulo já existente. Modo de edição ativado.", 'info');
            return;
        }

        // New module logic
        const mod = availableModules.find(m => m.id === idInt);
        setFormData(prev => ({
            ...prev,
            id_modulo: moduleId,
            horas_planeadas: mod ? mod.carga_horaria : ''
        }));
    };

    const handleImportCurriculum = async () => {
        try {
            const res = await turmaService.importCurriculum(id);
            toast(res.message, 'success');
            // Refresh modules
            const updatedModules = await turmaService.getTurmaModules(id);
            setTurmaModules(updatedModules);
        } catch (error) {
            toast(error.message, 'error');
        }
    };

    const getFilteredModules = () => {
        if (!turmaInfo || !availableModules) return availableModules;
        // Prioritize modules that belong to the course area or aren't assigned yet?
        // simple: return all attached, but maybe sort match?
        // for now just returns all as requested, but we could improve later.
        return availableModules;
    };

    return (
        <>
            <div style={{ marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate('/turmas')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '1rem' }}
                >
                    <ArrowLeft size={16} /> Voltar às Turmas
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {turmaInfo ? (
                                <>
                                    <span style={{ color: 'var(--primary)' }}>{turmaInfo.codigo_turma}</span>
                                    <span style={{ opacity: 0.3 }}>|</span>
                                    <span>{turmaInfo.nome_curso}</span>
                                </>
                            ) : 'Carregando...'}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Distribuição de Módulos e Formadores</p>
                    </div>

                    <button
                        onClick={handleImportCurriculum}
                        className="glass-card full-hover"
                        style={{
                            padding: '0.75rem 1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            fontSize: '0.9rem',
                            color: 'var(--text-primary)',
                            cursor: 'pointer'
                        }}
                        title="Importar todos os módulos definidos no Curso"
                    >
                        <Download size={18} className="text-gradient" />
                        <span>Importar Módulos</span>
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

                {/* LISTA DE MÓDULOS JÁ ASSOCIADOS */}
                <div className="glass-card">
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Plano Curricular (Módulos)</h3>

                    {turmaModules.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <AlertCircle size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                            <p>Ainda não há módulos nesta turma.</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '0.75rem' }}>Seq.</th>
                                    <th style={{ padding: '0.75rem' }}>Módulo</th>
                                    <th style={{ padding: '0.75rem' }}>Formador</th>
                                    <th style={{ padding: '0.75rem' }}>Sala</th>
                                    <th style={{ padding: '0.75rem' }}>Horas</th>
                                    <th style={{ padding: '0.75rem' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {turmaModules.map(tm => (
                                    <tr key={tm.id} style={{ borderBottom: '1px solid var(--border-glass)', background: editingModule?.id === tm.id ? 'rgba(255,255,255,0.05)' : 'transparent' }}>
                                        <td style={{ padding: '0.75rem' }}>{tm.sequencia}</td>
                                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{tm.nome_modulo}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            {tm.nome_formador ? (
                                                tm.nome_formador
                                            ) : (
                                                <button
                                                    onClick={() => startEdit(tm)}
                                                    style={{
                                                        background: 'none', border: '1px solid #f87171', color: '#f87171',
                                                        fontSize: '0.8rem', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer'
                                                    }}
                                                    title="Clique para atribuir formador"
                                                >
                                                    Por atribuir
                                                </button>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            {tm.nome_sala ? (
                                                tm.nome_sala
                                            ) : (
                                                <button
                                                    onClick={() => startEdit(tm)}
                                                    style={{
                                                        background: 'none', border: '1px solid #f87171', color: '#f87171',
                                                        fontSize: '0.8rem', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer'
                                                    }}
                                                    title="Clique para atribuir sala"
                                                >
                                                    Por atribuir
                                                </button>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>{tm.horas_planeadas}h</td>
                                        <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => startEdit(tm)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }} title="Editar Atribuição">
                                                <Users size={16} />
                                            </button>
                                            <button onClick={() => confirmRemoveModule(tm.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }} title="Remover Módulo">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* LISTA DE FORMANDOS */}
                <div className="glass-card">
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={18} color="var(--primary)" /> Formandos Inscritos ({turmaFormandos.length})
                    </h3>

                    {turmaFormandos.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <p>Sem formandos inscritos nesta turma.</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '0.75rem' }}>Nome</th>
                                    <th style={{ padding: '0.75rem' }}>Email</th>
                                    <th style={{ padding: '0.75rem' }}>Contacto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {turmaFormandos.map(f => (
                                    <tr key={f.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{f.nome_completo}</td>
                                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{f.email}</td>
                                        <td style={{ padding: '0.75rem' }}>{f.telemovel || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* FORMULÁRIO DE ADIÇÃO / EDIÇÃO */}
                <div id="module-form" className="glass-card" style={{ height: 'fit-content', border: editingModule ? '1px solid var(--primary)' : 'none' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {editingModule ? <Users size={18} color="var(--primary)" /> : <Plus size={18} color="var(--primary)" />}
                            {editingModule ? 'Editar Atribuição' : 'Adicionar Módulo'}
                        </span>
                        {editingModule && (
                            <button onClick={cancelEdit} style={{ fontSize: '0.8rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                Cancelar
                            </button>
                        )}
                    </h3>

                    <form onSubmit={handleSubmitModule} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Módulo</label>
                            <select
                                className="input-field"
                                required
                                value={formData.id_modulo}
                                disabled={!!editingModule}
                                onChange={e => handleModuleChange(e.target.value)}
                            >
                                <option value="">Selecione Módulo...</option>
                                {availableModules.map(m => (
                                    <option key={m.id} value={m.id}>{m.nome_modulo} ({m.carga_horaria}h)</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Formador</label>
                            <select
                                className="input-field"
                                required
                                value={formData.id_formador}
                                onChange={e => setFormData({ ...formData, id_formador: e.target.value })}
                            >
                                <option value="">Selecione Formador...</option>
                                {/* O id vindo do endpoint formadores é users.id, mas turma_details espera formadores.id? 
                                    Wait, formadorController.listFormadores return users joined with formadores.
                                    The ID returned is u.id (user id). 
                                    My database relation is id_formador -> formadores(id).
                                    I need to check what id_formador I'm sending.
                                    Wait, formadorController listQuery returns u.id.
                                    The table turma_detalhes links to formadores(id).
                                    So 'id_formador' in insert must be the formadores PK, not users PK.
                                    
                                    Let's check getFormadores controller again.
                                */}
                                {availableTrainers.map(t => (
                                    <option key={t.id} value={t.id_formador_perfil}>{t.nome_completo}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Sala</label>
                            <select
                                className="input-field"
                                required
                                value={formData.id_sala}
                                onChange={e => setFormData({ ...formData, id_sala: e.target.value })}
                            >
                                <option value="">Selecione Sala...</option>
                                {availableRooms.map(r => (
                                    <option key={r.id} value={r.id}>{r.nome_sala}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Horas Totais</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    required
                                    value={formData.horas_planeadas}
                                    onChange={e => setFormData({ ...formData, horas_planeadas: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Sequência</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={formData.sequencia}
                                    placeholder="Auto"
                                    onChange={e => setFormData({ ...formData, sequencia: e.target.value })}
                                />
                            </div>
                        </div>


                        <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                            {editingModule ? 'Atualizar Atribuição' : 'Gravar Associação'}
                        </button>
                    </form>
                </div>
            </div>

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleRemoveModule}
                title="Remover Módulo"
                message="Tem a certeza que deseja remover este módulo desta turma?"
                isDestructive={true}
            />
        </>
    );
}

export default TurmaDetailsPage;
