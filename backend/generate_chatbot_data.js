import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env da raiz do projeto (pasta pai)
dotenv.config({ path: path.join(__dirname, '../.env') });

// Carregar .env da raiz do projeto (pasta pai)
dotenv.config({ path: path.join(__dirname, '../.env') });

// FORÇAR localhost para execução deste script localmente
process.env.DB_HOST = 'localhost';

async function generateChatbotData() {
    try {
        // Importar dinamicamente a conexão com a BD após configurar as variáveis
        const { db } = await import('./src/config/db.js');

        console.log('🔄 A conectar à base de dados (localhost)...');
        console.log('⏳ A gerar dados para o Tawk.to...\n');

        // 1. Buscar todos os cursos
        const [cursos] = await db.query('SELECT * FROM cursos ORDER BY nome_curso');

        let output = '';

        output += '=== 🎓 Lista de Cursos ATEC ===\n\n';
        output += 'Copie o texto abaixo e cole na Knowledge Base ou Aba Txt do Tawk.to:\n';
        output += '------------------------------------------------------------\n\n';

        output += 'Na ATEC temos disponíveis os seguintes cursos:\n\n';

        for (const curso of cursos) {
            output += `🔹 **${curso.nome_curso}** (${curso.area})\n`;
            output += `   Estado: ${curso.estado}\n`;

            // 2. Buscar módulos do curso
            const [modulos] = await db.query(`
        SELECT m.nome_modulo, m.carga_horaria, cm.sequencia
        FROM modulos m
        JOIN curso_modulos cm ON m.id = cm.id_modulo
        WHERE cm.id_curso = ?
        ORDER BY cm.sequencia ASC
      `, [curso.id]);

            if (modulos.length > 0) {
                output += `   Módulos:\n`;
                modulos.forEach(mod => {
                    output += `   - ${mod.nome_modulo} (${mod.carga_horaria}h)\n`;
                });
            } else {
                output += `   (Ainda sem módulos definidos)\n`;
            }

            output += '\n'; // Linha em branco entre cursos
        }



        output += '------------------------------------------------------------\n';
        output += 'Para se inscrever, visite a página "Cursos" no nosso site.\n';

        // Escrever output em ficheiro
        const outputPath = path.join(__dirname, '../chatbot_data.txt');
        fs.writeFileSync(outputPath, output);

        console.log(`\n✅ Dados gerados com sucesso em: ${outputPath}`);
        console.log('(Abra este ficheiro para copiar o conteúdo)');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro ao gerar dados:', error);
        process.exit(1);
    }
}

generateChatbotData();
