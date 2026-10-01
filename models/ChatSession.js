const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: {
      values: ['user', 'assistant', 'system'],
      message: 'Role must be user, assistant, or system'
    },
    required: [true, 'Message role is required']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [20000, 'Message content cannot exceed 20000 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ChatSessionSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: [true, 'documentId is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'userId is required']
  },
  messages: {
    type: [messageSchema],
    default: []
  }
}, {
  timestamps: true
});

ChatSessionSchema.index({ userId: 1, documentId: 1, updatedAt: -1 });

ChatSessionSchema.methods.addMessage = async function (role, content) {
  this.messages.push({ role, content });
  return await this.save();
};

module.exports = mongoose.models.ChatSession || mongoose.model('ChatSession', ChatSessionSchema);
