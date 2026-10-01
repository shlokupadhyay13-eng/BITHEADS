const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: [true, 'documentId is required'],
    unique: true
  },
  policyImpactScore: {
    type: Number,
    required: [true, 'policyImpactScore is required'],
    min: [0, 'policyImpactScore must be at least 0'],
    max: [100, 'policyImpactScore cannot exceed 100']
  },
  summary: {
    type: String,
    default: ''
  },
  structuredJSON: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  modelVersion: {
    type: String,
    default: 'unspecified'
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Analysis || mongoose.model('Analysis', AnalysisSchema);
