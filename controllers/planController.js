import Plan from '../models/Plan.js';

// @desc    Get all active plans
// @access  Public
export const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ sortOrder: 1 });
    res.json({
      message: 'Plans retrieved successfully',
      plans
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ message: 'Server error retrieving plans' });
  }
};

// @desc    Get plan by ID
// @access  Public
export const getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan || !plan.isActive) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    res.json({
      message: 'Plan retrieved successfully',
      plan
    });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({ message: 'Server error retrieving plan' });
  }
};

// @desc    Create new plan (Admin only)
// @access  Private (Admin)
export const createPlan = async (req, res) => {
  try {
    const { name, description, price, currency, features, sortOrder } = req.body;

    const plan = new Plan({
      name,
      description,
      price,
      currency: currency || 'USD',
      features,
      sortOrder: sortOrder || 0
    });

    await plan.save();

    res.status(201).json({
      message: 'Plan created successfully',
      plan
    });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ message: 'Server error creating plan' });
  }
};

// @desc    Update plan (Admin only)
// @access  Private (Admin)
export const updatePlan = async (req, res) => {
  try {
    const { name, description, price, currency, features, isActive, sortOrder } = req.body;

    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price,
        currency,
        features,
        isActive,
        sortOrder
      },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    res.json({
      message: 'Plan updated successfully',
      plan
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ message: 'Server error updating plan' });
  }
};

// @desc    Delete plan (Admin only)
// @access  Private (Admin)
export const deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);

    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    res.json({
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({ message: 'Server error deleting plan' });
  }
};