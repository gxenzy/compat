import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Paper,
  Box,
  Chip,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  KeyboardOutlined as KeyboardIcon,
  CloseOutlined as CloseIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  Help as HelpIcon
} from '@mui/icons-material';

/**
 * Props for the KeyboardShortcutHelp component
 */
interface KeyboardShortcutProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;
  
  /**
   * Function to handle closing the dialog
   */
  onClose: () => void;
  
  /**
   * Type of chart for which to show shortcuts
   */
  chartType?: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'scatter' | 'default';
  
  /**
   * Whether the chart has multiple datasets
   */
  hasMultipleDatasets?: boolean;
}

/**
 * Keyboard shortcut definition
 */
interface ShortcutDefinition {
  key: string;
  description: string;
  category: 'navigation' | 'selection' | 'accessibility' | 'general';
}

/**
 * Component to display keyboard shortcuts for chart navigation
 */
const KeyboardShortcutHelp: React.FC<KeyboardShortcutProps> = ({
  open,
  onClose,
  chartType = 'default',
  hasMultipleDatasets = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentCategory, setCurrentCategory] = useState<string>('navigation');
  
  // Define common keyboard shortcuts
  const commonShortcuts: ShortcutDefinition[] = [
    { key: 'Tab', description: 'Move focus to chart', category: 'navigation' },
    { key: 'Enter / Space', description: 'Select current data point', category: 'selection' },
    { key: 'Escape', description: 'Exit chart navigation mode', category: 'navigation' },
    { key: 'Alt + D', description: 'Toggle data table view', category: 'accessibility' },
    { key: 'Alt + A', description: 'Announce chart summary', category: 'accessibility' },
    { key: 'Alt + H', description: 'Open keyboard shortcut help', category: 'general' }
  ];
  
  // Define chart-specific shortcuts
  const chartSpecificShortcuts: Record<string, ShortcutDefinition[]> = {
    default: [
      { key: 'Left Arrow / Right Arrow', description: 'Navigate between data points', category: 'navigation' },
      { key: 'Home', description: 'Move to first data point', category: 'navigation' },
      { key: 'End', description: 'Move to last data point', category: 'navigation' }
    ],
    bar: [
      { key: 'Left Arrow / Right Arrow', description: 'Navigate between bars', category: 'navigation' },
      { key: 'Up Arrow / Down Arrow', description: hasMultipleDatasets ? 'Navigate between datasets' : 'No action', category: 'navigation' }
    ],
    line: [
      { key: 'Left Arrow / Right Arrow', description: 'Navigate between points', category: 'navigation' },
      { key: 'Up Arrow / Down Arrow', description: hasMultipleDatasets ? 'Navigate between lines' : 'No action', category: 'navigation' }
    ],
    pie: [
      { key: 'Left Arrow / Right Arrow', description: 'Navigate between segments (clockwise/counter-clockwise)', category: 'navigation' }
    ],
    doughnut: [
      { key: 'Left Arrow / Right Arrow', description: 'Navigate between segments (clockwise/counter-clockwise)', category: 'navigation' }
    ],
    radar: [
      { key: 'Left Arrow / Right Arrow', description: 'Navigate between axes', category: 'navigation' },
      { key: 'Up Arrow / Down Arrow', description: hasMultipleDatasets ? 'Navigate between datasets' : 'No action', category: 'navigation' }
    ],
    scatter: [
      { key: 'Arrow Keys', description: 'Navigate to nearest point in direction', category: 'navigation' },
      { key: '+', description: 'Zoom in', category: 'navigation' },
      { key: '-', description: 'Zoom out', category: 'navigation' }
    ]
  };
  
  // Get shortcuts for current chart type
  const getShortcuts = () => {
    const specificShortcuts = chartSpecificShortcuts[chartType] || chartSpecificShortcuts.default;
    return [...commonShortcuts, ...specificShortcuts];
  };
  
  // Get shortcuts for a specific category
  const getShortcutsByCategory = (category: string) => {
    return getShortcuts().filter(shortcut => shortcut.category === category);
  };
  
  // Render keyboard key component
  const renderKeyboardKey = (keyText: string) => {
    // Handle composite keys (e.g., "Ctrl + A")
    const keys = keyText.split(' / ');
    
    return (
      <Box display="flex" flexDirection="row" alignItems="center" gap={1}>
        {keys.map((key, index) => (
          <React.Fragment key={key}>
            {index > 0 && <Typography variant="body2" color="textSecondary"> / </Typography>}
            <Chip
              label={key}
              size="small"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 'bold',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '4px',
                color: theme.palette.text.primary
              }}
            />
          </React.Fragment>
        ))}
      </Box>
    );
  };
  
  const categories = [
    { id: 'navigation', label: 'Navigation' },
    { id: 'selection', label: 'Selection' },
    { id: 'accessibility', label: 'Accessibility' },
    { id: 'general', label: 'General' }
  ];
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      aria-labelledby="keyboard-shortcut-help-title"
    >
      <DialogTitle id="keyboard-shortcut-help-title" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center">
          <KeyboardIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Keyboard Shortcuts</Typography>
          {chartType !== 'default' && (
            <Chip 
              label={`${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`} 
              size="small" 
              color="primary" 
              sx={{ ml: 2 }} 
            />
          )}
        </Box>
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Use these keyboard shortcuts to history.push and interact with charts. Keyboard navigation enhances accessibility and provides precise control.
          </Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Paper variant="outlined" sx={{ p: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Categories</Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {categories.map(category => (
                  <Button
                    key={category.id}
                    variant={currentCategory === category.id ? "contained" : "outlined"}
                    size="small"
                    fullWidth
                    onClick={() => setCurrentCategory(category.id)}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    {category.label}
                  </Button>
                ))}
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={9}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {categories.find(c => c.id === currentCategory)?.label} Shortcuts
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box>
                {getShortcutsByCategory(currentCategory).map((shortcut, index) => (
                  <Box key={index} sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}>
                    <Box width="40%" sx={{ pr: 2 }}>
                      {renderKeyboardKey(shortcut.key)}
                    </Box>
                    <Box width="60%">
                      <Typography variant="body2">{shortcut.description}</Typography>
                    </Box>
                  </Box>
                ))}
                
                {getShortcutsByCategory(currentCategory).length === 0 && (
                  <Typography variant="body2" color="textSecondary">
                    No shortcuts available in this category for the current chart type.
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
        <Box display="flex" alignItems="center">
          <HelpIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />
          <Typography variant="body2" color="textSecondary">
            Press Alt+H anytime to open this guide
          </Typography>
        </Box>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default KeyboardShortcutHelp; 