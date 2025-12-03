import { getServiceClient, verifyJwt, readCookies } from './lib/util.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false })
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Credentials', 'true')
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
  res.json({ success: true, data })
}

