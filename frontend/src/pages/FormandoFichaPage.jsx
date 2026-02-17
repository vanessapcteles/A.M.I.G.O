import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Download, User, Mail, Phone, MapPin, Calendar, Award } from 'lucide-react';
import { authService, API_URL } from '../services/authService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function FormandoFichaPage() {
    const { id } = useParams(); // ID do utilizador vindo da URL (opcional)
    const currentUser = authService.getCurrentUser();

    // Se houver ID na URL, usa esse. Senão, usa o do utilizador logado.
    const targetUserId = id || currentUser.id;

    const [user, setUser] = useState(currentUser); // Começa com o logado, mas será atualizado
    const [extra, setExtra] = useState(null);
    const [academicRecords, setAcademicRecords] = useState([]);
    const [detailedGrades, setDetailedGrades] = useState({ grades: [] });
    const [loading, setLoading] = useState(true);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [logoBase64, setLogoBase64] = useState(null);



    useEffect(() => {
        // Carregar Logo do projeto para Base64
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

        const fetchData = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const headers = { 'Authorization': `Bearer ${token}` };

                // Perfil (Traz nome, email, telemovel, etc.)
                const res = await fetch(`${API_URL}/api/formandos/${targetUserId}/profile`, { headers });

                if (res.ok) {
                    const data = await res.json();
                    setExtra(data);

                    // Se estivermos a ver outro utilizador, atualizamos o objeto 'user' para ter os dados corretos
                    if (id && data.nome_completo) {
                        setUser({
                            id: targetUserId,
                            nome_completo: data.nome_completo,
                            email: data.email,
                            role: 'FORMANDO' // Assumimos que é formando ao ver esta página
                        });
                    }
                }

                // Histórico Académico
                const academicRes = await fetch(`${API_URL}/api/formandos/${targetUserId}/academic`, { headers });
                const academicData = await academicRes.json();
                setAcademicRecords(academicData || []);

                // Avaliações Detalhadas
                const gradesRes = await fetch(`${API_URL}/api/formandos/${targetUserId}/grades`, { headers });
                const gradesData = await gradesRes.json();
                setDetailedGrades(gradesData || { grades: [] });

                // Carregar Foto
                try {
                    const photoRes = await fetch(`${API_URL}/api/files/user/${targetUserId}/photo`, { headers });
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
    }, [targetUserId]);

    const exportPDF = async () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // --- HEADER ---
        // Fundo Escuro Moderno (Gradient simulated with rects or just solid dark blue)
        doc.setFillColor(15, 23, 42); // Slate-900 (Dark Blue)
        doc.rect(0, 0, pageWidth, 50, 'F');

        // Logo
        if (logoBase64) {
            try {
                doc.addImage(logoBase64, 'PNG', 15, 10, 30, 30); // Logo à esquerda
            } catch (e) { console.warn('Erro logo PDF', e); }
        }

        // Título e Subtítulo
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.text('FICHA DO FORMANDO', 55, 25);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(56, 189, 248); // Sky-400 (Light Blue Accent)
        doc.text('ACADEMY MANAGEMENT INTERACTIVE GUIDE & ORGANIZER', 55, 32);

        // Data de Geração
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.setFontSize(9);
        doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, pageWidth - 15, 45, { align: 'right' });


        // --- DADOS PESSOAIS ---
        let currentY = 70;

        // Foto de Perfil (Direita)
        if (profilePhoto) {
            try {
                // Foto
                doc.addImage(profilePhoto, 'JPEG', pageWidth - 50, currentY, 30, 30);

                // Moldura
                doc.setDrawColor(56, 189, 248);
                doc.setLineWidth(0.5);
                doc.rect(pageWidth - 50, currentY, 30, 30);
            } catch (e) { console.warn('Erro foto PDF', e); }
        } else {
            // Placeholder se não houver foto
            doc.setFillColor(241, 245, 249);
            doc.rect(pageWidth - 50, currentY, 30, 30, 'F');
            doc.setTextColor(150);
            doc.setFontSize(8);
            doc.text('Sem Foto', pageWidth - 35, currentY + 15, { align: 'center' });
        }

        // Dados Pessoais (Título) starts at same Y
        // Ajustar Y não é necessário somar photoSize pois a foto está ao lado

        // Título Secção
        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42); // Dark Text
        doc.setFont('helvetica', 'bold');
        doc.text('Dados Pessoais', 15, currentY);

        // Linha debaixo do título
        doc.setDrawColor(56, 189, 248); // Accent Color
        doc.setLineWidth(1);
        doc.line(15, currentY + 2, 60, currentY + 2);

        // Grid de Dados
        currentY += 15;
        doc.setFontSize(11);

        const labelX = 15;
        const valueX = 60;
        const lineHeight = 8;

        const addField = (label, value) => {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 116, 139); // Slate-500 (Label)
            doc.text(label, labelX, currentY);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 41, 59); // Slate-800 (Value)
            doc.text(value || 'N/A', valueX, currentY);
            currentY += lineHeight;
        };

        addField('Nome Completo:', user.nome_completo);
        addField('Email:', user.email);
        addField('Curso Atual:', extra?.curso_atual);
        addField('Telemóvel:', extra?.telemovel);
        addField('Morada:', extra?.morada);
        addField('Nascimento:', extra?.data_nascimento ? new Date(extra.data_nascimento).toLocaleDateString() : 'N/A');


        // --- HISTÓRICO ESCOLAR ---
        currentY += 15;
        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text('Histórico Escolar', 15, currentY);
        doc.setDrawColor(56, 189, 248);
        doc.line(15, currentY + 2, 60, currentY + 2);
        currentY += 10;

        const tableRows = academicRecords.map(rec => [
            rec.nome_curso,
            rec.codigo_turma,
            `${new Date(rec.data_inicio).getFullYear()}/${new Date(rec.data_fim).getFullYear()}`,
            rec.nota_final ? `${rec.nota_final} val` : 'Em curso'
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['CURSO', 'TURMA', 'ANO LETIVO', 'ESTADO/NOTA']],
            body: tableRows,
            theme: 'grid',
            headStyles: {
                fillColor: [15, 23, 42], // Header Dark Header
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center'
            },
            styles: {
                font: 'helvetica',
                fontSize: 10,
                cellPadding: 6,
                overflow: 'linebreak'
            },
            columnStyles: {
                3: { halign: 'center', fontStyle: 'bold' }
            },
            alternateRowStyles: {
                fillColor: [241, 245, 249] // Light Gray alternating
            }
        });


        // --- AVALIAÇÕES DETALHADAS ---
        if (detailedGrades.grades && detailedGrades.grades.length > 0) {
            let finalY = doc.lastAutoTable.finalY + 20;

            // Check page break
            if (finalY > pageHeight - 50) {
                doc.addPage();
                finalY = 30;
            }

            doc.setFontSize(16);
            doc.setTextColor(15, 23, 42);
            doc.setFont('helvetica', 'bold');
            doc.text(`Avaliações: ${detailedGrades.curso} (${detailedGrades.turma})`, 15, finalY);
            doc.setDrawColor(56, 189, 248);
            doc.line(15, finalY + 2, 100, finalY + 2);

            const gradesRows = detailedGrades.grades.map(g => [
                g.nome_modulo,
                `${g.carga_horaria}h`,
                g.nota ? `${g.nota} val` : '-',
                g.data_avaliacao ? new Date(g.data_avaliacao).toLocaleDateString() : '-'
            ]);

            autoTable(doc, {
                startY: finalY + 10,
                head: [['MÓDULO', 'CARGA', 'NOTA', 'DATA AVALIAÇÃO']],
                body: gradesRows,
                theme: 'grid',
                headStyles: {
                    fillColor: [56, 189, 248], // Light Blue Header for details
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                styles: {
                    fontSize: 9,
                    cellPadding: 4
                },
                columnStyles: {
                    2: { halign: 'center', fontStyle: 'bold', textColor: [22, 163, 74] } // Green text for grades
                }
            });
        }

        // --- FOOTER ---
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);

            // Footer Background Line
            doc.setDrawColor(226, 232, 240);
            doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);

            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184); // Slate-400

            // Texto Footer
            doc.text('A.M.I.G.O - Academy Management Interactive Guide & Organizer', 15, pageHeight - 12);
            doc.text(`Página ${i} de ${pageCount}`, pageWidth - 15, pageHeight - 12, { align: 'right' });
        }

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
                                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                                    {detailedGrades.grades && detailedGrades.grades.filter(g => g.nota).length > 0
                                        ? (detailedGrades.grades.filter(g => g.nota).reduce((acc, curr) => acc + parseFloat(curr.nota), 0) / detailedGrades.grades.filter(g => g.nota).length).toFixed(1)
                                        : '0.0'
                                    } med.
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Faltas</span>
                                <span style={{ fontWeight: 'bold', color: '#10b981' }}>0h</span>
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

                    {detailedGrades.grades && detailedGrades.grades.length > 0 && (
                        <div className="glass-card">
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FileText size={20} color="#818cf8" /> Avaliações Detalhadas
                            </h3>
                            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                {detailedGrades.jsData ? '' : `${detailedGrades.curso} (${detailedGrades.turma})`}
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {detailedGrades.grades.map((g, i) => (
                                    <div key={i} style={{
                                        padding: '0.75rem',
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        borderLeft: g.nota ? '3px solid #10b981' : '3px solid var(--text-muted)'
                                    }}>
                                        <div>
                                            <p style={{ fontSize: '0.95rem' }}>{g.nome_modulo}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{g.carga_horaria}h • {g.data_avaliacao ? new Date(g.data_avaliacao).toLocaleDateString() : 'A aguardar'}</p>
                                        </div>
                                        <span style={{ fontWeight: 'bold', color: g.nota ? '#10b981' : 'var(--text-muted)' }}>
                                            {g.nota ? `${g.nota} val` : '-'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FormandoFichaPage;
