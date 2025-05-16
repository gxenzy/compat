import axios from 'axios';
import { apiConfig } from '../config/database';
import api from './api';
import { snakeToCamel, camelToSnake, normalizeDataFormat } from '../utils/dataFormatters';

// API URL for fallback
const API_URL = 'http://localhost:8000/api';

// API URL for direct calls
const DIRECT_API_URL = 'http://localhost:8000';

console.log(`Compliance service using API instance with auth`);
console.log(`Compliance service using direct endpoints for CREATE operations`);

/**
 * Service for interacting with compliance verification endpoints
 */
const complianceService = {
  /**
   * Verify calculation results against compliance rules
   * @param {Object} calculationData - The calculation data to verify
   * @param {String} calculationType - The type of calculation
   * @param {String} calculationId - The ID of the calculation
   * @param {String} buildingType - Optional building type
   * @param {String} projectType - Optional project type
   * @returns {Promise<Object>} - Verification results
   */
  verifyCalculation: async (calculationData, calculationType, calculationId, buildingType, projectType) => {
    try {
      const response = await axios.post(`${API_URL}/compliance/verify-calculation`, {
        calculationData,
        calculationType,
        calculationId,
        buildingType,
        projectType
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get applicable rules for a calculation type
   * @param {String} calculationType - The type of calculation
   * @returns {Promise<Array>} - Array of applicable rules
   */
  getApplicableRules: async (calculationType) => {
    try {
      const response = await axios.get(`${API_URL}/compliance/rules`, {
        params: { calculationType }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get standards for a building type
   * @param {String} buildingType - The building type
   * @param {String} standardType - Optional standard type to filter by
   * @returns {Promise<Array>} - Array of standards
   */
  getBuildingTypeStandards: async (buildingType, standardType = null) => {
    try {
      const params = { buildingType };
      if (standardType) params.standardType = standardType;
      
      const response = await axios.get(`${API_URL}/compliance/building-standards`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get all building type standards
   * @returns {Promise<Array>} - Array of all building type standards
   */
  getAllBuildingTypeStandards: async () => {
    try {
      // Use the authenticated API instance
      const response = await api.get('/compliance/building-standards/all');
      console.log('Raw building standards data:', response.data);
      
      // Transform data using utility function
      return normalizeDataFormat(response.data);
    } catch (error) {
      console.error('Error getting building standards:', error);
      return []; // Return empty array instead of throwing error
    }
  },

  /**
   * Create a new building type standard
   * @param {Object} data - The building type standard data
   * @returns {Promise<Object>} - The created building type standard
   */
  createBuildingTypeStandard: async (data) => {
    try {
      // Transform data using utility function
      const transformedData = camelToSnake(data);
      
      console.log('Sending transformed data to backend:', transformedData);
      
      // Direct POST to the non-API prefixed URL
      const response = await axios.post(`${DIRECT_API_URL}/compliance/building-standards`, transformedData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Building standard created successfully, received:', response.data);
      
      // Transform response using utility function
      return normalizeDataFormat(response.data);
    } catch (error) {
      console.error('Error creating building standard:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Update a building type standard
   * @param {Number} id - The building type standard ID
   * @param {Object} data - The updated building type standard data
   * @returns {Promise<Object>} - The updated building type standard
   */
  updateBuildingTypeStandard: async (id, data) => {
    try {
      // Transform data using utility function
      const transformedData = camelToSnake(data);
      
      const response = await axios.put(`${API_URL}/compliance/building-standards/${id}`, transformedData);
      
      // Transform response using utility function
      return normalizeDataFormat(response.data);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Delete a building type standard
   * @param {Number} id - The building type standard ID
   * @returns {Promise<Object>} - The response data
   */
  deleteBuildingTypeStandard: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/compliance/building-standards/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get standards for a project type
   * @param {String} projectType - The project type
   * @param {String} standardType - Optional standard type to filter by
   * @returns {Promise<Array>} - Array of standards
   */
  getProjectTypeStandards: async (projectType, standardType = null) => {
    try {
      const params = { projectType };
      if (standardType) params.standardType = standardType;
      
      const response = await axios.get(`${API_URL}/compliance/project-standards`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get all project type standards
   * @returns {Promise<Array>} - Array of all project type standards
   */
  getAllProjectTypeStandards: async () => {
    try {
      // Use the authenticated API instance
      const response = await api.get('/compliance/project-standards/all');
      console.log('Raw project standards data:', response.data);
      
      // Transform data using utility function
      return normalizeDataFormat(response.data);
    } catch (error) {
      console.error('Error getting project standards:', error);
      return []; // Return empty array instead of throwing error
    }
  },

  /**
   * Create a new project type standard
   * @param {Object} data - The project type standard data
   * @returns {Promise<Object>} - The created project type standard
   */
  createProjectTypeStandard: async (data) => {
    try {
      // Transform data using utility function
      const transformedData = camelToSnake(data);
      
      const response = await axios.post(`${DIRECT_API_URL}/compliance/project-standards`, transformedData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Transform response using utility function
      return normalizeDataFormat(response.data);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update a project type standard
   * @param {Number} id - The project type standard ID
   * @param {Object} data - The updated project type standard data
   * @returns {Promise<Object>} - The updated project type standard
   */
  updateProjectTypeStandard: async (id, data) => {
    try {
      // Transform data using utility function
      const transformedData = camelToSnake(data);
      
      const response = await axios.put(`${API_URL}/compliance/project-standards/${id}`, transformedData);
      
      // Transform response using utility function
      return normalizeDataFormat(response.data);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Delete a project type standard
   * @param {Number} id - The project type standard ID
   * @returns {Promise<Object>} - The response data
   */
  deleteProjectTypeStandard: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/compliance/project-standards/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get recommendations for non-compliant results
   * @param {Object} options - Query options
   * @param {Number} options.ruleId - Optional rule ID
   * @param {String} options.calculatorType - Optional calculator type
   * @param {String} options.nonComplianceType - Optional non-compliance type
   * @returns {Promise<Array>} - Array of recommendations
   */
  getComplianceRecommendations: async ({ ruleId, calculatorType, nonComplianceType }) => {
    try {
      const params = {};
      if (ruleId) params.ruleId = ruleId;
      if (calculatorType) params.calculatorType = calculatorType;
      if (nonComplianceType) params.nonComplianceType = nonComplianceType;
      
      const response = await axios.get(`${API_URL}/compliance/recommendations`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get all compliance recommendations
   * @returns {Promise<Array>} - Array of all compliance recommendations
   */
  getAllComplianceRecommendations: async () => {
    try {
      const response = await api.get('/compliance/recommendations/all');
      console.log('Raw recommendations data:', response.data);
      
      // Transform data using utility function
      return normalizeDataFormat(response.data);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return []; // Return empty array instead of throwing error
    }
  },

  /**
   * Create a new compliance recommendation
   * @param {Object} data - The recommendation data
   * @returns {Promise<Object>} - The created recommendation
   */
  createComplianceRecommendation: async (data) => {
    try {
      // Transform data using utility function
      const transformedData = camelToSnake(data);
      
      const response = await axios.post(`${DIRECT_API_URL}/compliance/recommendations`, transformedData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Transform response using utility function
      return normalizeDataFormat(response.data);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update a compliance recommendation
   * @param {Number} id - The recommendation ID
   * @param {Object} data - The updated recommendation data
   * @returns {Promise<Object>} - The updated recommendation
   */
  updateComplianceRecommendation: async (id, data) => {
    try {
      // Transform data using utility function
      const transformedData = camelToSnake(data);
      
      const response = await axios.put(`${API_URL}/compliance/recommendations/${id}`, transformedData);
      
      // Transform response using utility function
      return normalizeDataFormat(response.data);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Delete a compliance recommendation
   * @param {Number} id - The compliance recommendation ID
   * @returns {Promise<Object>} - The response data
   */
  deleteComplianceRecommendation: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/compliance/recommendations/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get verification history for the authenticated user
   * @returns {Promise<Array>} - Array of verification history entries
   */
  getVerificationHistory: async () => {
    try {
      const response = await axios.get(`${API_URL}/compliance/verification-history`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get compliance rules with optional filters
   */
  getRules: async (params = {}) => {
    try {
      // Try to fetch from API first
      try {
        const response = await axios.get(`${API_URL}/compliance/rules`, { 
          params,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        return response.data;
      } catch (apiError) {
        console.warn('API fetch failed, using mock rules data:', apiError);
        // Return mock data as fallback
        return [
          {
            id: 1,
            section_id: 101,
            rule_code: "PEC-2017-1.3.1",
            title: "Wiring Methods and Materials",
            description: "All wiring methods and materials shall comply with the specified requirements.",
            severity: "major",
            type: "mandatory",
            verification_method: "Visual inspection",
            evaluation_criteria: "All wiring must be installed according to Table 2.1",
            failure_impact: "Safety hazard and code violation",
            remediation_advice: "Replace with compliant wiring methods",
            active: true,
            created_at: "2023-01-15T08:30:00Z",
            updated_at: null,
            section_number: "1.3",
            section_title: "General Requirements",
            standard_code: "PEC-2017"
          },
          {
            id: 2,
            section_id: 202,
            rule_code: "PEEP-2020-LT1",
            title: "Lighting Efficiency Requirements",
            description: "All lighting installations must meet minimum efficiency standards.",
            severity: "critical",
            type: "performance",
            verification_method: "Measurement and calculation",
            evaluation_criteria: "Minimum 80 lm/W for all general lighting",
            failure_impact: "Energy waste and non-compliance with efficiency standards",
            remediation_advice: "Replace with LED fixtures meeting required efficiency",
            active: true,
            created_at: "2023-02-20T10:15:00Z",
            updated_at: null,
            section_number: "2.0",
            section_title: "Lighting Systems",
            standard_code: "PEEP"
          }
        ];
      }
    } catch (error) {
      console.error('Error fetching compliance rules:', error);
      throw error;
    }
  }
};

export default complianceService; 