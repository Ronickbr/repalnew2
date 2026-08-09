import express from 'express';
import * as leadController from '../controllers/leadController.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, requireRole(['admin', 'super_admin']), leadController.getLeads);
router.patch('/:id/status', authMiddleware, requireRole(['admin', 'super_admin']), leadController.updateLeadStatus);
router.delete('/:id', authMiddleware, requireRole(['admin', 'super_admin']), leadController.deleteLead);
router.post('/mock', authMiddleware, requireRole(['admin', 'super_admin']), leadController.createMockLeads);
router.post('/delete-mock', authMiddleware, requireRole(['admin', 'super_admin']), leadController.deleteMockLeads);

export default router;
