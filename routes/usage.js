import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as usageController from '../controllers/usageController.js';

const router = express.Router();

// Usage Routes
router.post('/jd/upload', authenticate, usageController.uploadJD);
router.post('/cv/upload', authenticate, usageController.uploadCV);
router.get('/stats', authenticate, usageController.getUsageStats);

export default router;