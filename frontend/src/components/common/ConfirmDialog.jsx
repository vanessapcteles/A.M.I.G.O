import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', isDestructive = false }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 10000, pointerEvents: 'none',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    paddingBottom: '2rem'
                }}>
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        style={{
                            background: 'var(--bg-main)', // Usar fundo do tema
                            border: '1px solid var(--border-glass)',
                            borderRadius: '16px',
                            padding: '1.5rem 2rem',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                            pointerEvents: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1rem',
                            minWidth: '350px',
                            maxWidth: '90%'
                        }}
                    >
                        {isDestructive && <AlertCircle size={32} color="#f87171" />}
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{title}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                {message}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '0.5rem' }}>
                            <button
                                onClick={onClose}
                                className="btn-glass"
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={() => { onConfirm(); onClose(); }}
                                className="btn-primary"
                                style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    background: isDestructive ? '#dc2626' : 'var(--primary)',
                                    borderColor: isDestructive ? '#dc2626' : 'var(--primary)'
                                }}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmDialog;
