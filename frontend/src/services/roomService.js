import { API_URL } from './authService';

const getAuthHeader = () => {
    const token = localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const roomService = {
    getAllRooms: async () => {
        const response = await fetch(`${API_URL}/api/rooms`, {
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Erro ao carregar salas');
        return response.json();
    },

    createRoom: async (data) => {
        const response = await fetch(`${API_URL}/api/rooms`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Erro ao criar sala');
        return response.json();
    },

    updateRoom: async (id, data) => {
        const response = await fetch(`${API_URL}/api/rooms/${id}`, {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Erro ao atualizar sala');
        return response.json();
    },

    deleteRoom: async (id) => {
        const response = await fetch(`${API_URL}/api/rooms/${id}`, {
            method: 'DELETE',
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Erro ao eliminar sala');
        return response.json();
    }
};
