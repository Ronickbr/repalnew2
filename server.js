import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { ENV } from './backend/config/env.js';
import { globalErrorHandler as errorHandler } from './backend/middleware/errorHandler.js';

// Importar rotas
import authRoutes from './backend/routes/authRoutes.js';
import productRoutes from './backend/routes/productRoutes.js';
import brandRoutes from './backend/routes/brandRoutes.js';
import bannerRoutes from './backend/routes/bannerRoutes.js';
import uploadRoutes from './backend/routes/uploadRoutes.js';
import seoRoutes from './backend/routes/seoRoutes.js';
import aiRoutes from './backend/routes/aiRoutes.js';
import integrationRoutes from './backend/routes/integrationRoutes.js';

// Importar controllers para rotas públicas (SEO, Sitemap, Feed)
import { getSitemap, getSitemapIndex, getSitemapGz, getRobots, getFeed } from './backend/controllers/seoController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware Global
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const corsOptions = {
  origin: ENV.NODE_ENV === 'production' ? ENV.FRONTEND_URL : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Authorization']
};

app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json());

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/admin/products', productRoutes);
app.use('/api/admin/brands', brandRoutes);
app.use('/api/admin/banners', bannerRoutes);
app.use('/api/upload-image', uploadRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/integrations', integrationRoutes);

// Rotas de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'API funcionando com nova arquitetura!' });
});

// Rotas Públicas de SEO
app.get('/sitemap.xml', getSitemap);
app.get('/sitemap_index.xml', getSitemapIndex);
app.get('/sitemap.xml.gz', getSitemapGz);
app.get('/robots.txt', getRobots);
app.get('/feed.xml', getFeed);

// Middleware de Tratamento de Erros
app.use(errorHandler);

// Iniciar Servidor
app.listen(ENV.PORT, '0.0.0.0', () => {
  if (ENV.NODE_ENV !== 'production') {
    console.log(`Servidor iniciado na porta ${ENV.PORT}`);
    console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Supabase URL: ${ENV.SUPABASE_URL ? 'Configurado' : 'Não configurado'}`);
  } else {
    console.log(`Servidor iniciado na porta ${ENV.PORT} em modo production`);
  }
});

export default app;
