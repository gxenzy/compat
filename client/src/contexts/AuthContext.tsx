import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useHistory } from 'react-router-dom';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import { UserRole, NotificationPreferences, NotificationType } from '../types';

// Define user interface
export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
  profileImage?: string;
  lastLogin?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  notificationPreferences?: NotificationPreferences;
}

// Define auth context type
interface AuthContextType {
  currentUser: User | null;
  user: User | null; // Alias for currentUser for compatibility
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: Partial<User>, password: string) => Promise<boolean>;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
  resetPassword: (username: string) => Promise<boolean>;
  checkAuth: () => Promise<boolean>;
}

// Create auth context with default values
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  user: null,
  isAuthenticated: false,
  hasRole: () => false,
  loading: false,
  error: null,
  login: async () => false,
  logout: async () => {},
  register: async () => false,
  updateUser: async () => false,
  resetPassword: async () => false,
  checkAuth: async () => false
});

// Hook to use auth context
export const useAuthContext = () => useContext(AuthContext);

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const history = useHistory();

  // Check if user has a specific role
  const hasRole = (role: UserRole): boolean => {
    return currentUser?.role === role;
  };

  // Check authentication status on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (token) {
          console.log('Token found in localStorage, setting current user');
          // Get user data from localStorage instead of verifying with server
          const savedUser = localStorage.getItem('currentUser');
          if (savedUser) {
            try {
              const user = JSON.parse(savedUser);
              setCurrentUser(user);
              console.log('User restored from localStorage:', user.username);
            } catch (parseError) {
              console.error('Failed to parse user from localStorage', parseError);
              // Clear invalid data
              localStorage.removeItem('currentUser');
              localStorage.removeItem('token');
            }
          }
        } else {
          console.log('No token found in localStorage');
        }
      } catch (err) {
        console.error('Authentication error:', err);
        setError('Authentication failed. Please log in again.');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      console.log('Logging in with username:', username);
      const response = await authService.login(username, password);
      setCurrentUser(response.user);
      return true;
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid username or password. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    setLoading(true);

    try {
      // Remove token and user from localStorage immediately
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      
      // Always clear the user state
      setCurrentUser(null);
      
      // Navigate to login page without attempting server communication
      history.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear state and navigate to login
      setCurrentUser(null);
      history.push('/login');
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData: Partial<User>, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Call register API
      await authService.register(userData, password);
      return true;
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update current user's profile
   */
  const updateUser = async (userData: Partial<User>): Promise<boolean> => {
    if (!currentUser) {
      console.error('Cannot update user: No current user');
      return false;
    }
    
    try {
      setLoading(true);
      
      // Call updateUser service method
      const result = await userService.updateUser(currentUser.id, userData);
      
      // Extract user from result (new response format)
      const updatedUser = result.user;
      
      // Update user in state
      setCurrentUser(updatedUser);
      
      // Update user in storage with correct key
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      // If we used an emergency endpoint, show an indicator
      if (result.emergencyUsed) {
        console.log('Used emergency database update for user update');
        // We could dispatch an event or set a state here if needed
      }
      
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (email: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await authService.requestPasswordReset(email);
      return true;
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to request password reset. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Check authentication function
  const checkAuth = async (): Promise<boolean> => {
    if (authService.isTokenExpired()) {
      setCurrentUser(null);
      return false;
    }
    
    return !!currentUser;
  };

  // Context value
  const value = {
    currentUser,
    user: currentUser, // Add alias for currentUser
    isAuthenticated: !!currentUser,
    hasRole,
    loading,
    error,
    login,
    logout,
    register,
    updateUser,
    resetPassword,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
