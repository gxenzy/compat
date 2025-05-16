import api from './api';
import { User, UserRole } from '../types';
import jwt_decode from 'jwt-decode';
import { apiConfig } from '../config/database';

interface LoginResponse {
  token: string;
  user: User;
}

interface TokenPayload {
  id: string;
  username: string;
  role: UserRole;
  exp: number;
}

// Login function
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const loginData = { username, password };
  
  console.log('💡 AUTH SERVICE: Starting login attempt...');
  
  try {
    // Use the configured API URL or default to relative path
    const loginEndpoint = '/api/auth/login';
    console.log(`💡 AUTH SERVICE: Using login endpoint: ${loginEndpoint}`);
    
    const axios = (await import('axios')).default;
    
    // Enhance login request with clear error handling
    try {
      const response = await axios.post(loginEndpoint, loginData, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      console.log(`💡 AUTH SERVICE: Login response status:`, response.status);
      
      if (!response.data) {
        console.error('💡 AUTH SERVICE: Empty response from server');
        throw new Error('Empty response received from server');
      }
      
      if (!response.data.token) {
        console.error('💡 AUTH SERVICE: No token in response');
        throw new Error('No token received from server');
      }
      
      // Store authentication data
      console.log('💡 AUTH SERVICE: Storing authentication data');
      localStorage.setItem('token', response.data.token);
      
      if (response.data.user) {
        localStorage.setItem('currentUser', JSON.stringify(response.data.user));
      } else {
        console.warn('💡 AUTH SERVICE: No user data in response');
      }
      
      return {
        token: response.data.token,
        user: response.data.user
      };
    } catch (axiosError: any) {
      console.error('💡 AUTH SERVICE: Axios request failed:', axiosError.message);
      throw axiosError;
    }
  } catch (error: any) {
    console.error(`💡 AUTH SERVICE: Login failed:`, error);
    
    // Provide helpful error messages based on the error type
    if (error.message?.includes('Network Error')) {
      throw new Error('Cannot connect to server. Please check if the server is running.');
    }
    
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error ||
                        error.message ||
                        'Login failed. Please try again.';
    
    throw new Error(errorMessage);
  }
};

/**
 * Logout user - client-side only
 */
export const logout = async (): Promise<void> => {
  // Clean up local storage immediately - this is the most important part
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  
  // We're not attempting server communication anymore as it's not reliable
  console.log('AUTH SERVICE: Performed client-side logout');
};

/**
 * Register a new user
 */
export const register = async (userData: Partial<User>, password: string): Promise<User> => {
  const response = await api.post<User>('/auth/register', { ...userData, password });
  return response.data;
};

/**
 * Update user profile
 */
export const updateUser = async (userId: string, userData: Partial<User>): Promise<User> => {
  const response = await api.put<User>(`/users/${userId}`, userData);
  return response.data;
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  await api.post('/auth/reset-password', { email });
};

/**
 * Reset password with token
 */
export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  await api.post('/auth/reset-password/confirm', { token, newPassword });
};

/**
 * Verify if token is valid and return user info
 */
export const verifyToken = async (): Promise<User | null> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return null;
    }
    
    try {
      // Decode the token to check expiration
      const decoded: any = jwt_decode(token);
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired
      if (decoded.exp < currentTime) {
        console.log('Token is expired');
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        return null;
      }
      
      // Try to get user info from API
      const response = await api.get<User>('/auth/verify');
      localStorage.setItem('currentUser', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      return null;
    }
  } catch (error) {
    console.error('General error during token verification:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    return null;
  }
};

/**
 * Get token expiration from JWT
 */
export const getTokenExpiration = (): Date | null => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = jwt_decode<TokenPayload>(token);
    return new Date(decoded.exp * 1000);
  } catch (error) {
    console.error('Error decoding token', error);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (): boolean => {
  const expiration = getTokenExpiration();
  
  if (!expiration) {
    return true;
  }
  
  return expiration < new Date();
};

/**
 * Get current authenticated user from localStorage
 */
export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem('currentUser');
  
  if (!userJson) {
    return null;
  }
  
  try {
    return JSON.parse(userJson) as User;
  } catch (error) {
    console.error('Error parsing user data', error);
    return null;
  }
};

/**
 * Check if the current token is valid and not expired
 */
export const isTokenValid = (): boolean => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    const decoded: any = jwt_decode(token);
    const currentTime = Date.now() / 1000;
    
    // Check if token is expired
    if (decoded.exp < currentTime) {
      console.log('Token is expired');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error decoding token:', error);
    return false;
  }
};

export default {
  login,
  register,
  logout,
  getCurrentUser,
  isTokenValid
}; 