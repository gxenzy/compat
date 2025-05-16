const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

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
      multipleStatements: false // Process one statement at a time
    });
    
    console.log('Connected to database');
    console.log('Importing updated PEC standards...');
    
    // Read the SQL file content
    const sqlFilePath = path.join(__dirname, 'pec_standards_sql.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the content by semicolons to get individual statements
    const statements = sqlContent.split(';')
      .map(statement => statement.trim())
      .filter(statement => statement && !statement.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    let successCount = 0;
    let failedStatements = [];
    
    // First attempt - try all statements
    for (let i = 0; i < statements.length; i++) {
      try {
        const statement = statements[i];
        if (statement) {
          await connection.query(statement);
          console.log(`Successfully executed statement ${i + 1}`);
          successCount++;
        }
      } catch (error) {
        console.error(`Error executing statement ${i + 1}: ${error.message}`);
        const failedStmt = {
          index: i + 1,
          statement: statements[i],
          error: error.message
        };
        failedStatements.push(failedStmt);
      }
    }
    
    console.log(`\nFirst attempt completed: ${successCount} of ${statements.length} statements executed successfully.`);
    console.log(`Failed statements: ${failedStatements.length}`);
    
    // Second attempt - fix common issues and retry failed statements
    if (failedStatements.length > 0) {
      console.log('\nAttempting to fix and retry failed statements...');
      
      let fixedCount = 0;
      for (const failedStmt of failedStatements) {
        let fixedStatement = failedStmt.statement;
        
        // Fix 1: Add NULL values for missing columns in VALUES clauses
        if (failedStmt.error.includes('Column count doesn\'t match')) {
          console.log(`Trying to fix column count issue in statement ${failedStmt.index}`);
          
          // Try to detect if it's a lighting_power_density statement
          if (fixedStatement.includes('lighting_power_density')) {
            // Fix the VALUES part to include all required columns
            fixedStatement = fixedStatement.replace(
              /\(([^)]+), ([^)]+), ([^)]+)\)/g, 
              '($1, $2, $3, NULL, NULL)'
            );
          }
        }
        
        // Fix 2: Add unique constraint for duplicate key issues
        if (failedStmt.error.includes('Duplicate entry')) {
          console.log(`Adding ON DUPLICATE KEY UPDATE clause to statement ${failedStmt.index}`);
          
          if (fixedStatement.includes('INSERT INTO building_type_standards')) {
            fixedStatement += ' ON DUPLICATE KEY UPDATE description = VALUES(description)';
          } else if (fixedStatement.includes('INSERT INTO project_type_standards')) {
            fixedStatement += ' ON DUPLICATE KEY UPDATE description = VALUES(description)';
          } else if (fixedStatement.includes('INSERT INTO compliance_recommendations')) {
            fixedStatement += ' ON DUPLICATE KEY UPDATE recommendation_text = VALUES(recommendation_text)';
          }
        }
        
        // Try to execute the fixed statement
        try {
          await connection.query(fixedStatement);
          console.log(`Successfully executed fixed statement ${failedStmt.index}`);
          fixedCount++;
        } catch (error) {
          console.error(`Still failed after fix for statement ${failedStmt.index}: ${error.message}`);
          console.error(`Statement: ${fixedStatement.substring(0, 150)}...`);
        }
      }
      
      console.log(`\nFixed and executed ${fixedCount} of ${failedStatements.length} previously failed statements.`);
    }
    
    console.log(`\nPEC standards import completed! ${successCount + fixedCount} statements executed successfully.`);
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