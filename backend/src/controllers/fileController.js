import { db } from '../config/db.js';

// Upload de Ficheiro
export const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Nenhum ficheiro enviado.' });
        }

        const { id } = req.params;
        const { categoria } = req.body;

        console.log(`Upload pedido para user ${id}, categoria ${categoria}`);

        const allowedCategories = ['foto', 'documento', 'outro'];
        const fileCategory = allowedCategories.includes(categoria) ? categoria : 'documento';

        // Inserir na DB (BLOB)
        const [result] = await db.query(
            `INSERT INTO ficheiros_anexos (utilizador_id, categoria, nome_original, tipo_ficheiro, dados)
             VALUES (?, ?, ?, ?, ?)`,
            [id, fileCategory, req.file.originalname, req.file.mimetype, req.file.buffer]
        );

        console.log('Ficheiro guardado. ID:', result.insertId);

        return res.status(201).json({
            message: 'Ficheiro guardado com sucesso.',
            id: result.insertId
        });
    } catch (error) {
        console.error('Erro no upload:', error);
        return res.status(500).json({ message: 'Erro ao guardar ficheiro.' });
    }
};

// Listar ficheiros de um utilizador
export const getUserFiles = async (req, res) => {
    try {
        const { id } = req.params;
        const [files] = await db.query(
            'SELECT id, categoria, nome_original, tipo_ficheiro, data_upload FROM ficheiros_anexos WHERE utilizador_id = ? ORDER BY data_upload DESC',
            [id]
        );
        return res.json(files);
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao listar ficheiros.' });
    }
};

// Download / Visualizar ficheiro
export const getFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const [files] = await db.query('SELECT * FROM ficheiros_anexos WHERE id = ?', [fileId]);

        if (files.length === 0) return res.status(404).json({ message: 'Ficheiro não encontrado.' });

        const file = files[0];

        res.setHeader('Content-Type', file.tipo_ficheiro);
        res.setHeader('Content-Disposition', `inline; filename="${file.nome_original}"`);

        return res.send(file.dados);
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao obter ficheiro.' });
    }
};

// Apagar ficheiro
export const deleteFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        await db.query('DELETE FROM ficheiros_anexos WHERE id = ?', [fileId]);
        return res.json({ message: 'Ficheiro eliminado.' });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao eliminar ficheiro.' });
    }
};
// Obter Foto de Perfil (a mais recente)
export const getLatestUserPhoto = async (req, res) => {
    try {
        const { id } = req.params;
        const [files] = await db.query(
            'SELECT * FROM ficheiros_anexos WHERE utilizador_id = ? AND categoria = "foto" ORDER BY data_upload DESC LIMIT 1',
            [id]
        );

        if (files.length === 0) return res.status(404).json({ message: 'Foto não encontrada.' });

        const file = files[0];
        res.setHeader('Content-Type', file.tipo_ficheiro);
        return res.send(file.dados);
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao obter foto.' });
    }
};
