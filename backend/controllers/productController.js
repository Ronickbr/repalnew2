import { ENV } from '../config/env.js';
import { isSupabaseConfigured, getServiceClient } from '../config/supabase.js';
import { logAdminActivity } from '../utils/logger.js';

export const getProducts = async (req, res) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({ success: true, data: [] });
    }
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(url, sort_order)')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno ao listar produtos' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const adminUser = req.admin;
    const { product, additionalImages } = req.body || {};
    
    if (!product || !product.name || !product.category_id) {
      return res.status(400).json({ success: false, error: 'Dados do produto inválidos' });
    }

    if (!isSupabaseConfigured) {
      const fake = { ...product, id: Math.floor(Math.random() * 1000000), created_at: new Date().toISOString() };
      await logAdminActivity(adminUser, 'create_product_dev', { product_id: fake.id });
      return res.json({ success: true, data: fake });
    }
    
    const supabase = getServiceClient();
    const { data: inserted, error: insertError } = await supabase
      .from('products')
      .insert([product])
      .select('*')
      .single();
      
    if (insertError) {
      return res.status(500).json({ success: false, error: insertError.message, code: insertError.code, details: insertError.details, hint: insertError.hint });
    }

    if (Array.isArray(additionalImages) && additionalImages.length > 0) {
      const records = additionalImages.filter(Boolean).map((url, idx) => ({
        product_id: inserted.id,
        url,
        sort_order: idx
      }));
      if (records.length > 0) {
        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(records);
        if (imagesError) {
          return res.status(200).json({ success: true, data: inserted, images_warning: imagesError.message });
        }
      }
    }

    await logAdminActivity(adminUser, 'create_product', { product_id: inserted.id });
    return res.json({ success: true, data: inserted });
  } catch (err) {
    return res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro interno' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const adminUser = req.admin;
    const id = req.params.id;
    const { product, additionalImages } = req.body || {};

    if (!id || !product) {
      return res.status(400).json({ success: false, error: 'Dados inválidos' });
    }

    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'update_product_dev', { product_id: id });
      return res.json({ success: true, data: { ...product, id } });
    }

    const supabase = getServiceClient();
    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      return res.status(500).json({ success: false, error: updateError.message });
    }

    // Atualizar imagens se fornecidas (estratégia simples: remove todas e insere novas, ou apenas adiciona)
    // Aqui assumimos que additionalImages é a lista completa desejada
    if (Array.isArray(additionalImages)) {
      await supabase.from('product_images').delete().eq('product_id', id);
      if (additionalImages.length > 0) {
        const records = additionalImages.filter(Boolean).map((url, idx) => ({
          product_id: id,
          url,
          sort_order: idx
        }));
        await supabase.from('product_images').insert(records);
      }
    }

    await logAdminActivity(adminUser, 'update_product', { product_id: id });
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno ao atualizar produto' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const adminUser = req.admin;
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, error: 'ID inválido' });

    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'delete_product_dev', { product_id: id });
      return res.json({ success: true });
    }

    const supabase = getServiceClient();
    // Supabase cascade delete deve estar configurado no banco para product_images
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    await logAdminActivity(adminUser, 'delete_product', { product_id: id });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno ao deletar produto' });
  }
};

export const bulkDeleteProducts = async (req, res) => {
  try {
    const adminUser = req.admin;
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'IDs inválidos' });
    }

    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'bulk_delete_product_dev', { count: ids.length });
      return res.json({ success: true });
    }

    const supabase = getServiceClient();
    const { error } = await supabase.from('products').delete().in('id', ids);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    await logAdminActivity(adminUser, 'bulk_delete_product', { count: ids.length });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};
