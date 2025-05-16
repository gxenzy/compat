import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add authentication token
api.interceptors.request.use(
  config => {
    // Add authorization header if token exists in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for global error handling
api.interceptors.response.use(
  response => {
    // Log successful responses for debugging
    console.log(`API Response Success: ${response.status} - ${response.config.method.toUpperCase()} ${response.config.url}`);
    return response;
  },
  error => {
    // Log error responses for debugging
    if (error.response) {
      console.error(`API Error Response: ${error.response.status} - ${error.config.method.toUpperCase()} ${error.config.url}`);
      console.error('Response data:', error.response.data);
      
      // Handle specific error cases
      if (error.response.status === 401) {
        // Handle unauthorized (could redirect to login page)
        console.warn('Unauthorized request - token may be invalid or expired');
      }
      
    } else if (error.request) {
      console.error('API Request made but no response received:', error.request);
    } else {
      console.error('API Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api; 