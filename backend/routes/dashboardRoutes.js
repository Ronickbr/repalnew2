import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, requireRole(['admin', 'super_admin']), dashboardController.getDashboardData);

export default router;
