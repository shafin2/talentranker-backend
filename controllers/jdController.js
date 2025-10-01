import JobDescription from '../models/JobDescription.js';
import { extractTextFromPDF } from '../services/pdfService.js';
import { updateUsageStats } from '../middleware/usageLimits.js';

// @desc    Upload Job Description
// @route   POST /api/jd/upload
// @access  Private
export const uploadJD = async (req, res) => {
  try {
    const { title, description, content } = req.body;
    const file = req.file;

    let jdContent = '';

    // If file uploaded, extract text
    if (file) {
      console.log('📄 Extracting text from JD PDF:', file.originalname);
      jdContent = await extractTextFromPDF(file.buffer);
      console.log('✅ JD Text extracted successfully!');
      console.log('📝 First 200 chars:', jdContent.substring(0, 200));
      console.log('📊 Total length:', jdContent.length, 'characters');
    } else if (content) {
      // Use direct text input (full content)
      console.log('📝 Using direct text input for JD');
      jdContent = content;
      console.log('📊 Content length:', jdContent.length, 'characters');
    } else if (description) {
      // Fallback to description field
      jdContent = description;
    } else {
      return res.status(400).json({ message: 'Please provide either a PDF file or job description text' });
    }

    // Create JD
    const jd = await JobDescription.create({
      user: req.user._id,
      title: title || 'Untitled Job Description',
      description: description || jdContent.substring(0, 500), // Short description
      content: jdContent,
      filename: file ? file.originalname : null
    });

    // Update usage stats
    await updateUsageStats(req.user._id, 'jd');

    res.status(201).json({
      success: true,
      message: 'Job Description uploaded successfully',
      data: {
        _id: jd._id,
        title: jd.title,
        description: jd.description,
        content: jd.content,
        filename: jd.filename,
        createdAt: jd.createdAt
      }
    });
  } catch (error) {
    console.error('JD upload error:', error);
    res.status(500).json({ message: error.message || 'Failed to upload Job Description' });
  }
};

// @desc    Get all user's JDs
// @route   GET /api/jd
// @access  Private
export const getAllJDs = async (req, res) => {
  try {
    const jds = await JobDescription.find({ 
      user: req.user._id, 
      status: 'active' 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: jds.length,
      data: jds.map(jd => ({
        _id: jd._id,
        title: jd.title,
        description: jd.description,
        content: jd.content,
        filename: jd.filename,
        rankedCVsCount: jd.rankedCVsCount,
        status: jd.status,
        createdAt: jd.createdAt
      }))
    });
  } catch (error) {
    console.error('Get JDs error:', error);
    res.status(500).json({ message: 'Failed to fetch Job Descriptions' });
  }
};

// @desc    Get single JD
// @route   GET /api/jd/:id
// @access  Private
export const getJDById = async (req, res) => {
  try {
    const jd = await JobDescription.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!jd) {
      return res.status(404).json({ message: 'Job Description not found' });
    }

    res.json({
      success: true,
      data: jd
    });
  } catch (error) {
    console.error('Get JD error:', error);
    res.status(500).json({ message: 'Failed to fetch Job Description' });
  }
};

// @desc    Delete JD
// @route   DELETE /api/jd/:id
// @access  Private
export const deleteJD = async (req, res) => {
  try {
    const jd = await JobDescription.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!jd) {
      return res.status(404).json({ message: 'Job Description not found' });
    }

    // Soft delete (archive)
    jd.status = 'archived';
    await jd.save();

    res.json({
      success: true,
      message: 'Job Description deleted successfully'
    });
  } catch (error) {
    console.error('Delete JD error:', error);
    res.status(500).json({ message: 'Failed to delete Job Description' });
  }
};
