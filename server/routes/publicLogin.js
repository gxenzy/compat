/**
 * Public login route that bypasses all authentication middleware
 * This file is loaded and mounted separately to ensure it's not affected by
 * global auth middleware configuration
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/UserSQL');
const { addRefreshToken } = require('./refreshToken');

// Handler function that can be exported
const loginHandler = async (req, res) => {
  try {
    console.log('PUBLIC LOGIN ROUTE HIT', req.body);
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Please enter all required fields.' });
    }

    // Check if user exists
    const user = await User.findOne({ where: { username } });
    console.log('USER FOUND:', !!user, user ? user.username : null);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('PASSWORD MATCH:', isMatch);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create and return JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE },
      (err, token) => {
        if (err) throw err;
        
        // Set token as HttpOnly secure cookie
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: parseInt(process.env.JWT_EXPIRE_MS) || 3600000, // fallback 1 hour
        });
        
        // Generate refresh token
        const refreshToken = jwt.sign(
          payload,
          process.env.JWT_REFRESH_SECRET,
          { expiresIn: process.env.JWT_REFRESH_EXPIRE }
        );
        
        // Store refresh token
        addRefreshToken(refreshToken);
        
        // Set refresh token as HttpOnly cookie
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: parseInt(process.env.JWT_REFRESH_EXPIRE_MS) || 7 * 24 * 3600000, // fallback 7 days
        });
        
        // Return response with user data AND token for client storage
        res.json({
          token: token,
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
    console.error('Public login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST /api/public-login
// @desc    Public login route that bypasses all auth middleware
// @access  Public
router.post('/', loginHandler);

module.exports = router;
// Export the handler function for direct usage
module.exports.handle = loginHandler; 