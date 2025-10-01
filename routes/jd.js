import express from 'express';
import { uploadJD, getAllJDs, getJDById, deleteJD } from '../controllers/jdController.js';
import { protect } from '../middleware/auth.js';
import { checkJDLimit } from '../middleware/usageLimits.js';
import { uploadSinglePDF } from '../config/upload.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// JD routes
router.post('/upload', checkJDLimit, uploadSinglePDF, uploadJD);
router.get('/', getAllJDs);
router.get('/:id', getJDById);
router.delete('/:id', deleteJD);

export default router;
