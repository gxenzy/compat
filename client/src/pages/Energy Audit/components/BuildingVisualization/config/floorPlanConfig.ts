/**
 * Floor Plan Configuration
 * Defines the structure and access methods for floor plan data
 */

// Define floor plan categories
export type FloorPlanViewMode = 'lighting' | 'power';
export type FloorLevel = 'ground' | 'mezzanine' | 'second' | 'third' | 'fourth' | 'fifth';

// Interface for floor plan data
export interface FloorPlanData {
  id: string;
  name: string;
  level: FloorLevel;
  lighting: string;
  power: string;
  description?: string;
  order: number;
}

// Map of floor IDs to their display names and metadata
export const FLOORS: Record<string, FloorPlanData> = {
  'ground': {
    id: 'ground',
    name: 'Ground Floor',
    level: 'ground',
    lighting: '/floorplan/ground floor lighting layout.jpg',
    power: '/floorplan/ground floor power layout.jpg',
    description: 'Main entrance level with reception, registrar, and primary offices',
    order: 1
  },
  'mezzanine': {
    id: 'mezzanine',
    name: 'Mezzanine',
    level: 'mezzanine',
    lighting: '/floorplan/mezzanine floor lighting layout.jpg',
    power: '/floorplan/mezzanine floor power layout.jpg',
    description: 'Half-level with research facilities and administrative offices',
    order: 2
  },
  'second': {
    id: 'second',
    name: 'Second Floor',
    level: 'second',
    lighting: '/floorplan/second floor lighting layout.jpg',
    power: '/floorplan/second floor power layout.jpg',
    description: 'Classrooms and faculty offices',
    order: 3
  },
  'third': {
    id: 'third',
    name: 'Third Floor',
    level: 'third',
    lighting: '/floorplan/third floor lighting layout.jpg',
    power: '/floorplan/third floor power layout.jpg',
    description: 'Additional classrooms and specialized labs',
    order: 4
  },
  'fourth': {
    id: 'fourth',
    name: 'Fourth Floor',
    level: 'fourth',
    lighting: '/floorplan/fourth floor lighting layout.jpg',
    power: '/floorplan/fourth floor power layout.jpg',
    description: 'Specialized laboratories and facilities',
    order: 5
  },
  'fifth': {
    id: 'fifth',
    name: 'Fifth Floor',
    level: 'fifth',
    lighting: '/floorplan/fifth floor lighting layout.jpg', 
    power: '/floorplan/fifth floor power layout.jpg',
    description: 'Executive offices and meeting rooms',
    order: 6
  }
};

// Fallback image if floor plan cannot be loaded
export const FALLBACK_FLOOR_PLAN = '/floorplan/placeholder.jpg';

/**
 * Get sorted floors by their order
 */
export const getSortedFloors = (): FloorPlanData[] => {
  return Object.values(FLOORS).sort((a, b) => a.order - b.order);
};

/**
 * Get floor plan image URL for a specific floor and view mode
 * @param floorId Floor identifier
 * @param viewMode The view mode (lighting or power)
 * @returns URL of the floor plan image
 */
export const getFloorPlanImage = (floorId: string, viewMode: FloorPlanViewMode = 'lighting'): string => {
  if (floorId in FLOORS) {
    return viewMode === 'lighting' ? FLOORS[floorId].lighting : FLOORS[floorId].power;
  }
  return FALLBACK_FLOOR_PLAN;
};

/**
 * Get floor data by ID
 * @param floorId Floor identifier
 * @returns Floor data object or undefined if not found
 */
export const getFloorById = (floorId: string): FloorPlanData | undefined => {
  return FLOORS[floorId];
};

/**
 * Get floor ID from image path
 * @param imagePath Path to the floor plan image
 * @returns Floor ID or 'unknown' if not determined
 */
export const getFloorIdFromPath = (imagePath: string): string => {
  for (const [floorId, floor] of Object.entries(FLOORS)) {
    if (imagePath.includes(floorId)) {
      return floorId;
    }
  }
  return 'unknown';
};

/**
 * Get adjacent floors
 * @param floorId Current floor ID
 * @returns Object with previous and next floor IDs
 */
export const getAdjacentFloors = (floorId: string): { previous?: string; next?: string } => {
  const sortedFloors = getSortedFloors();
  const currentFloorIndex = sortedFloors.findIndex(floor => floor.id === floorId);
  
  if (currentFloorIndex === -1) {
    return {};
  }
  
  return {
    previous: currentFloorIndex > 0 ? sortedFloors[currentFloorIndex - 1].id : undefined,
    next: currentFloorIndex < sortedFloors.length - 1 ? sortedFloors[currentFloorIndex + 1].id : undefined
  };
};

/**
 * Get floor options for dropdown menus
 * @returns Array of floor options with value and label
 */
export const getFloorOptions = (): Array<{value: string, label: string}> => {
  return getSortedFloors().map(floor => ({
    value: floor.id,
    label: floor.name
  }));
}; 