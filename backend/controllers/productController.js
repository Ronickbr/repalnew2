import { productService } from '../services/productService.js';

/**
 * Retrieves the list of products (admin view — includes inactive products).
 * Supports search, category/subcategory filters and sorting via query params.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const getProducts = async (req, res) => {
  try {
    const { search, category_id, subcategory_id, featured, active, sort_by, sort_order } = req.query || {};
    const data = await productService.getAll({
      search,
      categoryId: category_id,
      subcategoryId: subcategory_id,
      featured,
      active,
      sortBy: sort_by,
      sortOrder: sort_order,
    });
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Erro ao listar produtos:', err);
    return res.status(500).json({ success: false, error: 'Erro interno ao listar produtos' });
  }
};

/**
 * Creates a new product.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const createProduct = async (req, res) => {
  try {
    const adminUser = req.admin;
    const { product, additionalImages } = req.body || {};
    
    const data = await productService.create(product, additionalImages, adminUser);
    
    // Check for image warnings passed back
    if (data.images_warning) {
        return res.status(200).json({ success: true, data, images_warning: data.images_warning });
    }
    
    return res.json({ success: true, data });
  } catch (err) {
    const status = err.message === 'Dados do produto inválidos' ? 400 : 500;
    console.error('Erro ao criar produto:', err);
    return res.status(status).json({
      success: false,
      error: status === 400 ? err.message : 'Erro interno ao criar produto'
    });
  }
};

/**
 * Updates an existing product.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const updateProduct = async (req, res) => {
  try {
    const adminUser = req.admin;
    const id = req.params.id;
    const { product, additionalImages } = req.body || {};

    const data = await productService.update(id, product, additionalImages, adminUser);
    return res.json({ success: true, data });
  } catch (err) {
    const status = err.message === 'Dados inválidos' ? 400 : 500;
    console.error('Erro ao atualizar produto:', err);
    return res.status(status).json({ success: false, error: status === 400 ? err.message : 'Erro interno ao atualizar produto' });
  }
};

/**
 * Updates prices for multiple products in bulk (price adjustment).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const bulkUpdatePrice = async (req, res) => {
  try {
    const adminUser = req.admin;
    const { updates } = req.body || {};

    const count = await productService.bulkUpdatePrice(updates, adminUser);
    return res.json({ success: true, data: { updated: count } });
  } catch (err) {
    const status = err.message === 'Nenhum produto para atualizar' || err.message === 'Dados de reajuste inválidos' ? 400 : 500;
    console.error('Erro ao atualizar preços em massa:', err);
    return res.status(status).json({ success: false, error: status === 400 ? err.message : 'Erro interno ao atualizar preços em massa' });
  }
};

/**
 * Deletes a product.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = req.admin;
    const deleted = await productService.delete(id, adminUser);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Produto não encontrado' });
    }
    return res.json({ success: true, message: 'Produto deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar produto:', err);
    return res.status(500).json({ success: false, error: 'Erro interno ao deletar produto' });
  }
};

/**
 * Deletes multiple products in bulk.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const bulkDeleteProducts = async (req, res) => {
  try {
    const adminUser = req.admin;
    const { ids } = req.body || {};
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Nenhum ID de produto fornecido para exclusão em massa' });
    }
    const result = await productService.bulkDelete(ids, adminUser);
    const deletedCount = typeof result.deletedCount === 'number' ? result.deletedCount : ids.length;
    return res.json({
      success: true,
      message: `${deletedCount} produtos deletados com sucesso`,
      deletedCount,
      failed: result.failed || []
    });
  } catch (err) {
    console.error('Erro ao deletar produtos em massa:', err);
    return res.status(500).json({ success: false, error: 'Erro interno ao deletar produtos em massa' });
  }
};
