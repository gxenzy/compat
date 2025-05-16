const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

async function fixLightningStandards() {
  let connection;
  try {
    // Connect to the database using environment variables
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'sdmi',
      password: process.env.DB_PASS || 'SMD1SQLADM1N',
      database: process.env.DB_NAME || 'energyauditdb'
    });
    
    console.log('Connected to database');
    console.log('Fixing lightning protection standards...');
    
    // Prepare the lightning protection standards insertion statements
    const lightningStandards = [
      // Building Class 1 - under 23m
      {
        building_type: 'building_class_1',
        standard_type: 'lightning_protection',
        standard_code: 'PEC-2017-2.90.3.1',
        minimum_value: null,
        maximum_value: 23,
        unit: 'm',
        description: 'Building under 23m in height - requires Class I protection materials'
      },
      // Building Class 2 - over 23m
      {
        building_type: 'building_class_2',
        standard_type: 'lightning_protection',
        standard_code: 'PEC-2017-2.90.3.1',
        minimum_value: 23,
        maximum_value: null,
        unit: 'm',
        description: 'Building over 23m in height - requires Class II protection materials'
      },
      // Air terminal height for 6000mm intervals
      {
        building_type: 'all',
        standard_type: 'lightning_protection',
        standard_code: 'PEC-2017-2.90.3.10A',
        minimum_value: 254,
        maximum_value: null,
        unit: 'mm',
        description: 'Air terminals minimum height above protected object for 6000mm max intervals'
      },
      // Air terminal height for 7600mm intervals
      {
        building_type: 'all',
        standard_type: 'lightning_protection',
        standard_code: 'PEC-2017-2.90.3.10A-2',
        minimum_value: 600,
        maximum_value: null,
        unit: 'mm',
        description: 'Air terminals minimum height above protected object for 7600mm max intervals'
      },
      // Maximum interval for air terminals
      {
        building_type: 'all',
        standard_type: 'lightning_protection',
        standard_code: 'PEC-2017-2.90.3.11',
        minimum_value: null,
        maximum_value: 6000,
        unit: 'mm',
        description: 'Maximum interval for air terminals on ridges of roofs and perimeter of flat/gently sloping roofs'
      },
      // Maximum width/span for flat/gently sloping roofs
      {
        building_type: 'all',
        standard_type: 'lightning_protection',
        standard_code: 'PEC-2017-2.90.3.11A',
        minimum_value: null,
        maximum_value: 15,
        unit: 'm',
        description: 'Maximum width/span for flat/gently sloping roofs requiring additional air terminals'
      }
    ];
    
    // Insert each lightning standard
    let successCount = 0;
    for (let i = 0; i < lightningStandards.length; i++) {
      try {
        const standard = lightningStandards[i];
        const query = `
          INSERT INTO building_type_standards 
          (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE description = VALUES(description)
        `;
        
        await connection.query(query, [
          standard.building_type,
          standard.standard_type,
          standard.standard_code,
          standard.minimum_value,
          standard.maximum_value,
          standard.unit,
          standard.description
        ]);
        
        console.log(`Successfully inserted lightning standard ${i + 1}: ${standard.standard_code}`);
        successCount++;
      } catch (error) {
        console.error(`Error inserting lightning standard ${i + 1}: ${error.message}`);
      }
    }
    
    // Now insert the lighting power density standards
    console.log('\nInserting lighting power density standards...');
    
    const lightingPowerDensityStandards = [
      { building_type: 'office', standard_code: 'PEC-2017-LPD.1', maximum_value: 10.5, description: 'Office maximum lighting power density' },
      { building_type: 'classroom', standard_code: 'PEC-2017-LPD.2', maximum_value: 10.5, description: 'Classroom maximum lighting power density' },
      { building_type: 'hospital', standard_code: 'PEC-2017-LPD.3', maximum_value: 11.2, description: 'Hospital maximum lighting power density' },
      { building_type: 'retail', standard_code: 'PEC-2017-LPD.4', maximum_value: 14.5, description: 'Retail maximum lighting power density' },
      { building_type: 'industrial', standard_code: 'PEC-2017-LPD.5', maximum_value: 12.8, description: 'Industrial maximum lighting power density' },
      { building_type: 'residential', standard_code: 'PEC-2017-LPD.6', maximum_value: 8.0, description: 'Residential maximum lighting power density' },
      { building_type: 'warehouse', standard_code: 'PEC-2017-LPD.7', maximum_value: 8.0, description: 'Warehouse maximum lighting power density' },
      { building_type: 'restaurant', standard_code: 'PEC-2017-LPD.8', maximum_value: 12.0, description: 'Restaurant maximum lighting power density' },
      { building_type: 'hotel', standard_code: 'PEC-2017-LPD.9', maximum_value: 10.0, description: 'Hotel maximum lighting power density' },
      { building_type: 'laboratory', standard_code: 'PEC-2017-LPD.10', maximum_value: 14.0, description: 'Laboratory maximum lighting power density' }
    ];
    
    for (let i = 0; i < lightingPowerDensityStandards.length; i++) {
      try {
        const standard = lightingPowerDensityStandards[i];
        const query = `
          INSERT INTO building_type_standards 
          (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description) 
          VALUES (?, ?, ?, NULL, ?, 'W/m²', ?)
          ON DUPLICATE KEY UPDATE description = VALUES(description)
        `;
        
        await connection.query(query, [
          standard.building_type,
          'lighting_power_density',
          standard.standard_code,
          standard.maximum_value,
          standard.description
        ]);
        
        console.log(`Successfully inserted lighting power density standard ${i + 1}: ${standard.standard_code}`);
        successCount++;
      } catch (error) {
        console.error(`Error inserting lighting power density standard ${i + 1}: ${error.message}`);
      }
    }
    
    // Finally, insert the safety standards
    console.log('\nInserting safety standards...');
    
    const safetyStandards = [
      { 
        building_type: 'industrial', 
        standard_type: 'safety', 
        standard_code: 'PEC-2017-1100.1', 
        description: 'Industrial safety standard - General requirements' 
      }
    ];
    
    for (let i = 0; i < safetyStandards.length; i++) {
      try {
        const standard = safetyStandards[i];
        const query = `
          INSERT INTO building_type_standards 
          (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description) 
          VALUES (?, ?, ?, NULL, NULL, NULL, ?)
          ON DUPLICATE KEY UPDATE description = VALUES(description)
        `;
        
        await connection.query(query, [
          standard.building_type,
          standard.standard_type,
          standard.standard_code,
          standard.description
        ]);
        
        console.log(`Successfully inserted safety standard ${i + 1}: ${standard.standard_code}`);
        successCount++;
      } catch (error) {
        console.error(`Error inserting safety standard ${i + 1}: ${error.message}`);
      }
    }
    
    console.log(`\nFixed standards import completed! ${successCount} standards inserted successfully.`);
  } catch (error) {
    console.error('Error fixing standards:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the function
fixLightningStandards(); 