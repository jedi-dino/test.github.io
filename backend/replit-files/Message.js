import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient querying of conversations
messageSchema.index({ senderId: 1, receiverId: 1 });

// Static method to get conversation between two users
messageSchema.statics.getConversation = async function(userOneId, userTwoId) {
  return this.find({
    $or: [
      { senderId: userOneId, receiverId: userTwoId },
      { senderId: userTwoId, receiverId: userOneId }
    ]
  })
  .sort({ createdAt: 1 })
  .populate('senderId', 'username')
  .populate('receiverId', 'username');
};

const Message = mongoose.model('Message', messageSchema);

export default Message;
