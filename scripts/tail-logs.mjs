import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, '..', 'logs');

const COLOR = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

const args = process.argv.slice(2);
const onlyErrors = args.includes('--errors') || args.includes('--only-errors');
const lastOnly = args.includes('--last');
const lastN = (() => {
  const i = args.indexOf('--last');
  return i >= 0 && args[i + 1] ? parseInt(args[i + 1], 10) : 25;
})();
const sources = [];
if (!args.includes('--requests')) sources.push('admin-activity');
if (!args.includes('--activity')) sources.push('requests');

const dailyFile = (base) => {
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return path.join(LOG_DIR, `${base}-${stamp}.log`);
};

const format = (entry) => {
  const ts = (entry.ts || '').slice(11, 19);
  const pad = (s, n) => String(s).padEnd(n);

  if (entry.action) {
    let icon = '•';
    let color = COLOR.green;
    if (/delete|remove/i.test(entry.action)) { icon = '✕'; color = COLOR.red; }
    else if (/create|mock|insert/i.test(entry.action)) { icon = '+'; color = COLOR.green; }
    else if (/update|toggle|change|status/i.test(entry.action)) { icon = '~'; color = COLOR.yellow; }
    else if (/login|logout/i.test(entry.action)) { icon = '→'; color = COLOR.cyan; }
    const details = entry.details && Object.keys(entry.details).length ? COLOR.dim + JSON.stringify(entry.details) + COLOR.reset : '';
    return `${COLOR.dim}${ts}${COLOR.reset} ${color}${icon}${COLOR.reset} ${COLOR.magenta}${pad(entry.action, 28)}${COLOR.reset} ${COLOR.bold}${entry.admin || '?'}${COLOR.reset} ${details}`;
  }

  let color = COLOR.green;
  if (entry.status >= 500) color = COLOR.red;
  else if (entry.status >= 400) color = COLOR.yellow;
  const mark = entry.status >= 400 ? '!' : ' ';
  return `${COLOR.dim}${ts}${COLOR.reset} ${color}${mark}${COLOR.reset} ${pad(entry.method, 6)} ${pad(entry.status, 3)} ${COLOR.dim}${pad(entry.duration_ms + 'ms', 8)}${COLOR.reset} ${COLOR.cyan}${entry.path}${COLOR.reset}${entry.admin ? COLOR.dim + ' [' + entry.admin + ']' + COLOR.reset : ''}`;
};

const readEntries = (file) => {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
};

const printEntries = (entries) => {
  for (const e of entries) {
    if (onlyErrors && e.level !== 'error' && e.level !== 'warn' && !(e.status >= 400)) continue;
    if (e.status && e.status >= 500) console.log(COLOR.red + format(e) + COLOR.reset);
    else console.log(format(e));
  }
};

const watchers = sources.map((base) => {
  const file = dailyFile(base);
  let pos = 0;
  if (fs.existsSync(file)) {
    const all = readEntries(file);
    const tail = lastOnly ? all.slice(-lastN) : all.slice(-lastN);
    console.log(COLOR.bold + COLOR.cyan + `== ${path.basename(file)} (últimas ${tail.length} linhas)` + COLOR.reset);
    printEntries(tail);
    pos = fs.statSync(file).size;
  } else {
    console.log(COLOR.dim + `== ${file} (ainda não existe)` + COLOR.reset);
  }
  return { file, pos };
});

if (lastOnly) {
  process.exit(0);
}

console.log(COLOR.dim + '\nAguardando novas entradas... (Ctrl+C para sair)\n' + COLOR.reset);

for (const w of watchers) {
  fs.watch(w.file, { persistent: true }, () => {
    try {
      const size = fs.statSync(w.file).size;
      if (size < w.pos) w.pos = 0;
      if (size > w.pos) {
        const data = fs.readFileSync(w.file, 'utf8').slice(w.pos);
        w.pos = size;
        const entries = data
          .split('\n')
          .filter(Boolean)
          .map((line) => {
            try {
              return JSON.parse(line);
            } catch {
              return null;
            }
          })
          .filter(Boolean);
        printEntries(entries);
      }
    } catch {
      // arquivo pode ser rotacionado/removido
    }
  });
}

process.on('SIGINT', () => process.exit(0));
