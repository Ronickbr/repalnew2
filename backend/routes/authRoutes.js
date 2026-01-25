import express from 'express';
import * as authController from '../controllers/authController.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/csrf-token', authController.getCsrfToken);
router.post('/login', authController.login);
router.post('/verify-2fa', authController.verify2FA);
router.get('/me', authMiddleware, authController.getMe);
router.post('/logout', authController.logout);
router.post('/2fa/enroll', authMiddleware, requireRole(['admin', 'super_admin']), authController.enroll2FA);

export default router;
