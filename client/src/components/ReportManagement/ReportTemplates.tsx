import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper
} from '@mui/material';
import { useHistory } from 'react-router-dom';
import { ReportTemplate, ReportType } from '../../types/reports';
import reportService from '../../services/reportService';

// Mock templates until API is implemented
export const MOCK_TEMPLATES: ReportTemplate[] = [
  {
    id: 1,
    name: 'Energy Audit Standard Report',
    description: 'Comprehensive energy audit report with executive summary, findings, and recommendations',
    thumbnail: '/templates/energy-audit-standard.jpg',
    report_type: 'energy_audit',
    is_default: true,
    created_at: '2023-06-01T00:00:00Z',
    updated_at: '2023-06-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Lighting Assessment',
    description: 'Detailed lighting assessment with fixture inventory and upgrade recommendations',
    thumbnail: '/templates/lighting-assessment.jpg',
    report_type: 'lighting',
    is_default: true,
    created_at: '2023-06-02T00:00:00Z',
    updated_at: '2023-06-02T00:00:00Z'
  },
  {
    id: 3,
    name: 'HVAC Analysis Report',
    description: 'HVAC system analysis with performance metrics and efficiency recommendations',
    thumbnail: '/templates/hvac-analysis.jpg',
    report_type: 'hvac',
    is_default: true,
    created_at: '2023-06-03T00:00:00Z',
    updated_at: '2023-06-03T00:00:00Z'
  },
  {
    id: 4,
    name: 'Equipment Efficiency Report',
    description: 'Equipment inventory and efficiency analysis with upgrade recommendations',
    thumbnail: '/templates/equipment-efficiency.jpg',
    report_type: 'equipment',
    is_default: true,
    created_at: '2023-06-04T00:00:00Z',
    updated_at: '2023-06-04T00:00:00Z'
  },
  {
    id: 5,
    name: 'Power Factor Analysis',
    description: 'Power factor analysis with correction recommendations',
    thumbnail: '/templates/power-factor.jpg',
    report_type: 'power_factor',
    is_default: true,
    created_at: '2023-06-05T00:00:00Z',
    updated_at: '2023-06-05T00:00:00Z'
  },
  {
    id: 6,
    name: 'Harmonic Distortion Report',
    description: 'Harmonic distortion analysis with mitigation recommendations',
    thumbnail: '/templates/harmonic-distortion.jpg',
    report_type: 'harmonic',
    is_default: true,
    created_at: '2023-06-06T00:00:00Z',
    updated_at: '2023-06-06T00:00:00Z'
  },
  {
    id: 7,
    name: 'Schedule of Loads Report',
    description: 'Detailed schedule of loads with power requirements and distribution analysis',
    thumbnail: '/templates/schedule-loads.jpg',
    report_type: 'schedule_of_loads',
    is_default: true,
    created_at: '2023-06-07T00:00:00Z',
    updated_at: '2023-06-07T00:00:00Z'
  },
  {
    id: 8,
    name: 'Custom Report',
    description: 'Start with a blank template to create a custom report',
    thumbnail: '/templates/custom-report.jpg',
    report_type: 'custom',
    is_default: true,
    created_at: '2023-06-08T00:00:00Z',
    updated_at: '2023-06-08T00:00:00Z'
  }
];

// Report type filter options
const reportTypeOptions: { value: ReportType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'energy_audit', label: 'Energy Audit' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'power_factor', label: 'Power Factor' },
  { value: 'harmonic', label: 'Harmonic' },
  { value: 'schedule_of_loads', label: 'Schedule of Loads' },
  { value: 'custom', label: 'Custom' }
];

/**
 * ReportTemplates component for browsing and selecting report templates
 */
const ReportTemplates: React.FC = () => {
  const history = useHistory();
  
  // Templates state
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ReportTemplate[]>([]);
  
  // Filter state
  const [typeFilter, setTypeFilter] = useState<ReportType | 'all'>('all');
  
  // Selected template for preview
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  
  // Loading and error states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In a real app, you would fetch templates from the API
        // For now, use mock data
        // const templatesData = await reportService.getTemplates();
        const templatesData = MOCK_TEMPLATES;
        
        setTemplates(templatesData);
        setFilteredTemplates(templatesData);
      } catch (err: any) {
        setError(err.message || 'Failed to load templates');
        console.error('Error loading templates:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadTemplates();
  }, []);
  
  // Apply filters when type filter changes
  useEffect(() => {
    if (typeFilter === 'all') {
      setFilteredTemplates(templates);
    } else {
      setFilteredTemplates(templates.filter(template => template.report_type === typeFilter));
    }
  }, [typeFilter, templates]);
  
  // Handle template selection
  const handleSelectTemplate = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };
  
  // Handle template use (create new report from template)
  const handleUseTemplate = () => {
    if (!selectedTemplate) return;
    
    // Navigate to report creation with template ID
    history.push(`/reports/create?template=${selectedTemplate.id}`);
    setPreviewOpen(false);
  };
  
  // Handle close preview
  const handleClosePreview = () => {
    setPreviewOpen(false);
  };
  
  // Handle filter change
  const handleFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setTypeFilter(event.target.value as ReportType | 'all');
  };
  
  // Handle create custom report
  const handleCreateCustom = () => {
    history.push('/reports/create');
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Paper sx={{ width: '100%' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div">
          Report Templates
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 200, mr: 2 }} size="small">
            <InputLabel id="type-filter-label">Filter by Type</InputLabel>
            <Select
              labelId="type-filter-label"
              id="type-filter"
              value={typeFilter}
              label="Filter by Type"
              onChange={handleFilterChange as any}
            >
              {reportTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleCreateCustom}
          >
            Create Custom Report
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
      )}
      
      <Box sx={{ p: 3 }}>
        {filteredTemplates.length === 0 ? (
          <Typography variant="body1" color="text.secondary" textAlign="center">
            No templates found for the selected filter.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {filteredTemplates.map((template) => (
              <Grid item key={template.id} xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardActionArea onClick={() => handleSelectTemplate(template)}>
                    <CardMedia
                      component="img"
                      height="180"
                      image={template.thumbnail || '/templates/default.jpg'}
                      alt={template.name}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography gutterBottom variant="h6" component="div" sx={{ mb: 0 }}>
                          {template.name}
                        </Typography>
                        <Chip 
                          label={reportTypeOptions.find(opt => opt.value === template.report_type)?.label || template.report_type} 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {template.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
      
      {/* Template Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        {selectedTemplate && (
          <>
            <DialogTitle>
              {selectedTemplate.name}
              <Chip 
                label={reportTypeOptions.find(opt => opt.value === selectedTemplate.report_type)?.label || selectedTemplate.report_type} 
                size="small" 
                variant="outlined"
                sx={{ ml: 1 }}
              />
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ mb: 3 }}>
                <img 
                  src={selectedTemplate.thumbnail || '/templates/default.jpg'} 
                  alt={selectedTemplate.name}
                  style={{ maxWidth: '100%', height: 'auto', marginBottom: '1rem' }}
                />
                <Typography variant="body1">
                  {selectedTemplate.description}
                </Typography>
              </Box>
              
              <Typography variant="subtitle1" gutterBottom>
                Template Features:
              </Typography>
              <ul>
                <li>Pre-defined sections and structure</li>
                <li>Recommended charts and visualizations</li>
                <li>Standard content sections</li>
                <li>Industry-standard formatting</li>
                <li>Customizable components</li>
              </ul>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                This template was last updated on {selectedTemplate.updated_at ? new Date(selectedTemplate.updated_at as string).toLocaleDateString() : 'unknown date'}.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClosePreview}>Cancel</Button>
              <Button onClick={handleUseTemplate} variant="contained" color="primary">
                Use This Template
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Paper>
  );
};

export default ReportTemplates; 