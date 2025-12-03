import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false })
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.json({ success: true, data: { google_analytics_id: '', google_tag_manager_id: '', facebook_pixel_id: '' } })
  }
  const client = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await client.from('site_settings').select('integrations').single()
  if (error && error.code !== 'PGRST116') return res.status(500).json({ success: false, error: error.message })
  const integrations = (data && data.integrations) || {}
  const response = {
    google_analytics_id: integrations.google_analytics_id || '',
    google_tag_manager_id: integrations.google_tag_manager_id || '',
    facebook_pixel_id: integrations.facebook_pixel_id || ''
  }
  res.json({ success: true, data: response })
}

