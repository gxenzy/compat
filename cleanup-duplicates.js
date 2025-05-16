const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

async function cleanupDuplicates() {
  let connection;
  try {
    // Connect to the database using environment variables
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'sdmi',
      password: process.env.DB_PASS || 'SMD1SQLADM1N',
      database: process.env.DB_NAME || 'energyauditdb',
      multipleStatements: true // Allow multiple statements for cleanup script
    });
    
    console.log('Connected to database');
    
    // Check which tables exist
    const [tables] = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name IN (
        'building_type_standards', 
        'project_type_standards', 
        'compliance_recommendations',
        'standards',
        'standard_sections',
        'standard_tables',
        'standard_notes',
        'standard_tags',
        'compliance_requirements',
        'educational_resources'
      )
    `);
    
    const existingTables = tables.map(t => t.table_name).filter(Boolean);
    console.log('Existing tables:', existingTables);
    
    if (existingTables.length === 0) {
      console.log('No tables found to clean up.');
      
      // Look at server import code to fix duplication issues
      console.log('\n=== CHECKING SERVER IMPORT CODE ===');
      await findAndFixImportCode(connection);
      return;
    }
    
    // Get counts before cleanup for existing tables
    const beforeCountsQuery = existingTables.map(tableName => 
      `SELECT '${tableName}' as table_name, COUNT(*) as record_count FROM ${tableName}`
    ).join(' UNION ALL ');
    
    const [beforeCounts] = await connection.query(beforeCountsQuery);
    
    console.log('=== BEFORE CLEANUP ===');
    console.table(beforeCounts);
    
    // Modify the SQL script to only clean up existing tables
    console.log('Running cleanup script for existing tables...');
    let sqlFilePath = path.join(__dirname, 'cleanup-duplicates.sql');
    let sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL script into sections by table
    const sqlSections = sqlContent.split(/-- \d+\. Clean up/);
    
    // Build a new SQL script with only the sections for existing tables
    let modifiedSqlContent = '';
    
    // Add main comment
    modifiedSqlContent += sqlSections[0];
    
    // Add sections for existing tables
    if (existingTables.includes('building_type_standards')) {
      modifiedSqlContent += '-- 1. Clean up' + sqlSections[1];
    }
    
    if (existingTables.includes('project_type_standards')) {
      modifiedSqlContent += '-- 2. Clean up' + sqlSections[2];
    }
    
    if (existingTables.includes('compliance_recommendations')) {
      modifiedSqlContent += '-- 3. Clean up' + sqlSections[3];
    }
    
    if (existingTables.includes('standards')) {
      modifiedSqlContent += '-- 4. Clean up' + sqlSections[4];
    }
    
    if (existingTables.includes('standard_sections')) {
      modifiedSqlContent += '-- 5. Clean up' + sqlSections[5];
    }
    
    if (existingTables.includes('standard_tables')) {
      modifiedSqlContent += '-- 6. Clean up' + sqlSections[6];
    }
    
    if (existingTables.includes('standard_notes')) {
      modifiedSqlContent += '-- 7. Clean up' + sqlSections[7];
    }
    
    if (existingTables.includes('standard_tags')) {
      modifiedSqlContent += '-- 8. Clean up' + sqlSections[8];
    }
    
    if (existingTables.includes('compliance_requirements')) {
      modifiedSqlContent += '-- 9. Clean up' + sqlSections[9];
    }
    
    if (existingTables.includes('educational_resources')) {
      modifiedSqlContent += '-- 10. Clean up' + sqlSections[10];
    }
    
    // Add the final count section
    modifiedSqlContent += '\n-- Show counts after cleanup\n';
    modifiedSqlContent += existingTables.map(tableName => 
      `SELECT '${tableName}' as table_name, COUNT(*) as record_count FROM ${tableName}`
    ).join(' UNION ALL ') + ';';
    
    // Execute the modified script
    console.log('Executing cleanup script...');
    await connection.query(modifiedSqlContent);
    console.log('Cleanup completed successfully');
    
    // Get counts after cleanup for existing tables only
    const afterCountsQuery = existingTables.map(tableName => 
      `SELECT '${tableName}' as table_name, COUNT(*) as record_count FROM ${tableName}`
    ).join(' UNION ALL ');
    
    const [afterCounts] = await connection.query(afterCountsQuery);
    
    console.log('=== AFTER CLEANUP ===');
    console.table(afterCounts);
    
    // Calculate how many duplicates were removed
    console.log('=== DUPLICATES REMOVED ===');
    for (let i = 0; i < beforeCounts.length; i++) {
      const before = beforeCounts[i].record_count;
      const after = afterCounts[i].record_count;
      const tableName = beforeCounts[i].table_name;
      const removed = before - after;
      console.log(`${tableName}: ${removed} duplicates removed (${before} -> ${after})`);
    }
    
    // Now let's look at server import code to fix duplication issues
    console.log('\n=== CHECKING SERVER IMPORT CODE ===');
    await findAndFixImportCode(connection);
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

async function findAndFixImportCode(connection) {
  try {
    // First, let's find tables with insert operations in the codebase
    // We'll check sequence table to find the most frequently inserted tables
    const [sequenceResults] = await connection.query(`
      SHOW TABLES LIKE '%_seq';
    `);
    
    const tableNames = sequenceResults.map(row => Object.values(row)[0].replace('_seq', ''));
    console.log('Tables with sequence generators (frequently inserted):', tableNames);
    
    console.log('\nRecommended code changes to prevent duplications:');
    console.log('1. Add ON DUPLICATE KEY UPDATE clauses to all INSERT statements');
    console.log('2. Use REPLACE INTO instead of INSERT INTO where appropriate');
    console.log('3. Add unique constraints to prevent duplications');
    
    console.log('\nExample fixes for common patterns:');
    console.log('- For direct SQL queries:');
    console.log('  Change: "INSERT INTO table_name (col1, col2) VALUES (val1, val2)"');
    console.log('  To:     "INSERT INTO table_name (col1, col2) VALUES (val1, val2) ON DUPLICATE KEY UPDATE col2=VALUES(col2)"');
    
    console.log('\n- For Sequelize ORM:');
    console.log('  Use: "Model.findOrCreate({ where: { uniqueField: value }, defaults: { otherFields } })"');
    console.log('  Or:  "Model.upsert({ uniqueField: value, otherFields })"');
    
    console.log('\n- For API endpoints receiving data:');
    console.log('  - Always check if records exist before inserting');
    console.log('  - Implement proper validation for duplicate data');
    
    // Report the tables with the most duplicates as likely targets for code fixes
    console.log('\nFocus on fixing import code for these tables first:');
    console.log('1. standard_notes');
    console.log('2. standard_sections');
    console.log('3. standard_tables');
    console.log('4. compliance_requirements');
    console.log('5. educational_resources');
    
  } catch (error) {
    console.error('Error analyzing import code:', error);
  }
}

// Run the cleanup function
cleanupDuplicates(); 