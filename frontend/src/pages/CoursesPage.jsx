import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../services/courseService';
import DashboardLayout from '../components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import {
    BookOpen,
    Plus,
    Search,
    Layers,
    Activity,
    Edit2,
    Trash2,
    X,
    Save,
    Cpu,
    Monitor,
    Zap,
    MoreHorizontal
} from 'lucide-react';

function CoursesPage() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'ongoing', 'upcoming'
    const [showModal, setShowModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [formData, setFormData] = useState({
        nome_curso: '',
        area: 'Informática',
        estado: 'planeado'
    });

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            const data = await courseService.getAllCourses();
            setCourses(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCourse) {
                await courseService.updateCourse(editingCourse.id, formData);
            } else {
                await courseService.createCourse(formData);
            }
            setShowModal(false);
            setEditingCourse(null);
            setFormData({ nome_curso: '', area: 'Informática', estado: 'planeado' });
            loadCourses();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem a certeza que deseja eliminar este curso?')) return;
        try {
            await courseService.deleteCourse(id);
            loadCourses();
        } catch (error) {
            alert(error.message);
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
            case 'a decorrer': return '#3b82f6';
            case 'terminado': return '#10b981';
            default: return '#94a3b8';
        }
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch =
            course.nome_curso.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.area.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesFilter = true;
        if (filter === 'ongoing') {
            matchesFilter = course.estado === 'a decorrer';
        } else if (filter === 'upcoming') {
            if (!course.proxima_data_inicio) {
                matchesFilter = false;
            } else {
                const start = new Date(course.proxima_data_inicio);
                const now = new Date();
                const diffTime = start - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                matchesFilter = diffDays >= 0 && diffDays <= 60;
            }
        }

        return matchesSearch && matchesFilter;
    });

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>

                    {/* Filtros */}
                    <div className="glass-card" style={{ padding: '0.3rem', display: 'flex', gap: '0.5rem', borderRadius: '12px' }}>
                        <button
                            onClick={() => setFilter('all')}
                            style={{
                                background: filter === 'all' ? 'rgba(255,255,255,0.15)' : 'transparent',
                                border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem'
                            }}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFilter('ongoing')}
                            style={{
                                background: filter === 'ongoing' ? 'rgba(59, 130, 246, 0.4)' : 'transparent',
                                border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem'
                            }}
                        >
                            A Decorrer
                        </button>
                        <button
                            onClick={() => setFilter('upcoming')}
                            style={{
                                background: filter === 'upcoming' ? 'rgba(16, 185, 129, 0.4)' : 'transparent',
                                border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem'
                            }}
                        >
                            Iniciam em 60 dias
                        </button>
                    </div>

                    <div style={{ position: 'relative', width: '250px' }}>
                        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                        <input
                            type="text"
                            placeholder="Pesquisar curso..."
                            className="input-field"
                            style={{ paddingLeft: '3rem' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <button className="btn-primary" onClick={() => { setEditingCourse(null); setFormData({ nome_curso: '', area: 'Informática', estado: 'planeado' }); setShowModal(true); }}>
                    <Plus size={20} /> Novo Curso
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando cursos...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {filteredCourses.map((course) => (
                        <motion.div
                            key={course.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card"
                            style={{
                                borderLeft: `4px solid ${getStatusColor(course.estado)}`,
                                position: 'relative'
                            }}
                        >
                            <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                                {/* Admin Actions */}
                                {['ADMIN', 'SECRETARIA', 'FORMADOR'].includes(authService.getCurrentUser()?.tipo_utilizador?.toUpperCase()) && (
                                    <>
                                        <button onClick={() => openEdit(course)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(course.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
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
                                    {getAreaIcon(course.area)}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: '600' }}>{course.nome_curso}</h3>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{course.area}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: getStatusColor(course.estado) }}>
                                    <Activity size={14} />
                                    <span style={{ textTransform: 'capitalize' }}>{course.estado}</span>
                                </div>

                                {/* Candidate Action */}
                                {authService.getCurrentUser()?.tipo_utilizador?.toUpperCase() === 'CANDIDATO' && (
                                    <button
                                        onClick={() => navigate('/candidato', { state: { interestedIn: course.id } })}
                                        style={{
                                            background: 'var(--primary)', border: 'none', borderRadius: '20px',
                                            padding: '0.3rem 1rem', fontSize: '0.8rem', color: 'white', cursor: 'pointer'
                                        }}
                                    >
                                        Candidatar
                                    </button>
                                )}

                                {['ADMIN', 'SECRETARIA'].includes(authService.getCurrentUser()?.tipo_utilizador?.toUpperCase()) && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        ID: #{course.id}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                    {filteredCourses.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            Nenhum curso encontrado.
                        </div>
                    )}
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
                        style={{ maxWidth: '450px', width: '90%', padding: '2.5rem' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.5rem' }}>{editingCourse ? 'Editar Curso' : 'Novo Curso'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
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
                                    placeholder="Ex: Técnico de Informática"
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Área Técnica</label>
                                <select
                                    className="input-field"
                                    required
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
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estado Inicial</label>
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

                            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                                <Save size={20} /> {editingCourse ? 'Salvar Alterações' : 'Criar Curso'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </DashboardLayout>
    );
}

export default CoursesPage;
