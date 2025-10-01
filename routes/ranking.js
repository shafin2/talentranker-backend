import express from 'express';
import { rankCVs, getRankingResults, getRankingResultById, deleteRankingResult, rankWithFiles, uploadFiles } from '../controllers/rankingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Ranking routes
router.post('/rank', rankCVs);
router.post('/rank-with-files', uploadFiles, rankWithFiles); // New endpoint with file upload
router.get('/results', getRankingResults);
router.get('/results/:id', getRankingResultById);
router.delete('/results/:id', deleteRankingResult);

export default router;
