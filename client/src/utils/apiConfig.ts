/**
 * API Configuration utility
 * This file provides a central place to manage API URL configuration
 */
import axios from 'axios';

// The base URL for all API calls
// In production, this would be set by environment variables
export const API_BASE_URL = 'http://localhost:8000/api';

// Create a configurable axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor to include authentication token
apiClient.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors gracefully
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response Success: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`API Response Error: ${error.config?.url} - ${error.message}`);
    return Promise.reject(error);
  }
);

// Standards API endpoints
export const STANDARDS_API = {
  // Base path for standards API
  BASE: `${API_BASE_URL}/standards-api`,
  
  // Standards endpoints
  STANDARDS: `${API_BASE_URL}/standards-api/standards`,
  STANDARD_BY_ID: (id: number) => `${API_BASE_URL}/standards-api/standards/${id}`,
  SECTIONS_BY_STANDARD: (standardId: number, parentId?: number) => 
    `${API_BASE_URL}/standards-api/standards/${standardId}/sections${parentId ? `?parentId=${parentId}` : ''}`,
  SECTION_BY_ID: (id: number) => `${API_BASE_URL}/standards-api/sections/${id}`,
  SEARCH_SECTIONS: (query: string) => `${API_BASE_URL}/standards-api/search/sections?q=${query}`,
  
  // Bookmarks endpoints
  USER_BOOKMARKS: (userId: number) => `${API_BASE_URL}/standards-api/users/${userId}/bookmarks`,
  ADD_BOOKMARK: `${API_BASE_URL}/standards-api/bookmarks`,
  REMOVE_BOOKMARK: (userId: number, sectionId: number) => 
    `${API_BASE_URL}/standards-api/users/${userId}/bookmarks/${sectionId}`,
    
  // Notes endpoints
  SECTION_NOTES: (userId: number, sectionId: number) => 
    `${API_BASE_URL}/standards-api/users/${userId}/sections/${sectionId}/notes`,
  ADD_NOTE: `${API_BASE_URL}/standards-api/notes`,
  UPDATE_NOTE: (noteId: number) => `${API_BASE_URL}/standards-api/notes/${noteId}`,
  DELETE_NOTE: (noteId: number) => `${API_BASE_URL}/standards-api/notes/${noteId}`,
  
  // Illumination lookup
  ILLUMINATION: (roomType: string) => 
    `${API_BASE_URL}/standards-api/lookup/illumination?roomType=${encodeURIComponent(roomType)}`,
};

// Compliance API endpoints
export const COMPLIANCE_API = {
  RULES: `${API_BASE_URL}/compliance/rules`,
  RULES_BY_ID: (id: number) => `${API_BASE_URL}/compliance/rules/${id}`,
  VERIFY: `${API_BASE_URL}/compliance/verify-calculation`,
  CHECKLISTS: `${API_BASE_URL}/compliance/checklists`,
  CHECKLIST_BY_ID: (id: number) => `${API_BASE_URL}/compliance/checklists/${id}`,
  UPDATE_CHECKLIST_STATUS: (id: number) => `${API_BASE_URL}/compliance/checklists/${id}/status`,
};

// Audit API endpoints
export const AUDIT_API = {
  TASKS: `${API_BASE_URL}/audit/tasks`,
  TASK_BY_ID: (id: number) => `${API_BASE_URL}/audit/tasks/${id}`,
};

// User API endpoints
export const USER_API = {
  BY_ROLES: (roles: string[]) => `${API_BASE_URL}/users/by-roles?roles=${roles.join(',')}`,
  ALL: `${API_BASE_URL}/users/all`,
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default {
  API_BASE_URL,
  STANDARDS_API,
  COMPLIANCE_API,
  AUDIT_API,
  USER_API,
  apiClient,
  getAuthHeaders
}; 