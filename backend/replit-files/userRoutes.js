const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('./User')

const router = express.Router()

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication token required'
    })
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({
        status: 'error',
        message: 'Invalid or expired token'
      })
    }
    req.user = user
    next()
  })
}

// Search users
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query
    if (!query) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query is required'
      })
    }

    const users = await User.find({
      username: { $regex: query, $options: 'i' },
      _id: { $ne: req.user.userId }
    }).select('username lastActive')

    res.json({
      status: 'success',
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        lastActive: user.lastActive
      }))
    })
  } catch (error) {
    console.error('User search error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error searching users'
    })
  }
})

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password')
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      })
    }

    res.json({
      status: 'success',
      user: {
        id: user._id,
        username: user.username,
        lastActive: user.lastActive,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error fetching profile'
    })
  }
})

// Update user profile
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const { username } = req.body

    // Validate username if provided
    if (username) {
      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({
          status: 'error',
          message: 'Username must be between 3 and 20 characters'
        })
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({
          status: 'error',
          message: 'Username can only contain letters, numbers, and underscores'
        })
      }

      // Check if username is already taken
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.user.userId }
      })
      
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Username is already taken'
        })
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { 
        ...(username && { username }),
        lastActive: new Date()
      },
      { new: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      })
    }

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        lastActive: user.lastActive,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Profile update error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error updating profile'
    })
  }
})

module.exports = router
