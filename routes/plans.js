import express from 'express';
import { adminAuth } from '../middleware/auth.js';
import * as planController from '../controllers/planController.js';

const router = express.Router();

// Plan Routes
router.get('/', planController.getAllPlans);
router.get('/:id', planController.getPlanById);
router.post('/', adminAuth, planController.createPlan);
router.put('/:id', adminAuth, planController.updatePlan);
router.delete('/:id', adminAuth, planController.deletePlan);

export default router;