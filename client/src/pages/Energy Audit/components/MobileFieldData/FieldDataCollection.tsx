import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Chip,
  Badge,
  FormControlLabel,
  Switch,
  LinearProgress,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  CameraAlt as CameraIcon,
  LocationOn as LocationIcon,
  Check as CheckIcon,
  CloudOff as OfflineIcon,
  CloudDone as OnlineIcon,
  Thermostat as ThermostatIcon,
  Lightbulb as LightbulbIcon,
  AcUnit as HvacIcon,
  Power as PowerIcon,
  CheckCircle as CompleteIcon,
  Sync as SyncIcon,
  DataUsage as DataIcon,
  PictureAsPdf as PdfIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

// Import the hooks and services
import { useEnergyAudit } from '../../../../contexts/EnergyAuditContext';
import useEnergyAuditSync from './useEnergyAuditSync';
import energyAuditService, { FieldDataPoint, AuditArea } from '../../../../services/energyAuditService';
import useEnergyAuditRealTime from './useEnergyAuditRealTime';
import useEnergyAuditRealTimeActivity from './useEnergyAuditRealTimeActivity';
import RealTimeIndicator from '../../../../components/RealTimeIndicator';
import SimpleActivityLog from '../../../../components/SimpleActivityLog';
// Define ActivityLogEvent interface locally
interface ActivityLogEvent {
  id: string;
  type: string;
  message: string;
  userId: string;
  userName: string;
  timestamp: number | string;
  details?: any;
}
import NotificationCenter from '../../../../components/NotificationCenter';

// Mock audit areas
const mockAuditAreas = [
  { id: '1', name: 'Mechanical Room', status: 'complete', items: 12, completion: 100 },
  { id: '2', name: 'Office Area - 1st Floor', status: 'in_progress', items: 18, completion: 65 },
  { id: '3', name: 'Office Area - 2nd Floor', status: 'not_started', items: 15, completion: 0 },
  { id: '4', name: 'Data Center', status: 'in_progress', items: 8, completion: 40 },
  { id: '5', name: 'Lighting Systems', status: 'complete', items: 10, completion: 100 },
  { id: '6', name: 'HVAC Controls', status: 'not_started', items: 14, completion: 0 },
  { id: '7', name: 'Building Envelope', status: 'in_progress', items: 9, completion: 20 }
];

// Mock data collection templates
const mockTemplates = [
  { id: '1', name: 'HVAC Inspection', items: 24, category: 'hvac' },
  { id: '2', name: 'Lighting Assessment', items: 18, category: 'lighting' },
  { id: '3', name: 'Building Envelope', items: 15, category: 'envelope' },
  { id: '4', name: 'Plug Load Inventory', items: 12, category: 'plugload' },
  { id: '5', name: 'Process Equipment', items: 20, category: 'process' },
  { id: '6', name: 'Water Systems', items: 16, category: 'water' }
];

// Mock collected data points
const mockCollectedData = [
  { 
    id: '1', 
    areaId: '1', 
    type: 'equipment', 
    name: 'Chiller #1', 
    value: '280', 
    unit: 'kW', 
    notes: 'Running at partial load',
    timestamp: '2023-10-15T10:15:30',
    hasPhoto: true,
    hasLocation: true
  },
  { 
    id: '2', 
    areaId: '1', 
    type: 'equipment', 
    name: 'Boiler #2', 
    value: '650', 
    unit: 'MBH', 
    notes: 'Needs maintenance',
    timestamp: '2023-10-15T10:30:45',
    hasPhoto: true,
    hasLocation: true
  },
  { 
    id: '3', 
    areaId: '2', 
    type: 'reading', 
    name: 'Temperature', 
    value: '72.5', 
    unit: '°F', 
    notes: 'Normal operation',
    timestamp: '2023-10-15T11:05:22',
    hasPhoto: false,
    hasLocation: true
  },
  { 
    id: '4', 
    areaId: '5', 
    type: 'reading', 
    name: 'Light Level', 
    value: '480', 
    unit: 'lux', 
    notes: 'Above recommended levels',
    timestamp: '2023-10-15T13:45:10',
    hasPhoto: false,
    hasLocation: true
  }
];

// Define the sync status type
type SyncStatusType = 'synced' | 'syncing' | 'error' | 'offline' | 'pending';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`field-data-tabpanel-${index}`}
      aria-labelledby={`field-data-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const FieldDataCollection: React.FC = () => {
  const theme = useTheme();
  const { getAuditById } = useEnergyAudit();
  const { 
    isOnline, 
    syncState, 
    saveDataPointOffline, 
    saveAreaOffline,
    deleteDataPointOffline,
    deleteAreaOffline,
    syncOfflineData,
    getOfflineDataCount
  } = useEnergyAuditSync();
  
  const { 
    isConnected: isWebSocketConnected,
    activeUsers,
    lastEvent,
    syncStatus: realTimeSyncStatus,
    updateUserPresence,
    notifySyncCompleted,
    refreshWithNotification
  } = useEnergyAuditRealTime('1');
  
  const { 
    isConnected: isActivityConnected,
    activeUsers: activityUsers,
    lastEvent: activityLastEvent,
    syncStatus: activitySyncStatus,
    recentActivities,
    recentCollaborators,
    isCollaborating,
    logAuditActivity,
    setUserStatus
  } = useEnergyAuditRealTimeActivity('1');
  
  const [tabValue, setTabValue] = useState(0);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatusType>('synced');
  const [auditAreas, setAuditAreas] = useState<AuditArea[]>([]);
  const [dataPoints, setDataPoints] = useState<FieldDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [currentAuditId, setCurrentAuditId] = useState<string>('1'); // Default audit ID - in a real app this would come from a route param
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [lastDataSync, setLastDataSync] = useState<string | null>(null);
  
  // Load audit areas and data points
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load audit details
        const auditDetails = await getAuditById(currentAuditId);
        if (!auditDetails) {
          throw new Error('Failed to load audit details');
        }
        
        // Load audit areas
        const areasData = await energyAuditService.getAuditAreas(currentAuditId);
        setAuditAreas(areasData);
        
        // Load data points
        const dataPointsData = await energyAuditService.getFieldDataPoints(currentAuditId);
        setDataPoints(dataPointsData);
        
        setSyncStatus('synced');
      } catch (err: any) {
        console.error('Error loading field data:', err);
        setSnackbarMessage(err.message || 'Failed to load data');
        setSnackbarOpen(true);
        setSyncStatus('error');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isOnline && !offlineMode) {
      loadData();
    } else {
      // In offline mode, we'll use the data from our offline storage
      setSyncStatus('offline');
    }
  }, [currentAuditId, isOnline, offlineMode, getAuditById]);
  
  // Update sync status when offline data count changes
  useEffect(() => {
    const offlineCount = getOfflineDataCount();
    if (offlineCount.total > 0) {
      setSyncStatus('pending');
    } else if (!isOnline || offlineMode) {
      setSyncStatus('offline');
    } else {
      setSyncStatus('synced');
    }
  }, [getOfflineDataCount, isOnline, offlineMode]);

  // Update the WebSocket effects section 
  useEffect(() => {
    // When we have a WebSocket connection, update the status indicator
    if (isWebSocketConnected) {
      // Only update if we're not already in a good state
      if (syncStatus === 'error' || syncStatus === 'offline') {
        setSyncStatus(isOnline ? 'synced' : 'offline');
      }
    }
  }, [isWebSocketConnected, syncStatus, isOnline]);

  // Set user status as viewing this page
  useEffect(() => {
    setUserStatus('online', 'viewing');
    
    // Log activity for entering the page
    logAuditActivity(
      'view',
      `Opened Field Data Collection interface for audit ${currentAuditId}`,
      { auditId: currentAuditId }
    );
    
    return () => {
      // Set status to offline when leaving the page
      setUserStatus('offline');
    };
  }, [currentAuditId, setUserStatus, logAuditActivity]);

  // Update last data sync time
  useEffect(() => {
    if (syncStatus === 'synced') {
      setLastDataSync(new Date().toISOString());
    }
  }, [syncStatus]);

  // Notify about editing when adding/editing data
  const notifyEditing = () => {
    setUserStatus('online', 'editing');
  };

  // Notify about viewing after finishing edits
  const notifyViewing = () => {
    setUserStatus('online', 'viewing');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSyncData = async () => {
    if (!isOnline) {
      setSnackbarMessage('Cannot sync while offline');
      setSnackbarOpen(true);
      return;
    }
    
    setIsLoading(true);
    setSyncStatus('syncing');
    
    // Log activity for starting sync
    logAuditActivity(
      'sync',
      'Started synchronizing field data',
      { auditId: currentAuditId }
    );
    
    try {
      await syncOfflineData();
      
      // Reload data after sync
      const areasData = await energyAuditService.getAuditAreas(currentAuditId);
      setAuditAreas(areasData);
      
      const dataPointsData = await energyAuditService.getFieldDataPoints(currentAuditId);
      setDataPoints(dataPointsData);
      
      // Notify other clients about the sync - fixed notifySyncCompleted call
      notifySyncCompleted('Data synchronized successfully');
      
      // Update last sync time
      setLastDataSync(new Date().toISOString());
      
      setSnackbarMessage('Data synchronized successfully');
      setSnackbarOpen(true);
      setSyncStatus('synced');
      
      // Reset pending changes counter
      setPendingChanges(0);
      
      // Log successful sync
      logAuditActivity(
        'sync',
        'Successfully synchronized field data',
        { auditId: currentAuditId, status: 'success' }
      );
    } catch (err: any) {
      console.error('Error syncing data:', err);
      setSnackbarMessage(err.message || 'Failed to sync data');
      setSnackbarOpen(true);
      setSyncStatus('error');
      
      // Notify other clients about the failed sync - fixed
      notifySyncCompleted('Failed to synchronize data');
      
      // Log sync error
      logAuditActivity(
        'sync',
        `Failed to synchronize data: ${err.message || 'Unknown error'}`,
        { auditId: currentAuditId, status: 'error' }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOfflineModeToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOfflineMode(event.target.checked);
    if (!event.target.checked && isOnline) {
      // If turning off offline mode and we're online, sync data
      handleSyncData();
    }
  };

  const handleAddDataPoint = async () => {
    if (!selectedArea) {
      setSnackbarMessage('Please select an area first');
      setSnackbarOpen(true);
      return;
    }
    
    // Set user status to editing
    setUserStatus('online', 'editing');
    
    // In a real app, this would open a form to add a new data point
    // For now, let's create a sample data point for demonstration
    const newDataPoint: FieldDataPoint = {
      auditId: currentAuditId,
      areaId: selectedArea,
      type: 'reading',
      name: 'Temperature Reading',
      value: '72.5',
      unit: '°F',
      notes: 'Sample temperature reading',
      createdBy: 'current-user',
      createdAt: new Date().toISOString()
    };
    
    try {
      let savedDataPoint: FieldDataPoint;
      
      if (!isOnline || offlineMode) {
        // Save offline
        savedDataPoint = await saveDataPointOffline(newDataPoint);
        setSnackbarMessage('Data point saved offline');
      } else {
        // Save to server
        savedDataPoint = await energyAuditService.createFieldDataPoint(newDataPoint);
        setSnackbarMessage('Data point saved');
        
        // When we save successfully to the server, notify about the sync - fixed
        notifySyncCompleted('Data point saved successfully');
      }
      
      // Add to local state
      setDataPoints(prev => [...prev, savedDataPoint]);
      setSnackbarOpen(true);
      
      // Log the activity
      logAuditActivity(
        'create',
        `Created new data point: ${savedDataPoint.name}`,
        { 
          auditId: currentAuditId,
          dataPointId: savedDataPoint.id || 'new-data-point',
          dataPointName: savedDataPoint.name
        }
      );
      
      // Revert presence to viewing
      setUserStatus('online', 'viewing');
    } catch (err: any) {
      console.error('Error saving data point:', err);
      setSnackbarMessage(err.message || 'Failed to save data point');
      setSnackbarOpen(true);
      
      // Log the error
      logAuditActivity(
        'create',
        `Failed to create data point: ${err.message || 'Unknown error'}`,
        { 
          auditId: currentAuditId,
          dataPointName: newDataPoint.name,
          status: 'error'
        }
      );
      
      // Revert presence to viewing even on error
      setUserStatus('online');
    }
  };

  const handleDeleteDataPoint = async (id: string) => {
    try {
      if (!isOnline || offlineMode) {
        // Delete offline
        await deleteDataPointOffline(id);
        setSnackbarMessage('Data point deleted offline');
      } else {
        // Delete from server
        await energyAuditService.deleteFieldDataPoint(id);
        setSnackbarMessage('Data point deleted');
      }
      
      // Remove from local state
      setDataPoints(prev => prev.filter(point => point.id !== id));
      setSnackbarOpen(true);
    } catch (err: any) {
      console.error('Error deleting data point:', err);
      setSnackbarMessage(err.message || 'Failed to delete data point');
      setSnackbarOpen(true);
    }
  };

  const handleAddArea = async () => {
    // In a real app, this would open a form to add a new area
    // For now, let's create a sample area for demonstration
    const newArea: AuditArea = {
      auditId: currentAuditId,
      name: `New Area ${auditAreas.length + 1}`,
      status: 'not_started',
      dataPoints: 0,
      completion: 0,
      createdBy: 'current-user'
    };
    
    try {
      let savedArea: AuditArea;
      
      if (!isOnline || offlineMode) {
        // Save offline
        savedArea = await saveAreaOffline(newArea);
        setSnackbarMessage('Area saved offline');
      } else {
        // Save to server
        savedArea = await energyAuditService.createAuditArea(newArea);
        setSnackbarMessage('Area saved');
      }
      
      // Add to local state
      setAuditAreas(prev => [...prev, savedArea]);
      setSnackbarOpen(true);
    } catch (err: any) {
      console.error('Error saving area:', err);
      setSnackbarMessage(err.message || 'Failed to save area');
      setSnackbarOpen(true);
    }
  };
  
  const handleDeleteArea = async (id: string) => {
    try {
      if (!isOnline || offlineMode) {
        // Delete offline
        await deleteAreaOffline(id);
        setSnackbarMessage('Area deleted offline');
      } else {
        // Delete from server
        await energyAuditService.deleteAuditArea(id);
        setSnackbarMessage('Area deleted');
      }
      
      // Remove from local state
      setAuditAreas(prev => prev.filter(area => area.id !== id));
      // Reset selected area if it was deleted
      if (selectedArea === id) {
        setSelectedArea(null);
      }
      setSnackbarOpen(true);
    } catch (err: any) {
      console.error('Error deleting area:', err);
      setSnackbarMessage(err.message || 'Failed to delete area');
      setSnackbarOpen(true);
    }
  };

  const getAreaCompletionStatus = (areaId: string) => {
    const area = auditAreas.find(a => a.id === areaId);
    return area ? area.completion : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'success';
      case 'in_progress': return 'warning';
      case 'not_started': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'complete': return 'Complete';
      case 'in_progress': return 'In Progress';
      case 'not_started': return 'Not Started';
      default: return status;
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'equipment': return <PowerIcon />;
      case 'reading': return <ThermostatIcon />;
      case 'hvac': return <HvacIcon />;
      case 'lighting': return <LightbulbIcon />;
      default: return <PowerIcon />;
    }
  };

  const renderActiveUsersIndicator = () => {
        return (
      <RealTimeIndicator
        auditId={currentAuditId}
        syncStatus={syncStatus}
        onRefresh={async () => {
          if (refreshWithNotification) {
            await refreshWithNotification();
          }
          return true;
        }}
        compact={false}
      />
    );
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Load audit details
      const auditDetails = await getAuditById(currentAuditId);
      if (!auditDetails) {
        throw new Error('Failed to load audit details');
      }
      
      // Load audit areas
      const areasData = await energyAuditService.getAuditAreas(currentAuditId);
      setAuditAreas(areasData);
      
      // Load data points
      const dataPointsData = await energyAuditService.getFieldDataPoints(currentAuditId);
      setDataPoints(dataPointsData);
      
      setSnackbarMessage('Data refreshed successfully');
      setSnackbarOpen(true);
      setSyncStatus('synced');
    } catch (err: any) {
      console.error('Error refreshing data:', err);
      setSnackbarMessage(err.message || 'Failed to refresh data');
      setSnackbarOpen(true);
      setSyncStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (item: any) => {
    setSelectedItem(item);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
  };

  const handleSaveData = () => {
    // In a real app, this would save data to local storage
    setPendingChanges(prev => prev + 1);
    handleCloseDialog();
  };

  // Create stub functions for missing properties
  const updateActivityPresence = setUserStatus;
  const notifyActivitySyncCompleted = (auditId: string, status: 'success' | 'error', message: string) => {
    console.log('Sync completed', auditId, status, message);
    // This is a stub - in a real implementation, this would use the proper method
  };
  const refreshActivityWithNotification = async () => {
    console.log('Refreshing with notification');
    await fetchData();
    return true;
  };

  // Define custom type that includes the additional fields
  type EnhancedFieldDataPoint = FieldDataPoint & {
    status?: string;
  };

  type EnhancedAuditArea = AuditArea & {
    type?: string;
  };

  // Cast the data points and areas to the enhanced types
  const typedDataPoints = dataPoints as EnhancedFieldDataPoint[];
  const typedAuditAreas = auditAreas as EnhancedAuditArea[];

  // Handle selecting an area
  const handleAreaSelect = (areaId: string) => {
    setSelectedArea(areaId);
    // Other logic for area selection
  };

        return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <DataIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h5" component="h1">Field Data Collection</Typography>
              <Tooltip title="Refresh Data">
                <IconButton 
                  size="small" 
                  onClick={fetchData} 
                  sx={{ ml: 1 }}
                  disabled={isLoading}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={offlineMode}
                    onChange={handleOfflineModeToggle}
                    color="warning"
                  />
                }
                label="Offline Mode"
              />
              <Tooltip title="Sync Data">
                <span>
                  <IconButton 
                    onClick={handleSyncData} 
                    disabled={!isOnline || (offlineMode && !isWebSocketConnected)}
                    color="primary"
                  >
                    <Badge color="error" badgeContent={getOfflineDataCount().total || 0}>
                      <SyncIcon />
                    </Badge>
                  </IconButton>
                </span>
              </Tooltip>
              
              {/* Real-time collaboration indicators */}
              <RealTimeIndicator
                auditId={currentAuditId}
                compact={false}
              />
              <NotificationCenter />
            </Box>
          </Box>
          
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ mb: 3 }}
          >
            <Tab label="Data Points" icon={<ThermostatIcon />} iconPosition="start" />
            <Tab label="Areas" icon={<LocationIcon />} iconPosition="start" />
            <Tab label="Documents" icon={<PdfIcon />} iconPosition="start" />
            <Tab label="Activity" icon={<SyncIcon />} iconPosition="start" />
            <Tab label="Collaboration" icon={<PeopleIcon />} iconPosition="start" />
          </Tabs>
        </Grid>
        
        {/* Connection status indicator */}
        {!isWebSocketConnected && (
          <Grid item xs={12}>
            <Paper 
                    sx={{ 
                p: 2, 
                mb: 2, 
                display: 'flex', 
                alignItems: 'center',
                bgcolor: theme.palette.warning.light
              }}
            >
              <OfflineIcon sx={{ mr: 1, color: theme.palette.warning.dark }} />
              <Typography variant="body2" color="warning.dark">
                You are currently working offline. Changes will be synchronized when you reconnect.
              </Typography>
            </Paper>
          </Grid>
        )}
        
        {/* Tab content */}
        {tabValue === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Data Collection Points</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  size="small"
                >
                  Add Data Point
                </Button>
                      </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                {typedDataPoints.map((point) => (
                  <Grid item xs={12} sm={6} md={4} key={point.id}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="subtitle1" component="div">
                            {point.name}
                          </Typography>
                        <Chip 
                          size="small" 
                            label={point.status || 'pending'} 
                            sx={{ 
                              bgcolor: alpha(getStatusColor(point.status || 'pending'), 0.1),
                              color: getStatusColor(point.status || 'pending'),
                              borderColor: getStatusColor(point.status || 'pending')
                            }}
                            variant="outlined"
                        />
                      </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {point.areaId} • {point.type}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="h6" component="div" color="text.primary">
                          {point.value} {point.unit}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Collected: {new Date(point.createdAt || Date.now()).toLocaleString()}
                        </Typography>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                          <Button
                            size="small"
                            onClick={() => handleOpenDialog(point)}
                          >
                            Update Reading
                          </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            </Paper>
          </Grid>
        )}
        
        {tabValue === 1 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Areas to Survey</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  size="small"
                >
                  Add Area
                </Button>
          </Box>
              <Divider sx={{ mb: 2 }} />
              
              <List>
                {typedAuditAreas.map((area) => (
                  <ListItem 
                    key={area.id}
                    disablePadding
                    secondaryAction={
                      <IconButton edge="end" aria-label="delete">
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemButton 
                      onClick={() => handleAreaSelect(area.id || '')}
                      selected={selectedArea === area.id}
                    >
                      <ListItemIcon>
                        {getIconForType(area.type || 'default')}
                      </ListItemIcon>
                      <ListItemText
                        primary={area.name}
                        secondary={
                          <React.Fragment>
                            <Typography variant="body2" component="span">{area.type || 'Area'}</Typography>
                            <Typography variant="body2" component="p" color="text.secondary">
                              {area.status === 'complete' ? 'Completed' : area.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        )}
        
        {tabValue === 2 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Documents & Photos</Typography>
          <Box>
                  <Button
                    variant="outlined"
                    startIcon={<CameraIcon />}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    Capture Photo
                  </Button>
            <Button
              variant="contained"
                    startIcon={<UploadIcon />}
                    size="small"
                  >
                    Upload Document
            </Button>
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No documents uploaded yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upload photos, PDF documents, or capture images directly from your device
                </Typography>
              </Box>
            </Paper>
          </Grid>
        )}
        
        {tabValue === 3 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 0, overflow: 'hidden' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6">Activity Log</Typography>
                <Typography variant="body2" color="text.secondary">
                  Track all field data collection activities
                </Typography>
              </Box>
              <Box sx={{ height: 500 }}>
                <SimpleActivityLog 
                  height="100%" 
                  maxEvents={50}
                  showFilters={true}
                />
              </Box>
            </Paper>
                  </Grid>
        )}
        
        {/* Collaboration Tab */}
        {tabValue === 4 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Real-Time Collaboration</Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  {/* Full real-time status indicator */}
                  <Grid item xs={12}>
                    <RealTimeIndicator
                      auditId={currentAuditId}
                      compact={false}
                    />
                  </Grid>
                  
                  {/* Last sync information */}
                  <Grid item xs={12}>
                    <Box 
                      sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: 1,
                        border: `1px solid ${theme.palette.divider}`,
                        bgcolor: theme.palette.background.default
                      }}
                    >
                      <Typography variant="subtitle1" gutterBottom>
                        Data Synchronization Status
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <SyncIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="body2">
                              Sync Status: <strong>{syncStatus}</strong>
                  </Typography>
                </Box>
                          {lastDataSync && (
                <Typography variant="body2" color="text.secondary">
                              Last synchronized: {new Date(lastDataSync).toLocaleString()}
                </Typography>
              )}
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <DataIcon sx={{ mr: 1, color: theme.palette.info.main }} />
                            <Typography variant="body2">
                              Offline Data Points: <strong>{getOfflineDataCount().dataPoints}</strong>
            </Typography>
          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Offline Areas: <strong>{getOfflineDataCount().areas}</strong>
        </Typography>
                        </Grid>
                      </Grid>
        
                      {pendingChanges > 0 && (
                        <Box sx={{ mt: 2 }}>
          <Button
                            variant="contained"
                            startIcon={<SyncIcon />}
                            onClick={handleSyncData}
                            disabled={!isOnline}
                          >
                            Sync {pendingChanges} Pending Changes
          </Button>
      </Box>
                      )}
          </Box>
                  </Grid>
                  
                  {/* Collaboration info */}
                  {isCollaborating && (
                    <Grid item xs={12}>
                      <Alert 
                        severity="info" 
                        sx={{ mt: 2 }}
                        action={
              <Button
                            size="small" 
                            color="inherit" 
                            onClick={() => setTabValue(3)}
                          >
                            View Activity
              </Button>
                        }
                      >
                        {recentCollaborators.length} users are currently collaborating on this audit.
                      </Alert>
                    </Grid>
                  )}
                </Grid>
      </Paper>
            </Grid>
            
            {/* Recent activity */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 0, overflow: 'hidden', height: '100%' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h6">Recent Activity</Typography>
                </Box>
                <Box sx={{ height: 400 }}>
                  <SimpleActivityLog 
                    height="100%"
                    maxEvents={10}
                    compact={true}
                    autoRefresh={true}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Grid>
      
      {/* Dialog for editing data points or areas */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedItem?.name || 'Update Data'}
        </DialogTitle>
        <DialogContent dividers>
          {selectedItem && (
            <Grid container spacing={2}>
              {selectedItem.type === 'temperature' || selectedItem.type === 'electrical' || selectedItem.type === 'gas' || selectedItem.type === 'solar' ? (
                // Data point form
                <>
                  <Grid item xs={12}>
                    <TextField
                      label="Reading Value"
                      defaultValue={selectedItem.value}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Notes"
                      multiline
                      rows={3}
                      fullWidth
                      variant="outlined"
                      placeholder="Add any observations or notes about this reading"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Attach photo with reading"
                    />
                  </Grid>
                </>
              ) : (
                // Area form
                <>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        defaultValue={selectedItem.status}
                        label="Status"
                      >
                        <MenuItem value="not_started">Not Started</MenuItem>
                        <MenuItem value="in_progress">In Progress</MenuItem>
                        <MenuItem value="complete">Completed</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Notes"
                      multiline
                      rows={4}
                      fullWidth
                      variant="outlined"
                      defaultValue={selectedItem.notes}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveData} variant="contained" startIcon={<SaveIcon />}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Snackbar for messages */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default FieldDataCollection; 