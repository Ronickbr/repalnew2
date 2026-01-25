import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logAdminActivity } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '../../');

const generateFileName = (originalName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalName).toLowerCase();
  return `produto_${timestamp}_${randomString}${extension}`;
};

const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const publicDir = path.join(rootDir, 'public');
    const imgDir = path.join(publicDir, 'img');
    ensureDirectoryExists(imgDir);

    const fileName = generateFileName(req.file.originalname);
    const filePath = path.join(imgDir, fileName);

    fs.writeFileSync(filePath, req.file.buffer);

    const imageUrl = `/img/${fileName}`;
    await logAdminActivity(req.admin, 'upload_image', { fileName });
    
    res.status(200).json({
      success: true,
      imageUrl,
      message: 'Imagem salva com sucesso'
    });

  } catch (error) {
    console.error('Erro upload:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
};
