const mongoose = require('mongoose');

const ComparisonSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'createdBy user reference is required']
  },
  documentIds: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    }],
    validate: {
      validator: function (val) {
        if (!Array.isArray(val) || val.length < 2) {
          return false;
        }
        const stringIds = val.map(id => id.toString());
        const uniqueIds = new Set(stringIds);
        return uniqueIds.size === stringIds.length;
      },
      message: 'documentIds must contain at least 2 distinct document IDs with no duplicates.'
    }
  },
  title: {
    type: String,
    trim: true,
    default: 'Untitled comparison'
  },
  resultJSON: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

ComparisonSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.models.Comparison || mongoose.model('Comparison', ComparisonSchema);
