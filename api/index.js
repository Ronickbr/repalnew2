import bcrypt from 'bcryptjs'
import speakeasy from 'speakeasy'
import qrcode from 'qrcode'
import { getServiceClient, issueJwt, verifyJwt, readCookies, setCookie, logAdminActivity } from '../server-lib/util.js'

const allowCors = (req, res) => {
  const origin = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : '')
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }
}

const readJson = async (req) => {
  const chunks = []
  for await (const c of req) chunks.push(c)
  const txt = Buffer.concat(chunks).toString('utf-8')
  try { return JSON.parse(txt || '{}') } catch { return {} }
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const path = url.pathname
  if (req.method === 'OPTIONS') {
    allowCors(req, res)
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    return res.status(200).end()
  }

  // Ping
  if (path === '/api/ping') {
    allowCors(req, res)
    return res.status(200).json({ success: true, message: 'ok', method: req.method })
  }

  // CSRF
  if (path === '/api/auth/csrf-token' || path === '/api/auth-csrf-token') {
    if (req.method !== 'GET') return res.status(405).json({ success: false })
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
    setCookie(res, 'csrf_token', token, { sameSite: 'Strict', secure: true, httpOnly: false })
    allowCors(req, res)
    return res.json({ success: true, csrfToken: token })
  }

  // Login
  if (path === '/api/auth/login' || path === '/api/auth-login') {
    allowCors(req, res)
    if (req.method !== 'POST') return res.status(405).json({ success: false })
    const startedAt = Date.now()
    const { email, password } = await readJson(req)
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email e senha obrigatórios' })
    const devBypass = process.env.VITE_DEV_AUTH_BYPASS === 'true' || process.env.VITE_DEV_AUTH_BYPASS === true
    const client = getServiceClient()
    if (devBypass || !client) {
      const devUser = { id: 'dev-admin', email: email || 'dev@local', name: 'Dev Admin', role: 'super_admin', active: true }
      const token = issueJwt(devUser)
      setCookie(res, 'admin_token', token, { sameSite: 'Strict', secure: true, httpOnly: true, maxAge: 60 * 60 * 2 })
      await logAdminActivity(devUser, 'login_dev', { email })
      return res.json({ success: true, requires2fa: false })
    }
    const emailLower = String(email).toLowerCase()
    const { data: userData, error } = await client
      .from('admin_users')
      .select('id, email, password_hash, name, role, active, totp_secret')
      .eq('email', emailLower)
      .eq('active', true)
      .maybeSingle()
    if (error || !userData) return res.status(401).json({ success: false, error: 'Credenciais inválidas' })
    const hashed = typeof userData.password_hash === 'string' && userData.password_hash.startsWith('$2')
    const valid = hashed ? await bcrypt.compare(password, userData.password_hash) : userData.password_hash === password
    if (!valid) return res.status(401).json({ success: false, error: 'Credenciais inválidas' })
    const baseUser = { id: userData.id, email: userData.email, name: userData.name, role: userData.role, active: userData.active }
    if (userData.totp_secret && String(userData.totp_secret).trim()) {
      const tempToken = issueJwt({ id: baseUser.id, email: baseUser.email, role: '2fa' })
      return res.json({ success: true, requires2fa: true, tempToken })
    }
    const token = issueJwt(baseUser)
    setCookie(res, 'admin_token', token, { sameSite: 'Strict', secure: true, httpOnly: true, maxAge: 60 * 60 * 2 })
    await logAdminActivity(baseUser, 'login', { email })
    return res.json({ success: true, requires2fa: false })
  }

  // Verify 2FA
  if (path === '/api/auth/verify-2fa' || path === '/api/auth-verify-2fa') {
    allowCors(req, res)
    if (req.method !== 'POST') return res.status(405).json({ success: false })
    const { tempToken, code } = await readJson(req)
    if (!tempToken || !code) return res.status(400).json({ success: false, error: 'Token temporário e código obrigatórios' })
    const payload = verifyJwt(tempToken)
    if (!payload || payload.sub === undefined) return res.status(401).json({ success: false, error: 'Token inválido' })
    const client = getServiceClient()
    if (!client) return res.status(400).json({ success: false, error: 'Supabase não configurado' })
    const { data: userData, error } = await client
      .from('admin_users')
      .select('id, email, name, role, active, totp_secret')
      .eq('id', payload.sub)
      .eq('active', true)
      .maybeSingle()
    if (error || !userData) return res.status(401).json({ success: false, error: 'Usuário inválido/inativo' })
    const verified = speakeasy.totp.verify({ secret: String(userData.totp_secret || ''), encoding: 'base32', token: String(code) })
    if (!verified) return res.status(401).json({ success: false, error: 'Código 2FA inválido' })
    const baseUser = { id: userData.id, email: userData.email, name: userData.name, role: userData.role, active: userData.active }
    const token = issueJwt(baseUser)
    setCookie(res, 'admin_token', token, { sameSite: 'Strict', secure: true, httpOnly: true, maxAge: 60 * 60 * 2 })
    await logAdminActivity(baseUser, 'login_2fa', {})
    return res.json({ success: true })
  }

  // 2FA enroll
  if (path === '/api/auth/2fa/enroll' || path === '/api/auth-2fa-enroll') {
    allowCors(req, res)
    if (req.method !== 'POST') return res.status(405).json({ success: false })
    const cookies = readCookies(req)
    const token = cookies['admin_token']
    const payload = token ? verifyJwt(token) : null
    const client = getServiceClient()
    if (!client || !payload || !payload.sub) return res.status(400).json({ success: false, error: 'Não autorizado' })
    const { data: userData, error } = await client
      .from('admin_users')
      .select('id, email, name, role, active')
      .eq('id', payload.sub)
      .eq('active', true)
      .maybeSingle()
    if (error || !userData) return res.status(401).json({ success: false, error: 'Usuário inválido/inativo' })
    const secret = speakeasy.generateSecret({ length: 20 })
    const otpauth = secret.otpauth_url || `otpauth://totp/RepalAdmin:${userData.email}?secret=${secret.base32}&issuer=RepalAdmin`
    const upd = await client.from('admin_users').update({ totp_secret: secret.base32 }).eq('id', userData.id)
    if (upd.error) return res.status(500).json({ success: false, error: upd.error.message })
    const qr = await qrcode.toDataURL(otpauth)
    await logAdminActivity(userData, 'enable_2fa', {})
    return res.json({ success: true, secret: secret.base32, otpauth, qr })
  }

  // Me
  if (path === '/api/auth/me' || path === '/api/auth-me') {
    allowCors(req, res)
    if (req.method !== 'GET') return res.status(405).json({ success: false })
    const cookies = readCookies(req)
    const token = cookies['admin_token']
    const devBypass = process.env.VITE_DEV_AUTH_BYPASS === 'true' || process.env.VITE_DEV_AUTH_BYPASS === true
    const client = getServiceClient()
    if (devBypass || !client) {
      return res.json({ success: true, data: { id: 'dev-admin', email: 'dev@local', name: 'Dev Admin', role: 'super_admin', active: true } })
    }
    if (!token) return res.status(401).json({ success: false, error: 'Não autorizado' })
    const payload = verifyJwt(token)
    if (!payload || !payload.sub) return res.status(401).json({ success: false, error: 'Token inválido' })
    const { data, error } = await client
      .from('admin_users')
      .select('id, email, name, role, active')
      .eq('id', payload.sub)
      .eq('active', true)
      .maybeSingle()
    if (error || !data) return res.status(401).json({ success: false, error: 'Usuário inválido/inativo' })
    return res.json({ success: true, data })
  }

  // Logout
  if (path === '/api/auth/logout' || path === '/api/auth-logout') {
    allowCors(req, res)
    if (req.method !== 'POST') return res.status(405).json({ success: false })
    setCookie(res, 'admin_token', '', { sameSite: 'Strict', secure: true, httpOnly: true, maxAge: 0 })
    return res.json({ success: true })
  }

  // Admin products
  if (path === '/api/admin/products' || path === '/api/admin-products') {
    allowCors(req, res)
    if (req.method !== 'POST') return res.status(405).json({ success: false })
    const cookies = readCookies(req)
    const token = cookies['admin_token']
    const csrfCookie = cookies['csrf_token']
    const csrfHeader = req.headers['x-csrf-token']
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) return res.status(403).json({ success: false, error: 'CSRF inválido' })
    const devBypass = process.env.VITE_DEV_AUTH_BYPASS === 'true' || process.env.VITE_DEV_AUTH_BYPASS === true
    const client = getServiceClient()
    let admin
    if (devBypass || !client) {
      admin = { id: 'dev-admin', role: 'super_admin' }
    } else {
      if (!token) return res.status(401).json({ success: false, error: 'Não autorizado' })
      const payload = verifyJwt(token)
      if (!payload || !payload.sub) return res.status(401).json({ success: false, error: 'Token inválido' })
      const { data, error } = await client
        .from('admin_users')
        .select('id, role, active')
        .eq('id', payload.sub)
        .eq('active', true)
        .maybeSingle()
      if (error || !data) return res.status(401).json({ success: false, error: 'Usuário inválido/inativo' })
      admin = data
    }
    const { product, additionalImages } = await readJson(req)
    if (!product || !product.name || !product.category_id) return res.status(400).json({ success: false, error: 'Dados do produto inválidos' })
    if (!client) {
      const fake = { ...product, id: Math.floor(Math.random() * 1000000), created_at: new Date().toISOString() }
      await logAdminActivity(admin, 'create_product_dev', { product_id: fake.id })
      return res.json({ success: true, data: fake })
    }
    const { data: inserted, error: insertError } = await client
      .from('products')
      .insert([product])
      .select('*')
      .single()
    if (insertError) return res.status(500).json({ success: false, error: insertError.message })
    if (Array.isArray(additionalImages) && additionalImages.length > 0) {
      const records = additionalImages.filter(Boolean).map((url, idx) => ({ product_id: inserted.id, url, sort_order: idx }))
      if (records.length > 0) await client.from('product_images').insert(records)
    }
    await logAdminActivity(admin, 'create_product', { product_id: inserted.id })
    return res.json({ success: true, data: inserted })
  }

  // Integrations
  if (path === '/api/integrations') {
    allowCors(req, res)
    if (req.method !== 'GET') return res.status(405).json({ success: false })
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      return res.json({ success: true, data: { google_analytics_id: '', google_tag_manager_id: '', facebook_pixel_id: '' } })
    }
    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient(supabaseUrl, supabaseAnonKey)
    const { data, error } = await client.from('site_settings').select('integrations').single()
    if (error && error.code !== 'PGRST116') return res.status(500).json({ success: false, error: error.message })
    const integrations = (data && data.integrations) || {}
    const response = {
      google_analytics_id: integrations.google_analytics_id || '',
      google_tag_manager_id: integrations.google_tag_manager_id || '',
      facebook_pixel_id: integrations.facebook_pixel_id || ''
    }
    return res.json({ success: true, data: response })
  }

  // Not found
  return res.status(404).json({ success: false, error: 'Endpoint não encontrado' })
}

