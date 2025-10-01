import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

// User Profile Routes
router.get('/me', authenticate, userController.getCurrentUser);
router.get('/profile', authenticate, userController.getUserProfile); // Legacy endpoint
router.put('/profile', authenticate, userController.updateUserProfile);

// Plan Management Routes  
router.put('/me/plan', authenticate, userController.updateUserPlan);
router.get('/plans', authenticate, userController.getAvailablePlans);
router.post('/upgrade-request', authenticate, userController.requestPlanUpgrade);

// Usage Routes
router.get('/usage', authenticate, userController.getUserUsageStats);

// JD and CV listing routes
router.get('/jds', authenticate, userController.getUserJDs);
router.get('/cvs', authenticate, userController.getUserCVs);

export default router;
