import { API_URL } from './authService';

const getAuthHeader = () => {
    const token = localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const userService = {
    getAllUsers: async () => {
        const response = await fetch(`${API_URL}/api/auth/user`, {
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Erro ao carregar utilizadores');
        return response.json();
    },

    updateUser: async (id, data) => {
        const response = await fetch(`${API_URL}/api/auth/user/${id}`, {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify(data) 
        });
        if (!response.ok) throw new Error('Erro ao atualizar utilizador');
        return response.json();
    },

    deleteUser: async (id) => {
        const response = await fetch(`${API_URL}/api/auth/user/${id}`, {
            method: 'DELETE',
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Erro ao eliminar utilizador');
        return response.json();
    }
};
