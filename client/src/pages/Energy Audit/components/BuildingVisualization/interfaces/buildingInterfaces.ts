/**
 * Building Visualization Interfaces
 * Defines all type interfaces used in the building visualization components
 */

/**
 * Point coordinates
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Room coordinates and dimensions
 */
export interface RoomCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Room detected by computer vision or neural networks
 */
export interface DetectedRoom {
  id: string;
  name: string;
  type?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
  points?: Point[];  // For polygon room support
  polygon?: Point[]; // For backward compatibility
  editable?: boolean; // Indicates if the room can be edited
  isDetected?: boolean; // Indicates if the room was detected automatically
  shape?: 'rect' | 'poly' | 'circle';
}

/**
 * Detailed room information
 */
export interface RoomDetail {
  id: string;
  name: string;
  roomType: string;
  floor?: string; // Floor identifier
  area: number;
  length?: number;
  width: number;
  height: number;
  capacity?: number; // Max occupants
  coords: RoomCoordinates;
  reflectanceCeiling?: number;
  reflectanceWalls?: number;
  reflectanceFloor?: number;
  maintenanceFactor?: number;
  requiredLux: number;
  recommendedFixtures?: number;
  actualFixtures?: number;
  compliance: number; // Percentage compliance with standards
  shape?: 'rect' | 'poly' | 'circle'; // Shape of the room
  energyUsage?: number; // Energy consumption in kWh/month
  points?: Point[];
}

/**
 * Non-compliant area within a floor plan
 */
export interface NonCompliantArea {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'lighting' | 'power';
  compliance: number;
  issueType: string;
  details?: string;
  description?: string;
  recommendations?: string[];
  severity?: 'low' | 'medium' | 'high';
}

/**
 * Image detection result
 */
export interface ImageDetectionResult {
  rooms: DetectedRoom[];
  orientation: 'landscape' | 'portrait';
  confidenceScore: number;
}

/**
 * Floor plan data
 */
export interface FloorPlan {
  id: string;
  floorId: string;
  viewMode: 'lighting' | 'power';
  imagePath: string;
  rooms: RoomDetail[];
  nonCompliantAreas?: NonCompliantArea[];
  lastUpdated?: Date;
}

/**
 * Measurement data
 */
export interface Measurement {
  id: string;
  start: Point;
  end: Point;
  distance: number;
  label: string;
}

/**
 * Room detection settings
 */
export interface RoomDetectionSettings {
  sensitivity: number;
  minRoomSize: number;
  maxRoomSize: number;
  enableTextRemoval: boolean;
  useNeuralDetection: boolean;
}

/**
 * User edits for tracking changes
 */
export interface UserEdit {
  timestamp: number;
  userId: string;
  action: 'add' | 'edit' | 'delete' | 'move' | 'resize';
  targetId: string;
  details?: any;
}

/**
 * Load item for schedule of loads
 */
export interface LoadItem {
  description: string;
  quantity: number;
  rating: number;
  demandFactor: number;
  connectedLoad: number;
  demandLoad: number;
  current?: number;
  voltAmpere?: number;
  circuitBreaker?: string;
  conductorSize?: string;
}

/**
 * Load schedule for electrical system
 */
export interface LoadSchedule {
  id: string;
  name: string;
  hours: {
    [day: string]: { start: string; end: string }[];
  };
  occupancyFactors: {
    [hour: string]: number;
  };
}

/**
 * Building data structure
 */
export interface BuildingData {
  name: string;
  floors: Record<string, FloorData>;
}

/**
 * Floor data structure
 */
export interface FloorData {
  name: string;
  rooms: RoomDetail[];
  loadSchedules: LoadSchedule[];
}

export interface FloorDetail {
  id: string;
  number: number;
  name: string;
  rooms: RoomDetail[];
  loadSchedules: LoadSchedule[];
}

export interface BuildingDetail {
  id: string;
  name: string;
  address: string;
  floors: FloorDetail[];
}

export interface FloorplanData {
  buildingId: string;
  floorId: string;
  floorNumber: number;
  rooms: RoomDetail[];
  width: number;
  height: number;
  scale?: {
    pixels: number;
    meters: number;
  };
  annotations?: Array<{
    id: string;
    type: string;
    coords: {
      x: number;
      y: number;
    };
    text: string;
  }>;
}

export interface LightingFixture {
  id: string;
  type: string;
  wattage: number;
  lumens: number;
  cri: number;
  cct: number;
  life: number;
  cost: number;
  efficacy: number;
  distribution: string;
}

export interface SOLCalculationInput {
  room: RoomDetail;
  fixtures: LightingFixture[];
  targetLux: number;
}

export interface SOLCalculationResult {
  recommendedFixtureCount: number;
  totalWattage: number;
  averageIlluminance: number;
  uniformity: number;
  installationCost: number;
  annualEnergyCost: number;
  co2Emissions: number;
  paybackPeriod?: number;
  suggestions?: string[];
} 