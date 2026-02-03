import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../services/courseService';
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
        area: 'Informática',
        estado: 'planeado'
    });

    const user = authService.getCurrentUser();
    const role = user?.tipo_utilizador?.toUpperCase();
    const isAdmin = role === 'ADMIN' || role === 'SECRETARIA';

    useEffect(() => {
        loadCourses();
    }, [currentPage, filter, searchTerm]);

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
            setFormData({ nome_curso: '', area: 'Informática', estado: 'planeado' });
            loadCourses();
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
                    <button className="btn-primary" onClick={() => { setEditingCourse(null); setFormData({ nome_curso: '', area: 'Informática', estado: 'planeado' }); setShowModal(true); }}>
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
                                <select
                                    className="input-field"
                                    value={formData.area}
                                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                >
                                    <option value="Informática">Informática</option>
                                    <option value="Robótica">Robótica</option>
                                    <option value="Electrónica">Electrónica</option>
                                    <option value="Outra">Outra</option>
                                </select>
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
            )}

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
        </div>
    );
}

export default CoursesPage;
