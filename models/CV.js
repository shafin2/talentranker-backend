import mongoose from 'mongoose';

const cvSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  // Extracted text content from PDF
  content: {
    type: String,
    required: true
  },
  // Original file path/URL (if stored)
  filePath: {
    type: String
  },
  // Metadata
  fileSize: {
    type: Number // in bytes
  },
  // Status
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for faster queries
cvSchema.index({ user: 1, status: 1 });
cvSchema.index({ user: 1, createdAt: -1 });

const CV = mongoose.model('CV', cvSchema);

export default CV;
