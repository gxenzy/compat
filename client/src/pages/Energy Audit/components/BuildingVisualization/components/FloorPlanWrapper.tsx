import React from 'react';
import FloorPlanVisualization from './FloorPlanVisualization';
import { RoomDetail, DetectedRoom, NonCompliantArea, Point } from '../interfaces/buildingInterfaces';

interface FloorPlanWrapperProps {
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
  selectedRoom: RoomDetail | null;
  onRoomClick: (roomId: string) => void;
  onSelectRoom: (room: RoomDetail) => void;
  onApplyDetections: () => void;
  onRoomDragStart: (roomId: string, e: React.MouseEvent) => void;
  onRoomDragMove: (e: React.MouseEvent) => void;
  onRoomDragEnd: () => void;
  onEditMenuOpen: (roomId: string) => void;
  onHotspotDragStart: (hotspotId: string, position: string, e: React.MouseEvent) => void;
  onHotspotDragMove: (e: React.MouseEvent) => void;
  onHotspotDragEnd: () => void;
  onDelete: (roomId: string) => void;
  onPanStart: (e: React.MouseEvent) => void;
  onPanMove: (e: React.MouseEvent) => void;
  onPanEnd: () => void;
  isMeasurementToolActive: boolean;
  measurementState: any;
  handleMeasurementStart: (e: React.MouseEvent) => void;
  handleMeasurementMove: (e: React.MouseEvent) => void;
  handleMeasurementEnd: (e: React.MouseEvent) => void;
  viewOrientation: 'landscape' | 'portrait';
}

/**
 * FloorPlanWrapper Component
 * 
 * This component wraps the actual FloorPlanVisualization component to handle type conversions
 * between different interface implementations and avoid type errors.
 */
const FloorPlanWrapper: React.FC<FloorPlanWrapperProps> = (props) => {
  console.log('FloorPlanWrapper rendering with image:', props.floorPlanImage);
  console.log('FloorPlanWrapper view orientation:', props.viewOrientation);
  
  return (
    <FloorPlanVisualization
      floorPlanImage={props.floorPlanImage}
      roomData={props.roomData}
      detectedRooms={props.detectedRooms}
      nonCompliantAreas={props.nonCompliantAreas}
      isProcessingImage={props.isProcessingImage}
      showGridLines={props.showGridLines}
      showLabels={props.showLabels}
      zoomLevel={props.zoomLevel}
      panOffset={props.panOffset}
      isPanMode={props.isPanMode}
      onPanStart={props.onPanStart}
      onPanMove={props.onPanMove}
      onPanEnd={props.onPanEnd}
      detectionConfidence={props.detectionConfidence}
      viewMode={props.viewMode}
      isEditMode={props.isEditMode}
      onApplyDetections={props.onApplyDetections}
      onRoomClick={props.onRoomClick}
      onRoomDragStart={props.onRoomDragStart}
      onRoomDragMove={props.onRoomDragMove}
      onRoomDragEnd={props.onRoomDragEnd}
      onEditMenuOpen={props.onEditMenuOpen}
      onHotspotDragStart={props.onHotspotDragStart}
      onHotspotDragMove={props.onHotspotDragMove}
      onHotspotDragEnd={props.onHotspotDragEnd}
      onDelete={props.onDelete}
      selectedRoom={props.selectedRoom}
      onSelectRoom={props.onSelectRoom}
      isMeasurementToolActive={props.isMeasurementToolActive}
      measurementState={props.measurementState}
      handleMeasurementStart={props.handleMeasurementStart}
      handleMeasurementMove={props.handleMeasurementMove}
      handleMeasurementEnd={props.handleMeasurementEnd}
      viewOrientation={props.viewOrientation}
    />
  );
};

export default FloorPlanWrapper; 