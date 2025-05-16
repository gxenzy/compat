const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

async function fixStandardsDuplicates() {
  let connection;
  try {
    // Connect to the database using environment variables
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'sdmi',
      password: process.env.DB_PASS || 'SMD1SQLADM1N',
      database: process.env.DB_NAME || 'energyauditdb',
      multipleStatements: true
    });
    
    console.log('Connected to database');
    
    // First, let's back up the standards table
    console.log('Creating backup of standards table...');
    await connection.query(`CREATE TABLE IF NOT EXISTS standards_backup LIKE standards`);
    await connection.query(`TRUNCATE TABLE standards_backup`);
    await connection.query(`INSERT INTO standards_backup SELECT * FROM standards`);
    console.log('Backup created as standards_backup');
    
    // Check for duplicates in standards table
    const [duplicates] = await connection.query(`
      SELECT code_name, version, COUNT(*) as duplicate_count 
      FROM standards 
      GROUP BY code_name, version 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.length === 0) {
      console.log('No duplicates found in standards table');
      return;
    }
    
    console.log(`Found ${duplicates.length} sets of duplicates in standards table.`);
    console.table(duplicates);
    
    // Begin a transaction
    await connection.query('START TRANSACTION');
    
    try {
      // For each set of duplicates, keep the record with the lowest ID
      for (const duplicate of duplicates) {
        const { code_name, version } = duplicate;
        
        // Get all records for this set, ordered by ID
        const [records] = await connection.query(`
          SELECT id 
          FROM standards 
          WHERE code_name = ? AND version = ? 
          ORDER BY id ASC
        `, [code_name, version]);
        
        if (records.length <= 1) continue;
        
        // Keep the first record (lowest ID) and delete the rest
        const keepId = records[0].id;
        const deleteIds = records.slice(1).map(r => r.id);
        
        if (deleteIds.length === 0) continue;
        
        // Update any foreign key relationships
        // First, identify tables with foreign keys to standards
        const [fkTables] = await connection.query(`
          SELECT 
            TABLE_NAME, 
            COLUMN_NAME 
          FROM 
            INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
          WHERE 
            REFERENCED_TABLE_NAME = 'standards' 
            AND REFERENCED_COLUMN_NAME = 'id' 
            AND TABLE_SCHEMA = DATABASE()
        `);
        
        // Update each foreign key reference
        for (const fkTable of fkTables) {
          console.log(`Updating references in ${fkTable.TABLE_NAME}...`);
          
          // Update references to point to the kept record
          await connection.query(`
            UPDATE ${fkTable.TABLE_NAME} 
            SET ${fkTable.COLUMN_NAME} = ? 
            WHERE ${fkTable.COLUMN_NAME} IN (?)
          `, [keepId, deleteIds]);
        }
        
        // Delete duplicate records
        const [deleteResult] = await connection.query(`
          DELETE FROM standards 
          WHERE id IN (?)
        `, [deleteIds]);
        
        console.log(`Deleted ${deleteResult.affectedRows} duplicate records for ${code_name} ${version}`);
      }
      
      // Commit the transaction
      await connection.query('COMMIT');
      console.log('All duplicates fixed successfully');
      
      // Add a unique constraint to prevent future duplicates
      try {
        await connection.query(`
          ALTER TABLE standards
          ADD CONSTRAINT unique_standard UNIQUE (code_name, version)
        `);
        console.log('Added unique constraint to standards table');
      } catch (constraintError) {
        console.log('Unique constraint already exists or cannot be added:', constraintError.message);
      }
      
    } catch (error) {
      // Rollback on error
      await connection.query('ROLLBACK');
      console.error('Error fixing duplicates, transaction rolled back:', error);
      throw error;
    }
    
    // Verify the fix
    const [afterFix] = await connection.query(`
      SELECT code_name, version, COUNT(*) as count 
      FROM standards 
      GROUP BY code_name, version 
      HAVING COUNT(*) > 1
    `);
    
    if (afterFix.length === 0) {
      console.log('Verification successful: No more duplicates in standards table');
    } else {
      console.log('Warning: Still found duplicates after fix. Manual inspection required.');
      console.table(afterFix);
    }
    
  } catch (error) {
    console.error('Error fixing duplicates:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Export the function instead of running it directly
module.exports = { fixStandardsDuplicates };

// Uncomment to run this script standalone
// fixStandardsDuplicates(); 