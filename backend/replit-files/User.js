import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profilePicture: {
    type: String,
    default: '', // Base64 encoded image string
    maxlength: 5242880 // 5MB limit
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
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Method to update profile picture
userSchema.methods.updateProfilePicture = async function(base64Image) {
  if (!base64Image) {
    throw new Error('Profile picture is required');
  }

  // Validate image size (5MB limit)
  const sizeInBytes = Buffer.from(base64Image, 'base64').length;
  if (sizeInBytes > 5242880) {
    throw new Error('Profile picture must be less than 5MB');
  }

  this.profilePicture = base64Image;
  await this.save();
};

const User = mongoose.model('User', userSchema);

export default User;
