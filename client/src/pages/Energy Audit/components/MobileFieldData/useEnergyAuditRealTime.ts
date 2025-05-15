import { useState, useEffect, useCallback } from 'react';

// Define WebSocketEvent type for testing
export interface WebSocketEvent<T = any> {
  type: string;
  auditId: string;
  timestamp: string;
  userId: string;
  userName: string;
  data: T;
}

// Update User interface with needed properties
export interface User {
  id: string;
  userId: string;
  userName: string;
  name: string;
  role: string;
  status: 'online' | 'away' | 'offline';
  currentView?: string;
  lastActivity?: string;
}

// Define UserPresence separate type
export interface UserPresence {
  userId: string;
  userName: string;
  role: string;
  status: 'online' | 'away' | 'offline';
  currentView?: string;
  lastActivity?: string;
}

interface UseEnergyAuditRealTimeReturn {
  isConnected: boolean;
  activeUsers: User[];
  lastEvent: WebSocketEvent | null;
  syncStatus: 'syncing' | 'synced' | 'error';
  subscribeToEvent: <T>(eventType: string, callback: (event: WebSocketEvent<T>) => void) => () => void;
  refreshWithNotification: (message?: string) => Promise<boolean>;
  updateUserPresence: (status: 'online' | 'away' | 'offline', activity?: string) => void;
  notifySyncCompleted: (message?: string) => void;
}

/**
 * Hook for real-time energy audit data updates and synchronization
 * (Local version to resolve import issues)
 */
const useEnergyAuditRealTime = (auditId?: string): UseEnergyAuditRealTimeReturn => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'error'>('synced');
  
  // Initialize connection when the hook is mounted
  useEffect(() => {
    if (auditId) {
      // Connect to WebSocket in real implementation
      setIsConnected(true);
      
      // Simulate active users for demo
      setActiveUsers([
        {
          id: '1',
          userId: '1',
          userName: 'Current User',
          name: 'Current User',
          role: 'admin',
          status: 'online',
          currentView: 'fieldData',
          lastActivity: new Date().toISOString()
        },
        {
          id: '2',
          userId: '2',
          userName: 'John Doe',
          name: 'John Doe',
          role: 'editor',
          status: 'online',
          currentView: 'dashboard',
          lastActivity: new Date().toISOString()
        }
      ]);
    }
    
    return () => {
      // Disconnect when component unmounts
      setIsConnected(false);
    };
  }, [auditId]);
  
  /**
   * Subscribe to real-time events
   */
  const subscribeToEvent = useCallback(<T>(
    eventType: string, 
    callback: (event: WebSocketEvent<T>) => void
  ) => {
    // In a real implementation, would register with WebSocket service
    
    // Return unsubscribe function
    return () => {
      // Unsubscribe implementation
    };
  }, []);
  
  /**
   * Refresh data with notification
   */
  const refreshWithNotification = useCallback(async (message?: string): Promise<boolean> => {
    try {
      setSyncStatus('syncing');
      
      // Simulating API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Notify others about the refresh
      const event: WebSocketEvent = {
        type: 'refresh',
        auditId: auditId || '',
        timestamp: new Date().toISOString(),
        userId: '1',
        userName: 'Current User',
        data: { message: message || 'Data refreshed' }
      };
      
      setLastEvent(event);
      setSyncStatus('synced');
      return true;
    } catch (error) {
      console.error('Error refreshing data:', error);
      setSyncStatus('error');
      return false;
    }
  }, [auditId]);

  /**
   * Update user presence information
   */
  const updateUserPresence = useCallback((status: 'online' | 'away' | 'offline', activity?: string): void => {
    // Would send presence update to server in a real implementation
    console.log(`User status updated to ${status}${activity ? ` (${activity})` : ''}`);
    
    // Update local user state
    setActiveUsers(prev => 
      prev.map(user => 
        user.id === '1' 
          ? { 
              ...user, 
              status, 
              currentView: activity || user.currentView,
              lastActivity: new Date().toISOString()
            } 
          : user
      )
    );
  }, []);

  /**
   * Notify sync completed
   */
  const notifySyncCompleted = useCallback((message?: string): void => {
    // Would send sync completed notification in a real implementation
    console.log(`Sync completed${message ? `: ${message}` : ''}`);
    setSyncStatus('synced');
    
    // Create a sync event
    const event: WebSocketEvent = {
      type: 'sync_completed',
      auditId: auditId || '',
      timestamp: new Date().toISOString(),
      userId: '1',
      userName: 'Current User',
      data: { message: message || 'Sync completed' }
    };
    
    setLastEvent(event);
  }, [auditId]);
  
  return {
    isConnected,
    activeUsers,
    lastEvent,
    syncStatus,
    subscribeToEvent,
    refreshWithNotification,
    updateUserPresence,
    notifySyncCompleted
  };
};

export default useEnergyAuditRealTime; 