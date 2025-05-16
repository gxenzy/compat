import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { RoomDetail, DetectedRoom, NonCompliantArea, Point } from '../interfaces/buildingInterfaces';

interface SimplifiedFloorPlanImplProps {
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
  onApplyDetections: () => void;
  selectedRoomId: string | null;
}

/**
 * A simplified version of FloorPlanVisualization without complex interface requirements
 */
const SimplifiedFloorPlanImpl: React.FC<SimplifiedFloorPlanImplProps> = ({
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
  onApplyDetections,
  selectedRoomId
}) => {
  // Get room color based on compliance or type
  const getRoomColor = (room: RoomDetail): string => {
    if (viewMode === 'lighting' && room.compliance !== undefined) {
      if (room.compliance >= 90) return 'rgba(76, 175, 80, 0.3)'; // Green
      if (room.compliance >= 70) return 'rgba(255, 152, 0, 0.3)'; // Orange
      return 'rgba(244, 67, 54, 0.3)'; // Red
    }
    
    // Default colors by room type
    const colors: Record<string, string> = {
      'office': 'rgba(66, 133, 244, 0.3)',
      'conference': 'rgba(219, 68, 55, 0.3)',
      'restroom': 'rgba(156, 39, 176, 0.3)',
      'kitchen': 'rgba(255, 152, 0, 0.3)',
      'storage': 'rgba(121, 85, 72, 0.3)',
      'hallway': 'rgba(96, 125, 139, 0.3)',
      'default': 'rgba(158, 158, 158, 0.3)'
    };
    
    return colors[room.roomType.toLowerCase()] || colors.default;
  };
  
  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Background image */}
      <img 
        src={floorPlanImage} 
        alt="Floor Plan"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          opacity: isProcessingImage ? 0.5 : 1,
          transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          transformOrigin: '0 0',
          transition: isPanMode ? 'none' : 'transform 0.2s ease'
        }}
      />
      
      {/* Rooms layer */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none'
        }}
      >
        {roomData.map(room => {
          const isSelected = selectedRoomId === room.id;
          
          return (
            <Box
              key={room.id}
              data-id={room.id}
              sx={{
                position: 'absolute',
                top: room.coords.y,
                left: room.coords.x,
                width: room.coords.width,
                height: room.coords.height,
                backgroundColor: getRoomColor(room),
                border: '2px solid',
                borderColor: isSelected ? 'primary.main' : 'rgba(0, 0, 0, 0.5)',
                borderRadius: '4px',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                pointerEvents: 'auto',
                cursor: isEditMode ? 'move' : 'pointer',
                boxShadow: isSelected ? '0 0 10px rgba(0,0,0,0.5)' : 'none',
                zIndex: isSelected ? 10 : 1
              }}
              onClick={() => onRoomClick(room.id)}
              onMouseDown={(e) => isEditMode && onRoomDragStart(room.id, e)}
              onContextMenu={(e) => {
                e.preventDefault();
                if (isEditMode) {
                  onEditMenuOpen(room.id);
                }
              }}
            >
              {showLabels && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(0,0,0,0.8)',
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    padding: '2px 6px',
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
              
              {showLabels && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.7rem',
                    color: 'rgba(0,0,0,0.7)',
                    backgroundColor: 'rgba(255,255,255,0.5)',
                    padding: '1px 4px',
                    borderRadius: '2px',
                    marginTop: '2px'
                  }}
                >
                  {room.area.toFixed(1)} m²
                </Typography>
              )}
            </Box>
          );
        })}
        
        {/* Detected rooms */}
        {detectedRooms.map(room => (
          <Box
            key={`detected-${room.id}`}
            sx={{
              position: 'absolute',
              left: room.x,
              top: room.y,
              width: room.width,
              height: room.height,
              border: '2px dashed',
              borderColor: 'primary.main',
              backgroundColor: 'rgba(33, 150, 243, 0.2)',
              zIndex: 5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { boxShadow: '0 0 0 0 rgba(33, 150, 243, 0.4)' },
                '70%': { boxShadow: '0 0 0 10px rgba(33, 150, 243, 0)' },
                '100%': { boxShadow: '0 0 0 0 rgba(33, 150, 243, 0)' }
              }
            }}
          >
            {showLabels && (
              <>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'white',
                    backgroundColor: 'rgba(33, 150, 243, 0.7)',
                    padding: '2px 4px',
                    borderRadius: '2px',
                    fontWeight: 'bold'
                  }}
                >
                  {room.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'white',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    fontSize: '0.7rem',
                    mt: 0.5
                  }}
                >
                  {Math.round((room.confidence || 0) * 100)}% confidence
                </Typography>
              </>
            )}
          </Box>
        ))}
        
        {/* Apply detected rooms button */}
        {detectedRooms.length > 0 && (
          <Button
            variant="contained"
            color="success"
            size="small"
            onClick={onApplyDetections}
            startIcon={<CheckCircle />}
            sx={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              zIndex: 10,
              boxShadow: 2
            }}
          >
            Apply {detectedRooms.length} Detected Rooms
          </Button>
        )}
        
        {/* Grid lines */}
        {showGridLines && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              pointerEvents: 'none',
              transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
              transformOrigin: '0 0',
              zIndex: 0
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default SimplifiedFloorPlanImpl; 