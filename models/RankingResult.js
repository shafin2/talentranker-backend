import mongoose from 'mongoose';

const rankingResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobDescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobDescription',
    required: true
  },
  // Results for all CVs ranked against this JD
  results: [{
    cv: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CV',
      required: true
    },
    filename: String,
    prediction: {
      type: String,
      enum: ['Relevant', 'Not Relevant'],
      required: true
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  }],
  // Processing status
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  error: String
}, {
  timestamps: true
});

// Index for faster queries
rankingResultSchema.index({ user: 1, createdAt: -1 });
rankingResultSchema.index({ jobDescription: 1 });

const RankingResult = mongoose.model('RankingResult', rankingResultSchema);

export default RankingResult;
