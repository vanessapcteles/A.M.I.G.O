import { useState, useEffect } from 'react';
import { moduleService } from '../services/moduleService';

import { motion } from 'framer-motion';
import {
    Book,
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Save,
    Clock
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/common/ConfirmDialog';

import Pagination from '../components/common/Pagination';

function ModulesPage() {
    const { toast } = useToast();
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [showModal, setShowModal] = useState(false);
    const [editingModule, setEditingModule] = useState(null);

    // Confirm Dialog State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [moduleToDelete, setModuleToDelete] = useState(null);

    const [formData, setFormData] = useState({
        nome_modulo: '',
        carga_horaria: 25
    });

    useEffect(() => {
        loadModules();
    }, [currentPage, searchTerm]);

    const loadModules = async () => {
        setLoading(true);
        try {
            const data = await moduleService.getAllModules({
                page: currentPage,
                limit: 12, // Um pouco mais, pois são cards pequenos
                search: searchTerm
            });
            // Fallback para backward compatibility caso o backend ainda não tenha atualizado
            const modulesList = Array.isArray(data) ? data : (data.data || []);
            setModules(modulesList);
            setTotalPages(data.pages || 1);
        } catch (error) {
            console.error(error);
            toast('Erro ao carregar módulos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingModule) {
                await moduleService.updateModule(editingModule.id, formData);
                toast('Módulo atualizado com sucesso!', 'success');
            } else {
                await moduleService.createModule(formData);
                toast('Módulo criado com sucesso!', 'success');
            }
            setShowModal(false);
            setEditingModule(null);
            setFormData({ nome_modulo: '', carga_horaria: 25 });
            loadModules();
        } catch (error) {
            toast(error.message || 'Erro ao guardar módulo', 'error');
        }
    };

    const handleDelete = (id) => {
        setModuleToDelete(id);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!moduleToDelete) return;
        try {
            await moduleService.deleteModule(moduleToDelete);
            toast('Módulo eliminado com sucesso!', 'success');
            loadModules();
        } catch (error) {
            toast(error.response?.data?.message || error.message, 'error');
        }
    };

    const openEdit = (modulo) => {
        setEditingModule(modulo);
        setFormData({
            nome_modulo: modulo.nome_modulo,
            carga_horaria: modulo.carga_horaria
        });
        setShowModal(true);
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar módulo..."
                        className="input-field"
                        style={{ paddingLeft: '3rem' }}
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                </div>
                <button className="btn-primary" onClick={() => { setEditingModule(null); setFormData({ nome_modulo: '', carga_horaria: 25 }); setShowModal(true); }}>
                    <Plus size={20} /> Novo Módulo
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando módulos...</div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                        {modules.map((modulo) => (
                            <motion.div
                                key={modulo.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card"
                                style={{ position: 'relative' }}
                            >
                                <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => openEdit(modulo)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(modulo.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: 'rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--primary)'
                                    }}>
                                        <Book size={20} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.15rem', fontWeight: '600' }}>{modulo.nome_modulo}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            <Clock size={12} /> {modulo.carga_horaria} Horas
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {modules.length === 0 && (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                Nenhum módulo encontrado.
                            </div>
                        )}
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </>
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
                        style={{ maxWidth: '450px', width: '90%', padding: '2.5rem' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.5rem' }}>{editingModule ? 'Editar Módulo' : 'Novo Módulo'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nome do Módulo</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    required
                                    value={formData.nome_modulo}
                                    onChange={(e) => setFormData({ ...formData, nome_modulo: e.target.value })}
                                    placeholder="Ex: Programação C++"
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Carga Horária</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    required
                                    min="1"
                                    value={formData.carga_horaria}
                                    onChange={(e) => setFormData({ ...formData, carga_horaria: parseInt(e.target.value) })}
                                />
                            </div>

                            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                                <Save size={20} /> {editingModule ? 'Salvar Alterações' : 'Criar Módulo'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="Eliminar Módulo"
                message="Tem a certeza que deseja eliminar este módulo? Esta ação não pode ser desfeita."
                isDestructive={true}
            />
        </>
    );
}

export default ModulesPage;
