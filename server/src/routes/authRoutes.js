const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const sequelize = require('../database/sequelize');
const logger = require('../utils/logger');

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  try {
    logger.info('Login attempt:', { username: req.body.username });
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user by username, email, or student_id
    const [results] = await sequelize.query(
      `SELECT * FROM users WHERE username = ? OR email = ? OR student_id = ? LIMIT 1`,
      { replacements: [username, username, username] }
    );

    const user = results[0];

    if (!user) {
      logger.warn(`Login failed: User not found - ${username}`);
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Verify password with bcrypt
    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      logger.warn(`Login failed: Invalid password for user - ${username}`);
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    logger.info(`Login successful: ${username}`);
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    logger.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Echo endpoint for debugging
router.post('/echo', (req, res) => {
  logger.info('Auth echo endpoint hit');
  return res.json({
    success: true,
    message: 'Echo endpoint working',
    receivedData: req.body,
    time: new Date().toISOString()
  });
});

// Test database connection endpoint
router.get('/test-db', async (req, res) => {
  try {
    await sequelize.authenticate();
    const [users] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    return res.json({
      success: true,
      message: 'Database connection successful',
      userCount: users[0].count
    });
  } catch (error) {
    logger.error('Database test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

module.exports = router; 