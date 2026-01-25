import express from 'express';
import { generateContent } from '../controllers/aiController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rota protegida para geração de conteúdo
router.post('/generate-content', authMiddleware, generateContent);

export default router;
