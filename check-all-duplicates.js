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
    });
    
    console.log('Connected to database');
    
    // Check duplicates in standards table
    const [standardsDuplicates] = await connection.query(`
      SELECT code_name, version, COUNT(*) as duplicate_count 
      FROM standards 
      GROUP BY code_name, version 
      HAVING COUNT(*) > 1
    `);
    
    // Check duplicates in standard_sections table
    const [sectionsDuplicates] = await connection.query(`
      SELECT standard_id, section_number, COUNT(*) as duplicate_count 
      FROM standard_sections 
      GROUP BY standard_id, section_number 
      HAVING COUNT(*) > 1
    `);
    
    // Check duplicates in standard_tables table
    const [tablesDuplicates] = await connection.query(`
      SELECT section_id, table_number, COUNT(*) as duplicate_count 
      FROM standard_tables 
      GROUP BY section_id, table_number 
      HAVING COUNT(*) > 1
    `);
    
    // Check duplicates in compliance_requirements table
    const [complianceDuplicates] = await connection.query(`
      SELECT section_id, description, COUNT(*) as duplicate_count 
      FROM compliance_requirements 
      GROUP BY section_id, description 
      HAVING COUNT(*) > 1
    `);
    
    // Check duplicates in educational_resources table
    const [resourcesDuplicates] = await connection.query(`
      SELECT section_id, url, COUNT(*) as duplicate_count 
      FROM educational_resources 
      GROUP BY section_id, url 
      HAVING COUNT(*) > 1
    `);
    
    // Get table record counts
    const [standardsCount] = await connection.query(`SELECT COUNT(*) as count FROM standards`);
    const [sectionsCount] = await connection.query(`SELECT COUNT(*) as count FROM standard_sections`);
    const [tablesCount] = await connection.query(`SELECT COUNT(*) as count FROM standard_tables`);
    const [complianceCount] = await connection.query(`SELECT COUNT(*) as count FROM compliance_requirements`);
    const [resourcesCount] = await connection.query(`SELECT COUNT(*) as count FROM educational_resources`);
    
    // Display results
    console.log('\n========================================================');
    console.log('DATABASE DUPLICATE CHECK REPORT');
    console.log('========================================================');
    
    console.log('\n1. Standards Table');
    console.log(`   - Total Records: ${standardsCount[0].count}`);
    console.log(`   - Duplicate Sets: ${standardsDuplicates.length}`);
    if (standardsDuplicates.length > 0) {
      console.log('   - Duplicate Details:');
      console.table(standardsDuplicates);
    }
    
    console.log('\n2. Standard Sections Table');
    console.log(`   - Total Records: ${sectionsCount[0].count}`);
    console.log(`   - Duplicate Sets: ${sectionsDuplicates.length}`);
    if (sectionsDuplicates.length > 0) {
      console.log('   - Duplicate Details:');
      console.table(sectionsDuplicates);
    }
    
    console.log('\n3. Standard Tables Table');
    console.log(`   - Total Records: ${tablesCount[0].count}`);
    console.log(`   - Duplicate Sets: ${tablesDuplicates.length}`);
    if (tablesDuplicates.length > 0) {
      console.log('   - Duplicate Details:');
      console.table(tablesDuplicates);
    }
    
    console.log('\n4. Compliance Requirements Table');
    console.log(`   - Total Records: ${complianceCount[0].count}`);
    console.log(`   - Duplicate Sets: ${complianceDuplicates.length}`);
    if (complianceDuplicates.length > 0) {
      console.log('   - Duplicate Details:');
      console.table(complianceDuplicates);
    }
    
    console.log('\n5. Educational Resources Table');
    console.log(`   - Total Records: ${resourcesCount[0].count}`);
    console.log(`   - Duplicate Sets: ${resourcesDuplicates.length}`);
    if (resourcesDuplicates.length > 0) {
      console.log('   - Duplicate Details:');
      console.table(resourcesDuplicates);
    }
    
    console.log('\n========================================================');
    console.log('SUMMARY');
    console.log('========================================================');
    
    const totalDuplicateSets = standardsDuplicates.length + sectionsDuplicates.length + 
                              tablesDuplicates.length + complianceDuplicates.length + 
                              resourcesDuplicates.length;
    
    if (totalDuplicateSets === 0) {
      console.log('No duplicates found in any table. Database integrity is good!');
    } else {
      console.log(`Found ${totalDuplicateSets} sets of duplicates across all tables.`);
      console.log('Run fix-all-duplicates.js to fix these issues.');
    }
    
  } catch (error) {
    console.error('Error checking duplicates:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the check
checkDuplicates(); 