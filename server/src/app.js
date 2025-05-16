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
const complianceRoutes = require('./routes/compliance'); // Fix import path
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

// Ensure standards tables exist
const { setupStandardsTables } = require('./setupStandardsTables');
const { migrateTablesFormat } = require('./migrateTables');

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
    
    // Run the table migration to ensure consistent naming convention
    logger.info('Running database table migration...');
    await migrateTablesFormat();
    logger.info('Database migration completed');
    
    // Create compliance tables if they don't exist
    await ensureComplianceTables();
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
  }
})();

// Ensure compliance tables exist
async function ensureComplianceTables() {
  try {
    // Create building_type_standards table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS building_type_standards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        building_type VARCHAR(100) NOT NULL,
        standard_type VARCHAR(100) NOT NULL,
        standard_code VARCHAR(100) NOT NULL,
        minimum_value FLOAT NULL,
        maximum_value FLOAT NULL,
        unit VARCHAR(50) NULL,
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create project_type_standards table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS project_type_standards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_type VARCHAR(100) NOT NULL,
        standard_type VARCHAR(100) NOT NULL,
        standard_code VARCHAR(100) NOT NULL,
        minimum_value FLOAT NULL,
        maximum_value FLOAT NULL,
        unit VARCHAR(50) NULL,
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create compliance_recommendations table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS compliance_recommendations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rule_id INT NULL,
        non_compliance_type VARCHAR(100) NOT NULL,
        recommendation_text TEXT NOT NULL,
        priority VARCHAR(50) DEFAULT 'medium',
        calculator_type VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Insert sample data if tables are empty
    const [buildingCount] = await sequelize.query('SELECT COUNT(*) as count FROM building_type_standards');
    if (buildingCount[0].count === 0) {
      await sequelize.query(`
        INSERT INTO building_type_standards 
        (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
        VALUES 
        ('commercial', 'illumination', 'PEC-2017-1075.1', 300, 500, 'lux', 'Office illumination requirement'),
        ('residential', 'illumination', 'PEC-2017-1075.2', 150, 300, 'lux', 'Residential illumination requirement'),
        ('industrial', 'safety', 'PEC-2017-1100.1', null, null, null, 'Industrial safety standard')
      `);
    }
    
    const [projectCount] = await sequelize.query('SELECT COUNT(*) as count FROM project_type_standards');
    if (projectCount[0].count === 0) {
      await sequelize.query(`
        INSERT INTO project_type_standards
        (project_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
        VALUES 
        ('renovation', 'efficiency', 'PEEP-2020-E1', 85, null, '%', 'Energy efficiency requirement'),
        ('new-construction', 'efficiency', 'PEEP-2020-E2', 90, null, '%', 'New construction efficiency requirement'),
        ('retrofit', 'safety', 'PEC-2017-S1', null, null, null, 'Retrofit safety requirements')
      `);
    }
    
    const [recommendationsCount] = await sequelize.query('SELECT COUNT(*) as count FROM compliance_recommendations');
    if (recommendationsCount[0].count === 0) {
      await sequelize.query(`
        INSERT INTO compliance_recommendations
        (non_compliance_type, recommendation_text, priority, calculator_type)
        VALUES 
        ('efficiency', 'Replace with LED lighting to improve energy efficiency', 'high', 'illumination'),
        ('safety', 'Install additional emergency lighting per code requirements', 'critical', 'safety'),
        ('code', 'Update wiring to meet current electrical code standards', 'medium', 'wiring')
      `);
    }
    
    logger.info('Compliance tables created successfully and populated with sample data');
  } catch (error) {
    logger.error('Error creating compliance tables:', error);
  }
}

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

app.post('/login', (req, res) => {
  logger.info('Direct /login endpoint hit, redirecting to /api/login');
  req.url = '/api/login';
  app.handle(req, res);
});

// Add direct POST routes for compliance endpoints
app.post('/compliance/building-standards', async (req, res) => {
  try {
    console.log('Direct POST to /compliance/building-standards:', req.body);
    const { buildingType, standardType, standardCode, minimumValue, maximumValue, unit, description } = req.body;
    
    const [result] = await sequelize.query(`
      INSERT INTO building_type_standards (
        building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, {
      replacements: [
        buildingType, 
        standardType, 
        standardCode, 
        minimumValue !== '' ? minimumValue : null, 
        maximumValue !== '' ? maximumValue : null, 
        unit, 
        description
      ]
    });
    
    console.log('Created building standard with ID:', result);
    
    // Return the created record
    const [newRecord] = await sequelize.query(`
      SELECT * FROM building_type_standards WHERE id = ?
    `, {
      replacements: [result]
    });
    
    res.status(201).json(newRecord[0]);
  } catch (error) {
    console.error('Error creating building standard:', error);
    res.status(500).json({ message: 'Failed to create building standard', error: error.message });
  }
});

app.post('/compliance/project-standards', async (req, res) => {
  try {
    console.log('Direct POST to /compliance/project-standards:', req.body);
    const { projectType, standardType, standardCode, minimumValue, maximumValue, unit, description } = req.body;
    
    const [result] = await sequelize.query(`
      INSERT INTO project_type_standards (
        project_type, standard_type, standard_code, minimum_value, maximum_value, unit, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, {
      replacements: [
        projectType, 
        standardType, 
        standardCode, 
        minimumValue !== '' ? minimumValue : null, 
        maximumValue !== '' ? maximumValue : null, 
        unit, 
        description
      ]
    });
    
    console.log('Created project standard with ID:', result);
    
    // Return the created record
    const [newRecord] = await sequelize.query(`
      SELECT * FROM project_type_standards WHERE id = ?
    `, {
      replacements: [result]
    });
    
    res.status(201).json(newRecord[0]);
  } catch (error) {
    console.error('Error creating project standard:', error);
    res.status(500).json({ message: 'Failed to create project standard', error: error.message });
  }
});

app.post('/compliance/recommendations', async (req, res) => {
  try {
    console.log('Direct POST to /compliance/recommendations:', req.body);
    const { ruleId, nonComplianceType, recommendationText, priority, calculatorType } = req.body;
    
    const [result] = await sequelize.query(`
      INSERT INTO compliance_recommendations (
        rule_id, non_compliance_type, recommendation_text, priority, calculator_type
      ) VALUES (?, ?, ?, ?, ?)
    `, {
      replacements: [
        ruleId ? parseInt(ruleId, 10) : null, 
        nonComplianceType, 
        recommendationText, 
        priority || 'medium', 
        calculatorType
      ]
    });
    
    console.log('Created recommendation with ID:', result);
    
    // Return the created record
    const [newRecord] = await sequelize.query(`
      SELECT * FROM compliance_recommendations WHERE id = ?
    `, {
      replacements: [result]
    });
    
    res.status(201).json(newRecord[0]);
  } catch (error) {
    console.error('Error creating recommendation:', error);
    res.status(500).json({ message: 'Failed to create recommendation', error: error.message });
  }
});

// API routes
app.use('/api', apiRouter); // Use the main API router for all /api routes

// Register ML training routes
app.use('/api/training', trainingRoutes);

// Register room detection routes
app.use('/api/room-detection', roomDetectionRoutes);

// Register compliance routes (both verification and standard compliance)
app.use('/api/compliance', complianceVerificationRoutes);
app.use('/api/compliance', complianceRoutes); // Add our compliance.js routes

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/reports', reportRoutes);
app.use('/api', standardsRoutes);
app.use('/api/standards-api', standardsApiRoutes);
app.use('/api/energy-audit', energyAuditRoutes);
app.use('/api/users', userRoutes);
app.use('/users', userRoutes); // Add direct route without /api prefix

// Special direct routes for compliance endpoints
app.get('/compliance/building-standards/all', async (req, res) => {
  try {
    console.log('Direct endpoint hit: /compliance/building-standards/all');
    const [standards] = await sequelize.query(`
      SELECT * FROM building_type_standards
    `);
    console.log('Sending building standards:', standards.length);
    res.json(standards || []);
  } catch (error) {
    console.error('Error in direct building-standards/all endpoint:', error);
    res.json([]);
  }
});

app.get('/compliance/project-standards/all', async (req, res) => {
  try {
    console.log('Direct endpoint hit: /compliance/project-standards/all');
    const [standards] = await sequelize.query(`
      SELECT * FROM project_type_standards
    `);
    console.log('Sending project standards:', standards.length);
    res.json(standards || []);
  } catch (error) {
    console.error('Error in direct project-standards/all endpoint:', error);
    res.json([]);
  }
});

app.get('/compliance/recommendations/all', async (req, res) => {
  try {
    console.log('Direct endpoint hit: /compliance/recommendations/all');
    const [recommendations] = await sequelize.query(`
      SELECT * FROM compliance_recommendations
    `);
    console.log('Sending recommendations:', recommendations.length);
    res.json(recommendations || []);
  } catch (error) {
    console.error('Error in direct recommendations/all endpoint:', error);
    res.json([]);
  }
});

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

// Run database setup on server startup
setupStandardsTables().catch(err => {
  console.error('Error setting up standards tables:', err);
});

module.exports = app; 