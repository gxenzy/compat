import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Tooltip,
  Chip,
  Grid,
  ButtonGroup
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  RestartAlt,
  CropFree,
  Check,
  Close,
  Straighten,
  Add,
  WarningAmber
} from '@mui/icons-material';
import { RoomDetail, DetectedRoom, NonCompliantArea, Point } from '../interfaces/buildingInterfaces';
import { MeasurementState, Measurement } from '../utils/measurementTool';
import '../BuildingVisualization.css';

interface FloorPlanVisualizationProps {
  floorPlanImage: string;
  roomData: RoomDetail[];
  detectedRooms: DetectedRoom[];
  nonCompliantAreas: NonCompliantArea[];
  isProcessingImage: boolean;
  showGridLines: boolean;
  showLabels: boolean;
  zoomLevel: number;
  panOffset: Point;
  isPanMode: boolean;
  detectionConfidence: number;
  viewMode: 'lighting' | 'power';
  isEditMode: boolean;
  onRoomClick: (roomId: string) => void;
  onRoomDragStart: (roomId: string, e: React.MouseEvent) => void;
  onRoomDragMove: (e: React.MouseEvent) => void;
  onRoomDragEnd: () => void;
  onEditMenuOpen: (roomId: string) => void;
  onHotspotDragStart: (hotspotId: string, position: string, e: React.MouseEvent) => void;
  onHotspotDragMove: (e: React.MouseEvent) => void;
  onHotspotDragEnd: () => void;
  onDelete: (roomId: string) => void;
  onApplyDetections: () => void;
  selectedRoom: RoomDetail | null;
  onSelectRoom: (room: RoomDetail) => void;
  onPanStart: (e: React.MouseEvent) => void;
  onPanMove: (e: React.MouseEvent) => void;
  onPanEnd: () => void;
  isMeasurementToolActive: boolean;
  measurementState: MeasurementState;
  handleMeasurementStart: (e: React.MouseEvent) => void;
  handleMeasurementMove: (e: React.MouseEvent) => void;
  handleMeasurementEnd: (e: React.MouseEvent) => void;
  viewOrientation: 'landscape' | 'portrait';
}

/**
 * FloorPlanVisualization Component
 * Renders the floor plan image with interactive room elements and controls
 */
const FloorPlanVisualization: React.FC<FloorPlanVisualizationProps> = ({
  floorPlanImage,
  roomData,
  detectedRooms,
  nonCompliantAreas,
  isProcessingImage,
  showGridLines,
  showLabels,
  zoomLevel,
  panOffset,
  isPanMode,
  detectionConfidence,
  viewMode,
  isEditMode,
  onRoomClick,
  onRoomDragStart,
  onRoomDragMove,
  onRoomDragEnd,
  onEditMenuOpen,
  onHotspotDragStart,
  onHotspotDragMove,
  onHotspotDragEnd,
  onDelete,
  onApplyDetections,
  selectedRoom,
  onSelectRoom,
  onPanStart,
  onPanMove,
  onPanEnd,
  isMeasurementToolActive,
  measurementState,
  handleMeasurementStart,
  handleMeasurementMove,
  handleMeasurementEnd,
  viewOrientation
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  
  // Get container dimensions on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };
    
    updateSize();
    
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, []);
  
  // Load floor plan image
  useEffect(() => {
    if (floorPlanImage) {
      const img = new Image();
      img.onload = () => {
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
        console.log('Image loaded successfully:', imgWidth, 'x', imgHeight);
        setImageLoaded(true);
        setImageError(null);
        setImageSize({ width: imgWidth, height: imgHeight });
      
        // Auto-fit image to view
        setTimeout(() => handleFitToView(), 100);
      };
      
      img.onerror = () => {
        console.error('Failed to load floor plan image:', floorPlanImage);
        setImageError(`Failed to load image: ${floorPlanImage}`);
        setImageLoaded(false);
      };
      
      img.src = floorPlanImage;
      }
  }, [floorPlanImage]);
  
  // Fit to view handler
  const handleFitToView = () => {
    if (!containerRef.current || imageSize.width === 0) return;
    
    // Calculate the zoom level to fit the image
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    // Determine if image is landscape or portrait
    const isLandscape = imageSize.width > imageSize.height;
    
    // Calculate ratios
    const widthRatio = containerWidth / imageSize.width;
    const heightRatio = containerHeight / imageSize.height;
    
    // Use appropriate scaling based on image and container orientations
    let newZoomLevel;
    
    if (isLandscape) {
      // For landscape images, prioritize width fitting if container is relatively wide
      if (containerWidth / containerHeight > 1.2) {
        newZoomLevel = widthRatio * 0.95; // 95% to add slight margin
      } else {
        // Container is more square or portrait, use the smaller ratio
        newZoomLevel = Math.min(widthRatio, heightRatio) * 0.9;
      }
    } else {
      // For portrait images, prioritize height fitting if container is relatively tall
      if (containerHeight / containerWidth > 1.2) {
        newZoomLevel = heightRatio * 0.95; // 95% to add slight margin
      } else {
        // Container is more square or landscape, use the smaller ratio
        newZoomLevel = Math.min(widthRatio, heightRatio) * 0.9;
      }
    }
    
    // Ensure zoom level is reasonable (not too small or too large)
    newZoomLevel = Math.max(0.1, Math.min(newZoomLevel, 2.0));
    
    // Center the image
    const newPanOffset = {
      x: (containerWidth / newZoomLevel - imageSize.width) / 2,
      y: (containerHeight / newZoomLevel - imageSize.height) / 2
    };
    
    // Call appropriate parent handlers to update state
    if (onPanMove) {
      // Since we can't easily create a proper React.MouseEvent,
      // we'll use a simple object with the properties we need
      const eventData = {
        clientX: 0,
        clientY: 0,
        preventDefault: () => {},
        stopPropagation: () => {},
        zoomLevel: newZoomLevel,
        panOffset: newPanOffset
      };
      
      // Pass our custom event-like object to the handler
      onPanMove(eventData as unknown as React.MouseEvent);
    }
  };
  
  // Reset room positions handler
  const handleResetRoomPositions = () => {
    // This would reload room positions from their original detection
    if (detectedRooms.length > 0) {
      onApplyDetections();
    }
  };
  
  // Handle mousedown for pan or measurement
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPanMode && !isMeasurementToolActive) {
      setIsDragging(true);
      onPanStart(e);
    } else if (isMeasurementToolActive) {
      handleMeasurementStart(e);
    }
  };
  
  // Handle mousemove for pan or measurement
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanMode && isDragging && !isMeasurementToolActive) {
      onPanMove(e);
    } else if (isMeasurementToolActive && measurementState.active) {
      handleMeasurementMove(e);
    }
  };
  
  // Handle mouseup for pan or measurement
  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanMode && isDragging && !isMeasurementToolActive) {
      setIsDragging(false);
      onPanEnd();
    } else if (isMeasurementToolActive) {
      handleMeasurementEnd(e);
    }
  };
  
  // Draw grid lines
  const renderGridLines = () => {
    if (!showGridLines) return null;
    
    const gridSize = 50 * zoomLevel; // 50px grid at 1x zoom
    const gridLines = [];
    
    // Calculate visible area
    const visibleAreaWidth = containerSize.width / zoomLevel;
    const visibleAreaHeight = containerSize.height / zoomLevel;
    
    // Calculate grid extents including panning
    const startX = Math.floor(-panOffset.x / gridSize) * gridSize;
    const startY = Math.floor(-panOffset.y / gridSize) * gridSize;
    const endX = startX + visibleAreaWidth + gridSize * 2;
    const endY = startY + visibleAreaHeight + gridSize * 2;
    
    // Vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      gridLines.push(
        <line 
          key={`v-${x}`} 
          x1={x} 
          y1={startY} 
          x2={x} 
          y2={endY}
          stroke="rgba(0, 0, 0, 0.1)"
          strokeWidth={1 / zoomLevel}
        />
      );
    }
    
    // Horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      gridLines.push(
        <line 
          key={`h-${y}`} 
          x1={startX} 
          y1={y} 
          x2={endX} 
          y2={y}
          stroke="rgba(0, 0, 0, 0.1)"
          strokeWidth={1 / zoomLevel}
        />
      );
    }
    
    return (
      <svg 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          pointerEvents: 'none' 
        }}
      >
        <g 
          transform={`scale(${zoomLevel}) translate(${panOffset.x}, ${panOffset.y})`}
        >
          {gridLines}
        </g>
      </svg>
    );
  };
  
  // Draw measurements
  const renderMeasurements = () => {
    if (!isMeasurementToolActive) return null;
    
    const allMeasurements = [...measurementState.measurements];
    
    // Add current active measurement if it exists
    if (measurementState.active && measurementState.start && measurementState.end) {
      const activeMeasurement = {
        id: 'active-measurement',
        start: measurementState.start,
        end: measurementState.end,
        distance: Math.sqrt(
          Math.pow(measurementState.end.x - measurementState.start.x, 2) + 
          Math.pow(measurementState.end.y - measurementState.start.y, 2)
        ),
        realDistance: 0,
        label: 'Measuring...'
      };
      
      allMeasurements.push(activeMeasurement);
    }
    
    return (
      <svg 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          pointerEvents: 'none' 
        }}
      >
        <g transform={`scale(${zoomLevel}) translate(${panOffset.x}, ${panOffset.y})`}>
          {allMeasurements.map((measurement) => {
            const { id, start, end, label } = measurement;
            const isActive = id === 'active-measurement';
            
            // Calculate midpoint for label
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;
            
            // Calculate angle for label rotation
            const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
            
            return (
              <g key={id}>
                {/* Line */}
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={isActive ? "#2196f3" : "#4caf50"}
                  strokeWidth={2 / zoomLevel}
                  strokeDasharray={isActive ? "5,5" : "none"}
                />
                
                {/* Start point */}
                <circle
                  cx={start.x}
                  cy={start.y}
                  r={4 / zoomLevel}
                  fill={isActive ? "#2196f3" : "#4caf50"}
                />
                
                {/* End point */}
                <circle
                  cx={end.x}
                  cy={end.y}
                  r={4 / zoomLevel}
                  fill={isActive ? "#2196f3" : "#4caf50"}
                />
                
                {/* Measurement label */}
                <g transform={`translate(${midX}, ${midY}) rotate(${angle}) translate(0, ${-10 / zoomLevel})`}>
                  <rect
                    x={-20 / zoomLevel}
                    y={-10 / zoomLevel}
                    width={40 / zoomLevel}
                    height={20 / zoomLevel}
                    fill="white"
                    fillOpacity="0.8"
                    rx={4 / zoomLevel}
                    ry={4 / zoomLevel}
                  />
                  <text
                    x="0"
                    y={5 / zoomLevel}
                    fontSize={12 / zoomLevel}
                    textAnchor="middle"
                    fill="black"
                  >
                    {label}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    );
  };
  
  // Room styling based on view mode and compliance
  const getRoomClasses = (room: RoomDetail) => {
    const isSelected = room.id === (selectedRoom?.id ?? '');
    let classes = 'room-box';
    
    if (isSelected) {
      classes += ' selected';
    }
    
    // Calculate compliance class if viewing lighting
    if (viewMode === 'lighting') {
      const compliance = room.compliance || 0;
      
      if (compliance >= 90) {
        classes += ' lighting-good';
      } else if (compliance >= 70) {
        classes += ' lighting-acceptable';
      } else {
        classes += ' lighting-poor';
      }
    } else {
      classes += ' power';
    }
    
    return classes;
  };
  
  // Render room resize handles
  const renderRoomHandles = (room: RoomDetail) => {
    if (!isEditMode || room.id !== (selectedRoom?.id ?? '')) return null;
    
    const { x, y, width, height } = room.coords;
    
    // Handle positions (8 handles for more precise control)
    const handles = [
      { position: 'nw', x, y },                       // Northwest
      { position: 'n', x: x + width / 2, y },          // North
      { position: 'ne', x: x + width, y },             // Northeast
      { position: 'e', x: x + width, y: y + height / 2 }, // East
      { position: 'se', x: x + width, y: y + height }, // Southeast
      { position: 's', x: x + width / 2, y: y + height }, // South
      { position: 'sw', x, y: y + height },            // Southwest
      { position: 'w', x, y: y + height / 2 }          // West
    ];
    
    return handles.map(handle => (
      <div
        key={`handle-${room.id}-${handle.position}`}
        className={`resize-handle ${handle.position}`}
        style={{
          left: `${handle.x * zoomLevel}px`,
          top: `${handle.y * zoomLevel}px`,
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault(); // Prevent text selection during drag
          onHotspotDragStart(room.id, handle.position, e);
        }}
      />
    ));
  };
  
  // Render detected rooms (from detection algorithm)
  const renderDetectedRooms = () => {
    if (detectedRooms.length === 0) return null;
    
    return (
      <React.Fragment>
        {detectedRooms.map(room => (
          <div
            key={`detected-${room.id}`}
            data-id={room.id}
            className="detected-room"
            style={{
            left: `${room.x * zoomLevel}px`,
            top: `${room.y * zoomLevel}px`,
            width: `${room.width * zoomLevel}px`,
            height: `${room.height * zoomLevel}px`,
            cursor: isPanMode ? 'grab' : 'pointer',
            }}
              onClick={(e) => {
                e.stopPropagation();
                onRoomClick(room.id);
              }}
              onMouseDown={(e) => {
                if (!isEditMode) return;
                e.stopPropagation();
                onRoomDragStart(room.id, e);
              }}
              onContextMenu={(e) => {
                if (!isEditMode) return;
                e.preventDefault();
                e.stopPropagation();
                onEditMenuOpen(room.id);
              }}
            >
              {showLabels && (
              <div className="room-label" style={{ fontSize: `${Math.max(12, 14 * zoomLevel)}px` }}>
                  {room.name || 'Detected Room'}
                </div>
              )}
          </div>
        ))}
      </React.Fragment>
    );
  };
  
  return (
    <Box 
      ref={containerRef}
      sx={{ 
        width: '100%', 
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
      className={`floorplan-container ${viewOrientation}-container`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Loading overlay */}
      {isProcessingImage && (
        <Box
          sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 50,
          }}
        >
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Processing floor plan...
            </Typography>
        </Box>
      )}
      
      {/* Only show debug overlay in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-overlay">
          <div>Image Path: {floorPlanImage ? floorPlanImage.split('/').pop() : 'None'}</div>
          <div>Loaded: {imageLoaded ? 'Yes' : 'No'}</div>
          <div>Size: {imageSize.width}x{imageSize.height}</div>
          <div>Zoom: {zoomLevel.toFixed(2)}</div>
          {imageError && <div style={{ color: 'red' }}>{imageError}</div>}
        </div>
      )}
      
      {/* Floor plan image with pan and zoom */}
      <div
        className="floorplan-image"
        style={{
          backgroundImage: floorPlanImage ? `url(${floorPlanImage})` : 'none',
        transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
        transformOrigin: '0 0',
        }}
      >
        {/* Render grid lines if enabled */}
        {showGridLines && renderGridLines()}
      
        {/* Render measurements if active */}
        {isMeasurementToolActive && renderMeasurements()}
        
        {/* Render detected rooms */}
        {renderDetectedRooms()}
        
        {/* Render existing rooms */}
        {roomData.map(room => (
          <div
            key={room.id}
            data-id={room.id}
            data-testid={`room-${room.id}`}
            className={getRoomClasses(room)}
            style={{
              left: `${room.coords.x * zoomLevel}px`,
              top: `${room.coords.y * zoomLevel}px`,
              width: `${room.coords.width * zoomLevel}px`,
              height: `${room.coords.height * zoomLevel}px`,
              cursor: isEditMode ? 'move' : 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onRoomClick(room.id);
            }}
            onMouseDown={(e) => {
              if (!isEditMode) return;
              e.stopPropagation();
              onRoomDragStart(room.id, e);
            }}
            onContextMenu={(e) => {
              if (!isEditMode) return;
              e.preventDefault();
              e.stopPropagation();
              onEditMenuOpen(room.id);
            }}
          >
            {/* Room label */}
            {showLabels && (
              <div className="room-label" style={{ fontSize: `${Math.max(10, 12 * zoomLevel)}px` }}>
                {room.name}
              </div>
            )}
            
            {/* Render hotspot handles for room editing */}
            {renderRoomHandles(room)}
          </div>
        ))}
      </div>
      
      {/* Show detected rooms controls */}
      {detectedRooms.length > 0 && (
        <Box
          sx={{
        position: 'absolute', 
        bottom: 16, 
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 3,
            p: 1
          }}
        >
          <Chip 
            label={`${detectedRooms.length} rooms detected (${Math.round(detectionConfidence * 100)}% confidence)`}
            color="primary"
            sx={{ mr: 2 }}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<Check />}
            onClick={onApplyDetections}
          >
            Apply Detection
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<Close />}
            onClick={() => null /* TODO: Implement reset */}
            sx={{ ml: 1 }}
          >
            Cancel
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default FloorPlanVisualization; 