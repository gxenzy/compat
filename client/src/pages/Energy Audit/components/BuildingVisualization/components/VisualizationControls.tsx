import React, { useState } from 'react';
import {
  Box,
  ButtonGroup,
  Button,
  IconButton,
  Tooltip,
  Grid,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Divider,
  Switch,
  FormControlLabel,
  Popover,
  Slider,
  Badge
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  GridOn,
  GridOff,
  PanTool,
  Save,
  RestartAlt,
  Refresh,
  Add,
  Visibility,
  VisibilityOff,
  Search,
  Label,
  LabelOff,
  Download,
  Upload,
  FormatShapes,
  Image,
  Edit,
  DesignServices,
  Architecture,
  CropFree,
  Straighten
} from '@mui/icons-material';

interface VisualizationControlsProps {
  viewMode: 'lighting' | 'power';
  setViewMode: (mode: 'lighting' | 'power') => void;
  selectedFloor: string;
  handleFloorChange: (event: SelectChangeEvent) => void;
  isEditMode: boolean;
  toggleEditMode: () => void;
  showGridLines: boolean;
  setShowGridLines: (show: boolean) => void;
  showLabels: boolean;
  setShowLabels: (show: boolean) => void;
  isPanMode: boolean;
  setIsPanMode: (isPan: boolean) => void;
  handleDetectRooms: () => void;
  handleResetRoomPositions: () => void;
  handleSynchronizeData: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleAddRoom: () => void;
  zoomLevel: number;
  isSaving: boolean;
  isProcessingImage: boolean;
  floorOptions: Array<{value: string, label: string}>;
}

/**
 * Enhanced visualization controls component with comprehensive floor plan editing tools
 */
const VisualizationControls: React.FC<VisualizationControlsProps> = ({
  viewMode,
  setViewMode,
  selectedFloor,
  handleFloorChange,
  isEditMode,
  toggleEditMode,
  showGridLines,
  setShowGridLines,
  showLabels,
  setShowLabels,
  isPanMode,
  setIsPanMode,
  handleDetectRooms,
  handleResetRoomPositions,
  handleSynchronizeData,
  handleZoomIn,
  handleZoomOut,
  handleAddRoom,
  zoomLevel,
  isSaving,
  isProcessingImage,
  floorOptions
}) => {
  // State for zoom slider popover
  const [zoomAnchorEl, setZoomAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [localZoomLevel, setLocalZoomLevel] = useState<number>(zoomLevel);

  // Handle zoom slider change
  const handleZoomChange = (_event: Event, newValue: number | number[]) => {
    setLocalZoomLevel(newValue as number);
  };

  // Handle zoom slider commit
  const handleZoomChangeCommitted = () => {
    // Update the actual zoom level to match the slider value
    // The parent component would need a method to set exact zoom values
    // For now, we'll approximate by zooming in/out multiple times
    const zoomDifference = localZoomLevel - zoomLevel;
    const zoomStep = 0.1; // Assuming each zoom step is 0.1
    
    // Perform zoom operations based on difference
    if (zoomDifference > 0) {
      for (let i = 0; i < zoomDifference / zoomStep; i++) {
        handleZoomIn();
      }
    } else if (zoomDifference < 0) {
      for (let i = 0; i < Math.abs(zoomDifference) / zoomStep; i++) {
        handleZoomOut();
      }
    }
  };

  // Handle zoom popover
  const handleZoomClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setZoomAnchorEl(event.currentTarget);
  };

  const handleZoomClose = () => {
    setZoomAnchorEl(null);
  };

  const zoomOpen = Boolean(zoomAnchorEl);
  const zoomId = zoomOpen ? 'zoom-popover' : undefined;

  return (
    <Paper sx={{ 
      p: 2, 
      mb: 2,
      borderRadius: '8px',
      className: 'floorPlanControls',
      height: 'auto',
      overflow: 'visible',
      '& .MuiButton-root': {
        height: '36px',
      },
      '& .MuiButtonGroup-root': {
        height: '36px',
      },
      '& .MuiIconButton-root': {
        height: '36px',
        width: '36px',
      },
      '& .MuiInputBase-root': {
        height: '36px',
      }
    }}>
      <Grid container spacing={2} alignItems="center">
        {/* Floor and View Mode Selection */}
        <Grid item xs={12} sm={6} md={4}>
          <Grid container spacing={1}>
            <Grid item xs={7}>
              <FormControl fullWidth size="small">
                <InputLabel id="floor-select-label">Floor</InputLabel>
                <Select
                  labelId="floor-select-label"
                  id="floor-select"
                  value={selectedFloor}
                  label="Floor"
                  onChange={handleFloorChange}
                  disabled={isProcessingImage}
                  sx={{
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderRadius: '8px',
                    }
                  }}
                >
                  {floorOptions.map(floor => (
                    <MenuItem key={floor.value} value={floor.value}>
                      {floor.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={5}>
              <ButtonGroup 
                variant="outlined" 
                size="small" 
                fullWidth
                sx={{
                  '& .MuiButton-root': {
                    borderRadius: '8px',
                    height: '36px',
                    '&:first-of-type': {
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                    },
                    '&:last-of-type': {
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                    }
                  }
                }}
              >
                <Tooltip title="Lighting View">
                  <Button 
                    variant={viewMode === 'lighting' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('lighting')}
                    disabled={isProcessingImage}
                  >
                    <Image fontSize="small" />
                  </Button>
                </Tooltip>
                <Tooltip title="Power View">
                  <Button
                    variant={viewMode === 'power' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('power')}
                    disabled={isProcessingImage}
                  >
                    <Architecture fontSize="small" />
                  </Button>
                </Tooltip>
              </ButtonGroup>
            </Grid>
          </Grid>
        </Grid>

        {/* Main Controls */}
        <Grid item xs={12} sm={6} md={8}>
          <Grid container spacing={1} justifyContent="flex-end">
            {/* Edit Mode Toggle */}
            <Grid item>
              <Tooltip title={isEditMode ? "Exit Edit Mode" : "Enter Edit Mode"}>
                <Button
                  variant={isEditMode ? "contained" : "outlined"}
                  color={isEditMode ? "primary" : "inherit"}
                  onClick={toggleEditMode}
                  startIcon={<Edit />}
                  disabled={isProcessingImage}
                  size="small"
                  sx={{
                    borderRadius: '8px',
                    height: '36px',
                    minWidth: '90px'
                  }}
                >
                  {isEditMode ? "Editing" : "Edit"}
                </Button>
              </Tooltip>
            </Grid>

            {/* Room Detection */}
            <Grid item>
              <Tooltip title="Auto-Detect Rooms">
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleDetectRooms}
                  startIcon={<Search />}
                  disabled={isProcessingImage}
                  size="small"
                  sx={{
                    borderRadius: '8px',
                    height: '36px',
                    minWidth: '90px'
                  }}
                >
                  Detect
                </Button>
              </Tooltip>
            </Grid>

            {/* Add Room */}
            <Grid item>
              <Tooltip title="Add New Room">
                <Button
                  variant="outlined"
                  color="success"
                  onClick={handleAddRoom}
                  startIcon={<Add />}
                  disabled={!isEditMode || isProcessingImage}
                  size="small"
                  sx={{
                    borderRadius: '8px',
                    height: '36px',
                    minWidth: '100px'
                  }}
                >
                  Add Room
                </Button>
              </Tooltip>
            </Grid>

            {/* Save Button */}
            <Grid item>
              <Tooltip title="Save Changes">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSynchronizeData}
                  startIcon={<Save />}
                  size="small"
                  sx={{
                    borderRadius: '8px',
                    height: '36px',
                    minWidth: '80px'
                  }}
                  disabled={isSaving || isProcessingImage}
                >
                  Save
                </Button>
              </Tooltip>
            </Grid>
          </Grid>
        </Grid>

        {/* Bottom Tools Bar */}
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
          <Grid container spacing={1} alignItems="center">
            {/* View Options */}
            <Grid item>
              <ButtonGroup 
                variant="outlined" 
                size="small"
                sx={{
                  '& .MuiButtonBase-root': {
                    borderRadius: '8px',
                    height: '36px',
                    width: '36px',
                    '&:not(:last-of-type)': {
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                    },
                    '&:not(:first-of-type)': {
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                    }
                  }
                }}
              >
                {/* Grid Toggle */}
                <Tooltip title={showGridLines ? "Hide Grid" : "Show Grid"}>
                  <IconButton 
                    color={showGridLines ? "primary" : "default"}
                    onClick={() => setShowGridLines(!showGridLines)}
                    disabled={isProcessingImage}
                    sx={{
                      bgcolor: showGridLines ? 'rgba(25, 118, 210, 0.1)' : undefined
                    }}
                  >
                    {showGridLines ? <GridOn /> : <GridOff />}
                  </IconButton>
                </Tooltip>
                
                {/* Labels Toggle */}
                <Tooltip title={showLabels ? "Hide Labels" : "Show Labels"}>
                  <IconButton
                    color={showLabels ? "primary" : "default"}
                    onClick={() => setShowLabels(!showLabels)}
                    disabled={isProcessingImage}
                    sx={{
                      bgcolor: showLabels ? 'rgba(25, 118, 210, 0.1)' : undefined
                    }}
                  >
                    {showLabels ? <Label /> : <LabelOff />}
                  </IconButton>
                </Tooltip>
                
                {/* Pan Mode Toggle */}
                <Tooltip title={isPanMode ? "Exit Pan Mode" : "Enter Pan Mode"}>
                  <IconButton 
                    color={isPanMode ? "primary" : "default"}
                    onClick={() => setIsPanMode(!isPanMode)}
                    disabled={isProcessingImage}
                    sx={{
                      bgcolor: isPanMode ? 'rgba(25, 118, 210, 0.1)' : undefined
                    }}
                  >
                    <PanTool />
                  </IconButton>
                </Tooltip>
              </ButtonGroup>
            </Grid>
            
            {/* Zoom Controls */}
            <Grid item>
              <ButtonGroup 
                variant="outlined" 
                size="small"
                sx={{
                  '& .MuiButtonBase-root': {
                    borderRadius: '8px',
                    height: '36px',
                    '&:not(:last-of-type)': {
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                    },
                    '&:not(:first-of-type)': {
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                    }
                  },
                  '& .MuiButton-root': {
                    minWidth: '64px'
                  }
                }}
              >
                <Tooltip title="Zoom Out">
                  <IconButton 
                    onClick={handleZoomOut} 
                    disabled={isProcessingImage || zoomLevel <= 0.5}
                  >
                    <ZoomOut />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Zoom Level">
                  <Button 
                    onClick={handleZoomClick}
                    disabled={isProcessingImage}
                  >
                    {Math.round(zoomLevel * 100)}%
                  </Button>
                </Tooltip>
                
                <Tooltip title="Zoom In">
                  <IconButton 
                    onClick={handleZoomIn} 
                    disabled={isProcessingImage || zoomLevel >= 3}
                  >
                    <ZoomIn />
                  </IconButton>
                </Tooltip>
              </ButtonGroup>
              
              {/* Zoom Slider Popover */}
              <Popover
                id={zoomId}
                open={zoomOpen}
                anchorEl={zoomAnchorEl}
                onClose={handleZoomClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'center',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'center',
                }}
              >
                <Box sx={{ p: 2, width: 200 }}>
                  <Typography id="zoom-slider-label" gutterBottom>
                    Zoom Level: {Math.round(localZoomLevel * 100)}%
                  </Typography>
                  <Slider
                    value={localZoomLevel}
                    onChange={handleZoomChange}
                    onChangeCommitted={handleZoomChangeCommitted}
                    aria-labelledby="zoom-slider-label"
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                    step={0.1}
                    marks
                    min={0.5}
                    max={3}
                  />
                </Box>
              </Popover>
            </Grid>
            
            {/* Reset/Restore Controls */}
            <Grid item>
              <ButtonGroup 
                variant="outlined" 
                size="small"
                sx={{
                  '& .MuiButtonBase-root': {
                    borderRadius: '8px',
                    height: '36px',
                    width: '36px',
                    '&:not(:last-of-type)': {
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                    },
                    '&:not(:first-of-type)': {
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                    }
                  }
                }}
              >
                <Tooltip title="Reset Room Positions">
                  <IconButton 
                    onClick={handleResetRoomPositions}
                    disabled={isProcessingImage}
                  >
                    <RestartAlt />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Fit to View">
                  <IconButton 
                    onClick={() => {
                      // Reset zoom and pan position
                      // This would need additional implementation in parent
                      // For now approximation by resetting the zoom level
                      while (zoomLevel > 1) {
                        handleZoomOut();
                      }
                      while (zoomLevel < 1) {
                        handleZoomIn();
                      }
                    }}
                    disabled={isProcessingImage}
                  >
                    <CropFree />
                  </IconButton>
                </Tooltip>
              </ButtonGroup>
            </Grid>
            
            {/* Measurement Mode - Not implemented yet */}
            <Grid item>
              <Tooltip title="Measurement Tool (Coming Soon)">
                <span>
                  <IconButton 
                    disabled
                    sx={{
                      borderRadius: '8px',
                      height: '36px',
                      width: '36px',
                    }}
                  >
                    <Straighten />
                  </IconButton>
                </span>
              </Tooltip>
            </Grid>
            
            {/* Right Aligned Status */}
            <Grid item xs sx={{ textAlign: 'right' }}>
              {isProcessingImage ? (
                <Typography variant="body2" color="text.secondary">
                  Processing image...
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {isEditMode ? "Edit mode active" : "View mode"}
                </Typography>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default VisualizationControls; 