import app from '../../backend/app.js';

// Handler serverless para /api/admin/* (products, brands, banners, categories,
// settings, leads, users, dashboard). Catch-all por diretório (necessário na Vercel).
function handler(req, res) {
  if (req.url && req.url !== '/' && !req.url.startsWith('/api')) {
    req.url = `/api${req.url}`;
  }
  req.originalUrl = req.url;
  return app(req, res);
}

export default handler;
