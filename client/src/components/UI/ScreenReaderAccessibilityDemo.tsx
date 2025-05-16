import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button, 
  Paper,
  Divider,
  Tab,
  Tabs,
  SelectChangeEvent
} from '@mui/material';
import { Chart } from 'chart.js/auto';
import { AccessibleChartRenderer } from '../../utils/reportGenerator/ChartAccessibilityProvider';
import ChartScreenReaderPanel from './ChartScreenReaderPanel';
import { 
  generateChartScreenReaderText, 
  createAccessibleDataTable,
  TrendType
} from '../../utils/accessibility/chartScreenReaderUtils';

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
      id={`sr-demo-tabpanel-${index}`}
      aria-labelledby={`sr-demo-tab-${index}`}
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

/**
 * Demo component for showcasing screen reader accessibility features
 */
const ScreenReaderAccessibilityDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedChartType, setSelectedChartType] = useState<string>('line');
  const [selectedTrend, setSelectedTrend] = useState<TrendType>(TrendType.INCREASING);
  const [chartDescription, setChartDescription] = useState<string>('');
  const [tableContent, setTableContent] = useState<string>('');
  
  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle chart type change
  const handleChartTypeChange = (event: SelectChangeEvent) => {
    setSelectedChartType(event.target.value);
  };
  
  // Handle trend type change
  const handleTrendChange = (event: SelectChangeEvent) => {
    setSelectedTrend(event.target.value as TrendType);
  };
  
  // Generate example chart data based on the selected trend
  const generateChartData = () => {
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let data: number[] = [];
    
    // Generate data based on selected trend
    switch (selectedTrend) {
      case TrendType.INCREASING:
        data = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65];
        break;
      case TrendType.DECREASING:
        data = [65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10];
        break;
      case TrendType.STABLE:
        data = [40, 42, 39, 41, 40, 38, 41, 43, 40, 39, 41, 40];
        break;
      case TrendType.VOLATILE:
        data = [35, 55, 25, 60, 20, 65, 30, 70, 25, 60, 30, 50];
        break;
      case TrendType.CYCLIC:
        data = [30, 45, 60, 45, 30, 15, 30, 45, 60, 45, 30, 15];
        break;
      case TrendType.MIXED:
        data = [40, 35, 50, 45, 60, 55, 40, 30, 45, 65, 50, 45];
        break;
      default:
        data = [30, 40, 35, 50, 45, 60, 55, 70, 65, 80, 75, 90];
    }
    
    // Create multiple datasets for line and bar charts
    if (['line', 'bar'].includes(selectedChartType)) {
      return {
        labels,
        datasets: [
          {
            label: 'Primary Dataset',
            data,
            backgroundColor: '#4e79a7',
            borderColor: '#4e79a7',
            borderWidth: 2
          },
          {
            label: 'Secondary Dataset',
            data: data.map(val => val * 0.7 + Math.random() * 10),
            backgroundColor: '#f28e2c',
            borderColor: '#f28e2c',
            borderWidth: 2
          }
        ]
      };
    } 
    // For pie and doughnut charts
    else {
      return {
        labels: ['Category A', 'Category B', 'Category C', 'Category D', 'Category E'],
        datasets: [
          {
            data: [30, 25, 20, 15, 10],
            backgroundColor: [
              '#4e79a7',
              '#f28e2c',
              '#e15759',
              '#76b7b2',
              '#59a14f'
            ],
            borderWidth: 1
          }
        ]
      };
    }
  };
  
  // Create chart configuration
  const createChartConfig = () => {
    const chartData = generateChartData();
    
    return {
      type: selectedChartType as any,
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top' as const,
          },
          title: {
            display: true,
            text: `${selectedTrend} Trend - ${selectedChartType.charAt(0).toUpperCase() + selectedChartType.slice(1)} Chart`
          }
        }
      }
    };
  };
  
  // Get chart configuration
  const chartConfig = createChartConfig();
  
  // Update description and table when chart config changes
  useEffect(() => {
    try {
      const description = generateChartScreenReaderText(chartConfig);
      setChartDescription(description);
      
      const table = createAccessibleDataTable(chartConfig);
      setTableContent(table);
    } catch (error) {
      console.error('Error generating chart description:', error);
    }
  }, [chartConfig]);
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Screen Reader Accessibility Demo
      </Typography>
      <Typography variant="body1" paragraph>
        This demo showcases the enhanced screen reader accessibility features for charts.
        Select different chart types and trend patterns to see how the screen reader
        descriptions adapt to the data.
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="chart-type-label">Chart Type</InputLabel>
            <Select
              labelId="chart-type-label"
              id="chart-type-select"
              value={selectedChartType}
              label="Chart Type"
              onChange={handleChartTypeChange}
            >
              <MenuItem value="line">Line Chart</MenuItem>
              <MenuItem value="bar">Bar Chart</MenuItem>
              <MenuItem value="pie">Pie Chart</MenuItem>
              <MenuItem value="doughnut">Doughnut Chart</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="trend-type-label">Data Trend</InputLabel>
            <Select
              labelId="trend-type-label"
              id="trend-type-select"
              value={selectedTrend}
              label="Data Trend"
              onChange={handleTrendChange}
            >
              <MenuItem value={TrendType.INCREASING}>Increasing</MenuItem>
              <MenuItem value={TrendType.DECREASING}>Decreasing</MenuItem>
              <MenuItem value={TrendType.STABLE}>Stable</MenuItem>
              <MenuItem value={TrendType.VOLATILE}>Volatile</MenuItem>
              <MenuItem value={TrendType.CYCLIC}>Cyclic</MenuItem>
              <MenuItem value={TrendType.MIXED}>Mixed</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Accessible Chart
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                This chart has enhanced screen reader support. Use Alt+D to open the accessibility panel,
                or tab to the "Chart Accessibility" button below the chart.
              </Typography>
              <Box sx={{ height: 350 }}>
                <AccessibleChartRenderer
                  configuration={chartConfig}
                  height={350}
                  themeName="default"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                aria-label="accessibility demo tabs"
              >
                <Tab label="Description" id="sr-demo-tab-0" aria-controls="sr-demo-tabpanel-0" />
                <Tab label="Data Table" id="sr-demo-tab-1" aria-controls="sr-demo-tabpanel-1" />
              </Tabs>
              
              <TabPanel value={activeTab} index={0}>
                <Typography variant="subtitle1" gutterBottom>
                  Screen Reader Description
                </Typography>
                <Paper elevation={1} sx={{ p: 2, maxHeight: 280, overflow: 'auto' }}>
                  <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                    {chartDescription}
                  </Typography>
                </Paper>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  This is the automatically generated description that screen readers will announce.
                  Notice how it adapts to different chart types and data patterns.
                </Typography>
              </TabPanel>
              
              <TabPanel value={activeTab} index={1}>
                <Typography variant="subtitle1" gutterBottom>
                  Data Table
                </Typography>
                <Paper elevation={1} sx={{ p: 2, maxHeight: 280, overflow: 'auto' }}>
                  <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                    {tableContent}
                  </pre>
                </Paper>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  This is the accessible data table representation that screen readers can history.push.
                  Each chart type generates an appropriate table structure.
                </Typography>
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          How to Use with a Screen Reader
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Keyboard Navigation
              </Typography>
              <Box component="dl">
                <Typography component="dt" fontWeight="bold">Alt + D</Typography>
                <Typography component="dd" sx={{ mb: 1 }}>
                  Open the accessibility dialog with detailed chart information
                </Typography>
                
                <Typography component="dt" fontWeight="bold">Tab / Shift+Tab</Typography>
                <Typography component="dd" sx={{ mb: 1 }}>
                  Navigate between interactive elements
                </Typography>
                
                <Typography component="dt" fontWeight="bold">Arrow Keys</Typography>
                <Typography component="dd" sx={{ mb: 1 }}>
                  When chart is focused, history.push between data points
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Screen Reader Features
              </Typography>
              <ul>
                <li>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Automatic chart announcements when focused
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Detailed trend analysis and pattern identification
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Key points identification (min, max, significant changes)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Structured data tables with proper semantic markup
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Comparative analysis between datasets
                  </Typography>
                </li>
              </ul>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
};

export default ScreenReaderAccessibilityDemo; 