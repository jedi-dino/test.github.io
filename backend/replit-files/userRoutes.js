const express = require('express')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const User = require('./User')

const router = express.Router()

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP are allowed.'))
    }
  }
})

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
        createdAt: user.createdAt,
        imageUrl: user.imageUrl
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
        createdAt: user.createdAt,
        imageUrl: user.imageUrl
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

// Upload profile picture
router.put('/profile-picture', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No image file provided'
      })
    }

    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      })
    }

    // Delete old profile picture if it exists
    if (user.imageUrl) {
      const oldImagePath = path.join(__dirname, '..', user.imageUrl.replace('/uploads/', 'uploads/'))
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath)
      }
    }

    // Update user with new image URL
    const imageUrl = `/api/users/uploads/${req.file.filename}`
    user.imageUrl = imageUrl
    await user.save()

    res.json({
      status: 'success',
      message: 'Profile picture updated successfully',
      imageUrl
    })
  } catch (error) {
    console.error('Profile picture upload error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error uploading profile picture'
    })
  }
})

// Remove profile picture
router.delete('/profile-picture', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      })
    }

    if (user.imageUrl) {
      const imagePath = path.join(__dirname, '..', user.imageUrl.replace('/uploads/', 'uploads/'))
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
      user.imageUrl = undefined
      await user.save()
    }

    res.json({
      status: 'success',
      message: 'Profile picture removed successfully'
    })
  } catch (error) {
    console.error('Profile picture removal error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error removing profile picture'
    })
  }
})

module.exports = router
