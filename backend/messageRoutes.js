import express from 'express';
import { auth } from './auth.js';
import Message from './Message.js';
import User from './User.js';

const router = express.Router();

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { recipientId, content } = req.body;

    if (!recipientId || !content) {
      return res.status(400).json({ message: 'Recipient and message content are required' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ message: 'Message content cannot exceed 1000 characters' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Create and save message
    const message = new Message({
      sender: req.user._id,
      recipient: recipientId,
      content: content.trim()
    });

    await message.save();

    // Populate sender and recipient info
    await message.populate('sender', 'username');
    await message.populate('recipient', 'username');

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

// Get conversation with another user
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { before, limit = 50 } = req.query;

    // Validate user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build query
    const query = {
      $or: [
        { sender: req.user._id, recipient: userId },
        { sender: userId, recipient: req.user._id }
      ]
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    // Get messages
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('sender', 'username')
      .populate('recipient', 'username');

    // Mark unread messages as read
    const unreadMessages = messages.filter(
      msg => !msg.read && msg.recipient.equals(req.user._id)
    );

    if (unreadMessages.length > 0) {
      await Message.updateMany(
        {
          _id: { $in: unreadMessages.map(msg => msg._id) }
        },
        {
          read: true,
          readAt: new Date()
        }
      );
    }

    res.json(messages.reverse());
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Error getting conversation' });
  }
});

// Get recent conversations
router.get('/recent', auth, async (req, res) => {
  try {
    console.log('Getting recent conversations for user:', req.user._id);
    
    if (!req.user || !req.user._id) {
      console.error('User not found in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const conversations = await Message.getRecentConversations(req.user._id);
    console.log('Found conversations:', conversations.length);

    // Check if conversations array is empty
    if (!conversations || conversations.length === 0) {
      console.log('No conversations found');
      return res.json([]);
    }

    res.json(conversations);
  } catch (error) {
    console.error('Get recent conversations error:', error);
    res.status(500).json({ 
      message: 'Error getting recent conversations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete a message
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.messageId,
      sender: req.user._id
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    await message.deleteOne();
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
});

// Mark messages as read
router.post('/read', auth, async (req, res) => {
  try {
    const { messageIds } = req.body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: 'Message IDs array is required' });
    }

    await Message.updateMany(
      {
        _id: { $in: messageIds },
        recipient: req.user._id,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ message: 'Error marking messages as read' });
  }
});

export default router;
