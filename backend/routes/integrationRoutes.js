import express from 'express';
import * as integrationController from '../controllers/integrationController.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, requireRole(['super_admin']), integrationController.getIntegrations);
router.post('/', authMiddleware, requireRole(['super_admin']), integrationController.updateIntegrations);

export default router;
