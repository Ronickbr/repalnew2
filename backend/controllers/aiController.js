import { ENV } from '../config/env.js';
import { isSupabaseConfigured, getServiceClient } from '../config/supabase.js';

const getGeminiApiKey = async () => {
  if (ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY.trim()) return ENV.GEMINI_API_KEY.trim();
  try {
    if (!isSupabaseConfigured) return null;
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('site_settings')
      .select('integrations')
      .single();
    if (error) return null;
    const key = data?.integrations?.gemini_api_key;
    return key && String(key).trim() ? String(key).trim() : null;
  } catch {
    return null;
  }
};

export const generateContent = async (req, res) => {
  try {
    const { prompt, generationConfig } = req.body || {};
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'Prompt obrigatório' });
    }
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      return res.status(400).json({ success: false, error: 'Chave de API do Gemini não configurada' });
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
    
    // Retry logic simplificada
    const maxRetries = 3;
    let lastJson = {};
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
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
            return res.status(resp.status).json({ success: false, error: json?.error?.message || 'Erro Gemini', details: json });
        }
        return res.json(json);
    }
    
    return res.status(429).json({ success: false, error: 'Limite excedido', details: lastJson });

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno IA' });
  }
};
