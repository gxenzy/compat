import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormHelperText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ImportExport as ImportExportIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import complianceService from '../../services/complianceService';
import { debugLog } from '../../utils/debug';
import { normalizeDataFormat } from '../../utils/dataFormatters';

const StandardsManagement = () => {
  // State for tab management
  const [tabValue, setTabValue] = useState(0);

  // State for data grids
  const [buildingStandards, setBuildingStandards] = useState([]);
  const [projectStandards, setProjectStandards] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  // Edit/Add dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [dialogType, setDialogType] = useState('building'); // 'building', 'project', or 'recommendation'
  const [currentItem, setCurrentItem] = useState(null);
  
  // Form validation state
  const [formErrors, setFormErrors] = useState({});

  // Form data for building standards
  const [buildingForm, setBuildingForm] = useState({
    buildingType: '',
    standardType: '',
    standardCode: '',
    minimumValue: '',
    maximumValue: '',
    unit: '',
    description: ''
  });

  // Form data for project standards
  const [projectForm, setProjectForm] = useState({
    projectType: '',
    standardType: '',
    standardCode: '',
    minimumValue: '',
    maximumValue: '',
    unit: '',
    description: ''
  });

  // Form data for recommendations
  const [recommendationForm, setRecommendationForm] = useState({
    ruleId: '',
    nonComplianceType: '',
    recommendationText: '',
    priority: 'medium',
    calculatorType: ''
  });

  // Import/Export dialog
  const [importExportDialog, setImportExportDialog] = useState(false);
  const [importData, setImportData] = useState('');
  const [importErrors, setImportErrors] = useState(null);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Load data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      debugLog('StandardsManagement', 'Loading standards data...');
      
      // Get data from API service
      const results = await Promise.all([
        complianceService.getAllBuildingTypeStandards(),
        complianceService.getAllProjectTypeStandards(),
        complianceService.getAllComplianceRecommendations()
      ]);
      
      const buildingData = results[0];
      const projectData = results[1];
      const recommendationsData = results[2];
      
      // Log the data after transformation for debugging
      console.log('Building Standards:', buildingData);
      console.log('Project Standards:', projectData);
      console.log('Recommendations:', recommendationsData);
      
      // Verify data format
      if (!Array.isArray(buildingData)) {
        debugLog('StandardsManagement', 'ERROR: Building standards data is not an array:', buildingData);
        setError('Building standards data is not in the expected format. Please refresh or contact support.');
        return;
      }
      
      if (!Array.isArray(projectData)) {
        debugLog('StandardsManagement', 'ERROR: Project standards data is not an array:', projectData);
        setError('Project standards data is not in the expected format. Please refresh or contact support.');
        return;
      }
      
      if (!Array.isArray(recommendationsData)) {
        debugLog('StandardsManagement', 'ERROR: Recommendations data is not an array:', recommendationsData);
        setError('Recommendations data is not in the expected format. Please refresh or contact support.');
        return;
      }
      
      setBuildingStandards(buildingData);
      setProjectStandards(projectData);
      setRecommendations(recommendationsData);
      
      setNotification({
        open: true,
        message: `Successfully loaded ${buildingData.length} building standards, ${projectData.length} project standards, and ${recommendationsData.length} recommendations`,
        severity: 'success'
      });
    } catch (err) {
      debugLog('StandardsManagement', 'Error loading standards data:', err);
      
      if (err.response) {
        debugLog('StandardsManagement', 'Error response data:', err.response.data);
        debugLog('StandardsManagement', 'Error response status:', err.response.status);
      }
      
      setError('Failed to load standards data. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Validate form data
  const validateForm = (type, data) => {
    const errors = {};
    
    if (type === 'building' || type === 'project') {
      const typeField = type === 'building' ? 'buildingType' : 'projectType';
      const typeLabel = type === 'building' ? 'Building Type' : 'Project Type';
      
      if (!data[typeField]) {
        errors[typeField] = `${typeLabel} is required`;
      }
      
      if (!data.standardType) {
        errors.standardType = 'Standard Type is required';
      }
      
      if (!data.standardCode) {
        errors.standardCode = 'Standard Code is required';
      }
      
      if (data.minimumValue && data.maximumValue && 
          parseFloat(data.minimumValue) > parseFloat(data.maximumValue)) {
        errors.minimumValue = 'Minimum value cannot be greater than maximum value';
      }
    } else if (type === 'recommendation') {
      if (!data.ruleId) {
        errors.ruleId = 'Rule ID is required';
      } else if (isNaN(parseInt(data.ruleId, 10))) {
        errors.ruleId = 'Rule ID must be a number';
      }
      
      if (!data.nonComplianceType) {
        errors.nonComplianceType = 'Non-Compliance Type is required';
      }
      
      if (!data.recommendationText) {
        errors.recommendationText = 'Recommendation Text is required';
      }
      
      if (!data.calculatorType) {
        errors.calculatorType = 'Calculator Type is required';
      }
    }
    
    return errors;
  };

  // Handle open dialog for add/edit
  const handleOpenDialog = (mode, type, item = null) => {
    setDialogMode(mode);
    setDialogType(type);
    setCurrentItem(item);
    setFormErrors({});
    
    // Reset form data based on type
    if (type === 'building') {
      setBuildingForm(mode === 'add' ? {
        buildingType: '',
        standardType: '',
        standardCode: '',
        minimumValue: '',
        maximumValue: '',
        unit: '',
        description: ''
      } : {
        buildingType: item.buildingType,
        standardType: item.standardType,
        standardCode: item.standardCode,
        minimumValue: item.minimumValue !== null ? item.minimumValue.toString() : '',
        maximumValue: item.maximumValue !== null ? item.maximumValue.toString() : '',
        unit: item.unit || '',
        description: item.description || ''
      });
    } else if (type === 'project') {
      setProjectForm(mode === 'add' ? {
        projectType: '',
        standardType: '',
        standardCode: '',
        minimumValue: '',
        maximumValue: '',
        unit: '',
        description: ''
      } : {
        projectType: item.projectType,
        standardType: item.standardType,
        standardCode: item.standardCode,
        minimumValue: item.minimumValue !== null ? item.minimumValue.toString() : '',
        maximumValue: item.maximumValue !== null ? item.maximumValue.toString() : '',
        unit: item.unit || '',
        description: item.description || ''
      });
    } else if (type === 'recommendation') {
      setRecommendationForm(mode === 'add' ? {
        ruleId: '',
        nonComplianceType: '',
        recommendationText: '',
        priority: 'medium',
        calculatorType: ''
      } : {
        ruleId: item.ruleId?.toString() || '',
        nonComplianceType: item.nonComplianceType || '',
        recommendationText: item.recommendationText || '',
        priority: item.priority || 'medium',
        calculatorType: item.calculatorType || ''
      });
    }
    
    setDialogOpen(true);
  };

  // Handle close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormErrors({});
  };

  // Handle form submission
  const handleSubmit = async () => {
    const formData = dialogType === 'building' 
      ? buildingForm 
      : dialogType === 'project' 
        ? projectForm 
        : recommendationForm;
    
    // Validate form data
    const errors = validateForm(dialogType, formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setLoading(true);
    try {
      let result;
      let data;
      
      if (dialogType === 'building') {
        data = {
          ...buildingForm,
          minimumValue: buildingForm.minimumValue !== '' ? parseFloat(buildingForm.minimumValue) : null,
          maximumValue: buildingForm.maximumValue !== '' ? parseFloat(buildingForm.maximumValue) : null
        };
        
        debugLog('StandardsManagement', `${dialogMode === 'add' ? 'Creating' : 'Updating'} building standard:`, data);
        
        if (dialogMode === 'add') {
          result = await complianceService.createBuildingTypeStandard(data);
          debugLog('StandardsManagement', 'Building standard created:', result);
          setBuildingStandards([...buildingStandards, result]);
        } else {
          result = await complianceService.updateBuildingTypeStandard(currentItem.id, data);
          debugLog('StandardsManagement', 'Building standard updated:', result);
          setBuildingStandards(buildingStandards.map(item => 
            item.id === currentItem.id ? result : item
          ));
        }
      } else if (dialogType === 'project') {
        data = {
          ...projectForm,
          minimumValue: projectForm.minimumValue !== '' ? parseFloat(projectForm.minimumValue) : null,
          maximumValue: projectForm.maximumValue !== '' ? parseFloat(projectForm.maximumValue) : null
        };
        
        debugLog('StandardsManagement', `${dialogMode === 'add' ? 'Creating' : 'Updating'} project standard:`, data);
        
        if (dialogMode === 'add') {
          result = await complianceService.createProjectTypeStandard(data);
          debugLog('StandardsManagement', 'Project standard created:', result);
          setProjectStandards([...projectStandards, result]);
        } else {
          result = await complianceService.updateProjectTypeStandard(currentItem.id, data);
          debugLog('StandardsManagement', 'Project standard updated:', result);
          setProjectStandards(projectStandards.map(item => 
            item.id === currentItem.id ? result : item
          ));
        }
      } else if (dialogType === 'recommendation') {
        data = {
          ...recommendationForm,
          ruleId: parseInt(recommendationForm.ruleId, 10)
        };
        
        debugLog('StandardsManagement', `${dialogMode === 'add' ? 'Creating' : 'Updating'} recommendation:`, data);
        
        if (dialogMode === 'add') {
          result = await complianceService.createComplianceRecommendation(data);
          debugLog('StandardsManagement', 'Recommendation created:', result);
          setRecommendations([...recommendations, result]);
        } else {
          result = await complianceService.updateComplianceRecommendation(currentItem.id, data);
          debugLog('StandardsManagement', 'Recommendation updated:', result);
          setRecommendations(recommendations.map(item => 
            item.id === currentItem.id ? result : item
          ));
        }
      }
      
      setNotification({
        open: true,
        message: `Standard ${dialogMode === 'add' ? 'created' : 'updated'} successfully`,
        severity: 'success'
      });
      
      setDialogOpen(false);
    } catch (err) {
      debugLog('StandardsManagement', 'Error submitting data:', err);
      
      if (err.response) {
        debugLog('StandardsManagement', 'Error response data:', err.response.data);
      }
      
      setNotification({
        open: true,
        message: `Failed to ${dialogMode} standard: ${err.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete item
  const handleDelete = async (type, id) => {
    if (!window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      if (type === 'building') {
        await complianceService.deleteBuildingTypeStandard(id);
        setBuildingStandards(buildingStandards.filter(item => item.id !== id));
      } else if (type === 'project') {
        await complianceService.deleteProjectTypeStandard(id);
        setProjectStandards(projectStandards.filter(item => item.id !== id));
      } else if (type === 'recommendation') {
        await complianceService.deleteComplianceRecommendation(id);
        setRecommendations(recommendations.filter(item => item.id !== id));
      }
      
      setNotification({
        open: true,
        message: 'Item deleted successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error deleting item:', err);
      setNotification({
        open: true,
        message: `Failed to delete item: ${err.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle notification close
  const handleNotificationClose = () => {
    setNotification({ ...notification, open: false });
  };

  // Handle import/export dialog open
  const handleOpenImportExport = () => {
    setImportExportDialog(true);
    setImportData('');
    setImportErrors(null);
  };

  // Handle import/export dialog close
  const handleCloseImportExport = () => {
    setImportExportDialog(false);
  };

  // Handle export data
  const handleExportData = () => {
    const dataToExport = {
      buildingStandards,
      projectStandards,
      recommendations
    };
    
    const jsonData = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'standards-export.json';
    link.click();
    
    URL.revokeObjectURL(url);
    
    setNotification({
      open: true,
      message: 'Data exported successfully',
      severity: 'success'
    });
    
    setImportExportDialog(false);
  };

  // Handle import data
  const handleImportData = () => {
    try {
      const parsedData = JSON.parse(importData);
      
      // Validate imported data
      if (!parsedData.buildingStandards || !Array.isArray(parsedData.buildingStandards)) {
        setImportErrors('Invalid data format: buildingStandards must be an array');
        return;
      }
      
      if (!parsedData.projectStandards || !Array.isArray(parsedData.projectStandards)) {
        setImportErrors('Invalid data format: projectStandards must be an array');
        return;
      }
      
      if (!parsedData.recommendations || !Array.isArray(parsedData.recommendations)) {
        setImportErrors('Invalid data format: recommendations must be an array');
        return;
      }
      
      // Normalize data
      const normalizedBuildingStandards = parsedData.buildingStandards.map(item => normalizeDataFormat(item));
      const normalizedProjectStandards = parsedData.projectStandards.map(item => normalizeDataFormat(item));
      const normalizedRecommendations = parsedData.recommendations.map(item => normalizeDataFormat(item));
      
      // Update state
      setBuildingStandards(normalizedBuildingStandards);
      setProjectStandards(normalizedProjectStandards);
      setRecommendations(normalizedRecommendations);
      
      setNotification({
        open: true,
        message: 'Data imported successfully',
        severity: 'success'
      });
      
      setImportExportDialog(false);
    } catch (err) {
      setImportErrors(`Failed to parse imported data: ${err.message}`);
    }
  };

  // Define building standards columns
  const buildingStandardsColumns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'buildingType', headerName: 'Building Type', width: 150 },
    { field: 'standardType', headerName: 'Standard Type', width: 150 },
    { field: 'standardCode', headerName: 'Standard Code', width: 150 },
    { 
      field: 'minimumValue', 
      headerName: 'Min Value', 
      width: 120,
      valueFormatter: (params) => {
        return params.value !== null && params.value !== undefined ? params.value : 'N/A';
      }
    },
    { 
      field: 'maximumValue', 
      headerName: 'Max Value', 
      width: 120,
      valueFormatter: (params) => {
        return params.value !== null && params.value !== undefined ? params.value : 'N/A';
      }
    },
    { field: 'unit', headerName: 'Unit', width: 100 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box>
          <IconButton
            color="primary"
            onClick={() => handleOpenDialog('edit', 'building', params.row)}
            size="small"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDelete('building', params.row.id)}
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ];

  // Define project standards columns
  const projectStandardsColumns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'projectType', headerName: 'Project Type', width: 150 },
    { field: 'standardType', headerName: 'Standard Type', width: 150 },
    { field: 'standardCode', headerName: 'Standard Code', width: 150 },
    { 
      field: 'minimumValue', 
      headerName: 'Min Value', 
      width: 120,
      valueFormatter: (params) => {
        return params.value !== null && params.value !== undefined ? params.value : 'N/A';
      }
    },
    { 
      field: 'maximumValue', 
      headerName: 'Max Value', 
      width: 120,
      valueFormatter: (params) => {
        return params.value !== null && params.value !== undefined ? params.value : 'N/A';
      }
    },
    { field: 'unit', headerName: 'Unit', width: 100 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box>
          <IconButton
            color="primary"
            onClick={() => handleOpenDialog('edit', 'project', params.row)}
            size="small"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDelete('project', params.row.id)}
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ];

  // Define recommendations columns
  const recommendationsColumns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'ruleId', headerName: 'Rule ID', width: 100 },
    { field: 'nonComplianceType', headerName: 'Non-Compliance Type', width: 180 },
    { field: 'calculatorType', headerName: 'Calculator Type', width: 150 },
    { 
      field: 'priority', 
      headerName: 'Priority', 
      width: 120,
      valueFormatter: (params) => {
        return params.value ? params.value.charAt(0).toUpperCase() + params.value.slice(1) : '';
      }
    },
    { field: 'recommendationText', headerName: 'Recommendation', width: 300 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box>
          <IconButton
            color="primary"
            onClick={() => handleOpenDialog('edit', 'recommendation', params.row)}
            size="small"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDelete('recommendation', params.row.id)}
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ];

  // Render building standards form
  const renderBuildingStandardsForm = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Building Type"
          value={buildingForm.buildingType}
          onChange={(e) => setBuildingForm({ ...buildingForm, buildingType: e.target.value })}
          fullWidth
          required
          error={!!formErrors.buildingType}
          helperText={formErrors.buildingType}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Standard Type"
          value={buildingForm.standardType}
          onChange={(e) => setBuildingForm({ ...buildingForm, standardType: e.target.value })}
          fullWidth
          required
          error={!!formErrors.standardType}
          helperText={formErrors.standardType}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Standard Code"
          value={buildingForm.standardCode}
          onChange={(e) => setBuildingForm({ ...buildingForm, standardCode: e.target.value })}
          fullWidth
          required
          error={!!formErrors.standardCode}
          helperText={formErrors.standardCode}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Unit"
          value={buildingForm.unit}
          onChange={(e) => setBuildingForm({ ...buildingForm, unit: e.target.value })}
          fullWidth
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Minimum Value"
          value={buildingForm.minimumValue}
          onChange={(e) => setBuildingForm({ ...buildingForm, minimumValue: e.target.value })}
          fullWidth
          type="number"
          error={!!formErrors.minimumValue}
          helperText={formErrors.minimumValue}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Maximum Value"
          value={buildingForm.maximumValue}
          onChange={(e) => setBuildingForm({ ...buildingForm, maximumValue: e.target.value })}
          fullWidth
          type="number"
          error={!!formErrors.maximumValue}
          helperText={formErrors.maximumValue}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Description"
          value={buildingForm.description}
          onChange={(e) => setBuildingForm({ ...buildingForm, description: e.target.value })}
          fullWidth
          multiline
          rows={3}
        />
      </Grid>
    </Grid>
  );

  // Render project standards form
  const renderProjectStandardsForm = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Project Type"
          value={projectForm.projectType}
          onChange={(e) => setProjectForm({ ...projectForm, projectType: e.target.value })}
          fullWidth
          required
          error={!!formErrors.projectType}
          helperText={formErrors.projectType}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Standard Type"
          value={projectForm.standardType}
          onChange={(e) => setProjectForm({ ...projectForm, standardType: e.target.value })}
          fullWidth
          required
          error={!!formErrors.standardType}
          helperText={formErrors.standardType}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Standard Code"
          value={projectForm.standardCode}
          onChange={(e) => setProjectForm({ ...projectForm, standardCode: e.target.value })}
          fullWidth
          required
          error={!!formErrors.standardCode}
          helperText={formErrors.standardCode}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Unit"
          value={projectForm.unit}
          onChange={(e) => setProjectForm({ ...projectForm, unit: e.target.value })}
          fullWidth
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Minimum Value"
          value={projectForm.minimumValue}
          onChange={(e) => setProjectForm({ ...projectForm, minimumValue: e.target.value })}
          fullWidth
          type="number"
          error={!!formErrors.minimumValue}
          helperText={formErrors.minimumValue}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Maximum Value"
          value={projectForm.maximumValue}
          onChange={(e) => setProjectForm({ ...projectForm, maximumValue: e.target.value })}
          fullWidth
          type="number"
          error={!!formErrors.maximumValue}
          helperText={formErrors.maximumValue}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Description"
          value={projectForm.description}
          onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
          fullWidth
          multiline
          rows={3}
        />
      </Grid>
    </Grid>
  );

  // Render recommendations form
  const renderRecommendationsForm = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Rule ID"
          value={recommendationForm.ruleId}
          onChange={(e) => setRecommendationForm({ ...recommendationForm, ruleId: e.target.value })}
          fullWidth
          required
          type="number"
          error={!!formErrors.ruleId}
          helperText={formErrors.ruleId}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Non-Compliance Type"
          value={recommendationForm.nonComplianceType}
          onChange={(e) => setRecommendationForm({ ...recommendationForm, nonComplianceType: e.target.value })}
          fullWidth
          required
          error={!!formErrors.nonComplianceType}
          helperText={formErrors.nonComplianceType}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Calculator Type"
          value={recommendationForm.calculatorType}
          onChange={(e) => setRecommendationForm({ ...recommendationForm, calculatorType: e.target.value })}
          fullWidth
          required
          error={!!formErrors.calculatorType}
          helperText={formErrors.calculatorType}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Priority</InputLabel>
          <Select
            value={recommendationForm.priority}
            label="Priority"
            onChange={(e) => setRecommendationForm({ ...recommendationForm, priority: e.target.value })}
          >
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Recommendation Text"
          value={recommendationForm.recommendationText}
          onChange={(e) => setRecommendationForm({ ...recommendationForm, recommendationText: e.target.value })}
          fullWidth
          multiline
          rows={4}
          required
          error={!!formErrors.recommendationText}
          helperText={formErrors.recommendationText}
        />
      </Grid>
    </Grid>
  );

  // Render the active form based on dialog type
  const renderActiveForm = () => {
    switch (dialogType) {
      case 'building':
        return renderBuildingStandardsForm();
      case 'project':
        return renderProjectStandardsForm();
      case 'recommendation':
        return renderRecommendationsForm();
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Standards Management
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button 
          variant="outlined" 
          color="primary" 
          startIcon={<RefreshIcon />}
          onClick={loadData}
        >
          Refresh Data
        </Button>
        <Button 
          variant="outlined" 
          color="secondary" 
          startIcon={<ImportExportIcon />}
          onClick={handleOpenImportExport}
        >
          Import/Export
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Building Standards" />
          <Tab label="Project Standards" />
          <Tab label="Recommendations" />
        </Tabs>

        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog(
              'add', 
              tabValue === 0 ? 'building' : tabValue === 1 ? 'project' : 'recommendation'
            )}
          >
            Add New
          </Button>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        <Box sx={{ height: 500, width: '100%', p: 2 }}>
          {tabValue === 0 && (
            <DataGrid
              rows={buildingStandards}
              columns={buildingStandardsColumns}
              pageSize={10}
              loading={loading}
              disableSelectionOnClick
              density="compact"
              autoHeight
            />
          )}
          {tabValue === 1 && (
            <DataGrid
              rows={projectStandards}
              columns={projectStandardsColumns}
              pageSize={10}
              loading={loading}
              disableSelectionOnClick
              density="compact"
              autoHeight
            />
          )}
          {tabValue === 2 && (
            <DataGrid
              rows={recommendations}
              columns={recommendationsColumns}
              pageSize={10}
              loading={loading}
              disableSelectionOnClick
              density="compact"
              autoHeight
            />
          )}
        </Box>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New' : 'Edit'} {
            dialogType === 'building' 
              ? 'Building Standard' 
              : dialogType === 'project' 
                ? 'Project Standard' 
                : 'Recommendation'
          }
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {renderActiveForm()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import/Export Dialog */}
      <Dialog open={importExportDialog} onClose={handleCloseImportExport} maxWidth="md" fullWidth>
        <DialogTitle>
          Import/Export Standards
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  You can export the current standards data as JSON or import standards from a JSON file.
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleExportData}
                  sx={{ mr: 2 }}
                >
                  Export Data
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Import Data
                </Typography>
                <TextField
                  multiline
                  rows={10}
                  fullWidth
                  placeholder="Paste JSON data here..."
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  error={!!importErrors}
                  helperText={importErrors}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImportExport}>
            Cancel
          </Button>
          <Button 
            onClick={handleImportData} 
            variant="contained" 
            color="primary"
            disabled={!importData}
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
      >
        <Alert onClose={handleNotificationClose} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StandardsManagement; 