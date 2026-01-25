import { ENV } from '../config/env.js';
import { isSupabaseConfigured, getServiceClient } from '../config/supabase.js';
import { logAdminActivity } from '../utils/logger.js';

export const getBrands = async (req, res) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({ success: true, data: [] });
    }
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('brands')
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

export const createBrand = async (req, res) => {
  try {
    const adminUser = req.admin;
    const { brand } = req.body || {};
    if (!brand || !brand.name || !brand.slug) {
      return res.status(400).json({ success: false, error: 'Dados da marca inválidos' });
    }
    if (!isSupabaseConfigured) {
      const fake = { ...brand, id: `dev-${Math.random().toString(36).slice(2)}`, created_at: new Date().toISOString() };
      await logAdminActivity(adminUser, 'create_brand_dev', { brand_id: fake.id });
      return res.json({ success: true, data: fake });
    }
    const supabase = getServiceClient();
    const { data: inserted, error: insertError } = await supabase
      .from('brands')
      .insert([brand])
      .select('*')
      .single();
    if (insertError) {
      return res.status(500).json({ success: false, error: insertError.message, code: insertError.code, details: insertError.details, hint: insertError.hint });
    }
    await logAdminActivity(adminUser, 'create_brand', { brand_id: inserted.id });
    return res.json({ success: true, data: inserted });
  } catch (err) {
    return res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro interno' });
  }
};

export const updateBrand = async (req, res) => {
  try {
    const adminUser = req.admin;
    const id = req.params.id;
    const { brand } = req.body || {};
    if (!id || !brand || Object.keys(brand).length === 0) {
      return res.status(400).json({ success: false, error: 'Dados da marca inválidos' });
    }
    if (!isSupabaseConfigured) {
      const fake = { id, ...brand, updated_at: new Date().toISOString() };
      await logAdminActivity(adminUser, 'update_brand_dev', { brand_id: id });
      return res.json({ success: true, data: fake });
    }
    const supabase = getServiceClient();
    const { data: updated, error: updateError } = await supabase
      .from('brands')
      .update(brand)
      .eq('id', id)
      .select('*')
      .single();
    if (updateError) {
      return res.status(500).json({ success: false, error: updateError.message, code: updateError.code, details: updateError.details, hint: updateError.hint });
    }
    await logAdminActivity(adminUser, 'update_brand', { brand_id: id });
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro interno' });
  }
};

export const deleteBrand = async (req, res) => {
  try {
    const adminUser = req.admin;
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }
    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'delete_brand_dev', { brand_id: id });
      return res.json({ success: true });
    }
    const supabase = getServiceClient();
    const { error: deleteError } = await supabase
      .from('brands')
      .delete()
      .eq('id', id);
    if (deleteError) {
      return res.status(500).json({ success: false, error: deleteError.message, code: deleteError.code, details: deleteError.details, hint: deleteError.hint });
    }
    await logAdminActivity(adminUser, 'delete_brand', { brand_id: id });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro interno' });
  }
};

export const bulkDeleteBrands = async (req, res) => {
  try {
    const adminUser = req.admin;
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Lista de IDs inválida' });
    }
    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'bulk_delete_brand_dev', { count: ids.length });
      return res.json({ success: true, deleted: ids.length });
    }
    const supabase = getServiceClient();
    const { error } = await supabase.from('brands').delete().in('id', ids);
    
    if (error) {
       return res.status(500).json({ success: false, error: error.message });
    }
    
    await logAdminActivity(adminUser, 'bulk_delete_brand', { count: ids.length });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};
