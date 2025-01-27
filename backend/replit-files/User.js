const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    set: v => v.toLowerCase() // Convert username to lowercase before saving
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  imageUrl: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id.toString()
      delete ret._id
      delete ret.__v
      delete ret.password
      return ret
    }
  }
})

// Update lastActive timestamp before saving
userSchema.pre('save', function(next) {
  this.lastActive = new Date()
  next()
})

// Custom error messages for unique fields
userSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('Username already exists'))
  } else {
    next(error)
  }
})

// Instance method to safely convert user to JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject()
  obj.id = obj._id.toString()
  delete obj._id
  delete obj.__v
  delete obj.password
  return obj
}

// Static method to find user by username
userSchema.statics.findByUsername = async function(username) {
  return this.findOne({ username })
}

// Static method to validate password length
userSchema.statics.validatePassword = function(password) {
  return password && password.length >= 6 && password.length <= 50
}

const User = mongoose.model('User', userSchema)

module.exports = User
