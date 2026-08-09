import express from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, requireRole(['admin', 'super_admin']), categoryController.getCategories);
router.post('/', authMiddleware, requireRole(['admin', 'super_admin']), categoryController.createCategory);
router.put('/:id', authMiddleware, requireRole(['admin', 'super_admin']), categoryController.updateCategory);
router.delete('/:id', authMiddleware, requireRole(['admin', 'super_admin']), categoryController.deleteCategory);
router.post('/bulk-delete', authMiddleware, requireRole(['admin', 'super_admin']), categoryController.bulkDeleteCategories);

export default router;
