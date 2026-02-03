import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import pt from 'date-fns/locale/pt';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { horarioService } from '../services/horarioService';
import { turmaService } from '../services/turmaService'; // Para obter lista de módulos disponíveis
import { ArrowLeft, Plus, Trash2, X, Calendar as CalendarIcon, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import CalendarToolbar from '../components/ui/CalendarToolbar';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/common/ConfirmDialog';

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

function TurmaSchedulePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [events, setEvents] = useState([]);
    const [turmaModules, setTurmaModules] = useState([]);
    const [showModal, setShowModal] = useState(false);

    // Module List Pagination & Search
    const [moduleSearch, setModuleSearch] = useState('');
    const [modulePage, setModulePage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    // Confirmation State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState(null);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState('week');

    const [formData, setFormData] = useState({
        id_turma_detalhe: '',
        data: '',
        hora_inicio: '',
        hora_fim: ''
    });

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const [schedule, modules] = await Promise.all([
                horarioService.getTurmaSchedule(id),
                turmaService.getTurmaModules(id)
            ]);

            // Converter para formato do Big Calendar
            const formattedEvents = schedule.map(lesson => ({
                id: lesson.id,
                title: `${lesson.nome_modulo} (${lesson.nome_sala})`,
                start: new Date(lesson.inicio),
                end: new Date(lesson.fim),
                resource: lesson // Guardar dados extra aqui
            }));

            setEvents(formattedEvents);
            setTurmaModules(modules);
        } catch (error) {
            console.error(error);
            toast(error.message, 'error');
        }
    };

    const handleSelectSlot = ({ start, end }) => {
        // Pre-fill form on calendar click (Month click gives 00:00, Day/Week gives specific time)
        const dateStr = format(start, 'yyyy-MM-dd');
        const startStr = format(start, 'HH:mm');
        // Default duration 1h if not dragged
        let endStr = format(end, 'HH:mm');
        if (startStr === endStr) {
            const endDate = new Date(start.getTime() + 60 * 60 * 1000); // +1h
            endStr = format(endDate, 'HH:mm');
        }

        setFormData({
            ...formData,
            data: dateStr,
            hora_inicio: startStr,
            hora_fim: endStr
        });
        setShowModal(true);
    };

    const handleSelectEvent = (event) => {
        setEventToDelete(event);
        setConfirmOpen(true);
    };

    const confirmDeleteEvent = async () => {
        if (!eventToDelete) return;
        try {
            await horarioService.deleteLesson(eventToDelete.id);
            toast('Aula removida com sucesso!', 'success');
            loadData();
        } catch (error) {
            toast(error.message, 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Construir ISO strings
            const startDateTime = new Date(`${formData.data}T${formData.hora_inicio}`);
            const endDateTime = new Date(`${formData.data}T${formData.hora_fim}`);

            await horarioService.createLesson({
                id_turma_detalhe: formData.id_turma_detalhe,
                inicio: startDateTime.toISOString(),
                fim: endDateTime.toISOString()
            });

            toast('Aula agendada com sucesso!', 'success');
            setShowModal(false);
            loadData();
        } catch (error) {
            toast(error.message, 'error');
        }
    };

    const eventStyleGetter = (event) => ({
        style: {
            backgroundColor: 'var(--primary)',
            borderRadius: '8px',
            opacity: 0.9,
            color: 'white',
            border: 'none',
            display: 'block',
            padding: '4px 8px',
            fontSize: '0.8rem',
            fontWeight: '500'
        }
    });

    // Filter and Pagination Logic
    // Filter and Pagination Logic
    const filteredModules = turmaModules.filter(m => {
        if (!moduleSearch) return true;
        const searchTerms = moduleSearch.toLowerCase().split(' ').filter(t => t);
        const targetText = `${m.nome_modulo} ${m.nome_formador} ${m.nome_sala}`.toLowerCase();
        const targetWords = targetText.split(/\s+/);

        return searchTerms.every(term =>
            targetWords.some(word => word.startsWith(term))
        );
    });
    const totalPages = Math.ceil(filteredModules.length / ITEMS_PER_PAGE);
    const currentModules = filteredModules.slice(
        (modulePage - 1) * ITEMS_PER_PAGE,
        modulePage * ITEMS_PER_PAGE
    );

    return (
        <>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <button
                        onClick={() => navigate('/turmas')}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.5rem' }}
                    >
                        <ArrowLeft size={16} /> Voltar às Turmas
                    </button>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Horário da Turma</h1>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={20} /> Nova Aula
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                {/* Painel Lateral de Módulos */}
                <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CalendarIcon size={18} color="var(--primary)" /> Monitorização
                    </h3>

                    {/* Search Bar */}
                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Pesquisa por Módulo/Formador"
                            className="input-field"
                            style={{ paddingLeft: '35px', fontSize: '0.85rem' }}
                            value={moduleSearch}
                            onChange={(e) => { setModuleSearch(e.target.value); setModulePage(1); }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1 }}>
                        {currentModules.map(m => {
                            const percent = Math.min((m.horas_agendadas / m.horas_planeadas) * 100, 100);
                            const isFull = m.horas_agendadas >= m.horas_planeadas;

                            // Format number
                            const formatH = (n) => Number(n).toFixed(n % 1 === 0 ? 0 : 1);

                            return (
                                <div key={m.id} style={{
                                    padding: '0.85rem',
                                    borderRadius: '10px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid var(--border-glass)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem', gap: '1rem' }}>
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                            {m.nome_modulo}
                                        </div>
                                        <div style={{
                                            fontWeight: '700',
                                            fontSize: '0.9rem',
                                            color: isFull ? '#10b981' : 'var(--text-primary)',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {formatH(m.horas_agendadas)} / {formatH(m.horas_planeadas)}h
                                        </div>
                                    </div>

                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {m.nome_formador} • <span style={{ color: 'var(--primary)' }}>{m.nome_sala}</span>
                                    </div>
                                </div>
                            );
                        })}
                        {currentModules.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>Nenhum módulo encontrado.</p>}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem' }}>
                            <button
                                onClick={() => setModulePage(p => Math.max(1, p - 1))}
                                disabled={modulePage === 1}
                                style={{ background: 'none', border: 'none', color: modulePage === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: modulePage === 1 ? 'default' : 'pointer' }}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {modulePage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setModulePage(p => Math.min(totalPages, p + 1))}
                                disabled={modulePage === totalPages}
                                style={{ background: 'none', border: 'none', color: modulePage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)', cursor: modulePage === totalPages ? 'default' : 'pointer' }}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Calendário */}
                <div className="glass-card" style={{ padding: '1.5rem', minHeight: '750px' }}>
                    <style>{`
                        .rbc-calendar { font-family: inherit; }
                        .rbc-off-range-bg { background: rgba(0,0,0,0.1); }
                        .rbc-header { 
                            color: var(--text-secondary); 
                            border-bottom: 1px solid var(--border-glass) !important; 
                            padding: 15px 0 !important;
                            font-weight: 600;
                            text-transform: uppercase;
                            font-size: 0.75rem;
                            letter-spacing: 0.05em;
                        }
                        .rbc-today { background: rgba(56, 189, 248, 0.1) !important; }
                        .rbc-time-content { border-top: 2px solid var(--border-glass) !important; }
                        .rbc-time-gutter { color: var(--text-muted); font-size: 0.75rem; font-weight: 500; }
                        .rbc-timeslot-group { border-bottom: 1px solid var(--border-glass) !important; min-height: 50px !important; }
                        .rbc-day-slot .rbc-time-slot { border-top: 1px solid rgba(255,255,255,0.03) !important; }
                        .rbc-month-view, .rbc-time-view, .rbc-agenda-view { 
                            border: 1px solid var(--border-glass) !important; 
                            border-radius: 12px;
                            overflow: hidden;
                            background: rgba(0,0,0,0.2);
                        }
                        .rbc-day-bg + .rbc-day-bg { border-left: 1px solid var(--border-glass) !important; }
                        .rbc-time-header-content { border-left: 1px solid var(--border-glass) !important; }
                        .rbc-time-content > * + * > * { border-left: 1px solid var(--border-glass) !important; }
                        .rbc-agenda-view table.rbc-agenda-table { border: none !important; color: white; }
                        .rbc-agenda-view table.rbc-agenda-table thead > tr > th { border-bottom: 2px solid var(--border-glass) !important; color: var(--text-secondary); }
                        .rbc-agenda-event-cell { color: white !important; }
                    `}</style>
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '700px' }}
                        eventPropGetter={eventStyleGetter}
                        date={currentDate}
                        view={currentView}
                        onNavigate={date => setCurrentDate(date)}
                        onView={view => setCurrentView(view)}
                        culture='pt'
                        selectable
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={handleSelectEvent}
                        components={{
                            toolbar: CalendarToolbar
                        }}
                    />
                </div>
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)'
                }}>
                    <div className="glass-card" style={{ maxWidth: '500px', width: '90%', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Agendar Aula</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {turmaModules.length === 0 && <p style={{ color: '#f87171' }}>Atenção: Esta turma não tem módulos associados. Vá a "Gerir Módulos" primeiro.</p>}

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Módulo</label>
                                <select
                                    className="input-field"
                                    required
                                    value={formData.id_turma_detalhe}
                                    onChange={e => setFormData({ ...formData, id_turma_detalhe: e.target.value })}
                                >
                                    <option value="">Selecione Módulo...</option>
                                    {turmaModules.map(m => (
                                        <option key={m.id} value={m.id}>{m.nome_modulo} - {m.nome_formador} ({m.nome_sala})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Data</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    required
                                    value={formData.data}
                                    onChange={e => setFormData({ ...formData, data: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Início</label>
                                    <input
                                        type="time"
                                        className="input-field"
                                        required
                                        value={formData.hora_inicio}
                                        onChange={e => setFormData({ ...formData, hora_inicio: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Fim (Máx 3h)</label>
                                    <input
                                        type="time"
                                        className="input-field"
                                        required
                                        value={formData.hora_fim}
                                        onChange={e => setFormData({ ...formData, hora_fim: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={turmaModules.length === 0}>
                                Agendar
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={confirmDeleteEvent}
                title="Remover Aula"
                message={`Tem a certeza que deseja remover a aula de ${eventToDelete?.title}?`}
                isDestructive={true}
            />
        </>
    );
}

export default TurmaSchedulePage;
