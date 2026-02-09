import express from 'express';
import { upload } from '../config/upload.js';
import { uploadFile, getUserFiles, getFile, deleteFile, getLatestUserPhoto } from '../controllers/fileController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware de Autenticação em todas as rotas de ficheiros
router.use(authenticateToken);

// Listar ficheiros de um user (id do user na URL)
router.get('/user/:id', getUserFiles);
router.get('/user/:id/photo', getLatestUserPhoto);

// Upload (id do user na URL)
// 'file' corresponde ao name="file" no form data do frontend
const uploadMiddleware = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'O ficheiro é demasiado grande. O limite máximo é 20MB.' });
            }
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({ message: 'Erro no upload: campo incorreto ou tipo de ficheiro inválido.' });
            }
            // Multer generic error
            return res.status(500).json({ message: `Erro ao processar o upload: ${err.message}` });
        }
        next();
    });
};

router.post('/user/:id', uploadMiddleware, uploadFile);

// Obter ficheiro especifico (pelo ID do ficheiro)
// A URL será /api/files/:fileId
router.get('/:fileId', getFile);

// Apagar
router.delete('/:fileId', deleteFile);

export default router;
