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
  Add
} from '@mui/icons-material';
import { RoomDetail, DetectedRoom, NonCompliantArea, Point } from '../interfaces/buildingInterfaces';
import { MeasurementState, Measurement } from '../utils/measurementTool';

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
  handleMeasurementEnd
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
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
  
  // Handle image load to get dimensions and fit to view
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    
    setImageSize({ 
      width: imgWidth, 
      height: imgHeight 
    });
    
    // Auto-fit image to view on initial load
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      // Calculate the best fit zoom level
      const widthRatio = containerWidth / imgWidth;
      const heightRatio = containerHeight / imgHeight;
      const bestFitZoom = Math.min(widthRatio, heightRatio) * 0.9; // 90% to add margin
      
      // Only auto-fit if the image is larger than the container
      if (imgWidth > containerWidth || imgHeight > containerHeight) {
        // Create custom event to trigger fit to view
        setTimeout(() => handleFitToView(), 100);
      }
    }
  };
  
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
  
  // Render room resize handles
  const renderRoomHandles = (room: RoomDetail) => {
    if (!isEditMode || room.id !== (selectedRoom?.id ?? '')) return null;
    
    const { x, y, width, height } = room.coords;
    
    // Handle positions
    const handles = [
      { position: 'nw', x, y },
      { position: 'ne', x: x + width, y },
      { position: 'sw', x, y: y + height },
      { position: 'se', x: x + width, y: y + height }
    ];
    
    return handles.map(handle => (
      <div
        key={`handle-${room.id}-${handle.position}`}
        style={{
          position: 'absolute',
          width: '12px',
          height: '12px',
          backgroundColor: 'white',
          border: '2px solid #1976d2',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          cursor: handle.position === 'nw' || handle.position === 'se' ? 'nwse-resize' : 'nesw-resize',
          left: `${handle.x * zoomLevel}px`,
          top: `${handle.y * zoomLevel}px`,
          zIndex: 100
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onHotspotDragStart(room.id, handle.position, e);
        }}
      />
    ));
  };
  
  // Room styling based on view mode and compliance
  const getRoomStyle = (room: RoomDetail) => {
    const isSelected = room.id === (selectedRoom?.id ?? '');
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${room.coords.x * zoomLevel}px`,
      top: `${room.coords.y * zoomLevel}px`,
      width: `${room.coords.width * zoomLevel}px`,
      height: `${room.coords.height * zoomLevel}px`,
      borderRadius: '4px',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: isEditMode ? 'move' : 'pointer',
      transition: 'background-color 0.2s, border 0.2s',
      zIndex: isSelected ? 10 : 1
    };
    
    // Calculate compliance color if viewing lighting
    if (viewMode === 'lighting') {
      const compliance = room.compliance || 0;
      
      if (compliance >= 90) {
        // Good compliance - green
        return {
          ...baseStyle,
          backgroundColor: isSelected ? 'rgba(76, 175, 80, 0.5)' : 'rgba(76, 175, 80, 0.2)',
          border: isSelected ? '2px solid #2e7d32' : '1px solid #81c784'
        };
      } else if (compliance >= 70) {
        // Acceptable compliance - yellow
        return {
          ...baseStyle,
          backgroundColor: isSelected ? 'rgba(255, 235, 59, 0.5)' : 'rgba(255, 235, 59, 0.2)',
          border: isSelected ? '2px solid #f9a825' : '1px solid #fdd835'
        };
      } else {
        // Poor compliance - red
        return {
          ...baseStyle,
          backgroundColor: isSelected ? 'rgba(244, 67, 54, 0.5)' : 'rgba(244, 67, 54, 0.2)',
          border: isSelected ? '2px solid #c62828' : '1px solid #e57373'
        };
      }
    } else {
      // Power view - use blue hues
      return {
        ...baseStyle,
        backgroundColor: isSelected ? 'rgba(33, 150, 243, 0.5)' : 'rgba(33, 150, 243, 0.2)',
        border: isSelected ? '2px solid #1565c0' : '1px solid #64b5f6'
      };
    }
  };
  
  // Render detected rooms (from detection algorithm)
  const renderDetectedRooms = () => {
    if (detectedRooms.length === 0) return null;
    
    return (
      <React.Fragment>
        {/* Render detected rooms with the same style as normal rooms but with indication they're detected */}
        {detectedRooms.map(room => {
          // Determine if this room has polygon points
          const hasPolygon = room.points && room.points.length > 0;
          
          // Base style for all detected rooms
          const baseStyle: React.CSSProperties = {
            position: 'absolute',
            left: `${room.x * zoomLevel}px`,
            top: `${room.y * zoomLevel}px`,
            width: `${room.width * zoomLevel}px`,
            height: `${room.height * zoomLevel}px`,
            borderRadius: '4px',
            boxSizing: 'border-box',
            cursor: isPanMode ? 'grab' : 'pointer',
            zIndex: 5, // Higher than regular rooms to show on top
            // Semi-transparent blue for detected rooms
            backgroundColor: 'rgba(33, 150, 243, 0.2)',
            // Dashed border to indicate it's a detected room
            border: '2px dashed #2196f3',
            // Add a subtle animation to highlight these are detected rooms
            animation: 'pulse 2s infinite alternate'
          };
          
          return (
            <div
              key={`detected-${room.id}`}
              data-id={room.id}
              style={baseStyle}
              onClick={(e) => {
                e.stopPropagation();
                // Make detected rooms clickable like regular rooms
                onRoomClick(room.id);
              }}
              onMouseDown={(e) => {
                if (!isEditMode) return;
                e.stopPropagation();
                // Make detected rooms draggable like regular rooms
                onRoomDragStart(room.id, e);
              }}
              onContextMenu={(e) => {
                // Add right-click menu support
                if (!isEditMode) return;
                e.preventDefault();
                e.stopPropagation();
                onEditMenuOpen(room.id);
              }}
            >
              {/* Room label if labels are enabled */}
              {showLabels && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: `${Math.max(12, 14 * zoomLevel)}px`,
                    fontWeight: 'bold',
                    color: '#1976d2',
                    textShadow: '0 0 4px white',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    textAlign: 'center'
                  }}
                >
                  {room.name || 'Detected Room'}
                </div>
              )}
              
              {/* Hotspot handles for resizing (only in edit mode) */}
              {isEditMode && (
                <>
                  {/* Northwest handle */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '-5px',
                      left: '-5px',
                      width: '10px',
                      height: '10px',
                      backgroundColor: '#1976d2',
                      border: '1px solid white',
                      borderRadius: '50%',
                      cursor: 'nwse-resize',
                      zIndex: 2
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onHotspotDragStart(room.id, 'nw', e);
                    }}
                  />
                  {/* Northeast handle */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      width: '10px',
                      height: '10px',
                      backgroundColor: '#1976d2',
                      border: '1px solid white',
                      borderRadius: '50%',
                      cursor: 'nesw-resize',
                      zIndex: 2
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onHotspotDragStart(room.id, 'ne', e);
                    }}
                  />
                  {/* Southwest handle */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-5px',
                      left: '-5px',
                      width: '10px',
                      height: '10px',
                      backgroundColor: '#1976d2',
                      border: '1px solid white',
                      borderRadius: '50%',
                      cursor: 'nesw-resize',
                      zIndex: 2
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onHotspotDragStart(room.id, 'sw', e);
                    }}
                  />
                  {/* Southeast handle */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-5px',
                      right: '-5px',
                      width: '10px',
                      height: '10px',
                      backgroundColor: '#1976d2',
                      border: '1px solid white',
                      borderRadius: '50%',
                      cursor: 'nwse-resize',
                      zIndex: 2
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onHotspotDragStart(room.id, 'se', e);
                    }}
                  />
                </>
              )}
              
              {/* Optional polygon renderer for rooms with points */}
              {hasPolygon && (
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
                  <polygon
                    points={room.points?.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="rgba(33, 150, 243, 0.3)"
                    stroke="#2196f3"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                </svg>
              )}
            </div>
          );
        })}
        
        {/* Apply detected rooms button (when rooms are detected but not yet applied) */}
        {detectedRooms.length > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              zIndex: 100
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                onApplyDetections();
              }}
              startIcon={<Add />}
            >
              Apply {detectedRooms.length} Detected Rooms
            </Button>
          </div>
        )}
      </React.Fragment>
    );
  };
  
  return (
    <Box 
      ref={containerRef}
      sx={{ 
        position: 'relative', 
        overflow: 'hidden', 
        width: '100%', 
        height: '100%',
        backgroundColor: '#f5f5f5',
        cursor: isPanMode 
          ? (isMeasurementToolActive ? 'crosshair' : 'grab') 
          : 'default'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Loading overlay */}
      {isProcessingImage && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 1000
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Processing Floor Plan...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Detecting rooms and structures
            </Typography>
          </Box>
        </Box>
      )}
      
      {/* Floor plan image */}
      <div style={{
        position: 'absolute',
        transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
        transformOrigin: '0 0',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <img 
          src={floorPlanImage} 
          alt="Floor Plan" 
          style={{ 
            display: 'block',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            width: 'auto',
            height: 'auto'
          }}
          onLoad={handleImageLoad}
        />
      </div>
      
      {/* Grid lines */}
      {renderGridLines()}
      
      {/* Interactive room elements */}
      <div style={{
        position: 'absolute',
        transform: `translate(${panOffset.x * zoomLevel}px, ${panOffset.y * zoomLevel}px)`,
        transformOrigin: '0 0'
      }}>
        {/* Render regular rooms */}
        {roomData.map((room) => (
          <div
            key={room.id}
            data-id={room.id}
            style={getRoomStyle(room)}
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
              e.preventDefault();
              onEditMenuOpen(room.id);
            }}
          >
            {showLabels && (
              <Typography
                variant="body2"
                sx={{
                  fontSize: `${14 / zoomLevel}px`,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  maxWidth: '90%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {room.name}
              </Typography>
            )}
            
            {/* Room resize handles */}
            {renderRoomHandles(room)}
          </div>
        ))}
      </div>
      
      {/* Detected rooms overlay */}
      <div style={{
        position: 'absolute',
        transform: `translate(${panOffset.x * zoomLevel}px, ${panOffset.y * zoomLevel}px)`,
        transformOrigin: '0 0'
      }}>
        {renderDetectedRooms()}
      </div>
      
      {/* Measurements */}
      {renderMeasurements()}
      
      {/* Control buttons */}
      <Paper sx={{ 
        position: 'absolute', 
        bottom: 16, 
        right: 16, 
        p: 1,
        zIndex: 100
      }}>
        <ButtonGroup orientation="vertical" variant="outlined" size="small">
          <Tooltip title="Fit to view">
            <IconButton onClick={handleFitToView}>
              <CropFree />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset room positions">
            <span>
              <IconButton 
                onClick={handleResetRoomPositions}
                disabled={detectedRooms.length === 0 && roomData.length === 0}
              >
                <RestartAlt />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={isMeasurementToolActive ? "Using measurement tool" : "Pan mode"}>
            <IconButton color={isMeasurementToolActive ? "primary" : "default"}>
              {isMeasurementToolActive ? <Straighten /> : <ZoomIn />}
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </Paper>
    </Box>
  );
};

export default FloorPlanVisualization; 