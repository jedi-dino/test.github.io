import express from 'express';
import { auth } from './auth.js';
import Message from './Message.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get recent conversations
router.get('/recent', auth, async (req, res) => {
  try {
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { recipient: req.user._id }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', req.user._id] },
              '$recipient',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipient', req.user._id] },
                    { $eq: ['$read', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 0,
          user: {
            _id: '$user._id',
            username: '$user.username',
            profilePicture: '$user.profilePicture'
          },
          lastMessage: 1,
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.json(messages);
  } catch (error) {
    console.error('Get recent messages error:', error);
    res.status(500).json({ message: 'Error getting recent messages' });
  }
});

// Get chat history with a user
router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user._id }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(50);

    // Mark messages as read
    await Message.updateMany(
      {
        sender: req.params.userId,
        recipient: req.user._id,
        read: false
      },
      { read: true }
    );

    res.json(messages.reverse());
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Error getting messages' });
  }
});

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { recipientId, content, media } = req.body;

    // Validate that at least content or media is provided
    if (!content?.trim() && !media) {
      return res.status(400).json({ message: 'Message content or media is required' });
    }

    // Validate media if provided
    let mediaType = null;
    let mediaUrl = null;

    if (media) {
      // Check media type from base64 data
      if (media.startsWith('data:image/')) {
        mediaType = 'image';
      } else if (media.startsWith('data:video/')) {
        mediaType = 'video';
      } else {
        return res.status(400).json({ message: 'Invalid media format. Must be image or video.' });
      }

      // Store the base64 media data
      mediaUrl = media;
    }

    const message = new Message({
      sender: req.user._id,
      recipient: recipientId,
      content: content?.trim() || '',
      mediaType,
      mediaUrl,
      read: false
    });

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

// Delete conversation with a user
router.delete('/:userId', auth, async (req, res) => {
  try {
    // Convert string IDs to ObjectIds
    const userId = new mongoose.Types.ObjectId(req.params.userId);
    const currentUserId = new mongoose.Types.ObjectId(req.user._id);

    console.log('Deleting messages between:', {
      currentUserId: currentUserId.toString(),
      userId: userId.toString()
    });

    const result = await Message.deleteMany({
      $or: [
        { sender: currentUserId, recipient: userId },
        { sender: userId, recipient: currentUserId }
      ]
    });

    console.log('Delete result:', result);

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No messages found to delete' });
    }

    res.json({ 
      message: 'Conversation deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ message: 'Error deleting conversation' });
  }
});

export default router;
