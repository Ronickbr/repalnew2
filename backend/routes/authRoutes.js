import express from 'express';
import * as authController from '../controllers/authController.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';
import {
  authGeneralRateLimiter,
  loginRateLimiter,
  loginSlowDown,
  verify2faRateLimiter,
} from '../middleware/rateLimit.js';

const router = express.Router();

router.get('/csrf-token', authGeneralRateLimiter, authController.getCsrfToken);
router.post('/login', loginSlowDown, loginRateLimiter, authController.login);
router.post('/verify-2fa', verify2faRateLimiter, authController.verify2FA);
router.get('/me', authMiddleware, authController.getMe);
router.post('/logout', authGeneralRateLimiter, authController.logout);
router.post('/2fa/enroll', authMiddleware, requireRole(['admin', 'super_admin']), authController.enroll2FA);

export default router;
