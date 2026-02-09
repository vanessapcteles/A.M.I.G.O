import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

export const authService = {
    login: async (email, password) => {
        try {
            console.log('Tentando login em:', `${API_URL}/api/auth/login`);
            const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });

            if (response.data.token) {
                await AsyncStorage.setItem('auth_token', response.data.token);
                await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            console.error('Erro no login:', error.message);
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },

    logout: async () => {
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('user_data');
    },

    getToken: async () => {
        return await AsyncStorage.getItem('auth_token');
    },

    getUser: async () => {
        const data = await AsyncStorage.getItem('user_data');
        return data ? JSON.parse(data) : null;
    }
};
