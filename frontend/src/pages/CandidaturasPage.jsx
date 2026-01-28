import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { API_URL } from '../services/authService';
import { Check, X, FileText, Search, Filter, AlertCircle } from 'lucide-react';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';

const CandidaciesListPage = () => {
    const { toast } = useToast();
    const [candidacies, setCandidacies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [filter, setFilter] = useState('ALL'); // ALL, PENDENTE, APROVADO, REJEITADO
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [modalConfig, setModalConfig] = useState({ isOpen: false });

    useEffect(() => {
        fetchCandidacies();
    }, []);

    const fetchCandidacies = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_URL}/api/candidatos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setCandidacies(data);
        } catch (error) {
            console.error('Erro ao buscar candidaturas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = (id) => {
        setModalConfig({
            isOpen: true,
            title: 'Aprovar Candidatura',
            type: 'info',
            children: 'Tem a certeza que deseja aprovar esta candidatura? O utilizador será promovido a Formando.',
            onConfirm: () => performApprove(id),
            confirmText: 'Aprovar'
        });
    };

    const performApprove = async (id) => {
        try {
            setActionLoading(true);
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_URL}/api/candidatos/${id}/approve`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast('Candidatura aprovada com sucesso!');
                await fetchCandidacies();
                setModalConfig({ isOpen: false });
            } else {
                toast('Erro ao aprovar candidatura', 'error');
            }
        } catch (error) {
            console.error(error);
            toast('Erro de ligação ao servidor', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = (id) => {
        setModalConfig({
            isOpen: true,
            title: 'Rejeitar Candidatura',
            type: 'danger',
            children: 'Tem a certeza que deseja rejeitar esta candidatura? Esta ação não pode ser desfeita.',
            onConfirm: () => performReject(id),
            confirmText: 'Rejeitar'
        });
    };

    const performReject = async (id) => {
        try {
            setActionLoading(true);
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_URL}/api/candidatos/${id}/reject`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast('Candidatura rejeitada.');
                await fetchCandidacies();
                setModalConfig({ isOpen: false });
            } else {
                toast('Erro ao rejeitar candidatura', 'error');
            }
        } catch (error) {
            console.error(error);
            toast('Erro de ligação ao servidor', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleViewPDF = async (fileId, fileName) => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_URL}/api/files/${fileId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao baixar ficheiro');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName || 'candidatura.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            alert('Erro ao abrir PDF. Talvez não exista.');
        }
    };

    const filteredCandidacies = candidacies.filter(cand => {
        const matchesFilter = filter === 'ALL' || cand.estado === filter;
        const matchesSearch = cand.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cand.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cand.nome_curso.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div style={{ padding: '0', minHeight: '100vh', color: 'var(--text-primary)' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', fontFamily: 'var(--font-title)' }}>
                        Gestão de Candidaturas
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Gerira as candidaturas pendentes e histórico.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        className="input-field"
                        style={{ paddingLeft: '2.8rem' }}
                        placeholder="Pesquisar por nome, email ou curso..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['ALL', 'PENDENTE', 'APROVADO', 'REJEITADO'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={filter === status ? 'btn-primary' : 'glass-card'}
                            style={{
                                padding: '0.5rem 1rem', fontSize: '0.8rem', textTransform: 'capitalize',
                                border: '1px solid var(--border-glass)', cursor: 'pointer',
                                background: filter === status ? '' : 'transparent',
                                color: filter === status ? 'white' : 'var(--text-secondary)'
                            }}
                        >
                            {status === 'ALL' ? 'Todos' : status.toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-glass)' }}>
                            <tr>
                                <th style={{ padding: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', fontFamily: 'var(--font-title)' }}>Candidato</th>
                                <th style={{ padding: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', fontFamily: 'var(--font-title)' }}>Curso</th>
                                <th style={{ padding: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', fontFamily: 'var(--font-title)' }}>Data</th>
                                <th style={{ padding: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', fontFamily: 'var(--font-title)' }}>Estado</th>
                                <th style={{ padding: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right', fontFamily: 'var(--font-title)' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>A carregar...</td></tr>
                            ) : filteredCandidacies.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma candidatura encontrada.</td></tr>
                            ) : (
                                filteredCandidacies.map(cand => (
                                    <tr key={cand.id} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.2s' }} className="hover-row">
                                        <td style={{ padding: '1.25rem' }}>
                                            <div style={{ fontWeight: '600', marginBottom: '0.2rem', color: 'var(--text-primary)' }}>{cand.nome_completo}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{cand.email}</div>
                                        </td>
                                        <td style={{ padding: '1.25rem', color: 'var(--text-secondary)' }}>
                                            {cand.nome_curso}
                                        </td>
                                        <td style={{ padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            {new Date(cand.data_candidatura).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1.25rem' }}>
                                            <span style={{
                                                padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '500',
                                                background: cand.estado === 'PENDENTE' ? 'rgba(234, 179, 8, 0.1)' :
                                                    cand.estado === 'APROVADO' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: cand.estado === 'PENDENTE' ? '#fbbf24' :
                                                    cand.estado === 'APROVADO' ? '#10b981' : '#f87171',
                                                border: `1px solid ${cand.estado === 'PENDENTE' ? 'rgba(234, 179, 8, 0.2)' :
                                                    cand.estado === 'APROVADO' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                            }}>
                                                {cand.estado}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                {cand.file_id && (
                                                    <button
                                                        onClick={() => handleViewPDF(cand.file_id, cand.nome_original)}
                                                        className="glass-card"
                                                        title="Ver Ficha PDF"
                                                        style={{ width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid var(--border-glass)' }}
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                )}

                                                {cand.estado === 'PENDENTE' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(cand.id)}
                                                            className="glass-card"
                                                            title="Aprovar"
                                                            style={{ width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)', cursor: 'pointer' }}
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(cand.id)}
                                                            className="glass-card"
                                                            title="Rejeitar"
                                                            style={{ width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)', cursor: 'pointer' }}
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                {...modalConfig}
                loading={actionLoading}
                onClose={() => setModalConfig({ isOpen: false })}
            />
        </div>
    );
};

export default CandidaciesListPage;
