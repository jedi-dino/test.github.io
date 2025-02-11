const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  content: {
    type: String,
    required: false,
    maxlength: [1000, 'Message content cannot exceed 1000 characters'],
    default: ''
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', null],
    default: null
  },
  mediaUrl: {
    type: String,
    default: null
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id.toString()
      delete ret._id
      delete ret.__v
      return ret
    }
  }
})

// Validate that either content or media is present
messageSchema.pre('save', function(next) {
  if (!this.content && !this.mediaUrl) {
    return next(new Error('Message must have either content or media'))
  }
  return next()
})

// Instance method to safely convert message to JSON
messageSchema.methods.toJSON = function() {
  const obj = this.toObject()
  obj.id = obj._id.toString()
  delete obj._id
  delete obj.__v
  return obj
}

// Static method to find messages between users
messageSchema.statics.findBetweenUsers = async function(user1Id, user2Id) {
  return this.find({
    $or: [
      { sender: user1Id, recipient: user2Id },
      { sender: user2Id, recipient: user1Id }
    ]
  }).sort({ createdAt: 1 })
}

// Static method to mark messages as read
messageSchema.statics.markAsRead = async function(senderId, recipientId) {
  return this.updateMany(
    {
      sender: senderId,
      recipient: recipientId,
      read: false
    },
    { read: true }
  )
}

const Message = mongoose.model('Message', messageSchema)

module.exports = Message
