import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Typography,
  Tooltip,
  Box,
  Paper,
  Grid
} from '@mui/material';
import {
  Search,
  BubbleChart,
  Insights,
  AutoAwesome,
  Texture,
  ShapeLineOutlined
} from '@mui/icons-material';

export type DetectionMethod = 'auto' | 'opencv' | 'neural' | 'traditional' | 'text-based';

interface DetectionMethodSelectorProps {
  value: DetectionMethod;
  onChange: (value: DetectionMethod) => void;
  disabled?: boolean;
}

const DetectionMethodSelector: React.FC<DetectionMethodSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value as DetectionMethod);
  };

  // Method descriptions and icons
  const methods = [
    {
      value: 'auto',
      label: 'Auto (Best Method)',
      description: 'Automatically tries different methods to find the best results',
      icon: <AutoAwesome />
    },
    {
      value: 'opencv',
      label: 'OpenCV Detection',
      description: 'Advanced computer vision using edge detection and Hough transform',
      icon: <ShapeLineOutlined />
    },
    {
      value: 'neural',
      label: 'Neural Network',
      description: 'Machine learning based detection using neural networks',
      icon: <BubbleChart />
    },
    {
      value: 'traditional',
      label: 'Traditional CV',
      description: 'Classical computer vision techniques for room detection',
      icon: <Search />
    },
    {
      value: 'text-based',
      label: 'Text-Based',
      description: 'Uses text labels to identify and map rooms',
      icon: <Texture />
    }
  ];

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Room Detection Method
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12}>
          <FormControl fullWidth size="small">
            <InputLabel id="detection-method-label">Detection Method</InputLabel>
            <Select
              labelId="detection-method-label"
              id="detection-method-select"
              value={value}
              label="Detection Method"
              onChange={handleChange}
              disabled={disabled}
            >
              {methods.map((method) => (
                <MenuItem key={method.value} value={method.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ mr: 1 }}>{method.icon}</Box>
                    <Tooltip title={method.description}>
                      <Typography>{method.label}</Typography>
                    </Tooltip>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
        {methods.find(m => m.value === value)?.description || 'Select a detection method'}
      </Typography>
    </Paper>
  );
};

export default DetectionMethodSelector; 