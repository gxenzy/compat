const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

async function fixEducationalResourcesDuplicates() {
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
    
    // First, let's back up the educational_resources table
    console.log('Creating backup of educational_resources table...');
    await connection.query(`CREATE TABLE IF NOT EXISTS educational_resources_backup LIKE educational_resources`);
    await connection.query(`TRUNCATE TABLE educational_resources_backup`);
    await connection.query(`INSERT INTO educational_resources_backup SELECT * FROM educational_resources`);
    console.log('Backup created as educational_resources_backup');
    
    // Check for duplicates in educational_resources table
    const [duplicates] = await connection.query(`
      SELECT section_id, url, COUNT(*) as duplicate_count 
      FROM educational_resources 
      GROUP BY section_id, url 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.length === 0) {
      console.log('No duplicates found in educational_resources table');
      return;
    }
    
    console.log(`Found ${duplicates.length} sets of duplicates in educational_resources table.`);
    console.table(duplicates);
    
    // Begin a transaction
    await connection.query('START TRANSACTION');
    
    try {
      // For each set of duplicates, keep the record with the lowest ID
      for (const duplicate of duplicates) {
        const { section_id, url } = duplicate;
        
        // Get all records for this set, ordered by ID
        const [records] = await connection.query(`
          SELECT id 
          FROM educational_resources 
          WHERE section_id = ? AND url = ? 
          ORDER BY id ASC
        `, [section_id, url]);
        
        if (records.length <= 1) continue;
        
        // Keep the first record (lowest ID) and delete the rest
        const keepId = records[0].id;
        const deleteIds = records.slice(1).map(r => r.id);
        
        if (deleteIds.length === 0) continue;
        
        // Update any foreign key relationships
        // First, identify tables with foreign keys to educational_resources
        const [fkTables] = await connection.query(`
          SELECT 
            TABLE_NAME, 
            COLUMN_NAME 
          FROM 
            INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
          WHERE 
            REFERENCED_TABLE_NAME = 'educational_resources' 
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
          DELETE FROM educational_resources 
          WHERE id IN (?)
        `, [deleteIds]);
        
        console.log(`Deleted ${deleteResult.affectedRows} duplicate records for section_id ${section_id}`);
      }
      
      // Commit the transaction
      await connection.query('COMMIT');
      console.log('All duplicates fixed successfully');
      
      // Add a unique constraint to prevent future duplicates
      try {
        await connection.query(`
          ALTER TABLE educational_resources
          ADD CONSTRAINT unique_educational_resource UNIQUE (section_id, url(255))
        `);
        console.log('Added unique constraint to educational_resources table');
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
      SELECT section_id, url, COUNT(*) as count 
      FROM educational_resources 
      GROUP BY section_id, url 
      HAVING COUNT(*) > 1
    `);
    
    if (afterFix.length === 0) {
      console.log('Verification successful: No more duplicates in educational_resources table');
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
module.exports = { fixEducationalResourcesDuplicates };

// Uncomment to run this script standalone
// fixEducationalResourcesDuplicates(); 