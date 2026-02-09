// Para Android Emulator use 10.0.2.2
// Para iOS Simulator use localhost
// Para Dispositivo Físico use o IP da sua máquina (ex: 192.168.1.5)

import { Platform } from 'react-native';

const DEV_IP = '10.0.2.2'; // MUDAR AQUI SE ESTIVER A USAR DISPOSITIVO FÍSICO

export const API_URL = Platform.select({
    ios: 'http://localhost:3001',
    android: `http://${DEV_IP}:3001`,
});

export const getHeaders = async (token) => {
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};
