import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API

// Configurar multer para armazenamento em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Permitir qualquer tipo que comece com image/
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado'), false);
    }
  }
});

// Função para gerar nome único do arquivo
const generateFileName = (originalName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalName).toLowerCase();
  return `produto_${timestamp}_${randomString}${extension}`;
};

// Função para garantir que o diretório existe
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Rota de upload de imagem
app.options('/api/upload-image', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return res.status(200).end();
});
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Caminho para a pasta img no diretório public
    const publicDir = path.join(__dirname, 'public');
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

    // Imagem salva com sucesso

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

    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// Middleware de tratamento de erros do multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande. Máximo 5MB.' });
    }
  }
  
  if (error.message === 'Tipo de arquivo não suportado') {
    return res.status(400).json({ error: error.message });
  }
  
  console.error('Erro não tratado:', error);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'API funcionando!' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de upload iniciado em http://localhost:${PORT}`);
});

// Tratar erros do servidor
app.on('error', (err) => {
  console.error('Erro no servidor Express:', err);
});

export default app;