import React, { createContext, useState, useEffect, useMemo } from 'react';
import { authService } from '../services/authService';
import { Alert } from 'react-native';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const bootstrapAsync = async () => {
            let token;
            try {
                token = await authService.getToken();
            } catch (e) {
                // Restoring token failed
            }
            setUserToken(token);
            setIsLoading(false);
        };

        bootstrapAsync();
    }, []);

    const authContext = useMemo(() => ({
        signIn: async (email, password) => {
            try {
                const data = await authService.login(email, password);
                if (data.token) {
                    setUserToken(data.token);
                }
            } catch (error) {
                throw error; // Let the screen handle the error alert
            }
        },
        signOut: async () => {
            await authService.logout();
            setUserToken(null);
        },
        userToken,
        isLoading
    }), [userToken, isLoading]);

    return (
        <AuthContext.Provider value={authContext}>
            {children}
        </AuthContext.Provider>
    );
};
