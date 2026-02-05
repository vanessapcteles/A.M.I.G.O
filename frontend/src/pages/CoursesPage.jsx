import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../services/courseService';
import { moduleService } from '../services/moduleService';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';

import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen,
    Plus,
    Search,
    Activity,
    Edit2,
    Trash2,
    X,
    Save,
    Cpu,
    Monitor,
    Zap,
    MoreHorizontal,
    AlertCircle
} from 'lucide-react';
import Pagination from '../components/common/Pagination';

function CoursesPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState(null);
    const [formData, setFormData] = useState({
        nome_curso: '',
        area: '',
        estado: 'planeado'
    });
    const [isNewArea, setIsNewArea] = useState(false);
    const [areas, setAreas] = useState([]);

    // Module Management State
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [currentCourse, setCurrentCourse] = useState(null);
    const [courseModules, setCourseModules] = useState([]);
    const [availableModules, setAvailableModules] = useState([]);

    const [moduleForm, setModuleForm] = useState({ id_modulo: '', horas_padrao: '', sequencia: '' });
    const [modalFilterArea, setModalFilterArea] = useState(''); // New state for modal area filter

    const user = authService.getCurrentUser();
    const role = user?.tipo_utilizador?.toUpperCase();
    const isAdmin = role === 'ADMIN' || role === 'SECRETARIA';

    useEffect(() => {
        loadCourses();
        loadAreas();
    }, [currentPage, filter, searchTerm]);

    const loadAreas = async () => {
        try {
            const data = await moduleService.getAreas();
            setAreas(data || []);
        } catch (error) {
            console.error('Erro ao carregar áreas', error);
        }
    };

    const loadCourses = async () => {
        setLoading(true);
        try {
            console.log("Loading courses with filter:", filter);
            const data = await courseService.getAllCourses({
                page: currentPage,
                limit: 6,
                estado: filter,
                search: searchTerm
            });
            console.log("Courses data received:", data);
            setCourses(data.courses || []);
            setTotalPages(data.pages || 1);
        } catch (error) {
            console.error(error);
            toast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCourse) {
                await courseService.updateCourse(editingCourse.id, formData);
                toast('Curso atualizado com sucesso!', 'success');
            } else {
                await courseService.createCourse(formData);
                toast('Curso criado com sucesso!', 'success');
            }
            setShowModal(false);
            setEditingCourse(null);
            setEditingCourse(null);
            setFormData({ nome_curso: '', area: '', estado: 'planeado' });
            setIsNewArea(false);
            loadCourses();
            loadAreas(); // Reload areas in case new one was created
        } catch (error) {
            toast(error.message, 'error');
        }
    };

    const handleDelete = async (id) => {
        const course = courses.find(c => c.id === id);
        if (course?.estado === 'terminado' && !isAdmin) {
            toast("Apenas a administração pode excluir cursos terminados.", 'error');
            return;
        }

        setCourseToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!courseToDelete) return;
        try {
            await courseService.deleteCourse(courseToDelete);
            toast('Curso eliminado com sucesso!', 'success');
            loadCourses();
            setShowDeleteConfirm(false);
            setCourseToDelete(null);
        } catch (error) {
            toast(error.message, 'error');
            setShowDeleteConfirm(false); // Close even if error to prevent stuck state
        }
    };

    const openEdit = (course) => {
        setEditingCourse(course);
        setFormData({
            nome_curso: course.nome_curso,
            area: course.area,
            estado: course.estado
        });
        setShowModal(true);
    };



    const openModuleModal = async (course) => {
        setCurrentCourse(course);
        setShowModuleModal(true);
        setModalFilterArea(''); // Reset area filter
        // Load course modules
        try {
            const cModules = await courseService.getCourseModules(course.id);
            setCourseModules(cModules);
            // Load all modules for dropdown initially
            loadAvailableModules('');
        } catch (error) {
            toast('Erro ao carregar detalhes do curso', 'error');
        }
    };

    const loadAvailableModules = async (area) => {
        try {
            // Apply area filter if present, otherwise fetch large list
            const params = { limit: 1000 };
            if (area) params.area = area;

            const allMods = await moduleService.getAllModules(params);
            setAvailableModules(Array.isArray(allMods) ? allMods : (allMods.data || []));
        } catch (error) {
            console.error("Error loading modules", error);
        }
    };

    const handleAddModule = async (e) => {
        e.preventDefault();
        try {
            await courseService.addModuleToCourse(currentCourse.id, moduleForm);

            // Refresh list
            const updated = await courseService.getCourseModules(currentCourse.id);
            setCourseModules(updated);

            toast('Módulo adicionado ao currículo', 'success');
            // Suggest next sequence
            const lastSeq = updated.length > 0 ? Math.max(...updated.map(m => m.sequencia)) : 0;
            setModuleForm({ id_modulo: '', horas_padrao: '', sequencia: String(lastSeq + 1) });
        } catch (error) {
            toast(error.message, 'error');
        }
    };

    const handleRemoveModule = async (moduleId) => {
        try {
            await courseService.removeModuleFromCourse(moduleId);
            setCourseModules(prev => prev.filter(m => m.id !== moduleId));
            toast('Módulo removido', 'success');
        } catch (error) {
            toast('Erro ao remover módulo', 'error');
        }
    };

    const getAreaIcon = (area) => {
        switch (area) {
            case 'Informática': return <Monitor size={20} />;
            case 'Robótica': return <Cpu size={20} />;
            case 'Electrónica': return <Zap size={20} />;
            default: return <MoreHorizontal size={20} />;
        }
    };

    const getStatusColor = (estado) => {
        switch (estado) {
            case 'a decorrer': return '#38bdf8';
            case 'terminado': return '#10b981';
            case 'planeado': return '#f59e0b';
            default: return '#94a3b8';
        }
    };

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                    {/* Filtros */}
                    <div className="glass-card" style={{ padding: '0.3rem', display: 'flex', gap: '0.5rem', borderRadius: '12px' }}>
                        {['all', 'planeado', 'a decorrer', 'terminado', 'brevemente'].map((f) => (
                            <button
                                key={f}
                                onClick={() => { setFilter(f); setCurrentPage(1); }}
                                style={{
                                    background: filter === f ? 'var(--primary-glow)' : 'transparent',
                                    border: 'none',
                                    color: filter === f ? 'var(--primary)' : 'var(--text-secondary)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: filter === f ? '600' : '400',
                                    textTransform: 'capitalize',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {f === 'all' ? 'Todos' : f}
                            </button>
                        ))}
                    </div>

                    <div style={{ position: 'relative', minWidth: '250px' }}>
                        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                        <input
                            type="text"
                            placeholder="Pesquisar curso..."
                            className="input-field"
                            style={{ paddingLeft: '3rem' }}
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                </div>

                {isAdmin && (
                    <button className="btn-primary" onClick={() => { setEditingCourse(null); setFormData({ nome_curso: '', area: '', estado: 'planeado' }); setIsNewArea(false); setShowModal(true); }}>
                        <Plus size={20} /> Novo Curso
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                    <div className="loader"></div>
                </div>
            ) : (
                <>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        {courses.map((course) => (
                            <div
                                key={course.id}
                                className="glass-card"
                                style={{
                                    borderTop: `3px solid ${getStatusColor(course.estado)}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    minHeight: '200px',
                                    transition: 'transform 0.2s ease-in-out'
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                        <div style={{
                                            width: '45px', height: '45px', borderRadius: '12px',
                                            background: 'var(--card-hover-bg)', border: '1px solid var(--border-glass)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)'
                                        }}>
                                            {getAreaIcon(course.area)}
                                        </div>
                                        {isAdmin && (
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                <button onClick={() => openEdit(course)} className="btn-glass" style={{ padding: '0.4rem', borderRadius: '8px' }}>
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(course.id)} className="btn-glass" style={{ padding: '0.4rem', borderRadius: '8px', color: '#f87171' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                                <button onClick={() => openModuleModal(course)} className="btn-glass" title="Gerir Currículo" style={{ padding: '0.4rem', borderRadius: '8px', color: 'var(--primary)' }}>
                                                    <BookOpen size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem' }}>{course.nome_curso}</h3>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{course.area}</div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--border-glass)' }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        padding: '0.25rem 0.75rem', borderRadius: '20px',
                                        background: `${getStatusColor(course.estado)}15`,
                                        color: getStatusColor(course.estado),
                                        fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase'
                                    }}>
                                        <Activity size={12} />
                                        {course.estado}
                                    </div>

                                    {authService.getCurrentUser()?.tipo_utilizador?.toUpperCase() === 'CANDIDATO' && course.estado !== 'terminado' && (
                                        <button
                                            onClick={() => navigate('/candidato', { state: { interestedIn: course.id } })}
                                            className="btn-primary"
                                            style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                                        >
                                            Candidatar
                                        </button>
                                    )}

                                    {isAdmin && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: #{course.id}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {courses.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
                            <BookOpen size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                            <p>Nenhum curso encontrado nesta categoria.</p>
                        </div>
                    )}

                    {/* Pagination */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </>
            )}

            {showModuleModal && currentCourse && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card"
                        style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>Currículo do Curso</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{currentCourse.nome_curso}</p>
                            </div>
                            <button onClick={() => setShowModuleModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
                            {/* Left: Add Form */}
                            <div>
                                <h4 style={{ marginBottom: '1rem', color: 'var(--primary)', fontSize: '1rem' }}>Adicionar Módulo</h4>
                                <form onSubmit={handleAddModule} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {/* Area Filter */}
                                    <div>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Filtrar por Área</label>
                                        <select
                                            className="input-field"
                                            value={modalFilterArea}
                                            onChange={(e) => {
                                                const area = e.target.value;
                                                setModalFilterArea(area);
                                                loadAvailableModules(area);
                                            }}
                                        >
                                            <option value="">Todas as Áreas</option>
                                            <option value="Informática">Informática</option>
                                            <option value="Robótica">Robótica</option>
                                            <option value="Electrónica">Electrónica</option>
                                            <option value="Outra">Outra</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Módulo</label>
                                        <select
                                            className="input-field"
                                            required
                                            value={moduleForm.id_modulo}
                                            onChange={e => {
                                                const mod = availableModules.find(m => m.id == e.target.value);
                                                setModuleForm({
                                                    ...moduleForm,
                                                    id_modulo: e.target.value,
                                                    horas_padrao: mod ? mod.carga_horaria : ''
                                                });
                                            }}
                                        >
                                            <option value="">Selecione...</option>
                                            {availableModules.map(m => (
                                                <option key={m.id} value={m.id}>{m.nome_modulo} ({m.carga_horaria}h)</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Horas</label>
                                            <input
                                                type="number" className="input-field"
                                                value={moduleForm.horas_padrao}
                                                onChange={e => setModuleForm({ ...moduleForm, horas_padrao: e.target.value })}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sequência</label>
                                            <input
                                                type="number" className="input-field"
                                                value={moduleForm.sequencia}
                                                placeholder="Auto"
                                                onChange={e => setModuleForm({ ...moduleForm, sequencia: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
                                        <Plus size={16} /> Adicionar
                                    </button>
                                </form>
                            </div>

                            {/* Right: List */}
                            <div>
                                <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1rem' }}>Módulos Associados ({courseModules.length})</h4>
                                <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                    {courseModules.length === 0 ? (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-glass)', borderRadius: '8px' }}>
                                            Sem módulos associados.
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {courseModules.map((cm, idx) => (
                                                <div key={cm.id} className="glass-card" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <span style={{
                                                            width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary-glow)',
                                                            color: 'var(--primary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                                                        }}>
                                                            {cm.sequencia || idx + 1}
                                                        </span>
                                                        <div>
                                                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{cm.nome_modulo}</div>
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{cm.horas_padrao} horas</div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveModule(cm.id)}
                                                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.25rem' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card"
                        style={{ maxWidth: '450px', width: '90%', padding: '2.5rem' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{editingCourse ? 'Editar Curso' : 'Novo Curso'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nome do Curso</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    required
                                    value={formData.nome_curso}
                                    onChange={(e) => setFormData({ ...formData, nome_curso: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Área Técnica</label>
                                {!isNewArea ? (
                                    <select
                                        className="input-field"
                                        required
                                        value={formData.area}
                                        onChange={(e) => {
                                            if (e.target.value === '__NEW__') {
                                                setIsNewArea(true);
                                                setFormData({ ...formData, area: '' });
                                            } else {
                                                setFormData({ ...formData, area: e.target.value });
                                            }
                                        }}
                                    >
                                        <option value="">A selecionar...</option>
                                        {areas.map(area => (
                                            <option key={area} value={area}>{area}</option>
                                        ))}
                                        <option value="__NEW__" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>+ Nova Área</option>
                                    </select>
                                ) : (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            type="text"
                                            className="input-field"
                                            required
                                            value={formData.area}
                                            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                            placeholder="Nome da nova área"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => { setIsNewArea(false); setFormData({ ...formData, area: '' }); }}
                                            className="btn-secondary"
                                            title="Cancelar"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estado</label>
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

                            <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                                <Save size={18} /> {editingCourse ? 'Guardar Alterações' : 'Criar Curso'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )
            }

            {/* Delete Confirmation Dialog - Bottom Center */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 50, x: '-50%' }}
                        style={{
                            position: 'fixed',
                            bottom: '2rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#1e293b',
                            border: '1px solid var(--border-glass)',
                            borderRadius: '16px',
                            padding: '1.5rem 2rem',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                            zIndex: 10001,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1rem',
                            minWidth: '350px'
                        }}
                    >
                        <AlertCircle size={32} color="#f87171" />
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Eliminar Curso?</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Esta ação não pode ser desfeita.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '0.5rem' }}>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="btn-glass"
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="btn-primary"
                                style={{ flex: 1, justifyContent: 'center', background: '#dc2626', borderColor: '#dc2626' }}
                            >
                                Eliminar
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}

export default CoursesPage;
