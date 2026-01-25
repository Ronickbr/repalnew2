import express from 'express';
import * as bannerController from '../controllers/bannerController.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, requireRole(['admin', 'super_admin']), bannerController.getBanners);
router.post('/', authMiddleware, requireRole(['admin', 'super_admin']), bannerController.createBanner);
router.put('/:id', authMiddleware, requireRole(['admin', 'super_admin']), bannerController.updateBanner);
router.delete('/:id', authMiddleware, requireRole(['admin', 'super_admin']), bannerController.deleteBanner);

export default router;
