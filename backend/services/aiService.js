import { ENV } from '../config/env.js';
import { isSupabaseConfigured, getServiceClient } from '../config/supabase.js';
import { encryptionService } from './encryptionService.js';

/**
 * Service for AI operations.
 * Handles API key retrieval (decryption) and interaction with Gemini API.
 */
class AiService {
  /**
   * Retrieves the Gemini API Key.
   * Prioritizes ENV var, then checks database settings (encrypted).
   * @returns {Promise<string|null>} The API Key or null if not found.
   */
  async getApiKey() {
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
      
      const key = data?.integrations?.gemini_api_key;
      if (!key) return null;

      const keyString = String(key).trim();
      
      // Try to decrypt; if it fails, assume it's legacy plain text
      try {
        return encryptionService.decrypt(keyString);
      } catch (e) {
        // If decryption fails (e.g. invalid format), assume it is a legacy plain text key
        // This ensures backward compatibility while we migrate to encrypted keys.
        return keyString;
      }
    } catch {
      return null;
    }
  }

  /**
   * Generates content using Gemini API.
   * @param {string} prompt - The prompt to send.
   * @param {Object} generationConfig - Configuration for generation.
   * @returns {Promise<Object>} The API response.
   * @throws {Error} If API call fails or key is missing.
   */
  async generateContent(prompt, generationConfig) {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('Chave de API do Gemini não configurada');
    }

    const payload = {
      contents: [{ parts: [{ text: String(prompt) }]}],
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4000,
        ...(generationConfig || {})
      }
    };
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const maxRetries = 3;
    let lastJson = {};
    let lastError = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        const json = await resp.json().catch(() => ({}));
        lastJson = json;
        
        if (resp.status === 429 && attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 2000 * Math.pow(1.5, attempt)));
          continue;
        }
        
        if (!resp.ok) {
          const errorMsg = json?.error?.message || 'Erro Gemini';
          const error = new Error(errorMsg);
          error.details = json;
          error.status = resp.status;
          throw error;
        }
        
        return json;
      } catch (err) {
        lastError = err;
        if (attempt === maxRetries) break;
      }
    }
    
    if (lastError && lastError.status) {
        throw lastError;
    }
    
    // Default fallback if loop finishes without specific error throw
    const error = new Error('Limite excedido ou erro de conexão');
    error.status = 429;
    error.details = lastJson;
    throw error;
  }
}

export const aiService = new AiService();
