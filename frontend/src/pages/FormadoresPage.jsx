import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { BookOpen, Search, Edit2, Save, X, FileText, Upload, Download, Trash2, Printer, Calendar as CalendarIcon, LayoutGrid, Clock, List } from 'lucide-react';
import { API_URL } from '../services/authService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import pt from 'date-fns/locale/pt';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { horarioService } from '../services/horarioService';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import CalendarToolbar from '../components/ui/CalendarToolbar';
import Pagination from '../components/common/Pagination';

const locales = { 'pt': pt };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

function FormadoresPage() {
    const { toast } = useToast();
    const [formadores, setFormadores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFormador, setSelectedFormador] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [viewingSchedule, setViewingSchedule] = useState(false);
    const [formadorEvents, setFormadorEvents] = useState([]);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [logoBase64, setLogoBase64] = useState(null);
    const [modalConfig, setModalConfig] = useState({ isOpen: false });
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState('week');
    const [filterStart, setFilterStart] = useState('');
    const [filterEnd, setFilterEnd] = useState('');

    // Paginação
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Recarregar horário quando os filtros mudam enquanto está a visualizar
    useEffect(() => {
        if (viewingSchedule && selectedFormador) {
            handleViewSchedule();
        }
    }, [filterStart, filterEnd]);

    // Estados do formulário
    const [editData, setEditData] = useState({
        biografia: '',
        especialidade: '',
        telemovel: '',
        morada: ''
    });

    useEffect(() => {
        fetchFormadores();

        // Carregar Logo
        const loadLogo = async () => {
            try {
                const response = await fetch('/amigo_logo.png');
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => setLogoBase64(reader.result);
                reader.readAsDataURL(blob);
            } catch (error) {
                console.error("Erro ao carregar logo:", error);
            }
        };
        loadLogo();
    }, []);

    const getAuthHeader = () => ({
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    const fetchFormadores = async () => {
        try {
            const response = await fetch(`${API_URL}/api/formadores`, { headers: getAuthHeader() });
            const data = await response.json();
            setFormadores(data);
            setCurrentPage(1);
        } catch (error) {
            console.error('Erro ao carregar formadores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectFormador = async (userId) => {
        try {
            const profileRes = await fetch(`${API_URL}/api/formadores/${userId}/profile`, { headers: getAuthHeader() });
            const profileData = await profileRes.json();

            const filesRes = await fetch(`${API_URL}/api/files/user/${userId}`, { headers: getAuthHeader() });
            const filesData = await filesRes.json();

            setSelectedFormador({ ...profileData, id: userId });
            setFiles(filesData);
            setEditData({
                biografia: profileData.biografia || '',
                especialidade: profileData.especialidade || '',
                telemovel: profileData.telemovel || '',
                morada: profileData.morada || ''
            });

            // Carregar Foto com Auth
            try {
                const photoRes = await fetch(`${API_URL}/api/files/user/${userId}/photo`, { headers: getAuthHeader() });
                if (photoRes.ok) {
                    const blob = await photoRes.blob();
                    const base64 = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                    setProfilePhoto(base64);
                } else {
                    setProfilePhoto(null);
                }
            } catch (e) { setProfilePhoto(null); }

            setIsEditing(false);
            setViewingSchedule(false);
        } catch (error) {
            console.error('Erro ao carregar detalhes:', error);
        }
    };

    const handleViewSchedule = async () => {
        if (!selectedFormador) return;
        try {
            const data = await horarioService.getFormadorSchedule(selectedFormador.id, filterStart, filterEnd);
            const formatted = data.map(ev => ({
                id: ev.id,
                title: `${ev.nome_modulo} (${ev.codigo_turma}) - ${ev.nome_sala}`,
                start: new Date(ev.inicio.replace(' ', 'T')),
                end: new Date(ev.fim.replace(' ', 'T'))
            }));
            setFormadorEvents(formatted);
            setViewingSchedule(true);
        } catch (error) {
            toast('Erro ao carregar horário', 'error');
        }
    };

    const handleExportPDF = async () => {
        if (!selectedFormador) return;
        setExporting(true);
        try {
            const historyRes = await fetch(`${API_URL}/api/formadores/${selectedFormador.id}/history`, { headers: getAuthHeader() });
            const historyData = await historyRes.json();
            const historyRecords = Array.isArray(historyData) ? historyData : [];

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // Cabeçalho
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, pageWidth, 40, 'F');

            doc.rect(0, 0, pageWidth, 40, 'F');

            // Logo
            if (logoBase64) {
                try {
                    doc.addImage(logoBase64, 'PNG', 15, 5, 30, 30);
                } catch (e) { console.warn('Erro logo', e); }
            }

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text('FICHA DO FORMADOR', 55, 25);

            doc.setFontSize(10);
            doc.text(`Docente: ${selectedFormador.nome_completo}`, pageWidth - 15, 25, { align: 'right' });

            // Usar a foto já carregada em memória
            let photoData = profilePhoto;
            if (!photoData) {
                try {
                    const photoRes = await fetch(`${API_URL}/api/files/user/${selectedFormador.id}/photo`, { headers: getAuthHeader() });
                    if (photoRes.ok) {
                        const blob = await photoRes.blob();
                        photoData = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.readAsDataURL(blob);
                        });
                    }
                } catch (e) { console.log("Sem foto disponível para o PDF"); }
            }

            // Perfil
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Perfil Profissional', 15, 55);
            doc.line(15, 58, 60, 58);

            // Inserir Foto se existir
            if (photoData) {
                doc.addImage(photoData, 'JPEG', pageWidth - 55, 50, 40, 40);
                doc.setDrawColor(99, 102, 241);
                doc.rect(pageWidth - 56, 49, 42, 42); // Moldura
            }

            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text(`Nome: ${selectedFormador.nome_completo}`, 15, 68);
            doc.text(`Email: ${selectedFormador.email}`, 15, 75);

            doc.setFontSize(11);
            doc.text('Biografia:', 15, 85);
            const bioLines = doc.splitTextToSize(selectedFormador.biografia || 'Sem biografia.', 120);
            doc.text(bioLines, 15, 92);

            // Tabela de Histórico
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Histórico de Lecionação', 15, 125);
            doc.line(15, 128, 70, 128);

            const tableRows = historyRecords.map(rec => [
                rec.nome_modulo,
                rec.nome_curso,
                rec.codigo_turma,
                new Date(rec.data_inicio).toLocaleDateString()
            ]);

            autoTable(doc, {
                startY: 135,
                head: [['Módulo', 'Curso', 'Turma', 'Data Início']],
                body: tableRows,
                headStyles: { fillColor: [99, 102, 241] }, // Indigo color
                theme: 'striped'
            });

            // Rodapé
            const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 200) + 20;
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text('Documento gerado pelo A.M.I.G.O.', pageWidth / 2, Math.min(finalY, 285), { align: 'center' });

            doc.save(`Ficha_Formador_${selectedFormador.nome_completo.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error('Erro PDF:', error);
            toast('Erro ao gerar ficha', 'error');
        } finally {
            setExporting(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await fetch(`${API_URL}/api/formadores/${selectedFormador.id}/profile`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editData)
            });

            setFormadores(prev => prev.map(f => f.id === selectedFormador.id ? { ...f, ...editData } : f));
            setSelectedFormador(prev => ({ ...prev, ...editData }));
            setIsEditing(false);
        } catch (error) {
            console.error('Erro ao atualizar:', error);
        }
    };

    const handleFileUpload = async (e, forcedCategory = null) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('categoria', forcedCategory || 'documento');

        setUploading(true);
        try {
            await fetch(`${API_URL}/api/files/user/${selectedFormador.id}`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: formData
            });

            const filesRes = await fetch(`${API_URL}/api/files/user/${selectedFormador.id}`, { headers: getAuthHeader() });
            const filesData = await filesRes.json();

            // Recarregar foto de perfil após upload
            if (forcedCategory === 'foto') {
                const photoRes = await fetch(`${API_URL}/api/files/user/${selectedFormador.id}/photo`, { headers: getAuthHeader() });
                if (photoRes.ok) {
                    const blob = await photoRes.blob();
                    const base64 = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                    setProfilePhoto(base64);
                }
            }

            setFiles(filesData);

        } catch (error) {
            console.error('Erro upload:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (fileId, fileName) => {
        try {
            const response = await fetch(`${API_URL}/api/files/${fileId}`, { headers: getAuthHeader() });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro download:', error);
        }
    };

    const handleDeleteFile = (fileId) => {
        setModalConfig({
            isOpen: true,
            title: 'Eliminar Ficheiro',
            type: 'danger',
            children: 'Tem a certeza que deseja eliminar este ficheiro permanentemente?',
            confirmText: 'Eliminar',
            onConfirm: () => performDeleteFile(fileId)
        });
    };

    const performDeleteFile = async (fileId) => {
        try {
            await fetch(`${API_URL}/api/files/${fileId}`, {
                method: 'DELETE',
                headers: getAuthHeader()
            });
            setFiles(prev => prev.filter(f => f.id !== fileId));
            setModalConfig({ isOpen: false });
        } catch (error) {
            console.error('Erro delete:', error);
        }
    };

    const filteredFormadores = formadores.filter(f =>
        f.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Resultados paginados
    const totalPages = Math.ceil(filteredFormadores.length / itemsPerPage);
    const paginatedFormadores = filteredFormadores.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', gap: '2rem' }} className="page-header-flex">
                <style>
                    {`
                        @media (max-width: 1200px) {
                            .page-header-flex { flex-wrap: wrap !important; gap: 1.5rem !important; }
                            .formadores-header-actions { justify-content: flex-start !important; width: 100% !important; }
                            .search-bar { flex: 1; max-width: none !important; }
                            .hidden-tablet { display: none !important; }
                        }
                        @media (max-width: 640px) {
                            .formadores-header-actions { flex-direction: column !important; align-items: stretch !important; gap: 1rem !important; }
                            .search-bar { width: 100% !important; }
                        }
                    `}
                </style>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
                    <div className="hidden-tablet" style={{ padding: '0.85rem', borderRadius: '14px', background: 'var(--primary-glow)', color: 'var(--primary)', boxShadow: '0 8px 16px -4px var(--primary-glow)' }}>
                        <BookOpen size={28} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.5px', margin: 0 }}>Formadores</h1>
                        <p className="hidden-tablet" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>Gerir equipa pedagógica e documentos</p>
                    </div>
                </div>

                <div className="formadores-header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexShrink: 0 }}>
                    <div className="search-bar" style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '280px',
                        height: '42px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '12px',
                        padding: '0 1rem'
                    }}>
                        <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <input
                            type="text"
                            placeholder="Pesquisar..."
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
                </div>
            </div>

            <div className="responsive-grid" style={{
                display: 'grid',
                gridTemplateColumns: selectedFormador ? '1.8fr 1.2fr' : '1fr',
                gap: '2.5rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                alignItems: 'start'
            }}>
                <style>
                    {`
                        @media (max-width: 1400px) {
                            .responsive-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
                        }
                        @media (max-width: 768px) {
                             /* Force Table to Card View */
                             table, thead, tbody, th, td, tr { display: block; }
                             thead tr { position: absolute; top: -9999px; left: -9999px; }
                             tr { border: 1px solid var(--border-glass); border-radius: 12px; margin-bottom: 1rem; background: var(--bg-card); padding: 1rem; }
                             td { border: none; position: relative; padding-left: 50% !important; margin-bottom: 0.5rem; text-align: right; display: flex; justify-content: flex-end; align-items: center; }
                             td:before { position: absolute; top: 50%; left: 0; transform: translateY(-50%); width: 45%; padding-right: 10px; white-space: nowrap; content: attr(data-label); font-weight: bold; text-align: left; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; }
                             td:last-child { margin-bottom: 0; border-bottom: 0; }
                        }
                    `}
                </style>
                <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                    {loading ? (
                        <p style={{ textAlign: 'center', padding: '2rem' }}>A carregar...</p>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Email</th>
                                        <th style={{ textAlign: 'right' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedFormadores.map(formador => (
                                        <tr key={formador.id}
                                            style={{
                                                borderBottom: '1px solid var(--border-glass)',
                                                background: selectedFormador?.id === formador.id ? 'var(--card-hover-bg)' : 'transparent'
                                            }}
                                        >
                                            <td style={{ padding: '1rem' }} data-label="Nome">
                                                <div style={{ fontWeight: '500' }}>{formador.nome_completo}</div>
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--text-secondary)' }} data-label="Email">
                                                {formador.email}
                                            </td>
                                            <td style={{ textAlign: 'right' }} data-label="Ações">
                                                <button
                                                    onClick={() => handleSelectFormador(formador.id)}
                                                    className="btn-glass"
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                                >
                                                    Ver Perfil
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {filteredFormadores.length > itemsPerPage && (
                                <div style={{ padding: '1rem 1.5rem' }}>
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {selectedFormador && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="glass-card"
                            style={{ position: 'sticky', top: '100px', padding: '2rem' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <h3>{viewingSchedule ? 'Horário' : 'Perfil'} de {selectedFormador.nome_completo}</h3>
                                </div>
                                <button onClick={() => setSelectedFormador(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
                                <button
                                    onClick={() => setViewingSchedule(false)}
                                    className={!viewingSchedule ? "btn-primary" : "btn-glass"}
                                    style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                                >
                                    Perfil & Doc.
                                </button>
                                <button
                                    onClick={handleViewSchedule}
                                    className={viewingSchedule ? "btn-primary" : "btn-glass"}
                                    style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                    <CalendarIcon size={14} /> Horário
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    className="btn-glass"
                                    style={{ color: 'var(--accent)', padding: '0.4rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                    disabled={exporting}
                                >
                                    <Printer size={14} /> {exporting ? 'A gerar...' : 'PDF'}
                                </button>
                            </div>

                            {!viewingSchedule ? (
                                <>
                                    <div style={{ marginBottom: '2rem' }}>
                                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                                            <div style={{ position: 'relative' }}>
                                                <div style={{
                                                    width: '80px', height: '80px', borderRadius: '20px', overflow: 'hidden',
                                                    border: '2px solid var(--primary)', background: 'var(--card-hover-bg)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    {profilePhoto ? (
                                                        <img
                                                            src={profilePhoto}
                                                            alt="Perfil"
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                                            {selectedFormador.nome_completo.substring(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <label style={{
                                                    position: 'absolute', bottom: '-5px', right: '-5px',
                                                    background: 'var(--primary)', padding: '5px', borderRadius: '50%',
                                                    cursor: 'pointer', display: 'flex', border: '2px solid #0f172a'
                                                }}>
                                                    <Upload size={12} />
                                                    <input type="file" onChange={(e) => handleFileUpload(e, 'foto')} style={{ display: 'none' }} />
                                                </label>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{selectedFormador.nome_completo}</h2>
                                                    <button
                                                        onClick={() => setIsEditing(!isEditing)}
                                                        className="btn-glass"
                                                        style={{ padding: '0.5rem', color: 'var(--primary)' }}
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                </div>
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{selectedFormador.email}</p>
                                            </div>
                                        </div>

                                        {isEditing ? (
                                            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                    <div>
                                                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Telemóvel</label>
                                                        <input
                                                            className="input-field"
                                                            value={editData.telemovel}
                                                            onChange={e => setEditData({ ...editData, telemovel: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Especialidade</label>
                                                        <input
                                                            className="input-field"
                                                            value={editData.especialidade}
                                                            onChange={e => setEditData({ ...editData, especialidade: e.target.value })}
                                                            placeholder="Ex: Cibersegurança"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Morada</label>
                                                    <input
                                                        className="input-field"
                                                        value={editData.morada}
                                                        onChange={e => setEditData({ ...editData, morada: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Biografia / Notas</label>
                                                    <textarea
                                                        className="input-field"
                                                        value={editData.biografia}
                                                        onChange={e => setEditData({ ...editData, biografia: e.target.value })}
                                                        rows={4}
                                                    />
                                                </div>
                                                <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
                                                    <Save size={16} /> Guardar
                                                </button>
                                            </form>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Telemóvel</label>
                                                        <div style={{ fontSize: '0.95rem' }}>{selectedFormador.telemovel || 'Não definido'}</div>
                                                    </div>
                                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Especialidade</label>
                                                        <div style={{ fontSize: '0.95rem' }}>{selectedFormador.especialidade || 'Geral'}</div>
                                                    </div>
                                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Morada</label>
                                                        <div style={{ fontSize: '0.95rem' }}>{selectedFormador.morada || 'Não definida'}</div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Biografia</h4>
                                                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                                        {selectedFormador.biografia || 'Sem biografia definida.'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h4>Documentos</h4>
                                            <label className="btn-primary" style={{ cursor: 'pointer', fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                                                <Upload size={16} />
                                                {uploading ? 'A enviar...' : 'Upload'}
                                                <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
                                            </label>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {files.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhum ficheiro.</p>}
                                            {files.map(file => (
                                                <div key={file.id} style={{
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <FileText size={16} color="var(--accent)" />
                                                        <span style={{ fontSize: '0.9rem' }}>{file.nome_original}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button onClick={() => handleDownload(file.id, file.nome_original)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><Download size={16} /></button>
                                                        <button onClick={() => handleDeleteFile(file.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
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
                                    <div style={{ height: '500px', overflowX: 'auto' }}>
                                        <div style={{ minWidth: '600px', height: '100%' }}>
                                            <Calendar
                                                localizer={localizer}
                                                events={formadorEvents}
                                                startAccessor="start"
                                                endAccessor="end"
                                                culture='pt'
                                                date={currentDate}
                                                view={currentView}
                                                onNavigate={date => {
                                                    if (filterStart && filterEnd) {
                                                        const start = new Date(filterStart);
                                                        const end = new Date(filterEnd);
                                                        if (date < start) setCurrentDate(start);
                                                        else if (date > end) setCurrentDate(end);
                                                        else setCurrentDate(date);
                                                    } else {
                                                        setCurrentDate(date);
                                                    }
                                                }}
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
                                                        backgroundColor: 'var(--secondary)',
                                                        borderRadius: '8px',
                                                        opacity: 0.9,
                                                        color: 'var(--text-primary)',
                                                        border: 'none',
                                                        display: 'block',
                                                        padding: '2px 8px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                    }
                                                })}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div >

            <Modal
                {...modalConfig}
                onClose={() => setModalConfig({ isOpen: false })}
            />
        </>
    );
}

export default FormadoresPage;
