const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'uploadedBy user reference is required']
  },
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true,
    maxlength: [300, 'Title cannot exceed 300 characters']
  },
  originalFileName: {
    type: String,
    default: ''
  },
  mimeType: {
    type: String,
    default: 'application/pdf'
  },
  fileSizeBytes: {
    type: Number,
    min: [0, 'File size cannot be negative'],
    default: 0
  },
  rawText: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    trim: true,
    default: 'general'
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'processing', 'analyzed', 'failed'],
      message: 'Status must be pending, processing, analyzed, or failed'
    },
    default: 'pending',
    index: true
  },
  errorMessage: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

DocumentSchema.index({ uploadedBy: 1, createdAt: -1 });

DocumentSchema.index(
  { title: 'text', rawText: 'text' },
  { weights: { title: 10, rawText: 1 }, name: 'document_text_search' }
);

module.exports = mongoose.models.Document || mongoose.model('Document', DocumentSchema);
