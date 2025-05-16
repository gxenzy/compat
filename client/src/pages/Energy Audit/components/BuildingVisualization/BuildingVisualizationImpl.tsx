import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  ButtonGroup,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SelectChangeEvent,
  CircularProgress,
  Tooltip,
  Snackbar,
  Alert,
  Menu,
  Divider,
  ListItemIcon,
  ListItemText,
  FormControlLabel,
  Switch,
  TextField,
  Stack,
  Toolbar
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  Refresh,
  LightbulbOutlined,
  SettingsApplications,
  Image,
  GridOn,
  GridOff,
  PanTool,
  Save,
  CloudUpload,
  CloudDownload,
  DeleteOutline,
  WarningAmber,
  Add,
  Edit,
  Visibility,
  VisibilityOff,
  Straighten,
  Lightbulb,
  Calculate,
  FormatShapes,
  Apartment,
  Download,
  Upload,
  Label,
  LabelOff,
  OpenInNew,
  Close,
  RestartAlt,
  InfoOutlined,
  Search
} from '@mui/icons-material';
import FloorPlanWrapper from './components/FloorPlanWrapper';
import LightingSimulation from './components/LightingSimulation';
import PolygonRoomEditor from './components/PolygonRoomEditor';
import RoomPropertiesDialog from './components/RoomPropertiesDialog';
import { detectRoomsFromImage, calculateGridLayout, convertDetectedRoomsToRoomDetails, adaptiveLearning } from './utils/cnnDetection';
import { calculateEnergyConsumption } from './utils/calculation';
import { 
  RoomDetail, 
  NonCompliantArea,
  Point,
  LoadSchedule,
  DetectedRoom
} from './interfaces/buildingInterfaces';
import { getSortedFloors, 
  getFloorPlanImage, 
  getFloorOptions
} from './config/floorPlanConfig';
import floorPlanService from './services/floorPlanService';
import { solDataService } from './services/solDataService';
import { useBuildingContext } from './contexts/BuildingContext';
import VisualizationControls from './components/VisualizationControls';
import RoomEditor from './components/RoomEditor';
import EnergyAnalysisTab from './components/EnergyAnalysisTab';
import { useTheme } from '@mui/material/styles';
import { v4 as uuidv4 } from 'uuid';
import { getItem } from '../../../../utils/storageUtils';
import { neuralDetection } from './utils/neuralDetection';
import SimplifiedFloorPlanImpl from './components/SimplifiedFloorPlanImpl';
import FloorPlanVisualization from './components/FloorPlanVisualization';
import FloorInformation from './components/FloorInformation';
import RoomDialog from './components/RoomDialog';
import measurementTool, { MeasurementState } from './utils/measurementTool';
import DetectionMethodSelector, { DetectionMethod } from './components/DetectionMethodSelector';
import { detectRooms } from './services/roomDetectionService';

// Type helper to handle interface mismatches
type AnyDetectedRoom = any;
type AnyRoomDetail = any;

/**
 * BuildingVisualizationImpl Component
 * Main component for visualizing building floor plans, rooms, and performing energy analysis
 */
const BuildingVisualizationImpl: React.FC = () => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'lighting' | 'power'>('lighting');
  const [selectedFloor, setSelectedFloor] = useState<string>('ground');
  const [floorPlanImage, setFloorPlanImage] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [showGridLines, setShowGridLines] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [isPanMode, setIsPanMode] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [detectedRooms, setDetectedRooms] = useState<DetectedRoom[]>([]);
  const [detectionConfidence, setDetectionConfidence] = useState<number>(0);
  const [roomEditorOpen, setRoomEditorOpen] = useState<boolean>(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isNewRoom, setIsNewRoom] = useState<boolean>(false);
  const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 600 });
  const [notification, setNotification] = useState<{ open: boolean, message: string, severity: 'success' | 'info' | 'warning' | 'error' }>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [editMenuAnchorEl, setEditMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [editMenuRoomId, setEditMenuRoomId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [nonCompliantAreas, setNonCompliantAreas] = useState<NonCompliantArea[]>([]);
  const [draggedRoomId, setDraggedRoomId] = useState<string | null>(null);
  const [draggedHotspotId, setDraggedHotspotId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [detectionMethod, setDetectionMethod] = useState<DetectionMethod>('opencv');
  const [viewOrientation, setViewOrientation] = useState<'landscape' | 'portrait'>('landscape');
  
  // Context for building data
  const {
    buildingData,
    isLoading,
    error,
    selectedFloor: contextSelectedFloor,
    setSelectedFloor: setContextSelectedFloor,
    rooms,
    setRooms,
    selectedRoom,
    setSelectedRoom,
    addRoom,
    updateRoom,
    deleteRoom,
    saveBuildingData,
    runRoomDetection,
    applyDetectedRooms,
    updateRoomCoordinates
  } = useBuildingContext();
  
  // Room data local state (synchronized with context)
  const [roomData, setRoomData] = useState<RoomDetail[]>([]);
  
  // Measurement tool state
  const [measurementState, setMeasurementState] = useState<MeasurementState>(
    measurementTool.initMeasurementState()
  );
  
  // State for measurement tool
  const [isMeasurementActive, setIsMeasurementActive] = useState<boolean>(false);
  
  // Update local room data when context rooms change
  useEffect(() => {
    if (rooms) {
      // Start with the base rooms from context
      setRoomData(rooms as any);
      
      // Update room data with SOL information
      const enrichedRooms = solDataService.enrichRoomsWithSOLData(rooms as any, selectedFloor);
      setRoomData(enrichedRooms as any);
    }
  }, [rooms, selectedFloor]);
  
  // Update floor plan image when floor or view mode changes
  useEffect(() => {
    // Add public URL prefix to ensure proper path resolution
    const imagePath = process.env.PUBLIC_URL + getFloorPlanImage(selectedFloor, viewMode);
    console.log('Setting floor plan image path:', imagePath);
    setFloorPlanImage(imagePath);
    
    // Load image to determine orientation before rendering
    const img = document.createElement('img');
    img.onload = () => {
      // Force landscape orientation by setting a CSS class
      const isLandscape = img.width > img.height;
      console.log('Image loaded in effect with dimensions:', img.width, 'x', img.height);
      console.log('Setting orientation to:', isLandscape ? 'landscape' : 'portrait');
      setViewOrientation(isLandscape ? 'landscape' : 'portrait');
    
    // Reset any detected rooms when floor changes
    setDetectedRooms([]);
    setDetectionConfidence(0);
      
      // Reset zoom and pan to ensure the image is visible
      setZoomLevel(1.0);
      setPanOffset({ x: 0, y: 0 });
    };
    
    // Use a proper error handler with the correct type
    img.onerror = () => {
      console.error('Failed to load image:', imagePath);
    };
    
    img.src = imagePath;
    
    // Notify context of floor change
    setContextSelectedFloor(selectedFloor);
  }, [selectedFloor, viewMode, setContextSelectedFloor]);
  
  // Update container dimensions when the container element changes size
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Use ResizeObserver to track container size changes
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        
        // Store previous dimensions to detect significant changes
        const prevWidth = containerDimensions.width;
        const prevHeight = containerDimensions.height;
        
        // Update dimensions
        setContainerDimensions({ width, height });
        
                  // If dimensions changed significantly (>10%), auto-fit the floor plan
          const widthChange = Math.abs(width - prevWidth) / prevWidth;
          const heightChange = Math.abs(height - prevHeight) / prevHeight;
          
          if ((widthChange > 0.1 || heightChange > 0.1) && width > 0 && height > 0) {
            // Reset zoom and pan after a short delay to allow the layout to stabilize
            setTimeout(() => {
              // Use the handleFitToView function to properly fit content
              handleFitToView();
            }, 300);
          }
      }
    });
    
    observer.observe(containerRef.current);
    
    // Add window resize listener for global resize events
    const handleWindowResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width, height });
        
                  // Auto-fit on window resize after a short delay
          setTimeout(() => {
            // Use the full fit-to-view function
            handleFitToView();
          }, 300);
      }
    };
    
    window.addEventListener('resize', handleWindowResize);
    
    // Clean up observers and listeners on unmount
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [containerDimensions.width, containerDimensions.height]);
  
  // Handle floor change
  const handleFloorChange = (e: SelectChangeEvent) => {
    setSelectedFloor(e.target.value);
    setPanOffset({ x: 0, y: 0 }); // Reset pan position when changing floors
  };
  
  // Handle zoom in
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 3.0));
  };
  
  // Handle zoom out
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };
  
  // Handle toggle edit mode
  const toggleEditMode = () => {
    setIsEditMode(prev => !prev);
    
    if (isEditMode) {
      // Exiting edit mode, save changes
      saveFloorData();
    }
  };
  
  // Fit to view handler function that resets zoom and centers content
  const handleFitToView = () => {
    // Reset zoom level to default
    setZoomLevel(1.0);
    
    // Reset pan offset
    setPanOffset({ x: 0, y: 0 });
    
    // If we have rooms, calculate a view that fits all rooms
    if (roomData.length > 0) {
      // Find the bounding box of all rooms
      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;
      
      roomData.forEach(room => {
        const { x, y, width, height } = room.coords;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, y + height);
      });
      
      // Calculate center of all rooms
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      // Calculate container center
      const containerCenterX = containerDimensions.width / 2;
      const containerCenterY = containerDimensions.height / 2;
      
      // Calculate offset to center rooms
      const offsetX = containerCenterX - centerX;
      const offsetY = containerCenterY - centerY;
      
      // Apply offset
      setPanOffset({ x: offsetX, y: offsetY });
    }
    
    setNotification({
      open: true,
      message: 'Floor plan fitted to view',
      severity: 'info'
    });
  };
  
  // Handle room click
  const handleRoomClick = (roomId: string) => {
    const room = roomData.find(r => r.id === roomId);
    if (room) {
      setSelectedRoomId(roomId);
      setSelectedRoom(room);
    }
  };
  
  // Handle drag start for rooms
  const handleRoomDragStart = (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Save the starting position for calculating drag delta
    setDraggedRoomId(roomId);
    setDragStartPos({
      x: e.clientX,
      y: e.clientY
    });
  
    // Set drag position to center to avoid jumping
    setDragPosition('center');
    
    // Prevent default behavior to avoid text selection
    e.preventDefault();
    
    // Update cursor to indicate dragging
    document.body.style.cursor = 'move';
  };
  
  // Handle drag move for rooms
  const handleRoomDragMove = (e: React.MouseEvent) => {
    if (!draggedRoomId) return;
    
    // Calculate position delta, taking zoom level into account
    const deltaX = (e.clientX - dragStartPos.x) / zoomLevel;
    const deltaY = (e.clientY - dragStartPos.y) / zoomLevel;
    
    // Update room coordinates
      const updatedRooms = roomData.map(room => {
        if (room.id === draggedRoomId) {
        // Create a new room object with updated coordinates
          return {
            ...room,
            coords: {
              ...room.coords,
            x: room.coords.x + deltaX,
            y: room.coords.y + deltaY
            }
          };
        }
        return room;
      });
      
    // Update local state first for smooth dragging
      setRoomData(updatedRooms);
    
    // Update context with the new position
    const updatedRoom = updatedRooms.find(room => room.id === draggedRoomId);
    if (updatedRoom) {
      updateRoomCoordinates(selectedFloor, draggedRoomId, updatedRoom.coords);
    }
    
    // Reset drag start position for continuous dragging
    setDragStartPos({
      x: e.clientX,
      y: e.clientY
    });
  };
  
  // Handle drag end for rooms
  const handleRoomDragEnd = () => {
    setDraggedRoomId(null);
    setDragStartPos({ x: 0, y: 0 });
    setDragPosition(null);
    
    // Reset cursor
    document.body.style.cursor = 'default';
    
    // Save the updated room positions
    saveFloorData();
  };
  
  // Handle drag start for resizing rooms via hotspots
  const handleHotspotDragStart = (roomId: string, position: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setDraggedHotspotId(roomId);
    setDragPosition(position);
    setDragStartPos({
      x: e.clientX,
      y: e.clientY
    });
    
    // Set cursor based on handle position
    const cursorMap: Record<string, string> = {
      'nw': 'nwse-resize',
      'n': 'ns-resize',
      'ne': 'nesw-resize',
      'e': 'ew-resize',
      'se': 'nwse-resize',
      's': 'ns-resize',
      'sw': 'nesw-resize',
      'w': 'ew-resize'
    };
    document.body.style.cursor = cursorMap[position] || 'move';
  };
  
  // Handle drag move for resizing rooms
  const handleHotspotDragMove = (e: React.MouseEvent) => {
    if (!draggedHotspotId || !dragPosition) return;
    
    // Calculate delta movement, accounting for zoom level
    const deltaX = (e.clientX - dragStartPos.x) / zoomLevel;
    const deltaY = (e.clientY - dragStartPos.y) / zoomLevel;
    
    // Find the room being resized
    const room = roomData.find(r => r.id === draggedHotspotId);
    if (!room) return;
    
    // Create a copy of the room's coordinates
    const newCoords = { ...room.coords };
        
    // Update coordinates based on which handle is being dragged
        switch (dragPosition) {
      case 'nw': // Northwest
        newCoords.x += deltaX;
        newCoords.y += deltaY;
        newCoords.width -= deltaX;
        newCoords.height -= deltaY;
            break;
      case 'n': // North
        newCoords.y += deltaY;
        newCoords.height -= deltaY;
            break;
      case 'ne': // Northeast
        newCoords.y += deltaY;
        newCoords.width += deltaX;
        newCoords.height -= deltaY;
            break;
      case 'e': // East
        newCoords.width += deltaX;
        break;
      case 'se': // Southeast
        newCoords.width += deltaX;
        newCoords.height += deltaY;
        break;
      case 's': // South
        newCoords.height += deltaY;
        break;
      case 'sw': // Southwest
        newCoords.x += deltaX;
        newCoords.width -= deltaX;
        newCoords.height += deltaY;
        break;
      case 'w': // West
        newCoords.x += deltaX;
        newCoords.width -= deltaX;
            break;
        }
        
    // Ensure minimum dimensions to prevent collapse
    const MIN_SIZE = 20;
    if (newCoords.width < MIN_SIZE) {
      if (['nw', 'w', 'sw'].includes(dragPosition)) {
        newCoords.x = newCoords.x - (MIN_SIZE - newCoords.width);
      }
      newCoords.width = MIN_SIZE;
    }
    
    if (newCoords.height < MIN_SIZE) {
      if (['nw', 'n', 'ne'].includes(dragPosition)) {
        newCoords.y = newCoords.y - (MIN_SIZE - newCoords.height);
      }
      newCoords.height = MIN_SIZE;
    }
    
    // Create the updated room with new coordinates
    const updatedRoom = {
              ...room,
              coords: newCoords,
      // Recalculate room measurements
      length: newCoords.width / 50, // Convert pixels to meters
      width: newCoords.height / 50,  // Convert pixels to meters
      area: (newCoords.width / 50) * (newCoords.height / 50) // Area in square meters
    };
    
    // Update local state for smooth resizing
    const updatedRooms = roomData.map(r => r.id === draggedHotspotId ? updatedRoom : r);
        setRoomData(updatedRooms);
    
    // Update context
    updateRoomCoordinates(selectedFloor, draggedHotspotId, updatedRoom.coords);
    
    // Reset drag start position for continuous dragging
    setDragStartPos({
      x: e.clientX,
      y: e.clientY
    });
  };
  
  // Handle drag end for resizing rooms
  const handleHotspotDragEnd = () => {
    setDraggedHotspotId(null);
    setDragPosition(null);
    setDragStartPos({ x: 0, y: 0 });
    
    // Reset cursor
    document.body.style.cursor = 'default';
    
    // Save changes to persistent storage
    saveFloorData();
  };
  
  // Handle pan start
  const handlePanStart = (e: React.MouseEvent) => {
    if (!isPanMode) return;
    
    e.preventDefault();
    
    // Indicate active panning with cursor change
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing';
    }
    
    setDragStartPos({
      x: e.clientX,
      y: e.clientY
    });
  };
  
  // Handle pan move
  const handlePanMove = (e: React.MouseEvent) => {
    // Check if this is a custom pan/zoom event from FloorPlanVisualization
    if ((e as any).zoomLevel && (e as any).panOffset) {
      // Direct update from child component (used for fit to view)
      const customEvent = e as any;
      setZoomLevel(customEvent.zoomLevel);
      setPanOffset(customEvent.panOffset);
      return;
    }
    
    // Regular pan handling
    if (!isPanMode) return;
    
    e.preventDefault();
    
    // Make sure we have a starting position
    if (dragStartPos.x === 0 && dragStartPos.y === 0) return;
    
    // Calculate delta
    const deltaX = e.clientX - dragStartPos.x;
    const deltaY = e.clientY - dragStartPos.y;
    
    // Update pan offset
    setPanOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    // Update drag start position for next move
    setDragStartPos({
      x: e.clientX,
      y: e.clientY
    });
  };
  
  // Handle pan end
  const handlePanEnd = () => {
    // Reset cursor
    if (containerRef.current) {
      containerRef.current.style.cursor = isPanMode ? 'grab' : 'default';
    }
    
    // Reset drag start position
    setDragStartPos({ x: 0, y: 0 });
  };
  
  // Toggle pan mode
  const togglePanMode = () => {
    // Can't use both pan and measurement at the same time
    if (!isPanMode) {
      setIsMeasurementActive(false);
    }
    setIsPanMode(!isPanMode);
    
    // Update cursor
    if (containerRef.current) {
      containerRef.current.style.cursor = !isPanMode ? 'grab' : 'default';
    }
  };
  
  // Handle edit menu open
  const handleEditMenuOpen = (roomId: string) => {
    const roomElement = document.querySelector(`[data-id="${roomId}"]`);
    if (roomElement) {
      setEditMenuRoomId(roomId);
      setEditMenuAnchorEl(roomElement as HTMLElement);
    }
  };
  
  // Handle edit menu close
  const handleEditMenuClose = () => {
    setEditMenuAnchorEl(null);
    setEditMenuRoomId(null);
  };
  
  // Handle room edit
  const handleEditRoom = () => {
    handleEditMenuClose();
    if (editMenuRoomId) {
      setSelectedRoomId(editMenuRoomId);
      setIsNewRoom(false);
      setRoomEditorOpen(true);
    }
  };
  
  // Handle room delete
  const handleDeleteRoom = (roomId: string) => {
    handleEditMenuClose();
    
    // Show confirmation dialog
    const confirmation = window.confirm('Are you sure you want to delete this room?');
    if (!confirmation) return;
    
    // Remove from context
    deleteRoom(selectedFloor, roomId).then(success => {
      if (success) {
        // Room deleted successfully
        setNotification({
          open: true,
          message: 'Room deleted successfully',
          severity: 'success'
        });
        
        // If this was the selected room, clear selection
        if (selectedRoomId === roomId) {
          setSelectedRoomId(null);
        }
      } else {
        setNotification({
          open: true,
          message: 'Failed to delete room',
          severity: 'error'
        });
      }
    });
  };
  
  // Measurement tool handlers
  const handleMeasurementStart = (e: React.MouseEvent) => {
    if (!isMeasurementActive) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomLevel - panOffset.x;
    const y = (e.clientY - rect.top) / zoomLevel - panOffset.y;
    
    setMeasurementState(measurementTool.startMeasurement(measurementState, { x, y }));
  };
  
  const handleMeasurementMove = (e: React.MouseEvent) => {
    if (!isMeasurementActive || !measurementState.active) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomLevel - panOffset.x;
    const y = (e.clientY - rect.top) / zoomLevel - panOffset.y;
    
    setMeasurementState(measurementTool.updateMeasurement(measurementState, { x, y }));
  };
  
  const handleMeasurementEnd = (e: React.MouseEvent) => {
    if (!isMeasurementActive || !measurementState.active) return;
    
    setMeasurementState(measurementTool.completeMeasurement(measurementState));
  };
  
  // Toggle measurement tool
  const toggleMeasurementTool = () => {
    // Can't use both pan and measurement at the same time
    if (!isMeasurementActive) {
      setIsPanMode(false);
    }
    setIsMeasurementActive(!isMeasurementActive);
  };
  
  // Handle add new room
  const handleAddNewRoom = useCallback(() => {
    // Create a new room at the center of the view
    const centerX = containerDimensions.width / 2;
    const centerY = containerDimensions.height / 2;
    
    // Default room size
    const defaultWidth = 200;
    const defaultHeight = 150;
    
    // Generate unique ID
    const newId = `room-${uuidv4().slice(0, 8)}`;
    
    // Default properties based on room type
    const defaultRoom: RoomDetail = {
      id: newId,
      name: `New Room`,
      roomType: 'office',
      length: defaultWidth / 50, // Convert px to meters
      width: defaultHeight / 50,
      height: 3, // Standard ceiling height in meters
      area: (defaultWidth / 50) * (defaultHeight / 50),
      coords: {
        x: centerX,
        y: centerY,
        width: defaultWidth,
        height: defaultHeight
      },
      reflectanceCeiling: 0.7,
      reflectanceWalls: 0.5,
      reflectanceFloor: 0.2,
      maintenanceFactor: 0.8,
      requiredLux: 300,
      recommendedFixtures: 4,
      actualFixtures: 4,
      compliance: 100,
      shape: 'rect'
    };
    
    // Set as selected and open dialog
    setSelectedRoomId(newId);
    setIsNewRoom(true);
    setSelectedRoom(defaultRoom);
    setRoomEditorOpen(true);
  }, [containerDimensions, setSelectedRoom]);
  
  // Handle saving a room (new or existing)
  const handleSaveRoom = (roomData: RoomDetail) => {
    setRoomEditorOpen(false);
    
    if (isNewRoom) {
      // Add new room
      addRoom(selectedFloor, roomData).then(success => {
        if (success) {
          setNotification({
            open: true,
            message: 'Room added successfully',
            severity: 'success'
          });
        } else {
          setNotification({
            open: true,
            message: 'Failed to add room',
            severity: 'error'
          });
        }
      });
    } else {
      // Update existing room
      updateRoom(selectedFloor, roomData.id, roomData).then(success => {
        if (success) {
          setNotification({
            open: true,
            message: 'Room updated successfully',
            severity: 'success'
          });
        } else {
          setNotification({
            open: true,
            message: 'Failed to update room',
            severity: 'error'
          });
        }
      });
    }
  };
  
  // CNN room detection
  const handleDetectRooms = async () => {
    if (!containerRef.current) return;
    
    // Get container dimensions
    const { width, height } = containerDimensions;
    
    // Start processing
    setIsProcessingImage(true);
    setDetectedRooms([]);
    
    // Show notification that detection is starting
    setNotification({
      open: true,
      message: `Processing floor plan image using ${detectionMethod} detection method...`,
      severity: 'info'
    });
    
    try {
      // Make sure the image has loaded
      if (!floorPlanImage) {
        throw new Error('No floor plan image available');
      }
      
      console.log('Starting room detection on floor plan:', selectedFloor, viewMode);
      console.log('Container dimensions:', width, 'x', height);
      console.log('Using detection method:', detectionMethod);

      // Use the detection service with the selected method
      const result = await detectRooms(floorPlanImage, width, height, {
        method: detectionMethod,
        useCache: true
      });
      
      // Update state with processed rooms
      setDetectedRooms(result.rooms);
      setDetectionConfidence(result.confidenceScore);
      
      // Show detection quality feedback to user
      let severityLevel: 'success' | 'warning' | 'info' = 'info';
      let detectionMessage = `Detected ${result.rooms.length} rooms`;
      
      if (result.confidenceScore > 0.8) {
        severityLevel = 'success';
        detectionMessage += ' with high confidence';
      } else if (result.confidenceScore > 0.6) {
        severityLevel = 'info';
        detectionMessage += ' with medium confidence';
      } else {
        severityLevel = 'warning';
        detectionMessage += ' with low confidence. Consider manual adjustment';
      }
      
      setNotification({
        open: true,
        message: detectionMessage,
        severity: severityLevel
      });
      
    } catch (error) {
      console.error('Error detecting rooms:', error);
      
      setNotification({
        open: true,
        message: 'Error detecting rooms. Please try again.',
        severity: 'error'
      });
      
      // Clean up
      setDetectedRooms([]);
      setDetectionConfidence(0);
    } finally {
      setIsProcessingImage(false);
    }
  };
  
  /**
   * Apply detected rooms to the floor plan
   */
  const handleApplyDetectedRooms = async () => {
    if (detectedRooms.length === 0) return;
    
    try {
      // Get the image element for training
      const floorPlanImg = document.querySelector(`img[src="${floorPlanImage}"]`) as HTMLImageElement;
      
      // Save this detection for future learning with adaptive learning
      adaptiveLearning.saveDetection(detectedRooms as AnyDetectedRoom[], selectedFloor, detectionConfidence);
      
      // Generate fully-editable room details from detected rooms
      const roomDetails = convertDetectedRoomsToRoomDetails(detectedRooms as AnyDetectedRoom[]);
      
      // Enhance room details with additional properties to ensure full editability
      const enhancedRoomDetails = roomDetails.map(room => {
        // Determine if this is a polygon-shaped room based on points
        const hasPolygonPoints = Array.isArray(room.points) && room.points.length >= 3;
        
        return {
          ...room,
          // Add unique ID if not present
          id: room.id || `room-${uuidv4().slice(0, 8)}`,
          // Add default name if not present
          name: room.name || `Room ${Math.floor(Math.random() * 100)}`,
          // Ensure all required properties for editing are present
          editable: true,
          isDetected: true,
          // Explicitly set shape based on points property
          shape: hasPolygonPoints ? 'poly' : 'rect',
          // Add measurement properties if missing
          length: room.length || (room.coords.width / 50),
          width: room.width || (room.coords.height / 50),
          height: room.height || 3,
          area: room.area || ((room.coords.width / 50) * (room.coords.height / 50)),
        };
      });
      
      console.log('Enhanced room details:', enhancedRoomDetails);
      
      // Train the neural model if available
      if (neuralDetection) {
        try {
          console.log('Training neural detection model with verified room data');
          await neuralDetection.trainOnSample(floorPlanImg, detectedRooms as AnyDetectedRoom[]);
        } catch (err) {
          console.warn('Neural model training failed:', err);
        }
      }
      
      // Manually add the rooms to the existing rooms array to ensure they're fully editable
      const currentRooms = [...roomData];
      
      // Add each enhanced room to the current rooms array
      enhancedRoomDetails.forEach(newRoom => {
        // Check for existing rooms in the same location (to avoid duplicates)
        const existingRoomIndex = currentRooms.findIndex(room => 
          Math.abs(room.coords.x - newRoom.coords.x) < 20 && 
          Math.abs(room.coords.y - newRoom.coords.y) < 20 &&
          Math.abs(room.coords.width - newRoom.coords.width) < 20 &&
          Math.abs(room.coords.height - newRoom.coords.height) < 20
        );
        
        if (existingRoomIndex >= 0) {
          // Update existing room with new properties
          currentRooms[existingRoomIndex] = {
            ...currentRooms[existingRoomIndex],
            ...newRoom,
            // Keep the same ID to preserve references
            id: currentRooms[existingRoomIndex].id,
            // Ensure the shape is a valid enum value
            shape: newRoom.shape === 'poly' ? 'poly' : 'rect'
          };
        } else {
          // Add new room, ensuring the shape is a valid enum value
          currentRooms.push({
            ...newRoom,
            shape: newRoom.shape === 'poly' ? 'poly' : 'rect'
          });
        }
      });
      
      // Update rooms in context
      setRooms(currentRooms as any);
      
      // Apply to building context (backup method)
      const success = await applyDetectedRooms(selectedFloor, detectedRooms as AnyDetectedRoom[]);
      
      if (success) {
        // Clear detected rooms once applied
        setDetectedRooms([]);
        setDetectionConfidence(0);
        
        setNotification({
          open: true,
          message: `Added ${enhancedRoomDetails.length} fully editable rooms to the floor plan.`,
          severity: 'success'
        });
      } else {
        // Even if the context update failed, we've already added the rooms manually
        setNotification({
          open: true,
          message: `Added ${enhancedRoomDetails.length} rooms but failed to update context.`,
          severity: 'warning'
        });
      }
    } catch (error) {
      console.error('Error applying detected rooms:', error);
      setNotification({
        open: true,
        message: 'An error occurred while applying room detection',
        severity: 'error'
      });
    }
  };
  
  // Reset room positions to their original layout
  const handleResetRoomPositions = () => {
    // If we have detected rooms, we can reset to those positions
    if (detectedRooms.length > 0) {
      // Convert detected rooms to room details
      const resetRooms = convertDetectedRoomsToRoomDetails(detectedRooms as AnyDetectedRoom[]);
      
      // Update rooms with reset positions
      setRoomData(resetRooms as AnyRoomDetail[]);
      
      // Update in context
      if (resetRooms.length > 0) {
        resetRooms.forEach(room => {
          updateRoomCoordinates(selectedFloor, room.id, room.coords);
        });
      }
    } else {
      // Otherwise just reset pan and zoom
      setZoomLevel(1.0);
      setPanOffset({ x: 0, y: 0 });
    }
    
    setNotification({
      open: true,
      message: 'Room positions reset',
      severity: 'info'
    });
  };
  
  // Save all floor data
  const saveFloorData = () => {
    setIsSaving(true);
    
    saveBuildingData().then(success => {
      setIsSaving(false);
      
      if (success) {
        setNotification({
          open: true,
          message: 'Floor plan data saved successfully',
          severity: 'success'
        });
      } else {
        setNotification({
          open: true,
          message: 'Failed to save floor plan data',
          severity: 'error'
        });
      }
    });
  };
  
  // Tab change handler
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Close notification
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };
  
  const getRoomCompliance = (room: RoomDetail): number => {
    // Handle undefined case
    return room.compliance || 0;
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Tab navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="building visualization tabs">
          <Tab label="Floor Plan" />
          <Tab label="Energy Analysis" />
        </Tabs>
      </Box>

      {/* Floor plan control panel */}
      {activeTab === 0 && (
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="floor-select-label">Floor</InputLabel>
                <Select
                  labelId="floor-select-label"
                  value={selectedFloor}
                  label="Floor"
                  onChange={handleFloorChange}
                >
                  {getFloorOptions().map((floor) => (
                    <MenuItem key={floor.value} value={floor.value}>
                      {floor.label}
        </MenuItem>
                  ))}
                </Select>
              </FormControl>
                </Grid>
            <Grid item xs={12} md={9}>
              <ButtonGroup size="small" variant="outlined">
                <Tooltip title="Zoom In">
                  <IconButton onClick={handleZoomIn}>
                    <ZoomIn />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Zoom Out">
                  <IconButton onClick={handleZoomOut}>
                    <ZoomOut />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Reset View">
                  <IconButton onClick={handleFitToView}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
                <Tooltip title={isPanMode ? "Exit Pan Mode" : "Pan Mode"}>
                  <IconButton 
                    onClick={togglePanMode} 
                    color={isPanMode ? "primary" : "default"}
                  >
                    <PanTool />
                  </IconButton>
                </Tooltip>
                <Tooltip title={showGridLines ? "Hide Grid" : "Show Grid"}>
                  <IconButton 
                    onClick={() => setShowGridLines(!showGridLines)} 
                    color={showGridLines ? "primary" : "default"}
                  >
                    {showGridLines ? <GridOn /> : <GridOff />}
                  </IconButton>
                </Tooltip>
                <Tooltip title={showLabels ? "Hide Labels" : "Show Labels"}>
                  <IconButton 
                    onClick={() => setShowLabels(!showLabels)} 
                    color={showLabels ? "primary" : "default"}
                  >
                    {showLabels ? <Label /> : <LabelOff />}
                  </IconButton>
                </Tooltip>
                <Tooltip title={isMeasurementActive ? "Exit Measurement" : "Measure Distance"}>
                  <IconButton 
                    onClick={toggleMeasurementTool} 
                    color={isMeasurementActive ? "primary" : "default"}
                  >
                    <Straighten />
                  </IconButton>
                </Tooltip>
                <Tooltip title={isEditMode ? "Exit Edit Mode" : "Edit Rooms"}>
                  <IconButton 
                    onClick={toggleEditMode} 
                    color={isEditMode ? "primary" : "default"}
                  >
                    <Edit />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Detect Rooms">
                  <IconButton onClick={handleDetectRooms} disabled={isProcessingImage}>
                    <Search />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Save Changes">
                  <IconButton onClick={saveFloorData} disabled={isSaving}>
                    <Save />
                  </IconButton>
                </Tooltip>
              </ButtonGroup>
                </Grid>
              </Grid>
        </Box>
      )}
          
      {/* Main content area */}
      <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Floor plan view */}
        {activeTab === 0 && (
          <Box sx={{ height: '100%', position: 'relative' }}>
            <FloorPlanWrapper
                    floorPlanImage={floorPlanImage}
                    roomData={roomData}
                    detectedRooms={detectedRooms}
                    nonCompliantAreas={nonCompliantAreas}
                    isProcessingImage={isProcessingImage}
                    showGridLines={showGridLines}
                    showLabels={showLabels}
                    zoomLevel={zoomLevel}
                    panOffset={panOffset}
                    isPanMode={isPanMode}
                    detectionConfidence={detectionConfidence}
                    viewMode={viewMode}
                    isEditMode={isEditMode}
              selectedRoom={selectedRoom ? selectedRoom as any : null}
                    onRoomClick={handleRoomClick}
              onSelectRoom={setSelectedRoom}
              onApplyDetections={handleApplyDetectedRooms}
                    onRoomDragStart={handleRoomDragStart}
                    onRoomDragMove={handleRoomDragMove}
                    onRoomDragEnd={handleRoomDragEnd}
                    onEditMenuOpen={handleEditMenuOpen}
                    onHotspotDragStart={handleHotspotDragStart}
                    onHotspotDragMove={handleHotspotDragMove}
                    onHotspotDragEnd={handleHotspotDragEnd}
                    onDelete={handleDeleteRoom}
              onPanStart={handlePanStart}
              onPanMove={handlePanMove}
              onPanEnd={handlePanEnd}
                    isMeasurementToolActive={isMeasurementActive}
                    measurementState={measurementState}
                    handleMeasurementStart={handleMeasurementStart}
                    handleMeasurementMove={handleMeasurementMove}
                    handleMeasurementEnd={handleMeasurementEnd}
              viewOrientation={viewOrientation}
                  />
                </Box>
        )}
          
        {/* Energy analysis view */}
          {activeTab === 1 && (
            <EnergyAnalysisTab
              roomData={roomData as any}
            loadSchedules={[]}
            selectedTimeRange="monthly"
            onTimeRangeChange={(e) => {}}
            floorId={selectedFloor}
            onRoomSelect={handleRoomClick}
            />
          )}
      </Box>
      
      {/* Room editor dialog */}
      <RoomDialog
        open={roomEditorOpen}
        onClose={() => setRoomEditorOpen(false)}
        room={selectedRoom as any}
        onSave={handleSaveRoom}
        floorId={selectedFloor}
      />

      {/* Notification snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Room context menu */}
      <Menu
        anchorEl={editMenuAnchorEl}
        open={Boolean(editMenuAnchorEl)}
        onClose={handleEditMenuClose}
      >
        <MenuItem onClick={handleEditRoom}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Room</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleDeleteRoom(editMenuRoomId || '');
          handleEditMenuClose();
        }}>
          <ListItemIcon>
            <DeleteOutline fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete Room</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default BuildingVisualizationImpl; 