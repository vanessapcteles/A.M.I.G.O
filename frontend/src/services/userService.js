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
        const response = await fetch(`${API_URL}/api/users`, {
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Erro ao carregar utilizadores');
        return response.json();
    },

    updateUser: async (id, data) => {
        const response = await fetch(`${API_URL}/api/users/${id}`, {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Erro ao atualizar utilizador');
        const result = await response.json();

        // Se estivermos a atualizar o próprio utilizador, sincronizamos o localStorage
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (currentUser && currentUser.id === id) {
            const updatedUser = {
                ...currentUser,
                ...data,
                // Garantir compatibilidade com campos nome/nome_completo
                nome: data.nome_completo || currentUser.nome
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }

        return result;
    },

    deleteUser: async (id) => {
        const response = await fetch(`${API_URL}/api/users/${id}`, {
            method: 'DELETE',
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Erro ao eliminar utilizador');
        return response.json();
    }
};
