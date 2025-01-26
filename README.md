# Chat App

A real-time chat application with media sharing capabilities built with React, Node.js, and MongoDB.

## Features

- User authentication and registration
- Real-time messaging
- Image and video sharing
- User search functionality
- Recent chats list
- Dark mode support
- Responsive design

## Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Cloudinary account (for media storage)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chat-app.git
cd chat-app
```

2. Install dependencies for both frontend and backend:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

3. Create environment files:

Frontend (.env):
```
VITE_API_URL=http://localhost:5000
```

Backend (.env):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chat-app
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:3000
```

4. Start the development servers:

In one terminal (frontend):
```bash
npm run dev
```

In another terminal (backend):
```bash
cd backend
npm run dev
```

The frontend will be available at http://localhost:3000 and the backend at http://localhost:5000.

## Project Structure

```
chat-app/
├── src/                    # Frontend source files
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── config.ts         # Configuration
│   └── ...
├── backend/              # Backend source files
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   └── ...
└── ...
```

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user
- POST /api/auth/logout - Logout user

### Users
- GET /api/users/search - Search users
- GET /api/users/profile - Get user profile
- PUT /api/users/update - Update user profile

### Messages
- GET /api/messages/:userId - Get messages with a user
- POST /api/messages - Send a message
- GET /api/messages/recent/chats - Get recent chats
- PATCH /api/messages/read/:senderId - Mark messages as read

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
