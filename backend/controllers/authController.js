import { ENV } from '../config/env.js';
import { authService } from '../services/authService.js';

// Utilitários de Auth
const setAuthCookie = (res, token) => {
  res.cookie(ENV.ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax', // Rule 05: Lax instead of Strict
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 1000 * 60 * 60 * 2 // 2 horas
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie(ENV.ADMIN_COOKIE_NAME, { path: '/' });
};

// Handlers

/**
 * Generates and sets a CSRF token cookie.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const getCsrfToken = (req, res) => {
  const csrf = authService.issueCsrfToken();
  // CSRF cookie can be lax/strict. Keeping strict as it was, or lax? 
  // Code was: strict. Rule 05 mentions session cookies. CSRF is protection.
  // I will leave it as strict or match session cookie? 
  // Code was: res.cookie('csrf_token', csrf, { sameSite: 'strict', ... });
  // I'll keep it strict for CSRF unless issues arise.
  res.cookie('csrf_token', csrf, { sameSite: 'strict', secure: false, httpOnly: false, path: '/' });
  res.json({ success: true, csrfToken: csrf });
};

/**
 * Handles user login.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    
    const result = await authService.login(email, password);
    
    if (result.success && result.token) {
      setAuthCookie(res, result.token);
    }
    
    return res.json(result);
  } catch (err) {
    const status = err.message === 'Credenciais inválidas' || err.message === 'Email e senha obrigatórios' ? 401 : 500;
    // Don't leak internal errors unless safe
    const errorMsg = status === 500 ? 'Erro interno' : err.message;
    if (status === 500) console.error('Erro login:', err);
    return res.status(status).json({ success: false, error: errorMsg });
  }
};

/**
 * Verifies 2FA token.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const verify2FA = async (req, res) => {
  try {
    const { tempToken, code } = req.body || {};
    
    const result = await authService.verify2FA(tempToken, code);
    
    if (result.success && result.token) {
      setAuthCookie(res, result.token);
    }
    
    return res.json({ success: true });
  } catch (err) {
    const status = err.message === 'Erro interno' ? 500 : 401; // Most errors here are validation/auth failures
    return res.status(status).json({ success: false, error: err.message });
  }
};

/**
 * Returns current authenticated user details.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const getMe = async (req, res) => {
  if (!req.admin) {
      return res.status(401).json({ success: false, error: 'Não autorizado' });
  }
  
  // Limpar campos sensíveis do objeto req.admin
  const { password_hash, totp_secret, ...safeUser } = req.admin;
  return res.json({ success: true, data: safeUser });
};

/**
 * Logs out the user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const logout = (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
};

/**
 * Enrolls user in 2FA.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const enroll2FA = async (req, res) => {
  try {
    const admin = req.admin;
    const result = await authService.enroll2FA(admin);
    return res.json({ success: true, ...result });
  } catch (err) {
    const status = err.message.includes('não disponível') ? 400 : 500;
    return res.status(status).json({ success: false, error: err.message });
  }
};
