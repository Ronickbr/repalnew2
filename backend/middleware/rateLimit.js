import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { ENV } from '../config/env.js';

/**
 * Determina a chave (ip) para rate limiter.
 * Prioriza X-Forwarded-For (proxy/reverse proxy), senÃ£o usa req.ip.
 */
function getIpKey(req) {
  const xForwarded = req.headers && typeof req.headers['x-forwarded-for'] === 'string'
    ? req.headers['x-forwarded-for'].split(',')[0].trim()
    : null;
  return xForwarded || (req.ip && req.ip !== '::ffff:127.0.0.1' ? req.ip : '127.0.0.1');
}

// Chave gerada com ipKeyGenerator (compatÃ­vel com IPv6 na v8 do express-rate-limit)
const ipKey = (req) => ipKeyGenerator({ ip: getIpKey(req), maxIPv6Octets: 8 });

const isDev = ENV.NODE_ENV !== 'production';

// PadrÃ£o: headers Retry-After + X-RateLimit-* ativados, padrÃ£o RFC 7231
const standardHeaders = 'draft-7';
const legacyHeaders = false;

/* ----------------------------------------------------------
 * 1. LOGIN: 5 tentativas por 15 min por IP (anti brute force).
 *    ApÃ³s 2a tentativa comeÃ§a a adicionar latÃªncia (slow down).
 * ---------------------------------------------------------- */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 50 : 5,
  standardHeaders,
  legacyHeaders,
  keyGenerator: ipKey,
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  message: {
    success: false,
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    retryAfter: 15 * 60,
  },
  handler: (req, res, _next, options) => {
    const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
    console.warn(`[RATE-LIMIT] login bloqueado IP=${getIpKey(req)} path=${req.path}`);
    res.setHeader('Retry-After', retryAfterSeconds);
    res.status(options.statusCode).json(options.message);
  },
});

export const loginSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: isDev ? 20 : 2,
  delayMs: (hits) => hits * 350, // 2Âª tentativa +350ms, 3Âª +700ms, etc.
  keyGenerator: ipKey,
});

/* ----------------------------------------------------------
 * 2. VERIFY-2FA: 10 tentativas por 15 min por IP.
 * ---------------------------------------------------------- */
export const verify2faRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 10,
  standardHeaders,
  legacyHeaders,
  keyGenerator: ipKey,
  message: {
    success: false,
    error: 'Muitas tentativas de 2FA. Tente novamente em 15 minutos.',
    retryAfter: 15 * 60,
  },
  handler: (req, res, _next, options) => {
    const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
    console.warn(`[RATE-LIMIT] 2FA bloqueado IP=${getIpKey(req)}`);
    res.setHeader('Retry-After', retryAfterSeconds);
    res.status(options.statusCode).json(options.message);
  },
});

/* ----------------------------------------------------------
 * 3. UPLOAD: 20 uploads / 10 min por IP.
 *    + slow down apÃ³s 5 uploads.
 * ---------------------------------------------------------- */
export const uploadRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: isDev ? 200 : 20,
  standardHeaders,
  legacyHeaders,
  keyGenerator: ipKey,
  message: {
    success: false,
    error: 'Muitos uploads. Tente novamente em alguns minutos.',
  },
  handler: (req, res, _next, options) => {
    console.warn(`[RATE-LIMIT] upload bloqueado IP=${getIpKey(req)}`);
    res.status(options.statusCode).json(options.message);
  },
});

export const uploadSlowDown = slowDown({
  windowMs: 10 * 60 * 1000,
  delayAfter: isDev ? 50 : 5,
  delayMs: (hits) => hits * 200,
  keyGenerator: ipKey,
});

/* ----------------------------------------------------------
 * 4. AI / GeraÃ§Ã£o de conteÃºdo: 30 req / 15 min (custo $).
 *    + slow down apÃ³s 5 reqs.
 * ---------------------------------------------------------- */
export const aiGenerateRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 300 : 30,
  standardHeaders,
  legacyHeaders,
  keyGenerator: ipKey,
  message: {
    success: false,
    error: 'Cota de IA excedida. Tente novamente em 15 minutos.',
  },
  handler: (req, res, _next, options) => {
    console.warn(`[RATE-LIMIT] AI bloqueado IP=${getIpKey(req)}`);
    res.status(options.statusCode).json(options.message);
  },
});

export const aiGenerateSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: isDev ? 50 : 5,
  delayMs: (hits) => hits * 250,
  keyGenerator: ipKey,
});

/* ----------------------------------------------------------
 * 5. CSRF TOKEN / geral auth nÃ£o sensÃ­vel: 60 req / min.
 * ---------------------------------------------------------- */
export const authGeneralRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 600 : 60,
  standardHeaders,
  legacyHeaders,
  keyGenerator: ipKey,
});

/* ----------------------------------------------------------
 * 6. LEAD PÚBLICO (formulários públicos): 10 envios / 15 min por IP.
 * ---------------------------------------------------------- */
export const publicLeadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 10,
  standardHeaders,
  legacyHeaders,
  keyGenerator: ipKey,
  message: {
    success: false,
    error: 'Muitos envios de formulário. Tente novamente em alguns minutos.',
  },
  handler: (req, res, _next, options) => {
    console.warn(`[RATE-LIMIT] lead público bloqueado IP=${getIpKey(req)}`);
    res.status(options.statusCode).json(options.message);
  },
});
