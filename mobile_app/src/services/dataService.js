import axios from 'axios';
import { API_URL, getHeaders } from '../config/api';
import { authService } from './authService';

const api = axios.create({
    baseURL: API_URL
});

// Interceptor para adicionar token
api.interceptors.request.use(async (config) => {
    const token = await authService.getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const dataService = {
    getCursos: async () => {
        const response = await api.get('/api/courses');
        return response.data.courses || response.data;
    },

    getFormandos: async () => {
        const response = await api.get('/api/formandos');
        return response.data.formandos || response.data;
    },

    getFormadores: async () => {
        const response = await api.get('/api/formadores');
        return response.data;
    },

    getSalas: async () => {
        const response = await api.get('/api/rooms'); // Using rooms endpoint for availability too eventually
        return response.data;
    },

    getRoomAvailability: async (roomId, date) => {
        // Implement as needed based on backend
        const response = await api.get(`/api/schedules/room/${roomId}`, { params: { dia: date } });
        return response.data;
    },

    getGlobalSchedule: async (params) => {
        const response = await api.get('/api/schedules/all', { params });
        return response.data;
    }
};
