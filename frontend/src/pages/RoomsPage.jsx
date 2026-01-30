import { useState, useEffect } from 'react';
import { roomService } from '../services/roomService';
import { authService } from '../services/authService';
import CalendarToolbar from '../components/ui/CalendarToolbar';

import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import pt from 'date-fns/locale/pt';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
    DoorOpen,
    Plus,
    Search,
    Users,
    MapPin,
    Edit2,
    Trash2,
    X,
    Save,
    Calendar as CalendarIcon
} from 'lucide-react';
import { horarioService } from '../services/horarioService';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';

const locales = { 'pt': pt };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

function RoomsPage() {
    const { toast } = useToast();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [viewingSchedule, setViewingSchedule] = useState(null);
    const [roomEvents, setRoomEvents] = useState([]);
    const [modalConfig, setModalConfig] = useState({ isOpen: false });
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState('week');

    const [formData, setFormData] = useState({
        nome: '',
        capacidade: '',
        localizacao: 'Edifício Principal'
    });

    const user = authService.getCurrentUser();
    const role = user?.tipo_utilizador?.toUpperCase();
    const isAdmin = role === 'ADMIN' || role === 'SECRETARIA';

    useEffect(() => {
        loadRooms();
    }, []);

    const loadRooms = async () => {
        try {
            const data = await roomService.getAllRooms();
            setRooms(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewSchedule = async (room) => {
        try {
            const data = await horarioService.getRoomSchedule(room.id);
            const formatted = data.map(ev => ({
                id: ev.id,
                title: `${ev.nome_modulo} (${ev.codigo_turma})`,
                start: new Date(ev.inicio),
                end: new Date(ev.fim)
            }));
            setRoomEvents(formatted);
            setViewingSchedule(room);
        } catch (error) {
            toast('Erro ao carregar horário da sala', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRoom) {
                await roomService.updateRoom(editingRoom.id, formData);
            } else {
                await roomService.createRoom(formData);
            }
            setShowModal(false);
            setEditingRoom(null);
            setFormData({ nome: '', capacidade: '', localizacao: 'Edifício Principal' });
            loadRooms();
        } catch (error) {
            toast(error.message, 'error');
        }
    };

    const handleDelete = (id) => {
        setModalConfig({
            isOpen: true,
            title: 'Eliminar Sala',
            type: 'danger',
            children: 'Tem a certeza que deseja eliminar esta sala? Esta ação pode afetar horários existentes.',
            confirmText: 'Eliminar',
            onConfirm: () => performDelete(id)
        });
    };

    const performDelete = async (id) => {
        try {
            await roomService.deleteRoom(id);
            loadRooms();
            setModalConfig({ isOpen: false });
            toast('Sala eliminada com sucesso!');
        } catch (error) {
            toast(error.message, 'error');
        }
    };

    const openEdit = (room) => {
        setEditingRoom(room);
        setFormData({
            nome: room.nome_sala, // Corrigido para nome_sala
            capacidade: room.capacidade,
            localizacao: room.localizacao
        });
        setShowModal(true);
    };

    const filteredRooms = rooms.filter(room =>
        room.nome_sala?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.localizacao?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar sala..."
                        className="input-field"
                        style={{ paddingLeft: '3rem' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {isAdmin && (
                    <button className="btn-primary" onClick={() => { setEditingRoom(null); setFormData({ nome: '', capacidade: '', localizacao: 'Edifício Principal' }); setShowModal(true); }}>
                        <Plus size={20} /> Adicionar Sala
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando salas...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {filteredRooms.map((room) => (
                        <motion.div
                            key={room.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card"
                            style={{ position: 'relative', overflow: 'hidden' }}
                        >
                            <div style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                display: 'flex',
                                gap: '0.5rem'
                            }}>
                                {isAdmin && (
                                    <>
                                        <button onClick={() => openEdit(room)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(room.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{
                                    padding: '0.75rem',
                                    background: 'var(--primary-glow)',
                                    borderRadius: '12px',
                                    color: 'var(--primary)'
                                }}>
                                    <DoorOpen size={24} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{room.nome_sala}</h3>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    <Users size={16} /> <span>Capacidade: <strong>{room.capacidade}</strong></span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    <MapPin size={16} /> <span>{room.localizacao}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleViewSchedule(room)}
                                className="btn-glass"
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            >
                                <CalendarIcon size={16} /> Ver Alocação
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal de Ocupação da Sala */}
            <AnimatePresence>
                {viewingSchedule && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(10px)'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="glass-card"
                            style={{ maxWidth: '900px', width: '95%', height: '80vh', padding: '2rem' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <div>
                                    <h2>Estado de Alocação: {viewingSchedule.nome_sala}</h2>
                                    <p style={{ color: 'var(--text-secondary)' }}>{viewingSchedule.localizacao}</p>
                                </div>
                                <button onClick={() => setViewingSchedule(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div style={{ height: 'calc(100% - 100px)' }}>
                                <Calendar
                                    localizer={localizer}
                                    events={roomEvents}
                                    startAccessor="start"
                                    endAccessor="end"
                                    culture='pt'
                                    components={{
                                        toolbar: CalendarToolbar
                                    }}
                                    date={currentDate}
                                    view={currentView}
                                    onNavigate={date => setCurrentDate(date)}
                                    onView={view => setCurrentView(view)}
                                    messages={{
                                        next: "Seguinte", previous: "Anterior", today: "Hoje",
                                        month: "Mês", week: "Semana", day: "Dia"
                                    }}
                                    defaultView='week'
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal de Criação/Edição */}
            {
                showModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', zIndex: 1000
                    }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card"
                            style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <h2>{editingRoom ? 'Editar Sala' : 'Nova Sala'}</h2>
                                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Nome da Sala</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        required
                                        value={formData.nome}
                                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                        placeholder="Ex: Sala 101"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Capacidade</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        required
                                        value={formData.capacidade}
                                        onChange={(e) => setFormData({ ...formData, capacidade: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Localização</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.localizacao}
                                        onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                                    />
                                </div>

                                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                                    <Save size={20} /> {editingRoom ? 'Guardar Alterações' : 'Criar Sala'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )
            }

            <Modal
                {...modalConfig}
                onClose={() => setModalConfig({ isOpen: false })}
            />
        </>
    );
}

export default RoomsPage;
