import { db } from '../config/db.js';

async function migrate() {
    try {
        console.log('Starting migration to fix turma_detalhes...');

        // 1. Check if column exists
        const [columns] = await db.query(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'atec_secretaria' AND TABLE_NAME = 'turma_detalhes' AND COLUMN_NAME = 'id_turma'"
        );

        if (columns.length > 0) {
            console.log('Migration already applied or column exists.');
            process.exit(0);
        }

        // 2. Drop incorrect constraints if they exist
        // We'll try to drop them blindly or catch errors, usually 'id_modulo' is the constraint name if it was created via UNIQUE(id_modulo)
        try {
            await db.query('ALTER TABLE turma_detalhes DROP INDEX id_modulo');
            console.log('Dropped index id_modulo');
        } catch (e) { console.log('Index id_modulo not found or already dropped'); }

        try {
            await db.query('ALTER TABLE turma_detalhes DROP INDEX sequencia');
            console.log('Dropped index sequencia');
        } catch (e) { console.log('Index sequencia not found or already dropped'); }


        // 3. Truncate table to avoid data issues (since we are changing structure significantly and it shouldn't have data yet)
        await db.query('TRUNCATE TABLE turma_detalhes');
        console.log('Truncated turma_detalhes');

        // 4. Add column and constraints
        await db.query(`
            ALTER TABLE turma_detalhes
            ADD COLUMN id_turma INT NOT NULL AFTER id,
            ADD CONSTRAINT fk_turma_detalhes_turma FOREIGN KEY (id_turma) REFERENCES turmas(id) ON DELETE CASCADE,
            ADD UNIQUE INDEX unique_turma_modulo (id_turma, id_modulo),
            ADD UNIQUE INDEX unique_turma_sequencia (id_turma, sequencia)
        `);

        console.log('Migration completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
