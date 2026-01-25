import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isSupabaseConfigured, getAnonClient } from '../config/supabase.js';
import { logAdminActivity } from '../utils/logger.js';

// Necessário para path.join com __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
// __dirname aqui será backend/controllers. Preciso voltar para raiz.
const rootDir = path.resolve(path.dirname(__filename), '../../');

// Helpers de Sitemap (movido do server.js)
const getCanonicalBaseUrl = async () => {
  try {
    const anon = getAnonClient();
    // Use environment variable as primary source of truth
    const envUrl = process.env.FRONTEND_URL;
    if (envUrl) return envUrl.replace(/\/+$/, '');

    if (!anon) return process.env.NODE_ENV === 'production' ? 'https://repal.com.br' : 'http://localhost:5173';
    const { data } = await anon
      .from('site_settings')
      .select('seo')
      .limit(1)
      .single();
    const url = data?.seo?.canonical_url || '';
    const trimmed = (url || '').trim().replace(/\/+$/, '');
    return trimmed || (process.env.NODE_ENV === 'production' ? 'https://repal.com.br' : 'http://localhost:5173');
  } catch {
    return process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://repal.com.br' : 'http://localhost:5173');
  }
};

const formatDate = (dateInput) => {
    try {
      const d = dateInput ? new Date(dateInput) : new Date();
      if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
      return d.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
};

export const generateSitemapXml = async (originOverride) => {
  const origin = (typeof originOverride === 'string' && originOverride.trim())
    ? originOverride.trim().replace(/\/+$/, '')
    : await getCanonicalBaseUrl();
    
  const now = formatDate(new Date());
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
        const lastmod = formatDate(c.updated_at);
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
        const lastmod = formatDate(p.updated_at);
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

const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

export const updateRobots = async (req, res) => {
  try {
    const { content } = req.body || {};
    const publicDir = path.join(rootDir, 'public');
    ensureDirectoryExists(publicDir);
    const filePath = path.join(publicDir, 'robots.txt');
    fs.writeFileSync(filePath, typeof content === 'string' ? content : '');
    await logAdminActivity(req.admin, 'update_robots', {});
    res.json({ success: true, path: '/robots.txt' });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro interno' });
  }
};

export const updateSitemap = async (req, res) => {
  try {
    const { enabled, baseUrl, content } = req.body || {};
    const publicDir = path.join(rootDir, 'public');
    ensureDirectoryExists(publicDir);
    const filePath = path.join(publicDir, 'sitemap.xml');
    const distPath = path.join(rootDir, 'dist', 'sitemap.xml');

    if (!enabled) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      if (fs.existsSync(distPath)) {
        fs.unlinkSync(distPath);
      }
      await logAdminActivity(req.admin, 'disable_sitemap', {});
      return res.json({ success: true, enabled: false });
    }

    if (typeof content === 'string' && content.trim() !== '') {
      fs.writeFileSync(filePath, content);
      if (fs.existsSync(path.join(rootDir, 'dist'))) {
        fs.writeFileSync(distPath, content);
      }
      await logAdminActivity(req.admin, 'update_sitemap_custom', { size: content.length });
    } else {
      const xml = await generateSitemapXml(baseUrl);
      fs.writeFileSync(filePath, xml);
      if (fs.existsSync(path.join(rootDir, 'dist'))) {
        fs.writeFileSync(distPath, xml);
      }
      await logAdminActivity(req.admin, 'generate_sitemap', { baseUrl: (baseUrl || '').trim() });
    }
    res.json({ success: true, enabled: true, path: '/sitemap.xml' });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro interno' });
  }
};

export const getSitemap = async (req, res) => {
  try {
    const sitemapPath = path.join(rootDir, 'public', 'sitemap.xml');
    const distSitemapPath = path.join(rootDir, 'dist', 'sitemap.xml');
    
    let content = '';
    let needsRegeneration = true;

    if (fs.existsSync(sitemapPath)) {
      const stats = fs.statSync(sitemapPath);
      const age = new Date().getTime() - new Date(stats.mtime).getTime();
      if (age < 24 * 60 * 60 * 1000) {
        needsRegeneration = false;
        content = fs.readFileSync(sitemapPath, 'utf-8');
      }
    } else if (fs.existsSync(distSitemapPath)) {
      const stats = fs.statSync(distSitemapPath);
      const age = new Date().getTime() - new Date(stats.mtime).getTime();
      if (age < 24 * 60 * 60 * 1000) {
        needsRegeneration = false;
        content = fs.readFileSync(distSitemapPath, 'utf-8');
      }
    }

    if (needsRegeneration) {
      try {
        const xml = await generateSitemapXml();
        const publicDir = path.dirname(sitemapPath);
        if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
        fs.writeFileSync(sitemapPath, xml, 'utf-8');

        const distDir = path.dirname(distSitemapPath);
        if (fs.existsSync(distDir)) {
          fs.writeFileSync(distSitemapPath, xml, 'utf-8');
        }
        content = xml;
      } catch (err) {
        if (fs.existsSync(sitemapPath)) {
          content = fs.readFileSync(sitemapPath, 'utf-8');
        } else if (fs.existsSync(distSitemapPath)) {
          content = fs.readFileSync(distSitemapPath, 'utf-8');
        } else {
          throw err;
        }
      }
    }
    res.type('application/xml').send(content);
  } catch (err) {
    res.status(500).type('text/plain').send('Erro ao gerar sitemap');
  }
};

export const getSitemapIndex = async (req, res) => {
  try {
    const origin = await getCanonicalBaseUrl();
    const now = new Date().toISOString();
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${origin}/sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;
    res.type('application/xml').send(xml);
  } catch {
    res.status(500).type('text/plain').send('Erro ao gerar sitemap index');
  }
};

export const getSitemapGz = async (req, res) => {
  try {
    const sitemapPath = path.join(rootDir, 'public', 'sitemap.xml');
    const distSitemapPath = path.join(rootDir, 'dist', 'sitemap.xml');
    let content = '';
    if (fs.existsSync(sitemapPath)) {
      content = fs.readFileSync(sitemapPath, 'utf-8');
    } else if (fs.existsSync(distSitemapPath)) {
      content = fs.readFileSync(distSitemapPath, 'utf-8');
    } else {
      content = await generateSitemapXml();
    }
    const zlib = await import('zlib');
    zlib.gzip(content, (err, buffer) => {
      if (err) return res.status(500).type('text/plain').send('Erro ao comprimir sitemap');
      res.setHeader('Content-Type', 'application/x-gzip');
      res.setHeader('Content-Encoding', 'gzip');
      res.send(buffer);
    });
  } catch {
    res.status(500).type('text/plain').send('Erro ao gerar sitemap.gz');
  }
};

export const getRobots = async (req, res) => {
  try {
    const origin = await getCanonicalBaseUrl();
    const robotsPath = path.join(rootDir, 'public', 'robots.txt');
    if (fs.existsSync(robotsPath)) {
      const content = fs.readFileSync(robotsPath, 'utf-8');
      res.type('text/plain').send(content);
    } else {
      res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml`);
    }
  } catch {
    res.type('text/plain').send('User-agent: *\nAllow: /');
  }
};

export const getFeed = async (req, res) => {
  try {
    const origin = await getCanonicalBaseUrl();
    const anon = getAnonClient();
    const now = new Date().toISOString();
    let entries = [];
    if (anon) {
      const { data: products } = await anon
        .from('products')
        .select('slug, name, description, updated_at, created_at, active')
        .eq('active', true)
        .order('updated_at', { ascending: false })
        .limit(20);
      entries = (products || []).map(p => ({
        id: `${origin}/produto/${p.slug}`,
        title: p.name,
        updated: p.updated_at || p.created_at || now,
        summary: p.description || ''
      }));
    }
    const feedEntries = entries.map(e => 
      `  <entry>
    <id>${e.id}</id>
    <title>${e.title}</title>
    <updated>${e.updated}</updated>
    <link href="${e.id}" />
    <summary>${e.summary}</summary>
  </entry>`).join('\n');
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${origin}/</id>
  <title>Repal Equipamentos - Novidades</title>
  <updated>${now}</updated>
  <link href="${origin}/feed.xml" rel="self" />
  ${feedEntries}
</feed>`;
    res.type('application/atom+xml').send(xml);
  } catch {
    res.status(500).type('text/plain').send('Erro ao gerar feed');
  }
};
