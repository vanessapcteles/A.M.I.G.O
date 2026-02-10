
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

const AvailabilityEvent = ({ event }) => {
    const isOnline = event.tipo === 'online';
    const bgColor = isOnline ? '#0369a1' : '#047857';

    return (
        <div style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', color: '#fff' }}>
            <style>
                {`
                    .rbc-event-label { display: none !important; }
                    .rbc-event-content { padding: 4px !important; }
                `}
            </style>
            <span style={{
                fontSize: '0.7rem',
                fontWeight: 'bold',
                background: bgColor,
                padding: '2px 6px',
                borderRadius: '4px',
                width: 'fit-content',
                marginBottom: '4px',
                whiteSpace: 'nowrap'
            }}>
                {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', lineHeight: '1.2' }}>
                {event.title}
            </span>
        </div>
    );
};

const components = {
    toolbar: CalendarToolbar,
    event: AvailabilityEvent
};

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
            const formatted = data.map(item => {
                const s = new Date(item.inicio);
                const e = new Date(item.fim);

                // FIX VISUAL: Se o evento cruzar a meia-noite (ex: acabar às 00:00 do dia seguinte devido a Timezones ou DST),
                // o Calendário assume que é "All Day" ou multi-dia.
                // Forçamos o fim a ser 23:59:59 do mesmo dia se detetarmos mudança de dia.
                if (s.getDate() !== e.getDate()) {
                    e.setHours(23, 59, 59, 999);
                    // Se mesmo assim o dia for diferente (ex: s=30, e=31), forçamos a data de 's'
                    if (s.getDate() !== e.getDate()) {
                        e.setFullYear(s.getFullYear(), s.getMonth(), s.getDate());
                    }
                }

                return {
                    id: item.id,
                    title: item.tipo === 'presencial' ? 'Presencial' : 'Online',
                    start: s,
                    end: e,
                    tipo: item.tipo,
                    allDay: false // Forçar visualização na grelha de horas
                };
            });
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
        // Reset form states to safe defaults
        setIsRepeat(false);
        setRepeatUntil('');
        setExcludeWeekends(true);
        setTipo('presencial');
        setModalOpen(true);
    };

    const handleConfirmAdd = async () => {
        try {
            const originalStart = new Date(selectedSlot.start);
            const originalEnd = new Date(selectedSlot.end);

            let start = new Date(originalStart);
            let end = new Date(originalEnd);

            // Detetar se a seleção original cobria vários dias
            const durationHours = (originalEnd - originalStart) / (1000 * 60 * 60);
            const isMultiDaySelection = durationHours > 24;

            // Determinar configurações finais
            let finalIsRepeat = isRepeat;
            let finalRepeatUntil = repeatUntil;
            let finalExcludeWeekends = excludeWeekends;

            // Se for multi-dia e não estiver marcada repetição, assumir repetição implícita
            if (isMultiDaySelection && !isRepeat) {
                finalIsRepeat = true;
                finalRepeatUntil = format(originalEnd, 'yyyy-MM-dd');
            }

            // NORMALIZAÇÃO DE DURAÇÃO (Crucial para evitar barras no topo)
            // Forçamos o 'fim' a ser no mesmo dia do 'início' (ou dia seguinte se overnight)
            const normalizedEnd = new Date(start);
            normalizedEnd.setHours(end.getHours(), end.getMinutes(), 0, 0);

            // Se a hora de fim for menor que a de início (ex: 23h - 02h), avança 1 dia
            if (normalizedEnd < start) {
                normalizedEnd.setDate(normalizedEnd.getDate() + 1);
            }
            end = normalizedEnd;

            // Start Generation Loop (Frontend-side to handle DST/Timezones correctly)
            const generatedSlots = [];
            const limitDate = finalIsRepeat && finalRepeatUntil ? new Date(finalRepeatUntil) : new Date(start);
            limitDate.setHours(23, 59, 59, 999);

            let currentStart = new Date(start);
            // We must preserve duration to calculate end for each recurrence accurately
            const durationMs = end.getTime() - start.getTime();

            while (currentStart <= limitDate) {
                const dayOfWeek = currentStart.getDay();

                if (finalIsRepeat && finalExcludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
                    // Skip weekend
                    currentStart.setDate(currentStart.getDate() + 1);
                    continue;
                }

                // Calculate End for this specific day based on duration
                const thisStart = new Date(currentStart);
                const thisEnd = new Date(thisStart.getTime() + durationMs);

                // Add to list
                generatedSlots.push({
                    inicio: thisStart,
                    fim: thisEnd,
                    tipo
                });

                // Next day
                // Browser's setDate handles DST correctly (keeping local time 16:00 -> 16:00)
                currentStart.setDate(currentStart.getDate() + 1);
            }

            // Send BATCH to backend
            await disponibilidadeService.addAvailability(generatedSlots);
            toast('Disponibilidade adicionada!', 'success');
            setModalOpen(false);
            loadAvailability();
        } catch (error) {
            console.error(error);
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
                backgroundColor: isOnline ? '#0ea5e9' : '#10b981', // Solid colors
                color: '#fff',
                borderLeft: `5px solid ${isOnline ? '#0369a1' : '#047857'}`,
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: '500',
                border: 'none',
                opacity: 0.9
            }
        };
    };

    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [tipo, setTipo] = useState('presencial');

    // Estados para Repetição
    const [isRepeat, setIsRepeat] = useState(false);
    const [repeatUntil, setRepeatUntil] = useState('');
    const [excludeWeekends, setExcludeWeekends] = useState(true);

    const [confirmClearOpen, setConfirmClearOpen] = useState(false);

    const handleClearAll = async () => {
        try {
            await disponibilidadeService.clearAllAvailability();
            toast('Toda a disponibilidade futura foi removida.', 'success');
            setConfirmClearOpen(false);
            loadAvailability();
        } catch (error) {
            toast('Erro ao limpar disponibilidade.', 'error');
        }
    };

    return (
        <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', flexShrink: 0 }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Minha Disponibilidade</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Selecione os horários em que está disponível arrastando no calendário.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button
                        onClick={() => setConfirmClearOpen(true)}
                        className="btn-glass"
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Trash2 size={16} /> Limpar Tudo
                    </button>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '50%' }}></div> Presencial
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <div style={{ width: '12px', height: '12px', background: '#0ea5e9', borderRadius: '50%' }}></div> Online
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card" style={{ flex: 1, padding: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
                    components={components}
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


                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Definição Rápida:</label>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        onClick={() => {
                                            if (!selectedSlot) return;

                                            // Detetar seleção multi-dia
                                            const s = new Date(selectedSlot.start);
                                            const e = new Date(selectedSlot.end);
                                            const hours = (e - s) / 36e5;

                                            if (hours > 24) {
                                                setIsRepeat(true);
                                                setRepeatUntil(format(e, 'yyyy-MM-dd'));
                                            }

                                            // Aplicar ao dia de inicio
                                            const newStart = new Date(s);
                                            newStart.setHours(7, 30, 0, 0);

                                            const newEnd = new Date(s);
                                            newEnd.setHours(15, 30, 0, 0);

                                            setSelectedSlot({ start: newStart, end: newEnd });
                                        }}
                                        className="btn-glass"
                                        style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem' }}
                                    >
                                        ☀️ Diurno (07:30 - 15:30)
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!selectedSlot) return;

                                            // Detetar seleção multi-dia
                                            const s = new Date(selectedSlot.start);
                                            const e = new Date(selectedSlot.end);
                                            const hours = (e - s) / 36e5;

                                            if (hours > 24) {
                                                setIsRepeat(true);
                                                setRepeatUntil(format(e, 'yyyy-MM-dd'));
                                            }

                                            const newStart = new Date(s);
                                            newStart.setHours(16, 0, 0, 0);

                                            const newEnd = new Date(s);
                                            newEnd.setHours(23, 0, 0, 0);

                                            setSelectedSlot({ start: newStart, end: newEnd });
                                        }}
                                        className="btn-glass"
                                        style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem' }}
                                    >
                                        🌙 Noturno (16:00 - 23:00)
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={isRepeat}
                                        onChange={(e) => setIsRepeat(e.target.checked)}
                                        style={{ accentColor: 'var(--primary)' }}
                                    />
                                    <span style={{ fontSize: '0.9rem' }}>Repetir disponibilidade</span>
                                </label>

                                {isRepeat && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                                                    Repetir até:
                                                </label>
                                                <input
                                                    type="date"
                                                    className="input-field"
                                                    style={{ width: '100%', padding: '0.4rem', fontSize: '0.9rem' }}
                                                    value={repeatUntil}
                                                    onChange={(e) => setRepeatUntil(e.target.value)}
                                                    min={selectedSlot ? format(selectedSlot.start, 'yyyy-MM-dd') : ''}
                                                />
                                            </div>

                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={excludeWeekends}
                                                    onChange={(e) => setExcludeWeekends(e.target.checked)}
                                                    style={{ accentColor: 'var(--primary)' }}
                                                />
                                                <span style={{ fontSize: '0.85rem' }}>Excluir fins de semana</span>
                                            </label>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={() => setModalOpen(false)} className="btn-glass" style={{ flex: 1 }}>Cancelar</button>
                                <button onClick={handleConfirmAdd} className="btn-primary" style={{ flex: 1 }}>Confirmar</button>
                            </div>
                        </motion.div>
                    </div>
                )
                }
            </AnimatePresence>

            {/* Modal Limpar Tudo */}
            <AnimatePresence>
                {confirmClearOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="glass-card"
                            style={{ width: '400px', padding: '2rem', border: '1px solid #ef4444' }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                                    <Trash2 size={32} color="#ef4444" />
                                </div>
                                <h3 style={{ marginBottom: '0.5rem', color: '#f87171' }}>Limpar Toda a Disponibilidade</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    Atenção: Esta ação irá apagar <strong>todas</strong> as suas disponibilidades futuras.
                                    <br />Esta ação não pode ser desfeita.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={() => setConfirmClearOpen(false)} className="btn-glass" style={{ flex: 1 }}>Cancelar</button>
                                <button onClick={handleClearAll} className="btn-primary" style={{ flex: 1, background: '#ef4444' }}>
                                    Sim, Limpar Tudo
                                </button>
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
        </div >
    );
}

export default TrainerAvailabilityPage;
