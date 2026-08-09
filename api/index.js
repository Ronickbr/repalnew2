import app from '../backend/app.js';

// Handler serverless unico do Express: roteia TODO /api/* pelo app Express
// (auth, admin, ai, seo, leads, integrations, dashboard, upload, test, etc.).
// Configurado via rewrite em vercel.json:  { "source": "/api/(.*)", "destination": "/api" }
// Assim, qualquer path multi-segmento chega aqui (a rota filesystem nao casa multi-segmento).
function handler(req, res) {
  if (req.url && req.url !== '/' && !req.url.startsWith('/api')) {
    req.url = `/api${req.url}`;
  }
  req.originalUrl = req.url;
  return app(req, res);
}

export default handler;
