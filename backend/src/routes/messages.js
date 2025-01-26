import express from 'express';
import Message from '../models/Message.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get messages with a specific user
router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.getConversation(req.user._id, req.params.userId);
    
    // Format messages for the client
    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      content: msg.content,
      senderId: msg.senderId._id,
      receiverId: msg.receiverId._id,
      timestamp: msg.createdAt
    }));

    res.json(formattedMessages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!content.trim()) {
      return res.status(400).json({ message: 'Message content cannot be empty' });
    }

    const message = new Message({
      senderId: req.user._id,
      receiverId,
      content: content.trim()
    });

    await message.save();
    await message.populate('senderId', 'username');
    await message.populate('receiverId', 'username');

    // Format the message for the client
    const formattedMessage = {
      id: message._id,
      content: message.content,
      senderId: message.senderId._id,
      receiverId: message.receiverId._id,
      timestamp: message.createdAt
    };

    res.status(201).json(formattedMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark messages as read
router.patch('/read/:senderId', auth, async (req, res) => {
  try {
    await Message.updateMany(
      {
        senderId: req.params.senderId,
        receiverId: req.user._id,
        read: false
      },
      {
        read: true
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
