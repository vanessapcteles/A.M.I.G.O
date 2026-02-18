import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, User, Mail, Phone, MapPin, Briefcase, BookOpen } from 'lucide-react';
import { authService, API_URL } from '../services/authService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function FormadorFichaPage() {
    const [user, setUser] = useState(authService.getCurrentUser());
    const [extra, setExtra] = useState(null);
    const [teachingHistory, setTeachingHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [logoBase64, setLogoBase64] = useState(null);

    useEffect(() => {
        // Carregar Logo do projeto 
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const headers = { 'Authorization': `Bearer ${token}` };

                // Perfil
                const res = await fetch(`${API_URL}/api/formadores/${user.id}/profile`, { headers });
                const data = await res.json();
                setExtra(data);

                // Histórico de Lecionação
                const historyRes = await fetch(`${API_URL}/api/formadores/${user.id}/history`, { headers });
                const historyData = await historyRes.json();
                setTeachingHistory(historyData || []);

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
        const pageHeight = doc.internal.pageSize.getHeight();

        // --- HEADER ---
        doc.setFillColor(15, 23, 42); // Slate-900 (Dark)
        doc.rect(0, 0, pageWidth, 50, 'F');

        // Logo
        if (logoBase64) {
            try {
                doc.addImage(logoBase64, 'PNG', 15, 10, 30, 30);
            } catch (e) { console.warn('Erro logo PDF', e); }
        }

        // Títulos
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.text('FICHA DO FORMADOR', 55, 25);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(99, 102, 241); // Indigo-400 (Accent)
        doc.text('ACADEMY MANAGEMENT INTERACTIVE GUIDE & ORGANIZER', 55, 32);

        // Data
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.setFontSize(9);
        doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, pageWidth - 15, 45, { align: 'right' });


        // DADOS DO FORMADOR
        let currentY = 70;

        // Foto (Direita)
        if (profilePhoto) {
            try {
                doc.addImage(profilePhoto, 'JPEG', pageWidth - 50, currentY, 30, 30);
                doc.setDrawColor(99, 102, 241);
                doc.setLineWidth(0.5);
                doc.rect(pageWidth - 50, currentY, 30, 30);
            } catch (e) { console.warn('Erro ao inserir imagem no PDF', e); }
        } else {
            doc.setFillColor(241, 245, 249);
            doc.rect(pageWidth - 50, currentY, 30, 30, 'F');
            doc.setTextColor(150);
            doc.setFontSize(8);
            doc.text('Sem Foto', pageWidth - 35, currentY + 15, { align: 'center' });
        }


        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text('Dados do Formador', 15, currentY);
        doc.setDrawColor(99, 102, 241);
        doc.setLineWidth(1);
        doc.line(15, currentY + 2, 70, currentY + 2);

        currentY += 15;
        doc.setFontSize(11);

        const labelX = 15;
        const valueX = 60;
        const lineHeight = 8;

        const addField = (label, value) => {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 116, 139);
            doc.text(label, labelX, currentY);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 41, 59);
            doc.text(value || 'N/A', valueX, currentY);
            currentY += lineHeight;
        };

        addField('Nome:', user.nome_completo);
        addField('Email:', user.email);
        addField('Especialidade:', extra?.especialidade || 'Geral');
        addField('Telemóvel:', extra?.telemovel);
        addField('Departamento:', 'Tecnologias de Informação');


        // HISTÓRICO LECIONAÇÃO
        currentY += 15;
        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text('Módulos Lecionados', 15, currentY);
        doc.setDrawColor(99, 102, 241);
        doc.line(15, currentY + 2, 70, currentY + 2);
        currentY += 10;

        const tableRows = teachingHistory.map(rec => [
            rec.nome_modulo,
            rec.nome_curso,
            rec.codigo_turma,
            new Date(rec.data_inicio).toLocaleDateString()
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['MÓDULO', 'CURSO', 'TURMA', 'DATA INÍCIO']],
            body: tableRows,
            theme: 'grid',
            headStyles: {
                fillColor: [15, 23, 42],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center'
            },
            styles: { font: 'helvetica', fontSize: 10, cellPadding: 6 },
            columnStyles: { 0: { fontStyle: 'bold' } },
            alternateRowStyles: { fillColor: [241, 245, 249] }
        });

        // FOOTER
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setDrawColor(226, 232, 240);
            doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text('A.M.I.G.O System - Ficha de Formador', 15, pageHeight - 12);
            doc.text(`Página ${i} de ${pageCount}`, pageWidth - 15, pageHeight - 12, { align: 'right' });
        }

        doc.save(`Ficha_Formador_${user.nome_completo.replace(/ /g, '_')}.pdf`);
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
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Minha Ficha de Formador</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Visualize seu currículo e atividades lecionadas.</p>
                </div>
                <button onClick={exportPDF} className="btn-primary" style={{ gap: '0.75rem', backgroundColor: 'var(--secondary)' }}>
                    <Download size={20} /> Exportar Ficha
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
                        <div style={{
                            width: '120px', height: '120px', borderRadius: '60px', background: 'rgba(99, 102, 241, 0.1)',
                            margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px solid var(--border-glass)', overflow: 'hidden'
                        }}>
                            {profilePhoto ? (
                                <img src={profilePhoto} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <User size={60} color="var(--secondary)" />
                            )}
                        </div>
                        <h3 style={{ fontWeight: 'bold' }}>{user.nome_completo}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Especialista Senior</p>
                    </div>

                    <div className="glass-card">
                        <h4 style={{ marginBottom: '1rem' }}>Resumo</h4>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{teachingHistory.length} Módulos</div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lecionados no sistema</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-card">
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Briefcase size={20} color="var(--secondary)" /> Informação Profissional
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Institucional</p>
                                <p style={{ fontSize: '0.9rem' }}>{user.email}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Especialidade</p>
                                <p style={{ fontSize: '0.9rem' }}>Informática / Desenvolvimento</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Departamento</p>
                                <p style={{ fontSize: '0.9rem' }}>Tecnologias de Informação</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Telefone</p>
                                <p style={{ fontSize: '0.9rem' }}>{extra?.telemovel || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card">
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <BookOpen size={20} color="var(--secondary)" /> Módulos Atribuídos
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {teachingHistory.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Sem módulos registados.</p>}
                            {teachingHistory.map((rec, i) => (
                                <div key={i} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontWeight: 'bold' }}>{rec.nome_modulo}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rec.nome_curso}</p>
                                    </div>
                                    <span style={{ color: 'var(--secondary)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                        {rec.codigo_turma}
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

export default FormadorFichaPage;
