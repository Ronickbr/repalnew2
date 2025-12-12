import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

// Carregar variáveis de ambiente (.env ou fallback .env.production)
try {
  const envPath = fs.existsSync(path.join(process.cwd(), '.env'))
    ? path.join(process.cwd(), '.env')
    : (fs.existsSync(path.join(process.cwd(), '.env.production'))
        ? path.join(process.cwd(), '.env.production')
        : undefined);
  if (envPath) dotenv.config({ path: envPath });
  else dotenv.config();
} catch {
  dotenv.config();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token']
}));
app.use(cookieParser());
app.use(express.json());

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Utilitário: cliente Supabase com chave de serviço (bypassa RLS)
const getServiceClient = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Variáveis de ambiente do Supabase não configuradas (URL ou SERVICE ROLE KEY)');
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
};

const isSupabaseConfigured = Boolean(process.env.VITE_SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY));
const devAuthBypass = process.env.VITE_DEV_AUTH_BYPASS === 'true' || process.env.VITE_DEV_AUTH_BYPASS === true;

// Config JWT e CSRF
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';
const CSRF_COOKIE_NAME = 'csrf_token';
const ADMIN_COOKIE_NAME = 'admin_token';

const setAuthCookie = (res, token) => {
  res.cookie(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: false,
    path: '/',
    maxAge: 1000 * 60 * 60 * 2
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie(ADMIN_COOKIE_NAME, { path: '/' });
};

const issueJwt = (user) => {
  return jwt.sign({
    sub: user.id,
    email: user.email,
    role: user.role
  }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const verifyJwt = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

const issueCsrfToken = () => {
  const raw = Math.random().toString(36).slice(2) + Date.now().toString(36);
  return raw;
};

// Utilitário: validar token legado (base64 id:timestamp) OU JWT
const validateAdminToken = async (token) => {
  if (devAuthBypass || !isSupabaseConfigured) {
    return {
      id: 'dev-admin',
      email: 'dev@local',
      name: 'Dev Admin',
      role: 'super_admin',
      active: true,
    };
  }
  if (!token || typeof token !== 'string') return null;
  try {
    // Primeiro tenta JWT
    const jwtPayload = verifyJwt(token);
    if (jwtPayload && jwtPayload.sub) {
      const supabase = getServiceClient();
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, email, name, role, active')
        .eq('id', jwtPayload.sub)
        .eq('active', true)
        .maybeSingle();
      if (error) return null;
      return data || null;
    }
    // Legado base64 id:timestamp
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    const adminId = parts[0];
    if (!adminId) return null;
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, name, role, active')
      .eq('id', adminId)
      .eq('active', true)
      .maybeSingle();
    if (error) return null;
    return data || null;
  } catch {
    return null;
  }
};

// Middleware: autenticar por cookie e validar CSRF em métodos mutáveis
const authMiddleware = async (req, res, next) => {
  try {
    // Identidade
    if (devAuthBypass || !isSupabaseConfigured) {
      req.admin = { id: 'dev-admin', email: 'dev@local', name: 'Dev Admin', role: 'super_admin', active: true };
    } else {
      const token = req.cookies[ADMIN_COOKIE_NAME];
      if (!token) return res.status(401).json({ success: false, error: 'Não autorizado' });
      const payload = verifyJwt(token);
      if (!payload) return res.status(401).json({ success: false, error: 'Token inválido' });
      const supabase = getServiceClient();
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, email, name, role, active')
        .eq('id', payload.sub)
        .eq('active', true)
        .maybeSingle();
      if (error || !data) return res.status(401).json({ success: false, error: 'Usuário inválido/inativo' });
      req.admin = data;
    }

    // CSRF: validar em métodos que alteram estado
    const method = req.method.toUpperCase();
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const cookieToken = req.cookies[CSRF_COOKIE_NAME];
      const headerToken = req.headers['x-csrf-token'];
      if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({ success: false, error: 'CSRF inválido' });
      }
    }
    next();
  } catch (e) {
    return res.status(401).json({ success: false, error: 'Não autorizado' });
  }
};

const requireRole = (roles) => (req, res, next) => {
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!req.admin || !allowed.includes(req.admin.role)) {
    return res.status(403).json({ success: false, error: 'Permissão negada' });
  }
  next();
};

// Logging de atividades administrativas
const logAdminActivity = async (admin, action, details = {}) => {
  try {
    if (!isSupabaseConfigured) return;
    const supabase = getServiceClient();
    await supabase.from('activity_logs').insert([{
      admin_id: admin.id,
      action,
      details,
      created_at: new Date().toISOString()
    }]);
  } catch {}
};

// Endpoints de autenticação
app.get('/api/auth/csrf-token', (req, res) => {
  const csrf = issueCsrfToken();
  res.cookie(CSRF_COOKIE_NAME, csrf, { sameSite: 'strict', secure: false, httpOnly: false, path: '/' });
  res.json({ success: true, csrfToken: csrf });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email e senha obrigatórios' });

    if (devAuthBypass || !isSupabaseConfigured) {
      const devUser = { id: 'dev-admin', email: email || 'dev@local', name: 'Dev Admin', role: 'super_admin', active: true };
      const token = issueJwt(devUser);
      setAuthCookie(res, token);
      await logAdminActivity(devUser, 'login_dev', { email });
      return res.json({ success: true, requires2fa: false });
    }

    const supabase = getServiceClient();
    const emailLower = String(email).toLowerCase();
    let { data: userData, error: userError } = await supabase
      .from('admin_users')
      .select('id, email, password_hash, name, role, active, totp_secret')
      .eq('email', emailLower)
      .eq('active', true)
      .maybeSingle();
    if (userError || !userData) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
    }

    const hashed = typeof userData.password_hash === 'string' && userData.password_hash.startsWith('$2');
    const valid = hashed ? await bcrypt.compare(password, userData.password_hash) : userData.password_hash === password;
    if (!valid) return res.status(401).json({ success: false, error: 'Credenciais inválidas' });

    const baseUser = { id: userData.id, email: userData.email, name: userData.name, role: userData.role, active: userData.active };
    // Se 2FA habilitado
    if (userData.totp_secret && String(userData.totp_secret).trim()) {
      const tempToken = jwt.sign({ stage: '2fa', sub: baseUser.id }, JWT_SECRET, { expiresIn: '5m' });
      return res.json({ success: true, requires2fa: true, tempToken });
    }
    // Login direto
    const token = issueJwt(baseUser);
    setAuthCookie(res, token);
    await logAdminActivity(baseUser, 'login', { email });
    return res.json({ success: true, requires2fa: false });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

app.post('/api/auth/verify-2fa', async (req, res) => {
  try {
    const { tempToken, code } = req.body || {};
    if (!tempToken || !code) return res.status(400).json({ success: false, error: 'Token temporário e código obrigatórios' });
    const payload = verifyJwt(tempToken);
    if (!payload || payload.stage !== '2fa') return res.status(401).json({ success: false, error: 'Token inválido' });
    const supabase = getServiceClient();
    const { data: userData, error } = await supabase
      .from('admin_users')
      .select('id, email, name, role, active, totp_secret')
      .eq('id', payload.sub)
      .eq('active', true)
      .maybeSingle();
    if (error || !userData) return res.status(401).json({ success: false, error: 'Usuário inválido/inativo' });

    const verified = speakeasy.totp.verify({
      secret: String(userData.totp_secret || ''),
      encoding: 'base32',
      token: String(code)
    });
    if (!verified) return res.status(401).json({ success: false, error: 'Código 2FA inválido' });

    const baseUser = { id: userData.id, email: userData.email, name: userData.name, role: userData.role, active: userData.active };
    const token = issueJwt(baseUser);
    setAuthCookie(res, token);
    await logAdminActivity(baseUser, 'login_2fa', {});
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    if (devAuthBypass || !isSupabaseConfigured) {
      return res.json({ success: true, data: { id: 'dev-admin', email: 'dev@local', name: 'Dev Admin', role: 'super_admin', active: true } });
    }
    const token = req.cookies[ADMIN_COOKIE_NAME];
    if (!token) return res.status(401).json({ success: false, error: 'Não autorizado' });
    const payload = verifyJwt(token);
    if (!payload) return res.status(401).json({ success: false, error: 'Token inválido' });
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, name, role, active')
      .eq('id', payload.sub)
      .eq('active', true)
      .maybeSingle();
    if (error || !data) return res.status(401).json({ success: false, error: 'Usuário inválido/inativo' });
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
});

// Habilitar 2FA para o administrador atual
app.post('/api/auth/2fa/enroll', authMiddleware, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    if (devAuthBypass || !isSupabaseConfigured) {
      return res.status(400).json({ success: false, error: '2FA não disponível no modo dev/bypass' });
    }
    const admin = req.admin;
    const supabase = getServiceClient();
    const secret = speakeasy.generateSecret({ length: 20 });
    const otpauth = secret.otpauth_url || `otpauth://totp/RepalAdmin:${admin.email}?secret=${secret.base32}&issuer=RepalAdmin`;
    // Armazenar o segredo base32 na tabela
    const { error } = await supabase
      .from('admin_users')
      .update({ totp_secret: secret.base32 })
      .eq('id', admin.id);
    if (error) return res.status(500).json({ success: false, error: error.message });
    const qrDataUrl = await qrcode.toDataURL(otpauth);
    await logAdminActivity(admin, 'enable_2fa', {});
    return res.json({ success: true, secret: secret.base32, otpauth, qr: qrDataUrl });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// Endpoint: criar produto com chave de serviço, validando token admin
app.post('/api/admin/products', authMiddleware, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const adminUser = req.admin;

    const { product, additionalImages } = req.body || {};
    if (!product || !product.name || !product.category_id) {
      return res.status(400).json({ success: false, error: 'Dados do produto inválidos' });
    }

    if (!isSupabaseConfigured) {
      const fake = { ...product, id: Math.floor(Math.random() * 1000000), created_at: new Date().toISOString() };
      await logAdminActivity(adminUser, 'create_product_dev', { product_id: fake.id });
      return res.json({ success: true, data: fake });
    }
    const supabase = getServiceClient();
    // Inserir produto
    const { data: inserted, error: insertError } = await supabase
      .from('products')
      .insert([product])
      .select('*')
      .single();
    if (insertError) {
      return res.status(500).json({ success: false, error: insertError.message, code: insertError.code, details: insertError.details, hint: insertError.hint });
    }

    // Inserir imagens adicionais, se houver
    if (Array.isArray(additionalImages) && additionalImages.length > 0) {
      const records = additionalImages.filter(Boolean).map((url, idx) => ({
        product_id: inserted.id,
        url,
        sort_order: idx
      }));
      if (records.length > 0) {
        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(records);
        if (imagesError) {
          // Não falhar o request por causa das imagens; retornar aviso
          return res.status(200).json({ success: true, data: inserted, images_warning: imagesError.message });
        }
      }
    }

    await logAdminActivity(adminUser, 'create_product', { product_id: inserted.id });
    return res.json({ success: true, data: inserted });
  } catch (err) {
    return res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro interno' });
  }
});

app.post('/api/admin/brands', authMiddleware, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const adminUser = req.admin;
    const { brand } = req.body || {};
    if (!brand || !brand.name || !brand.slug) {
      return res.status(400).json({ success: false, error: 'Dados da marca inválidos' });
    }
    if (!isSupabaseConfigured) {
      const fake = { ...brand, id: `dev-${Math.random().toString(36).slice(2)}`, created_at: new Date().toISOString() };
      await logAdminActivity(adminUser, 'create_brand_dev', { brand_id: fake.id });
      return res.json({ success: true, data: fake });
    }
    const supabase = getServiceClient();
    const { data: inserted, error: insertError } = await supabase
      .from('brands')
      .insert([brand])
      .select('*')
      .single();
    if (insertError) {
      return res.status(500).json({ success: false, error: insertError.message, code: insertError.code, details: insertError.details, hint: insertError.hint });
    }
    await logAdminActivity(adminUser, 'create_brand', { brand_id: inserted.id });
    return res.json({ success: true, data: inserted });
  } catch (err) {
    return res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro interno' });
  }
});

app.put('/api/admin/brands/:id', authMiddleware, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const adminUser = req.admin;
    const id = req.params.id;
    const { brand } = req.body || {};
    if (!id || !brand || Object.keys(brand).length === 0) {
      return res.status(400).json({ success: false, error: 'Dados da marca inválidos' });
    }
    if (!isSupabaseConfigured) {
      const fake = { id, ...brand, updated_at: new Date().toISOString() };
      await logAdminActivity(adminUser, 'update_brand_dev', { brand_id: id });
      return res.json({ success: true, data: fake });
    }
    const supabase = getServiceClient();
    const { data: updated, error: updateError } = await supabase
      .from('brands')
      .update(brand)
      .eq('id', id)
      .select('*')
      .single();
    if (updateError) {
      return res.status(500).json({ success: false, error: updateError.message, code: updateError.code, details: updateError.details, hint: updateError.hint });
    }
    await logAdminActivity(adminUser, 'update_brand', { brand_id: id });
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro interno' });
  }
});

app.delete('/api/admin/brands/:id', authMiddleware, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const adminUser = req.admin;
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }
    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'delete_brand_dev', { brand_id: id });
      return res.json({ success: true });
    }
    const supabase = getServiceClient();
    const { error: deleteError } = await supabase
      .from('brands')
      .delete()
      .eq('id', id);
    if (deleteError) {
      return res.status(500).json({ success: false, error: deleteError.message, code: deleteError.code, details: deleteError.details, hint: deleteError.hint });
    }
    await logAdminActivity(adminUser, 'delete_brand', { brand_id: id });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro interno' });
  }
});

app.post('/api/admin/brands/bulk-delete', authMiddleware, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const adminUser = req.admin;
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Lista de IDs inválida' });
    }
    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'bulk_delete_brand_dev', { count: ids.length });
      return res.json({ success: true, deleted: ids.length });
    }
    const supabase = getServiceClient();
    const { error: deleteError } = await supabase
      .from('brands')
      .delete()
      .in('id', ids);
    if (deleteError) {
      return res.status(500).json({ success: false, error: deleteError.message, code: deleteError.code, details: deleteError.details, hint: deleteError.hint });
    }
    await logAdminActivity(adminUser, 'bulk_delete_brand', { count: ids.length });
    return res.json({ success: true, deleted: ids.length });
  } catch (err) {
    return res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro interno' });
  }
});

app.post('/api/admin/banners', authMiddleware, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const adminUser = req.admin;
    const { banner } = req.body || {};
    if (!banner || !banner.title) {
      return res.status(400).json({ success: false, error: 'Dados do banner inválidos' });
    }
    if (!isSupabaseConfigured) {
      const fake = { ...banner, id: Math.floor(Math.random() * 1000000), created_at: new Date().toISOString() };
      await logAdminActivity(adminUser, 'create_banner_dev', { banner_id: fake.id });
      return res.json({ success: true, data: fake });
    }
    const supabase = getServiceClient();
    const { data: inserted, error: insertError } = await supabase
      .from('banners')
      .insert([banner])
      .select('*')
      .single();
    if (insertError) {
      return res.status(500).json({ success: false, error: insertError.message, code: insertError.code, details: insertError.details, hint: insertError.hint });
    }
    await logAdminActivity(adminUser, 'create_banner', { banner_id: inserted.id });
    return res.json({ success: true, data: inserted });
  } catch (err) {
    return res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro interno' });
  }
});

app.put('/api/admin/banners/:id', authMiddleware, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const adminUser = req.admin;
    const id = req.params.id;
    const { banner } = req.body || {};
    if (!id || !banner || Object.keys(banner).length === 0) {
      return res.status(400).json({ success: false, error: 'Dados do banner inválidos' });
    }
    if (!isSupabaseConfigured) {
      const fake = { id: Number(id), ...banner, updated_at: new Date().toISOString() };
      await logAdminActivity(adminUser, 'update_banner_dev', { banner_id: id });
      return res.json({ success: true, data: fake });
    }
    const supabase = getServiceClient();
    const { data: updated, error: updateError } = await supabase
      .from('banners')
      .update(banner)
      .eq('id', id)
      .select('*')
      .single();
    if (updateError) {
      return res.status(500).json({ success: false, error: updateError.message, code: updateError.code, details: updateError.details, hint: updateError.hint });
    }
    await logAdminActivity(adminUser, 'update_banner', { banner_id: id });
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro interno' });
  }
});

app.delete('/api/admin/banners/:id', authMiddleware, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const adminUser = req.admin;
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }
    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'delete_banner_dev', { banner_id: id });
      return res.json({ success: true });
    }
    const supabase = getServiceClient();
    const { error: deleteError } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);
    if (deleteError) {
      return res.status(500).json({ success: false, error: deleteError.message, code: deleteError.code, details: deleteError.details, hint: deleteError.hint });
    }
    await logAdminActivity(adminUser, 'delete_banner', { banner_id: id });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro interno' });
  }
});

app.post('/api/admin/banners/bulk-delete', authMiddleware, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const adminUser = req.admin;
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Lista de IDs inválida' });
    }
    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'bulk_delete_banner_dev', { count: ids.length });
      return res.json({ success: true, deleted: ids.length });
    }
    const supabase = getServiceClient();
    const { error: deleteError } = await supabase
      .from('banners')
      .delete()
      .in('id', ids);
    if (deleteError) {
      return res.status(500).json({ success: false, error: deleteError.message, code: deleteError.code, details: deleteError.details, hint: deleteError.hint });
    }
    await logAdminActivity(adminUser, 'bulk_delete_banner', { count: ids.length });
    return res.json({ success: true, deleted: ids.length });
  } catch (err) {
    return res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro interno' });
  }
});

// Rotas da API
// Endpoint para obter chaves de integrações
app.get('/api/integrations', async (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.json({
        success: true,
        data: {
          google_analytics_id: '',
          google_tag_manager_id: '',
          facebook_pixel_id: ''
        }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase
      .from('site_settings')
      .select('integrations')
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ success: false, error: error.message });
    }

    const integrations = (data && data.integrations) || {};

    const response = {
      google_analytics_id: integrations.google_analytics_id || '',
      google_tag_manager_id: integrations.google_tag_manager_id || '',
      facebook_pixel_id: integrations.facebook_pixel_id || '',
    };

    return res.json({ success: true, data: response });
  } catch (err) {
    return res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro interno' });
  }
});

// Configurar multer para armazenamento em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Permitir qualquer tipo que comece com image/
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado'), false);
    }
  }
});

// Função para gerar nome único do arquivo
const generateFileName = (originalName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalName).toLowerCase();
  return `produto_${timestamp}_${randomString}${extension}`;
};

// Função para garantir que o diretório existe
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Rota de upload de imagem
app.options('/api/upload-image', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return res.status(200).end();
});
app.post('/api/upload-image', authMiddleware, requireRole(['admin', 'super_admin']), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Caminho para a pasta img no diretório public
    const publicDir = path.join(__dirname, 'public');
    const imgDir = path.join(publicDir, 'img');
    
    // Garantir que o diretório existe
    ensureDirectoryExists(imgDir);

    // Gerar nome único para o arquivo
    const fileName = generateFileName(req.file.originalname);
    const filePath = path.join(imgDir, fileName);

    // Salvar o arquivo
    fs.writeFileSync(filePath, req.file.buffer);

    // Retornar a URL local
    const imageUrl = `/img/${fileName}`;

    // Imagem salva com sucesso

    await logAdminActivity(req.admin, 'upload_image', { fileName });
    res.status(200).json({
      success: true,
      imageUrl,
      message: 'Imagem salva com sucesso'
    });

  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande. Máximo 5MB.' });
    }
    
    if (error.message === 'Tipo de arquivo não suportado') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

app.post('/api/seo/robots', authMiddleware, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { content } = req.body || {};
    const publicDir = path.join(__dirname, 'public');
    ensureDirectoryExists(publicDir);
    const filePath = path.join(publicDir, 'robots.txt');
    fs.writeFileSync(filePath, typeof content === 'string' ? content : '');
    await logAdminActivity(req.admin, 'update_robots', {});
    res.json({ success: true, path: '/robots.txt' });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro interno' });
  }
});

app.post('/api/seo/sitemap', authMiddleware, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { enabled, baseUrl, content } = req.body || {};
    const publicDir = path.join(__dirname, 'public');
    ensureDirectoryExists(publicDir);
    const filePath = path.join(publicDir, 'sitemap.xml');

    if (!enabled) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await logAdminActivity(req.admin, 'disable_sitemap', {});
      return res.json({ success: true, enabled: false });
    }

    if (typeof content === 'string' && content.trim() !== '') {
      fs.writeFileSync(filePath, content);
      await logAdminActivity(req.admin, 'update_sitemap_custom', { size: content.length });
    } else {
      const xml = await generateSitemap(baseUrl);
      fs.writeFileSync(filePath, xml);
      await logAdminActivity(req.admin, 'generate_sitemap', { baseUrl: (baseUrl || '').trim() });
    }
    res.json({ success: true, enabled: true, path: '/sitemap.xml' });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro interno' });
  }
});

// Middleware de tratamento de erros do multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande. Máximo 5MB.' });
    }
  }
  
  if (error.message === 'Tipo de arquivo não suportado') {
    return res.status(400).json({ error: error.message });
  }
  
  console.error('Erro não tratado:', error);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'API funcionando!' });
});

// Sitemap e Robots dinâmicos
const getAnonClient = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;
  return createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
};

const getCanonicalBaseUrl = async () => {
  try {
    const anon = getAnonClient();
    if (!anon) return 'http://localhost:5173';
    const { data } = await anon
      .from('site_settings')
      .select('seo')
      .limit(1)
      .single();
    const url = data?.seo?.canonical_url || '';
    const trimmed = (url || '').trim().replace(/\/+$/, '');
    return trimmed || 'http://localhost:5173';
  } catch {
    return 'http://localhost:5173';
  }
};

const generateSitemap = async (originOverride) => {
  const origin = (typeof originOverride === 'string' && originOverride.trim())
    ? originOverride.trim().replace(/\/+$/, '')
    : await getCanonicalBaseUrl();
  const now = new Date().toISOString();
  const anon = getAnonClient();
  let urls = [
    { loc: `${origin}/`, changefreq: 'weekly', priority: '1.0', lastmod: now },
    { loc: `${origin}/categorias`, changefreq: 'weekly', priority: '0.8', lastmod: now },
  ];
  try {
    if (anon) {
      const { data: categories } = await anon
        .from('categories')
        .select('id, slug, parent_id, updated_at, active')
        .eq('active', true)
        .limit(50000);
      const { data: products } = await anon
        .from('products')
        .select('slug, updated_at, active')
        .eq('active', true)
        .limit(50000);
      const byId = new Map();
      for (const c of categories || []) {
        byId.set(c.id, c);
      }
      for (const c of categories || []) {
        const lastmod = c.updated_at || now;
        if (!c.parent_id) {
          urls.push({ loc: `${origin}/categorias/${c.slug}`, changefreq: 'weekly', priority: '0.6', lastmod });
        } else {
          const parent = c.parent_id ? byId.get(c.parent_id) : null;
          if (parent?.slug) {
            urls.push({ loc: `${origin}/categorias/${parent.slug}/${c.slug}`, changefreq: 'weekly', priority: '0.6', lastmod });
          } else {
            urls.push({ loc: `${origin}/categorias/${c.slug}`, changefreq: 'weekly', priority: '0.6', lastmod });
          }
        }
      }
      for (const p of products || []) {
        const lastmod = p.updated_at || now;
        urls.push({ loc: `${origin}/produto/${p.slug}`, changefreq: 'weekly', priority: '0.7', lastmod });
      }
    }
  } catch {}
  const urlsXml = urls
    .map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`)
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>`;
  return xml;
};

app.get('/sitemap.xml', async (req, res) => {
  try {
    const sitemapPath = path.join(__dirname, 'public', 'sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
      const content = fs.readFileSync(sitemapPath, 'utf-8');
      res.type('application/xml').send(content);
    } else {
      const xml = await generateSitemap();
      res.type('application/xml').send(xml);
    }
  } catch {
    res.status(500).type('text/plain').send('Erro ao gerar sitemap');
  }
});

app.get('/robots.txt', async (req, res) => {
  try {
    const origin = await getCanonicalBaseUrl();
    const robotsPath = path.join(__dirname, 'public', 'robots.txt');
    if (fs.existsSync(robotsPath)) {
      const content = fs.readFileSync(robotsPath, 'utf-8');
      res.type('text/plain').send(content);
    } else {
      res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml`);
    }
  } catch {
    res.type('text/plain').send('User-agent: *\nAllow: /');
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de upload iniciado em http://localhost:${PORT}`);
});

// Tratar erros do servidor
app.on('error', (err) => {
  console.error('Erro no servidor Express:', err);
});

export default app;
