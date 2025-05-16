import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  RoomDetail, 
  DetectedRoom, 
  BuildingData, 
  FloorData,
  NonCompliantArea,
  Point,
  LoadSchedule
} from '../interfaces/buildingInterfaces';
import { DetectedRoom as DetectedRoomInterface } from '../interfaces';
import { buildingDataService } from '../services/buildingDataService';
import { calculateBuildingEnergyMetrics } from '../utils/energyCalculations';
import { detectRoomsFromImage } from '../utils/cnnDetection';
import { modelTrainingService } from '../services/modelTrainingService';

interface BuildingContextProps {
  buildingData: BuildingData;
  isLoading: boolean;
  error: string | null;
  selectedFloor: string;
  activeRoomId: string | null;
  setSelectedFloor: (floorKey: string) => void;
  setActiveRoomId: (roomId: string | null) => void;
  addRoom: (floorKey: string, room: RoomDetail) => Promise<boolean>;
  updateRoom: (floorKey: string, roomId: string, roomData: Partial<RoomDetail>) => Promise<boolean>;
  deleteRoom: (floorKey: string, roomId: string) => Promise<boolean>;
  getRoomById: (floorKey: string, roomId: string) => RoomDetail | undefined;
  getFloorRooms: (floorKey: string) => RoomDetail[];
  getEnergyMetrics: (floorKey: string) => ReturnType<typeof calculateBuildingEnergyMetrics>;
  runRoomDetection: (imageSrc: string, containerWidth: number, containerHeight: number) => Promise<DetectedRoomInterface[]>;
  applyDetectedRooms: (floorKey: string, detectedRooms: DetectedRoom[]) => Promise<boolean>;
  updateRoomCoordinates: (floorKey: string, roomId: string, coords: { x: number; y: number; width?: number; height?: number }) => Promise<boolean>;
  saveBuildingData: () => Promise<boolean>;
  refresh: () => Promise<void>;
  rooms: RoomDetail[];
  setRooms: (rooms: RoomDetail[]) => void;
  selectedRoom: RoomDetail | null;
  setSelectedRoom: (room: RoomDetail | null) => void;
}

const BuildingContext = createContext<BuildingContextProps | undefined>(undefined);

export const useBuildingContext = () => {
  const context = useContext(BuildingContext);
  if (!context) {
    throw new Error('useBuildingContext must be used within a BuildingProvider');
  }
  return context;
};

interface BuildingProviderProps {
  children: ReactNode;
}

export const BuildingProvider: React.FC<BuildingProviderProps> = ({ children }) => {
  const [buildingData, setBuildingData] = useState<BuildingData>({
    name: '',
    floors: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string>('ground');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  // Load building data on mount
  useEffect(() => {
    loadBuildingData();
  }, []);

  const loadBuildingData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await buildingDataService.fetchBuildingData();
      setBuildingData(data as any);
      
      // Set default selected floor if none is set or the current one doesn't exist
      if (!selectedFloor || !data.floors[selectedFloor]) {
        const firstFloorKey = Object.keys(data.floors)[0];
        if (firstFloorKey) {
          setSelectedFloor(firstFloorKey);
        }
      }
    } catch (err) {
      setError('Failed to load building data');
      console.error('Error loading building data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addRoom = async (floorKey: string, room: RoomDetail): Promise<boolean> => {
    try {
      // Add room to local state
      setBuildingData(prevData => {
        if (!prevData.floors[floorKey]) return prevData;

        const updatedFloors = {
          ...prevData.floors,
          [floorKey]: {
            ...prevData.floors[floorKey],
            rooms: [...prevData.floors[floorKey].rooms, room]
          }
        };

        return {
          ...prevData,
          floors: updatedFloors
        };
      });

      // Save to API
      const success = await buildingDataService.addRoom(floorKey, room as any);
      if (!success) {
        // Revert changes if API call fails
        await loadBuildingData();
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error adding room:', err);
      return false;
    }
  };

  const updateRoom = async (floorKey: string, roomId: string, roomData: Partial<RoomDetail>): Promise<boolean> => {
    try {
      // Update room in local state
      setBuildingData(prevData => {
        if (!prevData.floors[floorKey]) return prevData;

        const updatedRooms = prevData.floors[floorKey].rooms.map(room => 
          room.id === roomId ? { ...room, ...roomData } : room
        );

        return {
          ...prevData,
          floors: {
            ...prevData.floors,
            [floorKey]: {
              ...prevData.floors[floorKey],
              rooms: updatedRooms
            }
          }
        };
      });

      // Save to API
      const success = await buildingDataService.updateRoom(floorKey, roomId, roomData);
      if (!success) {
        // Revert changes if API call fails
        await loadBuildingData();
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error updating room:', err);
      return false;
    }
  };

  const deleteRoom = async (floorKey: string, roomId: string): Promise<boolean> => {
    try {
      // Remove room from local state
      setBuildingData(prevData => {
        if (!prevData.floors[floorKey]) return prevData;

        const updatedRooms = prevData.floors[floorKey].rooms.filter(room => room.id !== roomId);

        return {
          ...prevData,
          floors: {
            ...prevData.floors,
            [floorKey]: {
              ...prevData.floors[floorKey],
              rooms: updatedRooms
            }
          }
        };
      });

      // If the deleted room was the active room, clear the active room
      if (activeRoomId === roomId) {
        setActiveRoomId(null);
      }

      // Save to API
      const success = await buildingDataService.deleteRoom(floorKey, roomId);
      if (!success) {
        // Revert changes if API call fails
        await loadBuildingData();
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error deleting room:', err);
      return false;
    }
  };

  const getRoomById = (floorKey: string, roomId: string): RoomDetail | undefined => {
    if (!buildingData.floors[floorKey]) return undefined;
    return buildingData.floors[floorKey].rooms.find(room => room.id === roomId);
  };

  const getFloorRooms = (floorKey: string): RoomDetail[] => {
    if (!buildingData.floors[floorKey]) return [];
    return buildingData.floors[floorKey].rooms;
  };

  const getEnergyMetrics = (floorKey: string) => {
    const rooms = getFloorRooms(floorKey);
    return calculateBuildingEnergyMetrics(rooms as any);
  };

  const runRoomDetection = async (
    imageSrc: string, 
    containerWidth: number, 
    containerHeight: number
  ): Promise<DetectedRoomInterface[]> => {
    try {
      // Run detection
      const result = await detectRoomsFromImage(imageSrc, containerWidth, containerHeight);
      
      // Return detected rooms
      return result.rooms as DetectedRoomInterface[];
    } catch (err) {
      console.error('Error detecting rooms:', err);
      return [];
    }
  };

  const applyDetectedRooms = async (floorKey: string, detectedRooms: DetectedRoom[]): Promise<boolean> => {
    try {
      // Convert detected rooms to RoomDetail objects
      const newRooms = buildingDataService.convertDetectedRoomsToDetails(detectedRooms as any);
      
      // Add to training data if user has opted in
      if (modelTrainingService.isContributingEnabled()) {
        // Get container dimensions (approximate from window if not available)
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight * 0.7; // Rough estimate of visualization area
        
        // Get current context for floor plan image
        // We'll use a placeholder image URL if we can't get the actual one
        // In a real implementation, this would come from the buildingDataService
        const imageUrl = `/floorplan/${floorKey}.jpg`;
        
        // Add to training data
        modelTrainingService.addUserCorrections(
          floorKey,
          imageUrl,
          detectedRooms as any,
          newRooms,
          containerWidth,
          containerHeight
        );
      }
      
      // Add rooms to local state
      setBuildingData((prevData: any) => {
        if (!prevData.floors[floorKey]) return prevData;

        const updatedRooms = [...prevData.floors[floorKey].rooms, ...newRooms];
        
        return {
          ...prevData,
          floors: {
            ...prevData.floors,
            [floorKey]: {
              ...prevData.floors[floorKey],
              rooms: updatedRooms
            }
          }
        };
      });

      // Save to API
      return await saveBuildingData();
    } catch (err) {
      console.error('Error applying detected rooms:', err);
      return false;
    }
  };

  const updateRoomCoordinates = async (
    floorKey: string, 
    roomId: string, 
    coords: { x: number; y: number; width?: number; height?: number }
  ): Promise<boolean> => {
    const room = getRoomById(floorKey, roomId);
    if (!room) return false;
    
    // Ensure all required properties are present
    const updatedCoords = { 
      x: coords.x,
      y: coords.y,
      // Use existing values for width and height if not provided
      width: coords.width !== undefined ? coords.width : room.coords.width,
      height: coords.height !== undefined ? coords.height : room.coords.height
    };
    
    return updateRoom(floorKey, roomId, { coords: updatedCoords });
  };

  const saveBuildingData = async (): Promise<boolean> => {
    try {
      return await buildingDataService.saveBuildingData(buildingData as any);
    } catch (err) {
      console.error('Error saving building data:', err);
      return false;
    }
  };

  const refresh = async (): Promise<void> => {
    await loadBuildingData();
  };

  const value: BuildingContextProps = {
    buildingData,
    isLoading,
    error,
    selectedFloor,
    activeRoomId,
    setSelectedFloor,
    setActiveRoomId,
    addRoom,
    updateRoom,
    deleteRoom,
    getRoomById,
    getFloorRooms,
    getEnergyMetrics,
    runRoomDetection,
    applyDetectedRooms,
    updateRoomCoordinates,
    saveBuildingData,
    refresh,
    rooms: getFloorRooms(selectedFloor),
    setRooms: (rooms: RoomDetail[]) => {
      // Update rooms for the current floor
      setBuildingData(prevData => {
        if (!prevData.floors[selectedFloor]) return prevData;
        
        return {
          ...prevData,
          floors: {
            ...prevData.floors,
            [selectedFloor]: {
              ...prevData.floors[selectedFloor],
              rooms: rooms
            }
          }
        };
      });
    },
    selectedRoom: activeRoomId ? getRoomById(selectedFloor, activeRoomId) || null : null,
    setSelectedRoom: (room: RoomDetail | null) => {
      // Set the active room ID based on the selected room
      setActiveRoomId(room ? room.id : null);
    }
  };

  return (
    <BuildingContext.Provider value={value}>
      {children}
    </BuildingContext.Provider>
  );
};

export default BuildingContext; 