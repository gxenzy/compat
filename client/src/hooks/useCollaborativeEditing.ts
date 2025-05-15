import { useState, useEffect, useCallback, useRef } from 'react';
import useEnergyAuditRealTime, { UserPresence } from './useEnergyAuditRealTime';
import energyAuditWebSocketService from '../services/energyAuditWebSocketService';
import { useAuthContext } from '../contexts/AuthContext';

export interface EditorState {
  isEditing: boolean;
  currentEditor: string | null;
  lockedBy: string | null;
  lockedUntil: Date | null;
  otherEditors: string[];
  isLockExpired: boolean;
}

export interface LockInfo {
  resourceId: string;
  resourceType: 'audit' | 'finding' | 'dataPoint' | 'area' | 'comment' | 'document';
  userId: string;
  userName: string;
  lockedAt: Date;
  lockDuration: number; // in minutes
  lockVersion?: number;
}

/**
 * Hook for managing collaborative editing with lock mechanisms
 * 
 * Allows coordinating editing between multiple users with conflict prevention
 */
function useCollaborativeEditing(
  resourceId?: string, 
  resourceType: 'audit' | 'finding' | 'dataPoint' | 'area' | 'comment' | 'document' = 'audit',
  autoAcquireLock: boolean = false
) {
  const { currentUser } = useAuthContext();
  const userId = currentUser?.id || 'anonymous';
  const userName = currentUser?.name || 'Anonymous User';
  
  const { activeUsers, updateUserPresence } = useEnergyAuditRealTime(
    resourceId || ''
  );
  
  const [editorState, setEditorState] = useState<EditorState>({
    isEditing: false,
    currentEditor: null,
    lockedBy: null,
    lockedUntil: null,
    otherEditors: [],
    isLockExpired: false
  });
  
  const [lockInfo, setLockInfo] = useState<LockInfo | null>(null);
  
  // Keep track of timeouts to clear them on unmount
  const lockTimeoutRef = useRef<number | null>(null);
  const lockRefreshIntervalRef = useRef<number | null>(null);
  
  // Clear all timeouts on unmount
  useEffect(() => {
    return () => {
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current);
        lockTimeoutRef.current = null;
      }
      
      if (lockRefreshIntervalRef.current) {
        clearInterval(lockRefreshIntervalRef.current);
        lockRefreshIntervalRef.current = null;
      }
    };
  }, []);

  // Set up lock events handlers
  useEffect(() => {
    if (!resourceId) return;

    // Set up handler for events from the websocket service
    const handleEvent = (event: any) => {
      if (!event || !event.type) return;
      
      if (event.type === 'editLock') {
        const lockData = event.data;
        
        // Only process events for our resource
        if (lockData.resourceId !== resourceId || lockData.resourceType !== resourceType) {
          return;
        }
        
        // Set locked status if someone else locked it
        if (lockData.userId !== userId) {
          const lockExpiryTime = new Date(new Date(lockData.lockedAt).getTime() + lockData.lockDuration * 60000);
          
          setEditorState(prev => ({
            ...prev,
            lockedBy: lockData.userId,
            lockedUntil: lockExpiryTime,
            otherEditors: [...prev.otherEditors.filter(id => id !== lockData.userId), lockData.userId],
            isLockExpired: false
          }));
        }
      } 
      else if (event.type === 'editUnlock') {
        const unlockData = event.data;
        
        // Only process events for our resource
        if (unlockData.resourceId !== resourceId || unlockData.resourceType !== resourceType) {
          return;
        }
        
        // Clear lock if it was locked by the user who unlocked it
        if (editorState.lockedBy === unlockData.userId) {
          setEditorState(prev => ({
            ...prev,
            lockedBy: null,
            lockedUntil: null,
            otherEditors: prev.otherEditors.filter(id => id !== unlockData.userId),
            isLockExpired: false
          }));
        }
      }
    };
    
    // Add custom event methods to the service in case they don't exist yet
    if (typeof energyAuditWebSocketService.onEvent !== 'function') {
      energyAuditWebSocketService.onEvent = (handler: (event: any) => void): void => {
        console.log('Added event handler (mock)');
      };
    }
    
    if (typeof energyAuditWebSocketService.offEvent !== 'function') {
      energyAuditWebSocketService.offEvent = (handler: (event: any) => void): void => {
        console.log('Removed event handler (mock)');
      };
    }
    
    if (typeof energyAuditWebSocketService.sendEvent !== 'function') {
      energyAuditWebSocketService.sendEvent = (eventType: string, data: any): boolean => {
        console.log(`Sending event: ${eventType}`, data);
        return true;
      };
    }
    
    // Register event handler
    energyAuditWebSocketService.onEvent(handleEvent);
    
    return () => {
      // Unregister event handler
      energyAuditWebSocketService.offEvent(handleEvent);
      
      // Release lock when component unmounts
      if (editorState.isEditing && lockInfo && lockInfo.userId === userId) {
        releaseLock();
      }
    };
  }, [resourceId, resourceType, userId, editorState.lockedBy, editorState.isEditing, lockInfo]);
  
  // Auto-acquire lock if requested
  useEffect(() => {
    if (autoAcquireLock && resourceId && !editorState.isEditing && !editorState.lockedBy) {
      acquireLock().catch(console.error);
    }
  }, [autoAcquireLock, resourceId, editorState.isEditing, editorState.lockedBy]);

  // Set up lock expiry check
  useEffect(() => {
    if (!editorState.lockedUntil) return;
    
    const checkLockExpiry = () => {
      const now = new Date();
      if (editorState.lockedUntil && now > editorState.lockedUntil) {
        // Lock has expired
        setEditorState(prev => ({
          ...prev,
          isLockExpired: true
        }));
        
        // If it was our lock that expired, clean up
        if (lockInfo && lockInfo.userId === userId) {
          setLockInfo(null);
          
          if (editorState.isEditing) {
            setEditorState(prev => ({
              ...prev,
              isEditing: false,
              currentEditor: null
            }));
          }
        }
      }
    };
    
    // Check immediately and then set interval
    checkLockExpiry();
    const interval = setInterval(checkLockExpiry, 10000); // Check every 10 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, [editorState.lockedUntil, editorState.isEditing, lockInfo, userId]);

  // Check if current user has a valid lock
  const hasValidLock = useCallback((): boolean => {
    if (!lockInfo) return false;
    
    const now = new Date();
    const expiryTime = new Date(new Date(lockInfo.lockedAt).getTime() + lockInfo.lockDuration * 60000);
    
    return now < expiryTime && lockInfo.userId === userId;
  }, [lockInfo, userId]);

  // Check if resource is locked by someone else
  const isLockedByOthers = useCallback((): boolean => {
    if (!editorState.lockedBy || editorState.lockedBy === userId) return false;
    if (!editorState.lockedUntil) return false;
    
    const now = new Date();
    return now < editorState.lockedUntil && !editorState.isLockExpired;
  }, [editorState.lockedBy, editorState.lockedUntil, editorState.isLockExpired, userId]);

  // Acquire a lock for editing
  const acquireLock = useCallback(async (duration: number = 10): Promise<boolean> => {
    if (!resourceId) return false;
    
    // Check if already locked by others
    if (isLockedByOthers()) {
      return false;
    }
    
    // Create lock info
    const newLockInfo: LockInfo = {
      resourceId,
      resourceType,
      userId,
      userName,
      lockedAt: new Date(),
      lockDuration: duration,
      lockVersion: (lockInfo?.lockVersion || 0) + 1
    };
    
    // Send lock event through the websocket service
    energyAuditWebSocketService.sendEvent('editLock', newLockInfo);
    
    // Update local state
    setLockInfo(newLockInfo);
    setEditorState(prev => ({
      ...prev,
      isEditing: true,
      currentEditor: userId,
      isLockExpired: false
    }));
    
    // Update presence
    if (resourceType === 'audit' && resourceId) {
      updateUserPresence('online', 'editing');
    }
    
    // Set up automatic refresh of the lock every lockDuration/2 minutes
    if (lockRefreshIntervalRef.current) {
      clearInterval(lockRefreshIntervalRef.current);
    }
    
    // Auto-refresh the lock at 1/2 of the lock duration
    lockRefreshIntervalRef.current = window.setInterval(() => {
      refreshLock().catch(console.error);
    }, (duration * 60 * 1000) / 2);
    
    return true;
  }, [resourceId, resourceType, isLockedByOthers, userId, userName, lockInfo, updateUserPresence]);

  // Release a lock
  const releaseLock = useCallback(async (): Promise<boolean> => {
    if (!resourceId || !editorState.isEditing) return false;
    
    // Clean up refresh interval
    if (lockRefreshIntervalRef.current) {
      clearInterval(lockRefreshIntervalRef.current);
      lockRefreshIntervalRef.current = null;
    }
    
    // Send unlock event
    energyAuditWebSocketService.sendEvent('editUnlock', {
      resourceId,
      resourceType,
      userId
    });
    
    // Update local state
    setLockInfo(null);
    setEditorState(prev => ({
      ...prev,
      isEditing: false,
      currentEditor: null
    }));
    
    // Update presence
    if (resourceType === 'audit' && resourceId) {
      updateUserPresence('online', 'viewing');
    }
    
    return true;
  }, [resourceId, resourceType, userId, editorState.isEditing, updateUserPresence]);

  // Refresh an existing lock
  const refreshLock = useCallback(async (): Promise<boolean> => {
    if (!resourceId || !lockInfo || !hasValidLock()) return false;
    
    // Update lock info
    const refreshedLock: LockInfo = {
      ...lockInfo,
      lockedAt: new Date(),
      lockVersion: (lockInfo.lockVersion || 0) + 1
    };
    
    // Send refresh event
    energyAuditWebSocketService.sendEvent('editLock', refreshedLock);
    
    // Update local state
    setLockInfo(refreshedLock);
    
    return true;
  }, [resourceId, lockInfo, hasValidLock]);

  // Get users who are actively editing this resource
  const getEditingUsers = useCallback((): UserPresence[] => {
    return activeUsers.filter(user => {
      if (user.currentView && typeof user.currentView === 'string') {
        return user.currentView.includes('editing');
      }
      return false;
    });
  }, [activeUsers]);
  
  // Force override a lock (admin/emergency function)
  const forceUnlock = useCallback(async (): Promise<boolean> => {
    if (!resourceId || !editorState.lockedBy) return false;
    
    // Send force unlock event
    energyAuditWebSocketService.sendEvent('editUnlock', {
      resourceId,
      resourceType,
      userId: editorState.lockedBy,
      forced: true,
      forcedByUserId: userId
    });
    
    // Update local state
    setEditorState(prev => ({
      ...prev,
      lockedBy: null,
      lockedUntil: null,
      isLockExpired: false
    }));
    
    return true;
  }, [resourceId, resourceType, userId, editorState.lockedBy]);

  return {
    editorState,
    lockInfo,
    acquireLock,
    releaseLock,
    refreshLock,
    hasValidLock,
    isLockedByOthers,
    getEditingUsers,
    forceUnlock
  };
}

export default useCollaborativeEditing; 