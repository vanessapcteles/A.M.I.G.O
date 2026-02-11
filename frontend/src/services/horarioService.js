import { API_URL, getAuthHeader } from './authService';

export const horarioService = {
    // Obter horários da turma
    getTurmaSchedule: async (turmaId, start, end) => {
        let url = `${API_URL}/api/schedules/turma/${turmaId}`;
        const params = new URLSearchParams();
        if (start) params.append('start', start);
        if (end) params.append('end', end);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await fetch(url, { headers: getAuthHeader() });
        if (!response.ok) throw new Error('Erro ao carregar horários');
        return response.json();
    },

    // Criar aula (Agendar)
    createLesson: async (data) => {
        const response = await fetch(`${API_URL}/api/schedules`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Erro ao agendar aula');
        }
        return response.json();
    },

    // Remover aula
    deleteLesson: async (id) => {
        const response = await fetch(`${API_URL}/api/schedules/${id}`, {
            method: 'DELETE',
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Erro ao remover aula');
        return response.json();
    },

    // Limpar horário da turma
    deleteTurmaSchedule: async (turmaId) => {
        const response = await fetch(`${API_URL}/api/schedules/turma/${turmaId}`, {
            method: 'DELETE',
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Erro ao limpar horário da turma');
        return response.json();
    },

    getFormadorSchedule: async (userId, start, end) => {
        let url = `${API_URL}/api/schedules/formador/${userId}`;
        const params = new URLSearchParams();
        if (start) params.append('start', start);
        if (end) params.append('end', end);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await fetch(url, { headers: getAuthHeader() });
        if (!response.ok) throw new Error('Erro ao carregar horário do formador');
        return response.json();
    },

    getRoomSchedule: async (roomId, start, end, dia) => {
        let url = `${API_URL}/api/schedules/room/${roomId}`;
        const params = new URLSearchParams();
        if (dia) params.append('dia', dia);
        if (start) params.append('start', start);
        if (end) params.append('end', end);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await fetch(url, { headers: getAuthHeader() });
        if (!response.ok) throw new Error('Erro ao carregar ocupação da sala');
        return response.json();
    },

    getAllSchedules: async (filters = {}) => {
        let url = `${API_URL}/api/schedules/all`;
        const params = new URLSearchParams();

        // Support legacy (start, end) arguments or object
        if (typeof filters === 'string') {
            // arguments were (start, end)
            // eslint-disable-next-line
            const [start, end] = arguments;
            if (start) params.append('start', start);
            if (end) params.append('end', end);
        } else {
            const { start, end, formadorId, turmaId } = filters;
            if (start) params.append('start', start);
            if (end) params.append('end', end);
            if (formadorId) params.append('formadorId', formadorId);
            if (turmaId) params.append('turmaId', turmaId);
        }

        if (params.toString()) url += `?${params.toString()}`;

        const response = await fetch(url, { headers: getAuthHeader() });
        if (!response.ok) throw new Error('Erro ao carregar todos os horários');
        return response.json();
    },

    generateAutoSchedule: async (turmaId, dataInicio, regime) => {
        const response = await fetch(`${API_URL}/api/schedules/generate/${turmaId}`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify({ dataInicio, regime })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro ao gerar horário');
        return data;
    }
};
