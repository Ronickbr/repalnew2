import { productService } from '../services/productService.js';

/**
 * Retrieves the list of products.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const getProducts = async (req, res) => {
  try {
    const data = await productService.getAll();
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Erro interno ao listar produtos' });
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
    return res.status(status).json({ 
      success: false, 
      error: err.message, 
      details: err.details,
      hint: err.details?.hint 
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
    const { product } = req.body || {};

    const data = await productService.update(id, product, adminUser);
    return res.json({ success: true, data });
  } catch (err) {
    const status = err.message === 'Dados inválidos' ? 400 : 500;
    return res.status(status).json({ success: false, error: err.message });
  }
};
