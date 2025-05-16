/**
 * Standards Import Controller
 * 
 * This controller handles importing standards data with safeguards against duplicates
 */

const { query } = require('../config/database');
const Standard = require('../models/Standard');

/**
 * Import a standard with duplicate prevention
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.importStandard = async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || !data.standard) {
      return res.status(400).json({ error: 'Invalid import data' });
    }
    
    // Create standard first to get the ID
    const standardId = await Standard.create(data.standard);
    
    // Process sections if they exist
    if (data.sections && Array.isArray(data.sections)) {
      for (const section of data.sections) {
        section.standard_id = standardId;
        const sectionId = await Standard.addSection(section);
        
        // Process tables
        if (section.tables && Array.isArray(section.tables)) {
          for (const table of section.tables) {
            table.section_id = sectionId;
            await Standard.addTable(table);
          }
        }
        
        // Process figures
        if (section.figures && Array.isArray(section.figures)) {
          for (const figure of section.figures) {
            figure.section_id = sectionId;
            await Standard.addFigure(figure);
          }
        }
        
        // Process compliance requirements
        if (section.requirements && Array.isArray(section.requirements)) {
          for (const requirement of section.requirements) {
            requirement.section_id = sectionId;
            await Standard.addComplianceRequirement(requirement);
          }
        }
        
        // Process educational resources
        if (section.resources && Array.isArray(section.resources)) {
          for (const resource of section.resources) {
            resource.section_id = sectionId;
            await Standard.addResource(resource);
          }
        }
      }
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Standard imported successfully', 
      standardId 
    });
  } catch (error) {
    console.error('Error importing standard:', error);
    return res.status(500).json({ error: 'Error importing standard' });
  }
};

/**
 * Import multiple standards with duplicate prevention
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.importMultipleStandards = async (req, res) => {
  try {
    const { standards } = req.body;
    
    if (!standards || !Array.isArray(standards)) {
      return res.status(400).json({ error: 'Invalid import data' });
    }
    
    const results = [];
    
    for (const standardData of standards) {
      try {
        // Create standard first to get the ID
        const standardId = await Standard.create(standardData.standard);
        
        // Process sections if they exist
        if (standardData.sections && Array.isArray(standardData.sections)) {
          for (const section of standardData.sections) {
            section.standard_id = standardId;
            await Standard.addSection(section);
          }
        }
        
        results.push({
          code_name: standardData.standard.code_name,
          success: true,
          standardId
        });
      } catch (error) {
        console.error(`Error importing standard ${standardData.standard?.code_name}:`, error);
        results.push({
          code_name: standardData.standard?.code_name || 'Unknown',
          success: false,
          error: error.message
        });
      }
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Standards import completed',
      results
    });
  } catch (error) {
    console.error('Error in bulk import:', error);
    return res.status(500).json({ error: 'Error in bulk import' });
  }
};

/**
 * Verify standard data without importing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.verifyStandardImport = async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || !data.standard) {
      return res.status(400).json({ error: 'Invalid import data' });
    }
    
    // Check if standard already exists
    const existingStandard = await query(
      `SELECT id FROM standards 
      WHERE code_name = ? AND version = ?`,
      [data.standard.code_name, data.standard.version]
    );
    
    const response = {
      valid: true,
      warnings: [],
      sections: {
        total: data.sections?.length || 0,
        potential_duplicates: 0
      }
    };
    
    if (existingStandard.length > 0) {
      response.warnings.push({
        type: 'standard_exists',
        message: `Standard ${data.standard.code_name} v${data.standard.version} already exists`
      });
    }
    
    // Check sections for potential duplicates
    if (data.sections && Array.isArray(data.sections)) {
      const sectionNumbers = {};
      
      for (const section of data.sections) {
        if (sectionNumbers[section.section_number]) {
          response.sections.potential_duplicates++;
        } else {
          sectionNumbers[section.section_number] = true;
        }
      }
      
      if (response.sections.potential_duplicates > 0) {
        response.warnings.push({
          type: 'duplicate_sections',
          message: `Found ${response.sections.potential_duplicates} potential duplicate section numbers`
        });
      }
    }
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error verifying standard import:', error);
    return res.status(500).json({ error: 'Error verifying import data' });
  }
};

module.exports = exports;
