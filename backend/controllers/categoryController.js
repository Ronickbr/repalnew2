import { isSupabaseConfigured, getServiceClient } from '../config/supabase.js';
import { logAdminActivity } from '../utils/logger.js';

export const getCategories = async (req, res) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({ success: true, data: [] });
    }
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('categories')
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

export const createCategory = async (req, res) => {
  try {
    const adminUser = req.admin;
    const { category } = req.body || {};
    if (!category || !category.name || !category.slug) {
      return res.status(400).json({ success: false, error: 'Dados da categoria inválidos' });
    }
    if (!isSupabaseConfigured) {
      const fake = { ...category, id: `dev-${Math.random().toString(36).slice(2)}`, created_at: new Date().toISOString() };
      await logAdminActivity(adminUser, 'create_category_dev', { category_id: fake.id });
      return res.json({ success: true, data: fake });
    }
    const supabase = getServiceClient();
    const { data: inserted, error: insertError } = await supabase
      .from('categories')
      .insert([category])
      .select('*')
      .single();
    if (insertError) {
      console.error('Erro ao criar categoria:', insertError);
      return res.status(500).json({ success: false, error: 'Erro interno ao criar categoria' });
    }
    await logAdminActivity(adminUser, 'create_category', { category_id: inserted.id });
    return res.json({ success: true, data: inserted });
  } catch (err) {
    console.error('Erro interno no controller de categorias:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const adminUser = req.admin;
    const id = req.params.id;
    const { category } = req.body || {};
    if (!id || !category || Object.keys(category).length === 0) {
      return res.status(400).json({ success: false, error: 'Dados da categoria inválidos' });
    }
    if (!isSupabaseConfigured) {
      const fake = { id, ...category, updated_at: new Date().toISOString() };
      await logAdminActivity(adminUser, 'update_category_dev', { category_id: id });
      return res.json({ success: true, data: fake });
    }
    const supabase = getServiceClient();
    const { data: updated, error: updateError } = await supabase
      .from('categories')
      .update(category)
      .eq('id', id)
      .select('*')
      .single();
    if (updateError) {
      console.error('Erro ao atualizar categoria:', updateError);
      return res.status(500).json({ success: false, error: 'Erro interno ao atualizar categoria' });
    }
    await logAdminActivity(adminUser, 'update_category', { category_id: id });
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Erro interno no controller de categorias:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const adminUser = req.admin;
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }
    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'delete_category_dev', { category_id: id });
      return res.json({ success: true });
    }
    const supabase = getServiceClient();
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (deleteError) {
      console.error('Erro ao deletar categoria:', deleteError);
      return res.status(500).json({ success: false, error: 'Erro interno ao deletar categoria' });
    }
    await logAdminActivity(adminUser, 'delete_category', { category_id: id });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};

export const bulkDeleteCategories = async (req, res) => {
  try {
    const adminUser = req.admin;
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Lista de IDs inválida' });
    }
    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'bulk_delete_category_dev', { count: ids.length });
      return res.json({ success: true });
    }
    const supabase = getServiceClient();
    const { error } = await supabase.from('categories').delete().in('id', ids);
    if (error) {
      console.error('Erro ao deletar categorias em massa:', error);
      return res.status(500).json({ success: false, error: 'Erro interno ao deletar categorias em massa' });
    }
    await logAdminActivity(adminUser, 'bulk_delete_category', { count: ids.length });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};
