import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { ENV } from '../config/env.js';
import { isSupabaseConfigured, getServiceClient } from '../config/supabase.js';
import { logAdminActivity } from '../utils/logger.js';

/**
 * Service for Authentication and Authorization.
 * Handles Login, 2FA, and Token generation.
 */
class AuthService {
  /**
   * Generates a JWT for the user.
   * @param {Object} user - The user object.
   * @returns {string} The signed JWT.
   */
  issueJwt(user) {
    return jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role
    }, ENV.JWT_SECRET, { expiresIn: '2h' });
  }

  /**
   * Generates a random CSRF token.
   * @returns {string} The CSRF token.
   */
  issueCsrfToken() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  /**
   * Authenticates a user.
   * @param {string} email - User email.
   * @param {string} password - User password.
   * @returns {Promise<Object>} Result object { success, requires2fa, token, tempToken, user }.
   * @throws {Error} If authentication fails.
   */
  async login(email, password) {
    if (!email || !password) {
      throw new Error('Email e senha obrigatórios');
    }

    const isDev = ENV.NODE_ENV !== 'production';
    const shouldBypass = ENV.DEV_AUTH_BYPASS || (isDev && !isSupabaseConfigured);

    if (shouldBypass) {
      const devUser = { id: 'dev-admin', email: email || 'dev@local', name: 'Dev Admin', role: 'super_admin', active: true };
      const token = this.issueJwt(devUser);
      await logAdminActivity(devUser, 'login_dev', { email });
      return { success: true, requires2fa: false, token, user: devUser };
    }

    const supabase = getServiceClient();
    const emailLower = String(email).toLowerCase();
    const { data: userData, error: userError } = await supabase
      .from('admin_users')
      .select('id, email, password_hash, name, role, active, totp_secret')
      .eq('email', emailLower)
      .eq('active', true)
      .maybeSingle();
      
    if (userError || !userData) {
      throw new Error('Credenciais inválidas');
    }

    const hashed = typeof userData.password_hash === 'string' && userData.password_hash.startsWith('$2');
    const valid = hashed ? await bcrypt.compare(password, userData.password_hash) : userData.password_hash === password;
    
    if (!valid) {
      throw new Error('Credenciais inválidas');
    }

    const baseUser = { id: userData.id, email: userData.email, name: userData.name, role: userData.role, active: userData.active };
    
    // Check 2FA
    if (userData.totp_secret && String(userData.totp_secret).trim()) {
      const tempToken = jwt.sign({ stage: '2fa', sub: baseUser.id }, ENV.JWT_SECRET, { expiresIn: '5m' });
      return { success: true, requires2fa: true, tempToken };
    }
    
    // Direct Login
    const token = this.issueJwt(baseUser);
    await logAdminActivity(baseUser, 'login', { email });
    return { success: true, requires2fa: false, token, user: baseUser };
  }

  /**
   * Verifies 2FA code and completes login.
   * @param {string} tempToken - Temporary token from first step.
   * @param {string} code - TOTP code.
   * @returns {Promise<Object>} Result object { success, token, user }.
   * @throws {Error} If verification fails.
   */
  async verify2FA(tempToken, code) {
    if (!tempToken || !code) {
      throw new Error('Token temporário e código obrigatórios');
    }

    let payload;
    try {
      payload = jwt.verify(tempToken, ENV.JWT_SECRET);
    } catch {
      throw new Error('Token inválido');
    }

    if (!payload || payload.stage !== '2fa') {
      throw new Error('Token inválido');
    }

    const supabase = getServiceClient();
    const { data: userData, error } = await supabase
      .from('admin_users')
      .select('id, email, name, role, active, totp_secret')
      .eq('id', payload.sub)
      .eq('active', true)
      .maybeSingle();

    if (error || !userData) {
      throw new Error('Usuário inválido/inativo');
    }

    const verified = speakeasy.totp.verify({
      secret: String(userData.totp_secret || ''),
      encoding: 'base32',
      token: String(code)
    });

    if (!verified) {
      throw new Error('Código 2FA inválido');
    }

    const baseUser = { id: userData.id, email: userData.email, name: userData.name, role: userData.role, active: userData.active };
    const token = this.issueJwt(baseUser);
    await logAdminActivity(baseUser, 'login_2fa', {});
    
    return { success: true, token, user: baseUser };
  }

  /**
   * Enrolls a user in 2FA.
   * @param {Object} adminUser - The admin user.
   * @returns {Promise<Object>} 2FA setup details (secret, qr code).
   * @throws {Error} If setup fails.
   */
  async enroll2FA(adminUser) {
    if (ENV.DEV_AUTH_BYPASS || !isSupabaseConfigured) {
      throw new Error('2FA não disponível no modo dev/bypass');
    }

    const secret = speakeasy.generateSecret({ length: 20 });
    const otpauth = secret.otpauth_url || `otpauth://totp/RepalAdmin:${adminUser.email}?secret=${secret.base32}&issuer=RepalAdmin`;
    
    const supabase = getServiceClient();
    const { error } = await supabase
      .from('admin_users')
      .update({ totp_secret: secret.base32 })
      .eq('id', adminUser.id);
      
    if (error) {
      throw new Error(error.message);
    }
    
    const qrDataUrl = await qrcode.toDataURL(otpauth);
    await logAdminActivity(adminUser, 'enable_2fa', {});
    
    return { secret: secret.base32, otpauth, qr: qrDataUrl };
  }
}

export const authService = new AuthService();
