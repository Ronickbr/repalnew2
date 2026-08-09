import { isSupabaseConfigured, getServiceClient } from '../config/supabase.js';
import { logAdminActivity } from '../utils/logger.js';

export const getSettings = async (req, res) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({ success: true, data: {} });
    }
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.json({ success: true, data: data || {} });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const adminUser = req.admin;
    const { settings } = req.body || {};
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, error: 'Dados de configuração inválidos' });
    }
    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'update_settings_dev', {});
      return res.json({ success: true, data: settings });
    }
    const supabase = getServiceClient();

    let rowId = settings.id;
    if (!rowId) {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .limit(1)
        .maybeSingle();
      rowId = existing?.id ?? null;
    }

    let result;
    if (rowId) {
      const { id, created_at, ...payload } = settings;
      const { data, error } = await supabase
        .from('site_settings')
        .update(payload)
        .eq('id', rowId)
        .select('*')
        .single();
      result = { data, error };
    } else {
      const { id, ...payload } = settings;
      const { data, error } = await supabase
        .from('site_settings')
        .insert([{ ...payload, created_at: new Date().toISOString() }])
        .select('*')
        .single();
      result = { data, error };
    }

    if (result.error) {
      console.error('Erro ao salvar configurações:', result.error);
      return res.status(500).json({ success: false, error: 'Erro interno ao salvar configurações' });
    }
    await logAdminActivity(adminUser, 'update_settings', {});
    return res.json({ success: true, data: result.data });
  } catch (err) {
    console.error('Erro interno no controller de configurações:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
};

export const getStores = async (req, res) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({ success: true, data: [] });
    }
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};

export const createStore = async (req, res) => {
  try {
    const adminUser = req.admin;
    const { store } = req.body || {};
    if (!store || !store.name) {
      return res.status(400).json({ success: false, error: 'Dados da loja inválidos' });
    }
    if (!isSupabaseConfigured) {
      const fake = { ...store, id: `dev-${Math.random().toString(36).slice(2)}`, created_at: new Date().toISOString() };
      await logAdminActivity(adminUser, 'create_store_dev', { store_id: fake.id });
      return res.json({ success: true, data: fake });
    }
    const supabase = getServiceClient();
    const { data: inserted, error: insertError } = await supabase
      .from('stores')
      .insert([{ ...store, created_at: new Date().toISOString() }])
      .select('*')
      .single();
    if (insertError) {
      console.error('Erro ao criar loja:', insertError);
      return res.status(500).json({ success: false, error: 'Erro interno ao criar loja' });
    }
    await logAdminActivity(adminUser, 'create_store', { store_id: inserted.id });
    return res.json({ success: true, data: inserted });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};

export const updateStore = async (req, res) => {
  try {
    const adminUser = req.admin;
    const id = req.params.id;
    const { store } = req.body || {};
    if (!id || !store || Object.keys(store).length === 0) {
      return res.status(400).json({ success: false, error: 'Dados da loja inválidos' });
    }
    if (!isSupabaseConfigured) {
      const fake = { id, ...store, updated_at: new Date().toISOString() };
      await logAdminActivity(adminUser, 'update_store_dev', { store_id: id });
      return res.json({ success: true, data: fake });
    }
    const supabase = getServiceClient();
    const { data: updated, error: updateError } = await supabase
      .from('stores')
      .update(store)
      .eq('id', id)
      .select('*')
      .single();
    if (updateError) {
      console.error('Erro ao atualizar loja:', updateError);
      return res.status(500).json({ success: false, error: 'Erro interno ao atualizar loja' });
    }
    await logAdminActivity(adminUser, 'update_store', { store_id: id });
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};

export const deleteStore = async (req, res) => {
  try {
    const adminUser = req.admin;
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }
    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'delete_store_dev', { store_id: id });
      return res.json({ success: true });
    }
    const supabase = getServiceClient();
    const { error: deleteError } = await supabase
      .from('stores')
      .delete()
      .eq('id', id);
    if (deleteError) {
      console.error('Erro ao deletar loja:', deleteError);
      return res.status(500).json({ success: false, error: 'Erro interno ao deletar loja' });
    }
    await logAdminActivity(adminUser, 'delete_store', { store_id: id });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};
