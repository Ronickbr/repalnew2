import speakeasy from 'speakeasy'
import qrcode from 'qrcode'
import { getServiceClient, verifyJwt, readCookies, logAdminActivity } from '../../lib/util.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false })
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Credentials', 'true')
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
  res.json({ success: true, secret: secret.base32, otpauth, qr })
}

