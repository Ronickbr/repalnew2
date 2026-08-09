import app from '../../backend/app.js';

// Handler serverless para /api/auth/* (login, csrf-token, me, logout, 2fa).
// Na Vercel, o catch-all raiz api/[...all].js só casa segmento único; namespaces
// com subdiretório precisam de catch-all próprio.
function handler(req, res) {
  if (req.url && req.url !== '/' && !req.url.startsWith('/api')) {
    req.url = `/api${req.url}`;
  }
  req.originalUrl = req.url;
  return app(req, res);
}

export default handler;
