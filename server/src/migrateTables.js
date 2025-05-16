/**
 * Migration script to normalize database tables to use snake_case naming
 */

const { query } = require('./config/database');

async function migrateTablesFormat() {
  try {
    console.log('Starting database table migration...');

    // Check if camelCase tables exist
    console.log('Checking for camelCase tables...');
    
    try {
      // Building standards table
      const buildingTableResult = await query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'buildingTypeStandards'
      `);

      if (buildingTableResult.length > 0) {
        console.log('Found buildingTypeStandards table, migrating...');
        
        // Create snake_case table if it doesn't exist
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
        
        // Verify table structure before migration
        const [camelData] = await query('SELECT * FROM buildingTypeStandards LIMIT 1');
        console.log('Example record from buildingTypeStandards:', camelData);
        
        // Copy data from camelCase to snake_case
        await query(`
          INSERT INTO building_type_standards
          (id, building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
          SELECT id, buildingType, standardType, standardCode, minimumValue, maximumValue, unit, description
          FROM buildingTypeStandards
        `);
        
        // Verify data was copied correctly
        const [snakeCount] = await query('SELECT COUNT(*) as count FROM building_type_standards');
        console.log(`${snakeCount.count} records migrated to building_type_standards`);
        
        // Drop the camelCase table if migration was successful
        if (snakeCount.count > 0) {
          await query('DROP TABLE buildingTypeStandards');
          console.log('Successfully dropped buildingTypeStandards after migration');
        }
      } else {
        console.log('buildingTypeStandards table not found, no migration needed');
      }
      
      // Project standards table
      const projectTableResult = await query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'projectTypeStandards'
      `);
      
      if (projectTableResult.length > 0) {
        console.log('Found projectTypeStandards table, migrating...');
        
        // Create snake_case table if it doesn't exist
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
        
        // Verify table structure before migration
        const [camelData] = await query('SELECT * FROM projectTypeStandards LIMIT 1');
        console.log('Example record from projectTypeStandards:', camelData);
        
        // Copy data from camelCase to snake_case
        await query(`
          INSERT INTO project_type_standards
          (id, project_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
          SELECT id, projectType, standardType, standardCode, minimumValue, maximumValue, unit, description
          FROM projectTypeStandards
        `);
        
        // Verify data was copied correctly
        const [snakeCount] = await query('SELECT COUNT(*) as count FROM project_type_standards');
        console.log(`${snakeCount.count} records migrated to project_type_standards`);
        
        // Drop the camelCase table if migration was successful
        if (snakeCount.count > 0) {
          await query('DROP TABLE projectTypeStandards');
          console.log('Successfully dropped projectTypeStandards after migration');
        }
      } else {
        console.log('projectTypeStandards table not found, no migration needed');
      }
      
      // Recommendations table
      const recommendationsTableResult = await query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'complianceRecommendations'
      `);
      
      if (recommendationsTableResult.length > 0) {
        console.log('Found complianceRecommendations table, migrating...');
        
        // Create snake_case table if it doesn't exist
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
        
        // Verify table structure before migration
        const [camelData] = await query('SELECT * FROM complianceRecommendations LIMIT 1');
        console.log('Example record from complianceRecommendations:', camelData);
        
        // Copy data from camelCase to snake_case
        await query(`
          INSERT INTO compliance_recommendations
          (id, rule_id, non_compliance_type, recommendation_text, priority, calculator_type)
          SELECT id, ruleId, nonComplianceType, recommendationText, priority, calculatorType
          FROM complianceRecommendations
        `);
        
        // Verify data was copied correctly
        const [snakeCount] = await query('SELECT COUNT(*) as count FROM compliance_recommendations');
        console.log(`${snakeCount.count} records migrated to compliance_recommendations`);
        
        // Drop the camelCase table if migration was successful
        if (snakeCount.count > 0) {
          await query('DROP TABLE complianceRecommendations');
          console.log('Successfully dropped complianceRecommendations after migration');
        }
      } else {
        console.log('complianceRecommendations table not found, no migration needed');
      }
    } catch (error) {
      console.error('Error during table checks or migration:', error);
    }
    
    // Make sure the snake_case tables exist
    console.log('Ensuring snake_case tables exist...');
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
    
    // Report status
    const [buildingCount] = await query('SELECT COUNT(*) as count FROM building_type_standards');
    const [projectCount] = await query('SELECT COUNT(*) as count FROM project_type_standards');
    const [recommendationsCount] = await query('SELECT COUNT(*) as count FROM compliance_recommendations');
    
    console.log('Migration completed:');
    console.log(`- building_type_standards: ${buildingCount.count} records`);
    console.log(`- project_type_standards: ${projectCount.count} records`);
    console.log(`- compliance_recommendations: ${recommendationsCount.count} records`);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateTablesFormat()
    .then(() => {
      console.log('Migration script completed.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateTablesFormat }; 