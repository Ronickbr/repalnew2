import { aiService } from '../services/aiService.js';

/**
 * Controller to handle content generation requests.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const generateContent = async (req, res) => {
  try {
    const { prompt, generationConfig } = req.body || {};
    
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'Prompt obrigatório' });
    }

    try {
      const result = await aiService.generateContent(prompt, generationConfig);
      return res.json(result);
    } catch (error) {
      console.error('Erro na geração de IA:', error);
      const statusCode = error.status || 500;
      const message = error.message || 'Erro interno ao gerar conteúdo com IA';
      
      return res.status(statusCode).json({ 
        success: false, 
        error: message, 
        details: error.details || null 
      });
    }
  } catch (err) {
    console.error('Erro não tratado no controller de IA:', err);
    return res.status(500).json({ success: false, error: 'Erro interno ao processar requisição de IA' });
  }
};
