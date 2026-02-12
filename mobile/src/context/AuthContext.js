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
                let parsedUser = JSON.parse(userInfo);

                // Auto-fix for legacy nested structure (migration)
                if (parsedUser.user && !parsedUser.nome_completo) {
                    parsedUser = { ...parsedUser.user, token };
                    AsyncStorage.setItem('userInfo', JSON.stringify(parsedUser));
                }

                setUser(parsedUser);
                // Configurar header do axios
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
            setSplashLoading(false);
        } catch (e) {
            setSplashLoading(false);
            console.log(`isLoggedIn error ${e}`);
        }
    };

    const login = async (email, password) => {
        setIsLoading(true);

        try {
            const res = await axios.post(`${API_URL}/auth/login`, {
                email,
                password,
            });

            if (res.data.requires2FA) {
                setIsLoading(false);
                return { requires2FA: true };
            }

            const userInfo = res.data;
            const token = userInfo.token;

            // Flatten the object so user state has direct properties
            const userData = { ...userInfo.user, token };

            setUser(userData);
            await AsyncStorage.setItem('userInfo', JSON.stringify(userData));
            await AsyncStorage.setItem('userToken', token);

            // Setup axios default header
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            setIsLoading(false);
            return { success: true };
        } catch (e) {
            console.log(`Login error ${e}`);
            setIsLoading(false);
            throw e;
        }
    };

    const verifyOTP = async (email, code) => {
        setIsLoading(true);
        try {
            const res = await axios.post(`${API_URL}/auth/2fa/validate`, {
                email,
                token: code
            });

            const { user: userObj, token } = res.data;
            const userData = { ...userObj, token };

            setUser(userData);
            await AsyncStorage.setItem('userInfo', JSON.stringify(userData));
            await AsyncStorage.setItem('userToken', token);

            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            setIsLoading(false);
            return { success: true };
        } catch (e) {
            console.log(`Verify OTP error ${e}`);
            setIsLoading(false);
            throw e;
        }
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
                verifyOTP,
                logout,
            }}>
            {children}
        </AuthContext.Provider>
    );
};
