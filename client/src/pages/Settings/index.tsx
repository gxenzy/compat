import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Select,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Typography,
  Stack,
  Container,
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  DarkMode as DarkModeIcon,
  Language as LanguageIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  Lock as LockIcon,
  AccessibilityNew as AccessibilityIcon,
  Contrast as ContrastIcon,
  TextFields as TextFieldsIcon,
  SlowMotionVideo as ReduceMotionIcon,
} from '@mui/icons-material';
import { useHistory } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { useAppDispatch } from '../../store';
import { updateUser } from '../../store/slices/authSlice';
import { useUserContext } from '../../contexts/UserContext';
import { NotificationType } from '../../types';
import { useTheme } from '@mui/material/styles';
import { useThemeMode, ThemeMode } from '../../contexts/ThemeContext';
import { useAccessibilitySettings } from '../../contexts/AccessibilitySettingsContext';

const Settings: React.FC = () => {
  const { currentUser } = useAuthContext();
  const dispatch = useAppDispatch();
  const history = useHistory();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const { setNotificationPreferences } = useUserContext();
  const theme = useTheme();
  const { mode, setMode } = useThemeMode();
  const { 
    settings: accessibilitySettings, 
    toggleHighContrast, 
    toggleLargeText, 
    toggleReduceMotion, 
    toggleScreenReaderOptimization 
  } = useAccessibilitySettings();
  
  const [settings, setSettings] = useState({
    emailNotifications: false,
    language: 'en',
    visibility: 'public',
    twoFactorAuth: false,
  });

  // Notification Preferences State
  const defaultNotifPrefs = { enabled: true, types: [NotificationType.Info, NotificationType.Success, NotificationType.Warning, NotificationType.Error] };
  const notifPrefs = currentUser?.notificationPreferences || defaultNotifPrefs;
  const [notifEnabled, setNotifEnabled] = useState(notifPrefs.enabled);
  
  // Convert string types to NotificationType enum values if needed
  const convertToNotificationTypes = (types: string[]): NotificationType[] => {
    return types.map(type => {
      switch(type) {
        case 'info': return NotificationType.Info;
        case 'success': return NotificationType.Success;
        case 'warning': return NotificationType.Warning;
        case 'error': return NotificationType.Error;
        default: return NotificationType.Info;
      }
    });
  };
  
  const [notifTypes, setNotifTypes] = useState<NotificationType[]>(
    Array.isArray(notifPrefs.types) 
      ? typeof notifPrefs.types[0] === 'string' 
        ? convertToNotificationTypes(notifPrefs.types as string[])
        : notifPrefs.types as NotificationType[]
      : defaultNotifPrefs.types
  );

  const handleSettingChange = (setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSaveSettings = async () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
  ];

  const handleNotifTypeChange = (type: NotificationType) => {
    setNotifTypes((prev) => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const handleSaveNotificationPrefs = () => {
    setNotificationPreferences({ enabled: notifEnabled, types: notifTypes });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Settings</Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
        >
          Save Changes
        </Button>
      </Box>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Accessibility Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Accessibility Settings" />
            <Divider />
            <CardContent>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <ContrastIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="High Contrast Mode"
                    secondary="Increases contrast for better visibility"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={accessibilitySettings.highContrastMode}
                      onChange={toggleHighContrast}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TextFieldsIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Large Text Mode"
                    secondary="Increases text size for better readability"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={accessibilitySettings.largeText}
                      onChange={toggleLargeText}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ReduceMotionIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Reduce Motion"
                    secondary="Minimizes animations and transitions"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={accessibilitySettings.reduceMotion}
                      onChange={toggleReduceMotion}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AccessibilityIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Screen Reader Optimization"
                    secondary="Adds additional labels and descriptions for screen readers"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={accessibilitySettings.screenReaderOptimization}
                      onChange={toggleScreenReaderOptimization}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider sx={{ my: 2 }} />
                <ListItem>
                  <ListItemText
                    primary="Accessibility Chart Examples"
                    secondary="View examples of accessible charts with high contrast and pattern fills"
                  />
                  <ListItemSecondaryAction>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => history.push('/settings/accessibility/chart-examples')}
                    >
                      View Examples
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Notifications" />
            <Divider />
            <CardContent>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <NotificationIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email Notifications"
                    secondary="Receive email notifications for important updates"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card sx={{ mt: 3 }}>
            <CardHeader title="Appearance" />
            <Divider />
            <CardContent>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <DarkModeIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Theme"
                    secondary="Select a color theme"
                  />
                  <ListItemSecondaryAction>
                    <Select
                      value={mode}
                      onChange={(e) => setMode(e.target.value as ThemeMode)}
                      size="small"
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value="light">Light</MenuItem>
                      <MenuItem value="dark">Dark</MenuItem>
                      <MenuItem value="darkBlue">Dark Blue</MenuItem>
                      <MenuItem value="energy">Energy</MenuItem>
                      <MenuItem value="blue">Blue</MenuItem>
                      <MenuItem value="gray">Gray</MenuItem>
                    </Select>
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LanguageIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Language"
                    secondary="Select your preferred language"
                  />
                  <ListItemSecondaryAction>
                    <Select
                      value={settings.language}
                      onChange={(e) => handleSettingChange('language', e.target.value)}
                      size="small"
                      sx={{ minWidth: 120 }}
                    >
                      {languages.map((lang) => (
                        <MenuItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card sx={{ mt: 3 }}>
            <CardHeader title="Notification Preferences" />
            <Divider />
            <CardContent>
              <List>
                <ListItem>
                  <ListItemText primary="Enable Notifications" />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={notifEnabled}
                      onChange={(e) => setNotifEnabled(e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem alignItems="flex-start" sx={{ alignItems: { xs: 'flex-start', sm: 'center' } }}>
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item xs={12} sm={4} md={3}>
                      <ListItemText primary="Notification Types" secondary="Select which types of notifications you want to receive" />
                    </Grid>
                    <Grid item xs={12} sm={8} md={9}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <Button
                          variant={notifTypes.includes(NotificationType.Info) ? 'contained' : 'outlined'}
                          onClick={() => handleNotifTypeChange(NotificationType.Info)}
                          sx={{ minWidth: 90 }}
                        >Info</Button>
                        <Button
                          variant={notifTypes.includes(NotificationType.Success) ? 'contained' : 'outlined'}
                          onClick={() => handleNotifTypeChange(NotificationType.Success)}
                          sx={{ minWidth: 90 }}
                        >Success</Button>
                        <Button
                          variant={notifTypes.includes(NotificationType.Warning) ? 'contained' : 'outlined'}
                          onClick={() => handleNotifTypeChange(NotificationType.Warning)}
                          sx={{ minWidth: 90 }}
                        >Warning</Button>
                        <Button
                          variant={notifTypes.includes(NotificationType.Error) ? 'contained' : 'outlined'}
                          onClick={() => handleNotifTypeChange(NotificationType.Error)}
                          sx={{ minWidth: 90 }}
                        >Error</Button>
                      </Box>
                    </Grid>
                  </Grid>
                </ListItem>
              </List>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button variant="contained" onClick={handleSaveNotificationPrefs}>
                  Save Notification Preferences
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Privacy & Security Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Privacy" />
            <Divider />
            <CardContent>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <VisibilityIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Profile Visibility"
                    secondary="Control who can see your profile"
                  />
                  <ListItemSecondaryAction>
                    <Select
                      value={settings.visibility}
                      onChange={(e) => handleSettingChange('visibility', e.target.value)}
                      size="small"
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value="public">Public</MenuItem>
                      <MenuItem value="private">Private</MenuItem>
                      <MenuItem value="team">Team Only</MenuItem>
                    </Select>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardHeader title="Security" />
            <Divider />
            <CardContent>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <LockIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Two-Factor Authentication"
                    secondary="Add an extra layer of security"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={settings.twoFactorAuth}
                      onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card sx={{ mt: 3, bgcolor: 'error.main' }}>
            <CardHeader
              title={
                <Typography color="white">Danger Zone</Typography>
              }
            />
            <Divider />
            <CardContent>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialog(true)}
                sx={{ backgroundColor: 'white', '&:hover': { backgroundColor: 'grey.100' } }}
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete your account? This action cannot be undone
            and all your data will be permanently deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button color="error" onClick={() => setDeleteDialog(false)}>
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Settings;
