const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

async function checkDuplicates() {
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
    
    // List of tables to check for duplicates
    const tables = [
      { 
        name: 'standards', 
        columns: ['code_name', 'version'] 
      },
      { 
        name: 'standard_sections', 
        columns: ['standard_id', 'section_number'] 
      },
      { 
        name: 'standard_tables', 
        columns: ['section_id', 'table_number'] 
      },
      { 
        name: 'standard_figures', 
        columns: ['section_id', 'figure_number'] 
      },
      { 
        name: 'standard_notes', 
        columns: ['user_id', 'section_id', 'note_text'] 
      },
      { 
        name: 'standard_tags', 
        columns: ['name'] 
      },
      { 
        name: 'compliance_requirements', 
        columns: ['section_id', 'requirement_type', 'description'] 
      },
      { 
        name: 'educational_resources', 
        columns: ['section_id', 'resource_type', 'title', 'url'] 
      },
      { 
        name: 'building_type_standards', 
        columns: ['building_type', 'standard_type', 'standard_code'] 
      },
      { 
        name: 'project_type_standards', 
        columns: ['project_type', 'standard_type', 'standard_code'] 
      },
      { 
        name: 'compliance_recommendations', 
        columns: ['non_compliance_type', 'recommendation_text'] 
      }
    ];
    
    // Check each table for duplicates
    for (const table of tables) {
      try {
        // Check if table exists first
        const [tableExists] = await connection.query(`
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = DATABASE() 
          AND table_name = ?
        `, [table.name]);
        
        if (tableExists.length === 0) {
          console.log(`Table ${table.name} does not exist, skipping...`);
          continue;
        }
        
        console.log(`\n===== Checking for duplicates in ${table.name} =====`);
        
        // Get total count of records
        const [totalCount] = await connection.query(`SELECT COUNT(*) as count FROM ${table.name}`);
        console.log(`Total records: ${totalCount[0].count}`);
        
        // Find duplicates based on the specified columns
        const columnsStr = table.columns.join(', ');
        const query = `
          SELECT ${columnsStr}, COUNT(*) as duplicate_count 
          FROM ${table.name} 
          GROUP BY ${columnsStr} 
          HAVING COUNT(*) > 1
        `;
        
        const [duplicates] = await connection.query(query);
        
        if (duplicates.length > 0) {
          console.log(`Found ${duplicates.length} sets of duplicates!`);
          console.table(duplicates);
          
          // Show some example duplicates with full data
          for (let i = 0; i < Math.min(3, duplicates.length); i++) {
            const duplicate = duplicates[i];
            const whereConditions = table.columns.map(col => {
              if (duplicate[col] === null) {
                return `${col} IS NULL`;
              } else if (typeof duplicate[col] === 'string') {
                return `${col} = '${duplicate[col].replace(/'/g, "''")}'`;
              } else {
                return `${col} = ${duplicate[col]}`;
              }
            }).join(' AND ');
            
            const [examples] = await connection.query(`
              SELECT * FROM ${table.name}
              WHERE ${whereConditions}
              LIMIT 5
            `);
            
            console.log(`\nExample duplicate set ${i+1}:`);
            console.table(examples);
          }
        } else {
          console.log(`No duplicates found in ${table.name}`);
        }
        
      } catch (error) {
        console.error(`Error checking ${table.name}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the check
checkDuplicates(); 