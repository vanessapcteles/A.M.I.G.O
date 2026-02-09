import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const dashboardService = {
    getStats: async () => {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`${API_URL}/api/dashboard/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};
