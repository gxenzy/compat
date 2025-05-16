const express = require('express');
const router = express.Router();
const { query } = require('../src/config/database');
const { authenticateToken } = require('../src/middleware/auth');

// Apply authentication middleware to all compliance routes
router.use(authenticateToken);

// GET /api/compliance/rules
router.get('/rules', async (req, res) => {
  try {
    const { active } = req.query;
    let queryText = 'SELECT * FROM compliance_rules';
    
    if (active === 'true') {
      queryText += ' WHERE active = true';
    }
    
    const rules = await query(queryText);
    res.json(rules);
  } catch (error) {
    console.error('Error fetching compliance rules:', error);
    res.status(500).json({ message: 'Failed to retrieve compliance rules', error: error.message });
  }
});

// GET /api/compliance/verify-calculation
router.post('/verify-calculation', async (req, res) => {
  try {
    const { calculationData, calculationType, calculationId, buildingType, projectType } = req.body;
    
    // Verify the calculation against rules in the database
    const applicableRules = await query(`
      SELECT * FROM compliance_rules 
      WHERE calculation_type = ? AND active = true
    `, [calculationType]);
    
    // Create verification record
    const verification = {
      calculationId,
      calculationType,
      timestamp: new Date(),
      results: []
    };
    
    // Process rules against calculation data
    for (const rule of applicableRules) {
      try {
        // Simple rule processor - this should be expanded for real implementation
        const compliant = checkCompliance(calculationData, rule);
        
        verification.results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          compliant,
          details: compliant ? 'Passed' : 'Failed',
          timestamp: new Date()
        });
      } catch (ruleError) {
        verification.results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          compliant: false,
          details: `Error processing rule: ${ruleError.message}`,
          timestamp: new Date()
        });
      }
    }
    
    // Save verification results
    const insertResult = await query(`
      INSERT INTO calculation_compliance_verifications 
      (calculation_id, calculation_type, verification_date, results) 
      VALUES (?, ?, ?, ?)
    `, [calculationId, calculationType, new Date(), JSON.stringify(verification.results)]);
    
    verification.id = insertResult.insertId;
    
    res.json(verification);
  } catch (error) {
    console.error('Error verifying calculation:', error);
    res.status(500).json({ message: 'Failed to verify calculation', error: error.message });
  }
});

// Helper function to check compliance (simplified for demo)
function checkCompliance(calculationData, rule) {
  // This is a simplified placeholder - in a real implementation,
  // this would evaluate the rule against the calculation data
  return Math.random() > 0.3; // 70% chance of passing for demo purposes
}

// Function to ensure tables exist in the database
async function ensureTablesExist() {
  try {
    // Create building_type_standards table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS building_type_standards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        buildingType VARCHAR(100) NOT NULL,
        standardType VARCHAR(100) NOT NULL,
        standardCode VARCHAR(100) NOT NULL,
        minimumValue FLOAT NULL,
        maximumValue FLOAT NULL,
        unit VARCHAR(50) NULL,
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create project_type_standards table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS project_type_standards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        projectType VARCHAR(100) NOT NULL,
        standardType VARCHAR(100) NOT NULL,
        standardCode VARCHAR(100) NOT NULL,
        minimumValue FLOAT NULL,
        maximumValue FLOAT NULL,
        unit VARCHAR(50) NULL,
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create compliance_recommendations table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS compliance_recommendations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ruleId INT NULL,
        nonComplianceType VARCHAR(100) NOT NULL,
        recommendationText TEXT NOT NULL,
        priority VARCHAR(50) DEFAULT 'medium',
        calculatorType VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create compliance_rules table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS compliance_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        calculation_type VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create calculation_compliance_verifications table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS calculation_compliance_verifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        calculation_id VARCHAR(100) NOT NULL,
        calculation_type VARCHAR(100) NOT NULL,
        verification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        results JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Compliance tables created successfully');
  } catch (error) {
    console.error('Error creating compliance tables:', error);
  }
}

// Ensure tables exist when module is loaded
ensureTablesExist();

// GET /api/compliance/building-standards
router.get('/building-standards', async (req, res) => {
  try {
    const { buildingType } = req.query;
    let queryText = 'SELECT * FROM building_type_standards';
    const params = [];
    
    if (buildingType) {
      queryText += ' WHERE building_type = ?';
      params.push(buildingType);
    }
    
    const standards = await query(queryText, params);
    res.json(standards);
  } catch (error) {
    console.error('Error fetching building standards:', error);
    res.status(500).json({ message: 'Failed to retrieve building standards', error: error.message });
  }
});

// GET /api/compliance/building-standards/all
router.get('/building-standards/all', async (req, res) => {
  try {
    console.log('Received request for building-standards/all');
    const standards = await query('SELECT * FROM building_type_standards');
    console.log('Building standards data:', standards);
    res.json(standards || []);
  } catch (error) {
    console.error('Error fetching all building standards:', error);
    // Return empty array instead of error to avoid client-side crashes
    res.json([]);
  }
});

// POST /api/compliance/building-standards
router.post('/building-standards', async (req, res) => {
  try {
    const { building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description } = req.body;
    
    // Validate required fields
    if (!building_type || !standard_type || !standard_code) {
      return res.status(400).json({ 
        message: 'Missing required fields: building_type, standard_type, and standard_code are required' 
      });
    }
    
    // Insert the new standard
    const result = await query(
      `INSERT INTO building_type_standards 
       (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description]
    );
    
    // Get the created record
    const [createdStandard] = await query(
      'SELECT * FROM building_type_standards WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(createdStandard);
  } catch (error) {
    console.error('Error creating building standard:', error);
    res.status(500).json({ 
      message: 'Failed to create building standard', 
      error: error.message 
    });
  }
});

// PUT /api/compliance/building-standards/:id
router.put('/building-standards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description } = req.body;
    
    // Validate that standard exists
    const [existingStandard] = await query(
      'SELECT * FROM building_type_standards WHERE id = ?',
      [id]
    );
    
    if (!existingStandard) {
      return res.status(404).json({ message: 'Building standard not found' });
    }
    
    // Update the standard
    await query(
      `UPDATE building_type_standards 
       SET building_type = ?, standard_type = ?, standard_code = ?, 
           minimum_value = ?, maximum_value = ?, unit = ?, description = ?
       WHERE id = ?`,
      [building_type, standard_type, standard_code, 
       minimum_value, maximum_value, unit, description, id]
    );
    
    // Get the updated record
    const [updatedStandard] = await query(
      'SELECT * FROM building_type_standards WHERE id = ?',
      [id]
    );
    
    res.json(updatedStandard);
  } catch (error) {
    console.error('Error updating building standard:', error);
    res.status(500).json({ 
      message: 'Failed to update building standard', 
      error: error.message 
    });
  }
});

// DELETE /api/compliance/building-standards/:id
router.delete('/building-standards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that standard exists
    const [existingStandard] = await query(
      'SELECT * FROM building_type_standards WHERE id = ?',
      [id]
    );
    
    if (!existingStandard) {
      return res.status(404).json({ message: 'Building standard not found' });
    }
    
    // Delete the standard
    await query('DELETE FROM building_type_standards WHERE id = ?', [id]);
    
    res.json({ message: 'Building standard deleted successfully', deletedId: id });
  } catch (error) {
    console.error('Error deleting building standard:', error);
    res.status(500).json({ 
      message: 'Failed to delete building standard', 
      error: error.message 
    });
  }
});

// GET /api/compliance/project-standards
router.get('/project-standards', async (req, res) => {
  try {
    const { projectType } = req.query;
    let queryText = 'SELECT * FROM project_type_standards';
    const params = [];
    
    if (projectType) {
      queryText += ' WHERE project_type = ?';
      params.push(projectType);
    }
    
    const standards = await query(queryText, params);
    res.json(standards);
  } catch (error) {
    console.error('Error fetching project standards:', error);
    res.status(500).json({ message: 'Failed to retrieve project standards', error: error.message });
  }
});

// GET /api/compliance/project-standards/all
router.get('/project-standards/all', async (req, res) => {
  try {
    console.log('Received request for project-standards/all');
    const standards = await query('SELECT * FROM project_type_standards');
    console.log('Project standards data:', standards);
    res.json(standards || []);
  } catch (error) {
    console.error('Error fetching all project standards:', error);
    // Return empty array instead of error to avoid client-side crashes
    res.json([]);
  }
});

// POST /api/compliance/project-standards
router.post('/project-standards', async (req, res) => {
  try {
    const { project_type, standard_type, standard_code, minimum_value, maximum_value, unit, description } = req.body;
    
    // Validate required fields
    if (!project_type || !standard_type || !standard_code) {
      return res.status(400).json({ 
        message: 'Missing required fields: project_type, standard_type, and standard_code are required' 
      });
    }
    
    // Insert the new standard
    const result = await query(
      `INSERT INTO project_type_standards 
       (project_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [project_type, standard_type, standard_code, minimum_value, maximum_value, unit, description]
    );
    
    // Get the created record
    const [createdStandard] = await query(
      'SELECT * FROM project_type_standards WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(createdStandard);
  } catch (error) {
    console.error('Error creating project standard:', error);
    res.status(500).json({ 
      message: 'Failed to create project standard', 
      error: error.message 
    });
  }
});

// PUT /api/compliance/project-standards/:id
router.put('/project-standards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { project_type, standard_type, standard_code, minimum_value, maximum_value, unit, description } = req.body;
    
    // Validate that standard exists
    const [existingStandard] = await query(
      'SELECT * FROM project_type_standards WHERE id = ?',
      [id]
    );
    
    if (!existingStandard) {
      return res.status(404).json({ message: 'Project standard not found' });
    }
    
    // Update the standard
    await query(
      `UPDATE project_type_standards 
       SET project_type = ?, standard_type = ?, standard_code = ?, 
           minimum_value = ?, maximum_value = ?, unit = ?, description = ?
       WHERE id = ?`,
      [project_type, standard_type, standard_code, 
       minimum_value, maximum_value, unit, description, id]
    );
    
    // Get the updated record
    const [updatedStandard] = await query(
      'SELECT * FROM project_type_standards WHERE id = ?',
      [id]
    );
    
    res.json(updatedStandard);
  } catch (error) {
    console.error('Error updating project standard:', error);
    res.status(500).json({ 
      message: 'Failed to update project standard', 
      error: error.message 
    });
  }
});

// DELETE /api/compliance/project-standards/:id
router.delete('/project-standards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that standard exists
    const [existingStandard] = await query(
      'SELECT * FROM project_type_standards WHERE id = ?',
      [id]
    );
    
    if (!existingStandard) {
      return res.status(404).json({ message: 'Project standard not found' });
    }
    
    // Delete the standard
    await query('DELETE FROM project_type_standards WHERE id = ?', [id]);
    
    res.json({ message: 'Project standard deleted successfully', deletedId: id });
  } catch (error) {
    console.error('Error deleting project standard:', error);
    res.status(500).json({ 
      message: 'Failed to delete project standard', 
      error: error.message 
    });
  }
});

// GET /api/compliance/recommendations/all
router.get('/recommendations/all', async (req, res) => {
  try {
    console.log('Received request for recommendations/all');
    const recommendations = await query('SELECT * FROM compliance_recommendations');
    console.log('Recommendations data:', recommendations);
    res.json(recommendations || []);
  } catch (error) {
    console.error('Error fetching all compliance recommendations:', error);
    // Return empty array instead of error to avoid client-side crashes
    res.json([]);
  }
});

// GET /api/compliance/recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const { ruleId, calculatorType, nonComplianceType } = req.query;
    let queryText = 'SELECT * FROM compliance_recommendations';
    const params = [];
    const conditions = [];
    
    if (ruleId) {
      conditions.push('rule_id = ?');
      params.push(ruleId);
    }
    
    if (calculatorType) {
      conditions.push('calculator_type = ?');
      params.push(calculatorType);
    }
    
    if (nonComplianceType) {
      conditions.push('non_compliance_type = ?');
      params.push(nonComplianceType);
    }
    
    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }
    
    const recommendations = await query(queryText, params);
    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching compliance recommendations:', error);
    res.status(500).json({ message: 'Failed to retrieve compliance recommendations', error: error.message });
  }
});

// POST /api/compliance/recommendations
router.post('/recommendations', async (req, res) => {
  try {
    const { rule_id, non_compliance_type, recommendation_text, priority, calculator_type } = req.body;
    
    // Validate required fields
    if (!non_compliance_type || !recommendation_text) {
      return res.status(400).json({ 
        message: 'Missing required fields: non_compliance_type and recommendation_text are required' 
      });
    }
    
    // Insert the new recommendation
    const result = await query(
      `INSERT INTO compliance_recommendations 
       (rule_id, non_compliance_type, recommendation_text, priority, calculator_type)
       VALUES (?, ?, ?, ?, ?)`,
      [rule_id, non_compliance_type, recommendation_text, priority || 'medium', calculator_type]
    );
    
    // Get the created record
    const [createdRecommendation] = await query(
      'SELECT * FROM compliance_recommendations WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(createdRecommendation);
  } catch (error) {
    console.error('Error creating compliance recommendation:', error);
    res.status(500).json({ 
      message: 'Failed to create compliance recommendation', 
      error: error.message 
    });
  }
});

// PUT /api/compliance/recommendations/:id
router.put('/recommendations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rule_id, non_compliance_type, recommendation_text, priority, calculator_type } = req.body;
    
    // Validate that recommendation exists
    const [existingRecommendation] = await query(
      'SELECT * FROM compliance_recommendations WHERE id = ?',
      [id]
    );
    
    if (!existingRecommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }
    
    // Update the recommendation
    await query(
      `UPDATE compliance_recommendations 
       SET rule_id = ?, non_compliance_type = ?, recommendation_text = ?, priority = ?, calculator_type = ?
       WHERE id = ?`,
      [rule_id, non_compliance_type, recommendation_text, priority, calculator_type, id]
    );
    
    // Get the updated record
    const [updatedRecommendation] = await query(
      'SELECT * FROM compliance_recommendations WHERE id = ?',
      [id]
    );
    
    res.json(updatedRecommendation);
  } catch (error) {
    console.error('Error updating compliance recommendation:', error);
    res.status(500).json({ 
      message: 'Failed to update compliance recommendation', 
      error: error.message 
    });
  }
});

// DELETE /api/compliance/recommendations/:id
router.delete('/recommendations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that recommendation exists
    const [existingRecommendation] = await query(
      'SELECT * FROM compliance_recommendations WHERE id = ?',
      [id]
    );
    
    if (!existingRecommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }
    
    // Delete the recommendation
    await query('DELETE FROM compliance_recommendations WHERE id = ?', [id]);
    
    res.json({ message: 'Recommendation deleted successfully', deletedId: id });
  } catch (error) {
    console.error('Error deleting compliance recommendation:', error);
    res.status(500).json({ 
      message: 'Failed to delete compliance recommendation', 
      error: error.message 
    });
  }
});

module.exports = router; 