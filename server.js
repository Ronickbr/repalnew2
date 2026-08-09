import 'dotenv/config';
import { ENV } from './backend/config/env.js';
import app from './backend/app.js';

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
