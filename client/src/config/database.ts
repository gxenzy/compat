import axios from 'axios';

/**
 * Database configuration using the environment variables
 */
export const dbConfig = {
  host: process.env.REACT_APP_DB_HOST || 'localhost',
  port: parseInt(process.env.REACT_APP_DB_PORT || '8000', 10),
  user: process.env.REACT_APP_DB_USER || 'sdmi',
  password: process.env.REACT_APP_DB_PASS || 'SMD1SQLADM1N',
  database: process.env.REACT_APP_DB_NAME || 'energyauditdb',
};

// Get the API URL with fallback - in development, we'll prefer empty baseUrl to leverage proxy
const isDevelopment = process.env.NODE_ENV === 'development';
const getApiUrl = () => {
  if (isDevelopment) {
    console.log('Development environment: Using proxy for API requests');
    return ''; // Empty baseUrl for proxy
  } else {
    // For production, use the environment variable
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
    console.log(`Production environment: Using API URL: ${apiUrl}`);
    return apiUrl;
  }
};

/**
 * API connection configuration
 */
export const apiConfig = {
  baseUrl: getApiUrl(),
  wsUrl: process.env.REACT_APP_WS_URL || 'ws://localhost:8000',
  timeout: 30000, // 30 seconds
  retries: 3,
};

/**
 * Database table schemas information
 */
export const dbTables = {
  users: 'users',
  userRoles: 'user_roles', 
  settings: 'settings',
  auditLogs: 'audit_logs',
  backups: 'backups',
  notifications: 'notifications',
  notificationPreferences: 'notification_preferences',
  activities: 'activities',
};

/**
 * Default pagination settings
 */
export const paginationDefaults = {
  limit: 20,
  page: 1,
};

export default {
  dbConfig,
  apiConfig,
  dbTables,
  paginationDefaults,
}; 