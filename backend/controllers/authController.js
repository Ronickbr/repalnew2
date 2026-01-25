import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import crypto from 'crypto';
import { ENV } from '../config/env.js';
import { isSupabaseConfigured, getServiceClient } from '../config/supabase.js';
import { logAdminActivity } from '../utils/logger.js';

// Utilitários de Auth
const setAuthCookie = (res, token) => {
  res.cookie(ENV.ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 1000 * 60 * 60 * 2 // 2 horas
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie(ENV.ADMIN_COOKIE_NAME, { path: '/' });
};

const issueJwt = (user) => {
  return jwt.sign({
    sub: user.id,
    email: user.email,
    role: user.role
  }, ENV.JWT_SECRET, { expiresIn: '2h' });
};

const issueCsrfToken = () => {
  const raw = Math.random().toString(36).slice(2) + Date.now().toString(36);
  return raw;
};

// Handlers
export const getCsrfToken = (req, res) => {
  const csrf = issueCsrfToken();
  res.cookie('csrf_token', csrf, { sameSite: 'strict', secure: false, httpOnly: false, path: '/' });
  res.json({ success: true, csrfToken: csrf });
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email e senha obrigatórios' });

    // Segurança: Bypass permitido APENAS se DEV_AUTH_BYPASS for true explicitamente
    // OU se estiver em desenvolvimento e o Supabase não estiver configurado.
    // Em produção, a falta de configuração do Supabase deve impedir o login, não liberar acesso.
    const isDev = ENV.NODE_ENV !== 'production';
    const shouldBypass = ENV.DEV_AUTH_BYPASS || (isDev && !isSupabaseConfigured);

    if (shouldBypass) {
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
      const tempToken = jwt.sign({ stage: '2fa', sub: baseUser.id }, ENV.JWT_SECRET, { expiresIn: '5m' });
      return res.json({ success: true, requires2fa: true, tempToken });
    }
    
    // Login direto
    const token = issueJwt(baseUser);
    setAuthCookie(res, token);
    await logAdminActivity(baseUser, 'login', { email });
    return res.json({ success: true, requires2fa: false });
  } catch (err) {
    console.error('Erro login:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};

export const verify2FA = async (req, res) => {
  try {
    const { tempToken, code } = req.body || {};
    if (!tempToken || !code) return res.status(400).json({ success: false, error: 'Token temporário e código obrigatórios' });
    
    let payload;
    try {
        payload = jwt.verify(tempToken, ENV.JWT_SECRET);
    } catch {
        return res.status(401).json({ success: false, error: 'Token inválido' });
    }
    
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
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};

export const getMe = async (req, res) => {
  if (!req.admin) {
      return res.status(401).json({ success: false, error: 'Não autorizado' });
  }
  
  // Limpar campos sensíveis do objeto req.admin
  // req.admin vem do banco, pode ter password_hash e totp_secret
  const { password_hash, totp_secret, ...safeUser } = req.admin;
  return res.json({ success: true, data: safeUser });
};

export const logout = (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
};

export const enroll2FA = async (req, res) => {
  try {
    if (ENV.DEV_AUTH_BYPASS || !isSupabaseConfigured) {
      return res.status(400).json({ success: false, error: '2FA não disponível no modo dev/bypass' });
    }
    const admin = req.admin;
    const supabase = getServiceClient();
    const secret = speakeasy.generateSecret({ length: 20 });
    const otpauth = secret.otpauth_url || `otpauth://totp/RepalAdmin:${admin.email}?secret=${secret.base32}&issuer=RepalAdmin`;
    
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
};
