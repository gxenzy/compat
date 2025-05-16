const BuildingTypeStandard = require('../models/BuildingTypeStandard');
const ProjectTypeStandard = require('../models/ProjectTypeStandard');
const ComplianceRecommendation = require('../models/ComplianceRecommendation');

/**
 * Controller for compliance-related endpoints
 */
const complianceController = {
  /**
   * Get all building type standards
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllBuildingTypeStandards: async (req, res) => {
    try {
      const standards = await BuildingTypeStandard.query();
      res.status(200).json(standards);
    } catch (error) {
      console.error('Error getting building type standards:', error);
      res.status(500).json({ error: 'Failed to get building type standards' });
    }
  },

  /**
   * Get building type standards by building type
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getBuildingTypeStandards: async (req, res) => {
    try {
      const { buildingType, standardType } = req.query;
      
      if (!buildingType) {
        return res.status(400).json({ error: 'Building type is required' });
      }
      
      let standards;
      if (standardType) {
        standards = await BuildingTypeStandard.getStandardsByTypeAndBuilding(buildingType, standardType);
      } else {
        standards = await BuildingTypeStandard.getStandardsByBuildingType(buildingType);
      }
      
      res.status(200).json(standards);
    } catch (error) {
      console.error('Error getting building type standards:', error);
      res.status(500).json({ error: 'Failed to get building type standards' });
    }
  },

  /**
   * Create a new building type standard
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createBuildingTypeStandard: async (req, res) => {
    try {
      const {
        building_type,
        standard_type,
        standard_code,
        minimum_value,
        maximum_value,
        unit,
        description
      } = req.body;
      
      if (!building_type || !standard_type || !standard_code) {
        return res.status(400).json({ 
          error: 'Building type, standard type, and standard code are required' 
        });
      }
      
      // Check for uniqueness constraint
      const existing = await BuildingTypeStandard.query()
        .where('building_type', building_type)
        .where('standard_type', standard_type)
        .where('standard_code', standard_code)
        .first();
      
      if (existing) {
        return res.status(409).json({ 
          error: 'A standard with this building type, standard type, and standard code already exists' 
        });
      }
      
      const standard = await BuildingTypeStandard.query().insert({
        building_type,
        standard_type,
        standard_code,
        minimum_value: minimum_value || null,
        maximum_value: maximum_value || null,
        unit,
        description
      });
      
      res.status(201).json(standard);
    } catch (error) {
      console.error('Error creating building type standard:', error);
      res.status(500).json({ error: 'Failed to create building type standard' });
    }
  },

  /**
   * Update a building type standard
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateBuildingTypeStandard: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        building_type,
        standard_type,
        standard_code,
        minimum_value,
        maximum_value,
        unit,
        description
      } = req.body;
      
      // Check if standard exists
      const standard = await BuildingTypeStandard.query().findById(id);
      if (!standard) {
        return res.status(404).json({ error: 'Building type standard not found' });
      }
      
      // Check for uniqueness constraint if key fields are changed
      if ((building_type && building_type !== standard.building_type) ||
          (standard_type && standard_type !== standard.standard_type) ||
          (standard_code && standard_code !== standard.standard_code)) {
        
        const existing = await BuildingTypeStandard.query()
          .where('building_type', building_type || standard.building_type)
          .where('standard_type', standard_type || standard.standard_type)
          .where('standard_code', standard_code || standard.standard_code)
          .whereNot('id', id)
          .first();
        
        if (existing) {
          return res.status(409).json({ 
            error: 'A standard with this building type, standard type, and standard code already exists' 
          });
        }
      }
      
      // Update the standard
      const updatedStandard = await BuildingTypeStandard.query().patchAndFetchById(id, {
        building_type: building_type || standard.building_type,
        standard_type: standard_type || standard.standard_type,
        standard_code: standard_code || standard.standard_code,
        minimum_value: minimum_value !== undefined ? minimum_value : standard.minimum_value,
        maximum_value: maximum_value !== undefined ? maximum_value : standard.maximum_value,
        unit: unit !== undefined ? unit : standard.unit,
        description: description !== undefined ? description : standard.description
      });
      
      res.status(200).json(updatedStandard);
    } catch (error) {
      console.error('Error updating building type standard:', error);
      res.status(500).json({ error: 'Failed to update building type standard' });
    }
  },

  /**
   * Delete a building type standard
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteBuildingTypeStandard: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if standard exists
      const standard = await BuildingTypeStandard.query().findById(id);
      if (!standard) {
        return res.status(404).json({ error: 'Building type standard not found' });
      }
      
      // Delete the standard
      await BuildingTypeStandard.query().deleteById(id);
      
      res.status(200).json({ message: 'Building type standard deleted successfully' });
    } catch (error) {
      console.error('Error deleting building type standard:', error);
      res.status(500).json({ error: 'Failed to delete building type standard' });
    }
  },

  /**
   * Get all project type standards
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllProjectTypeStandards: async (req, res) => {
    try {
      const standards = await ProjectTypeStandard.query();
      res.status(200).json(standards);
    } catch (error) {
      console.error('Error getting project type standards:', error);
      res.status(500).json({ error: 'Failed to get project type standards' });
    }
  },

  /**
   * Get project type standards by project type
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getProjectTypeStandards: async (req, res) => {
    try {
      const { projectType, standardType } = req.query;
      
      if (!projectType) {
        return res.status(400).json({ error: 'Project type is required' });
      }
      
      let standards;
      if (standardType) {
        standards = await ProjectTypeStandard.getStandardsByTypeAndProject(projectType, standardType);
      } else {
        standards = await ProjectTypeStandard.getStandardsByProjectType(projectType);
      }
      
      res.status(200).json(standards);
    } catch (error) {
      console.error('Error getting project type standards:', error);
      res.status(500).json({ error: 'Failed to get project type standards' });
    }
  },

  /**
   * Create a new project type standard
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createProjectTypeStandard: async (req, res) => {
    try {
      const {
        project_type,
        standard_type,
        standard_code,
        minimum_value,
        maximum_value,
        unit,
        description
      } = req.body;
      
      if (!project_type || !standard_type || !standard_code) {
        return res.status(400).json({ 
          error: 'Project type, standard type, and standard code are required' 
        });
      }
      
      // Check for uniqueness constraint
      const existing = await ProjectTypeStandard.query()
        .where('project_type', project_type)
        .where('standard_type', standard_type)
        .where('standard_code', standard_code)
        .first();
      
      if (existing) {
        return res.status(409).json({ 
          error: 'A standard with this project type, standard type, and standard code already exists' 
        });
      }
      
      const standard = await ProjectTypeStandard.query().insert({
        project_type,
        standard_type,
        standard_code,
        minimum_value: minimum_value || null,
        maximum_value: maximum_value || null,
        unit,
        description
      });
      
      res.status(201).json(standard);
    } catch (error) {
      console.error('Error creating project type standard:', error);
      res.status(500).json({ error: 'Failed to create project type standard' });
    }
  },

  /**
   * Update a project type standard
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateProjectTypeStandard: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        project_type,
        standard_type,
        standard_code,
        minimum_value,
        maximum_value,
        unit,
        description
      } = req.body;
      
      // Check if standard exists
      const standard = await ProjectTypeStandard.query().findById(id);
      if (!standard) {
        return res.status(404).json({ error: 'Project type standard not found' });
      }
      
      // Check for uniqueness constraint if key fields are changed
      if ((project_type && project_type !== standard.project_type) ||
          (standard_type && standard_type !== standard.standard_type) ||
          (standard_code && standard_code !== standard.standard_code)) {
        
        const existing = await ProjectTypeStandard.query()
          .where('project_type', project_type || standard.project_type)
          .where('standard_type', standard_type || standard.standard_type)
          .where('standard_code', standard_code || standard.standard_code)
          .whereNot('id', id)
          .first();
        
        if (existing) {
          return res.status(409).json({ 
            error: 'A standard with this project type, standard type, and standard code already exists' 
          });
        }
      }
      
      // Update the standard
      const updatedStandard = await ProjectTypeStandard.query().patchAndFetchById(id, {
        project_type: project_type || standard.project_type,
        standard_type: standard_type || standard.standard_type,
        standard_code: standard_code || standard.standard_code,
        minimum_value: minimum_value !== undefined ? minimum_value : standard.minimum_value,
        maximum_value: maximum_value !== undefined ? maximum_value : standard.maximum_value,
        unit: unit !== undefined ? unit : standard.unit,
        description: description !== undefined ? description : standard.description
      });
      
      res.status(200).json(updatedStandard);
    } catch (error) {
      console.error('Error updating project type standard:', error);
      res.status(500).json({ error: 'Failed to update project type standard' });
    }
  },

  /**
   * Delete a project type standard
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteProjectTypeStandard: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if standard exists
      const standard = await ProjectTypeStandard.query().findById(id);
      if (!standard) {
        return res.status(404).json({ error: 'Project type standard not found' });
      }
      
      // Delete the standard
      await ProjectTypeStandard.query().deleteById(id);
      
      res.status(200).json({ message: 'Project type standard deleted successfully' });
    } catch (error) {
      console.error('Error deleting project type standard:', error);
      res.status(500).json({ error: 'Failed to delete project type standard' });
    }
  },

  /**
   * Get all compliance recommendations
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllComplianceRecommendations: async (req, res) => {
    try {
      const recommendations = await ComplianceRecommendation.query();
      res.status(200).json(recommendations);
    } catch (error) {
      console.error('Error getting compliance recommendations:', error);
      res.status(500).json({ error: 'Failed to get compliance recommendations' });
    }
  },

  /**
   * Get compliance recommendations by criteria
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getComplianceRecommendations: async (req, res) => {
    try {
      const { ruleId, calculatorType, nonComplianceType, priority } = req.query;
      
      // Build criteria object
      const criteria = {};
      if (ruleId) criteria.ruleId = parseInt(ruleId, 10);
      if (calculatorType) criteria.calculatorType = calculatorType;
      if (nonComplianceType) criteria.nonComplianceType = nonComplianceType;
      if (priority) criteria.priority = priority;
      
      const recommendations = await ComplianceRecommendation.getRecommendationsByCriteria(criteria);
      
      res.status(200).json(recommendations);
    } catch (error) {
      console.error('Error getting compliance recommendations:', error);
      res.status(500).json({ error: 'Failed to get compliance recommendations' });
    }
  },

  /**
   * Create a new compliance recommendation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createComplianceRecommendation: async (req, res) => {
    try {
      const {
        rule_id,
        non_compliance_type,
        recommendation_text,
        priority,
        calculator_type
      } = req.body;
      
      if (!rule_id || !non_compliance_type || !recommendation_text || !calculator_type) {
        return res.status(400).json({ 
          error: 'Rule ID, non-compliance type, recommendation text, and calculator type are required' 
        });
      }
      
      // Check for uniqueness constraint
      const existing = await ComplianceRecommendation.query()
        .where('rule_id', rule_id)
        .where('non_compliance_type', non_compliance_type)
        .where('calculator_type', calculator_type)
        .first();
      
      if (existing) {
        return res.status(409).json({ 
          error: 'A recommendation with this rule ID, non-compliance type, and calculator type already exists' 
        });
      }
      
      const recommendation = await ComplianceRecommendation.query().insert({
        rule_id,
        non_compliance_type,
        recommendation_text,
        priority: priority || 'medium',
        calculator_type
      });
      
      res.status(201).json(recommendation);
    } catch (error) {
      console.error('Error creating compliance recommendation:', error);
      res.status(500).json({ error: 'Failed to create compliance recommendation' });
    }
  },

  /**
   * Update a compliance recommendation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateComplianceRecommendation: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        rule_id,
        non_compliance_type,
        recommendation_text,
        priority,
        calculator_type
      } = req.body;
      
      // Check if recommendation exists
      const recommendation = await ComplianceRecommendation.query().findById(id);
      if (!recommendation) {
        return res.status(404).json({ error: 'Compliance recommendation not found' });
      }
      
      // Check for uniqueness constraint if key fields are changed
      if ((rule_id && rule_id !== recommendation.rule_id) ||
          (non_compliance_type && non_compliance_type !== recommendation.non_compliance_type) ||
          (calculator_type && calculator_type !== recommendation.calculator_type)) {
        
        const existing = await ComplianceRecommendation.query()
          .where('rule_id', rule_id || recommendation.rule_id)
          .where('non_compliance_type', non_compliance_type || recommendation.non_compliance_type)
          .where('calculator_type', calculator_type || recommendation.calculator_type)
          .whereNot('id', id)
          .first();
        
        if (existing) {
          return res.status(409).json({ 
            error: 'A recommendation with this rule ID, non-compliance type, and calculator type already exists' 
          });
        }
      }
      
      // Update the recommendation
      const updatedRecommendation = await ComplianceRecommendation.query().patchAndFetchById(id, {
        rule_id: rule_id || recommendation.rule_id,
        non_compliance_type: non_compliance_type || recommendation.non_compliance_type,
        recommendation_text: recommendation_text || recommendation.recommendation_text,
        priority: priority || recommendation.priority,
        calculator_type: calculator_type || recommendation.calculator_type
      });
      
      res.status(200).json(updatedRecommendation);
    } catch (error) {
      console.error('Error updating compliance recommendation:', error);
      res.status(500).json({ error: 'Failed to update compliance recommendation' });
    }
  },

  /**
   * Delete a compliance recommendation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteComplianceRecommendation: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if recommendation exists
      const recommendation = await ComplianceRecommendation.query().findById(id);
      if (!recommendation) {
        return res.status(404).json({ error: 'Compliance recommendation not found' });
      }
      
      // Delete the recommendation
      await ComplianceRecommendation.query().deleteById(id);
      
      res.status(200).json({ message: 'Compliance recommendation deleted successfully' });
    } catch (error) {
      console.error('Error deleting compliance recommendation:', error);
      res.status(500).json({ error: 'Failed to delete compliance recommendation' });
    }
  }
};

module.exports = complianceController; 