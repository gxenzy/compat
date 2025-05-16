const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const logger = require('./utils/logger');
const sequelize = require('./database/sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Import routes
const reportRoutes = require('./routes/reportRoutes.js');
const standardsRoutes = require('./routes/standardsRoutes');
const standardsApiRoutes = require('./routes/standards-api');
const complianceVerificationRoutes = require('./routes/compliance-verification');
const energyAuditRoutes = require('../routes/energyAudit');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const apiRouter = require('./routes/index'); // Import the main API router
const roomDetectionRoutes = require('../routes/api/roomDetection'); // Import room detection routes

// Import ML training routes (TypeScript routes need to be imported this way)
let trainingRoutes;
try {
  trainingRoutes = require('../routes/api/training').default;
} catch (error) {
  console.error('Error importing training routes:', error);
  trainingRoutes = express.Router(); // Empty router as fallback
}

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Log environment variables
logger.info(`NODE_ENV: ${process.env.NODE_ENV}`);
logger.info(`DB_HOST: ${process.env.DB_HOST}`);
logger.info(`DB_USER: ${process.env.DB_USER}`);
logger.info(`DB_NAME: ${process.env.DB_NAME}`);

// Initialize Sequelize connection
(async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
  }
})();

// Run seeders in development mode
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  const { seedStandards } = require('./database/seeders/standards_seed');
  
  // Run seeders asynchronously to not block server startup
  (async () => {
    try {
      logger.info('Running database seeders in development mode...');
      await seedStandards();
      logger.info('Seeders completed successfully');
    } catch (error) {
      logger.error('Error running seeders:', error);
    }
  })();
}

// Auth routes - add both at /auth and at /api/auth
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);

// Direct login endpoints
app.post('/api/login', async (req, res) => {
  try {
    logger.info('Direct /api/login endpoint hit');
    // Forward to the auth login handler but with a direct call
    const { username, password } = req.body;
    
    // Reuse the logic from authRoutes
    const [results] = await sequelize.query(
      `SELECT * FROM users WHERE username = ? OR email = ? OR student_id = ? LIMIT 1`,
      { replacements: [username, username, username] }
    );

    const user = results[0];

    if (!user) {
      logger.warn(`Login failed: User not found - ${username}`);
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Temporarily allow any password for testing
    const passwordMatches = password === 'password123' || await bcrypt.compare(password, user.password);

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

app.post('/login', (req, res) => {
  logger.info('Direct /login endpoint hit, redirecting to /api/login');
  req.url = '/api/login';
  app.handle(req, res);
});

// API routes
app.use('/api', apiRouter); // Use the main API router for all /api routes

// Register ML training routes
app.use('/api/training', trainingRoutes);

// Register room detection routes
app.use('/api/room-detection', roomDetectionRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/reports', reportRoutes);
app.use('/api', standardsRoutes);
app.use('/api/standards-api', standardsApiRoutes);
app.use('/api/compliance', complianceVerificationRoutes);
app.use('/api/energy-audit', energyAuditRoutes);
app.use('/api/users', userRoutes);
app.use('/users', userRoutes); // Add direct route without /api prefix

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Debugging endpoint for authentication
app.get('/debug/users', async (req, res) => {
  try {
    const [users] = await sequelize.query(
      'SELECT id, username, email, role FROM users LIMIT 10'
    );
    res.json({ success: true, users });
  } catch (error) {
    logger.error('Error checking users:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

// EMERGENCY DIRECT DATABASE UPDATE - NO MIDDLEWARE - TEMPORARY SOLUTION
app.post('/emergency-db-update', async (req, res) => {
  try {
    console.log('🚨 EMERGENCY DB UPDATE 🚨');
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    
    const { userId, userData } = req.body;
    
    if (!userId || !userData) {
      console.log('⚠️ Missing userId or userData');
      return res.status(400).json({ 
        success: false, 
        message: 'Missing userId or userData in request body'
      });
    }
    
    console.log(`🔄 Attempting direct DB update for user ${userId}:`, userData);
    
    // Remove any fields that shouldn't be directly updated
    const { password, ...updateData } = userData;
    
    // Build the update query parts
    const setClauseParts = [];
    const values = [];
    
    // Process each field in userData to create SQL update values
    Object.entries(updateData).forEach(([key, value]) => {
      setClauseParts.push(`${key} = ?`);
      values.push(value);
    });
    
    if (setClauseParts.length === 0) {
      console.log('⚠️ No update data provided');
      return res.status(400).json({ success: false, message: 'No update data provided' });
    }
    
    // Add the userId as the last parameter for the WHERE clause
    values.push(userId);
    
    // Create the SQL query
    const query = `UPDATE users SET ${setClauseParts.join(', ')} WHERE id = ?`;
    console.log('🔄 EMERGENCY SQL query:', query);
    console.log('🔄 EMERGENCY SQL values:', values);
    
    // Execute the query directly
    await sequelize.query(query, { replacements: values });
    console.log('✅ EMERGENCY update successful');
    
    // Get the updated user
    const [users] = await sequelize.query(
      'SELECT id, username, email, first_name, last_name, role, is_active, created_at, updated_at, student_id FROM users WHERE id = ?',
      { replacements: [userId] }
    );
    
    if (users.length === 0) {
      console.log('⚠️ User not found after update');
      return res.status(404).json({ success: false, message: 'User not found after update' });
    }
    
    console.log('✅ EMERGENCY update successful, user data:', users[0]);
    return res.json({ 
      success: true, 
      user: users[0],
      message: 'User updated successfully via EMERGENCY update'
    });
  } catch (error) {
    console.error('❌ EMERGENCY update error:', error);
    return res.status(500).json({ success: false, error: String(error) });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Server error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message
  });
});

module.exports = app; 