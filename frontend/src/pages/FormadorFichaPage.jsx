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

        // Header Premium
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('FICHA DO FORMADOR', 15, 25);

        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, pageWidth - 15, 25, { align: 'right' });

        // Usar a foto
        let photoData = profilePhoto;

        // Dados do Formador
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Dados do Formador', 15, 55);
        doc.line(15, 58, 60, 58);

        // Inserir Foto se existir
        if (photoData) {
            try {
                doc.addImage(photoData, 'JPEG', pageWidth - 55, 50, 40, 40);
                doc.setDrawColor(99, 102, 241); // Indigo color for Trainer
                doc.rect(pageWidth - 56, 49, 42, 42); // Moldura
            } catch (e) { console.warn('Erro ao inserir imagem no PDF', e); }
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nome: ${user.nome_completo}`, 15, 68);
        doc.text(`Email: ${user.email}`, 15, 75);
        doc.text(`Especialidade: ${extra?.especialidade || 'Informática'}`, 15, 82);
        doc.text(`Telemóvel: ${extra?.telemovel || 'N/A'}`, 15, 89);

        // Teaching History
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Módulos Lecionados', 15, 110);
        doc.line(15, 113, 60, 113);

        const tableRows = teachingHistory.map(rec => [
            rec.nome_modulo,
            rec.nome_curso,
            rec.codigo_turma,
            new Date(rec.data_inicio).toLocaleDateString()
        ]);

        autoTable(doc, {
            startY: 115,
            head: [['Módulo', 'Curso', 'Turma', 'Data Início']],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241] }
        });

        // Footer
        const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 250) + 20;
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text(`Academy Manager System - Ficha Gerada em ${new Date().toLocaleDateString()}`, pageWidth / 2, Math.min(finalY, 285), { align: 'center' });

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
