const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

async function fixStandardSectionsDuplicates() {
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
    
    // First, let's back up the standard_sections table
    console.log('Creating backup of standard_sections table...');
    await connection.query(`CREATE TABLE IF NOT EXISTS standard_sections_backup LIKE standard_sections`);
    await connection.query(`TRUNCATE TABLE standard_sections_backup`);
    await connection.query(`INSERT INTO standard_sections_backup SELECT * FROM standard_sections`);
    console.log('Backup created as standard_sections_backup');
    
    // Check for duplicates in standard_sections table
    const [duplicates] = await connection.query(`
      SELECT standard_id, section_number, COUNT(*) as duplicate_count 
      FROM standard_sections 
      GROUP BY standard_id, section_number 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.length === 0) {
      console.log('No duplicates found in standard_sections table');
      return;
    }
    
    console.log(`Found ${duplicates.length} sets of duplicates in standard_sections table.`);
    console.table(duplicates);
    
    // Begin a transaction
    await connection.query('START TRANSACTION');
    
    try {
      // For each set of duplicates, keep the record with the lowest ID
      for (const duplicate of duplicates) {
        const { standard_id, section_number } = duplicate;
        
        // Get all records for this set, ordered by ID
        const [records] = await connection.query(`
          SELECT id 
          FROM standard_sections 
          WHERE standard_id = ? AND section_number = ? 
          ORDER BY id ASC
        `, [standard_id, section_number]);
        
        if (records.length <= 1) continue;
        
        // Keep the first record (lowest ID) and delete the rest
        const keepId = records[0].id;
        const deleteIds = records.slice(1).map(r => r.id);
        
        if (deleteIds.length === 0) continue;
        
        // Update any foreign key relationships
        // First, identify tables with foreign keys to standard_sections
        const [fkTables] = await connection.query(`
          SELECT 
            TABLE_NAME, 
            COLUMN_NAME 
          FROM 
            INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
          WHERE 
            REFERENCED_TABLE_NAME = 'standard_sections' 
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
          DELETE FROM standard_sections 
          WHERE id IN (?)
        `, [deleteIds]);
        
        console.log(`Deleted ${deleteResult.affectedRows} duplicate records for standard_id ${standard_id}, section ${section_number}`);
      }
      
      // Commit the transaction
      await connection.query('COMMIT');
      console.log('All duplicates fixed successfully');
      
      // Add a unique constraint to prevent future duplicates
      try {
        await connection.query(`
          ALTER TABLE standard_sections
          ADD CONSTRAINT unique_standard_section UNIQUE (standard_id, section_number)
        `);
        console.log('Added unique constraint to standard_sections table');
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
      SELECT standard_id, section_number, COUNT(*) as count 
      FROM standard_sections 
      GROUP BY standard_id, section_number 
      HAVING COUNT(*) > 1
    `);
    
    if (afterFix.length === 0) {
      console.log('Verification successful: No more duplicates in standard_sections table');
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
module.exports = { fixStandardSectionsDuplicates };

// Uncomment to run this script standalone
// fixStandardSectionsDuplicates(); 