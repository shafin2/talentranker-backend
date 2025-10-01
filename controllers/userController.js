import User from '../models/User.js';
import Plan from '../models/Plan.js';
import mongoose from 'mongoose';
import { getUserUsage, resetUsage } from '../utils/usageEnforcement.js';

// @desc    Get user profile with plan and usage details
// @access  Private
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('plan');
    const usage = await getUserUsage(req.user._id);
    
    res.json({ 
      message: 'User profile retrieved successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
        plan: user.plan,
        // Include usage fields directly on user object for easy access
        jdUsed: user.jdUsed,
        cvUsed: user.cvUsed,
        usage
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user profile (legacy endpoint)
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const { name } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true, runValidators: true }
    ).populate('plan');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upgrade/downgrade user plan
// @access  Private
export const updateUserPlan = async (req, res) => {
  try {
    const { planId, resetUsageOnUpgrade } = req.body;

    // Validate plan ID
    if (!planId || !mongoose.Types.ObjectId.isValid(planId)) {
      return res.status(400).json({ message: 'Valid plan ID is required' });
    }

    // Verify plan exists and is active
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    if (!plan.isActive) {
      return res.status(400).json({ message: 'Plan is not available' });
    }

    // Get current user plan for comparison
    const currentUser = await User.findById(req.user._id).populate('plan');
    const currentPlan = currentUser.plan;

    // Update user plan
    const updateData = { plan: planId };
    
    // Reset usage if upgrading or if explicitly requested
    if (resetUsageOnUpgrade || !currentPlan || 
        (currentPlan && plan.name !== 'Freemium' && currentPlan.name === 'Freemium')) {
      updateData.jdUsed = 0;
      updateData.cvUsed = 0;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).populate('plan');

    const usage = await getUserUsage(req.user._id);

    res.json({
      message: 'Plan updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        plan: updatedUser.plan,
        usage
      }
    });

  } catch (error) {
    console.error('Plan update error:', error);
    res.status(500).json({ message: 'Server error during plan update' });
  }
};

// @desc    Get available plans for user (based on region if provided)
// @access  Private
export const getAvailablePlans = async (req, res) => {
  try {
    const { region } = req.query;
    
    const filter = { isActive: true };
    if (region) {
      filter.$or = [
        { region: region },
        { region: 'Global' }
      ];
    }

    const plans = await Plan.find(filter).sort({ 
      region: 1,
      name: 1,
      sortOrder: 1 
    });

    console.log('📋 Available plans for user:', plans.length);

    res.json({
      success: true,
      message: 'Plans retrieved successfully',
      plans: plans
    });

  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ message: 'Server error during plan retrieval' });
  }
};

// @desc    Get current usage statistics
// @access  Private
export const getUserUsageStats = async (req, res) => {
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
    console.error('Get usage error:', error);
    res.status(500).json({ message: 'Server error during usage retrieval' });
  }
};

// @desc    Request plan upgrade
// @access  Private
export const requestPlanUpgrade = async (req, res) => {
  try {
    const { planId, message } = req.body;
    const UpgradeRequest = (await import('../models/UpgradeRequest.js')).default;

    if (!planId) {
      return res.status(400).json({ message: 'Plan ID is required' });
    }

    // Check if plan exists
    const requestedPlan = await Plan.findById(planId);
    if (!requestedPlan) {
      return res.status(404).json({ message: 'Requested plan not found' });
    }

    // Create upgrade request
    const upgradeRequest = await UpgradeRequest.create({
      user: req.user._id,
      currentPlan: req.user.plan,
      requestedPlan: planId,
      message: message || '',
      status: 'pending'
    });

    await upgradeRequest.populate('requestedPlan');

    res.status(201).json({
      success: true,
      message: 'Upgrade request submitted successfully. An admin will review your request.',
      request: upgradeRequest
    });

  } catch (error) {
    console.error('Request upgrade error:', error);
    res.status(500).json({ message: 'Server error during upgrade request' });
  }
};

// @desc    Get user's uploaded JDs
// @route   GET /api/users/jds
// @access  Private
export const getUserJDs = async (req, res) => {
  try {
    const JobDescription = (await import('../models/JobDescription.js')).default;
    
    const jds = await JobDescription.find({
      user: req.user._id,
      status: 'active'
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: jds.length,
      jds
    });
  } catch (error) {
    console.error('Get JDs error:', error);
    res.status(500).json({ message: 'Failed to fetch job descriptions' });
  }
};

// @desc    Get user's uploaded CVs
// @route   GET /api/users/cvs
// @access  Private
export const getUserCVs = async (req, res) => {
  try {
    const CV = (await import('../models/CV.js')).default;
    
    const cvs = await CV.find({
      user: req.user._id,
      status: 'active'
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: cvs.length,
      cvs
    });
  } catch (error) {
    console.error('Get CVs error:', error);
    res.status(500).json({ message: 'Failed to fetch CVs' });
  }
};