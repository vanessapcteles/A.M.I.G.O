import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import pt from 'date-fns/locale/pt';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { horarioService } from '../services/horarioService';
import { Calendar as CalendarIcon, Info } from 'lucide-react';
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

    useEffect(() => {
        loadAllSchedules();
    }, [startDate, endDate]);

    const loadAllSchedules = async () => {
        setLoading(true);
        try {
            let data;
            if (startDate && endDate) {
                data = await horarioService.getAllSchedules(startDate, endDate);
            } else {
                data = await horarioService.getAllSchedules();
            }

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

    const eventStyleGetter = (event) => ({
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
    });

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

                    {(startDate || endDate) && (
                        <button
                            onClick={() => {
                                setStartDate('');
                                setEndDate('');
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
                    .rbc-month-view, .rbc-time-view, .rbc-agenda-view { 
                        border: 1px solid var(--border-glass) !important; 
                        border-radius: 12px;
                        overflow: hidden;
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
                        style={{ height: '700px' }}
                        eventPropGetter={eventStyleGetter}
                        date={currentDate}
                        view={currentView}
                        onNavigate={date => {
                            // Se houver filtros, impedir navegação para fora do intervalo (simples)
                            if (startDate && endDate) {
                                const start = new Date(startDate);
                                const end = new Date(endDate);
                                // Permitir pequena margem ou verificar se a data está "muito" fora?
                                // Simples: Se a nova data for menor que start, volta ao start. Se maior que end, mantem end.
                                // Mas o Calendar retorna a data de início da view.
                                if (date < start) setCurrentDate(start);
                                else if (date > end) setCurrentDate(end);
                                else setCurrentDate(date);
                            } else {
                                setCurrentDate(date);
                            }
                        }}
                        onView={view => setCurrentView(view)}
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
                        Para agendar ou editar aulas, aceda à página específica da <strong>Turma</strong> desejada.
                    </p>
                </div>
            </div>
        </>
    );
}

export default SchedulesPage;
