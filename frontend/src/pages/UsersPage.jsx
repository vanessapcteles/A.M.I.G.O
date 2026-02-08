import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Search,
    Edit2,
    Trash2,
    Check,
    X,
    Save,
    UserCheck,
    UserX,
    Shield,
    GraduationCap,
    Presentation,
    Briefcase,
    UserCircle
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/common/ConfirmDialog';

function UsersPage() {
    const { toast } = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Edição
    const [editingUserId, setEditingUserId] = useState(null);
    const [editName, setEditName] = useState('');

    // Confirm Dialog State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await userService.getAllUsers();
            setUsers(data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
            if (err.message.includes('401') || err.message.includes('403')) {
                navigate('/login');
            }
        }
    };

    const handleRoleChange = async (id, newRole) => {
        try {
            await userService.updateUser(id, { tipo_utilizador: newRole });
            toast('Função atualizada!', 'success');

            // Se for o próprio utilizador, recarregar para atualizar a Sidebar/Header
            const currentUser = authService.getCurrentUser();
            if (currentUser && currentUser.id === id) {
                setTimeout(() => window.location.reload(), 1000);
            } else {
                loadUsers();
            }
        } catch (err) {
            toast('Erro ao atualizar: ' + err.message, 'error');
        }
    };

    const handleDelete = (id) => {
        setUserToDelete(id);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await userService.deleteUser(userToDelete);
            toast('Utilizador removido.', 'success');
            setUsers(users.filter(u => u.id !== userToDelete));
        } catch (err) {
            toast('Erro ao eliminar: ' + err.message, 'error');
        }
    };

    const startEditing = (user) => {
        setEditingUserId(user.id);
        setEditName(user.nome_completo || user.nome);
    };

    const cancelEditing = () => {
        setEditingUserId(null);
        setEditName('');
    };

    const saveUser = async (id) => {
        try {
            await userService.updateUser(id, { nome_completo: editName });
            toast('Nome atualizado!', 'success');
            setEditingUserId(null);

            // Se for o próprio utilizador, recarregar para atualizar a Sidebar/Header
            const currentUser = authService.getCurrentUser();
            if (currentUser && currentUser.id === id) {
                setTimeout(() => window.location.reload(), 1000);
            } else {
                loadUsers();
            }
        } catch (err) {
            toast('Erro ao atualizar: ' + err.message, 'error');
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'ADMIN': return <Shield size={16} />;
            case 'FORMADOR': return <Presentation size={16} />;
            case 'FORMANDO': return <GraduationCap size={16} />;
            case 'SECRETARIA': return <Briefcase size={16} />;
            default: return <UserCircle size={16} />;
        }
    };

    const filteredUsers = users.filter(user =>
    (user.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <>
            <div className="page-header-flex" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                gap: '1.5rem',
                flexWrap: 'wrap'
            }}>
                <style>
                    {`
                        @media (max-width: 1200px) {
                            .page-header-flex { flex-direction: column !important; align-items: flex-start !important; }
                            .users-header-actions { width: 100% !important; justify-content: space-between !important; }
                            .search-bar { flex: 1 !important; max-width: none !important; }
                        }
                        @media (max-width: 640px) {
                            .users-header-actions { flex-direction: column !important; gap: 1rem !important; }
                            .search-bar { width: 100% !important; }
                        }
                    `}
                </style>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="hidden-tablet" style={{
                        padding: '0.75rem',
                        borderRadius: '12px',
                        background: 'var(--primary-glow)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Users size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px', margin: 0 }}>Gestão de Utilizadores</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '2px 0 0 0' }}>{filteredUsers.length} utilizadores registados</p>
                    </div>
                </div>

                <div className="users-header-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div className="search-bar" style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '320px',
                        height: '40px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '10px',
                        padding: '0 0.85rem'
                    }}>
                        <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <input
                            type="text"
                            placeholder="Pesquisar por nome ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                width: '100%',
                                marginLeft: '0.5rem',
                                padding: 0,
                                height: '100%',
                                fontSize: '0.85rem'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            style={{ display: 'inline-block', marginBottom: '1rem' }}
                        >
                            <Users size={32} />
                        </motion.div>
                        <p>A carregar utilizadores...</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Utilizador</th>
                                    <th>Função</th>
                                    <th className="hidden-tablet">Estado</th>
                                    <th style={{ textAlign: 'right' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {filteredUsers.map((user) => (
                                        <motion.tr
                                            key={user.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            style={{ borderBottom: '1px solid var(--border-glass)' }}
                                        >
                                            <td style={{ padding: '1rem 1.5rem' }} data-label="Utilizador">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '10px',
                                                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        fontSize: '1.2rem'
                                                    }}>
                                                        {(user.nome_completo || user.nome || '?')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        {editingUserId === user.id ? (
                                                            <input
                                                                type="text"
                                                                className="input-field"
                                                                style={{ padding: '0.5rem', minWidth: '200px' }}
                                                                value={editName}
                                                                onChange={(e) => setEditName(e.target.value)}
                                                            />
                                                        ) : (
                                                            <div style={{ fontWeight: '600' }}>{user.nome_completo || user.nome}</div>
                                                        )}
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }} data-label="Função">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ color: 'var(--primary)' }}>{getRoleIcon(user.tipo_utilizador)}</span>
                                                    <select
                                                        value={user.tipo_utilizador}
                                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                        className="input-field"
                                                        style={{
                                                            padding: '0.25rem 0.5rem',
                                                            width: 'auto',
                                                            fontSize: '0.875rem',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <option value="CANDIDATO">Candidato</option>
                                                        <option value="FORMANDO">Formando</option>
                                                        <option value="FORMADOR">Formador</option>
                                                        <option value="SECRETARIA">Secretaria</option>
                                                        <option value="ADMIN">Admin</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="hidden-tablet" style={{ padding: '1rem 1.5rem' }} data-label="Estado">
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.375rem',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    background: user.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                    color: user.is_active ? '#4ade80' : '#f87171'
                                                }}>
                                                    {user.is_active ? <UserCheck size={12} /> : <UserX size={12} />}
                                                    {user.is_active ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }} data-label="Ações">
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    {editingUserId === user.id ? (
                                                        <>
                                                            <button onClick={() => saveUser(user.id)} className="btn-primary" style={{ padding: '0.5rem', width: 'auto' }} title="Guardar">
                                                                <Save size={16} />
                                                            </button>
                                                            <button onClick={cancelEditing} className="btn-secondary" style={{ padding: '0.5rem', width: 'auto' }} title="Cancelar">
                                                                <X size={16} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => startEditing(user)} className="btn-secondary" style={{ padding: '0.5rem', width: 'auto' }} title="Editar Nome">
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button onClick={() => handleDelete(user.id)} className="btn-secondary" style={{ padding: '0.5rem', width: 'auto', color: '#f87171' }} title="Eliminar">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Feedback Toast */}
            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="Eliminar Utilizador"
                message="Tem a certeza que deseja eliminar este utilizador? Esta ação não pode ser desfeita."
                isDestructive={true}
            />
        </>
    );
}

export default UsersPage;
