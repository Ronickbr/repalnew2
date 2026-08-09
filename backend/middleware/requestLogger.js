import { writeLog } from '../utils/logFile.js';

const COLOR = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

export const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();
  const base = {
    method: req.method,
    path: req.originalUrl || req.url,
    ip: req.ip || req.socket?.remoteAddress || '?',
  };

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const status = res.statusCode;
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    const entry = {
      ...base,
      status,
      duration_ms: Math.round(durationMs * 10) / 10,
      admin: req.admin?.email || req.admin?.id || null,
    };
    writeLog('requests', { level, ...entry });

    if (process.env.NODE_ENV !== 'production') {
      const color = status >= 500 ? COLOR.red : status >= 400 ? COLOR.yellow : COLOR.green;
      const adminTag = entry.admin ? `${COLOR.cyan}[${entry.admin}]${COLOR.reset} ` : '';
      console.log(
        `${COLOR.dim}${new Date().toISOString()}${COLOR.reset} ` +
          `${color}${req.method} ${req.originalUrl || req.url} -> ${status}${COLOR.reset} ` +
          `${COLOR.dim}${durationMs.toFixed(1)}ms${COLOR.reset} ${adminTag}`
      );
    }
  });

  next();
};
