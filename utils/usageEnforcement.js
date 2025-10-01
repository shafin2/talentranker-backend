import User from '../models/User.js';
import Plan from '../models/Plan.js';

/**
 * Check and enforce usage limits for a user
 * @param {String} userId - User's MongoDB ObjectId
 * @param {String} type - 'jd' or 'cv'
 * @param {Number} increment - Number to increment (default 1)
 * @returns {Promise<Object>} - { success: boolean, message: string, usage: object }
 */
export const checkUsageLimit = async (userId, type, increment = 1) => {
  try {
    // Get user with populated plan
    const user = await User.findById(userId).populate('plan');
    
    if (!user) {
      return {
        success: false,
        message: 'User not found',
        usage: null
      };
    }

    if (!user.plan) {
      return {
        success: false,
        message: 'User has no active plan',
        usage: null
      };
    }

    const plan = user.plan;
    const isJD = type === 'jd';
    const currentUsage = isJD ? user.jdUsed : user.cvUsed;
    const limit = isJD ? plan.jdLimit : plan.cvLimit;
    const newUsage = currentUsage + increment;

    // Check if plan has unlimited usage for this type
    if (plan.isUnlimited(type)) {
      // For unlimited plans, just increment without checking
      const updateField = isJD ? 'jdUsed' : 'cvUsed';
      await User.findByIdAndUpdate(userId, { $inc: { [updateField]: increment } });
      
      return {
        success: true,
        message: 'Usage updated successfully (unlimited)',
        usage: {
          current: newUsage,
          limit: null,
          remaining: null,
          unlimited: true
        }
      };
    }

    // Check if usage would exceed limit
    if (newUsage > limit) {
      return {
        success: false,
        message: 'Plan limit exceeded. Please upgrade your plan.',
        usage: {
          current: currentUsage,
          limit: limit,
          remaining: limit - currentUsage,
          unlimited: false
        }
      };
    }

    // Update usage
    const updateField = isJD ? 'jdUsed' : 'cvUsed';
    await User.findByIdAndUpdate(userId, { $inc: { [updateField]: increment } });

    return {
      success: true,
      message: 'Usage updated successfully',
      usage: {
        current: newUsage,
        limit: limit,
        remaining: limit - newUsage,
        unlimited: false
      }
    };

  } catch (error) {
    console.error('Usage limit check error:', error);
    return {
      success: false,
      message: 'Internal server error',
      usage: null
    };
  }
};

/**
 * Get current usage statistics for a user
 * @param {String} userId - User's MongoDB ObjectId
 * @returns {Promise<Object>} - Usage statistics
 */
export const getUserUsage = async (userId) => {
  try {
    const user = await User.findById(userId).populate('plan');
    
    if (!user) {
      return null;
    }

    const plan = user.plan;
    
    return {
      jd: {
        used: user.jdUsed,
        limit: plan?.jdLimit || null,
        remaining: plan?.jdLimit ? Math.max(0, plan.jdLimit - user.jdUsed) : null,
        unlimited: plan?.isUnlimited('jd') || false
      },
      cv: {
        used: user.cvUsed,
        limit: plan?.cvLimit || null,
        remaining: plan?.cvLimit ? Math.max(0, plan.cvLimit - user.cvUsed) : null,
        unlimited: plan?.isUnlimited('cv') || false
      },
      plan: plan ? {
        id: plan._id,
        name: plan.name,
        region: plan.region,
        billingCycle: plan.billingCycle
      } : null
    };
    
  } catch (error) {
    console.error('Get user usage error:', error);
    return null;
  }
};

/**
 * Reset usage counts (useful for plan upgrades or monthly resets)
 * @param {String} userId - User's MongoDB ObjectId
 * @param {Object} options - { jd: boolean, cv: boolean }
 * @returns {Promise<boolean>} - Success status
 */
export const resetUsage = async (userId, options = { jd: true, cv: true }) => {
  try {
    const updateFields = {};
    
    if (options.jd) updateFields.jdUsed = 0;
    if (options.cv) updateFields.cvUsed = 0;

    await User.findByIdAndUpdate(userId, updateFields);
    return true;
    
  } catch (error) {
    console.error('Reset usage error:', error);
    return false;
  }
};