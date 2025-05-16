import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, NotificationPreferences, NotificationType } from '../types';
import api from '../services/api';
import { useAuthContext } from './AuthContext';
import axios from 'axios';

interface UserContextType {
  users: User[];
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  setNotificationPreferences: (prefs: NotificationPreferences) => void;
  fetchUsers: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUserContext = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUserContext must be used within UserProvider');
  return ctx;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser: authUser } = useAuthContext();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Set current user from auth
  useEffect(() => {
    if (authUser) {
      setCurrentUser(authUser);
    }
  }, [authUser]);

  // Fetch all users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use debug endpoint that we know works (based on server logs)
      try {
        console.log('Attempting to fetch users via debug endpoint');
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
        // Remove any trailing /api to get base URL
        const cleanBaseUrl = baseUrl.endsWith('/api') 
          ? baseUrl.substring(0, baseUrl.length - 4) 
          : baseUrl;
        
        // Try the debug endpoint which returns users directly from the database
        const response = await axios.get(`${cleanBaseUrl}/debug/users`);
        
        if (response.data && response.data.success && response.data.users) {
          // Format matches our expected format
          setUsers(response.data.users);
          console.log(`Successfully fetched ${response.data.users.length} users`);
        } else {
          throw new Error('Invalid response format from debug endpoint');
        }
      } catch (debugErr) {
        console.error('Debug endpoint also failed:', debugErr);
        setError('Failed to fetch users. Please check server logs.');
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users on component mount if authenticated
  useEffect(() => {
    if (authUser?.role === UserRole.ADMIN) {
      fetchUsers();
    }
  }, [authUser]);

  const setNotificationPreferences = async (prefs: NotificationPreferences) => {
    if (!currentUser) return;
    
    try {
      await api.put(`/users/${currentUser.id}/notifications`, { preferences: prefs });
      setCurrentUser(prev => prev ? { ...prev, notificationPreferences: prefs } : null);
    } catch (err) {
      console.error('Failed to update notification preferences:', err);
    }
  };

  return (
    <UserContext.Provider value={{ 
      users, 
      currentUser, 
      setCurrentUser, 
      setNotificationPreferences,
      fetchUsers,
      loading,
      error
    }}>
      {children}
    </UserContext.Provider>
  );
}; 