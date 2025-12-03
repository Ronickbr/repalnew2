import { setCookie } from '../../server-lib/util.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false })
  setCookie(res, 'admin_token', '', { sameSite: 'Strict', secure: true, httpOnly: true, maxAge: 0 })
  const origin = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : '')
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }
  res.json({ success: true })
}
