import express from 'express';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Search users
router.get('/search', auth, async (req, res) => {
  try {
    const { term } = req.query;

    if (!term || term.length < 2) {
      return res.status(400).json({ message: 'Search term must be at least 2 characters' });
    }

    const users = await User.find({
      username: { 
        $regex: term, 
        $options: 'i' 
      },
      _id: { $ne: req.user._id } // Exclude current user
    })
    .select('username')
    .limit(10);

    const formattedUsers = users.map(user => ({
      id: user._id,
      username: user.username
    }));

    res.json(formattedUsers);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('username');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user._id,
      username: user.username
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
