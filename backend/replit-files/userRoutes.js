import express from 'express';
import { auth } from './auth.js';
import User from './User.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Search users
router.get('/search', auth, async (req, res) => {
  try {
    const { query = '' } = req.query;
    
    // Search for users by username, excluding the current user
    const users = await User.find({
      _id: { $ne: req.user._id },
      ...(query ? {
        username: { 
          $regex: query,
          $options: 'i'
        }
      } : {})
    })
    .select('username lastActive profilePicture')
    .limit(10);

    res.json(users);
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ message: 'Error searching users' });
  }
});

// Get user profile
router.get('/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('username lastActive createdAt profilePicture');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error getting user profile' });
  }
});

// Update user's own profile
router.patch('/me', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['username', 'profilePicture', 'currentPassword', 'newPassword'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ message: 'Invalid updates' });
  }

  try {
    const { username, profilePicture, currentPassword, newPassword } = req.body;

    // Handle password update
    if (currentPassword && newPassword) {
      const isMatch = await req.user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      req.user.password = await bcrypt.hash(newPassword, salt);
    }

    // Handle username update
    if (username) {
      // Validate username format
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
        return res.status(400).json({
          message: 'Username must be 3-30 characters long and can only contain letters, numbers, and underscores'
        });
      }

      // Check if username is already taken
      const existingUser = await User.findOne({
        _id: { $ne: req.user._id },
        username: { $regex: new RegExp(`^${username}$`, 'i') }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      req.user.username = username;
    }

    // Handle profile picture update
    if (profilePicture) {
      try {
        await req.user.updateProfilePicture(profilePicture);
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }

    await req.user.save();

    res.json({
      id: req.user._id,
      username: req.user.username,
      profilePicture: req.user.profilePicture
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Delete user's own account
router.delete('/me', auth, async (req, res) => {
  try {
    await req.user.remove();
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Error deleting account' });
  }
});

export default router;
