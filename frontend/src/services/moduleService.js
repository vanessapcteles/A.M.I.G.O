import { API_URL } from './authService';

const getAuthHeader = () => {
    const token = localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const moduleService = {
    getAllModules: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${API_URL}/api/modules?${query}`, {
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Erro ao carregar módulos');
        return response.json();
    },

    createModule: async (data) => {
        const response = await fetch(`${API_URL}/api/modules`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Erro ao criar módulo');
        return response.json();
    },

    updateModule: async (id, data) => {
        const response = await fetch(`${API_URL}/api/modules/${id}`, {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Erro ao atualizar módulo');
        return response.json();
    },

    deleteModule: async (id) => {
        const response = await fetch(`${API_URL}/api/modules/${id}`, {
            method: 'DELETE',
            headers: getAuthHeader()
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Erro ao eliminar módulo');
        }
        return response.json();
    }
};
