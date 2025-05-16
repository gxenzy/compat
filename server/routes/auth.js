const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/UserSQL');
const auth = require('../middleware/auth');
const publicRoute = require('../middleware/publicRoute');
const validator = require('validator');
const rateLimit = require('express-rate-limit');
const { addRefreshToken } = require('./refreshToken');
const crypto = require('crypto');

// Function to generate a secure random password
function generateSecurePassword(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
  let password = '';
  
  // Get random bytes
  const randomBytes = crypto.randomBytes(length);
  
  // Convert random bytes to password characters
  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes[i] % chars.length;
    password += chars.charAt(randomIndex);
  }
  
  return password;
}

// Rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests, please try again later.' },
});

// Input validation helper
function validateUserInput({ username, password, email, firstName, lastName, role }) {
  const errors = [];
  if (!username || !validator.isAlphanumeric(username)) {
    errors.push('Invalid or missing username.');
  }
  if (!password || !validator.isLength(password, { min: 6 })) {
    errors.push('Password must be at least 6 characters.');
  }
  if (!email || !validator.isEmail(email)) {
    errors.push('Invalid or missing email.');
  }
  if (!firstName || validator.isEmpty(firstName.trim())) {
    errors.push('First name is required.');
  }
  if (!lastName || validator.isEmpty(lastName.trim())) {
    errors.push('Last name is required.');
  }
  if (!role || !['ADMIN', 'STAFF', 'MODERATOR', 'USER'].includes(role)) {
    errors.push('Invalid or missing role.');
  }
  return errors;
};

// Create a separate handler function for login that can be reused
const loginHandler = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('LOGIN ATTEMPT:', username);

    // Basic validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Please enter all required fields.' });
    }

    // Check if user exists
    const user = await User.findOne({ where: { username } });
    console.log('USER FOUND:', !!user, user ? user.username : null, user ? user.password : null);
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
        
        // IMPORTANT: Client needs token in response body, not just as a cookie
        // Ensure token is included in the response JSON
        
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
          token: token, // This is the critical line - token must be in response JSON
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
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [authLimiter, publicRoute], loginHandler);

// @route   POST /api/auth/register
// @desc    Register a new user (admin only)
// @access  Private/Admin
router.post('/register', authLimiter, auth, async (req, res) => {
  try {
    const { username, password, email, firstName, lastName, role } = req.body;

    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to register users' });
    }

    // Validate input
    const errors = validateUserInput({ username, password, email, firstName, lastName, role });
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(' ') });
    }

    // Check if user already exists
    let user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      username,
      password,
      email,
      firstName,
      lastName,
      role,
      settings: {
        emailNotifications: true,
        darkMode: false,
        language: 'en'
      }
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/user
// @desc    Get authenticated user
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
// Export the login handler function so it can be used directly by other routes
module.exports.handle = loginHandler;
