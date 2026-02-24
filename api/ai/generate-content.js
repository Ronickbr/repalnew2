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
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      res.status(400).json({ success: false, error: 'Chave de API da IA não configurada' });
      return;
    }
    const model = (generationConfig && generationConfig.model) || 'google/gemini-2.0-flash-001';
    
    const payload = {
      model: model,
      messages: [
        {
          role: 'user',
          content: String(prompt)
        }
      ],
      temperature: (generationConfig && generationConfig.temperature) || 0.8,
      top_p: (generationConfig && generationConfig.topP) || 0.95,
      max_tokens: (generationConfig && generationConfig.maxOutputTokens) || 4000
    };
    
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    
    const r = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.FRONTEND_URL || 'https://repalmarechal.com.br',
        'X-Title': 'Repal New Admin'
      },
      body: JSON.stringify(payload)
    });
    const json = await r.json().catch(() => ({}));
    if (r.status === 429) {
      res.status(429).json({ success: false, error: 'Limite de requisições excedido. Tente novamente mais tarde', details: json });
      return;
    }
    if (!r.ok) {
      const msg = json?.error?.message || `Erro na API da IA (HTTP ${r.status})`;
      res.status(r.status).json({ success: false, error: msg, details: json });
      return;
    }
    
    // Adapt OpenRouter response to Gemini format expected by frontend
    const content = json.choices?.[0]?.message?.content || '';
    const adaptedResponse = {
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
    
    res.status(200).json(adaptedResponse);
  } catch {
    res.status(500).json({ success: false, error: 'Erro interno ao gerar conteúdo com IA' });
  }
}
