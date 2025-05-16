/**
 * Sample recommendations seeder script
 * Creates basic recommendations for testing the standards management UI
 */

const { query } = require('../../config/database');

async function seedSampleRecommendations() {
  try {
    console.log('Starting sample recommendations seeder...');
    
    // Check if recommendations table exists, create it if not
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
    
    // Check if we already have recommendations
    const existingCount = await query('SELECT COUNT(*) as count FROM compliance_recommendations');
    
    if (existingCount[0].count > 0) {
      console.log(`${existingCount[0].count} recommendations already exist, skipping seeder.`);
      return;
    }
    
    // Sample recommendations data
    const recommendations = [
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
    
    // Insert the recommendations
    for (const rec of recommendations) {
      await query(
        `INSERT INTO compliance_recommendations 
        (rule_id, non_compliance_type, recommendation_text, priority, calculator_type)
        VALUES (?, ?, ?, ?, ?)`,
        [rec.rule_id, rec.non_compliance_type, rec.recommendation_text, rec.priority, rec.calculator_type]
      );
    }
    
    console.log(`Successfully added ${recommendations.length} sample recommendations`);
  } catch (error) {
    console.error('Error seeding sample recommendations:', error);
  }
}

// Execute the seeder function
seedSampleRecommendations();

module.exports = {
  seedSampleRecommendations
}; 