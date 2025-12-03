import bcrypt from 'bcryptjs'
import { getServiceClient, issueJwt, setCookie, logAdminActivity } from '../lib/util.js'

const readJson = async (req) => {
  const chunks = []
  for await (const c of req) chunks.push(c)
  const txt = Buffer.concat(chunks).toString('utf-8')
  try { return JSON.parse(txt || '{}') } catch { return {} }
}

export default async function handler(req, res) {
  const startedAt = Date.now()
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : '')
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Access-Control-Allow-Credentials', 'true')
    }
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    return res.status(200).end()
  }
  if (req.method !== 'POST') {
    console.warn('[auth/login] Método não permitido', { method: req.method, origin: req.headers.origin })
    return res.status(405).json({ success: false })
  }
  const { email, password } = await readJson(req)
  if (!email || !password) return res.status(400).json({ success: false, error: 'Email e senha obrigatórios' })

  const origin = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : '')
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }

  const devBypass = process.env.VITE_DEV_AUTH_BYPASS === 'true' || process.env.VITE_DEV_AUTH_BYPASS === true
  const client = getServiceClient()
  if (devBypass || !client) {
    const devUser = { id: 'dev-admin', email: email || 'dev@local', name: 'Dev Admin', role: 'super_admin', active: true }
    const token = issueJwt(devUser)
    setCookie(res, 'admin_token', token, { sameSite: 'Strict', secure: true, httpOnly: true, maxAge: 60 * 60 * 2 })
    await logAdminActivity(devUser, 'login_dev', { email })
    console.info('[auth/login] dev bypass ok', { email: String(email).toLowerCase(), duration_ms: Date.now() - startedAt })
    return res.json({ success: true, requires2fa: false })
  }

  const emailLower = String(email).toLowerCase()
  const { data: userData, error } = await client
    .from('admin_users')
    .select('id, email, password_hash, name, role, active, totp_secret')
    .eq('email', emailLower)
    .eq('active', true)
    .maybeSingle()
  if (error || !userData) {
    console.warn('[auth/login] usuário não encontrado/ativo', { email: emailLower })
    return res.status(401).json({ success: false, error: 'Credenciais inválidas' })
  }
  const hashed = typeof userData.password_hash === 'string' && userData.password_hash.startsWith('$2')
  const valid = hashed ? await bcrypt.compare(password, userData.password_hash) : userData.password_hash === password
  if (!valid) {
    console.warn('[auth/login] senha inválida', { email: emailLower })
    return res.status(401).json({ success: false, error: 'Credenciais inválidas' })
  }
  const baseUser = { id: userData.id, email: userData.email, name: userData.name, role: userData.role, active: userData.active }
  if (userData.totp_secret && String(userData.totp_secret).trim()) {
    const tempToken = issueJwt({ id: baseUser.id, email: baseUser.email, role: '2fa' })
    console.info('[auth/login] requer 2FA', { email: emailLower })
    return res.json({ success: true, requires2fa: true, tempToken })
  }
  const token = issueJwt(baseUser)
  setCookie(res, 'admin_token', token, { sameSite: 'Strict', secure: true, httpOnly: true, maxAge: 60 * 60 * 2 })
  await logAdminActivity(baseUser, 'login', { email })
  console.info('[auth/login] sucesso', { email: emailLower, duration_ms: Date.now() - startedAt })
  res.json({ success: true, requires2fa: false })
}
