import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, LayoutGrid, Clock } from 'lucide-react';

const CalendarToolbar = ({ label, onNavigate, onView, view, views, locked }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            marginBottom: '1.5rem',
            padding: '0.5rem'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                {/* Navegação */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                        onClick={() => onNavigate('TODAY')}
                        className="btn-glass"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    >
                        Hoje
                    </button>
                    <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
                        <button
                            onClick={() => onNavigate('PREV')}
                            className="btn-glass"
                            style={{ padding: '0.5rem', borderRadius: '8px' }}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => onNavigate('NEXT')}
                            className="btn-glass"
                            style={{ padding: '0.5rem', borderRadius: '8px' }}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                {/* Label Central (Data) */}
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', textTransform: 'capitalize', color: 'white' }}>
                    {label}
                </h2>

                {/* Switcher de Visão */}
                <div className="glass-card" style={{
                    padding: '0.25rem',
                    display: 'flex',
                    gap: '0.25rem',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.03)'
                }}>
                    {views.map(v => {
                        const Icon = v === 'month' ? LayoutGrid : v === 'week' ? Clock : v === 'day' ? List : List;
                        const label = v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : v === 'day' ? 'Dia' : 'Agenda';

                        return (
                            <button
                                key={v}
                                onClick={() => onView(v)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    background: view === v ? 'var(--primary)' : 'transparent',
                                    color: view === v ? 'white' : 'var(--text-secondary)'
                                }}
                            >
                                <Icon size={16} />
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CalendarToolbar;
