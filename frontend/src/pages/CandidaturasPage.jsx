import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { API_URL } from '../services/authService';
import { Check, X, FileText, Search, AlertCircle } from 'lucide-react';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import Pagination from '../components/common/Pagination';

const CandidaciesListPage = () => {
    const { toast } = useToast();
    const [candidacies, setCandidacies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [filter, setFilter] = useState('ALL'); // ALL, PENDENTE, APROVADO, REJEITADO
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

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
            toast('Erro ao abrir PDF. Talvez não exista.', 'error');
        }
    };

    const filteredCandidacies = candidacies.filter(cand => {
        const matchesFilter = filter === 'ALL' || cand.estado === filter;
        const matchesSearch = cand.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cand.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cand.nome_curso.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredCandidacies.length / itemsPerPage);
    const paginatedCandidacies = filteredCandidacies.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, searchTerm]);

    return (
        <div style={{ padding: '0', minHeight: '100vh', color: 'var(--text-primary)' }}>
            <div className="page-header-flex" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                gap: '1.5rem',
                flexWrap: 'wrap'
            }}>
                <style>
                    {`
                        @media (max-width: 1200px) {
                            .page-header-flex { flex-direction: column !important; align-items: flex-start !important; }
                            .cand-header-actions { width: 100% !important; justify-content: space-between !important; }
                            .search-bar { flex: 1 !important; max-width: none !important; }
                        }
                        @media (max-width: 640px) {
                            .cand-header-actions { flex-direction: column !important; gap: 1rem !important; }
                            .search-bar { width: 100% !important; }
                            .filter-group { width: 100% !important; justify-content: center; }
                        }
                    `}
                </style>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="hidden-tablet" style={{
                        padding: '0.75rem',
                        borderRadius: '12px',
                        background: 'var(--primary-glow)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FileText size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px', margin: 0 }}>Gestão de Candidaturas</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '2px 0 0 0' }}>{filteredCandidacies.length} candidaturas encontradas</p>
                    </div>
                </div>

                <div className="cand-header-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div className="search-bar" style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '260px',
                        height: '40px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '10px',
                        padding: '0 0.85rem'
                    }}>
                        <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <input
                            type="text"
                            placeholder="Procurar candidato ou curso..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                width: '100%',
                                marginLeft: '0.5rem',
                                padding: 0,
                                height: '100%',
                                fontSize: '0.85rem'
                            }}
                        />
                    </div>
                    <div className="filter-group" style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.03)', padding: '3px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                        {['ALL', 'PENDENTE', 'APROVADO'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                style={{
                                    padding: '6px 14px',
                                    fontSize: '0.75rem',
                                    borderRadius: '7px',
                                    border: 'none',
                                    background: filter === status ? 'var(--primary)' : 'transparent',
                                    color: filter === status ? 'white' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontWeight: filter === status ? '600' : '500',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {status === 'ALL' ? 'Todos' : status.charAt(0) + status.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Candidato</th>
                                <th>Curso</th>
                                <th className="hidden-tablet">Data</th>
                                <th>Estado</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>A carregar...</td></tr>
                            ) : filteredCandidacies.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma candidatura encontrada.</td></tr>
                            ) : (
                                paginatedCandidacies.map(cand => (
                                    <tr key={cand.id} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.2s' }} className="hover-row">
                                        <td style={{ padding: '1.25rem' }} data-label="Candidato">
                                            <div style={{ fontWeight: '600', marginBottom: '0.2rem', color: 'var(--text-primary)' }}>{cand.nome_completo}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{cand.email}</div>
                                        </td>
                                        <td style={{ padding: '1.25rem', color: 'var(--text-secondary)' }} data-label="Curso">
                                            {cand.nome_curso}
                                        </td>
                                        <td className="hidden-tablet" style={{ padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }} data-label="Data">
                                            {new Date(cand.data_candidatura).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1.25rem' }} data-label="Estado">
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
                                        <td style={{ padding: '1.25rem', textAlign: 'right' }} data-label="Ações">
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

                {filteredCandidacies.length > itemsPerPage && (
                    <div style={{ padding: '1rem' }}>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
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
