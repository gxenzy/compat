/**
 * Debugging utilities for the client application
 */

// Set to true to enable debugging
const DEBUG_ENABLED = true;

/**
 * Log debug information to the console
 * @param {string} context - The context or component name
 * @param {string} message - The message to log
 * @param {any} data - Optional data to log
 */
export const debugLog = (context, message, data = null) => {
  if (!DEBUG_ENABLED) return;
  
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${context}]`;
  
  if (data) {
    console.log(`${prefix} ${message}`, data);
  } else {
    console.log(`${prefix} ${message}`);
  }
};

/**
 * Log API call information
 * @param {string} method - The HTTP method (GET, POST, etc.)
 * @param {string} endpoint - The API endpoint
 * @param {any} requestData - Optional request data
 * @param {any} responseData - Optional response data
 * @param {Error} error - Optional error object
 */
export const debugAPI = (method, endpoint, requestData = null, responseData = null, error = null) => {
  if (!DEBUG_ENABLED) return;
  
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [API]`;
  
  if (error) {
    console.error(`${prefix} ${method} ${endpoint} FAILED:`, error);
    if (requestData) {
      console.error(`${prefix} Request data:`, requestData);
    }
    return;
  }
  
  console.log(`${prefix} ${method} ${endpoint} - Request:`, requestData || 'No request data');
  
  if (responseData) {
    console.log(`${prefix} ${method} ${endpoint} - Response:`, responseData);
  }
};

/**
 * Dump state for debugging
 * @param {string} componentName - The name of the component
 * @param {Object} state - The state object to dump
 */
export const debugState = (componentName, state) => {
  if (!DEBUG_ENABLED) return;
  
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${componentName}] State:`, state);
};

export default {
  debugLog,
  debugAPI,
  debugState
}; 