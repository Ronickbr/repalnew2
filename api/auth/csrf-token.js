import { ENV } from '../../backend/config/env.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Método não permitido' });
    return;
  }
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const secure = ENV.NODE_ENV === 'production';
  res.setHeader('Set-Cookie', `csrf_token=${token}; Path=/; SameSite=Strict; HttpOnly=false; ${secure ? 'Secure' : ''}`);
  res.status(200).json({ success: true, csrfToken: token });
}
