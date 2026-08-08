import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import multer from 'multer';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar multer para armazenamento em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado'), false);
    }
  }
});

// Função para gerar nome único do arquivo
const generateFileName = (originalName) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(6).toString('hex');
  const extension = path.extname(originalName).toLowerCase();
  return `produto_${timestamp}_${randomString}${extension}`;
};

// Função para garantir que o diretório existe
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

function validateMagicBytes(buffer, allowedMimeTypes) {
  const signatures = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png':  [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    'image/gif':  [0x47, 0x49, 0x46, 0x38],
    'image/webp': [0x52, 0x49, 0x46, 0x46]
  };

  for (const mimeType of allowedMimeTypes) {
    const sig = signatures[mimeType];
    if (!sig) continue;
    let matches = true;
    for (let i = 0; i < sig.length; i++) {
      if (buffer[i] !== sig[i]) { matches = false; break; }
    }
    if (matches) return true;
  }
  return false;
}

export default async function handler(req, res) {
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.VITE_FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
  ].filter(Boolean);

  const requestOrigin = req.headers.origin || '';
  const isAllowedOrigin = allowedOrigins.includes(requestOrigin) ||
    (process.env.NODE_ENV !== 'production' && !requestOrigin);

  const safeOrigin = isAllowedOrigin && requestOrigin ? requestOrigin : 'null';
  res.setHeader('Access-Control-Allow-Origin', safeOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const uploadMiddleware = upload.single('image');

    await new Promise((resolve, reject) => {
      uploadMiddleware(req, res, (err) => {
        if (err) { reject(err); } else { resolve(); }
      });
    });

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validateMagicBytes(req.file.buffer, allowedMimeTypes)) {
      return res.status(400).json({ error: 'Arquivo inválido: conteúdo não corresponde a uma imagem válida' });
    }

    // Caminho para a pasta img no diretório public
    const publicDir = path.join(process.cwd(), 'public');
    const imgDir = path.join(publicDir, 'img');
    
    // Garantir que o diretório existe
    ensureDirectoryExists(imgDir);

    // Gerar nome único para o arquivo
    const fileName = generateFileName(req.file.originalname);
    const filePath = path.join(imgDir, fileName);

    // Salvar o arquivo
    fs.writeFileSync(filePath, req.file.buffer);

    // Retornar a URL local
    const imageUrl = `/img/${fileName}`;

    res.status(200).json({
      success: true,
      imageUrl,
      message: 'Imagem salva com sucesso'
    });

  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande. Máximo 5MB.' });
    }
    
    if (error.message === 'Tipo de arquivo não suportado') {
      return res.status(400).json({ error: error.message });
    }

    console.error('Erro interno no upload de imagem (detalhes técnicos para audit):', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor ao processar imagem'
    });
  }
}

// Configuração para Next.js API routes
export const config = {
  api: {
    bodyParser: false, // Desabilitar o parser padrão para usar multer
  },
};