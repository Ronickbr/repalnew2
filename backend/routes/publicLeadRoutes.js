import express from 'express';
import * as publicLeadController from '../controllers/publicLeadController.js';
import { publicLeadRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.post('/', publicLeadRateLimiter, publicLeadController.createPublicLead);

export default router;
