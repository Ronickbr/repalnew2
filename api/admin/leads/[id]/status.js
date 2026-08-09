import app from '../../../../backend/app.js';

// Rota explicita para /api/admin/leads/[id]/status (necessario na Vercel: catch-all [...all] so casa um segmento).
function handler(req, res) {
  if (req.url && req.url !== '/' && !req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }
  req.originalUrl = req.url;
  return app(req, res);
}

export default handler;
