import express from 'express';
import * as settingsController from '../controllers/settingsController.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/site-settings', authMiddleware, requireRole(['admin', 'super_admin']), settingsController.getSettings);
router.put('/site-settings', authMiddleware, requireRole(['admin', 'super_admin']), settingsController.updateSettings);
router.get('/stores', authMiddleware, requireRole(['admin', 'super_admin']), settingsController.getStores);
router.post('/stores', authMiddleware, requireRole(['admin', 'super_admin']), settingsController.createStore);
router.put('/stores/:id', authMiddleware, requireRole(['admin', 'super_admin']), settingsController.updateStore);
router.delete('/stores/:id', authMiddleware, requireRole(['admin', 'super_admin']), settingsController.deleteStore);

export default router;
