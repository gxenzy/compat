import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, CardActions, Button, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { ChartConfiguration, ChartType } from 'chart.js';
import EnhancedAccessibleChart from '../../utils/reportGenerator/EnhancedAccessibleChart';

// Sample data for different chart types
const getSampleChartConfig = (chartType: ChartType): ChartConfiguration => {
  // Common labels across chart types
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  
  // Default options for all charts
  const defaultOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart Example`
      },
      legend: {
        position: 'top' as const,
      }
    }
  };
  
  switch (chartType) {
    case 'bar':
      return {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Dataset 1',
              data: [65, 59, 80, 81, 56, 55],
              backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
            {
              label: 'Dataset 2',
              data: [28, 48, 40, 19, 86, 27],
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
          ],
        },
        options: defaultOptions,
      };
      
    case 'line':
      return {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Dataset 1',
              data: [65, 59, 80, 81, 56, 55],
              borderColor: 'rgb(53, 162, 235)',
              backgroundColor: 'rgba(53, 162, 235, 0.5)',
              tension: 0.1,
            },
            {
              label: 'Dataset 2',
              data: [28, 48, 40, 19, 86, 27],
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              tension: 0.1,
            },
          ],
        },
        options: defaultOptions,
      };
      
    case 'pie':
      return {
        type: 'pie',
        data: {
          labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
          datasets: [
            {
              label: 'Dataset 1',
              data: [12, 19, 3, 5, 2, 3],
              backgroundColor: [
                'rgba(255, 99, 132, 0.5)',
                'rgba(54, 162, 235, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(75, 192, 192, 0.5)',
                'rgba(153, 102, 255, 0.5)',
                'rgba(255, 159, 64, 0.5)',
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
              ],
              borderWidth: 1,
            },
          ],
        },
        options: defaultOptions,
      };
      
    case 'doughnut':
      return {
        type: 'doughnut',
        data: {
          labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
          datasets: [
            {
              label: 'Dataset 1',
              data: [12, 19, 3, 5, 2, 3],
              backgroundColor: [
                'rgba(255, 99, 132, 0.5)',
                'rgba(54, 162, 235, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(75, 192, 192, 0.5)',
                'rgba(153, 102, 255, 0.5)',
                'rgba(255, 159, 64, 0.5)',
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
              ],
              borderWidth: 1,
            },
          ],
        },
        options: defaultOptions,
      };
      
    case 'radar':
      return {
        type: 'radar',
        data: {
          labels: ['Eating', 'Drinking', 'Sleeping', 'Designing', 'Coding', 'Cycling'],
          datasets: [
            {
              label: 'Dataset 1',
              data: [65, 59, 90, 81, 56, 55],
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgb(255, 99, 132)',
              pointBackgroundColor: 'rgb(255, 99, 132)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgb(255, 99, 132)',
            },
            {
              label: 'Dataset 2',
              data: [28, 48, 40, 19, 96, 27],
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgb(54, 162, 235)',
              pointBackgroundColor: 'rgb(54, 162, 235)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgb(54, 162, 235)',
            },
          ],
        },
        options: defaultOptions,
      };
      
    case 'scatter':
      return {
        type: 'scatter',
        data: {
          datasets: [
            {
              label: 'Dataset 1',
              data: Array.from({ length: 20 }, () => ({
                x: Math.random() * 10,
                y: Math.random() * 10,
              })),
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
            {
              label: 'Dataset 2',
              data: Array.from({ length: 20 }, () => ({
                x: Math.random() * 10,
                y: Math.random() * 10,
              })),
              backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
          ],
        },
        options: {
          ...defaultOptions,
          scales: {
            x: {
              title: {
                display: true,
                text: 'X Axis'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Y Axis'
              }
            }
          }
        },
      };
      
    default:
      return {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Dataset 1',
              data: [65, 59, 80, 81, 56, 55],
              backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
          ],
        },
        options: defaultOptions,
      };
  }
};

/**
 * Props for the AccessibilityKeyboardDemoChart component
 */
interface AccessibilityKeyboardDemoChartProps {
  /**
   * Type of chart to display
   */
  chartType?: ChartType;
}

/**
 * Component that demonstrates keyboard accessibility features with various chart types
 */
const AccessibilityKeyboardDemoChart: React.FC<AccessibilityKeyboardDemoChartProps> = ({
  chartType = 'bar'
}) => {
  const [chartConfiguration, setChartConfiguration] = useState<ChartConfiguration>(getSampleChartConfig(chartType));
  
  // Update chart configuration when chart type changes
  useEffect(() => {
    setChartConfiguration(getSampleChartConfig(chartType));
  }, [chartType]);
  
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Chart Keyboard Navigation Demo
        </Typography>
        
        <Typography variant="body1" paragraph>
          This demo showcases the keyboard navigation capabilities for chart components. 
          Try using the keyboard to history.push through the chart data points:
        </Typography>
        
        <Box component="ul" sx={{ ml: 2 }}>
          <Typography component="li">Press <strong>Tab</strong> to focus on the chart</Typography>
          <Typography component="li">Use <strong>Arrow Keys</strong> to history.push between data points</Typography>
          <Typography component="li">Press <strong>Enter</strong> to select the current data point</Typography>
          <Typography component="li">Press <strong>Alt+H</strong> to view keyboard shortcuts</Typography>
          <Typography component="li">Press <strong>Alt+D</strong> to view the data table version</Typography>
          <Typography component="li">Press <strong>Alt+A</strong> to hear a summary of the chart</Typography>
        </Box>
      </Paper>
      
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ height: 400 }}>
            <EnhancedAccessibleChart
              configuration={chartConfiguration}
              height={350}
              title={`${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart with Keyboard Navigation`}
              subtitle="Use Tab to focus, then arrow keys to history.push data points"
              highContrastDefault={false}
              dataTableView={false}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AccessibilityKeyboardDemoChart; 