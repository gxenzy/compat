const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all compliance routes
router.use(authenticateToken);

// Function to ensure tables exist in the database
async function ensureTablesExist() {
  try {
    // Create building_type_standards table if not exists
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
    
    // Create project_type_standards table if not exists
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
    
    // Create compliance_recommendations table if not exists
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

    // Drop existing camelCase tables if they exist
    try {
      // Check if camelCase tables exist
      const [buildingTablesResult] = await query(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'buildingTypeStandards'
      `);
      
      if (buildingTablesResult.count > 0) {
        // Copy data from camelCase to snake_case tables
        await query(`
          INSERT IGNORE INTO building_type_standards
          (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
          SELECT buildingType, standardType, standardCode, minimumValue, maximumValue, unit, description
          FROM buildingTypeStandards
        `);
        
        // Drop the camelCase table
        await query('DROP TABLE buildingTypeStandards');
        console.log('Migrated buildingTypeStandards to building_type_standards');
      }
      
      // Repeat for project standards
      const [projectTablesResult] = await query(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'projectTypeStandards'
      `);
      
      if (projectTablesResult.count > 0) {
        await query(`
          INSERT IGNORE INTO project_type_standards
          (project_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
          SELECT projectType, standardType, standardCode, minimumValue, maximumValue, unit, description
          FROM projectTypeStandards
        `);
        
        await query('DROP TABLE projectTypeStandards');
        console.log('Migrated projectTypeStandards to project_type_standards');
      }
      
      // Repeat for recommendations
      const [recommendationsResult] = await query(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'complianceRecommendations'
      `);
      
      if (recommendationsResult.count > 0) {
        await query(`
          INSERT IGNORE INTO compliance_recommendations
          (rule_id, non_compliance_type, recommendation_text, priority, calculator_type)
          SELECT ruleId, nonComplianceType, recommendationText, priority, calculatorType
          FROM complianceRecommendations
        `);
        
        await query('DROP TABLE complianceRecommendations');
        console.log('Migrated complianceRecommendations to compliance_recommendations');
      }
    } catch (err) {
      console.error('Error migrating tables:', err);
    }
    
    console.log('Compliance tables created successfully');
  } catch (error) {
    console.error('Error creating compliance tables:', error);
  }
}

// Ensure tables exist when routes are loaded
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