require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const path = require('path')
const fs = require('fs')
const authRoutes = require('./authRoutes')
const userRoutes = require('./userRoutes')
const messageRoutes = require('./messageRoutes')

const app = express()

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5174',
    'http://localhost:5173',
    'https://test.github.io',
    'https://jedi-dino.github.io'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}

// Use cors middleware
app.use(cors(corsOptions))

// Parse JSON bodies
app.use(express.json())

// Serve static files from uploads directory
app.use('/api/users/uploads', express.static(path.join(__dirname, 'uploads')))

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/messages', messageRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Not found'
  })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
  console.log('CORS enabled for:', corsOptions.origin)
  console.log('Uploads directory:', uploadsDir)
})

// Handle uncaught errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err)
  process.exit(1)
})
