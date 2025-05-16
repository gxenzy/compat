import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Grid,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import type { SystemSettings } from '../../../types';
import { UserRole } from '../../../types';
import * as adminService from '../../../services/adminService';
import { SelectChangeEvent } from '@mui/material';

const SystemSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: '',
    maintenanceMode: false,
    registrationEnabled: true,
    allowRegistration: true,
    defaultRole: UserRole.VIEWER,
    passwordPolicy: {
      minLength: 8,
      requireSpecialChar: true,
      requireNumber: true,
      requireUppercase: true,
      requireLowercase: true
    },
    sessionTimeout: 30,
    maxLoginAttempts: 5
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getSystemSettings();
      
      // Ensure we're correctly handling the response
      const cleanedData = { ...data };
      
      // Set the settings state with the cleaned data
      setSettings(cleanedData);
    } catch (error: any) {
      console.error('Error loading settings:', error);
      setError('Failed to load system settings: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setSettings(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePasswordPolicyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      passwordPolicy: {
        ...prev.passwordPolicy,
        [name]: type === 'checkbox' ? checked : parseInt(value)
      }
    }));
  };

  const handleRoleChange = (event: SelectChangeEvent<UserRole>) => {
    const { value } = event.target;
    setSettings(prev => ({
      ...prev,
      defaultRole: value as UserRole
    }));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      await adminService.updateSystemSettings(settings);
      
      setSuccess('Settings updated successfully');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setError('Failed to update settings: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        System Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  General Settings
                </Typography>
                <TextField
                  fullWidth
                  label="Site Name"
                  name="siteName"
                  value={settings.siteName}
                  onChange={handleInputChange}
                  margin="normal"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.maintenanceMode}
                      onChange={handleInputChange}
                      name="maintenanceMode"
                    />
                  }
                  label="Maintenance Mode"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.registrationEnabled}
                      onChange={handleInputChange}
                      name="registrationEnabled"
                    />
                  }
                  label="Enable Registration"
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Default Role</InputLabel>
                  <Select
                    name="defaultRole"
                    value={settings.defaultRole}
                    onChange={handleRoleChange}
                    label="Default Role"
                  >
                    {Object.values(UserRole).map((role) => (
                      <MenuItem key={role} value={role}>
                        {role}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Security Settings
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  label="Session Timeout (minutes)"
                  name="sessionTimeout"
                  value={settings.sessionTimeout}
                  onChange={handleInputChange}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Max Login Attempts"
                  name="maxLoginAttempts"
                  value={settings.maxLoginAttempts}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Password Policy
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Minimum Length"
                      name="minLength"
                      value={settings.passwordPolicy.minLength}
                      onChange={handlePasswordPolicyChange}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.passwordPolicy.requireSpecialChar}
                          onChange={handlePasswordPolicyChange}
                          name="requireSpecialChar"
                        />
                      }
                      label="Require Special Characters"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.passwordPolicy.requireNumber}
                          onChange={handlePasswordPolicyChange}
                          name="requireNumber"
                        />
                      }
                      label="Require Numbers"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.passwordPolicy.requireUppercase}
                          onChange={handlePasswordPolicyChange}
                          name="requireUppercase"
                        />
                      }
                      label="Require Uppercase"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.passwordPolicy.requireLowercase}
                          onChange={handlePasswordPolicyChange}
                          name="requireLowercase"
                        />
                      }
                      label="Require Lowercase"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default SystemSettingsPage; 