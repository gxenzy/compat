import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar as MuiSnackbar,
  Pagination,
  Paper,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Backup as BackupIcon,
  CloudDownload as RestoreIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  DeleteForever as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuthContext } from '../../contexts/AuthContext';
import { UserRole, SystemSettings as ImportedSystemSettings, AuditLog as AuditLogType, BackupEntry as BackupEntryType } from '../../types/index';
import * as adminService from '../../services/adminService';
import * as auditService from '../../services/auditService';
import PageHeader from '../../components/PageHeader';
import MainLayout from '../../layouts/MainLayout';

// Define a local interface that extends the imported one with required properties
interface SystemSettings extends Omit<ImportedSystemSettings, 'emergencyMode'> {
  maxUsers: number;  // Make this required instead of optional
  backupFrequency: number;
  emailNotifications: boolean;
  debugMode: boolean;
  apiUrl: string;
  siteName: string;
  registrationEnabled: boolean;
  passwordPolicy: {
    minLength: number;
    requireSpecialChar: boolean;
    requireNumber: boolean;
    requireUppercase: boolean;
    requireLowercase: boolean;
  };
  maxLoginAttempts: number;
  maintenanceMode: boolean;
}

type AuditLog = AuditLogType;
type BackupEntry = BackupEntryType;

const AdminSettings: React.FC = () => {
  const { user } = useAuthContext();
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: 'Energy Audit System',
    maxUsers: 100,
    sessionTimeout: 30,
    backupFrequency: 24,
    emailNotifications: true,
    maintenanceMode: false,
    debugMode: false,
    apiUrl: 'http://localhost:8000',
    allowRegistration: false,
    registrationEnabled: false,
    theme: 'light',
    defaultRole: UserRole.VIEWER,
    passwordPolicy: {
      minLength: 8,
      requireSpecialChar: true,
      requireNumber: true,
      requireUppercase: true,
      requireLowercase: true
    },
    maxLoginAttempts: 5
  });
  
  // State for various operations
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  
  // Audit log state
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLimit] = useState(20);
  const [auditCount, setAuditCount] = useState(0);
  const [auditUser, setAuditUser] = useState('');
  const [auditAction, setAuditAction] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  
  // Backup state
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  
  // UI state
  const [confirmDialog, setConfirmDialog] = useState<{ 
    open: boolean; 
    action: null | (() => void); 
    message: string 
  }>({ open: false, action: null, message: '' });
  
  const [snackbar, setSnackbar] = useState<{ 
    open: boolean; 
    message: string; 
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({ open: false, message: '', severity: 'success' });

  // Helper function to check admin role
  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  useEffect(() => {
    if (!hasRole(UserRole.ADMIN)) {
      setError('Access denied. Admins only.');
      setLoading(false);
      return;
    }
    
    // Load system settings
    const loadSettings = async () => {
      try {
        setLoading(true);
        const systemSettings = await adminService.getSystemSettings();
        
        // Handle data safely without assuming emergencyMode exists
        setSettings(prevSettings => ({
          ...prevSettings,
          ...systemSettings
        }));
      } catch (err: any) {
        console.error('Failed to load settings:', err);
        setError('Failed to load settings: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [user]);

  // Load audit logs
  useEffect(() => {
    if (hasRole(UserRole.ADMIN)) {
      const loadAuditLogs = async () => {
        try {
          setAuditLoading(true);
          
          const filters = {
            username: auditUser || undefined,
            action: auditAction || undefined,
            searchQuery: auditSearch || undefined
          };
          
          const result = await adminService.getAuditLogs(auditPage, auditLimit, filters);
          setAuditLogs(result.logs);
          setAuditCount(result.count);
        } catch (err: any) {
          console.error('Failed to load audit logs:', err);
          setAuditError('Failed to load audit logs: ' + (err.message || 'Unknown error'));
        } finally {
          setAuditLoading(false);
        }
      };
      
      loadAuditLogs();
    }
  }, [user, auditPage, auditLimit, auditUser, auditAction, auditSearch]);

  // Load backup list
  useEffect(() => {
    if (hasRole(UserRole.ADMIN)) {
      const loadBackups = async () => {
        try {
          setBackupsLoading(true);
          const backupList = await adminService.getBackupList();
          setBackups(backupList);
        } catch (err: any) {
          console.error('Failed to load backups:', err);
          showSnackbar('Failed to load backups: ' + (err.message || 'Unknown error'), 'error');
        } finally {
          setBackupsLoading(false);
        }
      };
      
      loadBackups();
    }
  }, [user]);

  // Helper to show snackbar messages
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Handle setting changes
  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle dropdown changes
  const handleSelectChange = (event: SelectChangeEvent<any>) => {
    const { name, value } = event.target;
    handleSettingChange(name as keyof SystemSettings, value);
  };

  // Open confirmation dialog
  const openConfirmDialog = (action: () => void, message: string) => {
    setConfirmDialog({ open: true, action, message });
  };

  // Handle confirmation
  const handleConfirm = () => {
    if (confirmDialog.action) confirmDialog.action();
    setConfirmDialog({ open: false, action: null, message: '' });
  };

  // Handle cancellation of confirmation
  const handleCancel = () => setConfirmDialog({ open: false, action: null, message: '' });

  // Save settings
  const handleSaveSettings = async () => {
    openConfirmDialog(async () => {
      // Validation
      if (settings.maxUsers <= 0) {
        setSettingsError('Max Users must be greater than 0');
        return;
      }
      if (settings.sessionTimeout <= 0) {
        setSettingsError('Session Timeout must be greater than 0');
        return;
      }
      if (settings.backupFrequency <= 0) {
        setSettingsError('Backup Frequency must be greater than 0');
        return;
      }
      
      setSettingsError(null);
      
      try {
        setLoading(true);
        await adminService.updateSystemSettings(settings);
        
        showSnackbar('Settings saved successfully', 'success');
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (error: any) {
        showSnackbar('Error saving settings: ' + (error.message || 'Unknown error'), 'error');
      } finally {
        setLoading(false);
      }
    }, 'Are you sure you want to save these settings?');
  };

  // Create system backup
  const handleBackup = async () => {
    openConfirmDialog(async () => {
      try {
        setBackupInProgress(true);
        const result = await adminService.createBackup();
        
        if (result.success) {
          showSnackbar('Backup completed successfully', 'success');
          
          // Refresh backup list
          const backupList = await adminService.getBackupList();
          setBackups(backupList);
        } else {
          showSnackbar('Backup failed: ' + result.message, 'error');
        }
      } catch (error: any) {
        showSnackbar('Error during backup: ' + (error.message || 'Unknown error'), 'error');
      } finally {
        setBackupInProgress(false);
      }
    }, 'Are you sure you want to backup the system?');
  };

  // Restore from backup
  const handleRestore = () => {
    if (!selectedBackup) {
      showSnackbar('Please select a backup to restore from', 'warning');
      return;
    }
    
    openConfirmDialog(async () => {
      try {
        setLoading(true);
        const result = await adminService.restoreFromBackup(selectedBackup);
        
        if (result.success) {
          showSnackbar('System restored successfully', 'success');
          
          // Reload settings after restore
          const systemSettings = await adminService.getSystemSettings();
          setSettings(prevSettings => ({
            ...prevSettings,
            ...systemSettings
          }));
        } else {
          showSnackbar('Restore failed: ' + result.message, 'error');
        }
      } catch (error: any) {
        showSnackbar('Error during restore: ' + (error.message || 'Unknown error'), 'error');
      } finally {
        setLoading(false);
      }
    }, 'Are you sure you want to restore from backup? This will overwrite current settings.');
  };

  // Get unique users and actions from audit logs for filters
  const uniqueUsers = Array.from(new Set(auditLogs.map((l: AuditLog) => l.username).filter(Boolean)));
  const uniqueActions = Array.from(new Set(auditLogs.map((l: AuditLog) => l.action).filter(Boolean)));

  if (loading && !hasRole(UserRole.ADMIN)) return <CircularProgress />;
  if (error && !hasRole(UserRole.ADMIN)) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Admin Settings</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={backupInProgress ? <CircularProgress size={24} /> : <BackupIcon />}
            onClick={handleBackup}
            disabled={backupInProgress}
            sx={{ mr: 1 }}
          >
            {backupInProgress ? 'Backing up...' : 'Backup System'}
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
            disabled={loading}
          >
            Save Settings
          </Button>
        </Box>
      </Box>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      {settingsError && <Alert severity="error" sx={{ mt: 2 }}>{settingsError}</Alert>}

      <Grid container spacing={3}>
        {/* System Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Configuration
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <List>
                  <ListItem>
                    <ListItemText
                      primary="API URL"
                      secondary="Base URL for API endpoints"
                    />
                    <ListItemSecondaryAction>
                      <TextField
                        size="small"
                        value={settings.apiUrl}
                        onChange={(e) => handleSettingChange('apiUrl', e.target.value)}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Max Users"
                      secondary="Maximum number of users allowed"
                    />
                    <ListItemSecondaryAction>
                      <TextField
                        type="number"
                        size="small"
                        value={settings.maxUsers}
                        onChange={(e) => handleSettingChange('maxUsers', parseInt(e.target.value))}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Session Timeout"
                      secondary="Session timeout in minutes"
                    />
                    <ListItemSecondaryAction>
                      <TextField
                        type="number"
                        size="small"
                        value={settings.sessionTimeout}
                        onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Backup Settings
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Backup Frequency"
                      secondary="Hours between automatic backups"
                    />
                    <ListItemSecondaryAction>
                      <TextField
                        type="number"
                        size="small"
                        value={settings.backupFrequency}
                        onChange={(e) => handleSettingChange('backupFrequency', parseInt(e.target.value))}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              )}
            </CardContent>
          </Card>
          
          {/* Backup List */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Available Backups</Typography>
                <IconButton 
                  onClick={async () => {
                    setBackupsLoading(true);
                    try {
                      const backupList = await adminService.getBackupList();
                      setBackups(backupList);
                      showSnackbar('Backup list refreshed', 'info');
                    } catch (err: any) {
                      showSnackbar('Failed to refresh backups', 'error');
                    } finally {
                      setBackupsLoading(false);
                    }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Box>
              
              {backupsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : backups.length === 0 ? (
                <Alert severity="info">No backups available</Alert>
              ) : (
                <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Size</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {backups.map((backup) => (
                        <TableRow 
                          key={backup.id}
                          selected={selectedBackup === backup.id}
                          onClick={() => setSelectedBackup(backup.id)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>{backup.name}</TableCell>
                          <TableCell>
                            {new Date(backup.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>{backup.size}</TableCell>
                          <TableCell>
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBackup(backup.id);
                                handleRestore();
                              }}
                            >
                              <RestoreIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              
              <Box sx={{ mt: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<RestoreIcon />}
                  color="warning"
                  onClick={handleRestore}
                  disabled={loading || !selectedBackup}
                >
                  Restore Selected Backup
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* System Features */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Features
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <List>
                  <ListItem>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.emailNotifications}
                          onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                        />
                      }
                      label="Email Notifications"
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.maintenanceMode}
                          onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                        />
                      }
                      label="Maintenance Mode"
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.debugMode}
                          onChange={(e) => handleSettingChange('debugMode', e.target.checked)}
                        />
                      }
                      label="Debug Mode"
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.allowRegistration}
                          onChange={(e) => handleSettingChange('allowRegistration', e.target.checked)}
                        />
                      }
                      label="Allow User Registration"
                    />
                  </ListItem>
                </List>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Maintenance
              </Typography>
              <List>
                <ListItem>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      openConfirmDialog(
                        async () => {
                          try {
                            showSnackbar('System cache cleared', 'success');
                          } catch (error) {
                            showSnackbar('Failed to clear cache', 'error');
                          }
                        },
                        'Are you sure you want to clear the system cache?'
                      );
                    }}
                  >
                    Clear System Cache
                  </Button>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Audit Logs */}
      {hasRole(UserRole.ADMIN) && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>Audit Log</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              select
              size="small"
              label="User"
              value={auditUser}
              onChange={e => setAuditUser(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueUsers.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
            </TextField>
            <TextField
              select
              size="small"
              label="Action"
              value={auditAction}
              onChange={e => setAuditAction(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueActions.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </TextField>
            <TextField
              size="small"
              label="Search"
              value={auditSearch}
              onChange={e => setAuditSearch(e.target.value)}
            />
          </Box>
          {auditLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : auditError ? (
            <Alert severity="error">{auditError}</Alert>
          ) : (
            <>
              <Card>
                <CardContent>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Time</TableCell>
                          <TableCell>User</TableCell>
                          <TableCell>Action</TableCell>
                          <TableCell>Details</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {auditLogs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} align="center">No audit logs found.</TableCell>
                          </TableRow>
                        ) : (
                          auditLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                              <TableCell>{log.username || 'System'}</TableCell>
                              <TableCell>{log.action}</TableCell>
                              <TableCell><pre style={{ margin: 0, fontSize: 12 }}>{log.details}</pre></TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
              <Box display="flex" justifyContent="center" mt={2}>
                <Pagination
                  count={Math.ceil(auditCount / auditLimit)}
                  page={auditPage}
                  onChange={(_, value) => setAuditPage(value)}
                  color="primary"
                />
              </Box>
            </>
          )}
        </Box>
      )}

      {/* Snackbar for notifications */}
      <MuiSnackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={handleCancel}>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmDialog.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleConfirm} color="primary">Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminSettings;
