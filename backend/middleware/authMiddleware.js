import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { isSupabaseConfigured, getServiceClient } from '../config/supabase.js';

const verifyJwt = (token) => {
  try {
    return jwt.verify(token, ENV.JWT_SECRET);
  } catch (e) {
    return null;
  }
};

const validateCsrf = (req) => {
  const token = req.headers['x-csrf-token'];
  const cookieToken = req.cookies['csrf_token'];
  // Em desenvolvimento, as vezes os cookies não vem se não tiver credentials: true no fetch.
  // Vamos assumir que o frontend manda corretamente.
  return token && cookieToken && token === cookieToken;
};

export const authMiddleware = async (req, res, next) => {
  try {
    // 1. Verificar Dev Bypass
    if (ENV.DEV_AUTH_BYPASS || !isSupabaseConfigured) {
      req.admin = { 
        id: 'dev-admin', 
        email: 'dev@local', 
        name: 'Dev Admin', 
        role: 'super_admin', 
        active: true 
      };
      
      // CSRF Check em Dev
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
         if (!validateCsrf(req)) {
             // Se estiver em modo dev total, talvez ignorar CSRF?
             // Melhor manter o padrão: se enviou request, tem que ter token.
             // Mas se for via Postman/Curl em dev?
             // Vou permitir passar se tiver header especial ou apenas logar aviso.
             // Pela segurança, vou manter a validação, mas o frontend tem que mandar.
             // Se falhar em dev, o dev percebe.
             if (!validateCsrf(req)) {
                console.warn('[AUTH] Falha de CSRF em modo DEV');
                return res.status(403).json({ success: false, error: 'Token CSRF inválido ou ausente' });
             }
         }
      }
      return next();
    }

    // 2. Auth Real
    const token = req.cookies[ENV.ADMIN_COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Não autorizado' });
    }

    const payload = verifyJwt(token);
    if (!payload) {
      res.clearCookie(ENV.ADMIN_COOKIE_NAME, { path: '/' });
      return res.status(401).json({ success: false, error: 'Token inválido' });
    }

    // Validar usuário no Supabase
    const supabase = getServiceClient();
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', payload.id)
      .single();

    if (error || !adminUser || !adminUser.active) {
      res.clearCookie(ENV.ADMIN_COOKIE_NAME, { path: '/' });
      return res.status(401).json({ success: false, error: 'Usuário inválido ou inativo' });
    }

    // Verificar expiração da sessão (24h) - Opcional se JWT já expira
    // O original tinha essa lógica?
    // "const lastLogin = new Date(adminUser.last_login); if (new Date() - lastLogin > 24..."
    // Vou manter.
    if (adminUser.last_login) {
        const lastLogin = new Date(adminUser.last_login);
        const oneDay = 24 * 60 * 60 * 1000;
        if (new Date() - lastLogin > oneDay) {
            res.clearCookie(ENV.ADMIN_COOKIE_NAME, { path: '/' });
            return res.status(401).json({ success: false, error: 'Sessão expirada' });
        }
    }

    req.admin = adminUser;

    // Validar CSRF para métodos de mutação
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      if (!validateCsrf(req)) {
        return res.status(403).json({ success: false, error: 'Token CSRF inválido ou ausente' });
      }
    }

    next();
  } catch (err) {
    console.error('Erro no authMiddleware:', err);
    res.clearCookie(ENV.ADMIN_COOKIE_NAME, { path: '/' });
    return res.status(401).json({ success: false, error: 'Não autorizado' });
  }
};
