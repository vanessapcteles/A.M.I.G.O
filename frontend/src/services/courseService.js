import { API_URL } from './authService';

const getAuthHeader = () => {
    const token = localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const courseService = {
    getAllCourses: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${API_URL}/api/courses?${query}`, {
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
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Erro ao criar curso');
        }
        return response.json();
    },

    updateCourse: async (id, data) => {
        const response = await fetch(`${API_URL}/api/courses/${id}`, {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Erro ao atualizar curso');
        }
        return response.json();
    },

    deleteCourse: async (id) => {
        const response = await fetch(`${API_URL}/api/courses/${id}`, {
            method: 'DELETE',
            headers: getAuthHeader()
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Erro ao eliminar curso');
        }
        return response.json();
    },

    // Métodos do Currículo
    getCourseModules: async (courseId) => {
        const response = await fetch(`${API_URL}/api/courses/${courseId}/modules`, {
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Erro ao carregar módulos do curso');
        return response.json();
    },

    addModuleToCourse: async (courseId, data) => {
        // dados: { id_modulo, sequencia, horas_padrao, ... }
        const response = await fetch(`${API_URL}/api/courses/${courseId}/modules`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Erro ao associar módulo');
        }
        return response.json();
    },

    removeModuleFromCourse: async (moduleId) => {
        
        const response = await fetch(`${API_URL}/api/courses/modules/${moduleId}`, {
            method: 'DELETE',
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Erro ao remover módulo do curso');
        return response.json();
    }
};
