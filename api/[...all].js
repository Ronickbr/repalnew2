import app from '../backend/app.js';

// Handler serverless catch-all raiz: roteia TODO /api/* pelo Express app
// (auth, leads públicos, SEO, integrations, dashboard, upload, test, etc.).
// Funções específicas em api/ (se existirem) têm prioridade sobre este catch-all.
function handler(req, res) {
  // Defesa: na Vercel, o catch-all pode entregar req.url sem o prefixo /api.
  if (req.url && req.url !== '/' && !req.url.startsWith('/api')) {
    req.url = `/api${req.url}`;
  }
  req.originalUrl = req.url;
  return app(req, res);
}

export default handler;
