import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Switch
} from '@mui/material';
import { ChartConfiguration, ChartType } from 'chart.js';
import { AccessibleChartRenderer, useChartAccessibility } from './index';

/**
 * Example component to demonstrate the use of AccessibleChartRenderer with various options
 */
const InteractiveChartExample: React.FC = () => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [theme, setTheme] = useState<'default' | 'energy' | 'financial'>('default');
  const [loading, setLoading] = useState<boolean>(false);
  const [showExportOptions, setShowExportOptions] = useState<boolean>(true);
  const [showChartTypeOptions, setShowChartTypeOptions] = useState<boolean>(true);
  
  // Get access to the chart accessibility context
  const { settings, updateSettings } = useChartAccessibility();
  
  // Sample dataset
  const [chartConfig, setChartConfig] = useState<ChartConfiguration>({
    type: 'bar',
    data: {
      labels: ['January', 'February', 'March', 'April', 'May', 'June'],
      datasets: [
        {
          label: 'Dataset 1',
          data: [65, 59, 80, 81, 56, 55],
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Dataset 2',
          data: [28, 48, 40, 19, 86, 27],
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Chart.js Example'
        }
      }
    }
  });
  
  // Update chart type when it changes
  useEffect(() => {
    setChartConfig(prevConfig => ({
      ...prevConfig,
      type: chartType
    }));
  }, [chartType]);
  
  // Handle chart type change
  const handleChartTypeChange = (event: SelectChangeEvent) => {
    setChartType(event.target.value as ChartType);
  };
  
  // Handle theme change
  const handleThemeChange = (event: SelectChangeEvent) => {
    setTheme(event.target.value as 'default' | 'energy' | 'financial');
  };
  
  // Handle accessibility settings changes
  const handleAccessibilityToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ enabled: event.target.checked });
  };
  
  const handleHighContrastToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ highContrastDefault: event.target.checked });
  };
  
  const handleDataTableToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ dataTableViewDefault: event.target.checked });
  };
  
  // Simulate loading
  const toggleLoading = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };
  
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Interactive Chart Example with Accessibility Features
      </Typography>
      
      <Grid container spacing={3}>
        {/* Controls */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Chart Options
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Chart Type</InputLabel>
                <Select
                  value={chartType}
                  label="Chart Type"
                  onChange={handleChartTypeChange}
                >
                  <MenuItem value="bar">Bar Chart</MenuItem>
                  <MenuItem value="line">Line Chart</MenuItem>
                  <MenuItem value="pie">Pie Chart</MenuItem>
                  <MenuItem value="doughnut">Doughnut Chart</MenuItem>
                  <MenuItem value="polarArea">Polar Area Chart</MenuItem>
                  <MenuItem value="radar">Radar Chart</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Theme</InputLabel>
                <Select
                  value={theme}
                  label="Theme"
                  onChange={handleThemeChange}
                >
                  <MenuItem value="default">Default</MenuItem>
                  <MenuItem value="energy">Energy</MenuItem>
                  <MenuItem value="financial">Financial</MenuItem>
                </Select>
              </FormControl>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Display Options
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={showExportOptions}
                    onChange={(e) => setShowExportOptions(e.target.checked)}
                  />
                }
                label="Show Export Options"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={showChartTypeOptions}
                    onChange={(e) => setShowChartTypeOptions(e.target.checked)}
                  />
                }
                label="Show Chart Type Options"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={loading}
                    onChange={toggleLoading}
                  />
                }
                label="Simulate Loading"
              />
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Accessibility Options
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enabled}
                    onChange={handleAccessibilityToggle}
                  />
                }
                label="Enable Accessibility Features"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.highContrastDefault}
                    onChange={handleHighContrastToggle}
                    disabled={!settings.enabled}
                  />
                }
                label="High Contrast Mode"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.dataTableViewDefault}
                    onChange={handleDataTableToggle}
                    disabled={!settings.enabled}
                  />
                }
                label="Show Data Table View"
              />
            </CardContent>
          </Card>
        </Grid>
        
        {/* Chart */}
        <Grid item xs={12} md={8}>
          <Box sx={{ height: 500, width: '100%' }}>
            <AccessibleChartRenderer
              title="Interactive Chart Example"
              subtitle={`Chart Type: ${chartType}, Theme: ${theme}`}
              configuration={chartConfig}
              width="100%"
              height={500}
              themeName={theme}
              showExportOptions={showExportOptions}
              showChartTypeOptions={showChartTypeOptions}
              isLoading={loading}
              onChartTypeChange={(type) => setChartType(type)}
              ariaLabel={`This is an example ${chartType} chart showing sample data for demonstration purposes`}
            />
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {settings.enabled ? (
                <>
                  <strong>Accessibility features are enabled.</strong> Try using keyboard navigation:
                  <ul>
                    <li>Tab to the chart</li>
                    <li>Use arrow keys to history.push data points</li>
                    <li>Press Enter to view details</li>
                    <li>Press Escape to hide details</li>
                  </ul>
                </>
              ) : (
                <strong>Accessibility features are disabled. Enable them to see improved keyboard navigation and screen reader support.</strong>
              )}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default InteractiveChartExample; 