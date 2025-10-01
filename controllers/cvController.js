import CV from '../models/CV.js';
import { extractTextFromPDF } from '../services/pdfService.js';
import { updateUsageStats } from '../middleware/usageLimits.js';

// @desc    Upload CV(s)
// @route   POST /api/cv/upload
// @access  Private
export const uploadCVs = async (req, res) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'Please upload at least one PDF file' });
    }

    const uploadedCVs = [];
    const errors = [];

    // Process each PDF
    for (const file of files) {
      try {
        // Extract text from PDF
        console.log(`📄 Extracting text from CV: ${file.originalname}`);
        const content = await extractTextFromPDF(file.buffer);
        console.log(`✅ CV text extracted! Length: ${content.length} chars`);
        console.log(`📝 First 150 chars: ${content.substring(0, 150)}...`);

        // Create CV record
        const cv = await CV.create({
          user: req.user._id,
          filename: file.originalname,
          content: content,
          fileSize: file.size
        });

        uploadedCVs.push({
          _id: cv._id,
          filename: cv.filename,
          createdAt: cv.createdAt
        });
        console.log(`💾 CV saved to database: ${cv.filename}`);

        // Update usage stats
        await updateUsageStats(req.user._id, 'cv');
      } catch (error) {
        errors.push({
          filename: file.originalname,
          error: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `${uploadedCVs.length} CV(s) uploaded successfully`,
      data: uploadedCVs,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('CV upload error:', error);
    res.status(500).json({ message: error.message || 'Failed to upload CVs' });
  }
};

// @desc    Get all user's CVs
// @route   GET /api/cv
// @access  Private
export const getAllCVs = async (req, res) => {
  try {
    const cvs = await CV.find({ 
      user: req.user._id, 
      status: 'active' 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: cvs.length,
      data: cvs.map(cv => ({
        _id: cv._id,
        filename: cv.filename,
        content: cv.content,
        fileSize: cv.fileSize,
        status: cv.status,
        createdAt: cv.createdAt
      }))
    });
  } catch (error) {
    console.error('Get CVs error:', error);
    res.status(500).json({ message: 'Failed to fetch CVs' });
  }
};

// @desc    Get single CV
// @route   GET /api/cv/:id
// @access  Private
export const getCVById = async (req, res) => {
  try {
    const cv = await CV.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!cv) {
      return res.status(404).json({ message: 'CV not found' });
    }

    res.json({
      success: true,
      data: cv
    });
  } catch (error) {
    console.error('Get CV error:', error);
    res.status(500).json({ message: 'Failed to fetch CV' });
  }
};

// @desc    Delete CV
// @route   DELETE /api/cv/:id
// @access  Private
export const deleteCV = async (req, res) => {
  try {
    const cv = await CV.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!cv) {
      return res.status(404).json({ message: 'CV not found' });
    }

    // Soft delete (archive)
    cv.status = 'archived';
    await cv.save();

    res.json({
      success: true,
      message: 'CV deleted successfully'
    });
  } catch (error) {
    console.error('Delete CV error:', error);
    res.status(500).json({ message: 'Failed to delete CV' });
  }
};
