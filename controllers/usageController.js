import { checkUsageLimit, getUserUsage } from '../utils/usageEnforcement.js';

// @desc    Simulate JD upload with usage enforcement
// @access  Private
export const uploadJD = async (req, res) => {
  try {
    // Check usage limit before processing
    const usageCheck = await checkUsageLimit(req.user._id, 'jd', 1);
    
    if (!usageCheck.success) {
      return res.status(403).json({
        message: usageCheck.message,
        usage: usageCheck.usage
      });
    }

    // TODO: Implement actual JD upload logic here
    // For now, just return success since we already incremented usage
    
    res.json({
      message: 'Job description uploaded successfully',
      usage: usageCheck.usage
    });

  } catch (error) {
    console.error('JD upload error:', error);
    res.status(500).json({ message: 'Server error during JD upload' });
  }
};

// @desc    Simulate CV upload with usage enforcement
// @access  Private
export const uploadCV = async (req, res) => {
  try {
    const { count = 1 } = req.body; // Allow bulk CV upload
    
    // Check usage limit before processing
    const usageCheck = await checkUsageLimit(req.user._id, 'cv', count);
    
    if (!usageCheck.success) {
      return res.status(403).json({
        message: usageCheck.message,
        usage: usageCheck.usage
      });
    }

    // TODO: Implement actual CV upload logic here
    // For now, just return success since we already incremented usage
    
    res.json({
      message: `${count} CV(s) uploaded successfully`,
      usage: usageCheck.usage
    });

  } catch (error) {
    console.error('CV upload error:', error);
    res.status(500).json({ message: 'Server error during CV upload' });
  }
};

// @desc    Get current usage statistics
// @access  Private
export const getUsageStats = async (req, res) => {
  try {
    const usage = await getUserUsage(req.user._id);
    
    if (!usage) {
      return res.status(404).json({ message: 'Usage data not found' });
    }

    res.json({
      message: 'Usage statistics retrieved successfully',
      usage
    });

  } catch (error) {
    console.error('Get usage stats error:', error);
    res.status(500).json({ message: 'Server error during usage retrieval' });
  }
};