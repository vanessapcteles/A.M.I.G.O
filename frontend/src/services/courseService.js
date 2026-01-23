import { API_URL } from './authService';

const getAuthHeader = () => {
    const token = localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const courseService = {
    getAllCourses: async () => {
        const response = await fetch(`${API_URL}/api/courses`, {
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Erro ao carregar cursos');
        return response.json();
    },

    createCourse: async (data) => {
        const response = await fetch(`${API_URL}/api/courses`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Erro ao criar curso');
        return response.json();
    },

    updateCourse: async (id, data) => {
        const response = await fetch(`${API_URL}/api/courses/${id}`, {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Erro ao atualizar curso');
        return response.json();
    },

    deleteCourse: async (id) => {
        const response = await fetch(`${API_URL}/api/courses/${id}`, {
            method: 'DELETE',
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Erro ao eliminar curso');
        return response.json();
    }
};
