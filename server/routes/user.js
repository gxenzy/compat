const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const { query } = require('../src/config/database');

// GET all users
router.get('/', async (req, res) => {
  try {
    const users = await query('SELECT * FROM users WHERE is_active = 1');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      message: 'Error fetching users', 
      error: error.message 
    });
  }
});

/**
 * Get users by roles - MUST come before /:id route
 * @route GET /api/users/by-roles
 * @access Authenticated users
 */
router.get('/by-roles', async (req, res) => {
  try {
    console.log('GET /users/by-roles called with roles:', req.query.roles);
    
    // Get roles from query string
    const { roles } = req.query;
    
    if (!roles) {
      return res.status(400).json({ message: 'Roles parameter is required' });
    }
    
    // Parse roles from comma-separated string
    // Safely decode URI component first
    const decodedRoles = decodeURIComponent(roles);
    const rolesList = decodedRoles.split(',').map(r => r.trim()).filter(Boolean);
    
    console.log('Parsed roles:', rolesList);
    
    // Validate roles to prevent SQL injection
    const validRoles = ['admin', 'manager', 'auditor', 'reviewer', 'staff', 'moderator'];
    const filteredRoles = rolesList.filter(role => validRoles.includes(role));
    
    console.log('Filtered valid roles:', filteredRoles);
    
    if (filteredRoles.length === 0) {
      // If no valid roles provided, return empty array instead of error
      console.log('No valid roles provided, returning empty array');
      return res.json([]);
    }
    
    // Build placeholders for SQL query
    const placeholders = filteredRoles.map(() => '?').join(',');
    
    const query_sql = `SELECT id, username, email, first_name AS firstName, last_name AS lastName, role 
                      FROM users 
                      WHERE role IN (${placeholders}) AND is_active = 1`;
    console.log('SQL Query:', query_sql);
    console.log('SQL Params:', filteredRoles);
    
    // Get users with specified roles
    const users = await query(query_sql, filteredRoles);
    
    return res.json(users);
  } catch (error) {
    console.error('Error fetching users by roles:', error);
    return res.status(500).json({ 
      message: 'Error fetching user', 
      error: error.message 
    });
  }
});

// Fallback for when by-roles fails - get all users
router.get('/all', async (req, res) => {
  try {
    const users = await query(
      `SELECT id, username, email, first_name AS firstName, last_name AS lastName, role 
       FROM users 
       WHERE is_active = 1`
    );
    
    return res.json(users);
  } catch (error) {
    console.error('Error fetching all users:', error);
    return res.status(500).json({ 
      message: 'Error fetching users', 
      error: error.message 
    });
  }
});

// GET user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST create user
router.post('/', async (req, res) => {
  try {
    const newUser = await userService.createUser(req.body);
    req.app.get('io').emit('userActivity', { action: 'created', user: newUser });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  try {
    const updatedUser = await userService.updateUser(req.params.id, req.body);
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });
    req.app.get('io').emit('userActivity', { action: 'updated', user: updatedUser });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await userService.deleteUser(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    const io = req.app.get('io');
    if (io) io.emit('userDelete', req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 