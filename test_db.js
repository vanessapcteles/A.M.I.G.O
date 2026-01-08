import dotenv from 'dotenv';
const result = dotenv.config({ path: './backend/.env' });
console.log('Dotenv result:', result);
console.log('DB_USER:', process.env.DB_USER);

import { db } from './backend/src/config/db.js';

async function testConn() {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS result');
        console.log('Conn Success:', rows);
    } catch (err) {
        console.error('Conn Failed:', err.message);
    } finally {
        process.exit();
    }
}

testConn();
