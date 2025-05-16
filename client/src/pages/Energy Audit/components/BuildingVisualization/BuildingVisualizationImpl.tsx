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
  TextField
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
    const imagePath = getFloorPlanImage(selectedFloor, viewMode);
    setFloorPlanImage(imagePath);
    
    // Reset any detected rooms when floor changes
    setDetectedRooms([]);
    setDetectionConfidence(0);
    
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
  
  // Handle room drag start
  const handleRoomDragStart = (roomId: string, e: React.MouseEvent) => {
    if (!isEditMode) return;
    
    e.preventDefault();
    setDraggedRoomId(roomId);
    
    // Remember the starting position for accurate movement calculation
    setDragStartPos({
      x: e.clientX,
      y: e.clientY
    });
  };
  
  // Handle room drag move
  const handleRoomDragMove = (e: React.MouseEvent) => {
    if (!draggedRoomId && !draggedHotspotId) return;
    
    e.preventDefault();
    
    // Get mouse movement delta
    const deltaX = e.clientX - dragStartPos.x;
    const deltaY = e.clientY - dragStartPos.y;
    
    // Adjust for zoom level
    const adjustedDeltaX = deltaX / zoomLevel;
    const adjustedDeltaY = deltaY / zoomLevel;
    
    if (draggedRoomId) {
      // Update room position
      const updatedRooms = roomData.map(room => {
        if (room.id === draggedRoomId) {
          return {
            ...room,
            coords: {
              ...room.coords,
              x: room.coords.x + adjustedDeltaX,
              y: room.coords.y + adjustedDeltaY
            }
          };
        }
        return room;
      });
      
      setRoomData(updatedRooms);
    } else if (draggedHotspotId && dragPosition) {
      // Resize the room using hotspot handles
      const roomToResize = roomData.find(room => room.id === draggedHotspotId);
      
      if (roomToResize) {
        const newCoords = { ...roomToResize.coords };
        
        // Different behavior based on which handle is dragged
        switch (dragPosition) {
          case 'nw': // Top-left
            newCoords.width += (newCoords.x - (newCoords.x + adjustedDeltaX));
            newCoords.height += (newCoords.y - (newCoords.y + adjustedDeltaY));
            newCoords.x += adjustedDeltaX;
            newCoords.y += adjustedDeltaY;
            break;
          case 'ne': // Top-right
            newCoords.width += adjustedDeltaX;
            newCoords.height += (newCoords.y - (newCoords.y + adjustedDeltaY));
            newCoords.y += adjustedDeltaY;
            break;
          case 'sw': // Bottom-left
            newCoords.width += (newCoords.x - (newCoords.x + adjustedDeltaX));
            newCoords.height += adjustedDeltaY;
            newCoords.x += adjustedDeltaX;
            break;
          case 'se': // Bottom-right
            newCoords.width += adjustedDeltaX;
            newCoords.height += adjustedDeltaY;
            break;
        }
        
        // Enforce minimum dimensions
        newCoords.width = Math.max(50, newCoords.width);
        newCoords.height = Math.max(50, newCoords.height);
        
        // Update all rooms
        const updatedRooms = roomData.map(room => {
          if (room.id === draggedHotspotId) {
            return {
              ...room,
              coords: newCoords,
              // Update physical dimensions based on pixel changes
              // Assuming 50px = 1m for conversion
              length: newCoords.width / 50,
              width: newCoords.height / 50,
              area: (newCoords.width / 50) * (newCoords.height / 50)
            };
          }
          return room;
        });
        
        setRoomData(updatedRooms);
      }
    }
    
    // Update drag start position for next move
    setDragStartPos({
      x: e.clientX,
      y: e.clientY
    });
  };
  
  // Handle room drag end
  const handleRoomDragEnd = () => {
    if (draggedRoomId) {
      // Save updated position to context
      const updatedRoom = roomData.find(r => r.id === draggedRoomId);
      if (updatedRoom) {
        updateRoomCoordinates(selectedFloor, draggedRoomId, updatedRoom.coords);
      }
    } else if (draggedHotspotId) {
      // Save updated dimensions to context
      const updatedRoom = roomData.find(r => r.id === draggedHotspotId);
      if (updatedRoom) {
        updateRoom(selectedFloor, draggedHotspotId, updatedRoom);
      }
    }
    
    // Reset drag state
    setDraggedRoomId(null);
    setDraggedHotspotId(null);
    setDragPosition(null);
  };
  
  // Handle hotspot drag start
  const handleHotspotDragStart = (hotspotId: string, position: string, e: React.MouseEvent) => {
    if (!isEditMode) return;
    
    e.preventDefault();
    setDraggedHotspotId(hotspotId);
    setDragPosition(position);
    
    // Remember the starting position
    setDragStartPos({
      x: e.clientX,
      y: e.clientY
    });
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
  
  // Add missing hotspot handler functions
  const handleHotspotDragMove = (e: React.MouseEvent) => {
    if (!draggedHotspotId || !dragPosition) return;
    
    e.preventDefault();
    
    // Calculate delta from drag start
    const deltaX = e.clientX - dragStartPos.x;
    const deltaY = e.clientY - dragStartPos.y;
    
    // Find the room being resized
    const room = roomData.find(r => r.id === draggedHotspotId);
    if (!room) return;
    
    // Update room dimensions based on drag position
    const updatedRoom = { ...room };
    
    // Adjust coordinates based on drag position
    switch (dragPosition) {
      case 'nw': // Northwest: adjust x, y, width and height
        updatedRoom.coords.x = room.coords.x + deltaX;
        updatedRoom.coords.y = room.coords.y + deltaY;
        updatedRoom.coords.width = room.coords.width - deltaX;
        updatedRoom.coords.height = room.coords.height - deltaY;
        break;
      case 'ne': // Northeast: adjust y, width and height
        updatedRoom.coords.y = room.coords.y + deltaY;
        updatedRoom.coords.width = room.coords.width + deltaX;
        updatedRoom.coords.height = room.coords.height - deltaY;
        break;
      case 'sw': // Southwest: adjust x, width and height
        updatedRoom.coords.x = room.coords.x + deltaX;
        updatedRoom.coords.width = room.coords.width - deltaX;
        updatedRoom.coords.height = room.coords.height + deltaY;
        break;
      case 'se': // Southeast: adjust width and height
        updatedRoom.coords.width = room.coords.width + deltaX;
        updatedRoom.coords.height = room.coords.height + deltaY;
        break;
    }
    
    // Update room dimensions in state
    updateRoom(selectedFloor, room.id, updatedRoom);
    
    // Update drag start position for next move
    setDragStartPos({
      x: e.clientX,
      y: e.clientY
    });
  };
  
  const handleHotspotDragEnd = () => {
    setDraggedHotspotId(null);
    setDragPosition(null);
  };
  
  return (
    <Box ref={containerRef} sx={{ height: '100%', width: '100%', position: 'relative' }}>
      <Typography variant="h5" gutterBottom>
        Building Visualization
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="body1" paragraph>
          Visualize and analyze building floor plans for energy audit purposes. 
          You can detect rooms automatically, edit their properties, and analyze energy consumption.
        </Typography>
        
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="building visualization tabs">
          <Tab label="Floor Plan" />
          <Tab label="Energy Analysis" />
          <Tab label="Lighting Simulation" />
        </Tabs>
      </Paper>
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
      
      {/* Popup menu for room editing */}
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
        <MenuItem onClick={() => editMenuRoomId && handleDeleteRoom(editMenuRoomId)}>
          <ListItemIcon>
            <DeleteOutline fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Room</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Room Properties Dialog */}
      {roomEditorOpen && selectedRoom && (
        <RoomEditor
          open={roomEditorOpen}
          room={selectedRoom as any}
          onClose={() => setRoomEditorOpen(false)}
          onSave={(room: any) => handleSaveRoom(room)}
          onDelete={handleDeleteRoom}
          isNewRoom={isNewRoom}
        />
      )}
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <>
      {activeTab === 0 && (
        <Box>
              {/* Visualization Controls */}
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <VisualizationControls
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    selectedFloor={selectedFloor}
                    handleFloorChange={handleFloorChange}
                    isEditMode={isEditMode}
                    toggleEditMode={toggleEditMode}
                    showGridLines={showGridLines}
                    setShowGridLines={setShowGridLines}
                    showLabels={showLabels}
                    setShowLabels={setShowLabels}
                    isPanMode={isPanMode}
                    setIsPanMode={togglePanMode}
                    handleDetectRooms={handleDetectRooms}
                    handleResetRoomPositions={handleResetRoomPositions}
                    handleFitToView={handleFitToView}
                    handleSynchronizeData={saveFloorData}
                    handleZoomIn={handleZoomIn}
                    handleZoomOut={handleZoomOut}
                    handleAddRoom={handleAddNewRoom}
                    zoomLevel={zoomLevel}
                    isSaving={isSaving}
                    isProcessingImage={isProcessingImage}
                    floorOptions={getFloorOptions()}
                    isMeasurementToolActive={isMeasurementActive}
                    setIsMeasurementToolActive={toggleMeasurementTool}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <DetectionMethodSelector
                    value={detectionMethod}
                    onChange={setDetectionMethod}
                    disabled={isProcessingImage}
                  />
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleDetectRooms}
                      disabled={isProcessingImage}
                      startIcon={<Search />}
                      fullWidth
                    >
                      {isProcessingImage ? 'Detecting Rooms...' : 'Detect Rooms'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
          
          {/* Floor Plan Visualization */}
              <Paper sx={{ p: 2, mb: 3, position: 'relative' }}>
                <Box 
                  ref={containerRef} 
                  sx={{ 
                    position: 'relative', 
                    height: { xs: '400px', sm: '500px', md: '600px', lg: '70vh' },
                    minHeight: '400px',
                    maxHeight: '80vh',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <FloorPlanVisualization
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
                    onPanStart={handlePanStart}
                    onPanMove={handlePanMove}
                    onPanEnd={handlePanEnd}
                    detectionConfidence={detectionConfidence}
                    viewMode={viewMode}
                    isEditMode={isEditMode}
                    onRoomClick={handleRoomClick}
                    onRoomDragStart={handleRoomDragStart}
                    onRoomDragMove={handleRoomDragMove}
                    onRoomDragEnd={handleRoomDragEnd}
                    onEditMenuOpen={handleEditMenuOpen}
                    onHotspotDragStart={handleHotspotDragStart}
                    onHotspotDragMove={handleHotspotDragMove}
                    onHotspotDragEnd={handleHotspotDragEnd}
                    onDelete={handleDeleteRoom}
                    onApplyDetections={handleApplyDetectedRooms}
                    selectedRoom={selectedRoom}
                    onSelectRoom={(room) => setSelectedRoom(room)}
                    isMeasurementToolActive={isMeasurementActive}
                    measurementState={measurementState}
                    handleMeasurementStart={handleMeasurementStart}
                    handleMeasurementMove={handleMeasurementMove}
                    handleMeasurementEnd={handleMeasurementEnd}
                  />
                </Box>
              </Paper>
          
          {/* Room Details Section */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Room Details
                    </Typography>
                    
                    {selectedRoomId && roomData.find(room => room.id === selectedRoomId) ? (
                      (() => {
                        const room = roomData.find(room => room.id === selectedRoomId)!;
                        return (
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="subtitle2">Name</Typography>
                              <Typography variant="body2">{room.name}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="subtitle2">Type</Typography>
                              <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{room.roomType}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="subtitle2">Length</Typography>
                              <Typography variant="body2">{room.length?.toFixed(2) || '0.00'} m</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="subtitle2">Width</Typography>
                              <Typography variant="body2">{room.width?.toFixed(2) || '0.00'} m</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="subtitle2">Area</Typography>
                              <Typography variant="body2">{room.area.toFixed(2)} m²</Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Divider sx={{ my: 1 }} />
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="subtitle2">Required Illuminance</Typography>
                              <Typography variant="body2">{room.requiredLux} lux</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="subtitle2">Compliance</Typography>
                              <Typography 
                                variant="body2" 
                                color={
                                  getRoomCompliance(room) >= 90 ? 'success.main' : 
                                  getRoomCompliance(room) >= 70 ? 'warning.main' : 
                                  'error.main'
                                }
                                fontWeight="bold"
                              >
                                {getRoomCompliance(room)}%
                              </Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Button 
                                size="small" 
                                variant="outlined"
                                onClick={() => {
                                  setIsNewRoom(false);
                                  setRoomEditorOpen(true);
                                }}
                                startIcon={<Edit />}
                              >
                                Edit Room
                              </Button>
                            </Grid>
                          </Grid>
                        );
                      })()
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No room selected. Click on a room to view details.
                      </Typography>
                    )}
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Floor Information
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Floor</Typography>
                        <Typography variant="body2">
                          {getFloorOptions().find(f => f.value === selectedFloor)?.label || selectedFloor}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">View Mode</Typography>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {viewMode}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Room Count</Typography>
                        <Typography variant="body2">
                          {roomData.length} rooms
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Total Floor Area</Typography>
                        <Typography variant="body2">
                          {roomData.reduce((sum, room) => sum + room.area, 0).toFixed(2)} m²
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          startIcon={<Add />}
                          onClick={handleAddNewRoom}
                          disabled={!isEditMode}
                        >
                          Add New Room
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {activeTab === 1 && (
            <EnergyAnalysisTab
              floorId={selectedFloor}
              roomData={roomData as any}
              onRoomSelect={(roomId: string) => {
                setSelectedRoomId(roomId);
                setActiveTab(0); // Switch to floor plan tab
              }}
              loadSchedules={[]} // Provide empty array for now
              selectedTimeRange="monthly" // Default to monthly view
              onTimeRangeChange={(e: any) => console.log('Time range changed:', e.target.value)} // Placeholder handler
            />
          )}
          
          {activeTab === 2 && (
            <LightingSimulation
              roomData={roomData as any}
              selectedRoomId={selectedRoomId}
              width={containerDimensions.width}
              height={containerDimensions.height}
              viewMode={viewMode}
            />
          )}
        </>
      )}
      
      {/* Room Dialog */}
      <RoomDialog
        open={isNewRoom}
        onClose={() => setIsNewRoom(false)}
        onSave={(room: RoomDetail) => handleSaveRoom(room)}
        room={selectedRoom || undefined}
        floorId={selectedFloor}
      />
    </Box>
  );
};

export default BuildingVisualizationImpl; 