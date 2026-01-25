import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'
import { ENV } from '../backend/config/env.js'

export const getServiceClient = () => {
  const supabaseUrl = ENV.SUPABASE_URL
  const serviceKey = ENV.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return null
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

const SAFE_JWT_SECRET = ENV.JWT_SECRET;

export const issueJwt = (user) => jwt.sign({ sub: user.id, email: user.email, role: user.role }, SAFE_JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '2h' })
export const verifyJwt = (token) => { try { return jwt.verify(token, SAFE_JWT_SECRET) } catch { return null } }

export const setCookie = (res, name, value, opts = {}) => {
  const parts = []
  parts.push(`${name}=${encodeURIComponent(String(value))}`)
  parts.push(`Path=${opts.path || '/'}`)
  parts.push(`SameSite=${opts.sameSite || 'Strict'}`)
  if (opts.httpOnly !== false) parts.push('HttpOnly')
  if (opts.secure) parts.push('Secure')
  if (opts.maxAge) parts.push(`Max-Age=${opts.maxAge}`)
  res.setHeader('Set-Cookie', parts.join('; '))
}

export const readCookies = (req) => {
  const header = req.headers?.cookie || ''
  return Object.fromEntries(header.split(';').map(p => p.trim()).filter(Boolean).map(kv => {
    const i = kv.indexOf('=')
    const k = i >= 0 ? kv.slice(0, i) : kv
    const v = i >= 0 ? decodeURIComponent(kv.slice(i + 1)) : ''
    return [k, v]
  }))
}

export const logAdminActivity = async (admin, action, details = {}) => {
  const client = getServiceClient()
  if (!client) return
  try {
    await client.from('activity_logs').insert([{ admin_id: admin.id, action, details, created_at: new Date().toISOString() }])
  } catch {}
}
