import { getServiceClient, verifyJwt, readCookies, logAdminActivity } from '../../server-lib/util.js'

const readJson = async (req) => {
  const chunks = []
  for await (const c of req) chunks.push(c)
  const txt = Buffer.concat(chunks).toString('utf-8')
  try { return JSON.parse(txt || '{}') } catch { return {} }
}

export default async function handler(req, res) {
  const origin = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : '')
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token')
    res.setHeader('Access-Control-Allow-Methods', 'POST')
    return res.status(200).end()
  }
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
  res.json({ success: true, data: inserted })
}
