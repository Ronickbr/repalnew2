#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: opts.silent ? ['ignore', 'pipe', 'ignore'] : undefined,
      ...opts,
    }).trim();
  } catch (err) {
    if (opts.allowFail) return '';
    throw err;
  }
}

function validSemver(v) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(v);
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3] };
}

function semverCompare(a, b) {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

function versionToString(v) {
  return `${v.major}.${v.minor}.${v.patch}`;
}

function bumpVersion(base, level) {
  switch (level) {
    case 'major':
      return { major: base.major + 1, minor: 0, patch: 0 };
    case 'minor':
      return { major: base.major, minor: base.minor + 1, patch: 0 };
    case 'patch':
      return { major: base.major, minor: base.minor, patch: base.patch + 1 };
    default:
      return null;
  }
}

function getExistingTags() {
  const raw = run('git tag --list', { silent: true, allowFail: true });
  if (!raw) return [];
  return raw
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => ({ tag: t, parsed: validSemver(t) }))
    .filter((x) => x.parsed !== null);
}

function getGreatestTag(tags) {
  if (!tags.length) return null;
  let greatest = tags[0];
  for (const t of tags) {
    if (semverCompare(t.parsed, greatest.parsed) > 0) greatest = t;
  }
  return greatest;
}

function getCommitsSince(tagOrNull) {
  const range = tagOrNull ? `${tagOrNull.tag}..HEAD` : 'HEAD';
  const format = '--pretty=format:%H%x00%s%x00%b%x01';
  const raw = run(`git log ${range} ${format}`, {
    silent: true,
    allowFail: true,
  });
  if (!raw) return [];
  return raw
    .split('\x01')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [hash, subject, body = ''] = entry.split('\x00');
      return {
        hash,
        subject: (subject || '').trim(),
        body: (body || '').trim(),
      };
    });
}

const CONVENTIONAL_REGEX =
  /^(revert:\s*)?(?<type>[a-zA-Z]+)(?<scope>\([^)]+\))?(?<breaking>!)?:\s*(?<desc>.+)$/;

function classifyCommit(commit) {
  const m = CONVENTIONAL_REGEX.exec(commit.subject);
  const breaking =
    (m && m.groups.breaking === '!') ||
    /BREAKING[ -]CHANGE:/.test(commit.subject) ||
    /BREAKING[ -]CHANGE:/.test(commit.body);

  if (!m) {
    return {
      type: null,
      breaking,
      level: breaking ? 'major' : null,
      raw: commit.subject,
      desc: commit.subject,
    };
  }

  const type = m.groups.type.toLowerCase();
  const desc = m.groups.desc;

  let level = null;
  if (breaking) level = 'major';
  else if (type === 'feat') level = 'minor';
  else if (
    ['fix', 'docs', 'chore', 'refactor', 'perf', 'test', 'build', 'ci'].includes(
      type,
    )
  )
    level = 'patch';

  return { type, breaking, level, raw: commit.subject, desc };
}

function determineBumpLevel(classified) {
  let highest = null;
  const order = { patch: 1, minor: 2, major: 3 };

  for (const c of classified) {
    if (!c.level) continue;
    if (!highest || order[c.level] > order[highest]) highest = c.level;
  }

  return highest;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}

function formatDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function groupCommits(classified) {
  const order = ['feat', 'fix', 'perf', 'refactor', 'docs', 'test', 'build', 'ci', 'chore'];
  const groups = new Map();
  for (const c of classified) {
    const key = c.type || 'outros';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }
  const entries = [...groups.entries()];
  entries.sort((a, b) => {
    const ai = order.indexOf(a[0]);
    const bi = order.indexOf(b[0]);
    if (ai === -1 && bi === -1) return a[0].localeCompare(b[0]);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  return entries;
}

function translateType(type) {
  const map = {
    feat: 'Adicionado',
    fix: 'Corrigido',
    perf: 'Performance',
    refactor: 'Refatorado',
    docs: 'Documentação',
    test: 'Testes',
    build: 'Build',
    ci: 'CI/CD',
    chore: 'Manutenção',
    outros: 'Outros',
  };
  return map[type] || type;
}

function buildChangelogEntry(newVersion, classified, dateStr) {
  const groups = groupCommits(classified);
  const lines = [];
  lines.push(`## ${dateStr} - v${newVersion}`);
  lines.push('');
  for (const [type, items] of groups) {
    lines.push(`### ${translateType(type)}`);
    for (const it of items) {
      lines.push(`- ${it.desc}${it.breaking ? ' **[BREAKING CHANGE]**' : ''}`);
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd() + '\n';
}

function updateChangelog(newEntry) {
  const path = resolve(ROOT, 'CHANGELOG.md');
  if (!existsSync(path)) {
    writeFileSync(path, newEntry + '\n', 'utf8');
    return;
  }
  const current = readFileSync(path, 'utf8');
  const updated = newEntry + '\n' + current.replace(/^\n+/, '');
  writeFileSync(path, updated, 'utf8');
}

function buildSummaryLines(classified) {
  const groups = groupCommits(classified).slice(0, 3);
  const lines = [];
  for (const [type, items] of groups) {
    const sample = items.slice(0, 3).map((it) => it.desc);
    lines.push(`- **${translateType(type)}**: ${sample.join('; ')}${items.length > sample.length ? ` (+${items.length - sample.length} mais)` : ''}`);
  }
  return lines;
}

function updateReadme(newVersion, dateStr, classified) {
  const path = resolve(ROOT, 'README.md');
  if (!existsSync(path)) return;

  let current = readFileSync(path, 'utf8');
  const startTag = '<!-- RELEASE-AUTO-START -->';
  const endTag = '<!-- RELEASE-AUTO-END -->';

  const block = [
    startTag,
    '',
    `## Última Release`,
    '',
    `- **Versão**: \`v${newVersion}\``,
    `- **Data**: ${dateStr}`,
    `- **Changelog completo**: [CHANGELOG.md](./CHANGELOG.md)`,
    '',
    `### Resumo das Alterações`,
    '',
    ...buildSummaryLines(classified),
    '',
    endTag,
  ].join('\n');

  const startIdx = current.indexOf(startTag);
  const endIdx = current.indexOf(endTag);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = current.slice(0, startIdx);
    const after = current.slice(endIdx + endTag.length);
    current = before + block + after;
  } else {
    const append = '\n\n' + block + '\n';
    current = current.trimEnd() + append;
  }

  writeFileSync(path, current, 'utf8');
}

function main() {
  const tags = getExistingTags();
  const greatest = getGreatestTag(tags);

  let baseVersion;
  if (greatest) {
    baseVersion = greatest.parsed;
    console.log(
      `[release] Maior tag semver encontrada: ${greatest.tag} (${versionToString(baseVersion)})`,
    );
  } else {
    baseVersion = { major: 0, minor: 0, patch: 0 };
    console.log('[release] Nenhuma tag semver encontrada. Usando base 0.0.0.');
  }

  const commits = getCommitsSince(greatest);
  console.log(`[release] Commits desde a última tag: ${commits.length}`);

  if (!commits.length) {
    console.log('[release] Nenhum commit novo. Nenhuma release necessária.');
    console.log('NO_RELEASE=1');
    process.exit(0);
  }

  const classified = commits.map(classifyCommit);
  for (const c of classified) {
    console.log(`  - ${c.raw} [type=${c.type || 'n/a'}, level=${c.level || 'n/a'}]`);
  }

  const level = determineBumpLevel(classified);
  if (!level) {
    console.log(
      '[release] Nenhum commit com tipo reconhecido para versionamento. Nenhuma release.',
    );
    console.log('NO_RELEASE=1');
    process.exit(0);
  }

  const next = bumpVersion(baseVersion, level);
  const newVersion = versionToString(next);
  const dateStr = formatDate();

  console.log(`[release] Próxima versão: v${newVersion} (${level})`);
  console.log(`NEW_VERSION=${newVersion}`);
  console.log(`NEW_VERSION_TAG=v${newVersion}`);
  console.log(`BUMP_LEVEL=${level}`);

  const pkgPath = resolve(ROOT, 'package.json');
  const pkg = readJson(pkgPath);
  pkg.version = newVersion;
  writeJson(pkgPath, pkg);
  console.log('[release] package.json atualizado.');

  const lockPath = resolve(ROOT, 'package-lock.json');
  if (existsSync(lockPath)) {
    const lock = readJson(lockPath);
    if (lock && typeof lock.version === 'string') lock.version = newVersion;
    if (lock && lock.packages && lock.packages['']) {
      lock.packages[''].version = newVersion;
    }
    writeJson(lockPath, lock);
    console.log('[release] package-lock.json atualizado.');
  }

  const changelogEntry = buildChangelogEntry(newVersion, classified, dateStr);
  updateChangelog(changelogEntry);
  console.log('[release] CHANGELOG.md atualizado.');

  updateReadme(newVersion, dateStr, classified);
  console.log('[release] README.md atualizado (bloco RELEASE-AUTO).');

  console.log('[release] OK. Os arquivos foram alterados no disco.');
  console.log('[release] A próxima etapa do workflow irá commitar, taggear e criar a release.');
}

main();
