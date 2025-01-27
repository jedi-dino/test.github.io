const express = require('express')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const Message = require('./Message')
const User = require('./User')

const router = express.Router()

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads', 'messages')
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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'))
    }
  }
}).single('media')

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

// Send a message
router.post('/', authenticateToken, (req, res) => {
  upload(req, res, async (err) => {
    try {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            status: 'error',
            message: 'File size cannot exceed 10MB'
          })
        }
        return res.status(400).json({
          status: 'error',
          message: err.message
        })
      } else if (err) {
        return res.status(400).json({
          status: 'error',
          message: err.message
        })
      }

      const { recipientId, content } = req.body

      if (!recipientId || (!content && !req.file)) {
        return res.status(400).json({
          status: 'error',
          message: 'Recipient ID and either content or media are required'
        })
      }

      if (content && content.length > 1000) {
        return res.status(400).json({
          status: 'error',
          message: 'Message content cannot exceed 1000 characters'
        })
      }

      const recipient = await User.findById(recipientId)
      if (!recipient) {
        return res.status(404).json({
          status: 'error',
          message: 'Recipient not found'
        })
      }

      const messageData = {
        sender: req.user.userId,
        recipient: recipientId,
        content: content || '',
        read: false
      }

      if (req.file) {
        messageData.mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'video'
        messageData.mediaUrl = `/api/messages/uploads/${req.file.filename}`
      }

      const message = new Message(messageData)
      await message.save()

      // Populate sender and recipient details
      await message.populate('sender recipient', 'username')

      res.status(201).json({
        status: 'success',
        message: {
          _id: message._id,
          content: message.content,
          sender: {
            _id: message.sender._id,
            username: message.sender.username
          },
          recipient: {
            _id: message.recipient._id,
            username: message.recipient.username
          },
          mediaType: message.mediaType,
          mediaUrl: message.mediaUrl,
          read: message.read,
          createdAt: message.createdAt
        }
      })
    } catch (error) {
      console.error('Message send error:', error)
      res.status(500).json({
        status: 'error',
        message: 'Error sending message'
      })
    }
  })
})

// Get messages with a specific user
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params
    if (!userId) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      })
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user.userId, recipient: userId },
        { sender: userId, recipient: req.user.userId }
      ]
    })
    .populate('sender recipient', 'username')
    .sort({ createdAt: 1 })

    res.json(messages)
  } catch (error) {
    console.error('Message fetch error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error fetching messages'
    })
  }
})

// Get recent chats
router.get('/recent/chats', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.userId },
        { recipient: req.user.userId }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('sender recipient', 'username lastActive imageUrl')

    // Get unique users from messages
    const userMap = new Map()
    messages.forEach(msg => {
      const otherUser = msg.sender._id.toString() === req.user.userId 
        ? msg.recipient 
        : msg.sender

      if (!userMap.has(otherUser._id.toString())) {
        userMap.set(otherUser._id.toString(), {
          id: otherUser._id,
          username: otherUser.username,
          lastActive: otherUser.lastActive,
          imageUrl: otherUser.imageUrl,
          lastMessage: {
            id: msg._id,
            content: msg.content,
            sender: msg.sender._id,
            recipient: msg.recipient._id,
            read: msg.read,
            createdAt: msg.createdAt
          }
        })
      }
    })

    res.json({
      status: 'success',
      chats: Array.from(userMap.values())
    })
  } catch (error) {
    console.error('Recent chats fetch error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error fetching recent chats'
    })
  }
})

// Mark messages as read
router.post('/read', authenticateToken, async (req, res) => {
  try {
    const { senderId } = req.body
    if (!senderId) {
      return res.status(400).json({
        status: 'error',
        message: 'Sender ID is required'
      })
    }

    await Message.updateMany(
      {
        sender: senderId,
        recipient: req.user.userId,
        read: false
      },
      { read: true }
    )

    res.json({
      status: 'success',
      message: 'Messages marked as read'
    })
  } catch (error) {
    console.error('Mark messages read error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error marking messages as read'
    })
  }
})

module.exports = router
