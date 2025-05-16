/**
 * Unified interfaces for Building Visualization module
 */

/**
 * Room coordinates information
 */
export interface RoomCoords {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Point coordinates for polygon shapes
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Room detected from floor plan
 */
export interface DetectedRoom {
  id: string;
  name?: string;
  type?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
  points?: Point[];
  polygon?: Point[]; // For backward compatibility
  editable?: boolean;
  isDetected?: boolean;
  shape?: 'rect' | 'poly' | 'circle';
}

/**
 * Room detail containing all information for visualization
 */
export interface RoomDetail {
  id: string;
  name: string;
  area: number;
  width: number;
  height: number;
  length: number;
  roomType: string; // This is required for compatibility
  type?: string; // This is also used in some places
  floor?: number;
  position?: {
    x: number;
    y: number;
  };
  coords: RoomCoords; // Required for the visualization
  occupancy?: {
    max: number;
    typical: number;
  };
  lighting?: {
    fixtureCount: number;
    fixtureType: string;
    wattage: number;
    lumens: number;
    footCandles?: number;
  };
  equipment?: {
    items: Array<{
      id: string;
      name: string;
      type: string;
      power: number;
      quantity: number;
    }>;
  };
  hvac?: {
    system: string;
    tonnage?: number;
    efficiency?: number;
  };
  hasAnomalies?: boolean;
  annotations?: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    text: string;
  }>;
  color?: string;
  borderColor?: string;
  requiredLux: number; 
  currentLux?: number;
  notes?: string;
  audit?: {
    status: 'pending' | 'in-progress' | 'complete';
    lastUpdated?: Date;
    assignedTo?: string;
  };
  // Fields from buildingInterfaces.ts
  reflectanceCeiling?: number;
  reflectanceWalls?: number;
  reflectanceFloor?: number;
  maintenanceFactor?: number;
  recommendedFixtures?: number;
  actualFixtures?: number;
  compliance?: number;
  shape?: 'rect' | 'polygon';
  points?: Point[];
  energyUsage?: number;
  powerDetails?: {
    connectedLoad: number;
    demandLoad: number;
    voltage: number;
    current: number;
    powerFactor: number;
  };
}

// Instead of re-exporting from buildingInterfaces.ts, define a type alias
// This removes the duplicate imports that cause type confusion
export type OriginalRoomDetail = RoomDetail;
export type OriginalDetectedRoom = DetectedRoom;
export type OriginalBuildingData = BuildingData;
export type OriginalFloorData = FloorData;
export type OriginalLoadSchedule = LoadSchedule;

/**
 * Non-compliant area in floor plan
 */
export interface NonCompliantArea {
  id: string;
  type: 'lighting' | 'power';
  title: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  compliance: number;
  recommendations: string[];
  severity: 'low' | 'medium' | 'high';
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
  roomId?: string;
  panelName?: string;
  floorName?: string;
  voltage?: number;
  powerFactor?: number;
  totalConnectedLoad?: number;
  totalDemandLoad?: number;
  current?: number;
  circuitBreaker?: string;
  conductorSize?: string;
  incomingFeederSize?: string;
  feederProtectionSize?: string;
  loads?: LoadItem[];
  items?: any[];
  hours?: {
    [day: string]: { start: string; end: string }[];
  };
  occupancyFactors?: {
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

// Floor interface for the building visualization
export interface Floor {
  id: string;
  level: number;
  name: string;
  rooms: RoomDetail[];
  width: number;
  height: number;
  image?: string;
  sections?: Array<{
    id: string;
    name: string;
    rooms: string[]; // Room IDs
  }>;
}

// Building interface for the building visualization
export interface Building {
  id: string;
  name: string;
  address: string;
  floors: Floor[];
  type: string;
  totalArea: number;
  yearBuilt: number;
  metadata?: {
    [key: string]: any;
  };
}

// Filter interface for the building visualization
export interface BuildingFilter {
  floors?: number[];
  roomTypes?: string[];
  occupancy?: {
    min?: number;
    max?: number;
  };
  area?: {
    min?: number;
    max?: number;
  };
  lightingType?: string[];
  hvacSystem?: string[];
  hasAnomalies?: boolean;
}

// SOL data for Standard of Light calculation
export interface SOLData {
  buildingId: string;
  rooms: Array<{
    roomId: string;
    requiredLux: number;
    currentLux?: number;
    compliance?: boolean;
    gap?: number;
    recommendations?: string[];
  }>;
  lastUpdated: Date;
}

// Energy calculation result interfaces
export interface LightingCalculationResult {
  totalWattage: number;
  totalLumens: number;
  averageEfficiency: number;
  annualConsumption: number;
  costEstimate: number;
  co2Emissions: number;
}

export interface HVACCalculationResult {
  totalTonnage: number;
  annualConsumption: number;
  costEstimate: number;
  co2Emissions: number;
  efficiency: number;
}

export interface EquipmentCalculationResult {
  totalPower: number;
  annualConsumption: number;
  costEstimate: number;
  co2Emissions: number;
  breakdown: Record<string, number>;
}

export interface EnergyCalculationResult {
  lighting: LightingCalculationResult;
  hvac: HVACCalculationResult;
  equipment: EquipmentCalculationResult;
  total: {
    annualConsumption: number;
    costEstimate: number;
    co2Emissions: number;
  };
} 