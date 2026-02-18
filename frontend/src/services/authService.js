export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const getAuthHeader = () => {
    const token = localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const authService = {
    API_URL,
    login: async (email, password) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: window.JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao fazer login');
            }

            // Guardar token
            if (data.token) {
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('user', window.JSON.stringify(data.user));
            }

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    register: async (userData) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: window.JSON.stringify(userData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao registar');
            }

            return data;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    },

    resendActivation: async (email) => {
        const response = await fetch(`${API_URL}/api/auth/resend-activation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro ao reenviar email');
        return data;
    },

    resendActivation: async (email) => {
        const response = await fetch(`${API_URL}/api/auth/resend-activation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro ao reenviar email');
        return data;
    },

    logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
    },

    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    forgotPassword: async (email) => {
        const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (!response.ok) throw new Error('Erro ao pedir recuperação');
        return response.json();
    },

    resetPassword: async (token, newPassword) => {
        const response = await fetch(`${API_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword })
        });
        if (!response.ok) throw new Error('Erro ao repor password');
        return response.json();
    },

    // Método 2FA 
    setup2FA: async (userId) => {
        const response = await fetch(`${API_URL}/api/auth/2fa/setup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        if (!response.ok) throw new Error('Erro ao configurar 2FA');
        return response.json();
    },

    verify2FA: async (userId, token) => {
        const response = await fetch(`${API_URL}/api/auth/2fa/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, token })
        });
        if (!response.ok) throw new Error('Código incorreto');
        return response.json();
    },

    validate2FA: async (email, token) => {
        const response = await fetch(`${API_URL}/api/auth/2fa/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, token })
        });
        if (!response.ok) throw new Error('Código incorreto');
        return response.json();
    },

    recover2FA: async (email) => {
        const response = await fetch(`${API_URL}/api/auth/2fa/recover`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        return response.json();
    },

    disable2FA: async (token) => {
        const response = await fetch(`${API_URL}/api/auth/2fa/disable`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        if (!response.ok) throw new Error('Token inválido ou expirado');
        return response.json();
    },

    updateProfile: async (userId, userData) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: window.JSON.stringify(userData)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao atualizar perfil');

            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const currentUser = JSON.parse(storedUser);
                const updatedUser = {
                    ...currentUser,
                    ...userData,
                    // Sincronizar campo nome se nome_completo mudar
                    nome: userData.nome_completo || currentUser.nome
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }

            return data;
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }
};
