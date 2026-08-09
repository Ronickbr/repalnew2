import app from '../../backend/app.js';

// Handler serverless para /api/ai/* (generate-content). Catch-all por diretório.
function handler(req, res) {
  if (req.url && req.url !== '/' && !req.url.startsWith('/api')) {
    req.url = `/api${req.url}`;
  }
  req.originalUrl = req.url;
  return app(req, res);
}

export default handler;
