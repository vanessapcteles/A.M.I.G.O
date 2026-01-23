import { useState, useEffect } from 'react';
import { roomService } from '../services/roomService';
import DashboardLayout from '../components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import {
    DoorOpen,
    Plus,
    Search,
    Users,
    MapPin,
    Edit2,
    Trash2,
    X,
    Save
} from 'lucide-react';

function RoomsPage() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [formData, setFormData] = useState({
        nome: '',
        capacidade: '',
        localizacao: 'Edifício Principal'
    });

    useEffect(() => {
        loadRooms();
    }, []);

    const loadRooms = async () => {
        try {
            const data = await roomService.getAllRooms();
            setRooms(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRoom) {
                await roomService.updateRoom(editingRoom.id, formData);
            } else {
                await roomService.createRoom(formData);
            }
            setShowModal(false);
            setEditingRoom(null);
            setFormData({ nome: '', capacidade: '', localizacao: 'Edifício Principal' });
            loadRooms();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem a certeza que deseja eliminar esta sala?')) return;
        try {
            await roomService.deleteRoom(id);
            loadRooms();
        } catch (error) {
            alert(error.message);
        }
    };

    const openEdit = (room) => {
        setEditingRoom(room);
        setFormData({
            nome: room.nome,
            capacidade: room.capacidade,
            localizacao: room.localizacao
        });
        setShowModal(true);
    };

    const filteredRooms = rooms.filter(room =>
        room.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.localizacao?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar sala..."
                        className="input-field"
                        style={{ paddingLeft: '3rem' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-primary" onClick={() => { setEditingRoom(null); setFormData({ nome: '', capacidade: '', localizacao: 'Edifício Principal' }); setShowModal(true); }}>
                    <Plus size={20} /> Adicionar Sala
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando salas...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {filteredRooms.map((room) => (
                        <motion.div
                            key={room.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card"
                            style={{ position: 'relative', overflow: 'hidden' }}
                        >
                            <div style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                display: 'flex',
                                gap: '0.5rem'
                            }}>
                                <button onClick={() => openEdit(room)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(room.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{
                                    padding: '0.75rem',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    borderRadius: '12px',
                                    color: 'var(--primary)'
                                }}>
                                    <DoorOpen size={24} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{room.nome}</h3>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    <Users size={16} /> <span>Capacidade: <strong>{room.capacidade}</strong> utilizadores</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    <MapPin size={16} /> <span>{room.localizacao}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {filteredRooms.length === 0 && !loading && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            Nenhuma sala encontrada.
                        </div>
                    )}
                </div>
            )}

            {/* Modal de Criação/Edição */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1000
                }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card"
                        style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <h2>{editingRoom ? 'Editar Sala' : 'Nova Sala'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Nome da Sala</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    required
                                    value={formData.nome}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                    placeholder="Ex: Sala 101"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Capacidade</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    required
                                    value={formData.capacidade}
                                    onChange={(e) => setFormData({ ...formData, capacidade: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Localização</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.localizacao}
                                    onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                                <Save size={20} /> {editingRoom ? 'Guardar Alterações' : 'Criar Sala'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </DashboardLayout>
    );
}

export default RoomsPage;
