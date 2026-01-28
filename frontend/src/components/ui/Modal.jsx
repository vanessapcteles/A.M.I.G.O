import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, type = 'info', confirmText = 'Confirmar', cancelText = 'Cancelar', onConfirm, loading = false }) => {
    if (!isOpen) return null;

    const icons = {
        info: <Info size={24} color="var(--primary)" />,
        warning: <AlertTriangle size={24} color="#facc15" />,
        danger: <AlertTriangle size={24} color="#f87171" />,
        success: <CheckCircle size={24} color="#10b981" />
    };

    return (
        <AnimatePresence>
            <div className="modal-overlay" style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
            }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="glass-card"
                    style={{
                        width: '90%', maxWidth: '450px', padding: '2rem',
                        position: 'relative', border: '1px solid var(--border-glass)'
                    }}
                >
                    <button onClick={onClose} style={{
                        position: 'absolute', top: '1rem', right: '1rem',
                        background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                    }}>
                        <X size={20} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{
                            padding: '0.75rem', borderRadius: '12px',
                            background: 'rgba(255,255,255,0.05)', display: 'flex'
                        }}>
                            {icons[type]}
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{title}</h3>
                    </div>

                    <div style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
                        {children}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button className="btn-glass" onClick={onClose} style={{ padding: '0.6rem 1.2rem' }}>
                            {cancelText}
                        </button>
                        <button
                            className={`btn-primary ${type === 'danger' ? 'bg-danger' : ''}`}
                            onClick={onConfirm}
                            disabled={loading}
                            style={{
                                padding: '0.6rem 1.2rem',
                                background: type === 'danger' ? 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)' : '',
                                borderColor: type === 'danger' ? '#ef4444' : ''
                            }}
                        >
                            {loading ? 'A processar...' : confirmText}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default Modal;
