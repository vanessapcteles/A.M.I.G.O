import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { turmaService } from '../services/turmaService';
import { moduleService } from '../services/moduleService';
import { roomService } from '../services/roomService';
import { API_URL } from '../services/authService';
import { ArrowLeft, Save, Trash2, Plus, AlertCircle, Users } from 'lucide-react';

function TurmaDetailsPage() {
    const { id } = useParams(); // Turma ID
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [turmaModules, setTurmaModules] = useState([]);
    const [turmaFormandos, setTurmaFormandos] = useState([]);

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
            const [modules, formandos, allModules, rooms, trainersRes] = await Promise.all([
                turmaService.getTurmaModules(id),
                turmaService.getTurmaFormandos(id),
                moduleService.getAllModules(),
                roomService.getAllRooms(),
                fetch(`${API_URL}/api/formadores`, { headers: getAuthHeader() }) // Fetch manual pq nao temos service especifico exportado ainda
            ]);

            setTurmaModules(modules);
            setTurmaFormandos(formandos);
            setAvailableModules(allModules);
            setAvailableRooms(rooms);

            const trainersData = await trainersRes.json();
            setAvailableTrainers(trainersData);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddModule = async (e) => {
        e.preventDefault();
        try {
            await turmaService.addModuleToTurma(id, formData);
            // Refresh
            const updatedModules = await turmaService.getTurmaModules(id);
            setTurmaModules(updatedModules);
            // Limpar form
            setFormData({ ...formData, id_modulo: '', horas_planeadas: '', sequencia: String(updatedModules.length + 2) });
        } catch (error) {
            alert(error.message);
        }
    };

    const handleRemoveModule = async (detalheId) => {
        if (!window.confirm('Remover este módulo desta turma?')) return;
        try {
            await turmaService.removeModuleFromTurma(detalheId);
            setTurmaModules(prev => prev.filter(m => m.id !== detalheId));
        } catch (error) {
            alert(error.message);
        }
    };

    // Auto-fill hours when module is selected
    const handleModuleChange = (moduleId) => {
        const mod = availableModules.find(m => m.id === parseInt(moduleId));
        setFormData(prev => ({
            ...prev,
            id_modulo: moduleId,
            horas_planeadas: mod ? mod.carga_horaria : ''
        }));
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
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Distribuição de Módulos da Turma</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Associe módulos, formadores e salas a esta turma.</p>
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
                                    <tr key={tm.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                        <td style={{ padding: '0.75rem' }}>{tm.sequencia}</td>
                                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{tm.nome_modulo}</td>
                                        <td style={{ padding: '0.75rem' }}>{tm.nome_formador}</td>
                                        <td style={{ padding: '0.75rem' }}>{tm.nome_sala}</td>
                                        <td style={{ padding: '0.75rem' }}>{tm.horas_planeadas}h</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <button onClick={() => handleRemoveModule(tm.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
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

                {/* FORMULÁRIO DE ADIÇÃO */}
                <div className="glass-card" style={{ height: 'fit-content' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} color="var(--primary)" /> Adicionar Módulo
                    </h3>

                    <form onSubmit={handleAddModule} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Módulo</label>
                            <select
                                className="input-field"
                                required
                                value={formData.id_modulo}
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
                                    <option key={r.id} value={r.id}>{r.nome}</option>
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
                            Gravar Associação
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}

export default TurmaDetailsPage;
