import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  Badge,
  Avatar,
  Tooltip,
  Popover,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  CircularProgress,
  Button,
  Divider
} from '@mui/material';
import {
  CloudDone as OnlineIcon,
  CloudOff as OfflineIcon,
  People as PeopleIcon,
  PersonOutline as PersonIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  SyncProblem as SyncErrorIcon,
  Sync as SyncingIcon,
  CloudSync as CloudSyncIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useEnergyAudit } from '../contexts/EnergyAuditContext';
import useEnergyAuditRealTime, { User, UserPresence } from '../hooks/useEnergyAuditRealTime';

interface RealTimeIndicatorProps {
  auditId?: string;
  activeUsers?: UserPresence[];
  hideUsers?: boolean;
  showStatus?: boolean;
  compact?: boolean;
  onRefresh?: () => Promise<boolean>;
  syncStatus?: 'synced' | 'syncing' | 'error' | 'offline' | 'pending' | 'completed' | 'idle';
  showPersonalStatus?: boolean;
  showSyncStatus?: boolean;
}

/**
 * Helper function to generate consistent color hashes from strings
 */
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

/**
 * Helper function to format timestamps to relative time
 */
const formatTimeAgo = (timestamp: number | string): string => {
  try {
    const timestampAsNumber = typeof timestamp === 'string' ? Date.parse(timestamp) : timestamp;
    
    if (isNaN(timestampAsNumber)) {
      return 'recently';
    }
    
    const now = Date.now();
    const seconds = Math.floor((now - timestampAsNumber) / 1000);
    
    if (seconds < 60) {
      return `${seconds} sec ago`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)} min ago`;
    } else if (seconds < 86400) {
      return `${Math.floor(seconds / 3600)} hr ago`;
    } else {
      return `${Math.floor(seconds / 86400)} days ago`;
    }
  } catch (error) {
    return 'recently';
  }
};

/**
 * Real-time collaboration indicator component
 * 
 * Displays online status and active users for real-time collaborative features
 */
const RealTimeIndicator: React.FC<RealTimeIndicatorProps> = ({
  auditId,
  activeUsers = [],
  hideUsers = false,
  showStatus = true,
  compact = false,
  onRefresh,
  syncStatus: propsSyncStatus,
  showPersonalStatus = false,
  showSyncStatus = true
}) => {
  const { hasRealTimeConnections, lastRealTimeUpdate } = useEnergyAudit();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [timeAgo, setTimeAgo] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // If auditId is provided, use the real-time hook to get active users
  const {
    activeUsers: hookActiveUsers,
    isConnected,
    syncStatus: hookSyncStatus,
    refreshWithNotification
  } = auditId ? useEnergyAuditRealTime(auditId) : {
    activeUsers: [] as User[],
    isConnected: hasRealTimeConnections,
    syncStatus: 'idle' as const,
    refreshWithNotification: undefined
  };
  
  // Use either the props or hook values, preferring props if provided
  const finalActiveUsers = useMemo(() => 
    activeUsers.length > 0 ? activeUsers : hookActiveUsers,
    [activeUsers, hookActiveUsers]
  );
  
  // Convert the hook's syncStatus to the component's expected status format
  const hookMappedStatus = hookSyncStatus === 'synced' ? 'synced' : 
                           hookSyncStatus === 'error' ? 'error' : 
                           hookSyncStatus === 'syncing' ? 'syncing' : 
                           'pending';
  
  const finalSyncStatus = propsSyncStatus || hookMappedStatus;
  const finalIsConnected = isConnected || hasRealTimeConnections;

  // Update time ago text
  useEffect(() => {
    if (!lastRealTimeUpdate) return;

    const updateTimeAgo = () => {
      const now = new Date();
      const seconds = Math.floor((now.getTime() - lastRealTimeUpdate.getTime()) / 1000);
      
      if (seconds < 60) {
        setTimeAgo(`${seconds} sec ago`);
      } else if (seconds < 3600) {
        setTimeAgo(`${Math.floor(seconds / 60)} min ago`);
      } else {
        setTimeAgo(`${Math.floor(seconds / 3600)} hr ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000);
    
    return () => clearInterval(interval);
  }, [lastRealTimeUpdate]);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const handleRefresh = async () => {
    if (!onRefresh && !refreshWithNotification) return;
    
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else if (refreshWithNotification && auditId) {
        await refreshWithNotification();
      }
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const getStatusIcon = () => {
    switch (finalSyncStatus) {
      case 'syncing':
        return <SyncingIcon fontSize={compact ? "small" : "medium"} className="rotating-icon" />;
      case 'error':
        return <SyncErrorIcon color="error" fontSize={compact ? "small" : "medium"} />;
      case 'offline':
        return <OfflineIcon color="error" fontSize={compact ? "small" : "medium"} />;
      case 'pending':
        return <CloudSyncIcon color="warning" fontSize={compact ? "small" : "medium"} />;
      case 'synced':
      default:
        return finalIsConnected 
          ? <OnlineIcon color="success" fontSize={compact ? "small" : "medium"} />
          : <OfflineIcon color="error" fontSize={compact ? "small" : "medium"} />;
    }
  };
  
  const getStatusColor = () => {
    switch (finalSyncStatus) {
      case 'syncing': return 'info';
      case 'error': return 'error';
      case 'offline': return 'error';
      case 'pending': return 'warning';
      case 'synced':
      default: return finalIsConnected ? 'success' : 'error';
    }
  };
  
  const getStatusText = () => {
    switch (finalSyncStatus) {
      case 'syncing': return 'Syncing...';
      case 'error': return 'Sync Error';
      case 'offline': return 'Offline';
      case 'pending': return 'Pending Sync';
      case 'synced':
      default: return finalIsConnected ? 'Connected' : 'Disconnected';
    }
  };

  const open = Boolean(anchorEl);

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {showStatus && (
          <Tooltip title={getStatusText()}>
            {getStatusIcon()}
          </Tooltip>
        )}
        
        {!hideUsers && finalActiveUsers.length > 0 && (
          <Tooltip title={`${finalActiveUsers.length} active users`}>
            <Badge badgeContent={finalActiveUsers.length} color="primary" max={99} sx={{ ml: 1 }}>
              <PeopleIcon fontSize="small" />
            </Badge>
          </Tooltip>
        )}
        
        {(onRefresh || refreshWithNotification) && (
          <IconButton 
            size="small" 
            onClick={handleRefresh} 
            sx={{ ml: 1 }}
            disabled={isRefreshing || finalSyncStatus === 'syncing'}
          >
            {isRefreshing ? 
              <CircularProgress size={16} /> : 
              <RefreshIcon fontSize="small" />
            }
          </IconButton>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {showStatus && (
        <Chip
          icon={getStatusIcon()}
          label={getStatusText()}
          color={getStatusColor()}
          size="small"
          variant="outlined"
        />
      )}
      
      {lastRealTimeUpdate && (
        <Typography variant="caption" color="text.secondary">
          Last update: {timeAgo}
        </Typography>
      )}
      
      {!hideUsers && finalActiveUsers.length > 0 && (
        <>
          <Chip
            icon={<PeopleIcon />}
            label={`${finalActiveUsers.length} active users`}
            color="primary"
            size="small"
            onClick={handlePopoverOpen}
            sx={{ cursor: 'pointer' }}
          />
          
          <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handlePopoverClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
            <Box sx={{ p: 2, maxWidth: 300 }}>
              <Typography variant="subtitle1" gutterBottom>
                Active Users
              </Typography>
              
              <List sx={{ width: '100%', maxHeight: 300, overflow: 'auto' }}>
                {finalActiveUsers.map((user, index) => (
                  <React.Fragment key={user.userId}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: `hsl(${hashString(user.userName) % 360}, 70%, 50%)` }}>
                          {user.userName.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.userName}
                        secondary={
                          <React.Fragment>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                              sx={{ display: 'block' }}
                            >
                              {user.status === 'online' ? 'Online' : 
                               user.status === 'away' ? 'Away' : 'Offline'}
                            </Typography>
                            {user.currentView && (
                              <Typography variant="caption">
                                {user.currentView}
                              </Typography>
                            )}
                            {user.lastActivity && (
                              <Typography variant="caption" color="text.secondary">
                                Last active: {formatTimeAgo(user.lastActivity)}
                              </Typography>
                            )}
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </Box>
          </Popover>
        </>
      )}
      
      {(onRefresh || refreshWithNotification) && (
        isRefreshing ? (
          <CircularProgress size={24} />
        ) : (
          <IconButton 
            size="small" 
            onClick={handleRefresh}
            disabled={finalSyncStatus === 'syncing'}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        )
      )}
    </Box>
  );
};

export default RealTimeIndicator; 