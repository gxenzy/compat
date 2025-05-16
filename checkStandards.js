const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

async function checkStandards() {
  let connection;
  try {
    // Connect to the database using environment variables
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'sdmi',
      password: process.env.DB_PASS || 'SMD1SQLADM1N',
      database: process.env.DB_NAME || 'energyauditdb'
    });
    
    console.log('Connected to database');
    
    // Query for lightning protection standards
    const [lightningRows] = await connection.query(
      "SELECT * FROM building_type_standards WHERE standard_type = 'lightning_protection'"
    );
    
    console.log('Lightning protection standards in database:');
    console.log(lightningRows);
    
    // Query for illumination standards
    const [illuminationRows] = await connection.query(
      "SELECT * FROM building_type_standards WHERE standard_type = 'illumination'"
    );
    
    console.log('\nIllumination standards in database:');
    console.log(illuminationRows);
    
    console.log(`\nTotal lightning protection standards: ${lightningRows.length}`);
    console.log(`Total illumination standards: ${illuminationRows.length}`);
    
    // Check for failed insertions by comparing with SQL file
    console.log('\nChecking for standards that may have failed to import...');
    
    // Add queries to count each standard type
    const queries = [
      "SELECT COUNT(*) as count FROM building_type_standards WHERE standard_type = 'lightning_protection'",
      "SELECT COUNT(*) as count FROM building_type_standards WHERE standard_type = 'illumination'",
      "SELECT COUNT(*) as count FROM building_type_standards WHERE standard_type = 'power_distribution'",
      "SELECT COUNT(*) as count FROM building_type_standards WHERE standard_type = 'electrical_safety'",
      "SELECT COUNT(*) as count FROM building_type_standards WHERE standard_type = 'conductor_ampacity'",
      "SELECT COUNT(*) as count FROM building_type_standards WHERE standard_type = 'lighting_power_density'",
      "SELECT COUNT(*) as count FROM building_type_standards WHERE standard_type = 'safety'",
      "SELECT COUNT(*) as count FROM project_type_standards",
      "SELECT COUNT(*) as count FROM compliance_recommendations"
    ];
    
    for (const query of queries) {
      const [result] = await connection.query(query);
      console.log(`${query}: ${result[0].count}`);
    }
    
  } catch (error) {
    console.error('Error checking standards:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the function
checkStandards(); 