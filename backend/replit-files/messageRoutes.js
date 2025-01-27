const express = require('express')
const jwt = require('jsonwebtoken')
const Message = require('./Message')
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

// Send a message
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { recipientId, content } = req.body

    if (!recipientId || !content) {
      return res.status(400).json({
        status: 'error',
        message: 'Recipient ID and content are required'
      })
    }

    if (content.length > 1000) {
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

    const message = new Message({
      sender: req.user.userId,
      recipient: recipientId,
      content,
      read: false
    })

    await message.save()

    res.status(201).json({
      status: 'success',
      message: {
        id: message._id,
        content: message.content,
        sender: req.user.userId,
        recipient: recipientId,
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

// Get messages with a specific user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.query
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
    }).sort({ createdAt: 1 })

    res.json({
      status: 'success',
      messages: messages.map(msg => ({
        id: msg._id,
        content: msg.content,
        sender: msg.sender,
        recipient: msg.recipient,
        read: msg.read,
        createdAt: msg.createdAt
      }))
    })
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
    .populate('sender recipient', 'username lastActive')

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
