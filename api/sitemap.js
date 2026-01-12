import { createClient } from '@supabase/supabase-js';

// Utilitário para formatar data YYYY-MM-DD
const formatDate = (dateInput) => {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return res.status(500).send('Erro de configuração do Supabase');
  }

  const supabase = createClient(supabaseUrl, anonKey);

  try {
    // Buscar URL base das configurações
    const { data: settings } = await supabase
      .from('site_settings')
      .select('seo, site_info')
      .limit(1)
      .single();

    const origin = (settings?.seo?.canonical_url || settings?.site_info?.url || 'https://www.repalmarechal.com.br').trim().replace(/\/+$/, '');
    const now = formatDate(new Date());

    let urls = [
      { loc: `${origin}/`, changefreq: 'weekly', priority: '1.0', lastmod: now },
      { loc: `${origin}/categorias`, changefreq: 'weekly', priority: '0.8', lastmod: now },
    ];

    // Buscar Categorias
    const { data: categories } = await supabase
      .from('categories')
      .select('id, slug, parent_id, updated_at, active')
      .eq('active', true)
      .limit(1000);

    // Buscar Produtos
    const { data: products } = await supabase
      .from('products')
      .select('slug, updated_at, active')
      .eq('active', true)
      .limit(5000);

    const byId = new Map();
    if (categories) {
      categories.forEach(c => byId.set(c.id, c));
      
      categories.forEach(c => {
        const lastmod = formatDate(c.updated_at);
        if (!c.parent_id) {
          urls.push({ loc: `${origin}/categorias/${c.slug}`, changefreq: 'weekly', priority: '0.6', lastmod });
        } else {
          const parent = byId.get(c.parent_id);
          if (parent?.slug) {
            urls.push({ loc: `${origin}/categorias/${parent.slug}/${c.slug}`, changefreq: 'weekly', priority: '0.6', lastmod });
          } else {
            urls.push({ loc: `${origin}/categorias/${c.slug}`, changefreq: 'weekly', priority: '0.6', lastmod });
          }
        }
      });
    }

    if (products) {
      products.forEach(p => {
        const lastmod = formatDate(p.updated_at);
        urls.push({ loc: `${origin}/produto/${p.slug}`, changefreq: 'weekly', priority: '0.7', lastmod });
      });
    }

    const urlsXml = urls
      .map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`)
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=59');
    res.status(200).send(xml);

  } catch (error) {
    console.error('Erro ao gerar sitemap:', error);
    res.status(500).send('Erro ao gerar sitemap');
  }
}
