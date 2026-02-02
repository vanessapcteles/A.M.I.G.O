import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, User, Mail, Phone, MapPin, Calendar, Award } from 'lucide-react';
import { authService, API_URL } from '../services/authService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function FormandoFichaPage() {
    const [user, setUser] = useState(authService.getCurrentUser());
    const [extra, setExtra] = useState(null);
    const [academicRecords, setAcademicRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [profilePhoto, setProfilePhoto] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const headers = { 'Authorization': `Bearer ${token}` };

                // Perfil
                const res = await fetch(`${API_URL}/api/formandos/${user.id}/profile`, { headers });
                const data = await res.json();
                setExtra(data);

                // Histórico Académico
                const academicRes = await fetch(`${API_URL}/api/formandos/${user.id}/academic`, { headers });
                const academicData = await academicRes.json();
                setAcademicRecords(academicData || []);

                // Carregar Foto
                try {
                    const photoRes = await fetch(`${API_URL}/api/files/user/${user.id}/photo`, { headers });
                    if (photoRes.ok) {
                        const blob = await photoRes.blob();
                        const base64 = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.readAsDataURL(blob);
                        });
                        setProfilePhoto(base64);
                    }
                } catch (e) { console.log('Erro ao carregar foto', e); }

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user.id]);

    const exportPDF = async () => {
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

        // Usar a foto já carregada em memória
        let photoData = profilePhoto;

        // Dados Pessoais
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Dados Pessoais', 15, 55);
        doc.line(15, 58, 60, 58);

        // Inserir Foto se existir
        if (photoData) {
            try {
                doc.addImage(photoData, 'JPEG', pageWidth - 55, 50, 40, 40);
                doc.setDrawColor(56, 189, 248);
                doc.rect(pageWidth - 56, 49, 42, 42); // Moldura
            } catch (e) { console.warn('Erro ao inserir imagem no PDF', e); }
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nome: ${user.nome_completo}`, 15, 68);
        doc.text(`Email: ${user.email}`, 15, 75);
        doc.text(`Curso Atual: ${extra?.curso_atual || 'Não inscrito'}`, 15, 82);
        doc.text(`Telemóvel: ${extra?.telemovel || 'N/A'}`, 15, 89);
        doc.text(`Morada: ${extra?.morada || 'N/A'}`, 15, 96);
        doc.text(`Data de Nascimento: ${extra?.data_nascimento ? new Date(extra.data_nascimento).toLocaleDateString() : 'N/A'}`, 15, 103);

        // Academic History
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Histórico Escolar', 15, 120);
        doc.line(15, 123, 60, 123);

        const tableRows = academicRecords.map(rec => [
            rec.nome_curso,
            rec.codigo_turma,
            `${new Date(rec.data_inicio).getFullYear()}/${new Date(rec.data_fim).getFullYear()}`,
            rec.nota_final ? `${rec.nota_final} val` : 'Em curso'
        ]);

        autoTable(doc, {
            startY: 125,
            head: [['Curso', 'Turma', 'Ano Letivo', 'Nota/Estado']],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [56, 189, 248] }
        });

        // Footer
        const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 250) + 20;
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text('Este documento é um comprovativo interno da academia.', pageWidth / 2, Math.min(finalY, 285), { align: 'center' });

        doc.save(`Ficha_Formando_${user.nome_completo.replace(/ /g, '_')}.pdf`);
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100dvh' }}>
            <div className="loader"></div>
        </div>
    );

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Minha Ficha de Formando</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Visualize e exporte os seus dados e histórico escolar.</p>
                </div>
                <button onClick={exportPDF} className="btn-primary" style={{ gap: '0.75rem' }}>
                    <Download size={20} /> Exportar PDF
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Visual Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
                        <div style={{
                            width: '120px', height: '120px', borderRadius: '60px', background: 'rgba(56, 189, 248, 0.1)',
                            margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px solid var(--border-glass)', overflow: 'hidden'
                        }}>
                            {profilePhoto ? (
                                <img src={profilePhoto} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <User size={60} color="var(--primary)" />
                            )}
                        </div>
                        <h3 style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{user.nome_completo}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nº de Formando: 2026_{user.id}</p>
                    </div>

                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Estatísticas</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Média Global</span>
                                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>16.2</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Faltas</span>
                                <span style={{ fontWeight: 'bold', color: '#f87171' }}>2h</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details Tab */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-card">
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <FileText size={20} color="var(--primary)" /> Dados Cadastrais
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <Mail size={18} color="var(--text-muted)" />
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email</p>
                                    <p style={{ fontSize: '0.9rem' }}>{user.email}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <Phone size={18} color="var(--text-muted)" />
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Telemóvel</p>
                                    <p style={{ fontSize: '0.9rem' }}>{extra?.telemovel || 'Não definido'}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <MapPin size={18} color="var(--text-muted)" />
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Morada</p>
                                    <p style={{ fontSize: '0.9rem' }}>{extra?.morada || 'Não definido'}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <Calendar size={18} color="var(--text-muted)" />
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Data Nasc.</p>
                                    <p style={{ fontSize: '0.9rem' }}>{extra?.data_nascimento ? new Date(extra.data_nascimento).toLocaleDateString() : 'Não definido'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card">
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Award size={20} color="#fbbf24" /> Histórico de Cursos
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {academicRecords.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Sem histórico registado.</p>}
                            {academicRecords.map((rec, i) => (
                                <div key={i} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontWeight: 'bold' }}>{rec.nome_curso}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Turma: {rec.codigo_turma}</p>
                                    </div>
                                    <span style={{ color: rec.nota_final ? '#10b981' : 'var(--primary)', fontWeight: 'bold' }}>
                                        {rec.nota_final ? `${rec.nota_final} val` : 'Em curso'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FormandoFichaPage;
