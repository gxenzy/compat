import React, { useState } from 'react';
import {
  Box,
  Badge,
  IconButton,
  Tooltip,
  Typography,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Avatar,
  Chip,
  Paper,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  WifiTethering as OnlineIcon,
  WifiTetheringOff as OfflineIcon,
  Sync as SyncIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  PersonOutline as PersonOutlineIcon
} from '@mui/icons-material';
import useEnergyAuditRealTime, { User } from '../../hooks/useEnergyAuditRealTime';

type SyncStatusType = 'synced' | 'syncing' | 'error' | 'offline' | 'pending';

interface RealTimeIndicatorProps {
  auditId: string;
  syncStatus?: SyncStatusType;
  onRefresh?: () => Promise<boolean>;
  compact?: boolean;
  showPersonalStatus?: boolean;
}

const RealTimeIndicator: React.FC<RealTimeIndicatorProps> = ({
  auditId,
  syncStatus = 'synced',
  onRefresh,
  compact = false,
  showPersonalStatus = false
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const {
    isConnected,
    activeUsers,
    lastEvent,
    syncStatus: realTimeSyncStatus,
    refreshWithNotification
  } = useEnergyAuditRealTime(auditId);
  
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else if (refreshWithNotification) {
        await refreshWithNotification();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const getStatusIcon = () => {
    if (!isConnected) {
      return <OfflineIcon color="error" />;
    }
    
    switch (syncStatus) {
      case 'synced':
        return <OnlineIcon color="success" />;
      case 'syncing':
        return <CircularProgress size={24} color="primary" />;
      case 'pending':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'offline':
        return <OfflineIcon color="warning" />;
      default:
        return <OnlineIcon color="primary" />;
    }
  };
  
  const getStatusText = () => {
    if (!isConnected) {
      return 'Disconnected';
    }
    
    switch (syncStatus) {
      case 'synced':
        return 'Fully Synced';
      case 'syncing':
        return 'Syncing...';
      case 'pending':
        return 'Pending Changes';
      case 'error':
        return 'Sync Error';
      case 'offline':
        return 'Offline Mode';
      default:
        return 'Connected';
    }
  };
  
  const getStatusColor = () => {
    if (!isConnected) {
      return 'error';
    }
    
    switch (syncStatus) {
      case 'synced':
        return 'success';
      case 'syncing':
        return 'primary';
      case 'pending':
        return 'warning';
      case 'error':
        return 'error';
      case 'offline':
        return 'warning';
      default:
        return 'primary';
    }
  };
  
  const open = Boolean(anchorEl);
  const id = open ? 'realtime-indicator-popover' : undefined;
  
  // We'll show the number of active users on the badge
  const activeUserCount = activeUsers?.length || 0;
  
  // Compact version: just icon with badge
  if (compact) {
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
        <Tooltip title={`${getStatusText()} - ${activeUserCount} active users`}>
          <IconButton
            size="small"
            color={getStatusColor()}
            onClick={handleClick}
          >
            <Badge badgeContent={activeUserCount} color="primary">
              {getStatusIcon()}
            </Badge>
          </IconButton>
        </Tooltip>
        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
        >
          <Box sx={{ p: 2, width: 300 }}>
            <Typography variant="subtitle1" gutterBottom>Real-Time Status</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Connection: <Chip 
                size="small" 
                color={getStatusColor()} 
                label={getStatusText()} 
                icon={getStatusIcon()} 
              />
            </Typography>
            <Typography variant="subtitle2">Active Users ({activeUserCount})</Typography>
            <List dense>
              {activeUsers && activeUsers.length > 0 ? (
                activeUsers.map((user) => (
                  <ListItem key={user.userId}>
                    <ListItemAvatar>
                      <Avatar sx={{ width: 24, height: 24 }}>
                        {user.userName.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={user.userName} 
                      secondary={`${user.status} - ${user.currentView || 'unknown view'}`}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText 
                    primary="No other active users"
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  />
                </ListItem>
              )}
            </List>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Tooltip title="Refresh data">
                <IconButton 
                  size="small" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? <CircularProgress size={18} /> : <RefreshIcon />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Popover>
      </Box>
    );
  }
  
  // Full version: badge with text
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Paper
        component="div"
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 0.5,
          borderRadius: 20,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover'
          }
        }}
        onClick={handleClick}
      >
        <Box sx={{ mr: 1 }}>
          {getStatusIcon()}
        </Box>
        <Typography variant="body2" sx={{ mr: 1 }}>
          {getStatusText()}
        </Typography>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <Tooltip title={`${activeUserCount} active users`}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />
            <Typography variant="body2">{activeUserCount}</Typography>
          </Box>
        </Tooltip>
        <Tooltip title="Refresh">
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              handleRefresh();
            }}
            disabled={isRefreshing}
            sx={{ ml: 1 }}
          >
            {isRefreshing ? <CircularProgress size={18} /> : <RefreshIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Paper>
      
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, width: 300 }}>
          <Typography variant="subtitle1" gutterBottom>Real-Time Status</Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Connection: <Chip 
                size="small" 
                color={getStatusColor()} 
                label={getStatusText()} 
                icon={getStatusIcon()} 
              />
            </Typography>
            <Typography variant="body2">
              Audit ID: {auditId}
            </Typography>
            {lastEvent && typeof lastEvent.timestamp === 'number' && (
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                Last update: {new Date(lastEvent.timestamp).toLocaleTimeString()}
              </Typography>
            )}
          </Box>
          
          <Typography variant="subtitle2">Active Users ({activeUserCount})</Typography>
          <List dense>
            {activeUsers && activeUsers.length > 0 ? (
              activeUsers.map((user) => (
                <ListItem key={user.userId}>
                  <ListItemAvatar>
                    <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main' }}>
                      {user.userName.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={user.userName} 
                    secondary={`${user.status} - ${user.currentView || 'unknown view'}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText 
                  primary="No other active users"
                  primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                />
              </ListItem>
            )}
          </List>
        </Box>
      </Popover>
    </Box>
  );
};

export default RealTimeIndicator; 