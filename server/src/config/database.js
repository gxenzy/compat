const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
const envPath = path.resolve(__dirname, '../../.env');
console.log('Reading .env from:', envPath);
try {
  const envContents = fs.readFileSync(envPath, 'utf-8');
  console.log('.env contents:\n', envContents);
} catch (e) {
  console.error('Could not read .env file:', e);
}
dotenv.config({ path: envPath });

// Log database connection info
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASS);
console.log('DB_NAME:', process.env.DB_NAME);

// Database configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'sdmi',
  password: process.env.DB_PASS || 'SMD1SQLADM1N',
  database: process.env.DB_NAME || 'energyauditdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create the connection pool
const pool = mysql.createPool(config);

// Export a function to get a connection from the pool
const getConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database');
    return connection;
  } catch (error) {
    console.error('Error connecting to MySQL database:', error);
    throw error;
  }
};

// Helper functions for database queries
const query = async (text, params = []) => {
  try {
    const start = Date.now();
    const [rows] = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text, duration, rows: Array.isArray(rows) ? rows.length : 1 });
    }
    
    return rows;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Function to run a migration file
async function runMigration(filename) {
  try {
    const filePath = path.join(__dirname, '../database/migrations', filename);
    const sql = fs.readFileSync(filePath, 'utf-8');
    await pool.query(sql);
    console.log(`Migration ${filename} completed successfully`);
  } catch (error) {
    console.error(`Error running migration ${filename}:`, error);
    throw error;
  }
}

// Function to create and update tables
async function setupDatabase() {
  try {
    // Run migrations in order
    const migrations = [
      '001_create_users_table.sql',
      '002_create_findings_table.sql',
      'create_power_readings_table.sql',
      'create_standards_tables.sql',
      'create_reports_tables.sql'
    ];

    for (const migration of migrations) {
      await runMigration(migration);
    }

    // Create attachments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attachments (
        id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        finding_id INT UNSIGNED NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        mime_type VARCHAR(255) NOT NULL,
        size BIGINT NOT NULL,
        uploaded_by INT UNSIGNED NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (finding_id) REFERENCES findings(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )
    `);

    // Create comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        finding_id INT UNSIGNED NOT NULL,
        user_id INT UNSIGNED NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (finding_id) REFERENCES findings(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        user_id INT UNSIGNED NOT NULL,
        finding_id INT UNSIGNED NOT NULL,
        type ENUM('ASSIGNED', 'UPDATED', 'COMMENTED', 'CLOSED') NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (finding_id) REFERENCES findings(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
}

// Setup database on server startup
setupDatabase();

module.exports = {
  pool,
  getConnection,
  query,
  transaction
}; 