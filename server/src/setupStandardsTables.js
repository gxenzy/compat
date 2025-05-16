/**
 * Setup script to ensure all required standards tables exist with proper schema
 */

const { query } = require('./config/database');

async function setupStandardsTables() {
  try {
    console.log('Setting up standards database tables...');
    
    // Create building_type_standards table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS building_type_standards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        building_type VARCHAR(100) NOT NULL,
        standard_type VARCHAR(100) NOT NULL,
        standard_code VARCHAR(100) NOT NULL,
        minimum_value FLOAT NULL,
        maximum_value FLOAT NULL,
        unit VARCHAR(50) NULL,
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Building type standards table created/verified');

    // Create project_type_standards table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS project_type_standards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_type VARCHAR(100) NOT NULL,
        standard_type VARCHAR(100) NOT NULL,
        standard_code VARCHAR(100) NOT NULL,
        minimum_value FLOAT NULL,
        maximum_value FLOAT NULL,
        unit VARCHAR(50) NULL,
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Project type standards table created/verified');

    // Create compliance_recommendations table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS compliance_recommendations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rule_id INT NULL,
        non_compliance_type VARCHAR(100) NOT NULL,
        recommendation_text TEXT NOT NULL,
        priority VARCHAR(50) DEFAULT 'medium',
        calculator_type VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Compliance recommendations table created/verified');

    // Check if we already have data in the tables
    const [buildingCount] = await query('SELECT COUNT(*) as count FROM building_type_standards');
    const [projectCount] = await query('SELECT COUNT(*) as count FROM project_type_standards');
    const [recommendationsCount] = await query('SELECT COUNT(*) as count FROM compliance_recommendations');

    console.log(`Existing data: ${buildingCount.count} building standards, ${projectCount.count} project standards, ${recommendationsCount.count} recommendations`);

    // If no building standards data, insert sample data
    if (buildingCount.count === 0) {
      await insertBuildingStandardsSamples();
    }

    // If no project standards data, insert sample data
    if (projectCount.count === 0) {
      await insertProjectStandardsSamples();
    }

    // If no recommendations data, insert sample data
    if (recommendationsCount.count === 0) {
      await insertRecommendationsSamples();
    }

    console.log('Standards tables setup complete!');
  } catch (error) {
    console.error('Error setting up standards tables:', error);
  }
}

async function insertBuildingStandardsSamples() {
  try {
    console.log('Inserting sample building standards...');
    
    const samples = [
      {
        building_type: 'office',
        standard_type: 'illumination',
        standard_code: 'PEC-1075-OFFICE',
        minimum_value: 500,
        maximum_value: null,
        unit: 'lux',
        description: 'Illumination level for offices'
      },
      {
        building_type: 'classroom',
        standard_type: 'illumination',
        standard_code: 'PEC-1075-CLASS',
        minimum_value: 500,
        maximum_value: null,
        unit: 'lux',
        description: 'Illumination level for classrooms'
      },
      {
        building_type: 'office',
        standard_type: 'power_density',
        standard_code: 'PGBC-LPD-OFF',
        minimum_value: null,
        maximum_value: 10.5,
        unit: 'W/m²',
        description: 'Lighting Power Density for offices'
      }
    ];
    
    for (const sample of samples) {
      await query(
        `INSERT INTO building_type_standards 
        (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          sample.building_type,
          sample.standard_type,
          sample.standard_code,
          sample.minimum_value,
          sample.maximum_value,
          sample.unit,
          sample.description
        ]
      );
    }
    
    console.log(`${samples.length} sample building standards inserted`);
  } catch (error) {
    console.error('Error inserting sample building standards:', error);
  }
}

async function insertProjectStandardsSamples() {
  try {
    console.log('Inserting sample project standards...');
    
    const samples = [
      {
        project_type: 'lighting_retrofit',
        standard_type: 'roi',
        standard_code: 'FNNCL-ROI-LR',
        minimum_value: 15,
        maximum_value: null,
        unit: '%',
        description: 'Minimum ROI for lighting retrofit projects'
      },
      {
        project_type: 'hvac_upgrade',
        standard_type: 'payback',
        standard_code: 'FNNCL-PB-HVAC',
        minimum_value: null,
        maximum_value: 5,
        unit: 'years',
        description: 'Maximum payback period for HVAC upgrade projects'
      },
      {
        project_type: 'renewable_energy',
        standard_type: 'payback',
        standard_code: 'FNNCL-PB-RE',
        minimum_value: null,
        maximum_value: 7,
        unit: 'years',
        description: 'Maximum payback period for renewable energy projects'
      }
    ];
    
    for (const sample of samples) {
      await query(
        `INSERT INTO project_type_standards 
        (project_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          sample.project_type,
          sample.standard_type,
          sample.standard_code,
          sample.minimum_value,
          sample.maximum_value,
          sample.unit,
          sample.description
        ]
      );
    }
    
    console.log(`${samples.length} sample project standards inserted`);
  } catch (error) {
    console.error('Error inserting sample project standards:', error);
  }
}

async function insertRecommendationsSamples() {
  try {
    console.log('Inserting sample recommendations...');
    
    const samples = [
      {
        rule_id: 1,
        non_compliance_type: 'below_minimum',
        recommendation_text: 'Increase lighting levels to meet the minimum required illumination for this space type.',
        priority: 'high',
        calculator_type: 'illumination'
      },
      {
        rule_id: 2,
        non_compliance_type: 'above_maximum',
        recommendation_text: 'Reduce lighting power density by using more efficient fixtures or reducing the number of fixtures.',
        priority: 'medium',
        calculator_type: 'lighting'
      },
      {
        rule_id: 3,
        non_compliance_type: 'below_minimum',
        recommendation_text: 'Improve the insulation values to meet the minimum thermal requirements.',
        priority: 'medium',
        calculator_type: 'thermal'
      }
    ];
    
    for (const sample of samples) {
      await query(
        `INSERT INTO compliance_recommendations 
        (rule_id, non_compliance_type, recommendation_text, priority, calculator_type)
        VALUES (?, ?, ?, ?, ?)`,
        [
          sample.rule_id,
          sample.non_compliance_type,
          sample.recommendation_text,
          sample.priority,
          sample.calculator_type
        ]
      );
    }
    
    console.log(`${samples.length} sample recommendations inserted`);
  } catch (error) {
    console.error('Error inserting sample recommendations:', error);
  }
}

// Don't run the setup automatically when imported as a module
if (require.main === module) {
  setupStandardsTables()
    .then(() => console.log('Setup completed successfully'))
    .catch(error => console.error('Setup failed:', error));
}

// Export the functions
module.exports = {
  setupStandardsTables,
  insertBuildingStandardsSamples,
  insertProjectStandardsSamples,
  insertRecommendationsSamples
}; 