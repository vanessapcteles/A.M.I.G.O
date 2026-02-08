import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Users, Search, Edit2, Save, X, FileText, Upload, Download, Trash2, Smartphone, MapPin, Printer } from 'lucide-react';
import { API_URL } from '../services/authService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';

function FormandosPage() {
    const { toast } = useToast();
    const [formandos, setFormandos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFormando, setSelectedFormando] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [modalConfig, setModalConfig] = useState({ isOpen: false });

    // Form States
    const [editData, setEditData] = useState({
        morada: '',
        telemovel: '',
        data_nascimento: ''
    });
    const [turmas, setTurmas] = useState([]);
    const [selectedTurma, setSelectedTurma] = useState('');
    const [assignmentStatus, setAssignmentStatus] = useState(null);

    const [filterCourse, setFilterCourse] = useState('');
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        fetchTurmas();
        fetchCourses();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchFormandos();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, filterCourse]);

    const getAuthHeader = () => ({
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    const fetchCourses = async () => {
        try {
            const response = await fetch(`${API_URL}/api/turmas/cursos`, { headers: getAuthHeader() });
            const data = await response.json();
            setCourses(data);
        } catch (error) {
            console.error('Erro ao carregar cursos:', error);
        }
    };

    const fetchFormandos = async () => {
        try {
            setLoading(true);
            let url = `${API_URL}/api/formandos?search=${searchTerm}`;
            if (filterCourse) url += `&courseId=${filterCourse}`;

            const response = await fetch(url, { headers: getAuthHeader() });
            const data = await response.json();
            setFormandos(data);
        } catch (error) {
            console.error('Erro ao carregar formandos:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTurmas = async () => {
        try {
            const response = await fetch(`${API_URL}/api/turmas`, { headers: getAuthHeader() });
            const data = await response.json();
            // Handle pagination response format
            const turmasList = Array.isArray(data) ? data : (data.data || []);
            setTurmas(turmasList);
        } catch (error) {
            console.error('Erro ao carregar turmas:', error);
            toast('Erro ao carregar turmas', 'error');
        }
    };

    const handleAssignTurma = async () => {
        if (!selectedTurma) return;
        setAssignmentStatus(null);

        try {
            const response = await fetch(`${API_URL}/api/formandos/${selectedFormando.id}/enroll`, {
                method: 'POST',
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ turmaId: selectedTurma })
            });

            if (response.ok) {
                setAssignmentStatus({ type: 'success', message: 'Turma atribuída com sucesso!' });
                // Recarregar dados do formando para atualizar curso atual
                handleSelectFormando(selectedFormando.id);
                setSelectedTurma('');
            } else {
                const err = await response.json();
                setAssignmentStatus({ type: 'error', message: err.message || 'Erro ao atribuir turma' });
            }
        } catch (error) {
            console.error('Erro ao atribuir turma:', error);
            setAssignmentStatus({ type: 'error', message: 'Erro de conexão.' });
        }
    };

    const handleSelectFormando = async (userId) => {
        try {
            // Carregar Detalhes do Perfil
            const profileRes = await fetch(`${API_URL}/api/formandos/${userId}/profile`, { headers: getAuthHeader() });
            const profileData = await profileRes.json();

            // Carregar Ficheiros
            const filesRes = await fetch(`${API_URL}/api/files/user/${userId}`, { headers: getAuthHeader() });
            const filesData = await filesRes.json();

            setSelectedFormando({ ...profileData, id: userId });
            setFiles(filesData);
            setEditData({
                morada: profileData.morada || '',
                telemovel: profileData.telemovel || '',
                data_nascimento: profileData.data_nascimento ? profileData.data_nascimento.split('T')[0] : ''
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
        } catch (error) {
            console.error('Erro ao carregar detalhes:', error);
        }
    };

    const handleExportPDF = async () => {
        if (!selectedFormando) return;
        setExporting(true);
        try {
            // 1. Obter registo académico
            const recordsRes = await fetch(`${API_URL}/api/formandos/${selectedFormando.id}/academic`, { headers: getAuthHeader() });
            const academicData = await recordsRes.json();
            const academicRecords = Array.isArray(academicData) ? academicData : [];

            // 2. Criar PDF
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // Cabeçalho Premium
            doc.setFillColor(30, 41, 59); // Slate-800
            doc.rect(0, 0, pageWidth, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text('FICHA DO FORMANDO', 15, 25);

            doc.setFontSize(10);
            doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, pageWidth - 15, 25, { align: 'right' });

            // Usar a foto já carregada em memória (ou tentar de novo se falhar)
            let photoData = profilePhoto;
            if (!photoData) {
                try {
                    const photoRes = await fetch(`${API_URL}/api/files/user/${selectedFormando.id}/photo`, { headers: getAuthHeader() });
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

            // Dados Pessoais
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Dados Pessoais', 15, 55);
            doc.line(15, 58, 60, 58);

            // Inserir Foto se existir
            if (photoData) {
                doc.addImage(photoData, 'JPEG', pageWidth - 55, 50, 40, 40);
                doc.setDrawColor(56, 189, 248);
                doc.rect(pageWidth - 56, 49, 42, 42); // Moldura
            }

            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text(`Nome: ${selectedFormando.nome_completo}`, 15, 68);
            doc.text(`Email: ${selectedFormando.email}`, 15, 75);
            doc.text(`Curso Atual: ${selectedFormando.curso_atual || 'Não inscrito'}`, 15, 82);
            doc.text(`Telemóvel: ${selectedFormando.telemovel || 'N/A'}`, 15, 89);
            doc.text(`Morada: ${selectedFormando.morada || 'N/A'}`, 15, 96);
            doc.text(`Data de Nascimento: ${selectedFormando.data_nascimento ? new Date(selectedFormando.data_nascimento).toLocaleDateString() : 'N/A'}`, 15, 103);

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Histórico Escolar', 15, 120);
            doc.line(15, 123, 60, 123);

            const tableRows = academicRecords.map(rec => [
                rec.nome_curso,
                rec.codigo_turma,
                new Date(rec.data_inicio).toLocaleDateString(),
                rec.nota_final ? `${rec.nota_final} val` : 'Em curso'
            ]);

            autoTable(doc, {
                startY: 125,
                head: [['Curso', 'Turma', 'Data Início', 'Nota Final']],
                body: tableRows,
                headStyles: { fillColor: [56, 189, 248] }, // Primary color
                theme: 'striped'
            });

            // Rodapé
            const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 200) + 20;
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text('Este documento é um comprovativo interno da academia.', pageWidth / 2, Math.min(finalY, 285), { align: 'center' });

            doc.save(`Ficha_${selectedFormando.nome_completo.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
            toast('Erro ao gerar PDF', 'error');
        } finally {
            setExporting(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await fetch(`${API_URL}/api/formandos/${selectedFormando.id}/profile`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editData)
            });

            // Atualizar lista local
            setFormandos(prev => prev.map(f => f.id === selectedFormando.id ? { ...f, ...editData } : f));
            setSelectedFormando(prev => ({ ...prev, ...editData }));
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
            await fetch(`${API_URL}/api/files/user/${selectedFormando.id}`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: formData
            });

            const filesRes = await fetch(`${API_URL}/api/files/user/${selectedFormando.id}`, { headers: getAuthHeader() });
            const filesData = await filesRes.json(); // Fetch updated files list

            // Recarregar foto de perfil após upload
            if (forcedCategory === 'foto') {
                const photoRes = await fetch(`${API_URL}/api/files/user/${selectedFormando.id}/photo`, { headers: getAuthHeader() });
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



    return (
        <>
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
                            .formandos-header-actions { width: 100% !important; justify-content: space-between !important; }
                            .search-bar { flex: 1 !important; max-width: none !important; }
                        }
                        @media (max-width: 640px) {
                            .formandos-header-actions { flex-direction: column !important; gap: 1rem !important; }
                            .search-bar, .course-filter { width: 100% !important; }
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
                        <Users size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px', margin: 0 }}>Formandos</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '2px 0 0 0' }}>{formandos.length} alunos encontrados</p>
                    </div>
                </div>

                <div className="formandos-header-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <select
                        className="input-field course-filter"
                        style={{ width: 'auto', minWidth: '180px', height: '40px', margin: 0, padding: '0 0.75rem', fontSize: '0.85rem', borderRadius: '10px' }}
                        value={filterCourse}
                        onChange={(e) => setFilterCourse(e.target.value)}
                    >
                        <option value="">Todos os Cursos</option>
                        {courses.map(c => (
                            <option key={c.id} value={c.id}>{c.nome_curso}</option>
                        ))}
                    </select>
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
                            placeholder="Pesquisar por nome ou email..."
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
                gridTemplateColumns: selectedFormando ? '1.8fr 1.2fr' : '1fr',
                gap: '2.5rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                alignItems: 'start'
            }}>
                <style>
                    {`
                        @media (max-width: 1400px) {
                            .responsive-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
                        }
                    `}
                </style>
                <div className="glass-card">
                    {loading ? (
                        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>A carregar formandos...</p>
                    ) : (
                        <div className="table-container">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Nome</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Curso</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Contacto</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formandos.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                Nenhum formando encontrado.
                                            </td>
                                        </tr>
                                    ) : (
                                        formandos.map(formando => (
                                            <tr key={formando.id}
                                                onClick={() => handleSelectFormando(formando.id)}
                                                style={{
                                                    borderBottom: '1px solid var(--border-glass)',
                                                    background: selectedFormando?.id === formando.id ? 'var(--card-hover-bg)' : 'transparent',
                                                    cursor: 'pointer',
                                                    transition: 'var(--transition)'
                                                }}
                                            >
                                                <td style={{ padding: '1rem' }} data-label="Nome">
                                                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formando.nome_completo}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formando.email}</div>
                                                </td>
                                                <td style={{ padding: '1rem' }} data-label="Curso">
                                                    {formando.curso_atual ? (
                                                        <span style={{
                                                            fontSize: '0.75rem',
                                                            padding: '6px 12px',
                                                            borderRadius: '8px',
                                                            background: 'rgba(56, 189, 248, 0.08)',
                                                            color: 'var(--primary)',
                                                            fontWeight: '600',
                                                            display: 'inline-block',
                                                            maxWidth: '250px',
                                                            whiteSpace: 'normal',
                                                            lineHeight: '1.3',
                                                            border: '1px solid rgba(56, 189, 248, 0.2)'
                                                        }}>
                                                            {formando.curso_atual}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Não Registado</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '1rem', fontSize: '0.9rem' }} data-label="Contacto">
                                                    {formando.telemovel || '-'}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }} data-label="Ações">
                                                    <button
                                                        className="btn-glass"
                                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                                    >
                                                        Ver Perfil
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Painel de Detalhes */}
                <AnimatePresence>
                    {selectedFormando && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="glass-card"
                            style={{ padding: '2rem', position: 'sticky', top: '100px' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <h3>Detalhes do Formando</h3>
                                    <button
                                        onClick={handleExportPDF}
                                        className="btn-glass"
                                        style={{ color: 'var(--accent)', padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                        disabled={exporting}
                                    >
                                        <Printer size={14} /> {exporting ? 'A gerar...' : 'Exportar PDF'}
                                    </button>
                                </div>
                                <button onClick={() => setSelectedFormando(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

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
                                                    {selectedFormando.nome_completo.substring(0, 2).toUpperCase()}
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
                                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{selectedFormando.nome_completo}</h2>
                                            <button
                                                onClick={() => setIsEditing(!isEditing)}
                                                className="btn-glass"
                                                style={{ padding: '0.5rem', color: 'var(--primary)' }}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </div>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{selectedFormando.email}</p>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                            <span style={{ fontWeight: 'bold' }}>Curso Associado:</span> {selectedFormando.curso_atual || 'Nenhum'}
                                        </p>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                            <span style={{ fontWeight: 'bold' }}>Turma Associada:</span> {selectedFormando.turma_atual || 'Nenhuma'}
                                        </p>

                                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <select
                                                    value={selectedTurma}
                                                    onChange={(e) => setSelectedTurma(e.target.value)}
                                                    className="input-field"
                                                    style={{ padding: '0.4rem', fontSize: '0.9rem', width: 'auto', maxWidth: '200px' }}
                                                >
                                                    <option value="">Atribuir Turma...</option>
                                                    {turmas
                                                        .filter(t => !selectedFormando.id_curso || t.id_curso === selectedFormando.id_curso)
                                                        .map(t => (
                                                            <option key={t.id} value={t.id}>
                                                                {t.codigo_turma} - {t.nome_curso}
                                                            </option>
                                                        ))}
                                                </select>
                                                <button
                                                    onClick={handleAssignTurma}
                                                    className="btn-primary"
                                                    disabled={!selectedTurma}
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                                                >
                                                    Atribuir
                                                </button>
                                            </div>
                                            {assignmentStatus && (
                                                <div style={{
                                                    fontSize: '0.85rem',
                                                    color: assignmentStatus.type === 'success' ? '#10b981' : '#f87171',
                                                    marginTop: '0.2rem'
                                                }}>
                                                    {assignmentStatus.message}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {isEditing ? (
                                    <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Telemóvel</label>
                                            <input
                                                className="input-field"
                                                value={editData.telemovel}
                                                onChange={e => setEditData({ ...editData, telemovel: e.target.value })}
                                            />
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
                                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Data Nascimento</label>
                                            <input
                                                type="date"
                                                className="input-field"
                                                value={editData.data_nascimento}
                                                onChange={e => setEditData({ ...editData, data_nascimento: e.target.value })}
                                            />
                                        </div>
                                        <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
                                            <Save size={16} /> Guardar
                                        </button>
                                    </form>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                            <Smartphone size={16} /> {selectedFormando.telemovel || 'Sem telemóvel'}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                            <MapPin size={16} /> {selectedFormando.morada || 'Sem morada'}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                            {selectedFormando.data_nascimento ? new Date(selectedFormando.data_nascimento).toLocaleDateString() : 'Sem data de nascimento'}
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
                                                <button
                                                    onClick={() => handleDownload(file.id, file.nome_original)}
                                                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                                >
                                                    <Download size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteFile(file.id)}
                                                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
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

export default FormandosPage;
