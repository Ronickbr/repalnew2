import express from 'express';
import { generateContent } from '../controllers/aiController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { aiGenerateRateLimiter, aiGenerateSlowDown } from '../middleware/rateLimit.js';

const router = express.Router();

router.post('/generate-content', aiGenerateSlowDown, aiGenerateRateLimiter, authMiddleware, generateContent);

export default router;
