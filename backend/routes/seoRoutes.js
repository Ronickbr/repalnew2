import express from 'express';
import * as seoController from '../controllers/seoController.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();
router.post('/robots', authMiddleware, requireRole(['admin', 'super_admin']), seoController.updateRobots);
router.post('/sitemap', authMiddleware, requireRole(['admin', 'super_admin']), seoController.updateSitemap);
export default router;
