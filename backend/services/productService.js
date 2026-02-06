import { getServiceClient, isSupabaseConfigured } from '../config/supabase.js';
import { logAdminActivity } from '../utils/logger.js';

/**
 * Service for managing products.
 * Encapsulates business logic for listing, creating, and updating products.
 */
class ProductService {
  /**
   * Retrieves all products ordered by creation date (descending).
   * @returns {Promise<Array>} List of products with their images.
   * @throws {Error} If database query fails.
   */
  async getAll() {
    if (!isSupabaseConfigured) {
      return [];
    }
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(url, sort_order)')
      .order('created_at', { ascending: false });

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
    const { data: inserted, error: insertError } = await supabase
      .from('products')
      .insert([productData])
      .select('*')
      .single();

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
   * Updates an existing product.
   * @param {string} id - Product ID.
   * @param {Object} productData - Data to update.
   * @param {Object} adminUser - Admin user performing the action.
   * @returns {Promise<Object>} The updated product.
   * @throws {Error} If update fails.
   */
  async update(id, productData, adminUser) {
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
    
    // Note: The original controller didn't seem to handle additionalImages update logic fully 
    // (it accepted them in body but didn't use them in update block shown in Read output).
    // I will stick to what was visible in the Read output for updateProduct (lines 74-99).
    
    await logAdminActivity(adminUser, 'update_product', { product_id: id });
    return updated;
  }
}

export const productService = new ProductService();
