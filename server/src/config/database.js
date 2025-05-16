const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);

// Create a pool of connections
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'sdmi',
  password: process.env.DB_PASS || 'SMD1SQLADM1N',
  database: process.env.DB_NAME || 'energyauditdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true // Enable multiple statements
});

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || 'energyauditdb',
  process.env.DB_USER || 'sdmi',
  process.env.DB_PASS || 'SMD1SQLADM1N',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  }
);

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

testConnection();

// Export a function to get a connection from the pool
const getConnection = async () => {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error('Error getting connection from pool:', error);
    throw error;
  }
};

// Export a query function for simpler queries
const query = async (sql, params) => {
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
};

// Export a transaction function
const transaction = async (callback) => {
  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();
    
    const result = await callback(connection);
    
    await connection.commit();
    return result;
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Function to run a migration file
async function runMigration(filename) {
  try {
    const filePath = path.join(__dirname, '../database/migrations', filename);
    const sql = fs.readFileSync(filePath, 'utf-8');
    
    // Create a connection with multiple statements enabled for this specific operation
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'sdmi',
      password: process.env.DB_PASS || 'SMD1SQLADM1N',
      database: process.env.DB_NAME || 'energyauditdb',
      multipleStatements: true
    });
    
    await connection.query(sql);
    await connection.end();
    
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
  transaction,
  sequelize
}; 