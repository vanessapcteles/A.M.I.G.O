
import { API_URL } from './authService';

const getAuthHeader = () => {
    const token = localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const disponibilidadeService = {
    getMyAvailability: async () => {
        const response = await fetch(`${API_URL}/api/availability`, {
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Erro ao carregar disponibilidade');
        return response.json();
    },

    getAllAvailabilities: async () => {
        const response = await fetch(`${API_URL}/api/availability/all`, {
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Erro ao carregar todas as disponibilidades');
        return response.json();
    },

    addAvailability: async (data) => {
        const response = await fetch(`${API_URL}/api/availability`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Erro ao adicionar disponibilidade');
        return response.json();
    },

    removeAvailability: async (id) => {
        const response = await fetch(`${API_URL}/api/availability/${id}`, {
            method: 'DELETE',
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Erro ao remover disponibilidade');
        return response.json();
    }
};
