import { isSupabaseConfigured, getServiceClient } from '../config/supabase.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Cria um lead a partir de formulários públicos (sem autenticação).
 * Valida campos essenciais e aplica limites de tamanho.
 */
export const createPublicLead = async (req, res) => {
  try {
    const body = req.body || {};
    const client_name = typeof body.client_name === 'string' ? body.client_name.trim() : (typeof body.name === 'string' ? body.name.trim() : '');
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const product_name = typeof body.product_name === 'string' ? body.product_name.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const source = typeof body.source === 'string' ? body.source.trim() : '';

    if (!client_name) {
      return res.status(400).json({ success: false, error: 'Nome é obrigatório' });
    }
    if (client_name.length > 150) {
      return res.status(400).json({ success: false, error: 'Nome muito longo' });
    }
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, error: 'Email inválido' });
    }
    if (email.length > 255) {
      return res.status(400).json({ success: false, error: 'Email muito longo' });
    }
    if (phone.length > 30 || message.length > 5000 || product_name.length > 300 || name.length > 300 || source.length > 100) {
      return res.status(400).json({ success: false, error: 'Dados do formulário inválidos' });
    }

    if (!isSupabaseConfigured) {
      return res.json({ success: true, data: { id: `dev-${Math.random().toString(36).slice(2)}` } });
    }

    const supabase = getServiceClient();
    const now = new Date().toISOString();
    const { data: inserted, error } = await supabase
      .from('leads')
      .insert({
        name: client_name,
        email,
        phone: phone || null,
        message: message || null,
        product_name: product_name || name || null,
        source: source || 'public',
        created_at: now,
        updated_at: now,
        status: 'novo'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Erro ao criar lead público:', error);
      return res.status(500).json({ success: false, error: 'Erro interno ao salvar formulário' });
    }

    return res.json({ success: true, data: inserted });
  } catch (err) {
    console.error('Erro interno ao criar lead público:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
};
