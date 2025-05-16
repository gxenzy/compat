import React, { useState } from 'react';
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
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { ChartType } from 'chart.js';
import DrilldownChart, { DrilldownNode } from './DrilldownChart';

/**
 * Example component that demonstrates how to use the DrilldownChart
 * with hierarchical energy consumption data
 */
const DrilldownChartExample: React.FC = () => {
  // State for chart settings
  const [chartType, setChartType] = useState<ChartType>('pie');
  const [theme, setTheme] = useState<'default' | 'energy' | 'financial'>('energy');
  
  // State to track drill navigation history
  const [drillHistory, setDrillHistory] = useState<{
    node: DrilldownNode;
    timestamp: Date;
  }[]>([]);
  
  // Helper function to create a hierarchical data structure for energy consumption
  const createEnergyConsumptionHierarchy = (): DrilldownNode => {
    // This would typically come from an API or database
    return {
      id: 'total',
      label: 'Total Building',
      data: 125000, // Total kWh
      customData: {
        cost: '$15,625',
        period: 'Annual'
      },
      children: [
        {
          id: 'floor1',
          label: 'Floor 1',
          data: 42500,
          customData: {
            cost: '$5,312',
            area: '12,000 sq ft',
            occupancy: '85%'
          },
          children: [
            {
              id: 'floor1-hvac',
              label: 'HVAC',
              data: 21250,
              customData: {
                units: '5',
                avgAge: '7 years',
                peakDemand: '45 kW'
              },
              children: [
                {
                  id: 'floor1-hvac-ahu1',
                  label: 'Air Handler 1',
                  data: 8500,
                  customData: {
                    model: 'Carrier AHU-450',
                    hoursOfOperation: '3,650 hrs/yr',
                    efficiency: '82%'
                  }
                },
                {
                  id: 'floor1-hvac-ahu2',
                  label: 'Air Handler 2',
                  data: 7200,
                  customData: {
                    model: 'Trane TR-380',
                    hoursOfOperation: '3,285 hrs/yr',
                    efficiency: '79%'
                  }
                },
                {
                  id: 'floor1-hvac-chiller',
                  label: 'Chiller Unit',
                  data: 5550,
                  customData: {
                    model: 'York YC-500',
                    hoursOfOperation: '2,500 hrs/yr',
                    efficiency: '88%'
                  }
                }
              ]
            },
            {
              id: 'floor1-lighting',
              label: 'Lighting',
              data: 12750,
              customData: {
                fixtureCount: '320',
                ledPercentage: '65%',
                controlSystem: 'Basic timer'
              },
              children: [
                {
                  id: 'floor1-lighting-office',
                  label: 'Office Areas',
                  data: 7350,
                  customData: {
                    fixtureType: 'LED Panels',
                    fixtureCount: '210',
                    controlType: 'Motion sensor'
                  }
                },
                {
                  id: 'floor1-lighting-common',
                  label: 'Common Areas',
                  data: 3400,
                  customData: {
                    fixtureType: 'LED Downlights',
                    fixtureCount: '85',
                    controlType: 'Timer'
                  }
                },
                {
                  id: 'floor1-lighting-emergency',
                  label: 'Emergency Lighting',
                  data: 2000,
                  customData: {
                    fixtureType: 'LED Emergency',
                    fixtureCount: '25',
                    controlType: 'Always on'
                  }
                }
              ]
            },
            {
              id: 'floor1-equipment',
              label: 'Equipment',
              data: 8500,
              customData: {
                itemCount: '180',
                avgDailyHours: '8.5'
              }
            }
          ]
        },
        {
          id: 'floor2',
          label: 'Floor 2',
          data: 36500,
          customData: {
            cost: '$4,562',
            area: '10,500 sq ft',
            occupancy: '78%'
          },
          children: [
            {
              id: 'floor2-hvac',
              label: 'HVAC',
              data: 18250,
              customData: {
                units: '4',
                avgAge: '5 years'
              }
            },
            {
              id: 'floor2-lighting',
              label: 'Lighting',
              data: 10950,
              customData: {
                fixtureCount: '280',
                ledPercentage: '82%'
              }
            },
            {
              id: 'floor2-equipment',
              label: 'Equipment',
              data: 7300,
              customData: {
                itemCount: '155',
                avgDailyHours: '9.2'
              }
            }
          ]
        },
        {
          id: 'floor3',
          label: 'Floor 3',
          data: 46000,
          customData: {
            cost: '$5,750',
            area: '11,800 sq ft',
            occupancy: '92%'
          },
          children: [
            {
              id: 'floor3-hvac',
              label: 'HVAC',
              data: 23000,
              customData: {
                units: '6',
                avgAge: '3 years'
              }
            },
            {
              id: 'floor3-lighting',
              label: 'Lighting',
              data: 13800,
              customData: {
                fixtureCount: '310',
                ledPercentage: '95%'
              }
            },
            {
              id: 'floor3-equipment',
              label: 'Equipment',
              data: 9200,
              customData: {
                itemCount: '205',
                avgDailyHours: '10.5'
              }
            }
          ]
        }
      ]
    };
  };
  
  // Create the data hierarchy
  const hierarchicalData = createEnergyConsumptionHierarchy();
  
  // Handle chart type change
  const handleChartTypeChange = (event: SelectChangeEvent) => {
    setChartType(event.target.value as ChartType);
  };
  
  // Handle theme change
  const handleThemeChange = (event: SelectChangeEvent) => {
    setTheme(event.target.value as 'default' | 'energy' | 'financial');
  };
  
  // Handle drill down event
  const handleDrillDown = (node: DrilldownNode, path: DrilldownNode[]) => {
    setDrillHistory(prev => [
      ...prev,
      {
        node,
        timestamp: new Date()
      }
    ]);
  };
  
  // Custom chart options
  const chartOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          title: (tooltipItems: any[]) => {
            return tooltipItems[0].label;
          },
          label: (context: any) => {
            const value = context.raw as number;
            const percentage = ((value / (hierarchicalData.data as number)) * 100).toFixed(1);
            return `Energy: ${value.toLocaleString()} kWh (${percentage}%)`;
          }
        }
      }
    }
  };
  
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Energy Consumption Drill-Down Analysis
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        This example demonstrates hierarchical data visualization with drill-down capability.
        Click on chart elements to explore deeper levels of energy consumption data.
      </Typography>
      
      <Grid container spacing={3}>
        {/* Controls */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Chart Settings</Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Chart Type</InputLabel>
                <Select
                  value={chartType}
                  label="Chart Type"
                  onChange={handleChartTypeChange}
                >
                  <MenuItem value="pie">Pie Chart</MenuItem>
                  <MenuItem value="doughnut">Doughnut Chart</MenuItem>
                  <MenuItem value="bar">Bar Chart</MenuItem>
                  <MenuItem value="polarArea">Polar Area Chart</MenuItem>
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
              
              <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                Navigation History
              </Typography>
              
              {drillHistory.length > 0 ? (
                <List dense sx={{ bgcolor: 'background.paper', maxHeight: 200, overflow: 'auto' }}>
                  {drillHistory.map((item, index) => (
                    <React.Fragment key={`${item.node.id}-${index}`}>
                      <ListItem>
                        <ListItemText
                          primary={item.node.label}
                          secondary={`Drilled to at ${item.timestamp.toLocaleTimeString()}`}
                        />
                      </ListItem>
                      {index < drillHistory.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No navigation yet. Click on chart elements to drill down.
                </Typography>
              )}
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                <strong>Instructions:</strong>
                <ul>
                  <li>Click on chart elements to drill down</li>
                  <li>Use breadcrumbs or up button to history.push back</li>
                  <li>Home icon returns to the top level</li>
                </ul>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Chart */}
        <Grid item xs={12} md={8}>
          <Box sx={{ height: '600px' }}>
            <DrilldownChart
              title="Building Energy Consumption"
              subtitle="Annual Energy Usage by Location and System Type"
              rootNode={hierarchicalData}
              chartType={chartType}
              themeName={theme}
              showExportOptions={true}
              sizePreset="large"
              showBreadcrumbs={true}
              onDrillDown={handleDrillDown}
              chartOptions={chartOptions}
              ariaLabel="Hierarchical chart of building energy consumption with drill-down capability"
            />
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default DrilldownChartExample; 