
import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import pt from 'date-fns/locale/pt';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, Trash2, X, Globe, MapPin } from 'lucide-react';
import { disponibilidadeService } from '../services/disponibilidadeService';
import { useToast } from '../context/ToastContext';
import CalendarToolbar from '../components/ui/CalendarToolbar';

const locales = { 'pt': pt };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

function TrainerAvailabilityPage() {
    const { toast } = useToast();
    const [events, setEvents] = useState([]);
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState('week');

    useEffect(() => {
        loadAvailability();
    }, []);

    const loadAvailability = async () => {
        try {
            const data = await disponibilidadeService.getMyAvailability();
            const formatted = data.map(item => ({
                id: item.id,
                title: item.tipo === 'presencial' ? 'Presencial' : 'Online',
                start: new Date(item.inicio),
                end: new Date(item.fim),
                tipo: item.tipo
            }));
            setEvents(formatted);
        } catch (error) {
            console.error(error);
            toast('Erro ao carregar disponibilidade.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSlot = ({ start, end }) => {
        setSelectedSlot({ start, end });
        setModalOpen(true);
    };

    const handleConfirmAdd = async () => {
        try {
            await disponibilidadeService.addAvailability({
                inicio: selectedSlot.start,
                fim: selectedSlot.end,
                tipo
            });
            toast('Disponibilidade adicionada!', 'success');
            setModalOpen(false);
            loadAvailability();
        } catch (error) {
            toast('Erro ao adicionar disponibilidade.', 'error');
        }
    };

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
    };

    const handleDelete = async () => {
        try {
            await disponibilidadeService.removeAvailability(selectedEvent.id);
            toast('Disponibilidade removida.', 'success');
            setSelectedEvent(null);
            loadAvailability();
        } catch (error) {
            toast('Erro ao remover disponibilidade.', 'error');
        }
    };

    const eventStyleGetter = (event) => {
        const isOnline = event.tipo === 'online';
        return {
            style: {
                backgroundColor: isOnline ? 'rgba(56, 189, 248, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: isOnline ? '#0ea5e9' : '#10b981',
                borderLeft: `4px solid ${isOnline ? '#0ea5e9' : '#10b981'}`,
                borderRadius: '4px',
                fontSize: '0.85rem',
                fontWeight: '500'
            }
        };
    };

    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [tipo, setTipo] = useState('presencial');

    return (
        <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Minha Disponibilidade</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Selecione os horários em que está disponível arrastando no calendário.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '50%' }}></div> Presencial
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <div style={{ width: '12px', height: '12px', background: '#0ea5e9', borderRadius: '50%' }}></div> Online
                    </div>
                </div>
            </div>

            <div className="glass-card" style={{ flex: 1, padding: '1rem' }}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    culture='pt'
                    selectable
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    eventPropGetter={eventStyleGetter}
                    components={{ toolbar: CalendarToolbar }}
                    messages={{ next: "Seguinte", previous: "Anterior", today: "Hoje", month: "Mês", week: "Semana", day: "Dia" }}
                    date={date}
                    view={view}
                    onNavigate={date => setDate(date)}
                    onView={view => setView(view)}
                />
            </div>

            {/* Modal Adicionar */}
            <AnimatePresence>
                {modalOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="glass-card"
                            style={{ width: '400px', padding: '2rem' }}
                        >
                            <h3 style={{ marginBottom: '1.5rem' }}>Adicionar Disponibilidade</h3>

                            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                {selectedSlot && `${format(selectedSlot.start, 'dd/MM HH:mm')} - ${format(selectedSlot.end, 'HH:mm')}`}
                            </p>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Tipo:</label>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        onClick={() => setTipo('presencial')}
                                        className={`btn-${tipo === 'presencial' ? 'primary' : 'glass'}`}
                                        style={{ flex: 1 }}
                                    >
                                        <MapPin size={18} /> Presencial
                                    </button>
                                    <button
                                        onClick={() => setTipo('online')}
                                        className={`btn-${tipo === 'online' ? 'primary' : 'glass'}`}
                                        style={{ flex: 1 }}
                                    >
                                        <Globe size={18} /> Online
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={() => setModalOpen(false)} className="btn-glass" style={{ flex: 1 }}>Cancelar</button>
                                <button onClick={handleConfirmAdd} className="btn-primary" style={{ flex: 1 }}>Confirmar</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Remover */}
            <AnimatePresence>
                {selectedEvent && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="glass-card"
                            style={{ width: '400px', padding: '2rem' }}
                        >
                            <h3 style={{ marginBottom: '1rem', color: '#f87171' }}>Remover Disponibilidade</h3>
                            <p style={{ marginBottom: '1.5rem' }}>Tem a certeza que deseja remover este horário?</p>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={() => setSelectedEvent(null)} className="btn-glass" style={{ flex: 1 }}>Cancelar</button>
                                <button onClick={handleDelete} className="btn-primary" style={{ flex: 1, background: '#ef4444' }}>Remover</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default TrainerAvailabilityPage;
