import express from 'express';
import * as brandController from '../controllers/brandController.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, requireRole(['admin', 'super_admin']), brandController.getBrands);
router.post('/', authMiddleware, requireRole(['admin', 'super_admin']), brandController.createBrand);
router.put('/:id', authMiddleware, requireRole(['admin', 'super_admin']), brandController.updateBrand);
router.delete('/:id', authMiddleware, requireRole(['admin', 'super_admin']), brandController.deleteBrand);
router.post('/bulk-delete', authMiddleware, requireRole(['admin', 'super_admin']), brandController.bulkDeleteBrands);

export default router;
