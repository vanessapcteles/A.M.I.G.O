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

function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });

    // Edição
    const [editingUserId, setEditingUserId] = useState(null);
    const [editName, setEditName] = useState('');

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
            setMessage({ text: 'Função atualizada!', type: 'success' });

            // Se for o próprio utilizador, recarregar para atualizar a Sidebar/Header
            const currentUser = authService.getCurrentUser();
            if (currentUser && currentUser.id === id) {
                setTimeout(() => window.location.reload(), 1000);
            } else {
                setTimeout(() => setMessage({ text: '', type: '' }), 3000);
                loadUsers();
            }
        } catch (err) {
            setMessage({ text: 'Erro ao atualizar: ' + err.message, type: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem a certeza que deseja eliminar este utilizador?')) return;
        try {
            await userService.deleteUser(id);
            setMessage({ text: 'Utilizador removido.', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
            setUsers(users.filter(u => u.id !== id));
        } catch (err) {
            setMessage({ text: 'Erro ao eliminar: ' + err.message, type: 'error' });
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
            setMessage({ text: 'Nome atualizado!', type: 'success' });
            setEditingUserId(null);

            // Se for o próprio utilizador, recarregar para atualizar a Sidebar/Header
            const currentUser = authService.getCurrentUser();
            if (currentUser && currentUser.id === id) {
                setTimeout(() => window.location.reload(), 1000);
            } else {
                setTimeout(() => setMessage({ text: '', type: '' }), 3000);
                loadUsers();
            }
        } catch (err) {
            setMessage({ text: 'Erro ao atualizar: ' + err.message, type: 'error' });
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        Gestão de Utilizadores
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Visualize e gira as permissões de todos os utilizadores da plataforma.
                    </p>
                </div>
            </div>

            {/* Filters & Actions */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Procurar por nome ou email..."
                        className="input-field"
                        style={{ paddingLeft: '3rem' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
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
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ color: 'var(--text-primary)' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>Utilizador</th>
                                    <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>Função</th>
                                    <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>Estado</th>
                                    <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right', fontWeight: '600', fontSize: '0.875rem' }}>Ações</th>
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
                                            <td style={{ padding: '1rem 1.5rem' }}>
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
                                            <td style={{ padding: '1rem 1.5rem' }}>
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
                                            <td style={{ padding: '1rem 1.5rem' }}>
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
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
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
            <AnimatePresence>
                {message.text && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        style={{
                            position: 'fixed',
                            bottom: '2rem',
                            right: '2rem',
                            padding: '1rem 2rem',
                            borderRadius: '12px',
                            background: message.type === 'success' ? 'var(--primary)' : '#ef4444',
                            color: 'white',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}
                    >
                        {message.type === 'success' ? <Check size={20} /> : <X size={20} />}
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default UsersPage;
