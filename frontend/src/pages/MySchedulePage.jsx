import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import pt from 'date-fns/locale/pt';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

import { horarioService } from '../services/horarioService';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';
import CalendarToolbar from '../components/ui/CalendarToolbar';

const locales = { 'pt': pt };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

function MySchedulePage() {
    const { toast } = useToast();
    const user = authService.getCurrentUser();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState('week');
    const [filterStart, setFilterStart] = useState('');
    const [filterEnd, setFilterEnd] = useState('');

    useEffect(() => {
        if (user) fetchSchedule();
    }, [user?.id, filterStart, filterEnd]);

    const fetchSchedule = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Reusing the getFormadorSchedule service since "My Schedule" is just the formador's schedule
            const data = await horarioService.getFormadorSchedule(user.id, filterStart, filterEnd);
            const formatted = data.map(ev => ({
                id: ev.id,
                title: `${ev.nome_modulo} (${ev.codigo_turma}) - ${ev.nome_sala}`,
                // Fix for MySQL datetime strings (same as FormadoresPage)
                start: new Date(ev.inicio.replace(' ', 'T')),
                end: new Date(ev.fim.replace(' ', 'T')),
                resource: ev
            }));
            setEvents(formatted);
        } catch (error) {
            console.error('Erro ao carregar horário:', error);
            toast('Erro ao carregar o teu horário', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.8rem', borderRadius: '12px', background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                        <Clock size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>O Meu Horário</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>Consulta as tuas próximas aulas</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Desde</label>
                        <input
                            type="date"
                            className="input-field"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                            value={filterStart}
                            onChange={(e) => {
                                setFilterStart(e.target.value);
                                if (e.target.value) setCurrentDate(new Date(e.target.value));
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Até</label>
                        <input
                            type="date"
                            className="input-field"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                            value={filterEnd}
                            onChange={(e) => setFilterEnd(e.target.value)}
                        />
                    </div>
                    {(filterStart || filterEnd) && (
                        <button
                            onClick={() => {
                                setFilterStart('');
                                setFilterEnd('');
                                setCurrentDate(new Date());
                            }}
                            className="btn-glass"
                            style={{
                                padding: '0.3rem 0.6rem',
                                fontSize: '0.8rem',
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

            <div className="glass-card" style={{ padding: '1.5rem', height: 'calc(100vh - 200px)', minHeight: '600px' }}>
                <div style={{ height: '100%', overflowX: 'auto' }}>
                    <div style={{ minWidth: '700px', height: '100%' }}>
                        <Calendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            culture='pt'
                            date={currentDate}
                            view={currentView}
                            onNavigate={date => setCurrentDate(date)}
                            onView={view => setCurrentView(view)}
                            components={{
                                toolbar: CalendarToolbar
                            }}
                            messages={{
                                next: "Seg.", previous: "Ant.", today: "Hoje",
                                month: "Mês", week: "Sem.", day: "Dia"
                            }}
                            eventPropGetter={() => ({
                                style: {
                                    backgroundColor: 'var(--primary)',
                                    borderRadius: '6px',
                                    opacity: 0.9,
                                    color: 'white',
                                    border: 'none',
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: '500'
                                }
                            })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MySchedulePage;
