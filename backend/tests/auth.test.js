import request from 'supertest';
// Simulação de app para teste (idealmente exportar o app de src/app.js)
// Para este exemplo, vou assumir um mock simples ou o fluxo de teste
const API_URL = 'http://localhost:3001';

describe('Auth Endpoints', () => {
    it('should fail on login with wrong credentials', async () => {
        const res = await request(API_URL)
            .post('/api/auth/login')
            .send({
                email: 'wrong@user.com',
                password: 'password123'
            });
        expect(res.statusCode).toEqual(401);
        expect(res.body).toHaveProperty('message');
    });

    it('should require token for protected routes', async () => {
        const res = await request(API_URL)
            .get('/api/users');
        expect(res.statusCode).toEqual(401);
    });
});
