import express from 'express';
import * as userController from '../controllers/userController.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, requireRole(['admin', 'super_admin']), userController.getUsers);
router.post('/', authMiddleware, requireRole(['admin', 'super_admin']), userController.createUser);
router.put('/:id', authMiddleware, requireRole(['admin', 'super_admin']), userController.updateUser);
router.patch('/:id/status', authMiddleware, requireRole(['admin', 'super_admin']), userController.toggleUserStatus);
router.delete('/:id', authMiddleware, requireRole(['admin', 'super_admin']), userController.deleteUser);

export default router;
