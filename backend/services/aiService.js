import { ENV } from '../config/env.js';
import { isSupabaseConfigured, getServiceClient } from '../config/supabase.js';

/**
 * Service for AI operations using OpenRouter.
 * Handles API key retrieval and interaction with OpenRouter API.
 */
class AiService {
  /**
   * Retrieves the OpenRouter API Key.
   * Prioritizes ENV var (OPENROUTER_API_KEY), then checks database settings.
   * @returns {Promise<string|null>} The API Key or null if not found.
   */
  async getApiKey() {
    // Check for OpenRouter Key in ENV first
    const openRouterKey = ENV.OPENROUTER_API_KEY?.trim();
    if (openRouterKey) {
      return openRouterKey;
    }
    
    // Check for Gemini Key in ENV as fallback (for backward compatibility)
    const geminiKey = ENV.GEMINI_API_KEY?.trim();
    if (geminiKey) {
      console.log('Using Gemini API Key from ENV (Fallback)');
      return geminiKey;
    }

    console.warn('No API Key found in ENV for AI Service');
    return null;
  }

  /**
   * Retrieves the OpenRouter Model.
   * Prioritizes generationConfig, then ENV (OPENROUTER_MODEL), then checks database settings.
   * Defaults to 'google/gemini-2.0-flash-001'.
   * @param {Object} generationConfig - Configuration for generation.
   * @returns {Promise<string>} The Model ID.
   */
  async getModel(generationConfig) {
    if (generationConfig?.model) {
      return generationConfig.model;
    }

    const envModel = ENV.OPENROUTER_MODEL?.trim();
    if (envModel) {
      return envModel;
    }

    try {
      if (!isSupabaseConfigured) return 'google/gemini-2.0-flash-001';
      const supabase = getServiceClient();
      const { data, error } = await supabase
        .from('site_settings')
        .select('integrations')
        .single();

      if (error) return 'google/gemini-2.0-flash-001';
      
      const openRouterModel = data?.integrations?.openrouter_model;
      if (openRouterModel && String(openRouterModel).trim()) {
        return String(openRouterModel).trim();
      }
    } catch (err) {
      console.error('Error fetching model from DB:', err);
    }

    return 'google/gemini-2.0-flash-001';
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
      throw new Error('Chave de API da IA (OpenRouter) não configurada');
    }

    // Determine model to use
    const model = await this.getModel(generationConfig);

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
      // OpenRouter uses max_tokens, Gemini uses maxOutputTokens
      max_tokens: generationConfig?.maxOutputTokens || 4000
    };
    
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    const maxRetries = 3;
    const baseDelay = 2000;
    
    let lastJson = {};
    let lastError = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': ENV.FRONTEND_URL || 'https://repalmarechal.com.br',
            'X-Title': 'Repal New Admin'
          },
          body: JSON.stringify(payload)
        });
        
        const json = await resp.json().catch(() => ({}));
        lastJson = json;
        
        if (resp.status === 429 && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(1.5, attempt);
          console.warn(`Rate limit hit (429). Retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        
        if (!resp.ok) {
          const errorMsg = json?.error?.message || `Erro na API da IA (Status: ${resp.status})`;
          const error = new Error(errorMsg);
          error.details = json;
          error.status = resp.status;
          throw error;
        }
        
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
          original_response: json
        };

      } catch (err) {
        lastError = err;
        console.error(`Attempt ${attempt + 1} failed:`, err.message);
        if (attempt === maxRetries) break;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    if (lastError) {
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
