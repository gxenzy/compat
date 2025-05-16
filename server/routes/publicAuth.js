/**
 * Public authentication routes that bypass middleware
 * This provides a guaranteed login endpoint that won't be affected by 
 * authentication middleware
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/UserSQL');
const validator = require('validator');
const rateLimit = require('express-rate-limit');
const { addRefreshToken } = require('./refreshToken');

// Rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests, please try again later.' },
});

// Public login handler function
const loginHandler = async (req, res) => {
  console.log('PUBLIC AUTH: Login attempt received', req.body);
  
  try {
    const { username, password } = req.body;
    
    // Basic validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }
    
    // Check for user in database
    const user = await User.findOne({ where: { username } });
    console.log('PUBLIC AUTH: User found:', !!user);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('PUBLIC AUTH: Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Create token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) {
          console.error('PUBLIC AUTH: Token creation error:', err);
          return res.status(500).json({ message: 'Error creating token' });
        }
        
        // Return token and user data
        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName, 
            lastName: user.lastName,
            role: user.role,
            settings: user.settings
          }
        });
      }
    );
  } catch (err) {
    console.error('PUBLIC AUTH: Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Public login route
router.post('/login', loginHandler);

// Export router and handler
module.exports = router;
module.exports.handle = loginHandler; 