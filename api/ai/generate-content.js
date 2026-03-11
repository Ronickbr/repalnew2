import { aiService } from '../../backend/services/aiService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Método não permitido' });
    return;
  }
  
  try {
    const body = typeof req.body === 'object' && req.body
      ? req.body
      : JSON.parse(req.rawBody || '{}');
      
    const { prompt, generationConfig } = body || {};
    
    if (!prompt || !String(prompt).trim()) {
      res.status(400).json({ success: false, error: 'Prompt obrigatório' });
      return;
    }

    try {
      const result = await aiService.generateContent(prompt, generationConfig);
      res.status(200).json(result);
    } catch (error) {
      console.error('Erro na geração de IA:', error);
      const statusCode = error.status || 500;
      const message = error.message || 'Erro interno ao gerar conteúdo com IA';
      res.status(statusCode).json({ 
        success: false, 
        error: message, 
        details: error.details || null 
      });
    }
  } catch (err) {
    console.error('Erro não tratado:', err);
    res.status(500).json({ success: false, error: 'Erro interno ao processar requisição' });
  }
}
