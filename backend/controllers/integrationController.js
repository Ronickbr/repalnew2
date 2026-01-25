import { ENV } from '../config/env.js';
import { isSupabaseConfigured, getServiceClient } from '../config/supabase.js';
import { logAdminActivity } from '../utils/logger.js';

export const getIntegrations = async (req, res) => {
  try {
    if (!isSupabaseConfigured) {
      // Retornar mock ou vazio em dev mode sem supabase
      return res.json({ success: true, data: { gemini_api_key: ENV.GEMINI_API_KEY || '' } });
    }
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('site_settings')
      .select('integrations')
      .single();

    if (error) {
      // Se não existir, retornar vazio
      if (error.code === 'PGRST116') {
         return res.json({ success: true, data: {} });
      }
      return res.status(500).json({ success: false, error: error.message });
    }
    
    // Mascarar chaves se necessário, ou retornar como está para o admin ver/editar
    return res.json({ success: true, data: data?.integrations || {} });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};

export const updateIntegrations = async (req, res) => {
  try {
    const adminUser = req.admin;
    const { integrations } = req.body || {};
    
    if (!integrations) {
      return res.status(400).json({ success: false, error: 'Dados inválidos' });
    }

    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'update_integrations_dev', {});
      return res.json({ success: true, data: integrations });
    }

    const supabase = getServiceClient();
    
    // Verificar se existe registro
    const { data: existing } = await supabase.from('site_settings').select('id').single();
    
    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('site_settings')
        .update({ integrations, updated_at: new Date() })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('site_settings')
        .insert([{ integrations }])
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    await logAdminActivity(adminUser, 'update_integrations', {});
    return res.json({ success: true, data: result?.integrations });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Erro interno' });
  }
};
