import { createClient } from 'redis';
// Configuração do Redis
const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => console.log('Redis Client Error', err));

await client.connect(); // Conectar ao Redis

console.log('Conectado ao Redis!'); // Log de conexão

export default client; // Exportar o cliente Redis
