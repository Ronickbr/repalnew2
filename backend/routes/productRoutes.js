import express from 'express';
import * as productController from '../controllers/productController.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, requireRole(['admin', 'super_admin']), productController.getProducts);
router.post('/', authMiddleware, requireRole(['admin', 'super_admin']), productController.createProduct);
router.put('/:id', authMiddleware, requireRole(['admin', 'super_admin']), productController.updateProduct);
router.delete('/:id', authMiddleware, requireRole(['admin', 'super_admin']), productController.deleteProduct);
router.post('/bulk-delete', authMiddleware, requireRole(['admin', 'super_admin']), productController.bulkDeleteProducts);

export default router;
