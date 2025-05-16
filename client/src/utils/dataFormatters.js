/**
 * Utility functions for data format transformations
 */

/**
 * Converts snake_case object keys to camelCase
 * @param {Object} data - Object with snake_case keys
 * @returns {Object} - Object with camelCase keys
 */
export const snakeToCamel = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => snakeToCamel(item));
  }
  
  return Object.keys(data).reduce((result, key) => {
    // Convert the key from snake_case to camelCase
    const camelKey = key.replace(/_([a-z])/g, (match, group) => group.toUpperCase());
    
    // Handle nested objects and arrays
    let value = data[key];
    if (value && typeof value === 'object') {
      value = snakeToCamel(value);
    }
    
    result[camelKey] = value;
    return result;
  }, {});
};

/**
 * Converts camelCase object keys to snake_case
 * @param {Object} data - Object with camelCase keys
 * @returns {Object} - Object with snake_case keys
 */
export const camelToSnake = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => camelToSnake(item));
  }
  
  return Object.keys(data).reduce((result, key) => {
    // Convert the key from camelCase to snake_case
    const snakeKey = key.replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`);
    
    // Handle nested objects and arrays
    let value = data[key];
    if (value && typeof value === 'object') {
      value = camelToSnake(value);
    }
    
    result[snakeKey] = value;
    return result;
  }, {});
};

/**
 * Ensures consistent object format regardless of input format
 * Works with both snake_case and camelCase properties
 * @param {Object} data - Object with either naming convention
 * @returns {Object} - Object with standardized camelCase properties
 */
export const normalizeDataFormat = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => normalizeDataFormat(item));
  }
  
  const result = {};
  
  // Building standards fields
  if ('building_type' in data || 'buildingType' in data) {
    result.buildingType = data.building_type || data.buildingType;
    result.standardType = data.standard_type || data.standardType;
    result.standardCode = data.standard_code || data.standardCode;
    result.minimumValue = data.minimum_value !== undefined ? data.minimum_value : 
                          data.minimumValue !== undefined ? data.minimumValue : null;
    result.maximumValue = data.maximum_value !== undefined ? data.maximum_value : 
                          data.maximumValue !== undefined ? data.maximumValue : null;
  }
  
  // Project standards fields
  if ('project_type' in data || 'projectType' in data) {
    result.projectType = data.project_type || data.projectType;
    result.standardType = data.standard_type || data.standardType;
    result.standardCode = data.standard_code || data.standardCode;
    result.minimumValue = data.minimum_value !== undefined ? data.minimum_value : 
                          data.minimumValue !== undefined ? data.minimumValue : null;
    result.maximumValue = data.maximum_value !== undefined ? data.maximum_value : 
                          data.maximumValue !== undefined ? data.maximumValue : null;
  }
  
  // Recommendation fields
  if ('rule_id' in data || 'ruleId' in data) {
    result.ruleId = data.rule_id || data.ruleId;
    result.nonComplianceType = data.non_compliance_type || data.nonComplianceType;
    result.recommendationText = data.recommendation_text || data.recommendationText;
    result.calculatorType = data.calculator_type || data.calculatorType;
  }
  
  // Common fields that should always be included
  result.id = data.id;
  result.unit = data.unit;
  result.description = data.description;
  result.priority = data.priority;
  
  return result;
}; 