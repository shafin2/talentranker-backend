import User from '../models/User.js';
import Plan from '../models/Plan.js';
import mongoose from 'mongoose';

// @desc    Login admin user only
// @access  Public
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email (only admin users)
    const user = await User.findOne({ email, role: 'admin', isActive: true });
    if (!user) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Generate tokens
    const { generateAccessToken, generateRefreshToken } = await import('../utils/jwt.js');
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token in user document
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      message: 'Admin login successful',
      accessToken,
      user
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
};

// @desc    Logout admin user
// @access  Private (Admin)
export const adminLogout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      // Remove refresh token from user document
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { refreshTokens: { token: refreshToken } }
      });
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.json({ message: 'Admin logged out successfully' });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({ message: 'Server error during admin logout' });
  }
};

// @desc    Get admin profile
// @access  Private (Admin)
export const getAdminProfile = (req, res) => {
  res.json({
    message: 'Admin profile retrieved',
    user: req.user
  });
};

// @desc    Get admin dashboard data
// @access  Private (Admin)
export const getAdminDashboard = async (req, res) => {
  try {
    // Get comprehensive stats for admin dashboard
    const [totalUsers, activePlans, totalJDsProcessed, totalCVsProcessed] = await Promise.all([
      User.countDocuments({ role: 'user', isActive: true }),
      Plan.countDocuments({ isActive: true }),
      User.aggregate([
        { $match: { role: 'user' } },
        { $group: { _id: null, total: { $sum: '$jdUsed' } } }
      ]).then(result => result.length > 0 ? result[0].total : 0),
      User.aggregate([
        { $match: { role: 'user' } },
        { $group: { _id: null, total: { $sum: '$cvUsed' } } }
      ]).then(result => result.length > 0 ? result[0].total : 0)
    ]);
    
    res.json({
      message: 'Admin dashboard data retrieved',
      stats: {
        totalUsers,
        activePlans,
        totalJDsProcessed,
        totalCVsProcessed,
        systemStatus: 'online'
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error during admin dashboard fetch' });
  }
};

// ==================== PLAN MANAGEMENT ====================

// @desc    List all plans
// @access  Private (Admin)
export const getAllPlans = async (req, res) => {
  try {
    const { region, name, isActive } = req.query;
    const filter = {};
    
    if (region) filter.region = region;
    if (name) filter.name = name;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const plans = await Plan.find(filter).sort({ region: 1, sortOrder: 1 });
    
    res.json({
      message: 'Plans retrieved successfully',
      plans,
      total: plans.length
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ message: 'Server error during plan retrieval' });
  }
};

// @desc    Create new plan
// @access  Private (Admin)
export const createPlan = async (req, res) => {
  try {
    const planData = req.body;
    
    // Validate required fields
    const requiredFields = ['name', 'region'];
    for (const field of requiredFields) {
      if (!planData[field]) {
        return res.status(400).json({ 
          message: `${field} is required` 
        });
      }
    }

    // Check for duplicate plan
    const existingPlan = await Plan.findOne({
      name: planData.name,
      region: planData.region,
      billingCycle: planData.billingCycle || null
    });

    if (existingPlan) {
      return res.status(400).json({ 
        message: 'Plan with this combination already exists' 
      });
    }

    const plan = new Plan(planData);
    await plan.save();

    res.status(201).json({
      message: 'Plan created successfully',
      plan
    });
  } catch (error) {
    console.error('Create plan error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ message: 'Server error during plan creation' });
  }
};

// @desc    Update plan
// @access  Private (Admin)
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log('📝 Updating plan:', id);
    console.log('📦 Update data:', JSON.stringify(updateData, null, 2));

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid plan ID' });
    }

    // Find existing plan first
    const existingPlan = await Plan.findById(id);
    if (!existingPlan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    console.log('🔍 Existing plan:', JSON.stringify(existingPlan, null, 2));

    const plan = await Plan.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('✅ Updated plan:', JSON.stringify(plan, null, 2));

    res.json({
      message: 'Plan updated successfully',
      plan
    });
  } catch (error) {
    console.error('Update plan error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ message: 'Server error during plan update' });
  }
};

// @desc    Delete plan
// @access  Private (Admin)
export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid plan ID' });
    }

    // Check if any users are using this plan
    const usersWithPlan = await User.countDocuments({ plan: id });
    if (usersWithPlan > 0) {
      return res.status(400).json({ 
        message: `Cannot delete plan. ${usersWithPlan} users are currently using this plan.` 
      });
    }

    const plan = await Plan.findByIdAndDelete(id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    res.json({
      message: 'Plan deleted successfully',
      deletedPlan: plan
    });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({ message: 'Server error during plan deletion' });
  }
};

// ==================== USER MANAGEMENT ====================

// @desc    Get all users with pagination and search
// @access  Private (Admin)
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build search query
    let searchQuery = {};
    if (search && search.trim() !== '') {
      searchQuery = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      User.find(searchQuery)
        .populate('plan')
        .select('-password -refreshTokens')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(searchQuery)
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      message: 'Users retrieved successfully',
      users,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error during user retrieval' });
  }
};

// @desc    Get user by ID
// @access  Private (Admin)
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(id)
      .populate('plan')
      .select('-password -refreshTokens');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User retrieved successfully',
      user
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error during user retrieval' });
  }
};

// @desc    Update user details
// @access  Private (Admin)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, isActive, role, planId } = req.body;

    console.log('🔧 Updating user:', id);
    console.log('📦 Update data:', { name, email, isActive, role, planId });

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Validate role
    if (role && !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be user or admin' });
    }

    // Validate planId if provided
    if (planId) {
      if (!mongoose.Types.ObjectId.isValid(planId)) {
        return res.status(400).json({ message: 'Invalid plan ID' });
      }
      
      const planExists = await Plan.findById(planId);
      if (!planExists) {
        return res.status(404).json({ message: 'Plan not found' });
      }
      console.log('✅ Plan validation passed:', planExists.name);
    }

    // Check if email already exists for another user
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: id } 
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use by another user' });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (role !== undefined) updateData.role = role;
    if (planId !== undefined) updateData.plan = planId;

    console.log('💾 Updating with data:', updateData);

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('plan').select('-password -refreshTokens');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ User updated successfully. New plan:', user.plan?.name);

    res.json({
      message: 'User updated successfully',
      user
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error during user update' });
  }
};

// @desc    Delete user
// @access  Private (Admin)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Prevent admin from deleting themselves
    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting other admin users
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    await User.findByIdAndDelete(id);

    res.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error during user deletion' });
  }
};

// @desc    Change user's plan manually
// @access  Private (Admin)
export const updateUserPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { planId, resetUsage } = req.body;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (planId && !mongoose.Types.ObjectId.isValid(planId)) {
      return res.status(400).json({ message: 'Invalid plan ID' });
    }

    // Verify plan exists
    if (planId) {
      const plan = await Plan.findById(planId);
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }
    }

    // Update user plan
    const updateData = { plan: planId };
    if (resetUsage) {
      updateData.jdUsed = 0;
      updateData.cvUsed = 0;
    }

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('plan');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User plan updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        jdUsed: user.jdUsed,
        cvUsed: user.cvUsed
      }
    });
  } catch (error) {
    console.error('Update user plan error:', error);
    res.status(500).json({ message: 'Server error during plan update' });
  }
};

// ==================== ANALYTICS ====================

// @desc    Get admin analytics data
// @access  Private (Admin)
export const getAnalytics = async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments({ role: 'user', isActive: true });

    // Users per plan
    const usersByPlan = await User.aggregate([
      { $match: { role: 'user', isActive: true } },
      {
        $lookup: {
          from: 'plans',
          localField: 'plan',
          foreignField: '_id',
          as: 'planDetails'
        }
      },
      {
        $group: {
          _id: {
            planId: '$plan',
            planName: { $arrayElemAt: ['$planDetails.name', 0] },
            planRegion: { $arrayElemAt: ['$planDetails.region', 0] }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          planId: '$_id.planId',
          planName: '$_id.planName',
          planRegion: '$_id.planRegion',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Signups per day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const signupsPerDay = await User.aggregate([
      {
        $match: {
          role: 'user',
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Average usage
    const usageStats = await User.aggregate([
      { $match: { role: 'user', isActive: true } },
      {
        $group: {
          _id: null,
          avgJdUsage: { $avg: '$jdUsed' },
          avgCvUsage: { $avg: '$cvUsed' },
          totalJdUsage: { $sum: '$jdUsed' },
          totalCvUsage: { $sum: '$cvUsed' }
        }
      }
    ]);

    const usage = usageStats[0] || {
      avgJdUsage: 0,
      avgCvUsage: 0,
      totalJdUsage: 0,
      totalCvUsage: 0
    };

    res.json({
      message: 'Analytics data retrieved successfully',
      analytics: {
        totalUsers,
        usersByPlan,
        signupsPerDay,
        usage: {
          averageJdUsage: Math.round(usage.avgJdUsage * 100) / 100,
          averageCvUsage: Math.round(usage.avgCvUsage * 100) / 100,
          totalJdUsage: usage.totalJdUsage,
          totalCvUsage: usage.totalCvUsage
        }
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error during analytics retrieval' });
  }
};

// @desc    Get all upgrade requests
// @route   GET /api/admin/upgrade-requests
// @access  Private (Admin only)
export const getUpgradeRequests = async (req, res) => {
  try {
    const UpgradeRequest = (await import('../models/UpgradeRequest.js')).default;
    const { status } = req.query;

    const filter = status ? { status } : {};

    const requests = await UpgradeRequest.find(filter)
      .populate('user', 'name email')
      .populate('currentPlan', 'name region price currency')
      .populate('requestedPlan', 'name region price currency')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests
    });

  } catch (error) {
    console.error('Get upgrade requests error:', error);
    res.status(500).json({ message: 'Server error during upgrade requests retrieval' });
  }
};

// @desc    Process upgrade request (approve/reject)
// @route   PUT /api/admin/upgrade-requests/:id
// @access  Private (Admin only)
export const processUpgradeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const UpgradeRequest = (await import('../models/UpgradeRequest.js')).default;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "approved" or "rejected"' });
    }

    const request = await UpgradeRequest.findById(id)
      .populate('user')
      .populate('requestedPlan');

    if (!request) {
      return res.status(404).json({ message: 'Upgrade request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been processed' });
    }

    // Update request status
    request.status = status;
    request.adminNotes = adminNotes || '';
    request.processedBy = req.user._id;
    request.processedAt = new Date();
    await request.save();

    // If approved, update user's plan
    if (status === 'approved') {
      await User.findByIdAndUpdate(request.user._id, {
        plan: request.requestedPlan._id
      });
    }

    await request.populate('processedBy', 'name email');

    res.json({
      success: true,
      message: `Upgrade request ${status} successfully`,
      request
    });

  } catch (error) {
    console.error('Process upgrade request error:', error);
    res.status(500).json({ message: 'Server error during upgrade request processing' });
  }
};