import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  CircularProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  PanTool,
  Save,
  FitScreen,
  Grid4x4,
  Label,
  Fullscreen,
  FullscreenExit,
  CameraAlt
} from '@mui/icons-material';

// Import interfaces directly from buildingInterfaces.ts
import { RoomDetail, NonCompliantArea, Point, DetectedRoom } from '../interfaces/buildingInterfaces';
import SimplifiedFloorPlan from './SimplifiedFloorPlan';

// Sample floor plan for testing
const SAMPLE_FLOOR_PLAN = '/floorplan/office-layout.png';
const FALLBACK_FLOOR_PLAN = '/floorplan/sample-floor-plan.png';

// Room visualization colors by compliance level
const getComplianceColor = (compliance: number | undefined): string => {
  if (compliance === undefined) return 'rgba(128, 128, 128, 0.3)';
  if (compliance >= 85) return 'rgba(76, 175, 80, 0.3)';
  if (compliance >= 70) return 'rgba(255, 152, 0, 0.3)';
  return 'rgba(244, 67, 54, 0.3)';
};

// Sample data type
interface SampleData {
  name: string;
  floors: Record<string, {
    name: string;
    rooms: RoomDetail[];
    loadSchedules: any[];
  }>;
}

// EnergyAnalysisTab component
const EnergyAnalysisTab: React.FC<{
  roomData: RoomDetail[];
  loadSchedules: any[];
  selectedTimeRange: string;
  onTimeRangeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ roomData, loadSchedules, selectedTimeRange, onTimeRangeChange }) => {
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Energy Analysis
      </Typography>
      <Typography>
        Energy analysis content would go here
      </Typography>
    </Paper>
  );
};

// RoomDetailsTab component
const RoomDetailsTab: React.FC<{
  selectedRoom: RoomDetail | null;
}> = ({ selectedRoom }) => {
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Room Details
      </Typography>
      {selectedRoom ? (
        <Box>
          <Typography variant="subtitle1">
            {selectedRoom.name}
          </Typography>
          <Typography>
            Type: {selectedRoom.roomType}
          </Typography>
          <Typography>
            Dimensions: {selectedRoom.length}m x {selectedRoom.width}m x {selectedRoom.height}m
          </Typography>
          <Typography>
            Area: {selectedRoom.area} m²
          </Typography>
          <Typography>
            Energy Usage: {selectedRoom.energyUsage || 'N/A'} kWh/month
          </Typography>
        </Box>
      ) : (
        <Typography>
          Select a room to view details
        </Typography>
      )}
    </Paper>
  );
};

/**
 * BuildingVisualization Component
 * 
 * A comprehensive floor plan visualization tool for energy audits.
 * Includes features for viewing, editing, and analyzing building data.
 */
const BuildingVisualization: React.FC = () => {
  // State for floor plan and rooms
  const [floorPlanImage, setFloorPlanImage] = useState<string>(SAMPLE_FLOOR_PLAN);
  const [roomData, setRoomData] = useState<RoomDetail[]>([]);
  const [nonCompliantAreas, setNonCompliantAreas] = useState<NonCompliantArea[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<RoomDetail | null>(null);
  const [viewMode, setViewMode] = useState<'lighting' | 'power'>('lighting');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isPanMode, setIsPanMode] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
  const [showGridLines, setShowGridLines] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // UI state for notifications
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('info');
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);

  // Show snackbar message
  const showSnackbar = (message: string, severity: 'success' | 'info' | 'warning' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Load data when component mounts
  useEffect(() => {
    loadSampleData();
  }, []);

  // Load sample building data
  const loadSampleData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call with setTimeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Sample data with typed structure
      const data: SampleData = {
        name: 'Sample Building',
        floors: {
          'floor-1': {
            name: 'First Floor',
            rooms: [
              {
                id: 'room-1',
                name: 'Main Office',
                length: 10,
                width: 8,
                height: 3,
                area: 80,
                roomType: 'office',
                coords: { x: 200, y: 150, width: 200, height: 160 },
                requiredLux: 500,
                recommendedFixtures: 8,
                actualFixtures: 8,
                compliance: 95,
                reflectanceCeiling: 0.7,
                reflectanceWalls: 0.5,
                reflectanceFloor: 0.2,
                maintenanceFactor: 0.8,
                energyUsage: 450,
                shape: 'rect'
              },
              {
                id: 'room-2',
                name: 'Conference Room',
                length: 6,
                width: 5,
                height: 3,
                area: 30,
                roomType: 'meeting',
                coords: { x: 400, y: 150, width: 150, height: 120 },
                requiredLux: 300,
                recommendedFixtures: 4,
                actualFixtures: 4,
                compliance: 100,
                reflectanceCeiling: 0.7,
                reflectanceWalls: 0.5,
                reflectanceFloor: 0.2,
                maintenanceFactor: 0.8,
                energyUsage: 275,
                shape: 'rect'
              },
              {
                id: 'room-3',
                name: 'Reception',
                length: 5,
                width: 4,
                height: 3,
                area: 20,
                roomType: 'reception',
                coords: { x: 200, y: 310, width: 130, height: 100 },
                requiredLux: 300,
                recommendedFixtures: 3,
                actualFixtures: 2,
                compliance: 75,
                reflectanceCeiling: 0.7,
                reflectanceWalls: 0.5,
                reflectanceFloor: 0.2,
                maintenanceFactor: 0.8,
                energyUsage: 180,
                shape: 'rect'
              }
            ],
            loadSchedules: []
          }
        }
      };
      
      // Get the first floor key and safely access the data
      const firstFloorKey = Object.keys(data.floors)[0];
      
      if (firstFloorKey && data.floors[firstFloorKey]) {
        const floorData = data.floors[firstFloorKey];
        setRoomData(floorData.rooms);
        
        // Create properly typed non-compliant areas
        const area1: NonCompliantArea = {
          id: 'non-compliant-1',
          type: 'lighting',
          x: 300,
          y: 200,
          width: 100,
          height: 80,
          title: 'Insufficient Lighting',
          description: 'This area has insufficient lighting levels compared to standards',
          compliance: 65,
          recommendations: ['Increase number of fixtures', 'Use higher lumen output bulbs'],
          severity: 'medium',
          issueType: 'illuminance'
        };
        
        const area2: NonCompliantArea = {
          id: 'non-compliant-2',
          type: 'power',
          x: 450,
          y: 350,
          width: 120,
          height: 90,
          title: 'Overloaded Circuit',
          description: 'This area has too many devices on a single circuit',
          compliance: 70,
          recommendations: ['Redistribute loads', 'Add additional circuit'],
          severity: 'high',
          issueType: 'overload'
        };
        
        setNonCompliantAreas([area1, area2]);
        showSnackbar('Building data loaded successfully', 'success');
      }
    } catch (error) {
      console.error('Error loading building data:', error);
      showSnackbar('Failed to load building data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Save building data
  const saveBuildingData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      showSnackbar('Building data saved successfully', 'success');
    } catch (error) {
      console.error('Error saving building data:', error);
      showSnackbar('Failed to save building data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle room selection
  const handleRoomClick = (room: RoomDetail) => {
    setSelectedRoom(room);
    showSnackbar(`Selected room: ${room.name}`, 'info');
  };

  // Zoom in
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 3));
    showSnackbar('Zoomed in', 'info');
  };
  
  // Zoom out
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
    showSnackbar('Zoomed out', 'info');
  };
  
  // Reset view
  const handleFitToView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    showSnackbar('View reset', 'info');
  };
  
  // Toggle pan mode
  const handleTogglePanMode = () => {
    setIsPanMode(prev => !prev);
    if (!isPanMode) {
      showSnackbar('Pan mode enabled', 'info');
    } else {
      showSnackbar('Pan mode disabled', 'info');
    }
  };
  
  // Toggle grid lines
  const handleToggleGridLines = () => {
    setShowGridLines(prev => !prev);
  };
  
  // Toggle labels
  const handleToggleLabels = () => {
    setShowLabels(prev => !prev);
  };

  // Toggle fullscreen
  const handleToggleFullScreen = () => {
    const container = containerRef.current;
    
    if (container) {
      if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`);
          showSnackbar('Failed to enter fullscreen mode', 'error');
        });
        setIsFullScreen(true);
      } else {
        document.exitFullscreen().catch(err => {
          console.error(`Error attempting to exit full-screen mode: ${err.message}`);
        });
        setIsFullScreen(false);
      }
    }
  };
  
  // Save screenshot
  const handleSaveScreenshot = () => {
    showSnackbar('Screenshot saved', 'success');
    // Implementation would go here
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Render the controls section
  const renderControls = () => {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 1,
          mb: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ mr: 1 }}>
            Floor Plan
          </Typography>
          
          <Button
            variant="outlined"
            size="small"
            color={viewMode === 'lighting' ? 'primary' : 'inherit'}
            onClick={() => setViewMode('lighting')}
          >
            Lighting
          </Button>
          
          <Button
            variant="outlined"
            size="small"
            color={viewMode === 'power' ? 'primary' : 'inherit'}
            onClick={() => setViewMode('power')}
          >
            Power
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Tooltip title="Zoom In">
            <IconButton onClick={handleZoomIn} size="small">
              <ZoomIn />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Zoom Out">
            <IconButton onClick={handleZoomOut} size="small">
              <ZoomOut />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Fit to View">
            <IconButton onClick={handleFitToView} size="small">
              <FitScreen />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={isPanMode ? 'Exit Pan Mode' : 'Enter Pan Mode'}>
            <IconButton
              onClick={handleTogglePanMode}
              size="small"
              color={isPanMode ? 'primary' : 'inherit'}
            >
              <PanTool />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={showGridLines ? 'Hide Grid' : 'Show Grid'}>
            <IconButton
              onClick={handleToggleGridLines}
              size="small"
              color={showGridLines ? 'primary' : 'inherit'}
            >
              <Grid4x4 />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={showLabels ? 'Hide Labels' : 'Show Labels'}>
            <IconButton
              onClick={handleToggleLabels}
              size="small"
              color={showLabels ? 'primary' : 'inherit'}
            >
              <Label />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
            <IconButton
              onClick={handleToggleFullScreen}
              size="small"
            >
              {isFullScreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Save Screenshot">
            <IconButton
              onClick={handleSaveScreenshot}
              size="small"
            >
              <CameraAlt />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, ml: { xs: 0, md: 'auto' } }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setIsEditMode(prev => !prev)}
            color={isEditMode ? 'primary' : 'inherit'}
          >
            {isEditMode ? 'Exit Edit Mode' : 'Edit Mode'}
          </Button>
          
          <span>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<Save />}
              onClick={saveBuildingData}
              disabled={isLoading}
            >
              Save
            </Button>
          </span>
        </Box>
      </Paper>
    );
  };

  return (
    <Box 
      ref={containerRef}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {renderControls()}
      
      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange}
        sx={{ mb: 2 }}
      >
        <Tab label="Floor Plan" />
        <Tab label="Energy Analysis" />
        <Tab label="Room Details" />
      </Tabs>
      
      {/* Tab Content */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {activeTab === 0 && (
          <SimplifiedFloorPlan
            floorPlanImage={floorPlanImage}
            roomData={roomData}
            nonCompliantAreas={nonCompliantAreas.filter(area => area.type === viewMode)}
            selectedRoom={selectedRoom}
            zoomLevel={zoomLevel}
            panOffset={panOffset}
            isPanMode={isPanMode}
            showGridLines={showGridLines}
            showLabels={showLabels}
            viewMode={viewMode}
            onRoomClick={handleRoomClick}
            onPanChange={setPanOffset}
          />
        )}
        
        {activeTab === 1 && (
          <EnergyAnalysisTab 
            roomData={roomData}
            loadSchedules={[]}
            selectedTimeRange="monthly"
            onTimeRangeChange={(e) => console.log('Time range changed:', e.target.value)}
          />
        )}
        
        {activeTab === 2 && (
          <RoomDetailsTab selectedRoom={selectedRoom} />
        )}
      </Box>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BuildingVisualization; 