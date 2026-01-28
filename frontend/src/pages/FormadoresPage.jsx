import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { BookOpen, Search, Edit2, Save, X, FileText, Upload, Download, Trash2, Printer, Calendar as CalendarIcon } from 'lucide-react';
import { API_URL } from '../services/authService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import pt from 'date-fns/locale/pt';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { horarioService } from '../services/horarioService';
import Modal from '../components/ui/Modal';

const locales = { 'pt': pt };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

function FormadoresPage() {
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
    const [modalConfig, setModalConfig] = useState({ isOpen: false });

    // Form States
    const [editData, setEditData] = useState({
        biografia: ''
    });

    useEffect(() => {
        fetchFormadores();
    }, []);

    const getAuthHeader = () => ({
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    const fetchFormadores = async () => {
        try {
            const response = await fetch(`${API_URL}/api/formadores`, { headers: getAuthHeader() });
            const data = await response.json();
            setFormadores(data);
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
                biografia: profileData.biografia || ''
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
            const data = await horarioService.getFormadorSchedule(selectedFormador.id);
            const formatted = data.map(ev => ({
                id: ev.id,
                title: `${ev.nome_modulo} (${ev.codigo_turma}) - ${ev.nome_sala}`,
                start: new Date(ev.inicio),
                end: new Date(ev.fim)
            }));
            setFormadorEvents(formatted);
            setViewingSchedule(true);
        } catch (error) {
            alert('Erro ao carregar horário');
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

            // Cabeçalho Premium
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, pageWidth, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text('FICHA DO FORMADOR', 15, 25);

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

            doc.autoTable({
                startY: 135,
                head: [['Módulo', 'Curso', 'Turma', 'Data Início']],
                body: tableRows,
                headStyles: { fillColor: [99, 102, 241] }, // Indigo color
                theme: 'striped'
            });

            doc.save(`Ficha_Formador_${selectedFormador.nome_completo.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error('Erro PDF:', error);
            alert('Erro ao gerar ficha');
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

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--primary)' }}>
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Formadores</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Gerir equipa pedagógica e documentos</p>
                    </div>
                </div>

                <div className="search-bar" style={{ width: '300px' }}>
                    <Search size={20} style={{ color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Pesquisar formador..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedFormador ? '1fr 1fr' : '1fr', gap: '2rem', transition: 'all 0.3s ease' }}>
                <div className="glass-card">
                    {loading ? (
                        <p>A carregar...</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Nome</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Email</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFormadores.map(formador => (
                                    <tr key={formador.id}
                                        style={{
                                            borderBottom: '1px solid var(--border-glass)',
                                            background: selectedFormador?.id === formador.id ? 'rgba(255,255,255,0.05)' : 'transparent'
                                        }}
                                    >
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '500' }}>{formador.nome_completo}</div>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                            {formador.email}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <button
                                                onClick={() => handleSelectFormador(formador.id)}
                                                className="btn-glass"
                                                style={{ padding: '0.5rem', fontSize: '0.9rem' }}
                                            >
                                                Ver Perfil
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <AnimatePresence>
                    {selectedFormador && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="glass-card"
                            style={{ position: 'relative' }}
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
                                                    border: '2px solid var(--primary)', background: 'rgba(255,255,255,0.05)',
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
                                            <div>
                                                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Biografia</h4>
                                                <p style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                                    {selectedFormador.biografia || 'Sem biografia definida.'}
                                                </p>
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
                                <div style={{ height: '400px', color: 'black' }}>
                                    <style>{`
                                        .rbc-calendar { color: white; }
                                        .rbc-off-range-bg { background: rgba(255,255,255,0.05); }
                                        .rbc-header { color: var(--text-secondary); border-bottom: 1px solid var(--border-glass); }
                                        .rbc-today { background: rgba(59, 130, 246, 0.1); }
                                        .rbc-event { background-color: var(--secondary); border: none; }
                                    `}</style>
                                    <Calendar
                                        localizer={localizer}
                                        events={formadorEvents}
                                        startAccessor="start"
                                        endAccessor="end"
                                        culture='pt'
                                        defaultView='week'
                                        messages={{
                                            next: "Seg.", previous: "Ant.", today: "Hoje",
                                            month: "Mês", week: "Sem.", day: "Dia"
                                        }}
                                    />
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Modal
                {...modalConfig}
                onClose={() => setModalConfig({ isOpen: false })}
            />
        </>
    );
}

export default FormadoresPage;
