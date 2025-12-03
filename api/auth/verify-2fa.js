import speakeasy from 'speakeasy'
import { getServiceClient, verifyJwt, setCookie, logAdminActivity, issueJwt } from '../../server-lib/util.js'

const readJson = async (req) => {
  const chunks = []
  for await (const c of req) chunks.push(c)
  const txt = Buffer.concat(chunks).toString('utf-8')
  try { return JSON.parse(txt || '{}') } catch { return {} }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false })
  const origin = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : '')
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }
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
  res.json({ success: true })
}
