import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 5000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const icons = {
        success: <CheckCircle size={20} color="#10b981" />,
        error: <AlertCircle size={20} color="#f87171" />,
        info: <Info size={20} color="var(--primary)" />
    };

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}
            <div style={{
                position: 'fixed', bottom: '2rem', right: '2rem',
                display: 'flex', flexDirection: 'column', gap: '0.75rem',
                zIndex: 10000, pointerEvents: 'none'
            }}>
                <AnimatePresence>
                    {toasts.map((t) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, x: 50, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.8 }}
                            style={{
                                background: 'rgba(15, 23, 42, 0.9)',
                                backdropFilter: 'blur(10px)',
                                border: `1px solid ${t.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : t.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)'}`,
                                borderRadius: '12px',
                                padding: '1rem 1.5rem',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
                                pointerEvents: 'auto',
                                minWidth: '300px'
                            }}
                        >
                            {icons[t.type]}
                            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{t.message}</span>
                            <button onClick={() => removeToast(t.id)} style={{
                                background: 'none', border: 'none', color: 'var(--text-muted)',
                                cursor: 'pointer', marginLeft: 'auto', display: 'flex'
                            }}>
                                <X size={16} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};
