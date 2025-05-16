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
  Badge,
  ToggleButtonGroup,
  ToggleButton
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
  Edit,
  DesignServices,
  Architecture,
  CropFree,
  Straighten,
  LightbulbOutlined,
  Lightbulb,
  ElectricBolt,
  ElectricalServices,
  Fullscreen,
  FitScreen,
  AddCircleOutline
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
  handleFitToView: () => void;
  handleSynchronizeData: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleAddRoom: () => void;
  zoomLevel: number;
  isSaving: boolean;
  isProcessingImage: boolean;
  floorOptions: Array<{value: string, label: string}>;
  isMeasurementToolActive: boolean;
  setIsMeasurementToolActive: (isActive: boolean) => void;
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
  handleFitToView,
  handleSynchronizeData,
  handleZoomIn,
  handleZoomOut,
  handleAddRoom,
  zoomLevel,
  isSaving,
  isProcessingImage,
  floorOptions,
  isMeasurementToolActive,
  setIsMeasurementToolActive
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

  // Toggle measurement tool
  const toggleMeasurementTool = () => {
    // Turn off pan mode if measurement tool is active
    if (!isMeasurementToolActive) {
      setIsPanMode(false);
    }
    setIsMeasurementToolActive(!isMeasurementToolActive);
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
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, newMode) => newMode && setViewMode(newMode)}
                aria-label="view mode"
                size="small"
              >
                <ToggleButton value="lighting" aria-label="lighting layout">
                  <Tooltip title="Lighting Layout">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LightbulbOutlined sx={{ mr: 0.5 }} />
                      <Typography variant="body2">Lighting</Typography>
                    </Box>
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="power" aria-label="power layout">
                  <Tooltip title="Power Layout">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ElectricalServices sx={{ mr: 0.5 }} />
                      <Typography variant="body2">Power</Typography>
                    </Box>
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
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
                  }}
                >
                  Edit
                </Button>
              </Tooltip>
            </Grid>

            {/* View Controls */}
            <Grid item>
              <ButtonGroup size="small" aria-label="view controls">
                <Tooltip title="Zoom In">
                  <span>
                    <IconButton 
                      onClick={handleZoomIn}
                      disabled={isProcessingImage || zoomLevel >= 3.0}
                    >
                      <ZoomIn />
                    </IconButton>
                  </span>
                </Tooltip>
                
                <Tooltip title="Zoom Out">
                  <span>
                    <IconButton 
                      onClick={handleZoomOut}
                      disabled={isProcessingImage || zoomLevel <= 0.5}
                    >
                      <ZoomOut />
                    </IconButton>
                  </span>
                </Tooltip>
                
                <Tooltip title="Pan/Move">
                  <span>
                    <IconButton 
                      onClick={() => setIsPanMode(!isPanMode)}
                      color={isPanMode ? "primary" : "default"}
                      disabled={isProcessingImage}
                    >
                      <PanTool />
                    </IconButton>
                  </span>
                </Tooltip>
                
                <Tooltip title="Reset Room Positions">
                  <span>
                    <IconButton 
                      onClick={handleResetRoomPositions}
                      disabled={isProcessingImage}
                    >
                      <RestartAlt />
                    </IconButton>
                  </span>
                </Tooltip>
                
                <Tooltip title="Fit To View">
                  <span>
                    <IconButton 
                      onClick={handleFitToView}
                      disabled={isProcessingImage}
                    >
                      <FitScreen />
                    </IconButton>
                  </span>
                </Tooltip>
                
                <Tooltip title="Measurement Tool">
                  <span>
                    <IconButton 
                      onClick={() => setIsMeasurementToolActive(!isMeasurementToolActive)}
                      color={isMeasurementToolActive ? "primary" : "default"}
                      disabled={isProcessingImage}
                    >
                      <Straighten />
                    </IconButton>
                  </span>
                </Tooltip>
              </ButtonGroup>
            </Grid>

            {/* Feature Controls */}
            <Grid item>
              <ButtonGroup size="small" aria-label="feature controls">
                <Tooltip title={showGridLines ? "Hide Grid" : "Show Grid"}>
                  <span>
                    <IconButton 
                      onClick={() => setShowGridLines(!showGridLines)}
                      color={showGridLines ? "primary" : "default"}
                      disabled={isProcessingImage}
                    >
                      {showGridLines ? <GridOn /> : <GridOff />}
                    </IconButton>
                  </span>
                </Tooltip>
                
                <Tooltip title={showLabels ? "Hide Labels" : "Show Labels"}>
                  <span>
                    <IconButton 
                      onClick={() => setShowLabels(!showLabels)}
                      color={showLabels ? "primary" : "default"}
                      disabled={isProcessingImage}
                    >
                      {showLabels ? <Label /> : <LabelOff />}
                    </IconButton>
                  </span>
                </Tooltip>
                
                <Tooltip title="Add Room">
                  <span>
                    <IconButton 
                      onClick={handleAddRoom}
                      disabled={isProcessingImage || !isEditMode}
                    >
                      <AddCircleOutline />
                    </IconButton>
                  </span>
                </Tooltip>
                
                <Tooltip title="Detect Rooms">
                  <span>
                    <IconButton 
                      onClick={handleDetectRooms}
                      disabled={isProcessingImage}
                      color="primary"
                    >
                      <Search />
                    </IconButton>
                  </span>
                </Tooltip>
              </ButtonGroup>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Zoom Level Popover */}
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
        <Box sx={{ p: 2, width: 300 }}>
          <Typography id="zoom-slider" gutterBottom>
            Zoom Level
          </Typography>
          <Slider
            value={localZoomLevel}
            onChange={handleZoomChange}
            onChangeCommitted={handleZoomChangeCommitted}
            min={0.5}
            max={3.0}
            step={0.1}
            aria-labelledby="zoom-slider"
            valueLabelDisplay="auto"
            valueLabelFormat={value => `${Math.round(value * 100)}%`}
          />
        </Box>
      </Popover>
    </Paper>
  );
};

export default VisualizationControls; 