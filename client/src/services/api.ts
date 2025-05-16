import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { apiConfig } from '../config/database';

// In development, use empty baseURL to leverage the proxy
// In production, use the configured API URL
const isDevelopment = process.env.NODE_ENV === 'development';
const BASE_URL = isDevelopment ? '' : apiConfig.baseUrl;

console.log(`🔌 API Service: Using ${isDevelopment ? 'proxy' : BASE_URL}`);

const MAX_RETRIES = apiConfig.retries;
const RETRY_DELAY = 1000; // 1 second

class EnhancedError extends Error {
  response?: any;
  status?: number;
  originalError?: AxiosError;

  constructor(message: string) {
    super(message);
    this.name = 'EnhancedError';
    Object.setPrototypeOf(this, EnhancedError.prototype);
  }
}

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: number;
}

interface ErrorResponse {
  message?: string;
  error?: string;
  code?: string;
  expiredAt?: Date;
}

// Create a global axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: apiConfig.timeout,
});

// Get token from storage
const getToken = () => {
  return localStorage.getItem('token');
};

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    // Log all API requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📣 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    // Don't add auth token for login requests
    if (config.url && 
        (config.url.includes('/auth/login') || 
         config.url.includes('/api/auth/login'))) {
      console.log('🔑 Skipping auth token for login request');
      return config;
    }
    
    // Get token
    const token = getToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // In development with proxy, ensure path starts with /api
    if (isDevelopment && config.url) {
      // Make sure URL starts with /api
      if (!config.url.startsWith('/api/')) {
        config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
      }
      console.log(`📣 API Request URL: ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Single comprehensive response interceptor
api.interceptors.response.use(
  (response) => {
    // Log all API responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error: AxiosError<ErrorResponse>) => {
    if (!error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryConfig;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      console.warn('Authentication error - invalid or expired token');
      // Clear token on auth error
      localStorage.removeItem('token');
    }

    // If the error is a network error or the server is not responding
    if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
      if (!originalRequest._retry || originalRequest._retry < MAX_RETRIES) {
        originalRequest._retry = (originalRequest._retry || 0) + 1;
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        
        console.log(`Retrying request (${originalRequest._retry}/${MAX_RETRIES})...`);
        return api(originalRequest);
      }
    }

    // Format error message for better handling
    const errorMessage = error.response?.data?.message 
      || error.response?.data?.error
      || error.message 
      || 'An unexpected error occurred';

    // Add more context to the error
    const enhancedError = new EnhancedError(errorMessage);
    enhancedError.response = error.response;
    enhancedError.status = error.response?.status;
    enhancedError.originalError = error;

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`API Error: ${error.response?.status || 'Network Error'} ${originalRequest.url}`, 
        error.response?.data || error.message);
    }

    return Promise.reject(enhancedError);
  }
);

export default api; 