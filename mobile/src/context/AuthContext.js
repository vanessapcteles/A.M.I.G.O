import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [splashLoading, setSplashLoading] = useState(false);

    useEffect(() => {
        isLoggedIn();
    }, []);

    const isLoggedIn = async () => {
        try {
            setSplashLoading(true);
            const userInfo = await AsyncStorage.getItem('userInfo');
            const token = await AsyncStorage.getItem('userToken');

            if (userInfo && token) {
                setUser(JSON.parse(userInfo));
                // Configurar header do axios
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
            setSplashLoading(false);
        } catch (e) {
            setSplashLoading(false);
            console.log(`isLoggedIn error ${e}`);
        }
    };

    const login = (email, password) => {
        setIsLoading(true);

        axios.post(`${API_URL}/auth/login`, {
            email,
            password,
        })
            .then(res => {
                const userInfo = res.data;
                const token = userInfo.token; // Ajustar conforme resposta do backend

                setUser(userInfo);
                AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
                AsyncStorage.setItem('userToken', token);

                // Setup axios default header
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                setIsLoading(false);
            })
            .catch(e => {
                console.log(`Login error ${e}`);
                setIsLoading(false);
                // Retornar erro para UI
                throw e;
            });
    };

    const logout = () => {
        setIsLoading(true);
        axios.post(`${API_URL}/auth/logout`, {}, {
            headers: { Authorization: `Bearer ${user.token}` }
        }).catch(e => console.log('Logout error', e))
            .finally(() => {
                AsyncStorage.removeItem('userInfo');
                AsyncStorage.removeItem('userToken');
                setUser(null);
                setIsLoading(false);
            });
    };

    return (
        <AuthContext.Provider
            value={{
                isLoading,
                user,
                splashLoading,
                login,
                logout,
            }}>
            {children}
        </AuthContext.Provider>
    );
};
