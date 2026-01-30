import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, User, Mail, Phone, MapPin, Calendar, Award } from 'lucide-react';
import { authService, API_URL } from '../services/authService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function FormandoFichaPage() {
    const [user, setUser] = useState(authService.getCurrentUser());
    const [extra, setExtra] = useState(null);
    const [academicRecords, setAcademicRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('auth_token');

                // Perfil
                const res = await fetch(`${API_URL}/api/formandos/${user.id}/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setExtra(data);

                // Histórico Académico
                const academicRes = await fetch(`${API_URL}/api/formandos/${user.id}/academic`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const academicData = await academicRes.json();
                setAcademicRecords(academicData || []);

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user.id]);

    const exportPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('FICHA DO FORMANDO', pageWidth / 2, 25, { align: 'center' });

        // Personal Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Informação Pessoal', 20, 55);

        const personalData = [
            ['Nome Completo', user.nome_completo],
            ['Email', user.email],
            ['Curso Atual', extra?.curso_atual || 'Não inscrito'],
            ['Telemóvel', extra?.telemovel || 'N/A'],
            ['Morada', extra?.morada || 'N/A'],
            ['Data Nascimento', extra?.data_nascimento ? new Date(extra.data_nascimento).toLocaleDateString() : 'N/A']
        ];

        doc.autoTable({
            startY: 65,
            head: [['Campo', 'Valor']],
            body: personalData,
            theme: 'striped',
            headStyles: { fillColor: [30, 41, 59] }
        });

        // Academic History
        const tableY = (doc.previousAutoTable ? doc.previousAutoTable.finalY : 120) + 15;
        doc.setFontSize(16);
        doc.text('Cursos e Avaliações', 20, tableY);

        const tableRows = academicRecords.map(rec => [
            rec.nome_curso,
            rec.codigo_turma,
            `${new Date(rec.data_inicio).getFullYear()}/${new Date(rec.data_fim).getFullYear()}`,
            rec.nota_final ? `${rec.nota_final} val` : 'Em curso'
        ]);

        doc.autoTable({
            startY: tableY + 10,
            head: [['Curso', 'Turma', 'Ano Letivo', 'Nota/Estado']],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [56, 189, 248] }
        });

        // Footer
        const finalY = (doc.previousAutoTable ? doc.previousAutoTable.finalY : 250) + 20;
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(`Gerado em: ${new Date().toLocaleDateString()} - Academy Manager System`, pageWidth / 2, Math.min(finalY, 285), { align: 'center' });

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
                            border: '2px solid var(--border-glass)'
                        }}>
                            {extra?.foto_url ? (
                                <img src={extra.foto_url} alt="Foto" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
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
