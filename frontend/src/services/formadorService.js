import { API_URL, getAuthHeader } from './authService';

export const formadorService = {
    getAll: async () => {
        const response = await fetch(`${API_URL}/api/formadores`, {
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Erro ao carregar formadores');
        return response.json();
    },

    getProfile: async (userId) => {
        const response = await fetch(`${API_URL}/api/formadores/${userId}/profile`, {
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Erro ao carregar perfil do formador');
        return response.json();
    },

    getHistory: async (userId) => {
        const response = await fetch(`${API_URL}/api/formadores/${userId}/history`, {
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Erro ao carregar histórico do formador');
        return response.json();
    },

    updateProfile: async (userId, data) => {
        const response = await fetch(`${API_URL}/api/formadores/${userId}/profile`, {
            method: 'PUT',
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Erro ao atualizar perfil do formador');
        return response.json();
    }
};
