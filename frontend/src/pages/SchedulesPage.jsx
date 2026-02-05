import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import differenceInDays from 'date-fns/differenceInDays';
import pt from 'date-fns/locale/pt';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { horarioService } from '../services/horarioService';
import { formadorService } from '../services/formadorService';
import { turmaService } from '../services/turmaService';
import { Calendar as CalendarIcon, Info, Users, GraduationCap } from 'lucide-react';
import CalendarToolbar from '../components/ui/CalendarToolbar';

const locales = {
    'pt': pt,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

function SchedulesPage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState('week');

    // Filter States
    const [filterFormador, setFilterFormador] = useState('');
    const [filterTurma, setFilterTurma] = useState('');

    // Data Lists
    const [formadores, setFormadores] = useState([]);
    const [turmas, setTurmas] = useState([]);

    useEffect(() => {
        loadFiltersData();
    }, []);

    useEffect(() => {
        loadAllSchedules();
    }, [startDate, endDate, filterFormador, filterTurma]);

    const loadFiltersData = async () => {
        try {
            // Use allSettled to prevent one failure from blocking everything
            const results = await Promise.allSettled([
                formadorService.getAll(),
                turmaService.getAllTurmas({ limit: 100 }) // Fetch more to fill dropdown
            ]);

            if (results[0].status === 'fulfilled') setFormadores(results[0].value || []);
            else console.error('Falha ao carregar formadores', results[0].reason);

            if (results[1].status === 'fulfilled') setTurmas(results[1].value || []);
            else console.error('Falha ao carregar turmas', results[1].reason);

        } catch (error) {
            console.error('Erro crítico ao carregar filtros:', error);
        }
    };

    const loadAllSchedules = async () => {
        setLoading(true);
        try {
            let data;
            // Pass filters as object
            data = await horarioService.getAllSchedules({
                start: startDate,
                end: endDate,
                formadorId: filterFormador,
                turmaId: filterTurma
            });

            const formattedEvents = data.map(lesson => ({
                id: lesson.id,
                title: `${lesson.nome_modulo} (${lesson.codigo_turma}) - ${lesson.nome_sala}`,
                start: new Date(lesson.inicio),
                end: new Date(lesson.fim),
                resource: lesson
            }));

            setEvents(formattedEvents);
        } catch (error) {
            console.error('Erro ao carregar horários:', error);
        } finally {
            setLoading(false);
        }
    };

    const eventStyleGetter = (event) => {
        // Different style for Agenda view to avoid "cut" look
        if (currentView === 'agenda') {
            return {
                style: {
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    borderBottom: '1px solid var(--border-glass)',
                    borderRadius: '0',
                    boxShadow: 'none',
                    padding: '5px 0'
                }
            };
        }

        return {
            style: {
                backgroundColor: 'var(--primary)',
                borderRadius: '10px',
                opacity: 0.9,
                color: 'var(--text-primary)',
                border: 'none',
                display: 'block',
                padding: '5px 10px',
                fontSize: '0.8rem',
                fontWeight: '500',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }
        };
    };

    // Calculate length for Agenda view based on filters
    const getAgendaLength = () => {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diff = differenceInDays(end, start) + 1;
            return diff > 0 ? diff : 30;
        }
        return 30; // Default
    };

    const [selectedEvent, setSelectedEvent] = useState(null);

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
    };

    return (
        <>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                    <CalendarIcon size={24} />
                </div>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Horário Geral</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Visualize todas as aulas agendadas na academia</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Desde</label>
                        <input
                            type="date"
                            className="input-field"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                if (e.target.value) setCurrentDate(new Date(e.target.value));
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Até</label>
                        <input
                            type="date"
                            className="input-field"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                // Opcional: ajustar currentDate se necessário
                            }}
                        />
                    </div>

                    {/* Filter Dropdowns */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Formador</label>
                        <div style={{ position: 'relative' }}>
                            <Users size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <select
                                className="input-field"
                                style={{ padding: '0.4rem 0.75rem 0.4rem 2rem', fontSize: '0.85rem', minWidth: '150px' }}
                                value={filterFormador}
                                onChange={(e) => setFilterFormador(e.target.value)}
                            >
                                <option value="">Todos</option>
                                {formadores.map(f => (
                                    <option key={f.id} value={f.id_formador_perfil}>{f.nome_completo}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Turma</label>
                        <div style={{ position: 'relative' }}>
                            <GraduationCap size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <select
                                className="input-field"
                                style={{ padding: '0.4rem 0.75rem 0.4rem 2rem', fontSize: '0.85rem', minWidth: '150px' }}
                                value={filterTurma}
                                onChange={(e) => setFilterTurma(e.target.value)}
                            >
                                <option value="">Todas</option>
                                {turmas.map(t => (
                                    <option key={t.id} value={t.id}>{t.codigo_turma}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {(startDate || endDate || filterFormador || filterTurma) && (
                        <button
                            onClick={() => {
                                setStartDate('');
                                setEndDate('');
                                setFilterFormador('');
                                setFilterTurma('');
                                setCurrentDate(new Date()); // Voltar a hoje
                            }}
                            className="btn-glass"
                            style={{
                                padding: '0.4rem 0.8rem',
                                fontSize: '0.85rem',
                                height: 'fit-content',
                                alignSelf: 'flex-end',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.2)'
                            }}
                        >
                            Limpar
                        </button>
                    )}
                </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', minHeight: '750px' }}>
                <style>{`
                    .rbc-calendar { font-family: inherit; }
                    .rbc-off-range-bg { background: var(--card-hover-bg); }
                    .rbc-header { 
                        color: var(--text-secondary); 
                        border-bottom: 1px solid var(--border-glass) !important; 
                        padding: 15px 0 !important;
                        font-weight: 600;
                        text-transform: uppercase;
                        font-size: 0.75rem;
                        letter-spacing: 0.05em;
                    }
                    .rbc-today { background: var(--primary-glow) !important; }
                    .rbc-time-content { border-top: 2px solid var(--border-glass) !important; }
                    .rbc-time-gutter { color: var(--text-muted); font-size: 0.75rem; font-weight: 500; }
                    .rbc-timeslot-group { border-bottom: 1px solid var(--border-glass) !important; min-height: 50px !important; }
                    .rbc-day-slot .rbc-time-slot { border-top: 1px solid var(--border-glass) !important; }
                    .rbc-month-view, .rbc-time-view { 
                        border: 1px solid var(--border-glass) !important; 
                        border-radius: 12px;
                        overflow: hidden;
                        background: var(--card-hover-bg);
                    }
                    .rbc-agenda-view {
                        border: 1px solid var(--border-glass) !important; 
                        border-radius: 12px;
                        overflow-y: auto !important; /* Enable scroll */
                        background: var(--card-hover-bg);
                    }
                    .rbc-day-bg + .rbc-day-bg { border-left: 1px solid var(--border-glass) !important; }
                    .rbc-time-header-content { border-left: 1px solid var(--border-glass) !important; }
                    .rbc-time-content > * + * > * { border-left: 1px solid var(--border-glass) !important; }
                    .rbc-agenda-view table.rbc-agenda-table { border: none !important; color: var(--text-primary); }
                    .rbc-agenda-view table.rbc-agenda-table thead > tr > th { border-bottom: 2px solid var(--border-glass) !important; color: var(--text-secondary); }
                    .rbc-agenda-event-cell { color: var(--text-primary) !important; }
                `}</style>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '600px' }}>
                        <p>A carregar horários...</p>
                    </div>
                ) : (
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        length={getAgendaLength()}
                        style={{ height: '700px' }}
                        eventPropGetter={eventStyleGetter}
                        date={currentDate}
                        view={currentView}
                        onNavigate={date => {
                            if (startDate && endDate) {
                                const start = new Date(startDate);
                                const end = new Date(endDate);
                                if (date < start) setCurrentDate(start);
                                else if (date > end) setCurrentDate(end);
                                else setCurrentDate(date);
                            } else {
                                setCurrentDate(date);
                            }
                        }}
                        onView={view => setCurrentView(view)}
                        onSelectEvent={handleSelectEvent}
                        culture='pt'
                        components={{
                            toolbar: (props) => <CalendarToolbar {...props} locked={startDate && endDate} />
                        }}
                    />
                )}
            </div>

            <div style={{ marginTop: '1.5rem' }}>
                <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Info size={20} style={{ color: 'var(--primary)' }} />
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Para agendar ou editar aulas, aceda à página específica da <strong>Turma</strong> desejada. Clique numa aula para ver detalhes.
                    </p>
                </div>
            </div>

            {selectedEvent && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }} onClick={() => setSelectedEvent(null)}>
                    <div
                        className="glass-card"
                        style={{ width: '90%', maxWidth: '500px', padding: '2rem', position: 'relative' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Detalhes da Aula</h2>
                        <div style={{ width: '100%', height: '1px', background: 'var(--border-glass)', marginBottom: '1.5rem' }}></div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Módulo</label>
                                <div style={{ fontWeight: '500', fontSize: '1.1rem' }}>{selectedEvent.resource.nome_modulo}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Turma</label>
                                <div style={{ fontWeight: '500' }}>{selectedEvent.resource.codigo_turma}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Início</label>
                                <div style={{ fontWeight: '500' }}>{format(selectedEvent.start, "dd/MM/yyyy HH:mm")}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Fim</label>
                                <div style={{ fontWeight: '500' }}>{format(selectedEvent.end, "HH:mm")}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Sala</label>
                                <div style={{ fontWeight: '500', color: 'var(--primary)' }}>{selectedEvent.resource.nome_sala}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Formador</label>
                                <div style={{ fontWeight: '500' }}>{selectedEvent.resource.nome_formador}</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                className="btn-primary"
                                onClick={() => setSelectedEvent(null)}
                                style={{ padding: '0.8rem 2rem' }}
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default SchedulesPage;
