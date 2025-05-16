const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function importPecStandards() {
  let connection;
  try {
    // Connect to the database using environment variables
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'sdmi',
      password: process.env.DB_PASS || 'SMD1SQLADM1N',
      database: process.env.DB_NAME || 'energyauditdb',
      multipleStatements: true // Allow multiple statements in one query
    });
    
    console.log('Connected to database');
    
    // Read the SQL file content
    const sqlFilePath = path.join(__dirname, '..', 'pec_standards_sql.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the content by semicolons to get individual statements
    const statements = sqlContent.split(';')
      .map(statement => statement.trim())
      .filter(statement => statement && !statement.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      try {
        const statement = statements[i];
        await connection.query(statement);
        console.log(`Successfully executed statement ${i + 1}`);
      } catch (error) {
        console.error(`Error executing statement ${i + 1}:`, error.message);
      }
    }
    
    console.log('PEC standards have been successfully imported into the database');
  } catch (error) {
    console.error('Error importing PEC standards:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the import function
importPecStandards(); 