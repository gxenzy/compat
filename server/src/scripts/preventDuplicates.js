/**
 * preventDuplicates.js - Script to add unique constraints to database tables to prevent duplicates
 * This script should be run during server startup
 */
const { query } = require('../config/database');

async function addUniqueConstraints() {
  let connection;
  try {
    console.log('Running duplicate prevention setup...');
    
    // List of tables and their unique constraint definitions
    const constraints = [
      {
        table: 'standards',
        name: 'unique_standard',
        columns: '(code_name, version)'
      },
      {
        table: 'standard_sections',
        name: 'unique_standard_section',
        columns: '(standard_id, section_number)'
      },
      {
        table: 'standard_tables',
        name: 'unique_standard_table',
        columns: '(section_id, table_number)'
      },
      {
        table: 'standard_figures',
        name: 'unique_standard_figure',
        columns: '(section_id, figure_number)'
      },
      {
        table: 'compliance_requirements',
        name: 'unique_compliance_requirement',
        columns: '(section_id, description(255))'
      },
      {
        table: 'educational_resources',
        name: 'unique_educational_resource',
        columns: '(section_id, url(255))'
      },
      {
        table: 'standard_notes',
        name: 'unique_standard_note',
        columns: '(user_id, section_id, note_text(255))'
      }
    ];
    
    // For each table, check if unique constraint exists and add it if not
    for (const constraint of constraints) {
      try {
        // Check if constraint already exists
        const constraintExists = await query(`
          SELECT COUNT(*) as count
          FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
          WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND CONSTRAINT_NAME = ?
        `, [constraint.table, constraint.name]);
        
        if (constraintExists[0].count === 0) {
          // Constraint doesn't exist, add it
          console.log(`Adding unique constraint ${constraint.name} to ${constraint.table}...`);
          
          await query(`
            ALTER TABLE ${constraint.table}
            ADD CONSTRAINT ${constraint.name} UNIQUE ${constraint.columns}
          `);
          
          console.log(`Unique constraint ${constraint.name} added to ${constraint.table}.`);
        } else {
          console.log(`Unique constraint ${constraint.name} already exists on ${constraint.table}.`);
        }
      } catch (error) {
        console.error(`Error adding constraint to ${constraint.table}:`, error.message);
      }
    }
    
    console.log('Duplicate prevention setup completed.');

  } catch (error) {
    console.error('Error in duplicate prevention setup:', error);
  }
}

module.exports = { addUniqueConstraints };

// Allow running directly
if (require.main === module) {
  addUniqueConstraints()
    .then(() => {
      console.log('Duplicate prevention completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error running duplicate prevention:', error);
      process.exit(1);
    });
} 