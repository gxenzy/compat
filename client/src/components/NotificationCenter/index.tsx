import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Badge,
  IconButton,
  Tooltip,
  Collapse,
  Chip,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  Button
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  AccessTime as AccessTimeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import useEnergyAuditRealTime from '../../hooks/useEnergyAuditRealTime';

// Define notification types
export type NotificationType = 'info' | 'warning' | 'success' | 'error' | 'activity' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  timestamp: number;
  read: boolean;
  details?: any;
  action?: string;
}

// Define props interface
export interface NotificationCenterProps {
  onNavigate?: (route: string) => void;
  compact?: boolean;
  maxItems?: number;
  notifications?: Notification[];
  onClearAll?: () => void;
  onClearOne?: (id: string) => void;
  onNotificationClick?: (notification: Notification) => void;
}

// Mock notification data for development
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Energy Usage Anomaly',
    message: 'Detected 25% increase in energy consumption',
    timestamp: Date.now() - 3600000,
    read: false,
    action: '/energy-audit/monitoring/anomaly/456'
  },
  {
    id: '2',
    type: 'info',
    title: 'Scheduled Audit',
    message: 'Upcoming audit scheduled for next week',
    timestamp: Date.now() - 86400000,
    read: false,
    action: '/energy-audit/calendar'
  },
  {
    id: '3',
    type: 'success',
    title: 'Audit Completed',
    message: 'Final report is ready for review',
    timestamp: Date.now() - 172800000,
    read: true,
    action: '/energy-audit/report/123'
  }
];

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  onNavigate,
  compact = false,
  maxItems = 10,
  notifications: externalNotifications,
  onClearAll,
  onClearOne,
  onNotificationClick: externalNotificationClick
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>(externalNotifications || mockNotifications);
  const [currentTab, setCurrentTab] = useState(0);
  const [muted, setMuted] = useState(false);
  
  // Use the real-time hook
  const { subscribeToEvent } = useEnergyAuditRealTime();
  
  // Update notifications when external notifications change
  useEffect(() => {
    if (externalNotifications) {
      setNotifications(externalNotifications);
    }
  }, [externalNotifications]);
  
  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Subscribe to real-time events
  useEffect(() => {
    // Subscribe to various events that would generate notifications
    const unsubscribe1 = subscribeToEvent('auditCreated', handleNotificationEvent);
    const unsubscribe2 = subscribeToEvent('auditUpdated', handleNotificationEvent);
    const unsubscribe3 = subscribeToEvent('findingCreated', handleNotificationEvent);
    const unsubscribe4 = subscribeToEvent('auditCommentAdded', handleNotificationEvent);
    const unsubscribe5 = subscribeToEvent('syncCompleted', handleNotificationEvent);
    
    return () => {
      // Clean up subscriptions
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
      unsubscribe4();
      unsubscribe5();
    };
  }, []);
  
  // Handle notification event
  const handleNotificationEvent = (event: any) => {
    // Add new notification based on event
    const newNotification: Notification = {
      id: `notification-${Date.now()}`,
      type: 'info',
      title: event.type || 'New Event',
      message: event.data?.message || 'You have a new notification',
      timestamp: Date.now(),
      read: false,
      action: event.data?.action
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };
  
  // Handle opening the notification panel
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  // Handle closing the notification panel
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };
  
  // Mark a notification as read
  const markAsRead = (id: string) => {
    if (onClearOne) {
      onClearOne(id);
    } else {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    }
  };
  
  // Handle clicking a notification
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    if (externalNotificationClick) {
      externalNotificationClick(notification);
    } else if (notification.action && onNavigate) {
      onNavigate(notification.action);
    }
    
    handleCloseMenu();
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    if (onClearAll) {
      onClearAll();
    } else {
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    }
  };
  
  // Toggle mute state
  const toggleMute = () => {
    setMuted(!muted);
  };
  
  // Filter notifications based on current tab
  const filteredNotifications = currentTab === 0
    ? notifications
    : notifications.filter(n => !n.read);
  
  // Limited notifications based on maxItems
  const displayedNotifications = filteredNotifications.slice(0, maxItems);
  
  // Simple component for compact mode
  if (compact) {
    return (
      <Box>
        <Typography variant="subtitle1">Notification</Typography>
        <Divider />
        {displayedNotifications.length > 0 ? (
          displayedNotifications.map(notification => (
            <MenuItem 
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
            >
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  {notification.title || notification.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {notification.message}
                </Typography>
              </Box>
            </MenuItem>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            No notifications
          </Typography>
        )}
      </Box>
    );
  }
  
  // Full notification center
  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleOpenMenu}
        aria-label="Notifications"
        sx={{
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'scale(1.1)',
          }
        }}
      >
        <Badge 
          badgeContent={unreadCount} 
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.7rem',
              height: '18px',
              minWidth: '18px',
              padding: '0 4px'
            }
          }}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          elevation: 3,
          sx: {
            width: 350,
            maxHeight: 500,
            overflow: 'hidden',
            borderRadius: '8px',
            mt: 1
          }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          px: 2, 
          py: 1.5, 
          bgcolor: 'background.paper',
          position: 'sticky',
          top: 0,
          zIndex: 1,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              fontSize: '1.1rem'
            }}
          >
            Notifications
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              size="small" 
              onClick={markAllAsRead} 
              sx={{ 
                fontSize: '0.75rem',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}
            >
              Mark All as Read
            </Button>
            <Button 
              size="small" 
              onClick={toggleMute}
              sx={{ 
                fontSize: '0.75rem',
                fontWeight: 600
              }}
            >
              {muted ? 'Unmute' : 'Mute'}
            </Button>
          </Box>
        </Box>
        
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange} 
          centered
          sx={{
            minHeight: '42px',
            '& .MuiTabs-indicator': {
              height: 3
            },
            '& .MuiTab-root': {
              minHeight: '42px',
              fontWeight: 600,
              fontSize: '0.85rem',
              textTransform: 'none'
            }
          }}
        >
          <Tab label="ALL" />
          <Tab label={`UNREAD (${unreadCount})`} />
        </Tabs>
        
        <Box sx={{ 
          maxHeight: 350, 
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '6px',
          }
        }}>
          {displayedNotifications.length > 0 ? (
            displayedNotifications.map(notification => (
              <MenuItem 
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  opacity: notification.read ? 0.8 : 1,
                  position: 'relative',
                  '&::before': notification.read ? {} : {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    backgroundColor: theme => theme.palette.primary.main,
                  },
                  '&:hover': {
                    backgroundColor: theme => theme.palette.action.hover
                  }
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: notification.read ? 400 : 600,
                        fontSize: '0.95rem'
                      }}
                    >
                      {notification.title || notification.type}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: '0.7rem' }}
                    >
                      {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                    </Typography>
                  </Box>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: '0.85rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {notification.message}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          ) : (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              p: 4,
              height: '150px'
            }}>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  textAlign: 'center',
                  fontWeight: 500
                }}
              >
                No notifications
              </Typography>
            </Box>
          )}
        </Box>
      </Menu>
    </>
  );
};

export default NotificationCenter; 