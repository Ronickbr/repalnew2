import multer from 'multer';

export const globalErrorHandler = (error, req, res, next) => {
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
};
