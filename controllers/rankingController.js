import JobDescription from '../models/JobDescription.js';
import CV from '../models/CV.js';
import RankingResult from '../models/RankingResult.js';
import User from '../models/User.js';
import { rankMultipleCVs } from '../services/mlService.js';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { createRequire } from 'module';

// Use createRequire to import pdf-parse (CommonJS module)
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = 'uploads/temp';
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and TXT files are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Middleware for handling file uploads
export const uploadFiles = upload.fields([
  { name: 'jd', maxCount: 1 },
  { name: 'cvs', maxCount: 50 }
]);

// @desc    Rank CVs against a Job Description
// @route   POST /api/ranking/rank
// @access  Private
export const rankCVs = async (req, res) => {
  try {
    console.log('📥 Received ranking request body:', JSON.stringify(req.body, null, 2));
    const { jdId, cvIds } = req.body;

    console.log('🔍 Validation - jdId:', jdId);
    console.log('🔍 Validation - cvIds:', cvIds);
    console.log('🔍 Validation - cvIds type:', typeof cvIds);
    console.log('🔍 Validation - cvIds is array:', Array.isArray(cvIds));

    if (!jdId || !cvIds || cvIds.length === 0) {
      console.log('❌ Validation failed!');
      return res.status(400).json({ 
        message: 'Job Description ID and at least one CV ID are required' 
      });
    }

    // Get Job Description
    const jd = await JobDescription.findOne({
      _id: jdId,
      user: req.user._id,
      status: 'active'
    });

    if (!jd) {
      return res.status(404).json({ message: 'Job Description not found' });
    }

    // Get CVs
    const cvs = await CV.find({
      _id: { $in: cvIds },
      user: req.user._id,
      status: 'active'
    });

    if (cvs.length === 0) {
      return res.status(404).json({ message: 'No valid CVs found' });
    }

    // Prepare CV data for ML model
    const cvData = cvs.map(cv => ({
      id: cv._id,
      filename: cv.filename,
      content: cv.content
    }));

    console.log(`🎯 Starting ranking process for JD: ${jd.title}`);
    console.log(`📊 Number of CVs to rank: ${cvData.length}`);
    console.log(`📝 JD content length: ${jd.content.length} chars`);

    // Create ranking result record (initially processing)
    const rankingResult = await RankingResult.create({
      user: req.user._id,
      jobDescription: jd._id,
      status: 'processing',
      results: []
    });

    // Rank CVs using ML model (async)
    try {
      console.log('🤖 Calling ML API to rank CVs...');
      const rankings = await rankMultipleCVs(jd.content, cvData);
      console.log('✅ ML API ranking completed successfully!');
      console.log('📈 Rankings:', JSON.stringify(rankings, null, 2));

      // Update ranking result with results
      rankingResult.results = rankings.map(r => ({
        cv: r.cvId,
        filename: r.filename,
        prediction: r.prediction,
        confidence: r.confidence
      }));
      rankingResult.status = 'completed';
      await rankingResult.save();

      // Update JD ranked CVs count
      jd.rankedCVsCount += cvs.length;
      await jd.save();

      res.json({
        success: true,
        message: 'CVs ranked successfully',
        rankingResult: {
          _id: rankingResult._id,
          jdTitle: jd.title,
          results: rankingResult.results,
          createdAt: rankingResult.createdAt
        }
      });
    } catch (error) {
      // Update ranking result with error
      rankingResult.status = 'failed';
      rankingResult.error = error.message;
      await rankingResult.save();

      throw error;
    }
  } catch (error) {
    console.error('Ranking error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to rank CVs' 
    });
  }
};

// @desc    Get all ranking results for user
// @route   GET /api/ranking/results
// @access  Private
export const getRankingResults = async (req, res) => {
  try {
    const results = await RankingResult.find({ 
      user: req.user._id 
    })
    .populate('jobDescription', 'title')
    .sort({ createdAt: -1 })
    .limit(50); // Last 50 results

    res.json({
      success: true,
      count: results.length,
      data: results.map(result => ({
        _id: result._id,
        jobDescription: result.jobDescription,
        results: result.results,
        status: result.status,
        error: result.error,
        createdAt: result.createdAt
      }))
    });
  } catch (error) {
    console.error('Get ranking results error:', error);
    res.status(500).json({ message: 'Failed to fetch ranking results' });
  }
};

// @desc    Get single ranking result
// @route   GET /api/ranking/results/:id
// @access  Private
export const getRankingResultById = async (req, res) => {
  try {
    const result = await RankingResult.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('jobDescription', 'title description');

    if (!result) {
      return res.status(404).json({ message: 'Ranking result not found' });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get ranking result error:', error);
    res.status(500).json({ message: 'Failed to fetch ranking result' });
  }
};

// @desc    Delete ranking result
// @route   DELETE /api/ranking/results/:id
// @access  Private
export const deleteRankingResult = async (req, res) => {
  try {
    const result = await RankingResult.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!result) {
      return res.status(404).json({ message: 'Ranking result not found' });
    }

    res.json({
      success: true,
      message: 'Ranking result deleted successfully'
    });
  } catch (error) {
    console.error('Delete ranking result error:', error);
    res.status(500).json({ message: 'Failed to delete ranking result' });
  }
};

// @desc    Rank CVs with direct file uploads (new flow)
// @route   POST /api/ranking/rank-with-files
// @access  Private
export const rankWithFiles = async (req, res) => {
  try {
    console.log('📥 New ranking request with files');
    
    // Check if files were uploaded
    if (!req.files || !req.files.jd || !req.files.cvs) {
      return res.status(400).json({ 
        message: 'Please upload one JD and at least one CV file' 
      });
    }

    const jdFile = req.files.jd[0];
    const cvFiles = req.files.cvs;

    console.log(`📄 JD file: ${jdFile.originalname}`);
    console.log(`📄 CV files count: ${cvFiles.length}`);

    // Get user with populated plan
    const user = await User.findById(req.user._id).populate('plan');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check credits BEFORE processing
    const jdLimit = user.plan?.jdLimit || 0;
    const cvLimit = user.plan?.cvLimit || 0;
    const jdUsed = user.jdUsed || 0;
    const cvUsed = user.cvUsed || 0;

    const jdRemaining = jdLimit === -1 ? Infinity : (jdLimit - jdUsed);
    const cvRemaining = cvLimit === -1 ? Infinity : (cvLimit - cvUsed);

    console.log(`💳 Credits check - JD: ${jdUsed}/${jdLimit}, CV: ${cvUsed}/${cvLimit}`);

    if (jdRemaining < 1) {
      // Clean up uploaded files
      await Promise.all([
        fs.unlink(jdFile.path).catch(e => console.error('Failed to delete JD file:', e)),
        ...cvFiles.map(f => fs.unlink(f.path).catch(e => console.error('Failed to delete CV file:', e)))
      ]);
      return res.status(403).json({ message: 'Insufficient JD credits. Please upgrade your plan.' });
    }

    if (cvRemaining < cvFiles.length) {
      // Clean up uploaded files
      await Promise.all([
        fs.unlink(jdFile.path).catch(e => console.error('Failed to delete JD file:', e)),
        ...cvFiles.map(f => fs.unlink(f.path).catch(e => console.error('Failed to delete CV file:', e)))
      ]);
      return res.status(403).json({ 
        message: `Insufficient CV credits. You have ${cvRemaining} remaining but selected ${cvFiles.length} CVs.` 
      });
    }

    // Extract text from JD
    console.log('📖 Extracting text from JD...');
    let jdContent = '';
    if (jdFile.mimetype === 'application/pdf') {
      const dataBuffer = await fs.readFile(jdFile.path);
      const data = await pdfParse(dataBuffer);
      jdContent = data.text;
    } else {
      jdContent = await fs.readFile(jdFile.path, 'utf8');
    }

    console.log(`✅ JD text extracted: ${jdContent.length} characters`);

    // Create JD record in database
    const jdTitle = jdFile.originalname.replace(/\.[^/.]+$/, ''); // Remove extension
    const jd = await JobDescription.create({
      user: user._id,
      title: jdTitle,
      description: jdContent.substring(0, 500), // First 500 chars as description
      filename: jdFile.originalname,
      content: jdContent,
      status: 'active'
    });

    console.log(`✅ JD created in DB: ${jd._id}`);

    // Extract text from CVs and create records
    console.log('📖 Extracting text from CVs...');
    const cvRecords = [];
    const cvData = [];

    for (const cvFile of cvFiles) {
      let cvContent = '';
      if (cvFile.mimetype === 'application/pdf') {
        const dataBuffer = await fs.readFile(cvFile.path);
        const data = await pdfParse(dataBuffer);
        cvContent = data.text;
      } else {
        cvContent = await fs.readFile(cvFile.path, 'utf8');
      }

      const cv = await CV.create({
        user: user._id,
        filename: cvFile.originalname,
        content: cvContent,
        candidateName: cvFile.originalname.replace(/\.[^/.]+$/, ''),
        status: 'active'
      });

      cvRecords.push(cv);
      cvData.push({
        id: cv._id,
        filename: cv.filename,
        content: cv.content
      });

      console.log(`✅ CV created in DB: ${cv._id} - ${cv.filename}`);
    }

    // Deduct credits
    user.jdUsed = (user.jdUsed || 0) + 1;
    user.cvUsed = (user.cvUsed || 0) + cvFiles.length;
    await user.save();

    console.log(`💳 Credits deducted - New usage: JD ${user.jdUsed}/${jdLimit}, CV ${user.cvUsed}/${cvLimit}`);

    // Create ranking result record
    const rankingResult = await RankingResult.create({
      user: user._id,
      jobDescription: jd._id,
      status: 'processing',
      results: []
    });

    // Rank CVs using ML model
    try {
      console.log('🤖 Calling ML API to rank CVs...');
      const rankings = await rankMultipleCVs(jdContent, cvData);
      console.log('✅ ML API ranking completed successfully!');

      // Update ranking result with results
      rankingResult.results = rankings.map(r => ({
        cv: r.cvId,
        filename: r.filename,
        prediction: r.prediction,
        confidence: r.confidence
      }));
      rankingResult.status = 'completed';
      await rankingResult.save();

      // Update JD ranked CVs count
      jd.rankedCVsCount = cvFiles.length;
      await jd.save();

      // Clean up uploaded files
      await Promise.all([
        fs.unlink(jdFile.path).catch(e => console.error('Failed to delete JD file:', e)),
        ...cvFiles.map(f => fs.unlink(f.path).catch(e => console.error('Failed to delete CV file:', e)))
      ]);

      res.json({
        success: true,
        message: 'CVs ranked successfully',
        rankingResult: {
          _id: rankingResult._id,
          jdTitle: jd.title,
          results: rankingResult.results,
          createdAt: rankingResult.createdAt
        }
      });
    } catch (error) {
      // Update ranking result with error
      rankingResult.status = 'failed';
      rankingResult.error = error.message;
      await rankingResult.save();

      // Clean up uploaded files
      await Promise.all([
        fs.unlink(jdFile.path).catch(e => console.error('Failed to delete JD file:', e)),
        ...cvFiles.map(f => fs.unlink(f.path).catch(e => console.error('Failed to delete CV file:', e)))
      ]);

      throw error;
    }
  } catch (error) {
    console.error('Ranking with files error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to rank CVs' 
    });
  }
};
