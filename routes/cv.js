import express from 'express';
import { uploadCVs, getAllCVs, getCVById, deleteCV } from '../controllers/cvController.js';
import { protect } from '../middleware/auth.js';
import { checkCVLimit } from '../middleware/usageLimits.js';
import { uploadMultiplePDFs } from '../config/upload.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// CV routes
router.post('/upload', checkCVLimit, uploadMultiplePDFs, uploadCVs);
router.get('/', getAllCVs);
router.get('/:id', getCVById);
router.delete('/:id', deleteCV);

export default router;
