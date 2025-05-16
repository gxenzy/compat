import axios from 'axios';
import api from './api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const DIRECT_API_URL = process.env.REACT_APP_DIRECT_API_URL || 'http://localhost:8000';

/**
 * Service for handling PEC standards
 */
const pecStandardsService = {
  /**
   * Get all building type standards
   * @returns {Promise<Array>} List of all building type standards
   */
  getAllBuildingTypeStandards: async () => {
    try {
      // Try multiple endpoints to increase reliability
      try {
        const response = await api.get('/compliance/building-standards/all');
        console.log('Raw building standards data from API:', response.data);
        
        // Transform snake_case to camelCase
        return response.data.map(item => ({
          id: item.id,
          buildingType: item.building_type,
          standardType: item.standard_type,
          standardCode: item.standard_code,
          minimumValue: item.minimum_value,
          maximumValue: item.maximum_value,
          unit: item.unit,
          description: item.description
        }));
      } catch (error) {
        console.warn('API endpoint failed, trying direct endpoint', error);
        const directResponse = await axios.get(`${DIRECT_API_URL}/compliance/building-standards/all`);
        console.log('Raw building standards data from direct endpoint:', directResponse.data);
        
        // Transform snake_case to camelCase
        return directResponse.data.map(item => ({
          id: item.id,
          buildingType: item.building_type,
          standardType: item.standard_type,
          standardCode: item.standard_code,
          minimumValue: item.minimum_value,
          maximumValue: item.maximum_value,
          unit: item.unit,
          description: item.description
        }));
      }
    } catch (error) {
      console.error('Error fetching building standards:', error);
      // Return empty array instead of throwing to handle failures gracefully
      return [];
    }
  },

  /**
   * Get standards for a specific building type
   * @param {string} buildingType The building type to filter by
   * @returns {Promise<Array>} List of standards for the specified building type
   */
  getBuildingTypeStandards: async (buildingType) => {
    try {
      const response = await api.get(`/compliance/building-standards?buildingType=${buildingType}`);
      console.log('Raw building type standards data:', response.data);
      
      // Transform snake_case to camelCase
      return response.data.map(item => ({
        id: item.id,
        buildingType: item.building_type,
        standardType: item.standard_type,
        standardCode: item.standard_code,
        minimumValue: item.minimum_value,
        maximumValue: item.maximum_value,
        unit: item.unit,
        description: item.description
      }));
    } catch (error) {
      console.error(`Error fetching standards for building type ${buildingType}:`, error);
      return [];
    }
  },

  /**
   * Get all project type standards
   * @returns {Promise<Array>} List of all project type standards
   */
  getAllProjectTypeStandards: async () => {
    try {
      try {
        const response = await api.get('/compliance/project-standards/all');
        console.log('Raw project standards data from API:', response.data);
        
        // Transform snake_case to camelCase
        return response.data.map(item => ({
          id: item.id,
          projectType: item.project_type,
          standardType: item.standard_type,
          standardCode: item.standard_code,
          minimumValue: item.minimum_value,
          maximumValue: item.maximum_value,
          unit: item.unit,
          description: item.description
        }));
      } catch (error) {
        console.warn('API endpoint failed, trying direct endpoint', error);
        const directResponse = await axios.get(`${DIRECT_API_URL}/compliance/project-standards/all`);
        console.log('Raw project standards data from direct endpoint:', directResponse.data);
        
        // Transform snake_case to camelCase
        return directResponse.data.map(item => ({
          id: item.id,
          projectType: item.project_type,
          standardType: item.standard_type,
          standardCode: item.standard_code,
          minimumValue: item.minimum_value,
          maximumValue: item.maximum_value,
          unit: item.unit,
          description: item.description
        }));
      }
    } catch (error) {
      console.error('Error fetching project standards:', error);
      return [];
    }
  },

  /**
   * Get all compliance recommendations
   * @returns {Promise<Array>} List of all compliance recommendations
   */
  getAllComplianceRecommendations: async () => {
    try {
      try {
        const response = await api.get('/compliance/recommendations/all');
        console.log('Raw recommendations data from API:', response.data);
        
        // Transform snake_case to camelCase
        return response.data.map(item => ({
          id: item.id,
          ruleId: item.rule_id,
          nonComplianceType: item.non_compliance_type,
          recommendationText: item.recommendation_text,
          priority: item.priority,
          calculatorType: item.calculator_type
        }));
      } catch (error) {
        console.warn('API endpoint failed, trying direct endpoint', error);
        const directResponse = await axios.get(`${DIRECT_API_URL}/compliance/recommendations/all`);
        console.log('Raw recommendations data from direct endpoint:', directResponse.data);
        
        // Transform snake_case to camelCase
        return directResponse.data.map(item => ({
          id: item.id,
          ruleId: item.rule_id,
          nonComplianceType: item.non_compliance_type,
          recommendationText: item.recommendation_text,
          priority: item.priority,
          calculatorType: item.calculator_type
        }));
      }
    } catch (error) {
      console.error('Error fetching compliance recommendations:', error);
      return [];
    }
  },

  /**
   * Get standards grouped by standard_type
   * @returns {Promise<Object>} Standards grouped by type
   */
  getStandardsByType: async () => {
    try {
      const standards = await pecStandardsService.getAllBuildingTypeStandards();
      
      // Group standards by standard_type
      const groupedStandards = standards.reduce((acc, standard) => {
        const type = standard.standardType;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(standard);
        return acc;
      }, {});
      
      return groupedStandards;
    } catch (error) {
      console.error('Error grouping standards by type:', error);
      return {};
    }
  },

  /**
   * Get PEC standards formatted for the StandardsReference component
   * @returns {Promise<Array>} List of standards in the format expected by StandardsReference
   */
  getFormattedStandards: async () => {
    try {
      const groupedStandards = await pecStandardsService.getStandardsByType();
      
      // Create a PEC standard object that conforms to the Standard interface
      const pecStandard = {
        id: 'pec-2017',
        code_name: 'PEC 2017',
        full_name: 'Philippine Electrical Code (2017 Edition)',
        version: '2017',
        issuing_body: 'Philippine Electrical Code',
        description: 'Standards and guidelines for electrical systems in the Philippines'
      };
      
      // Return array with the PEC standard
      return [pecStandard];
    } catch (error) {
      console.error('Error formatting PEC standards:', error);
      return [];
    }
  },

  /**
   * Get sections for a standard (implements the same interface as StandardsService)
   * @param {string} standardId - The standard ID
   * @param {string} parentId - Optional parent section ID
   * @returns {Promise<Array>} List of sections
   */
  getSections: async (standardId, parentId) => {
    // Only handle the PEC standard
    if (standardId !== 'pec-2017') {
      return [];
    }

    try {
      // If no parent ID, return top-level standard types
      if (!parentId) {
        const groupedStandards = await pecStandardsService.getStandardsByType();
        
        // Convert each standard type into a "section"
        return Object.keys(groupedStandards).map(type => ({
          id: `pec-type-${type}`,
          standard_id: 'pec-2017',
          section_number: type.toUpperCase(),
          title: formatStandardType(type),
          parent_section_id: null,
          has_tables: false,
          has_figures: false
        }));
      }
      
      // If parent ID starts with pec-type-, it's a standard type
      if (parentId.startsWith('pec-type-')) {
        const type = parentId.replace('pec-type-', '');
        const groupedStandards = await pecStandardsService.getStandardsByType();
        const standards = groupedStandards[type] || [];
        
        // Convert standards of this type into "sections"
        return standards.map(standard => ({
          id: `pec-standard-${standard.id}`,
          standard_id: 'pec-2017',
          section_number: standard.standardCode,
          title: standard.description,
          parent_section_id: parentId,
          has_tables: true, // Set to true so clicking will view the details
          has_figures: false,
          // Store the original standard data to use in the detail view
          standard_data: standard
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error getting PEC sections:', error);
      return [];
    }
  },

  /**
   * Get section by ID (implements the same interface as StandardsService)
   * @param {string} id - The section ID
   * @returns {Promise<Object>} The section details
   */
  getSectionById: async (id) => {
    try {
      // Check if this is a PEC standard ID
      if (id.startsWith('pec-standard-')) {
        const standardId = id.replace('pec-standard-', '');
        const allStandards = await pecStandardsService.getAllBuildingTypeStandards();
        const standard = allStandards.find(s => s.id.toString() === standardId);
        
        if (standard) {
          // Format the section content based on the standard data
          return {
            id,
            standard_id: 'pec-2017',
            section_number: standard.standardCode,
            title: standard.description,
            content: formatStandardContent(standard),
            parent_section_id: `pec-type-${standard.standardType}`,
            has_tables: true,
            has_figures: false,
            tables: [{
              id: `table-${standard.id}`,
              table_number: '1',
              title: 'Standard Details',
              content: {
                headers: ['Property', 'Value'],
                rows: [
                  ['Building Type', standard.buildingType],
                  ['Standard Type', standard.standardType],
                  ['Standard Code', standard.standardCode],
                  ['Minimum Value', standard.minimumValue],
                  ['Maximum Value', standard.maximumValue],
                  ['Unit', standard.unit],
                  ['Description', standard.description]
                ]
              }
            }]
          };
        }
      }
      
      // Default empty section
      return {
        id,
        standard_id: 'pec-2017',
        section_number: 'N/A',
        title: 'Section not found',
        content: 'The requested section could not be found.',
        parent_section_id: null,
        has_tables: false,
        has_figures: false
      };
    } catch (error) {
      console.error('Error getting PEC section by ID:', error);
      return {
        id,
        standard_id: 'pec-2017',
        section_number: 'ERROR',
        title: 'Error retrieving section',
        content: 'An error occurred while retrieving this section.',
        parent_section_id: null,
        has_tables: false,
        has_figures: false
      };
    }
  }
};

/**
 * Format a standard type string into a readable title
 * @param {string} type - The standard type
 * @returns {string} Formatted title
 */
function formatStandardType(type) {
  switch (type) {
    case 'illumination':
      return 'Illumination Standards';
    case 'lightning_protection':
      return 'Lightning Protection Standards';
    case 'power_distribution':
      return 'Power Distribution Standards';
    case 'electrical_safety':
      return 'Electrical Safety Standards';
    case 'conductor_ampacity':
      return 'Conductor Ampacity Standards';
    case 'lighting_power_density':
      return 'Lighting Power Density Standards';
    case 'safety':
      return 'Safety Standards';
    default:
      return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
}

/**
 * Format standard content in HTML for display
 * @param {Object} standard - The standard object
 * @returns {string} HTML content
 */
function formatStandardContent(standard) {
  return `
    <div class="standard-content">
      <h2>${standard.standardCode}</h2>
      <p><strong>Description:</strong> ${standard.description}</p>
      
      <h3>Requirements</h3>
      <ul>
        ${standard.minimumValue ? `<li><strong>Minimum Value:</strong> ${standard.minimumValue} ${standard.unit || ''}</li>` : ''}
        ${standard.maximumValue ? `<li><strong>Maximum Value:</strong> ${standard.maximumValue} ${standard.unit || ''}</li>` : ''}
        ${!standard.minimumValue && !standard.maximumValue ? `<li>No specific numerical requirements</li>` : ''}
      </ul>
      
      <h3>Application</h3>
      <p>This standard applies to <strong>${standard.buildingType === 'all' ? 'all building types' : standard.buildingType}</strong>.</p>
      
      <div class="standard-metadata">
        <p><em>Standard Type: ${standard.standardType}</em></p>
        <p><em>Standard Code: ${standard.standardCode}</em></p>
      </div>
    </div>
  `;
}

export default pecStandardsService; 