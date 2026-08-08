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

// Middleware Global - Segurança
const helmetDirectives = {
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'default-src': ["'self'"],
      'img-src': ["'self'", 'data:', 'blob:', 'https:', 'http://i.imgur.com', 'https://i.imgur.com'],
      'script-src': ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com', 'https://connect.facebook.net'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
      'connect-src': ["'self'", 'https:', 'wss:'],
      'frame-src': ['https://www.googletagmanager.com', 'https://www.facebook.com'],
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: ENV.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  frameguard: { action: 'sameorigin' },
  noSniff: true,
  permittedCrossDomainPolicies: { policy: 'none' },
  hidePoweredBy: true,
};
app.use(helmet(helmetDirectives));

const allowedDevOrigins = [
  ENV.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
].filter(Boolean);

const corsOptions = {
  origin: ENV.NODE_ENV === 'production'
    ? ENV.FRONTEND_URL
    : (origin, callback) => {
        if (!origin || allowedDevOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('CORS não autorizado para origem: ' + origin), false);
        }
      },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Authorization'],
  optionsSuccessStatus: 204,
  preflightContinue: false,
  maxAge: 86400,
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
