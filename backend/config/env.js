import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3001,
  FRONTEND_URL: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173'),
  SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  ADMIN_COOKIE_NAME: 'repal_admin_token',
  DEV_AUTH_BYPASS: process.env.DEV_AUTH_BYPASS === 'true',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
};

// Validação de Segurança para Produção
if (ENV.NODE_ENV === 'production') {
  if (ENV.JWT_SECRET === 'dev-secret-change-me') {
    console.warn('⚠️  ALERTA DE SEGURANÇA: JWT_SECRET padrão detectado em ambiente de produção!');
  }
  if (ENV.DEV_AUTH_BYPASS) {
    console.warn('⚠️  ALERTA DE SEGURANÇA: DEV_AUTH_BYPASS habilitado em ambiente de produção!');
  }
  if (!ENV.ENCRYPTION_KEY) {
    console.warn('⚠️  ALERTA DE SEGURANÇA: ENCRYPTION_KEY não configurada em produção!');
  }
}
