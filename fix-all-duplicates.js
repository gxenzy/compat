const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

// Import fix functions from individual scripts
const { fixStandardsDuplicates } = require('./fix-standards-duplicates');
const { fixStandardSectionsDuplicates } = require('./fix-standard-sections-duplicates');
const { fixStandardTablesDuplicates } = require('./fix-standard-tables-duplicates');
const { fixComplianceRequirementsDuplicates } = require('./fix-compliance-requirements-duplicates');
const { fixEducationalResourcesDuplicates } = require('./fix-educational-resources-duplicates');

async function fixAllDuplicates() {
  console.log('========================================================');
  console.log('STARTING COMPREHENSIVE DUPLICATE FIXING PROCESS');
  console.log('========================================================');
  
  try {
    // Fix standards table first (parent table)
    console.log('\n[1/5] Fixing duplicates in standards table...');
    await fixStandardsDuplicates();
    
    // Fix standard_sections table next
    console.log('\n[2/5] Fixing duplicates in standard_sections table...');
    await fixStandardSectionsDuplicates();
    
    // Fix standard_tables table next
    console.log('\n[3/5] Fixing duplicates in standard_tables table...');
    await fixStandardTablesDuplicates();
    
    // Fix compliance_requirements table next
    console.log('\n[4/5] Fixing duplicates in compliance_requirements table...');
    await fixComplianceRequirementsDuplicates();
    
    // Fix educational_resources table last
    console.log('\n[5/5] Fixing duplicates in educational_resources table...');
    await fixEducationalResourcesDuplicates();
    
    console.log('\n========================================================');
    console.log('DUPLICATE FIXING PROCESS COMPLETED SUCCESSFULLY');
    console.log('========================================================');
  } catch (error) {
    console.error('\nERROR: The duplicate fixing process failed:', error);
    console.log('\n========================================================');
    console.log('DUPLICATE FIXING PROCESS FAILED');
    console.log('========================================================');
  }
}

// Run the fix process
fixAllDuplicates(); 