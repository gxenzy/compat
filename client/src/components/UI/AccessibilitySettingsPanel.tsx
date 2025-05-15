import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Collapse
} from '@mui/material';
import {
  Contrast as ContrastIcon,
  TextFields as TextFieldsIcon,
  SlowMotionVideo as ReduceMotionIcon,
  AccessibilityNew as AccessibilityIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Visibility as VisionIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useAccessibilitySettings } from '../../contexts/AccessibilitySettingsContext';
import { ColorBlindnessType, colorBlindnessLabels } from '../../utils/accessibility/colorBlindnessSimulation';

interface AccessibilitySettingsPanelProps {
  onClose?: () => void;
  variant?: 'modal' | 'embedded';
}

const AccessibilitySettingsPanel: React.FC<AccessibilitySettingsPanelProps> = ({
  onClose,
  variant = 'embedded'
}) => {
  const theme = useTheme();
  const { 
    settings, 
    toggleHighContrast, 
    toggleLargeText, 
    toggleReduceMotion, 
    toggleScreenReaderOptimization,
    setColorBlindnessType
  } = useAccessibilitySettings();

  const [colorBlindnessExpanded, setColorBlindnessExpanded] = useState(false);

  const handleColorBlindnessTypeChange = (event: SelectChangeEvent) => {
    setColorBlindnessType(event.target.value as ColorBlindnessType);
  };

  const toggleColorBlindnessExpanded = () => {
    setColorBlindnessExpanded(!colorBlindnessExpanded);
  };

  return (
    <Paper 
      elevation={variant === 'modal' ? 6 : 1}
      sx={{ 
        p: 4,
        width: '100%',
        maxWidth: variant === 'modal' ? 500 : '100%',
        position: 'relative',
        borderRadius: variant === 'modal' ? '28px' : theme.shape.borderRadius,
        ...(settings.highContrastMode && {
          background: '#000000',
          color: '#FFFFFF',
          border: '2px solid #FFFFFF'
        })
      }}
    >
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AccessibilityIcon sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight={600}>Accessibility Settings</Typography>
        </Box>
        {variant === 'modal' && onClose && (
          <IconButton onClick={onClose} size="small" aria-label="Close accessibility settings" sx={{ 
            bgcolor: 'rgba(0,0,0,0.05)', 
            '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' } 
          }}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Settings Controls */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.highContrastMode}
              onChange={toggleHighContrast}
              color="primary"
              inputProps={{ 'aria-label': 'Toggle high contrast mode' }}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ContrastIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
              <Typography>High Contrast Mode</Typography>
              <Tooltip title="Increases contrast for better visibility">
                <IconButton size="small" sx={{ ml: 1 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          }
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.largeText}
              onChange={toggleLargeText}
              color="primary"
              inputProps={{ 'aria-label': 'Toggle large text mode' }}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextFieldsIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
              <Typography>Large Text Mode</Typography>
              <Tooltip title="Increases text size for better readability">
                <IconButton size="small" sx={{ ml: 1 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          }
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.reduceMotion}
              onChange={toggleReduceMotion}
              color="primary"
              inputProps={{ 'aria-label': 'Toggle reduced motion' }}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ReduceMotionIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
              <Typography>Reduce Motion</Typography>
              <Tooltip title="Minimizes animations and transitions">
                <IconButton size="small" sx={{ ml: 1 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          }
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.screenReaderOptimization}
              onChange={toggleScreenReaderOptimization}
              color="primary"
              inputProps={{ 'aria-label': 'Toggle screen reader optimization' }}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccessibilityIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
              <Typography>Screen Reader Optimization</Typography>
              <Tooltip title="Adds additional labels and descriptions for screen readers">
                <IconButton size="small" sx={{ ml: 1 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          }
        />

        {/* Color Blindness Simulation */}
        <Box>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              mb: colorBlindnessExpanded ? 2 : 0
            }}
            onClick={toggleColorBlindnessExpanded}
          >
            <VisionIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
            <Typography>Color Blindness Simulation</Typography>
            <IconButton 
              size="small" 
              sx={{ ml: 1 }}
              onClick={(e) => {
                e.stopPropagation();
                toggleColorBlindnessExpanded();
              }}
            >
              {colorBlindnessExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            <Tooltip title="Simulates how content appears to people with different types of color blindness">
              <IconButton size="small" sx={{ ml: 1 }}>
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Collapse in={colorBlindnessExpanded}>
            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 1 }}>
                Simulation Type
              </Typography>
              <FormControl 
                fullWidth 
                variant="outlined" 
                size="small"
                sx={{ 
                  ...(settings.highContrastMode && {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#FFFFFF'
                    },
                    '& .MuiInputLabel-root': {
                      color: '#FFFFFF'
                    },
                    '& .MuiSelect-select': {
                      color: '#FFFFFF'
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#FFFFFF'
                    }
                  })
                }}
              >
                <Select
                  id="color-blindness-type"
                  value={settings.colorBlindnessSimulation}
                  onChange={handleColorBlindnessTypeChange}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 300,
                        mt: 0.5,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        borderRadius: '12px',
                        '& .MuiMenuItem-root': {
                          py: 1.2,
                          '&.Mui-selected': {
                            backgroundColor: theme => theme.palette.primary.light,
                            color: theme => theme.palette.primary.contrastText,
                            '&:hover': {
                              backgroundColor: theme => theme.palette.primary.main,
                            }
                          },
                          '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.04)',
                          }
                        }
                      }
                    }
                  }}
                  sx={{
                    borderRadius: '8px',
                    '&:focus': {
                      boxShadow: 'none',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme => theme.palette.primary.main,
                        borderWidth: '2px'
                      }
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderRadius: '8px'
                    }
                  }}
                >
                  {Object.values(ColorBlindnessType).map((type) => (
                    <MenuItem key={type} value={type}>
                      {colorBlindnessLabels[type]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                This setting simulates how charts and colors appear to people with different types of color vision deficiency. It helps design accessible data visualizations.
              </Typography>
            </Box>
          </Collapse>
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
        These settings are saved automatically and will persist across your sessions. Use keyboard shortcut Alt+A to quickly open accessibility settings.
      </Typography>
    </Paper>
  );
};

export default AccessibilitySettingsPanel; 