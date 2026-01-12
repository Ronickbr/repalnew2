import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Carregar variáveis de ambiente
try {
  const envPath = fs.existsSync(path.join(process.cwd(), '.env'))
    ? path.join(process.cwd(), '.env')
    : (fs.existsSync(path.join(process.cwd(), '.env.production'))
        ? path.join(process.cwd(), '.env.production')
        : undefined)
  if (envPath) dotenv.config({ path: envPath })
  else dotenv.config()
} catch {
  dotenv.config()
}

const DIST_DIR = path.join(process.cwd(), 'dist')
const PUBLIC_DIR = path.join(process.cwd(), 'public')
const BASE_URL = process.env.VITE_SITE_URL || 'http://localhost:5173'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

const getCanonicalBaseUrl = async () => {
  try {
    if (!supabase) return BASE_URL
    const { data } = await supabase
      .from('site_settings')
      .select('seo')
      .limit(1)
      .single()
    const url = data?.seo?.canonical_url || ''
    const trimmed = (url || '').trim().replace(/\/+$/, '')
    return trimmed || BASE_URL
  } catch {
    return BASE_URL
  }
}

const formatDate = (date) => {
  try {
    const d = date ? new Date(date) : new Date()
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0]
    return d.toISOString().split('T')[0]
  } catch {
    return new Date().toISOString().split('T')[0]
  }
}

const generateSitemapXml = async (originOverride) => {
  const origin = (typeof originOverride === 'string' && originOverride.trim())
    ? originOverride.trim().replace(/\/+$/, '')
    : await getCanonicalBaseUrl()
  const now = formatDate()
  
  let urls = [
    { loc: `${origin}/`, changefreq: 'weekly', priority: '1.0', lastmod: now },
    { loc: `${origin}/categorias`, changefreq: 'weekly', priority: '0.8', lastmod: now },
    { loc: `${origin}/sobre`, changefreq: 'monthly', priority: '0.5', lastmod: now },
    { loc: `${origin}/contato`, changefreq: 'monthly', priority: '0.5', lastmod: now },
  ]

  try {
    if (supabase) {
      console.log('Buscando categorias e produtos do Supabase...')
      const { data: categories } = await supabase
        .from('categories')
        .select('id, slug, parent_id, updated_at, active')
        .eq('active', true)
        .limit(50000)
      
      const { data: products } = await supabase
        .from('products')
        .select('slug, updated_at, active')
        .eq('active', true)
        .limit(50000)

      console.log(`Encontradas ${categories?.length || 0} categorias e ${products?.length || 0} produtos.`)

      const byId = new Map()
      for (const c of categories || []) {
        byId.set(c.id, c)
      }

      for (const c of categories || []) {
        const lastmod = formatDate(c.updated_at)
        if (!c.parent_id) {
          urls.push({ loc: `${origin}/categorias/${c.slug}`, changefreq: 'weekly', priority: '0.6', lastmod })
        } else {
          const parent = c.parent_id ? byId.get(c.parent_id) : null
          if (parent?.slug) {
            urls.push({ loc: `${origin}/categorias/${parent.slug}/${c.slug}`, changefreq: 'weekly', priority: '0.6', lastmod })
          } else {
            urls.push({ loc: `${origin}/categorias/${c.slug}`, changefreq: 'weekly', priority: '0.6', lastmod })
          }
        }
      }

      for (const p of products || []) {
        const lastmod = formatDate(p.updated_at)
        urls.push({ loc: `${origin}/produto/${p.slug}`, changefreq: 'weekly', priority: '0.7', lastmod })
      }
    } else {
      console.warn('Supabase não configurado. Sitemap conterá apenas rotas estáticas.')
    }
  } catch (err) {
    console.error('Erro ao buscar dados:', err)
  }

  const urlsXml = urls
    .map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`)
    .join('\n')
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>`
  return xml
}

const main = async () => {
  try {
    const origin = await getCanonicalBaseUrl()
    console.log(`Gerando sitemap para: ${origin}`)
    
    const xml = await generateSitemapXml(origin)
    
    // Salvar em dist/ se existir
    if (fs.existsSync(DIST_DIR)) {
      const sitemapPathDist = path.join(DIST_DIR, 'sitemap.xml')
      fs.writeFileSync(sitemapPathDist, xml, 'utf-8')
      console.log(`Sitemap salvo em: ${sitemapPathDist}`)
    }
    
    // Salvar em public/
    ensureDir(PUBLIC_DIR)
    const sitemapPathPublic = path.join(PUBLIC_DIR, 'sitemap.xml')
    fs.writeFileSync(sitemapPathPublic, xml, 'utf-8')
    console.log(`Sitemap salvo em: ${sitemapPathPublic}`)
    
    console.log('Sitemap gerado com sucesso!')
  } catch (e) {
    console.error('Falha ao gerar sitemap:', e)
    process.exit(1)
  }
}

main()
