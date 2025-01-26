import express from 'express';
import { auth } from './auth.js';
import Message from './Message.js';

const router = express.Router();

// Get recent conversations
router.get('/recent', auth, async (req, res) => {
  try {
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: req.user._id },
            { recipientId: req.user._id }
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
              { $eq: ['$senderId', req.user._id] },
              '$recipientId',
              '$senderId'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipientId', req.user._id] },
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
        { senderId: req.user._id, recipientId: req.params.userId },
        { senderId: req.params.userId, recipientId: req.user._id }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(50);

    // Mark messages as read
    await Message.updateMany(
      {
        senderId: req.params.userId,
        recipientId: req.user._id,
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
    const { recipientId, content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const message = new Message({
      senderId: req.user._id,
      recipientId,
      content: content.trim(),
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
    await Message.deleteMany({
      $or: [
        { senderId: req.user._id, recipientId: req.params.userId },
        { senderId: req.params.userId, recipientId: req.user._id }
      ]
    });

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ message: 'Error deleting conversation' });
  }
});

export default router;
