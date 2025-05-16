const { pool, query } = require('../config/database');
const SystemSettings = require('../models/SystemSettings');

// Create or ensure the system_settings table exists
const initializeSystemSettings = async () => {
  try {
    // Force sync to create the table if it doesn't exist
    await SystemSettings.sync();
    
    // Check if we have default settings
    const count = await SystemSettings.count();
    
    // Add default settings if none exist
    if (count === 0) {
      console.log('Creating default system settings...');
      const defaultSettings = [
        { setting_key: 'siteName', setting_value: 'Energy Audit System', description: 'Site name' },
        { setting_key: 'maxUsers', setting_value: '100', description: 'Maximum number of users' }, 
        { setting_key: 'sessionTimeout', setting_value: '30', description: 'Session timeout in minutes' },
        { setting_key: 'maintenanceMode', setting_value: 'false', description: 'Maintenance mode' },
        { setting_key: 'allowRegistration', setting_value: 'false', description: 'Allow user registration' },
        { setting_key: 'registrationEnabled', setting_value: 'false', description: 'User registration enabled' },
        { setting_key: 'defaultRole', setting_value: 'viewer', description: 'Default role for new users' },
        { setting_key: 'passwordPolicy.minLength', setting_value: '8', description: 'Minimum password length' },
        { setting_key: 'passwordPolicy.requireSpecialChar', setting_value: 'true', description: 'Require special character in password' },
        { setting_key: 'passwordPolicy.requireNumber', setting_value: 'true', description: 'Require number in password' },
        { setting_key: 'passwordPolicy.requireUppercase', setting_value: 'true', description: 'Require uppercase letter in password' },
        { setting_key: 'passwordPolicy.requireLowercase', setting_value: 'true', description: 'Require lowercase letter in password' },
        { setting_key: 'maxLoginAttempts', setting_value: '5', description: 'Maximum login attempts before lockout' },
      ];
      
      // Create default settings
      await SystemSettings.bulkCreate(defaultSettings);
    }
    
    console.log('System settings initialized');
  } catch (error) {
    console.error('Error initializing system settings:', error);
  }
};

// Initialize system settings on module load
initializeSystemSettings();

/**
 * Get system settings
 * @route GET /api/admin/settings
 * @access Admin only
 */
const getSystemSettings = async (req, res) => {
  try {
    // Get settings from database
    const settingsRows = await SystemSettings.findAll();
    
    if (!settingsRows.length) {
      return res.status(404).json({ message: 'System settings not found' });
    }
    
    // Convert flat settings rows to structured object
    const settings = {};
    
    settingsRows.forEach(row => {
      // Handle nested properties (with dot notation)
      if (row.setting_key.includes('.')) {
        const [parent, child] = row.setting_key.split('.');
        if (!settings[parent]) settings[parent] = {};
        
        // Handle boolean values
        if (row.setting_value === 'true') {
          settings[parent][child] = true;
        } else if (row.setting_value === 'false') {
          settings[parent][child] = false;
        } else if (!isNaN(Number(row.setting_value))) {
          settings[parent][child] = Number(row.setting_value);
        } else {
          settings[parent][child] = row.setting_value;
        }
      } else {
        // Handle boolean values
        if (row.setting_value === 'true') {
          settings[row.setting_key] = true;
        } else if (row.setting_value === 'false') {
          settings[row.setting_key] = false;
        } else if (!isNaN(Number(row.setting_value))) {
          settings[row.setting_key] = Number(row.setting_value);
        } else {
          settings[row.setting_key] = row.setting_value;
        }
      }
    });
    
    // Set default values for missing settings
    const systemSettings = {
      siteName: settings.siteName || 'Energy Audit System',
      maxUsers: settings.maxUsers || 100,
      sessionTimeout: settings.sessionTimeout || 30,
      backupFrequency: settings.backupFrequency || 24,
      emailNotifications: settings.emailNotifications !== undefined ? settings.emailNotifications : true,
      maintenanceMode: settings.maintenanceMode !== undefined ? settings.maintenanceMode : false,
      emergencyMode: settings.emergencyMode !== undefined ? settings.emergencyMode : false,
      debugMode: settings.debugMode !== undefined ? settings.debugMode : false,
      apiUrl: settings.apiUrl || 'http://localhost:8000',
      allowRegistration: settings.allowRegistration !== undefined ? settings.allowRegistration : false,
      registrationEnabled: settings.registrationEnabled !== undefined ? settings.registrationEnabled : false,
      theme: settings.theme || 'light',
      defaultRole: settings.defaultRole || 'viewer',
      passwordPolicy: {
        minLength: settings.passwordPolicy?.minLength || 8,
        requireSpecialChar: settings.passwordPolicy?.requireSpecialChar !== undefined 
          ? settings.passwordPolicy.requireSpecialChar 
          : true,
        requireNumber: settings.passwordPolicy?.requireNumber !== undefined 
          ? settings.passwordPolicy.requireNumber 
          : true,
        requireUppercase: settings.passwordPolicy?.requireUppercase !== undefined 
          ? settings.passwordPolicy.requireUppercase
          : true,
        requireLowercase: settings.passwordPolicy?.requireLowercase !== undefined
          ? settings.passwordPolicy.requireLowercase
          : true,
      },
      maxLoginAttempts: settings.maxLoginAttempts || 5,
    };
    
    return res.json(systemSettings);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return res.status(500).json({ message: 'Error fetching system settings' });
  }
};

/**
 * Update system settings
 * @route PUT /api/admin/settings
 * @access Admin only
 */
const updateSystemSettings = async (req, res) => {
  try {
    const settings = req.body;
    
    // Prepare batch insert/update operations
    const operations = [];
    
    // Flat properties
    for (const [key, value] of Object.entries(settings)) {
      // Skip nested objects
      if (typeof value !== 'object' || value === null) {
        operations.push({
          setting_key: key, 
          setting_value: value?.toString()
        });
      }
    }
    
    // Handle password policy separately
    if (settings.passwordPolicy) {
      for (const [key, value] of Object.entries(settings.passwordPolicy)) {
        operations.push({
          setting_key: `passwordPolicy.${key}`, 
          setting_value: value?.toString()
        });
      }
    }
    
    // Execute batch operations
    if (operations.length > 0) {
      for (const op of operations) {
        await SystemSettings.upsert(op);
      }
    }
    
    // Return updated settings
    return res.json({ 
      message: 'Settings updated successfully',
      ...settings 
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    return res.status(500).json({ message: 'Error updating system settings' });
  }
};

module.exports = {
  getSystemSettings,
  updateSystemSettings
}; 