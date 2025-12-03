import { setCookie } from '../lib/util.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    console.warn('[auth/csrf-token] Método não permitido', { method: req.method, origin: req.headers.origin })
    return res.status(405).json({ success: false })
  }
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
  setCookie(res, 'csrf_token', token, { sameSite: 'Strict', secure: true, httpOnly: false })
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  console.info('[auth/csrf-token] emitido')
  res.json({ success: true, csrfToken: token })
}
