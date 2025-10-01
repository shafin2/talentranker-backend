import User from '../models/User.js';
import JobDescription from '../models/JobDescription.js';
import CV from '../models/CV.js';

/**
 * Middleware to check if user can upload JD
 */
export const checkJDLimit = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Get user with plan
    const user = await User.findById(userId).populate('plan');
    
    if (!user || !user.plan) {
      return res.status(403).json({ 
        message: 'No active plan. Please subscribe to a plan to use this feature.' 
      });
    }

    // Check JD limit
    const jdLimit = user.plan.jdLimit;
    
    // -1 means unlimited
    if (jdLimit === -1 || jdLimit === null) {
      return next();
    }

    // Count active JDs
    const activeJDCount = await JobDescription.countDocuments({ 
      user: userId, 
      status: 'active' 
    });

    if (activeJDCount >= jdLimit) {
      return res.status(403).json({ 
        message: `Job Description limit reached. Your plan allows ${jdLimit} JD(s). Please upgrade your plan or archive existing JDs.`,
        limit: jdLimit,
        current: activeJDCount
      });
    }

    next();
  } catch (error) {
    console.error('JD limit check error:', error);
    res.status(500).json({ message: 'Error checking JD limit' });
  }
};

/**
 * Middleware to check if user can upload CV
 */
export const checkCVLimit = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Get user with plan
    const user = await User.findById(userId).populate('plan');
    
    if (!user || !user.plan) {
      return res.status(403).json({ 
        message: 'No active plan. Please subscribe to a plan to use this feature.' 
      });
    }

    // Check CV limit
    const cvLimit = user.plan.cvLimit;
    
    // -1 means unlimited
    if (cvLimit === -1 || cvLimit === null) {
      return next();
    }

    // Count active CVs
    const activeCVCount = await CV.countDocuments({ 
      user: userId, 
      status: 'active' 
    });

    // Check how many CVs are being uploaded
    const uploadCount = req.files ? req.files.length : 1;
    
    if (activeCVCount + uploadCount > cvLimit) {
      return res.status(403).json({ 
        message: `CV limit exceeded. Your plan allows ${cvLimit} CV(s). You have ${activeCVCount} and trying to upload ${uploadCount} more.`,
        limit: cvLimit,
        current: activeCVCount,
        attempting: uploadCount
      });
    }

    next();
  } catch (error) {
    console.error('CV limit check error:', error);
    res.status(500).json({ message: 'Error checking CV limit' });
  }
};

/**
 * Update user usage stats after successful upload
 */
export const updateUsageStats = async (userId, type) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    if (type === 'jd') {
      user.jdUsed = (user.jdUsed || 0) + 1;
    } else if (type === 'cv') {
      user.cvUsed = (user.cvUsed || 0) + 1;
    }

    await user.save();
  } catch (error) {
    console.error('Error updating usage stats:', error);
  }
};
