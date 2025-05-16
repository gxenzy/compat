import { NonCompliantArea, RoomDetail, DetectedRoom, LoadSchedule, LoadItem } from '../interfaces/buildingInterfaces';

/**
 * Type guard for NonCompliantArea
 */
export function isNonCompliantArea(object: any): object is NonCompliantArea {
  return (
    typeof object === 'object' &&
    object !== null &&
    'id' in object &&
    'type' in object &&
    'x' in object &&
    'y' in object &&
    'width' in object &&
    'height' in object &&
    'compliance' in object &&
    'severity' in object
  );
}

/**
 * Type guard for RoomDetail
 */
export function isRoomDetail(object: any): object is RoomDetail {
  return (
    typeof object === 'object' &&
    object !== null &&
    'id' in object &&
    'name' in object &&
    'coords' in object &&
    'roomType' in object
  );
}

/**
 * Type guard for DetectedRoom
 */
export function isDetectedRoom(object: any): object is DetectedRoom {
  return (
    typeof object === 'object' &&
    object !== null &&
    'id' in object &&
    'x' in object &&
    'y' in object &&
    'width' in object &&
    'height' in object
  );
}

/**
 * Type checker and resolver for NonCompliantArea
 * This function ensures all necessary properties exist on the object
 */
export function ensureNonCompliantArea(area: Partial<NonCompliantArea>): NonCompliantArea {
  // Create a complete NonCompliantArea object with default values for any missing properties
  return {
    id: area.id || `area-${Date.now()}`,
    type: area.type || 'lighting',
    x: area.x || 0,
    y: area.y || 0,
    width: area.width || 100,
    height: area.height || 80,
    title: area.title || 'Unknown Area',
    description: area.description || 'No description available',
    compliance: area.compliance || 0,
    recommendations: area.recommendations || [],
    severity: area.severity || 'medium',
    issueType: area.issueType || 'general'
  };
}

/**
 * Make sure an area object conforms to the NonCompliantArea interface
 */
export function createNonCompliantArea(data: Record<string, any>): NonCompliantArea {
  const area: NonCompliantArea = {
    id: data.id || `area-${Date.now()}`,
    type: (data.type as 'lighting' | 'power') || 'lighting',
    x: typeof data.x === 'number' ? data.x : 0,
    y: typeof data.y === 'number' ? data.y : 0,
    width: typeof data.width === 'number' ? data.width : 100,
    height: typeof data.height === 'number' ? data.height : 80,
    title: typeof data.title === 'string' ? data.title : 'Unknown Area',
    description: typeof data.description === 'string' ? data.description : 'No description available',
    compliance: typeof data.compliance === 'number' ? data.compliance : 0,
    recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
    severity: (data.severity as 'low' | 'medium' | 'high') || 'medium',
    issueType: typeof data.issueType === 'string' ? data.issueType : 'general'
  };
  return area;
}

/**
 * Convert DetectedRoom to RoomDetail
 */
export function detectedRoomToRoomDetail(room: DetectedRoom): RoomDetail {
  return {
    id: room.id,
    name: room.name || `Room ${room.id.slice(-5)}`, // Provide default name if undefined
    length: room.width / 50, // Convert to meters
    width: room.height / 50, // Convert to meters
    height: 3, // Default value
    area: (room.width / 50) * (room.height / 50),
    roomType: room.type || 'default',
    coords: {
      x: room.x,
      y: room.y,
      width: room.width,
      height: room.height
    },
    reflectanceCeiling: 0.7,
    reflectanceWalls: 0.5,
    reflectanceFloor: 0.2,
    maintenanceFactor: 0.8,
    requiredLux: 300,
    recommendedFixtures: Math.ceil((room.width * room.height) / 10000),
    actualFixtures: Math.ceil((room.width * room.height) / 10000),
    compliance: 100,
    shape: 'rect'
  };
} 