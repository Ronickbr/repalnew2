import { ENV } from '../config/env.js';
import { isSupabaseConfigured, getServiceClient } from '../config/supabase.js';
import { logAdminActivity } from '../utils/logger.js';

/**
 * Masks API keys in a response object.
 * Keeps only the last 4 visible chars. Empty values return empty.
 * Non-string keys are returned untouched.
 */
function maskSecret(value) {
  if (typeof value !== 'string') return value;
  if (value.trim() === '') return value;
  if (value.length <= 4) return '••••';
  return `${'•'.repeat(Math.max(value.length - 4, 4))}${value.slice(-4)}`;
}

function maskIntegrations(integrations) {
  if (!integrations || typeof integrations !== 'object') return {};
  const sensitiveKeys = /(api[_-]?key|secret|token|password|private[_-]?key)/i;
  const out = { ...integrations };
  for (const k of Object.keys(out)) {
    if (sensitiveKeys.test(k)) {
      out[k] = maskSecret(out[k]);
    } else if (out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
      out[k] = maskIntegrations(out[k]);
    }
  }
  return out;
}

export const getIntegrations = async (req, res) => {
  try {
    if (!isSupabaseConfigured) {
      const devData = { gemini_api_key: maskSecret(ENV.GEMINI_API_KEY || '') };
      return res.json({ success: true, data: devData });
    }

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('site_settings')
      .select('integrations')
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.json({ success: true, data: {} });
      }
      console.error('getIntegrations supabase error:', error);
      return res.status(500).json({ success: false, error: 'Falha ao buscar integrações' });
    }

    const rawIntegrations = data?.integrations || {};

    // Garantir chaves do ENV são mescladas (mas mascaradas)
    const merged = {
      ...rawIntegrations,
      gemini_api_key: rawIntegrations.gemini_api_key || ENV.GEMINI_API_KEY || '',
      openrouter_api_key: rawIntegrations.openrouter_api_key || ENV.OPENROUTER_API_KEY || '',
      openrouter_model: rawIntegrations.openrouter_model || ENV.OPENROUTER_MODEL || '',
    };

    return res.json({ success: true, data: maskIntegrations(merged) });
  } catch (err) {
    console.error('Erro interno em getIntegrations:', err);
    return res.status(500).json({ success: false, error: 'Erro interno ao buscar integrações' });
  }
};

export const updateIntegrations = async (req, res) => {
  try {
    const adminUser = req.admin;
    const { integrations } = req.body || {};

    if (!integrations || typeof integrations !== 'object' || Array.isArray(integrations)) {
      return res.status(400).json({ success: false, error: 'Dados inválidos para integrações' });
    }

    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'update_integrations_dev', {});
      return res.json({ success: true, data: maskIntegrations(integrations) });
    }

    const supabase = getServiceClient();

    // Determina um ID estável para o singleton (usa id=1 ou conflito upsert)
    const payload = {
      integrations,
      updated_at: new Date().toISOString(),
    };

    // Race-condition-free: use upsert on a constraint (primary key id default=1),
    // with .select().single() to avoid multiple rows.
    const { data, error } = await supabase
      .from('site_settings')
      .upsert(payload, {
        onConflict: 'id',
        ignoreDuplicates: false,
      })
      .select('integrations')
      .single();

    if (error) {
      // Fallback caso não exista a constraint onConflict ou primeira linha: check-then-act com transactional attempt
      if (error.code && (String(error.code).includes('42') || error.code === '23502')) {
        const { data: existing } = await supabase
          .from('site_settings')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (existing) {
          const { data: upd, error: updErr } = await supabase
            .from('site_settings')
            .update(payload)
            .eq('id', existing.id)
            .select('integrations')
            .single();
          if (updErr) throw updErr;
          await logAdminActivity(adminUser, 'update_integrations', { strategy: 'update' });
          return res.json({ success: true, data: maskIntegrations(upd?.integrations || {}) });
        }

        const { data: ins, error: insErr } = await supabase
          .from('site_settings')
          .insert([payload])
          .select('integrations')
          .single();
        if (insErr) throw insErr;
        await logAdminActivity(adminUser, 'update_integrations', { strategy: 'insert' });
        return res.json({ success: true, data: maskIntegrations(ins?.integrations || {}) });
      }
      throw error;
    }

    await logAdminActivity(adminUser, 'update_integrations', { strategy: 'upsert' });
    return res.json({ success: true, data: maskIntegrations(data?.integrations || {}) });
  } catch (err) {
    console.error('Erro em updateIntegrations:', err);
    return res.status(500).json({
      success: false,
      error: (err && err.message) ? err.message : 'Erro interno ao atualizar integrações',
    });
  }
};
