/**
 * Measurement Tool Utility
 * Provides functions for measuring distances on the floor plan
 */

import { Point } from '../interfaces/buildingInterfaces';

/**
 * Measurement state interface
 */
export interface MeasurementState {
  active: boolean;
  start: Point | null;
  end: Point | null;
  measurements: Measurement[];
  currentMeasurement: Measurement | null;
  scale: number; // Pixels per meter
}

/**
 * Measurement data structure
 */
export interface Measurement {
  id: string;
  start: Point;
  end: Point;
  distance: number;  // Pixel distance
  realDistance: number; // Actual distance in meters
  label: string;
}

/**
 * Constants for measurement conversion
 */
const DEFAULT_PIXELS_PER_METER = 30; // Default scale (can be calibrated)

/**
 * Generate a unique ID for measurements
 */
const generateMeasurementId = (): string => {
  return 'measurement-' + Math.random().toString(36).substring(2, 9);
};

/**
 * Calculate distance between two points
 */
export const calculateDistance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

/**
 * Convert pixel distance to real-world distance
 */
export const pixelsToMeters = (pixelDistance: number, scale: number = DEFAULT_PIXELS_PER_METER): number => {
  return pixelDistance / scale;
};

/**
 * Format distance for display
 */
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 100)} cm`;
  }
  return `${distance.toFixed(2)} m`;
};

/**
 * Create a new measurement object
 */
export const createMeasurement = (startPoint: Point, endPoint: Point, scale: number = DEFAULT_PIXELS_PER_METER): Measurement => {
  const pixelDistance = calculateDistance(startPoint, endPoint);
  const realDistance = pixelsToMeters(pixelDistance, scale);
  
  return {
    id: generateMeasurementId(),
    start: startPoint,
    end: endPoint,
    distance: pixelDistance,
    realDistance,
    label: formatDistance(realDistance)
  };
};

/**
 * Initialize measurement state
 */
export const initMeasurementState = (): MeasurementState => {
  return {
    active: false,
    start: null,
    end: null,
    measurements: [],
    currentMeasurement: null,
    scale: DEFAULT_PIXELS_PER_METER
  };
};

/**
 * Start measurement from a point
 */
export const startMeasurement = (state: MeasurementState, point: Point): MeasurementState => {
  return {
    ...state,
    active: true,
    start: point,
    end: point, // Initially same as start
    currentMeasurement: null
  };
};

/**
 * Update measurement end point during dragging or movement
 */
export const updateMeasurement = (state: MeasurementState, point: Point): MeasurementState => {
  if (!state.active || !state.start) {
    return state;
  }
  
  const currentMeasurement = createMeasurement(state.start, point, state.scale);
  
  return {
    ...state,
    end: point,
    currentMeasurement
  };
};

/**
 * Complete measurement and add to measurements list
 */
export const completeMeasurement = (state: MeasurementState): MeasurementState => {
  if (!state.active || !state.start || !state.end || !state.currentMeasurement) {
    return state;
  }
  
  // Only add if the points are not the same (avoid accidental single clicks)
  if (state.start.x === state.end.x && state.start.y === state.end.y) {
    return { ...state, active: false, start: null, end: null, currentMeasurement: null };
  }
  
  return {
    ...state,
    active: false,
    start: null,
    end: null,
    measurements: [...state.measurements, state.currentMeasurement],
    currentMeasurement: null
  };
};

/**
 * Clear all measurements
 */
export const clearMeasurements = (state: MeasurementState): MeasurementState => {
  return {
    ...state,
    active: false,
    start: null,
    end: null,
    measurements: [],
    currentMeasurement: null
  };
};

/**
 * Delete a specific measurement by ID
 */
export const deleteMeasurement = (state: MeasurementState, measurementId: string): MeasurementState => {
  return {
    ...state,
    measurements: state.measurements.filter(m => m.id !== measurementId)
  };
};

/**
 * Calibrate the measurement scale based on a known distance
 */
export const calibrateMeasurementScale = (pixelDistance: number, realDistance: number): number => {
  if (pixelDistance <= 0 || realDistance <= 0) {
    return DEFAULT_PIXELS_PER_METER; // Return default if invalid
  }
  return pixelDistance / realDistance;
};

/**
 * Check if a point is close to a measurement
 * Useful for deleting measurements by clicking on them
 */
export const isPointNearMeasurement = (point: Point, measurement: Measurement, threshold: number = 10): boolean => {
  // Check if point is near the line segment between start and end
  const d1 = calculateDistance(point, measurement.start);
  const d2 = calculateDistance(point, measurement.end);
  const lineLength = measurement.distance;
  
  // If point is close to start or end point
  if (d1 < threshold || d2 < threshold) {
    return true;
  }
  
  // Calculate distance from point to line
  const lineVector = {
    x: measurement.end.x - measurement.start.x,
    y: measurement.end.y - measurement.start.y
  };
  
  // Calculate projection of point onto line
  const pointVector = {
    x: point.x - measurement.start.x,
    y: point.y - measurement.start.y
  };
  
  // Dot product
  const dot = pointVector.x * lineVector.x + pointVector.y * lineVector.y;
  
  // Normalized projection distance along line
  const projectionRatio = Math.max(0, Math.min(1, dot / (lineLength * lineLength)));
  
  // Point on line closest to our point
  const closestPoint = {
    x: measurement.start.x + projectionRatio * lineVector.x,
    y: measurement.start.y + projectionRatio * lineVector.y
  };
  
  // Distance from original point to closest point on line
  const distance = calculateDistance(point, closestPoint);
  
  return distance < threshold;
};

/**
 * Find measurement closest to a point
 */
export const findMeasurementByPoint = (state: MeasurementState, point: Point, threshold: number = 10): string | null => {
  for (const measurement of state.measurements) {
    if (isPointNearMeasurement(point, measurement, threshold)) {
      return measurement.id;
    }
  }
  return null;
};

export default {
  initMeasurementState,
  startMeasurement,
  updateMeasurement,
  completeMeasurement,
  clearMeasurements,
  deleteMeasurement,
  calculateDistance,
  pixelsToMeters,
  formatDistance,
  createMeasurement,
  calibrateMeasurementScale,
  isPointNearMeasurement,
  findMeasurementByPoint
}; 