import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { authService, API_URL } from '../services/authService';
import { Upload, CheckCircle, ChevronRight, User, Phone, MapPin, AlertCircle, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Modal from '../components/ui/Modal';

const CandidacyPage = () => {
    const [modalConfig, setModalConfig] = useState({ isOpen: false });
    const location = useLocation();
    const [user, setUser] = useState(authService.getCurrentUser());
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [courseOfInterest, setCourseOfInterest] = useState(null);
    const [errors, setErrors] = useState({});
    const [candidacyStatus, setCandidacyStatus] = useState(null);
    const [existingCandidacy, setExistingCandidacy] = useState(null);

    // Form Data
    const [formData, setFormData] = useState({
        nome_completo: user?.nome_completo || '',
        morada: '',
        telemovel: '',
        data_nascimento: ''
    });

    useEffect(() => {
        // Se vier do "Quero me candidatar", traz o ID do curso
        if (location.state?.interestedIn) {
            setCourseOfInterest(location.state.interestedIn);
        }
        checkExistingCandidacy();
    }, [location]);

    const checkExistingCandidacy = async () => {
        try {
            const res = await fetch(`${API_URL}/api/candidatos/me`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
            });
            const data = await res.json();
            if (data && data.id) {
                // User already has a candidacy -> Show Status Code
                setExistingCandidacy(data);
                setFormData(data.dados_candidatura || {});
                setCandidacyStatus(data.estado);
                // Ensure we know the course so Step 1 shows the form instead of "Welcome"
                setCourseOfInterest(data.id_curso);
                setStep(3); // Status View
            }
        } catch (error) {
            console.error("Erro ao verificar candidatura:", error);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // 1. Name Check (at least 2 words)
        // Check formData.nome_completo instead of user.nome_completo
        if (!formData.nome_completo || formData.nome_completo.trim().split(/\s+/).length < 2) {
            newErrors.nome_completo = 'O nome de perfil deve ter pelo menos Primeiro e Último nome.';
        }

        // 2. Address Check
        if (!formData.morada || formData.morada.trim().length < 5) {
            newErrors.morada = 'Por favor, insira uma morada válida.';
        }

        // 3. Date of Birth Check
        if (!formData.data_nascimento) {
            newErrors.data_nascimento = 'A data de nascimento é obrigatória.';
        }

        // 4. Phone Check (9 digits)
        const phoneRegex = /^\d{9}$/;
        if (!phoneRegex.test(formData.telemovel)) {
            newErrors.telemovel = 'O telemóvel deve ter exatamente 9 dígitos.';
        }

        // 5. Photo Check
        if (!profilePhoto) {
            newErrors.foto = 'A foto de perfil é obrigatória.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const onNextStep = () => {
        if (validateForm()) {
            setStep(2);
        }
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePhoto(reader.result);
                if (errors.foto) setErrors(prev => ({ ...prev, foto: null }));
            };
            reader.readAsDataURL(file);
        }
    };

    const generateAndUploadPDF = async () => {
        const doc = new jsPDF();

        // Cabeçalho
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text('Ficha de Candidatura', 15, 25);
        doc.setFontSize(10);
        doc.text(`Emitido a: ${new Date().toLocaleDateString()}`, 195, 25, { align: 'right' });

        // Foto e Dados
        doc.setTextColor(30, 41, 59);
        if (profilePhoto) {
            try {
                doc.addImage(profilePhoto, 'JPEG', 15, 50, 40, 40);
            } catch (e) {
                console.warn('Erro ao inserir foto no PDF', e);
            }
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Dados Pessoais', 70, 55);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nome: ${formData.nome_completo}`, 70, 65);
        doc.text(`Email: ${user.email}`, 70, 72);
        doc.text(`Telemóvel: ${formData.telemovel}`, 70, 79);
        doc.text(`Data Nascimento: ${formData.data_nascimento}`, 70, 86);
        doc.text(`Morada: ${formData.morada}`, 70, 93);

        const pdfBlob = doc.output('blob');
        const pdfFile = new File([pdfBlob], `Candidatura_${formData.nome_completo.replace(/\s+/g, '_')}.pdf`, { type: 'application/pdf' });

        const uploadData = new FormData();
        uploadData.append('file', pdfFile);
        uploadData.append('categoria', 'documento');

        const uploadRes = await fetch(`${API_URL}/api/files/user/${user.id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
            body: uploadData
        });

        if (!uploadRes.ok) {
            const errorText = await uploadRes.text();
            throw new Error(`Erro no upload do PDF: ${uploadRes.status} - ${errorText}`);
        }
        const result = await uploadRes.json();
        console.log('Resultado do upload do PDF:', result);
        return result.id || result.insertId;
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // 1. Upload da Foto (se existir)
            if (photoFile) {
                const photoData = new FormData();
                photoData.append('file', photoFile);
                photoData.append('categoria', 'foto');
                const photoRes = await fetch(`${API_URL}/api/files/user/${user.id}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
                    body: photoData
                });
                if (!photoRes.ok) throw new Error('Erro ao carregar foto de perfil.');
            }

            // 2. Gerar e Upload PDF
            const pdfId = await generateAndUploadPDF();
            if (!pdfId) throw new Error('Erro ao gerar ID do PDF.');

            // 3. Submeter Candidatura
            const submitRes = await fetch(`${API_URL}/api/candidatos/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({
                    curso_id: courseOfInterest || 1,
                    dados_candidatura: formData,
                    pdf_file_id: pdfId
                })
            });

            if (submitRes.ok) {
                await checkExistingCandidacy();
                setStep(3);
            } else {
                const err = await submitRes.json();
                throw new Error(err.message || 'Erro ao submeter candidatura no servidor.');
            }
        } catch (error) {
            console.error(error);
            setModalConfig({
                isOpen: true,
                title: 'Erro na Candidatura',
                type: 'danger',
                children: error.message || 'Ocorreu um erro ao processar a sua candidatura. Por favor, tente novamente.',
                confirmText: 'Entendido',
                onConfirm: () => setModalConfig({ isOpen: false })
            });
        } finally {
            setLoading(false);
        }
    };

    const renderStatusContent = () => {
        if (candidacyStatus === 'REJEITADO') {
            return (
                <>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <AlertCircle size={40} />
                    </div>
                    <h3 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', fontFamily: 'var(--font-title)' }}>Candidatura Não Aceite</h3>
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', maxWidth: '450px' }}>
                        <p style={{ color: '#f87171', fontWeight: 'bold', marginBottom: '0.5rem' }}>Dados Incorretos</p>
                        <p style={{ color: '#fecaca', fontSize: '0.9rem' }}>
                            A sua candidatura foi rejeitada devido a inconsistências nos dados fornecidos.
                            Por favor, verifique as informações e tente novamente ou contacte a secretaria.
                        </p>
                    </div>
                    <button className="btn-primary" onClick={() => setStep(1)}>
                        Corrigir Dados e Reenviar
                    </button>
                </>
            );
        }

        if (candidacyStatus === 'APROVADO') {
            return (
                <>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <CheckCircle size={40} />
                    </div>
                    <h3 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', fontFamily: 'var(--font-title)' }}>Candidatura Aprovada!</h3>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '2rem', lineHeight: '1.6' }}>
                        Parabéns! A sua candidatura para o curso <strong>{existingCandidacy?.nome_curso}</strong> foi validada pela secretaria.
                        Brevemente receberá mais informações sobre a matrícula.
                    </p>
                </>
            );
        }

        // Default: PENDENTE or newly submitted
        return (
            <>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(234, 179, 8, 0.2)', color: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <CheckCircle size={40} />
                </div>
                <h3 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', fontFamily: 'var(--font-title)' }}>Candidatura em Análise</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '2rem', lineHeight: '1.6' }}>
                    Os seus dados para o curso <strong>{existingCandidacy?.nome_curso}</strong> foram enviados com sucesso.
                    A secretaria irá analisar a sua candidatura e notificá-lo brevemente.
                </p>
                <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border-glass)' }} onClick={() => { authService.logout(); window.location.href = '/'; }}>
                    Sair e Voltar ao Início
                </button>
            </>
        );
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-title)' }}>
            {!courseOfInterest && step === 1 ? (
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <h2>Bem-vindo à Área de Candidato</h2>
                    <p style={{ margin: '1rem 0' }}>Para formalizar uma candidatura, por favor consulte os nossos cursos.</p>
                    <a href="/courses" className="btn-primary" style={{ textDecoration: 'none' }}>Ver Cursos</a>
                </div>
            ) : (
                <div className="glass-card" style={{ width: '100%', maxWidth: '900px', margin: '2rem', padding: '0', display: 'grid', gridTemplateColumns: '300px 1fr', overflow: 'hidden', minHeight: '500px' }}>

                    {/* Sidebar com Steps */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRight: '1px solid var(--border-glass)', padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem', fontFamily: 'var(--font-title)' }}>Candidatura</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {[
                                { step: 1, label: 'Dados Pessoais', icon: User },
                                { step: 2, label: 'Documentos', icon: FileText },
                                { step: 3, label: 'Confirmação', icon: CheckCircle }
                            ].map((s) => (
                                <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: step >= s.step ? 1 : 0.4 }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '50%',
                                        background: step >= s.step ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 'bold', fontSize: '0.9rem',
                                        color: 'white'
                                    }}>
                                        <s.icon size={16} />
                                    </div>
                                    <span style={{ fontWeight: step === s.step ? '600' : '400', color: 'var(--text-primary)' }}>{s.label}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                            <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)', color: '#fbbf24', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                    <AlertCircle size={16} /> Nota
                                </div>
                                Preencha todos os dados corretamente. Eles serão usados para gerar a sua ficha de aluno.
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div style={{ padding: '3rem', position: 'relative' }}>
                        <AnimatePresence mode='wait'>
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                                >
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', fontFamily: 'var(--font-title)' }}>Complete o seu Perfil</h3>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Precisamos de alguns dados extra para formalizar a inscrição.</p>

                                    <div style={{ display: 'flex', gap: '2rem' }}>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            {/* Name Field */}
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Nome Completo</label>
                                                <div style={{ position: 'relative' }}>
                                                    <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                                    <input
                                                        className="input-field"
                                                        style={{ paddingLeft: '2.8rem', borderColor: errors.nome_completo ? '#ef4444' : 'rgba(255,255,255,0.1)' }}
                                                        placeholder="Primeiro e Último Nome"
                                                        value={formData.nome_completo}
                                                        onChange={e => {
                                                            setFormData({ ...formData, nome_completo: e.target.value });
                                                            if (errors.nome_completo) setErrors({ ...errors, nome_completo: null });
                                                        }}
                                                    />
                                                </div>
                                                {errors.nome_completo && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' }}>{errors.nome_completo}</span>}
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Morada Completa</label>
                                                <div style={{ position: 'relative' }}>
                                                    <MapPin size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                                    <input
                                                        className="input-field"
                                                        style={{ paddingLeft: '2.8rem', borderColor: errors.morada ? '#ef4444' : 'rgba(255,255,255,0.1)' }}
                                                        placeholder="Ex: Rua da Liberdade, nº 10, Lisboa"
                                                        value={formData.morada}
                                                        onChange={e => {
                                                            setFormData({ ...formData, morada: e.target.value });
                                                            if (errors.morada) setErrors({ ...errors, morada: null });
                                                        }}
                                                    />
                                                </div>
                                                {errors.morada && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' }}>{errors.morada}</span>}
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Telemóvel (9 Dígitos)</label>
                                                <div style={{ position: 'relative' }}>
                                                    <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                                    <input
                                                        className="input-field"
                                                        style={{ paddingLeft: '2.8rem', borderColor: errors.telemovel ? '#ef4444' : 'rgba(255,255,255,0.1)' }}
                                                        placeholder="9XX XXX XXX"
                                                        maxLength={9}
                                                        value={formData.telemovel}
                                                        onChange={e => {
                                                            setFormData({ ...formData, telemovel: e.target.value.replace(/\D/g, '') });
                                                            if (errors.telemovel) setErrors({ ...errors, telemovel: null });
                                                        }}
                                                    />
                                                </div>
                                                {errors.telemovel && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' }}>{errors.telemovel}</span>}
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Data de Nascimento</label>
                                                <input
                                                    type="date"
                                                    className="input-field"
                                                    style={{ borderColor: errors.data_nascimento ? '#ef4444' : 'rgba(255,255,255,0.1)' }}
                                                    value={formData.data_nascimento}
                                                    onChange={e => {
                                                        setFormData({ ...formData, data_nascimento: e.target.value });
                                                        if (errors.data_nascimento) setErrors({ ...errors, data_nascimento: null });
                                                    }}
                                                />
                                                {errors.data_nascimento && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' }}>{errors.data_nascimento}</span>}
                                            </div>
                                        </div>

                                        {/* Photo Upload */}
                                        <div style={{ width: '200px' }}>
                                            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Foto de Perfil</label>
                                            <label style={{
                                                width: '100%', aspectRatio: '1', borderRadius: '20px',
                                                border: `2px dashed ${errors.foto ? '#ef4444' : 'var(--border-glass)'}`,
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer', overflow: 'hidden', position: 'relative',
                                                background: 'rgba(255,255,255,0.02)'
                                            }}>
                                                {profilePhoto ? (
                                                    <img src={profilePhoto} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <>
                                                        <Upload size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Carregar Foto</span>
                                                    </>
                                                )}
                                                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                                            </label>
                                            {errors.foto && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block', textAlign: 'center' }}>{errors.foto}</span>}
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                                        <button
                                            className="btn-primary"
                                            onClick={onNextStep}
                                        >
                                            Seguinte <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                                >
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', fontFamily: 'var(--font-title)' }}>Rever e Submeter</h3>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Verifique se os seus dados estão corretos. Ao submeter, será gerada uma ficha oficial.</p>

                                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--border-glass)' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                            <div>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nome Completo</span>
                                                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{formData.nome_completo}</div>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email</span>
                                                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{user.email}</div>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Telemóvel</span>
                                                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{formData.telemovel}</div>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Morada</span>
                                                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{formData.morada}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between' }}>
                                        <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border-glass)' }} onClick={() => setStep(1)}>Voltar</button>
                                        <button
                                            className="btn-primary"
                                            style={{ minWidth: '180px' }}
                                            onClick={handleSubmit}
                                            disabled={loading}
                                        >
                                            {loading ? 'A processar...' : 'Submeter Candidatura'}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                    style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
                                >
                                    {renderStatusContent()}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            <Modal
                {...modalConfig}
                onClose={() => setModalConfig({ isOpen: false })}
            />
        </div>
    );
};

export default CandidacyPage;
