/**
 * Emergency fix script for user table column issues
 * This script fixes the database-model mismatch by adding missing columns to the users table
 */
const sequelize = require('./models/sequelize');
require('dotenv').config();

console.log('Starting user table fix script...');

// First check which columns exist
sequelize.query(`
  SELECT COLUMN_NAME 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'users' 
  AND TABLE_SCHEMA = '${process.env.DB_NAME}'
`)
.then(([existingColumns]) => {
  console.log('Existing columns:', existingColumns.map(col => col.COLUMN_NAME));
  
  // Get column names as array
  const columnNames = existingColumns.map(col => col.COLUMN_NAME.toLowerCase());
  
  // Build ALTER TABLE statement based on missing columns
  let alterTableQuery = 'ALTER TABLE users ';
  let changes = [];
  
  if (!columnNames.includes('firstname')) {
    changes.push('ADD COLUMN firstName VARCHAR(255) NULL');
  }
  
  if (!columnNames.includes('lastname')) {
    changes.push('ADD COLUMN lastName VARCHAR(255) NULL');
  }
  
  if (!columnNames.includes('settings')) {
    changes.push('ADD COLUMN settings JSON NULL');
  }
  
  if (!columnNames.includes('profileimage')) {
    changes.push('ADD COLUMN profileImage VARCHAR(255) NULL');
  }
  
  if (!columnNames.includes('lastlogin')) {
    changes.push('ADD COLUMN lastLogin DATETIME NULL');
  }
  
  if (!columnNames.includes('notifications')) {
    changes.push('ADD COLUMN notifications JSON NULL');
  }
  
  if (!columnNames.includes('active')) {
    changes.push('ADD COLUMN active BOOLEAN DEFAULT TRUE');
  }
  
  // If no changes needed, exit
  if (changes.length === 0) {
    console.log('No columns need to be added.');
    return Promise.resolve();
  }
  
  // Execute the table modification
  alterTableQuery += changes.join(', ');
  console.log('Running query:', alterTableQuery);
  
  return sequelize.query(alterTableQuery);
})
.then(() => {
  console.log('Users table fix completed successfully!');
  
  // Update any snake_case values to camelCase
  return sequelize.query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'users' 
    AND TABLE_SCHEMA = '${process.env.DB_NAME}'
    AND COLUMN_NAME IN ('first_name', 'last_name')
  `);
})
.then(([results]) => {
  if (results && results.length > 0) {
    console.log('Found snake_case columns, updating data to camelCase columns...');
    
    // Copy values from snake_case to camelCase
    return sequelize.query(`
      UPDATE users 
      SET firstName = first_name, 
          lastName = last_name 
      WHERE firstName IS NULL;
    `);
  }
  return Promise.resolve();
})
.then(() => {
  console.log('All fixes applied!');
  process.exit(0);
})
.catch(err => {
  console.error('ERROR fixing users table:', err);
  process.exit(1);
}); 