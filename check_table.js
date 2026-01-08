import 'dotenv/config';
import { db } from './backend/src/config/db.js';

async function checkTable() {
    try {
        const [columns] = await db.query('SHOW COLUMNS FROM utilizadores');
        console.log('Columns:', columns.map(c => c.Field));
    } catch (err) {
        console.error('Table Error:', err.message);
    } finally {
        process.exit();
    }
}

checkTable();
