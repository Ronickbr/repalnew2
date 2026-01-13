import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import puppeteer from 'puppeteer'
import http from 'http'
import { createClient } from '@supabase/supabase-js'

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
const PREVIEW_PORT = process.env.PREVIEW_PORT || '4173'
const BASE_URL = `http://localhost:${PREVIEW_PORT}`

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

const routeToFilePath = (route) => {
  const clean = route.replace(/^\/+/, '')
  if (clean === '' || clean === '/') return path.join(DIST_DIR, 'index.html')
  return path.join(DIST_DIR, clean, 'index.html')
}

const fetchRoutes = async () => {
  const routes = new Set(['/categorias'])
  try {
    if (supabase) {
      const { data: categories } = await supabase
        .from('categories')
        .select('slug, active')
        .eq('active', true)
      const { data: products } = await supabase
        .from('products')
        .select('slug, active')
        .eq('active', true)
      for (const c of categories || []) {
        if (c.slug) routes.add(`/categorias/${c.slug}`)
      }
      for (const p of products || []) {
        if (p.slug) routes.add(`/produto/${p.slug}`)
      }
    }
  } catch {}
  return Array.from(routes)
}

const waitForServer = async (proc) => {
  const deadline = Date.now() + 25000
  return new Promise((resolve, reject) => {
    const tryProbe = () => {
      const req = http.get(BASE_URL, (res) => {
        res.resume()
        resolve(undefined)
      })
      req.on('error', () => {
        if (Date.now() > deadline) return reject(new Error('Preview server timeout'))
        setTimeout(tryProbe, 1000)
      })
    }
    tryProbe()
    proc.on('exit', (code) => {
      reject(new Error(`Preview server exited: ${code}`))
    })
  })
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

const formatDate = (dateInput) => {
  try {
    const d = dateInput ? new Date(dateInput) : new Date()
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
  const now = formatDate(new Date())
  let urls = [
    { loc: `${origin}/`, changefreq: 'weekly', priority: '1.0', lastmod: now },
    { loc: `${origin}/categorias`, changefreq: 'weekly', priority: '0.8', lastmod: now },
  ]
  try {
    if (supabase) {
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
    }
  } catch {}
  const urlsXml = urls
    .map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`)
    .join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>`
  return xml
}

const main = async () => {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('dist/ não encontrado. Execute "npm run build" antes.')
    process.exit(1)
  }
  const npmBin = process.platform === 'win32'
    ? 'npm.cmd'
    : 'npm'
  const preview = spawn(npmBin, ['run', 'preview', '--', '--port', PREVIEW_PORT], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true
  })
  try {
    await waitForServer(preview)
    
    let browser
    if (process.env.VERCEL) {
      console.log('Ambiente Vercel detectado. Usando puppeteer-core + @sparticuz/chromium')
      try {
        const chromium = await import('@sparticuz/chromium').then(m => m.default)
        const puppeteerCore = await import('puppeteer-core').then(m => m.default)
        
        browser = await puppeteerCore.launch({
          args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
        })
      } catch (err) {
        console.error('Erro ao carregar configuração Vercel:', err)
        // Fallback
        browser = await puppeteer.launch({ 
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        })
      }
    } else {
      browser = await puppeteer.launch({ headless: 'new' })
    }

    const page = await browser.newPage()
    const routes = await fetchRoutes()
    console.log(`Prerendering ${routes.length} rotas...`)
    for (const route of routes) {
      const url = `${BASE_URL}${route}`
      console.log('→', url)
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
        await new Promise(r => setTimeout(r, 500))
        const html = await page.evaluate(() => document.documentElement.outerHTML)
        const filePath = routeToFilePath(route)
        ensureDir(path.dirname(filePath))
        fs.writeFileSync(filePath, html, 'utf-8')
      } catch (e) {
        console.warn('Falha ao prerender rota:', route, e?.message || e)
      }
    }
    const origin = await getCanonicalBaseUrl()
    const xml = await generateSitemapXml(origin)
    const sitemapPath = path.join(DIST_DIR, 'sitemap.xml')
    fs.writeFileSync(sitemapPath, xml, 'utf-8')
    await browser.close()
  } catch (e) {
    console.error('Falha no prerender:', e)
  } finally {
    if (preview && !preview.killed) preview.kill('SIGINT')
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

