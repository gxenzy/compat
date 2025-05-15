import React from 'react';
import { NavigateFunction } from 'react-router-dom';
import BaseNotificationCenter, { Notification as ComponentNotification } from '../../components/NotificationCenter';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { NotificationType } from '../../types';

// Use the exported name to match what's being imported
export interface NotificationCenterProps {
  onNavigate: NavigateFunction;
}

/**
 * NotificationCenter component specifically for MainLayout
 * Wraps the NotificationCenter component to handle navigation
 */
const MainLayoutNotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigate }) => {
  const { notifications = [], markAllAsRead, markAsRead } = useNotificationContext();
  
  // Convert notification type to string
  const mapNotificationType = (type: NotificationType | string): string => {
    if (typeof type === 'string') {
      return type.toLowerCase();
    }
    
    // Handle enum values
    switch(type) {
      case NotificationType.Info:
        return 'info';
      case NotificationType.Success:
        return 'success';
      case NotificationType.Warning:
        return 'warning';
      case NotificationType.Error:
        return 'error';
      default:
        return 'info';
    }
  };
  
  // Convert app notifications to component format
  const convertedNotifications = (notifications || [])
    .filter(notification => notification !== null && notification !== undefined)
    .map(notification => ({
      id: notification.id || `notification-${Date.now()}`,
      type: mapNotificationType(notification.type) as any,
      message: notification.message || 'Notification',
      timestamp: notification.timestamp 
        ? (typeof notification.timestamp === 'string' 
            ? new Date(notification.timestamp).getTime() 
            : notification.timestamp)
        : Date.now(),
      read: !!notification.read,
      details: (notification as any).details || {}
    }));
  
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
      compact={false}
      onClearAll={markAllAsRead}
      onClearOne={(id) => markAsRead(id)}
      onNotificationClick={handleNotificationClick}
    />
  );
};

export default MainLayoutNotificationCenter; 