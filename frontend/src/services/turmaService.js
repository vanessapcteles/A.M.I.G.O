import { API_URL } from './authService';

const getAuthHeader = () => {
    const token = localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const turmaService = {
    getAllTurmas: async () => {
        const response = await fetch(`${API_URL}/api/turmas`, {
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Erro ao carregar turmas');
        return response.json();
    },

    getCursos: async () => {
        const response = await fetch(`${API_URL}/api/turmas/cursos`, {
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Erro ao carregar cursos');
        return response.json();
    },

    createTurma: async (data) => {
        const response = await fetch(`${API_URL}/api/turmas`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Erro ao criar turma');
        return response.json();
    },

    updateTurma: async (id, data) => {
        const response = await fetch(`${API_URL}/api/turmas/${id}`, {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Erro ao atualizar turma');
        return response.json();
    },

    deleteTurma: async (id) => {
        const response = await fetch(`${API_URL}/api/turmas/${id}`, {
            method: 'DELETE',
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Erro ao eliminar turma');
        return response.json();
    }
};
