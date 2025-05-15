import { useState, useEffect } from 'react';
import useEnergyAuditRealTime, { WebSocketEvent, UserPresence } from './useEnergyAuditRealTime';

// Define ActivityLogEvent interface directly
export interface ActivityLogEvent {
  id: string;
  type: string;
  message: string;
  userId: string;
  userName: string;
  timestamp: number | string;
  details?: any;
}

/**
 * Custom hook to combine real-time features with activity tracking
 * (Local version to resolve import issues)
 */
const useEnergyAuditRealTimeActivity = (auditId: string) => {
  const realTimeState = useEnergyAuditRealTime(auditId);
  
  const [recentActivities, setRecentActivities] = useState<ActivityLogEvent[]>([]);
  const [recentCollaborators, setRecentCollaborators] = useState<UserPresence[]>([]);
  const [isCollaborating, setIsCollaborating] = useState(false);

  useEffect(() => {
    // Track when other users join
    if (realTimeState.activeUsers.length > 1) {
      setIsCollaborating(true);
      // Filter users whose userId isn't the current user (mock ID '1')
      const filteredUsers: UserPresence[] = realTimeState.activeUsers
        .filter(u => u.userId !== '1')
        .map(u => ({
          userId: u.userId,
          userName: u.userName,
          role: u.role,
          status: u.status,
          lastActivity: u.lastActivity
        }));
      setRecentCollaborators(filteredUsers);
    } else {
      setIsCollaborating(false);
    }
  }, [realTimeState.activeUsers]);

  useEffect(() => {
    // Add new events to activity log
    if (realTimeState.lastEvent && realTimeState.lastEvent.type !== 'heartbeat') {
      const newActivity: ActivityLogEvent = {
        id: (realTimeState.lastEvent as any).id || `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: realTimeState.lastEvent.timestamp || Date.now(),
        type: realTimeState.lastEvent.type,
        message: `${realTimeState.lastEvent.userName || 'Unknown User'} performed ${realTimeState.lastEvent.type}`,
        userId: realTimeState.lastEvent.userId || 'unknown-user',
        userName: realTimeState.lastEvent.userName || 'Unknown User',
        details: realTimeState.lastEvent.data
      };

      setRecentActivities(prev => [newActivity, ...prev].slice(0, 50)); // Keep last 50 activities
    }
  }, [realTimeState.lastEvent]);

  // Log an activity
  const logAuditActivity = (
    action: string,
    message: string,
    details?: any
  ): void => {
    const activityEvent: ActivityLogEvent = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      type: action,
      message,
      userId: '1', // Current user ID would be in a real app
      userName: 'Current User', // Current user name would be in a real app
      details
    };

    // Add to local state
    setRecentActivities(prev => [activityEvent, ...prev].slice(0, 50));

    // In a real implementation, send to server
    console.log('Activity logged:', action, message);
  };

  // Set user online status with optional activity parameter
  const setUserStatus = (status: 'online' | 'away' | 'offline', activity?: string): void => {
    realTimeState.updateUserPresence(status, activity);
  };

  return {
    ...realTimeState,
    recentActivities,
    recentCollaborators,
    isCollaborating,
    logAuditActivity,
    setUserStatus
  };
};

export default useEnergyAuditRealTimeActivity; 