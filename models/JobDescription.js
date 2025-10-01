import mongoose from 'mongoose';

const jobDescriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  // Extracted text from uploaded file or direct input
  content: {
    type: String,
    required: true
  },
  // Original filename if uploaded
  filename: {
    type: String
  },
  // Status of the JD
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  },
  // Track how many CVs have been ranked against this JD
  rankedCVsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
jobDescriptionSchema.index({ user: 1, status: 1 });
jobDescriptionSchema.index({ user: 1, createdAt: -1 });

const JobDescription = mongoose.model('JobDescription', jobDescriptionSchema);

export default JobDescription;
