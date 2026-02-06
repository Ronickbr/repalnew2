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

    const result = await aiService.generateContent(prompt, generationConfig);
    return res.json(result);

  } catch (err) {
    const status = err.status || 500;
    // Don't leak internal errors unless it's a known error structure
    const errorMsg = err.message || 'Erro interno IA';
    return res.status(status).json({ success: false, error: errorMsg, details: err.details });
  }
};
