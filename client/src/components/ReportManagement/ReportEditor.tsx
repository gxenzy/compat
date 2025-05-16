import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
  useTheme,
  SelectChangeEvent
} from '@mui/material';
import {
  Save as SaveIcon,
  Preview as PreviewIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ArrowUpward as MoveUpIcon,
  ArrowDownward as MoveDownIcon,
  ArrowBack as BackIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { useHistory, useParams } from 'react-router-dom';
import Chart from 'chart.js/auto';
import { ChartTypeRegistry } from 'chart.js';
import { 
  Report, 
  ReportType, 
  ReportStatus, 
  ReportContent,
  ReportMetadata,
  TextReportContent,
  ChartReportContent,
  TableReportContent,
  ImageReportContent,
  SectionHeaderReportContent
} from '../../types/reports';
import reportService from '../../services/reportService';
import { Accordion, AccordionSummary, AccordionDetails } from '../../components/UI';

// Report type options
const reportTypeOptions: { value: ReportType; label: string }[] = [
  { value: 'energy_audit', label: 'Energy Audit' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'power_factor', label: 'Power Factor' },
  { value: 'harmonic', label: 'Harmonic' },
  { value: 'schedule_of_loads', label: 'Schedule of Loads' },
  { value: 'custom', label: 'Custom' }
];

// Report status options
const reportStatusOptions: { value: ReportStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' }
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Chart specific fields
const ChartEditor: React.FC<{
  content: ChartReportContent;
  onChange: (field: string, value: any) => void;
}> = ({ content, onChange }) => {
  const [previewKey, setPreviewKey] = useState<number>(Date.now());
  const chartId = `chart-editor-${Date.now()}`;
  
  const chartTypes = [
    { value: 'bar', label: 'Bar Chart' },
    { value: 'line', label: 'Line Chart' },
    { value: 'pie', label: 'Pie Chart' },
    { value: 'doughnut', label: 'Doughnut Chart' },
    { value: 'radar', label: 'Radar Chart' },
    { value: 'polarArea', label: 'Polar Area Chart' },
    { value: 'scatter', label: 'Scatter Chart' }
  ];
  
  // Update preview when chart type changes
  const handleChartTypeChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const chartType = e.target.value as string;
    onChange('content.chartType', chartType);
    
    // Update sample data based on new chart type
    const sampleData = getSampleData(chartType);
    onChange('content.data', sampleData);
    
    // Update options based on new chart type
    const defaultOptions = getDefaultOptions(chartType);
    onChange('content.options', defaultOptions);
    
    // Force chart re-render
    setPreviewKey(Date.now());
  };
  
  // Handle chart title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    
    // Update title in options
    const updatedOptions = {
      ...content.content.options,
      plugins: {
        ...content.content.options?.plugins,
        title: {
          ...content.content.options?.plugins?.title,
          display: !!title,
          text: title
        }
      }
    };
    
    onChange('content.options', updatedOptions);
    
    // Force chart re-render
    setPreviewKey(Date.now());
  };
  
  // Handle caption change
  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange('content.caption', e.target.value);
  };
  
  // Handle height change
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const height = parseInt(e.target.value) || 300;
    onChange('content.height', height);
    
    // Force chart re-render
    setPreviewKey(Date.now());
  };
  
  useEffect(() => {
    // Initialize with sample data if empty
    if (!content.content.data || Object.keys(content.content.data).length === 0) {
      const sampleData = getSampleData(content.content.chartType || 'bar');
      onChange('content.data', sampleData);
    }
    
    // Initialize with default options if empty
    if (!content.content.options || Object.keys(content.content.options).length === 0) {
      const defaultOptions = getDefaultOptions(content.content.chartType || 'bar');
      onChange('content.options', defaultOptions);
    }
  }, []);
  
  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Chart Type</InputLabel>
            <Select
              value={content.content.chartType || 'bar'}
              onChange={handleChartTypeChange as any}
              label="Chart Type"
            >
              {chartTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Chart Title"
            value={content.content.options?.plugins?.title?.text || ''}
            onChange={handleTitleChange}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Caption"
            value={content.content.caption || ''}
            onChange={handleCaptionChange}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Chart Height (px)"
            type="number"
            value={content.content.height || 300}
            onChange={handleHeightChange}
            inputProps={{ min: 200, max: 800, step: 50 }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Chart Preview
          </Typography>
          <Box sx={{ height: content.content.height || 300, border: '1px solid #ddd', p: 1, borderRadius: 1 }}>
            <canvas id={chartId} width="100%" height="100%"></canvas>
            <ChartPreview 
              key={previewKey}
              chartId={chartId} 
              chartType={content.content.chartType || 'bar'} 
              data={content.content.data}
              options={content.content.options}
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            Note: Use the Chart Customization feature for more advanced chart configurations.
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {}}  // TODO: Implement advanced chart customization
            sx={{ mt: 1 }}
          >
            Advanced Customization
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

// Chart cache to store rendered chart data
interface ChartCache {
  [key: string]: {
    instance: Chart | null;
    data: any;
    options: any;
    timestamp: number;
  };
}

// Global chart cache
const chartCache: ChartCache = {};

// Chart preview component with caching
const ChartPreview: React.FC<{
  chartId: string;
  chartType: string;
  data: any;
  options: any;
}> = ({ chartId, chartType, data, options }) => {
  useEffect(() => {
    let chartInstance: Chart | null = null;
    
    // Create the chart after component mounts
    const createChart = () => {
      const canvas = document.getElementById(chartId) as HTMLCanvasElement;
      if (!canvas) {
        return;
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      
      // Check cache first
      const cacheKey = `${chartId}-${chartType}`;
      const cachedChart = chartCache[cacheKey];
      
      // Generate chart data
      const chartData = data && Object.keys(data).length > 0 ? data : getSampleData(chartType);
      const chartOptions = options && Object.keys(options).length > 0 ? options : getDefaultOptions(chartType);
      
      // Always create a new chart in the editor preview to ensure it's up to date
      // Destroy existing chart instance if it exists
      if (cachedChart && cachedChart.instance) {
        cachedChart.instance.destroy();
      }
      
      // Create new chart
      chartInstance = new Chart(ctx, {
        type: (chartType || 'bar') as keyof ChartTypeRegistry,
        data: chartData,
        options: chartOptions
      });
      
      // Cache the chart
      chartCache[cacheKey] = {
        instance: chartInstance,
        data: chartData,
        options: chartOptions,
        timestamp: Date.now()
      };
    };
    
    createChart();
    
    // Cleanup chart instance on unmount
    return () => {
      // For the editor preview, we destroy the instance on unmount
      // since it's likely to change frequently
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, [chartId, chartType, data, options]);
  
  return null;
};

// Clean up chart cache (call this periodically or on component unmount)
const cleanupChartCache = () => {
  const now = Date.now();
  const CACHE_TTL = 10 * 60 * 1000; // 10 minutes for editor previews
  
  Object.keys(chartCache).forEach(key => {
    // If the chart hasn't been used in 10 minutes, destroy it and remove from cache
    if (now - chartCache[key].timestamp > CACHE_TTL) {
      const instance = chartCache[key]?.instance;
      if (instance) {
        instance.destroy();
      }
      delete chartCache[key];
    }
  });
};

// Generate sample data for chart preview
const getSampleData = (chartType: string) => {
  const labels = ['January', 'February', 'March', 'April', 'May', 'June'];
  
  switch (chartType) {
    case 'bar':
      return {
        labels,
        datasets: [
          {
            label: 'Energy Consumption (kWh)',
            data: [65, 59, 80, 81, 56, 55],
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1
          }
        ]
      };
      
    case 'line':
      return {
        labels,
        datasets: [
          {
            label: 'Energy Cost ($)',
            data: [12, 19, 3, 5, 2, 3],
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }
        ]
      };
      
    case 'pie':
    case 'doughnut':
      return {
        labels: ['Lighting', 'HVAC', 'Equipment', 'Other'],
        datasets: [
          {
            data: [30, 40, 20, 10],
            backgroundColor: [
              'rgba(255, 99, 132, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 206, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)'
            ],
            borderWidth: 1
          }
        ]
      };
      
    case 'radar':
      return {
        labels: ['Efficiency', 'Cost', 'Comfort', 'Maintenance', 'Reliability', 'Performance'],
        datasets: [
          {
            label: 'Current System',
            data: [65, 59, 90, 81, 56, 55],
            fill: true,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgb(54, 162, 235)',
            pointBackgroundColor: 'rgb(54, 162, 235)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(54, 162, 235)'
          },
          {
            label: 'Proposed System',
            data: [28, 48, 40, 19, 96, 27],
            fill: true,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgb(255, 99, 132)',
            pointBackgroundColor: 'rgb(255, 99, 132)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(255, 99, 132)'
          }
        ]
      };
      
    case 'polarArea':
      return {
        labels: ['Lighting', 'HVAC', 'Equipment', 'Other'],
        datasets: [
          {
            data: [11, 16, 7, 3],
            backgroundColor: [
              'rgb(255, 99, 132)',
              'rgb(75, 192, 192)',
              'rgb(255, 205, 86)',
              'rgb(54, 162, 235)'
            ]
          }
        ]
      };
      
    case 'scatter':
      return {
        datasets: [
          {
            label: 'Energy Consumption vs. Temperature',
            data: [
              { x: 65, y: 75 },
              { x: 59, y: 49 },
              { x: 80, y: 90 },
              { x: 81, y: 29 },
              { x: 56, y: 36 },
              { x: 55, y: 25 },
              { x: 40, y: 18 }
            ],
            backgroundColor: 'rgb(255, 99, 132)'
          }
        ]
      };
      
    default:
      return {
        labels,
        datasets: [
          {
            label: 'Data',
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: 'rgba(54, 162, 235, 0.5)'
          }
        ]
      };
  }
};

// Default chart options
const getDefaultOptions = (chartType: string) => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Chart Title'
      }
    }
  };
  
  switch (chartType) {
    case 'bar':
    case 'line':
      return {
        ...baseOptions,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      };
      
    case 'pie':
    case 'doughnut':
      return baseOptions;
      
    case 'radar':
      return {
        ...baseOptions,
        elements: {
          line: {
            borderWidth: 3
          }
        }
      };
      
    case 'polarArea':
      return baseOptions;
      
    case 'scatter':
      return {
        ...baseOptions,
        scales: {
          x: {
            type: 'linear' as const,
            position: 'bottom' as const
          },
          y: {
            beginAtZero: true
          }
        }
      };
      
    default:
      return baseOptions;
  }
};

interface ReportForm {
  title: string;
  description: string;
  type: string;
  is_template: boolean;
  is_public: boolean;
  status: string;
}

const REPORT_TYPES = [
  'Energy Audit',
  'Inspection Report',
  'ROI Analysis',
  'Recommendation Report',
  'Technical Assessment'
];

const REPORT_STATUSES = [
  'draft',
  'review',
  'published'
];

/**
 * Component for creating and editing reports
 */
const ReportEditor: React.FC = () => {
  const theme = useTheme();
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ReportForm>({
    title: '',
    description: '',
    type: REPORT_TYPES[0],
    is_template: false,
    is_public: false,
    status: 'draft'
  });
  
  useEffect(() => {
    if (isEditMode && id) {
      fetchReport(parseInt(id));
    }
  }, [id, isEditMode]);
  
  const fetchReport = async (reportId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API request for now
      setTimeout(() => {
        // Mock report data
        const mockReport: Report = {
          id: reportId,
          title: 'Energy Audit Report - Building A',
          description: 'Comprehensive energy audit for Building A',
          type: 'energy_audit',
          created_by: 1,
          is_template: false,
          is_public: false,
          status: 'draft',
          version: 1.0,
          created_at: '2023-07-01T10:30:00Z',
          updated_at: '2023-07-01T10:30:00Z',
          public_link: null,
          shares: []
        };
        
        setFormData({
          title: mockReport.title,
          description: mockReport.description || '',
          type: mockReport.type,
          is_template: mockReport.is_template,
          is_public: mockReport.is_public,
          status: mockReport.status
        });
        
        setLoading(false);
      }, 800);
      
    } catch (err) {
      setError('Failed to load report');
      console.error('Error fetching report:', err);
      setLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  const handleSwitchChange = (name: keyof ReportForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [name]: e.target.checked
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      // Validate form
      if (!formData.title.trim()) {
        setError('Title is required');
        setSaving(false);
        return;
      }
      
      // Simulate API request for now
      setTimeout(() => {
        console.log('Saving report:', formData);
        
        // Redirect back to reports list
        history.push('/reports');
      }, 1000);
      
    } catch (err) {
      setError('Failed to save report');
      console.error('Error saving report:', err);
      setSaving(false);
    }
  };
  
  const handleCancel = () => {
    history.push('/reports');
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleCancel} sx={{ mr: 1 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h5" component="h1">
            {isEditMode ? 'Edit Report' : 'Create New Report'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Report'}
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Report Details
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Report Title"
                value={formData.title}
                onChange={handleChange}
                fullWidth
                required
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="type-label">Report Type</InputLabel>
                <Select
                  labelId="type-label"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  label="Report Type"
                >
                  {REPORT_TYPES.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Status"
                >
                  {REPORT_STATUSES.map(status => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_template}
                    onChange={handleSwitchChange('is_template')}
                    name="is_template"
                  />
                }
                label="Save as Template"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_public}
                    onChange={handleSwitchChange('is_public')}
                    name="is_public"
                  />
                }
                label="Make Public"
              />
            </Grid>
          </Grid>
        </Paper>
        
        {/* Report Content Sections - Mock UI for now */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Report Sections
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
            >
              Add Section
            </Button>
          </Box>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            This is a placeholder for the report content editor. In a real implementation, this would allow adding and editing report sections.
          </Alert>
          
          {/* Mock report sections */}
          {['Executive Summary', 'Findings', 'Recommendations'].map((section, index) => (
            <Accordion 
              key={index}
              title={<Typography>{section}</Typography>}
            >
              <TextField
                fullWidth
                multiline
                rows={6}
                placeholder={`Enter ${section.toLowerCase()} content here...`}
                variant="outlined"
              />
            </Accordion>
          ))}
        </Paper>
      </form>
    </Box>
  );
};

export default ReportEditor; 