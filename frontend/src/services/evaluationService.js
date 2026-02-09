
import { API_URL, getAuthHeader } from './authService';

export const evaluationService = {
    getStudentsForEvaluation: async (turmaId, moduloId) => {
        const response = await fetch(`${API_URL}/api/evaluations/turma/${turmaId}/module/${moduloId}`, {
            headers: getAuthHeader()
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao carregar alunos para avaliação');
        }
        return response.json();
    },

    submitGrades: async (moduloId, grades) => {
        const response = await fetch(`${API_URL}/api/evaluations/submit`, {
            method: 'POST',
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ moduloId, grades })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao submeter notas');
        }
        return response.json();
    }
};
