import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const LOG_DIR = path.join(__dirname, '..', '..', 'logs');

const dailyFile = (base) => {
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return path.join(LOG_DIR, `${base}-${stamp}.log`);
};

const ensureDir = () => {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch {
    // sem acesso a fs (ex: serverless) — ignora silenciosamente
  }
};

export const writeLog = (base, entry) => {
  try {
    ensureDir();
    const line = JSON.stringify({ ts: new Date().toISOString(), ...entry });
    fs.appendFileSync(dailyFile(base), `${line}\n`, 'utf8');
  } catch {
    // ignora erros de escrita (read-only / ephemeral)
  }
};

export const readTodayLogs = (base) => {
  try {
    const file = dailyFile(base);
    if (!fs.existsSync(file)) return [];
    const raw = fs.readFileSync(file, 'utf8');
    return raw
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return { raw: line };
        }
      });
  } catch {
    return [];
  }
};
