const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('./User')

const router = express.Router()

// Middleware to log requests
router.use((req, res, next) => {
  console.log(`Auth request: ${req.method} ${req.path}`)
  next()
})

router.post('/register', async (req, res) => {
  try {
    console.log('Register request body:', req.body)
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username and password are required'
      })
    }

    const existingUser = await User.findOne({ username })
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Username already exists'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User({
      username,
      password: hashedPassword
    })

    await user.save()

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      user: {
        id: user._id.toString(),
        username: user.username
      },
      token
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      status: 'error',
      message: error.name === 'ValidationError' 
        ? error.message 
        : 'Error creating user'
    })
  }
})

router.post('/login', async (req, res) => {
  try {
    console.log('Login request body:', req.body)
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username and password are required'
      })
    }

    const user = await User.findOne({ username })
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password'
      })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password'
      })
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    res.json({
      status: 'success',
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        username: user.username
      },
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error during login'
    })
  }
})

router.post('/logout', (req, res) => {
  res.json({
    status: 'success',
    message: 'Logged out successfully'
  })
})

module.exports = router
