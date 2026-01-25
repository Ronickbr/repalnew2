import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import multer from 'multer';

// Configuração básica do multer para memory storage, pois o controller lida com o buffer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const router = express.Router();

// Rota de upload de imagem (protegida)
// Note: O controller já lida com req.file.buffer, mas precisamos do middleware do multer aqui para processar o multipart/form-data
// No entanto, o controller original usava upload.single dentro dele.
// Vamos adaptar: O controller que eu li usa `upload.single` DENTRO dele como middleware inline.
// Mas para manter padrão clean, é melhor o router chamar o multer.
// Porém, o controller `uploadController.js` que eu li (cópia do antigo) instanciava o multer dentro dele e usava promise.
// Se eu mudar para router, tenho que mudar o controller.
// O controller atual:
// export const uploadImage = async (req, res) => { ... if (!req.file) ... }
// Ele NÃO instancia o multer, ele assume que req.file já existe?
// NÃO. O arquivo lido anteriormente mostrava: `const uploadMiddleware = upload.single('image'); await new Promise...`
// O arquivo `backend/controllers/uploadController.js` que eu li na ToolCall anterior NÃO tinha essa parte do multer instance!
// Wait, let me re-read `backend/controllers/uploadController.js` from the previous tool call output.
// Tool call result 1 for uploadController.js:
// 1 import fs from 'fs'; ...
// 22 export const uploadImage = async (req, res) => {
// 24 if (!req.file) { ... }
// Ele checa req.file. Isso significa que ele ESPERA que um middleware ANTERIOR já tenha processado o upload.
// ENTÃO, eu DEVO colocar o middleware do multer aqui no router.

router.post('/', authMiddleware, upload.single('image'), uploadImage);

export default router;
