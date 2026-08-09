import { getServiceClient, isSupabaseConfigured } from '../config/supabase.js';
import { logAdminActivity } from '../utils/logger.js';

/**
 * Service for managing products.
 * Encapsulates business logic for listing, creating, and updating products.
 */
class ProductService {
  /**
   * Retrieves all products ordered by creation date (descending).
   * @param {Object} opts - Optional filters: search, categoryId, subcategoryId, featured, active, sortBy, sortOrder.
   * @returns {Promise<Array>} List of products with their images.
   * @throws {Error} If database query fails.
   */
  async getAll(opts = {}) {
    if (!isSupabaseConfigured) {
      return [];
    }
    const supabase = getServiceClient();
    let query = supabase
      .from('products')
      .select('*, categories(name), product_images(url, sort_order)');

    if (opts.search) {
      query = query.or(`name.ilike.%${opts.search}%,description.ilike.%${opts.search}%`);
    }
    if (opts.categoryId != null && opts.categoryId !== '') {
      query = query.eq('category_id', opts.categoryId);
    }
    if (opts.subcategoryId != null && opts.subcategoryId !== '') {
      query = query.eq('subcategory_id', opts.subcategoryId);
    }
    if (opts.featured === 'true') {
      query = query.eq('featured', true);
    } else if (opts.featured === 'false') {
      query = query.eq('featured', false);
    }
    if (opts.active === 'true') {
      query = query.eq('active', true);
    } else if (opts.active === 'false') {
      query = query.eq('active', false);
    }

    const allowedSort = ['created_at', 'name', 'price', 'updated_at'];
    const sortBy = allowedSort.includes(opts.sortBy) ? opts.sortBy : 'created_at';
    const ascending = opts.sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  /**
   * Creates a new product and optionally adds additional images.
   * @param {Object} productData - The product details.
   * @param {Array<string>} additionalImages - List of image URLs.
   * @param {Object} adminUser - The admin user performing the action.
   * @returns {Promise<Object>} The created product.
   * @throws {Error} If creation fails.
   */
  async create(productData, additionalImages, adminUser) {
    if (!productData || !productData.name || !productData.category_id) {
      throw new Error('Dados do produto inválidos');
    }

    if (!isSupabaseConfigured) {
      const fake = { ...productData, id: Math.floor(Math.random() * 1000000), created_at: new Date().toISOString() };
      await logAdminActivity(adminUser, 'create_product_dev', { product_id: fake.id });
      return fake;
    }

    const supabase = getServiceClient();

    // Garantir unicidade do slug
    let slug = productData.slug;
    if (slug) {
      const baseSlug = slug;
      let counter = 1;
      let currentSlug = slug;
      for (;;) {
        const { data: existing, error: checkError } = await supabase
          .from('products')
          .select('id')
          .eq('slug', currentSlug)
          .maybeSingle();
        if (checkError) {
          break;
        }
        if (!existing) {
          slug = currentSlug;
          break;
        }
        currentSlug = `${baseSlug}-${counter}`;
        counter += 1;
        if (counter > 100) {
          slug = `${baseSlug}-${Date.now()}`;
          break;
        }
      }
    }
    const attemptInsert = async (row) => {
      const result = await supabase
        .from('products')
        .insert([row])
        .select('*')
        .single();
      return result;
    };

    let { data: inserted, error: insertError } = await attemptInsert({ ...productData, slug });

    if (insertError && insertError.code === '23505' && /products_pkey/.test(insertError.message)) {
      // Sequência do PK dessincronizada (imports antigos usaram ids explícitos).
      // Reinsere com o próximo id disponível e avança a sequência automaticamente.
      const { data: maxRow } = await supabase
        .from('products')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);
      const nextId = maxRow && maxRow.length > 0 ? maxRow[0].id + 1 : 1;
      const retried = await attemptInsert({ ...productData, slug, id: nextId });
      inserted = retried.data;
      insertError = retried.error;
    }

    if (insertError) {
      const error = new Error(insertError.message);
      error.details = insertError; // Attach details for controller handling if needed
      throw error;
    }

    // Handle additional images
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
          // We log or return warning, but don't fail the whole operation?
          // The original controller returned success with warning.
          // Let's attach warning to the result object.
          inserted.images_warning = imagesError.message;
        }
      }
    }

    await logAdminActivity(adminUser, 'create_product', { product_id: inserted.id });
    return inserted;
  }

  /**
   * Updates an existing product and optionally replaces its additional images.
   * @param {string} id - Product ID.
   * @param {Object} productData - Data to update.
   * @param {Array<string>} additionalImages - List of image URLs to replace existing ones.
   * @param {Object} adminUser - Admin user performing the action.
   * @returns {Promise<Object>} The updated product.
   * @throws {Error} If update fails.
   */
  async update(id, productData, additionalImages, adminUser) {
    if (!id || !productData) {
      throw new Error('Dados inválidos');
    }

    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'update_product_dev', { product_id: id });
      return { ...productData, id };
    }

    const supabase = getServiceClient();
    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    if (Array.isArray(additionalImages)) {
      const { error: deleteError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', id);

      if (deleteError) {
        console.warn('Erro ao remover imagens antigas:', deleteError.message);
      } else {
        const validImages = additionalImages.filter(img => img && img.trim() !== '');
        if (validImages.length > 0) {
          const imageRecords = validImages.map((url, index) => ({
            product_id: id,
            url,
            sort_order: index
          }));
          const { error: imagesError } = await supabase
            .from('product_images')
            .insert(imageRecords);
          if (imagesError) {
            updated.images_warning = imagesError.message;
          }
        }
      }
    }

    await logAdminActivity(adminUser, 'update_product', { product_id: id });
    return updated;
  }

  /**
   * Updates prices for multiple products in bulk (price adjustment).
   * @param {Array<{id: string|number, price: number}>} updates - List of { id, price }.
   * @param {Object} adminUser - The admin user performing the action.
   * @returns {Promise<number>} Count of products updated.
   * @throws {Error} If validation or update fails.
   */
  async bulkUpdatePrice(updates, adminUser) {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error('Nenhum produto para atualizar');
    }

    const validUpdates = updates.filter(u => {
      if (!u || u.id === undefined || u.id === null || u.id === '') return false;
      const price = Number(u.price);
      return u.price !== null && u.price !== undefined && u.price !== '' && Number.isFinite(price);
    });
    if (validUpdates.length === 0) {
      throw new Error('Dados de reajuste inválidos');
    }

    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'bulk_update_price_dev', { count: validUpdates.length });
      return validUpdates.length;
    }

    const supabase = getServiceClient();
    const now = new Date().toISOString();
    let updatedCount = 0;

    for (const update of validUpdates) {
      const price = Number(update.price);
      const { error } = await supabase
        .from('products')
        .update({ price, updated_at: now })
        .eq('id', update.id);

      if (error) {
        console.warn(`Erro ao atualizar preço do produto ${update.id}:`, error.message);
      } else {
        updatedCount++;
      }
    }

    await logAdminActivity(adminUser, 'bulk_update_price', { count: updatedCount });
    return updatedCount;
  }

  /**
   * Deletes a product by ID.
   * @param {string|number} id - Product ID.
   * @param {Object} adminUser - The admin user performing the action.
   * @returns {Promise<boolean>} True if deleted.
   * @throws {Error} If deletion fails.
   */
  async delete(id, adminUser) {
    if (!id) {
      throw new Error('ID do produto obrigatório');
    }

    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'delete_product_dev', { product_id: id });
      return true;
    }

    const supabase = getServiceClient();
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    await logAdminActivity(adminUser, 'delete_product', { product_id: id });
    return true;
  }

  /**
   * Deletes multiple products by their IDs.
   * @param {Array<string|number>} ids - List of product IDs.
   * @param {Object} adminUser - The admin user performing the action.
   * @returns {Promise<{ deletedCount: number, failed: Array }>} Result summary.
   * @throws {Error} If bulk operation fails.
   */
  async bulkDelete(ids, adminUser) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('Lista de IDs inválida');
    }

    const validIds = ids.filter(id => id !== null && id !== undefined && id !== '');
    if (validIds.length === 0) {
      throw new Error('Nenhum ID válido fornecido');
    }

    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'bulk_delete_products_dev', { count: validIds.length });
      return { deletedCount: validIds.length, failed: [] };
    }

    const supabase = getServiceClient();
    const { error } = await supabase
      .from('products')
      .delete()
      .in('id', validIds);

    if (error) {
      throw new Error(error.message);
    }

    await logAdminActivity(adminUser, 'bulk_delete_products', { count: validIds.length, ids: validIds });
    return { deletedCount: validIds.length, failed: [] };
  }
}

export const productService = new ProductService();
