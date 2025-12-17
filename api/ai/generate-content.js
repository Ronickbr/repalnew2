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
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      res.status(400).json({ success: false, error: 'Chave de API do Gemini não configurada' });
      return;
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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await r.json().catch(() => ({}));
    if (r.status === 429) {
      res.status(429).json({ success: false, error: 'Limite de requisições excedido. Tente novamente mais tarde', details: json });
      return;
    }
    if (!r.ok) {
      const msg = json?.error?.message || `Erro na API do Gemini (HTTP ${r.status})`;
      res.status(r.status).json({ success: false, error: msg, details: json });
      return;
    }
    res.status(200).json(json);
  } catch {
    res.status(500).json({ success: false, error: 'Erro interno ao gerar conteúdo com IA' });
  }
}
