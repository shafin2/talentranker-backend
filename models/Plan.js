import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['Freemium', 'Starter', 'Growth', 'Pro', 'Enterprise'],
    trim: true
  },
  region: {
    type: String,
    required: true,
    enum: ['Pakistan', 'International', 'Global'],
    trim: true
  },
  billingCycle: {
    type: String,
    enum: ['Monthly', 'SixMonth', 'Annual', null],
    default: null
  },
  price: {
    type: Number,
    default: null,
    min: 0
  },
  currency: {
    type: String,
    default: function() {
      return this.region === 'Pakistan' ? 'PKR' : 'USD';
    }
  },
  jdLimit: {
    type: Number,
    default: null // null means unlimited
  },
  cvLimit: {
    type: Number,
    default: null // null means unlimited
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    default: ''
  },
  features: [{
    type: String
  }],
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create compound index for unique plan combinations
planSchema.index({ name: 1, region: 1, billingCycle: 1 }, { unique: true });

// Virtual for display name
planSchema.virtual('displayName').get(function() {
  if (this.name === 'Freemium') return 'Freemium';
  if (this.billingCycle) {
    return `${this.name} (${this.billingCycle})`;
  }
  return this.name;
});

// Method to check if plan has unlimited usage
planSchema.methods.isUnlimited = function(type) {
  if (this.name === 'Enterprise') return true;
  if (type === 'jd') return this.jdLimit === null;
  if (type === 'cv') return this.cvLimit === null;
  return false;
};

const Plan = mongoose.model('Plan', planSchema);

export default Plan;
