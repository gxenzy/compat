/**
 * This file exists to handle imports with spaces in the path
 * It provides the NotificationCenter component
 */
import React from 'react';
import { useHistory } from 'react-router-dom';
import BaseNotificationCenter, { Notification as ComponentNotification } from '../../NotificationCenter';
import { useNotificationContext } from '../../../contexts/NotificationContext';

// Define NavigateFunction type for v5 router
export type NavigateFunction = (path: string) => void;

// Define the props interface
export interface NotificationCenterProps {
  onNavigate: NavigateFunction;
}

/**
 * NotificationCenter component for Energy Audit
 */
const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigate }) => {
  const { notifications = [], markAllAsRead, markAsRead } = useNotificationContext();
  
  // Convert app notifications to component format
  const convertedNotifications = (notifications || []).map(notification => {
    return {
      id: notification.id || `notification-${Date.now()}`,
      type: (typeof notification.type === 'string' ? notification.type.toLowerCase() : 'info') as any,
      message: notification.message || 'Notification',
      timestamp: Date.now(),
      read: !!notification.read,
      details: (notification as any).details || {}
    };
  });
  
  // Handle notification click with navigation
  const handleNotificationClick = (notification: ComponentNotification) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Navigate if path is provided
    if (notification.details?.path) {
      onNavigate(notification.details.path);
    }
  };
  
  return (
    <BaseNotificationCenter
      notifications={convertedNotifications}
      compact={true}
      onClearAll={markAllAsRead}
      onClearOne={(id) => markAsRead(id)}
      onNotificationClick={handleNotificationClick}
    />
  );
};

export default NotificationCenter; 