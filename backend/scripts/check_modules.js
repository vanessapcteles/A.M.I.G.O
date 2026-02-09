import { db } from '../src/config/db.js';

async function checkTable() {
    try {
        const [rows] = await db.query('SELECT * FROM modulos LIMIT 1');
        console.log('SUCCESS: Table modulos exists.');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            console.log('MISSING: Table modulos does not exist.');
            process.exit(1);
        } else {
            console.error('ERROR:', error);
            process.exit(1);
        }
    }
}

checkTable();
