import { ENV } from '../config/env.js';
import { isSupabaseConfigured, getServiceClient } from '../config/supabase.js';
import { logAdminActivity } from '../utils/logger.js';

export const getBanners = async (req, res) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({ success: true, data: [] });
    }
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};

export const createBanner = async (req, res) => {
  try {
    const adminUser = req.admin;
    const { banner } = req.body || {};
    if (!banner || !banner.image_url) {
      return res.status(400).json({ success: false, error: 'Dados do banner inválidos' });
    }

    if (!isSupabaseConfigured) {
      const fake = { ...banner, id: `dev-${Math.random().toString(36).slice(2)}` };
      await logAdminActivity(adminUser, 'create_banner_dev', { banner_id: fake.id });
      return res.json({ success: true, data: fake });
    }

    const supabase = getServiceClient();
    const { data: inserted, error: insertError } = await supabase
      .from('banners')
      .insert([banner])
      .select('*')
      .single();

    if (insertError) {
      return res.status(500).json({ success: false, error: insertError.message });
    }

    await logAdminActivity(adminUser, 'create_banner', { banner_id: inserted.id });
    return res.json({ success: true, data: inserted });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};

export const updateBanner = async (req, res) => {
  try {
    const adminUser = req.admin;
    const id = req.params.id;
    const { banner } = req.body || {};
    
    if (!id || !banner) {
      return res.status(400).json({ success: false, error: 'Dados inválidos' });
    }

    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'update_banner_dev', { banner_id: id });
      return res.json({ success: true, data: { ...banner, id } });
    }

    const supabase = getServiceClient();
    const { data: updated, error: updateError } = await supabase
      .from('banners')
      .update(banner)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      return res.status(500).json({ success: false, error: updateError.message });
    }

    await logAdminActivity(adminUser, 'update_banner', { banner_id: id });
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const adminUser = req.admin;
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, error: 'ID inválido' });

    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'delete_banner_dev', { banner_id: id });
      return res.json({ success: true });
    }

    const supabase = getServiceClient();
    const { error } = await supabase.from('banners').delete().eq('id', id);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    await logAdminActivity(adminUser, 'delete_banner', { banner_id: id });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};
