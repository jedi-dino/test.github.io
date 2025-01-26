const express = require('express');
const router = express.Router();
const Message = require('./Message');
const auth = require('./auth');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Get messages between current user and another user
router.get('/messages/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user._id }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'username')
    .populate('recipient', 'username');

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Send a new message
router.post('/messages', auth, async (req, res) => {
  try {
    const { recipientId, content, media } = req.body;

    let mediaUrl = null;
    let mediaType = null;

    // Handle media upload if present
    if (media) {
      try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(media, {
          resource_type: 'auto',
          folder: 'chat-app'
        });

        mediaUrl = result.secure_url;
        mediaType = result.resource_type === 'video' ? 'video' : 'image';
      } catch (uploadError) {
        console.error('Error uploading media:', uploadError);
        return res.status(400).json({ message: 'Error uploading media' });
      }
    }

    const message = new Message({
      sender: req.user._id,
      recipient: recipientId,
      content: content || '',
      mediaUrl,
      mediaType
    });

    await message.save();

    // Populate sender and recipient info before sending response
    await message.populate('sender', 'username');
    await message.populate('recipient', 'username');

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

// Mark messages as read
router.patch('/messages/read/:senderId', auth, async (req, res) => {
  try {
    await Message.updateMany(
      {
        sender: req.params.senderId,
        recipient: req.user._id,
        read: false
      },
      {
        read: true
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Error marking messages as read' });
  }
});

// Get recent chats (unique users the current user has messaged with)
router.get('/messages/recent/chats', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id },
        { recipient: req.user._id }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('sender', 'username')
    .populate('recipient', 'username');

    // Get unique users from messages
    const users = new Map();
    messages.forEach(message => {
      const otherUser = message.sender._id.toString() === req.user._id.toString()
        ? message.recipient
        : message.sender;
      
      if (!users.has(otherUser._id.toString())) {
        users.set(otherUser._id.toString(), {
          id: otherUser._id,
          username: otherUser.username,
          lastMessage: message
        });
      }
    });

    res.json(Array.from(users.values()));
  } catch (error) {
    console.error('Error fetching recent chats:', error);
    res.status(500).json({ message: 'Error fetching recent chats' });
  }
});

module.exports = router;
