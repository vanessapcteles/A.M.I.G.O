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
    },

    // Detalhes (Módulos da Turma)
    getTurmaModules: async (turmaId) => {
        const response = await fetch(`${API_URL}/api/turma-details/${turmaId}`, { headers: getAuthHeader() });
        if (!response.ok) throw new Error('Erro ao carregar módulos da turma');
        return response.json();
    },

    addModuleToTurma: async (turmaId, data) => {
        const response = await fetch(`${API_URL}/api/turma-details/${turmaId}`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Erro ao adicionar módulo');
        }
        return response.json();
    },

    removeModuleFromTurma: async (detalheId) => {
        const response = await fetch(`${API_URL}/api/turma-details/${detalheId}`, {
            method: 'DELETE',
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Erro ao remover módulo');
        return response.json();
    },
    // Listar Formandos
    getTurmaFormandos: async (turmaId) => {
        const response = await fetch(`${API_URL}/api/turma-details/${turmaId}/formandos`, {
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Erro ao obter formandos da turma');
        return response.json();
    }
};
