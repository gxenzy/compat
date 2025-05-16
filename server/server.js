const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import duplicate prevention script
const { addUniqueConstraints } = require('./src/scripts/preventDuplicates');

// Log database configuration
console.log('Database Configuration:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME
});

const sequelize = require('./models/sequelize');

// Import routes
const authRoutes = require('./routes/auth');
const logoutRoutes = require('./routes/logout');
const energyAuditRoutes = require('./routes/energyAudit');
const userRoutes = require('./routes/user');
const findingRoutes = require('./routes/finding');
const activityLogsRoutes = require('./routes/activityLogs');

// Import new routes
const standardsRoutes = require('./src/routes/standardsRoutes');
const complianceRoutes = require('./routes/compliance');
const systemSettingsRoutes = require('./src/routes/systemSettingsRoutes');

// Models
const User = require('./models/User');
const SystemSettings = require('./src/models/SystemSettings');

// Sync models (create tables if they do not exist)
const syncModels = async () => {
  try {
    // Sync all models
    await User.sync();
    await SystemSettings.sync();
    
    console.log('Models synchronized successfully');
  } catch (error) {
    console.error('Error synchronizing models:', error);
  }
};

// Sync models (create tables if they do not exist)
sequelize.sync()
  .then(async () => {
    console.log('Database models synchronized');
    
    // Run the duplicate prevention script to add unique constraints
    console.log('Setting up duplicate prevention...');
    await addUniqueConstraints();
    console.log('Duplicate prevention setup complete');
    
    const app = express();
    const server = http.createServer(app);
    const io = socketIo(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });
    
    // IMPORTANT! Setup body parsing BEFORE defining routes!
    app.use(express.json());
    app.use(cookieParser());
    
    // Create public routes BEFORE other middleware
    app.get('/ping', (req, res) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      res.status(200).send('pong');
    });
    
    // Health endpoints with CORS headers
    app.get('/health', (req, res) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      
      // Return server status details
      res.status(200).json({ 
        status: 'ok', 
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    });
    
    // Add ping endpoint for simple connectivity tests
    app.get('/ping', (req, res) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      res.status(200).send('pong');
    });
    
    // Handle OPTIONS preflight requests for login
    app.options('/api/auth/login', cors({ origin: true, credentials: true }));
    
    // Setup remaining middleware
    app.use(helmet());

    // Enable CORS with credentials support
    app.use(cors({
      origin: function(origin, callback) {
        const allowedOrigins = [
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          undefined // Allow requests with no origin (like mobile apps)
        ];
        // Check if the request origin is allowed
        const allowed = allowedOrigins.includes(origin);
        callback(null, allowed ? origin : false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Rate limiting
    app.use(rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }));

    // Add direct POST routes for compliance API - these need to be before the authenticated routes
    const { query } = require('./src/config/database');
    
    app.post('/compliance/building-standards', async (req, res) => {
      try {
        console.log('Direct POST to /compliance/building-standards:', req.body);
        const { buildingType, standardType, standardCode, minimumValue, maximumValue, unit, description } = req.body;
        
        const result = await query(`
          INSERT INTO building_type_standards (
            buildingType, standardType, standardCode, minimumValue, maximumValue, unit, description
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          buildingType, 
          standardType, 
          standardCode, 
          minimumValue !== '' ? minimumValue : null, 
          maximumValue !== '' ? maximumValue : null, 
          unit, 
          description
        ]);
        
        console.log('Created building standard with ID:', result.insertId);
        
        // Return the created record
        const newRecord = await query(`
          SELECT * FROM building_type_standards WHERE id = ?
        `, [result.insertId]);
        
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
        
        const result = await query(`
          INSERT INTO project_type_standards (
            projectType, standardType, standardCode, minimumValue, maximumValue, unit, description
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          projectType, 
          standardType, 
          standardCode, 
          minimumValue !== '' ? minimumValue : null, 
          maximumValue !== '' ? maximumValue : null, 
          unit, 
          description
        ]);
        
        console.log('Created project standard with ID:', result.insertId);
        
        // Return the created record
        const newRecord = await query(`
          SELECT * FROM project_type_standards WHERE id = ?
        `, [result.insertId]);
        
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
        
        const result = await query(`
          INSERT INTO compliance_recommendations (
            ruleId, nonComplianceType, recommendationText, priority, calculatorType
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          ruleId ? parseInt(ruleId, 10) : null, 
          nonComplianceType, 
          recommendationText, 
          priority || 'medium', 
          calculatorType
        ]);
        
        console.log('Created recommendation with ID:', result.insertId);
        
        // Return the created record
        const newRecord = await query(`
          SELECT * FROM compliance_recommendations WHERE id = ?
        `, [result.insertId]);
        
        res.status(201).json(newRecord[0]);
      } catch (error) {
        console.error('Error creating recommendation:', error);
        res.status(500).json({ message: 'Failed to create recommendation', error: error.message });
      }
    });

    // Routes that require authentication
    app.use('/api/auth', authRoutes); 
    app.use('/api/auth', logoutRoutes);
    app.use('/api/energy-audit', energyAuditRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/findings', findingRoutes);
    app.use('/api/activity-logs', activityLogsRoutes);
    app.use('/api/standards', standardsRoutes);
    app.use('/api/compliance', complianceRoutes);
    app.use('/api/admin/settings', systemSettingsRoutes);
    
    // Support direct compliance endpoints for backward compatibility
    app.use('/compliance', complianceRoutes);
    
    // Add special direct routes for the most critical compliance endpoints
    app.get('/compliance/building-standards/all', async (req, res) => {
      try {
        console.log('Direct endpoint hit: /compliance/building-standards/all');
        const { query } = require('./src/config/database');
        const standards = await query('SELECT * FROM building_type_standards');
        res.json(standards || []);
      } catch (error) {
        console.error('Error in direct building-standards/all endpoint:', error);
        res.json([]);
      }
    });
    
    app.get('/compliance/project-standards/all', async (req, res) => {
      try {
        console.log('Direct endpoint hit: /compliance/project-standards/all');
        const { query } = require('./src/config/database');
        const standards = await query('SELECT * FROM project_type_standards');
        res.json(standards || []);
      } catch (error) {
        console.error('Error in direct project-standards/all endpoint:', error);
        res.json([]);
      }
    });
    
    app.get('/compliance/recommendations/all', async (req, res) => {
      try {
        console.log('Direct endpoint hit: /compliance/recommendations/all');
        const { query } = require('./src/config/database');
        const recommendations = await query('SELECT * FROM compliance_recommendations');
        res.json(recommendations || []);
      } catch (error) {
        console.error('Error in direct recommendations/all endpoint:', error);
        res.json([]);
      }
    });

    // Serve static files from the React app build directory
    if (process.env.NODE_ENV === 'production') {
      const path = require('path');
      const buildPath = path.join(__dirname, '../client/build');
      
      app.use(express.static(buildPath));
      
      // Handle any requests that don't match the ones above
      app.get('*', (req, res) => {
        // Don't serve the SPA for API routes
        if (req.url.startsWith('/api/')) {
          return res.status(404).json({ message: 'API endpoint not found' });
        }
        
        // For all other routes, serve the React app
        res.sendFile(path.join(buildPath, 'index.html'));
      });
      
      console.log('Serving React app from', buildPath);
    } else {
      console.log('Running in development mode, not serving static files');
      
      // In development, add a catch-all route to handle React Router
      app.get('*', (req, res, next) => {
        // Skip API routes
        if (req.url.startsWith('/api/')) {
          return next();
        }
        
        // For direct access to routes like /login, /dashboard, etc.
        // Just return a minimal HTML that defers to React's router
        res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Energy Audit Platform (Dev)</title>
              <script>
                // Redirect to the development server
                window.location.href = 'http://localhost:3000' + window.location.pathname;
              </script>
            </head>
            <body>
              <p>Redirecting to development server...</p>
            </body>
          </html>
        `);
      });
    }

    // Websocket connection handling
    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    // Export io for use in other modules
    app.set('io', io);

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Unhandled error:', err);
      res.status(500).json({ 
        message: 'Internal server error', 
        error: process.env.NODE_ENV === 'development' ? err.message : undefined 
      });
    });

    const port = process.env.PORT || 8000;
    server.listen(port, async () => {
      console.log(`Server is running on port ${port}`);
      
      // Sync models
      await syncModels();
    });
  })
  .catch(err => {
    console.error('Failed to sync database:', err);
    process.exit(1);
  });
