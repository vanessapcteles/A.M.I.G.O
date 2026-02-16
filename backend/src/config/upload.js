import multer from 'multer'; // Importar o multer 

// Guardar em memória para depois enviar para a Base de Dados (BLOB)
const storage = multer.memoryStorage();

// Filtro de ficheiros (opcional, pode ser ajustado)
const fileFilter = (req, file, cb) => {
    // Aceitar imagens e PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Formato de ficheiro não suportado. Apenas imagens e PDFs.'), false);
    }
};

export const upload = multer({ // Exportar o multer
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // Limite de 20MB
    },
    fileFilter: fileFilter
});
