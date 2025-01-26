import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
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
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient querying of conversations
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

// Method to mark message as read
messageSchema.methods.markAsRead = async function() {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    await this.save();
  }
};

// Static method to get conversation between two users
messageSchema.statics.getConversation = async function(user1Id, user2Id, limit = 50, skip = 0) {
  return this.find({
    $or: [
      { sender: user1Id, recipient: user2Id },
      { sender: user2Id, recipient: user1Id }
    ]
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'username')
    .populate('recipient', 'username');
};

// Static method to get recent conversations for a user
messageSchema.statics.getRecentConversations = async function(userId) {
  try {
    // Convert string ID to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());

    const conversations = await this.aggregate([
      {
        $match: {
          $or: [{ sender: userObjectId }, { recipient: userObjectId }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userObjectId] },
              '$recipient',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipient', userObjectId] },
                    { $eq: ['$read', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          user: { $ne: null }
        }
      },
      {
        $project: {
          user: { 
            _id: 1, 
            username: 1,
            profilePicture: 1
          },
          lastMessage: {
            _id: 1,
            content: 1,
            createdAt: 1,
            read: 1
          },
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    return conversations;
  } catch (error) {
    console.error('Error in getRecentConversations:', error);
    throw error;
  }
};

const Message = mongoose.model('Message', messageSchema);

export default Message;
