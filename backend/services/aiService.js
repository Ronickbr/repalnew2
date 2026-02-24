import { ENV } from '../config/env.js';
import { isSupabaseConfigured, getServiceClient } from '../config/supabase.js';
import { encryptionService } from './encryptionService.js';

/**
 * Service for AI operations.
 * Handles API key retrieval (decryption) and interaction with Gemini API.
 */
class AiService {
  /**
   * Retrieves the AI API Key.
   * Prioritizes ENV var (OPENROUTER/GEMINI), then checks database settings (encrypted).
   * @returns {Promise<string|null>} The API Key or null if not found.
   */
  async getApiKey() {
    // Check for OpenRouter Key first, then Gemini
    if (ENV.OPENROUTER_API_KEY && ENV.OPENROUTER_API_KEY.trim()) {
      return ENV.OPENROUTER_API_KEY.trim();
    }
    if (ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY.trim()) {
      return ENV.GEMINI_API_KEY.trim();
    }

    try {
      if (!isSupabaseConfigured) return null;
      const supabase = getServiceClient();
      const { data, error } = await supabase
        .from('site_settings')
        .select('integrations')
        .single();

      if (error) return null;
      
      // Use existing field for compatibility but check if it's an OpenRouter key
      const key = data?.integrations?.gemini_api_key;
      if (!key) return null;

      const keyString = String(key).trim();
      
      // Try to decrypt; if it fails, assume it's legacy plain text
      try {
        return encryptionService.decrypt(keyString);
      } catch (e) {
        // If decryption fails (e.g. invalid format), assume it is a legacy plain text key
        return keyString;
      }
    } catch {
      return null;
    }
  }

  /**
   * Generates content using OpenRouter API.
   * @param {string} prompt - The prompt to send.
   * @param {Object} generationConfig - Configuration for generation.
   * @returns {Promise<Object>} The API response adapted to Gemini format for frontend compatibility.
   * @throws {Error} If API call fails or key is missing.
   */
  async generateContent(prompt, generationConfig) {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('Chave de API da IA não configurada');
    }

    // Default to a Gemini model on OpenRouter for consistency, but allow override
    const model = generationConfig?.model || 'google/gemini-2.0-flash-001';

    const payload = {
      model: model,
      messages: [
        {
          role: 'user',
          content: String(prompt)
        }
      ],
      temperature: generationConfig?.temperature || 0.8,
      top_p: generationConfig?.topP || 0.95,
      max_tokens: generationConfig?.maxOutputTokens || 4000
    };
    
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    
    const maxRetries = 3;
    let lastJson = {};
    let lastError = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': ENV.FRONTEND_URL || 'https://repalmarechal.com.br', // Site URL for OpenRouter rankings
            'X-Title': 'Repal New Admin' // Site title for OpenRouter rankings
          },
          body: JSON.stringify(payload)
        });
        
        const json = await resp.json().catch(() => ({}));
        lastJson = json;
        
        if (resp.status === 429 && attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 2000 * Math.pow(1.5, attempt)));
          continue;
        }
        
        if (!resp.ok) {
          const errorMsg = json?.error?.message || 'Erro na API da IA (OpenRouter)';
          const error = new Error(errorMsg);
          error.details = json;
          error.status = resp.status;
          throw error;
        }
        
        // Adapt OpenRouter response to Gemini format expected by frontend
        // OpenRouter: { choices: [{ message: { content: "..." } }] }
        // Gemini: { candidates: [{ content: { parts: [{ text: "..." }] } }] }
        
        const content = json.choices?.[0]?.message?.content || '';
        
        return {
          candidates: [
            {
              content: {
                parts: [
                  { text: content }
                ]
              }
            }
          ],
          original_response: json // Keep original for debugging if needed
        };

      } catch (err) {
        lastError = err;
        if (attempt === maxRetries) break;
      }
    }
    
    if (lastError && lastError.status) {
        throw lastError;
    }
    
    // Default fallback if loop finishes without specific error throw
    const error = new Error('Limite excedido ou erro de conexão com a IA');
    error.status = 429;
    error.details = lastJson;
    throw error;
  }
}

export const aiService = new AiService();
