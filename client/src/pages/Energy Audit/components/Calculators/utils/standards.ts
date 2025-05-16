/**
 * Standards API integration for calculator components
 * Provides functionality to fetch standards data for validation and compliance checks
 */

import axios from 'axios';

// API endpoint configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const STANDARDS_ENDPOINT = `${API_BASE_URL}/standards`;

// Standards data types
export interface StandardData {
  id: string;
  standardCode: string;
  standardName: string;
  version: string;
  category: string;
  description?: string;
  dateEffective: string;
}

export interface BuildingStandard {
  id: string;
  buildingType: string;
  standardType: string;
  standardCode: string;
  minimumValue: number | null;
  maximumValue: number | null;
  unit: string;
  description: string;
  sourceStandardId: string;
}

/**
 * Type for standardized building standards format
 */
export type BuildingStandardsType = Record<string, {label: string, maxLPD: number}>;

// Cache mechanism for standards data
let standardsCache: Record<string, any> = {};
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes in milliseconds
let cacheTimestamp: number = 0;

/**
 * Clear the standards cache to force fresh data retrieval
 */
export const clearStandardsCache = () => {
  standardsCache = {};
  cacheTimestamp = 0;
};

/**
 * Checks if the cache is still valid or has expired
 */
const isCacheValid = () => {
  return cacheTimestamp > 0 && Date.now() - cacheTimestamp < CACHE_EXPIRY;
};

/**
 * Fetch all available standards
 * @returns Array of standard metadata objects
 */
export const fetchStandards = async (): Promise<StandardData[]> => {
  if (standardsCache.allStandards && isCacheValid()) {
    return standardsCache.allStandards;
  }

  try {
    const response = await axios.get(`${STANDARDS_ENDPOINT}`);
    standardsCache.allStandards = response.data;
    cacheTimestamp = Date.now();
    return response.data;
  } catch (error) {
    console.error('Error fetching standards:', error);
    throw new Error('Failed to fetch standards data');
  }
};

/**
 * Fetch building standards by type (e.g., 'lpd', 'illumination')
 * @param standardType - Type of standard to fetch
 * @returns Array of building standards for the specified type
 */
export const fetchBuildingStandardsByType = async (standardType: string): Promise<BuildingStandard[]> => {
  const cacheKey = `buildingStandards_${standardType}`;
  
  if (standardsCache[cacheKey] && isCacheValid()) {
    return standardsCache[cacheKey];
  }

  try {
    const response = await axios.get(`${STANDARDS_ENDPOINT}/building-types`, {
      params: { standardType }
    });
    standardsCache[cacheKey] = response.data;
    cacheTimestamp = Date.now();
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${standardType} standards:`, error);
    throw new Error(`Failed to fetch ${standardType} standards`);
  }
};

/**
 * Get LPD standards for building types
 * @returns Maximum LPD values by building type
 */
export const fetchLPDStandards = async (): Promise<BuildingStandardsType> => {
  try {
    const standards = await fetchBuildingStandardsByType('lpd');
    
    // Format the standards data into the expected structure
    const lpdStandards: BuildingStandardsType = {};
    
    standards.forEach(standard => {
      // Only include standards with maximum values
      if (standard.maximumValue !== null) {
        // Convert buildingType to camelCase for use as object keys
        const buildingTypeKey = standard.buildingType.toLowerCase().replace(/ /g, '');
        lpdStandards[buildingTypeKey] = {
          label: standard.buildingType,
          maxLPD: standard.maximumValue
        };
      }
    });
    
    return lpdStandards;
  } catch (error) {
    console.error('Error fetching LPD standards:', error);
    // Return fallback values in case of API failure
    return {
      office: { label: 'Office', maxLPD: 10.5 },
      classroom: { label: 'Classroom', maxLPD: 10.5 },
      hospital: { label: 'Hospital', maxLPD: 11.2 },
      retail: { label: 'Retail', maxLPD: 14.5 },
      industrial: { label: 'Industrial', maxLPD: 12.8 },
      residential: { label: 'Residential', maxLPD: 8.0 },
      warehouse: { label: 'Warehouse', maxLPD: 8.0 },
      restaurant: { label: 'Restaurant', maxLPD: 12.0 },
      hotel: { label: 'Hotel', maxLPD: 10.0 },
      laboratory: { label: 'Laboratory', maxLPD: 14.0 }
    };
  }
}; 