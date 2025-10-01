import express from 'express';
import { adminAuth } from '../middleware/auth.js';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

// Authentication Routes
router.post('/login', adminController.adminLogin);
router.post('/logout', adminAuth, adminController.adminLogout);
router.get('/profile', adminAuth, adminController.getAdminProfile);
router.get('/dashboard', adminAuth, adminController.getAdminDashboard);

// Plan Management Routes
router.get('/plans', adminAuth, adminController.getAllPlans);
router.post('/plans', adminAuth, adminController.createPlan);
router.put('/plans/:id', adminAuth, adminController.updatePlan);
router.delete('/plans/:id', adminAuth, adminController.deletePlan);

// User Management Routes
router.get('/users', adminAuth, adminController.getAllUsers);
router.get('/users/:id', adminAuth, adminController.getUserById);
router.put('/users/:id', adminAuth, adminController.updateUser);
router.delete('/users/:id', adminAuth, adminController.deleteUser);
router.put('/users/:id/plan', adminAuth, adminController.updateUserPlan);

// Analytics Routes
router.get('/analytics', adminAuth, adminController.getAnalytics);

// Upgrade Request Routes
router.get('/upgrade-requests', adminAuth, adminController.getUpgradeRequests);
router.put('/upgrade-requests/:id', adminAuth, adminController.processUpgradeRequest);

export default router;