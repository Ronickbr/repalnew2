import { setCookie } from '../../server-lib/util.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false })
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
  setCookie(res, 'csrf_token', token, { sameSite: 'Strict', secure: true, httpOnly: false })
  const origin = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : '')
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }
  res.json({ success: true, csrfToken: token })
}
