import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

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
            alert('Função atualizada com sucesso!');
            loadUsers();
        } catch (err) {
            alert('Erro ao atualizar função: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem a certeza que deseja eliminar este utilizador?')) return;
        try {
            await userService.deleteUser(id);
            alert('Utilizador eliminado com sucesso!');
            setUsers(users.filter(u => u.id !== id));
        } catch (err) {
            alert('Erro ao eliminar: ' + err.message);
        }
    };

    // Iniciar edição
    const startEditing = (user) => {
        setEditingUserId(user.id);
        setEditName(user.nome_completo || user.nome);
    };

    // Cancelar edição
    const cancelEditing = () => {
        setEditingUserId(null);
        setEditName('');
    };

    // Guardar alterações
    const saveUser = async (id) => {
        try {
            await userService.updateUser(id, { nome_completo: editName });
            alert('Nome atualizado com sucesso!');
            setEditingUserId(null);
            loadUsers();
        } catch (err) {
            alert('Erro ao atualizar: ' + err.message);
        }
    };

    const filteredUsers = users.filter(user =>
    (user.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div className="container" style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>A carregar...</div>;

    return (
        <div className="container">
            <Navbar />
            <div style={{ padding: '2rem', marginTop: '80px' }}>
                <h1 style={{ color: 'white', marginBottom: '1.5rem' }}>Gestão de Utilizadores</h1>

                <div style={{ marginBottom: '2rem' }}>
                    <input
                        type="text"
                        placeholder="Pesquisar por nome ou email..."
                        className="custom-input"
                        style={{ maxWidth: '400px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {error && <div style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</div>}

                <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>Nome</th>
                                <th style={{ padding: '1rem' }}>Email</th>
                                <th style={{ padding: '1rem' }}>Função</th>
                                <th style={{ padding: '1rem' }}>Estado</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    {/*Editar*/}
                                    <td style={{ padding: '1rem' }}>
                                        {editingUserId === user.id ? (
                                            <input
                                                type="text"
                                                className="custom-input"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                            />
                                        ) : (
                                            user.nome_completo || user.nome
                                        )}
                                    </td>

                                    <td style={{ padding: '1rem' }}>{user.email}</td>

                                    <td style={{ padding: '1rem' }}>
                                        <select
                                            value={user.tipo_utilizador}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            className="custom-input"
                                            style={{ padding: '0.25rem', fontSize: '0.9rem', width: 'auto' }}
                                        >
                                            <option value="CANDIDATO">Candidato</option>
                                            <option value="FORMANDO">Formando</option>
                                            <option value="FORMADOR">Formador</option>
                                            <option value="SECRETARIA">Secretaria</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </td>

                                    <td style={{ padding: '1rem' }}>
                                        {user.is_active ?
                                            <span style={{ color: '#4ade80' }}>Ativo</span> :
                                            <span style={{ color: '#f87171' }}>Inativo</span>
                                        }
                                    </td>

                                    <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        {editingUserId === user.id ? (
                                            <>
                                                <button
                                                    onClick={() => saveUser(user.id)}
                                                    className="btn-primary"
                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                                                >
                                                    💾
                                                </button>
                                                <button
                                                    onClick={cancelEditing}
                                                    className="btn-secondary"
                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                                                >
                                                    ❌
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => startEditing(user)}
                                                    className="btn-secondary"
                                                    style={{
                                                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                                        color: '#60a5fa',
                                                        border: '1px solid rgba(59, 130, 246, 0.5)',
                                                        padding: '0.25rem 0.5rem',
                                                        fontSize: '0.8rem',
                                                        width: 'auto'
                                                    }}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="btn-secondary"
                                                    style={{
                                                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                                        color: '#f87171',
                                                        border: '1px solid rgba(239, 68, 68, 0.5)',
                                                        padding: '0.25rem 0.5rem',
                                                        fontSize: '0.8rem',
                                                        width: 'auto'
                                                    }}
                                                >
                                                    🗑️
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default UsersPage;
