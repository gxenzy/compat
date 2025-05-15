import { useState, useEffect, useCallback } from 'react';
import energyAuditService, { FieldDataPoint as BaseFieldDataPoint, AuditArea as BaseAuditArea } from '../../../../services/energyAuditService';

// Define the sync status type
export type SyncStatusType = 'synced' | 'syncing' | 'error' | 'offline' | 'pending';

// Define return type for offline data count
interface OfflineDataCount {
  dataPoints: number;
  areas: number;
  total: number;
}

// Extend the base interfaces with offline-specific properties
export interface FieldDataPoint extends BaseFieldDataPoint {
  isPending?: boolean;
}

export interface AuditArea extends BaseAuditArea {
  isPending?: boolean;
}

/**
 * Custom hook for handling offline/online synchronization for Energy Audit data
 * Manages local storage caching and syncing when connection is restored
 */
const useEnergyAuditSync = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [syncState, setSyncState] = useState<SyncStatusType>('synced');
  const [offlineDataPoints, setOfflineDataPoints] = useState<FieldDataPoint[]>([]);
  const [offlineAreas, setOfflineAreas] = useState<AuditArea[]>([]);

  // Load offline data from localStorage on mount
  useEffect(() => {
    const loadOfflineData = () => {
      try {
        const storedDataPoints = localStorage.getItem('offline_data_points');
        const storedAreas = localStorage.getItem('offline_areas');
        
        if (storedDataPoints) {
          setOfflineDataPoints(JSON.parse(storedDataPoints));
        }
        
        if (storedAreas) {
          setOfflineAreas(JSON.parse(storedAreas));
        }
      } catch (error) {
        console.error('Error loading offline data:', error);
      }
    };
    
    loadOfflineData();
  }, []);

  // Set up online/offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncState('pending');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setSyncState('offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save offline data points to localStorage whenever they change
  useEffect(() => {
    if (offlineDataPoints.length > 0) {
      localStorage.setItem('offline_data_points', JSON.stringify(offlineDataPoints));
    }
  }, [offlineDataPoints]);

  // Save offline areas to localStorage whenever they change
  useEffect(() => {
    if (offlineAreas.length > 0) {
      localStorage.setItem('offline_areas', JSON.stringify(offlineAreas));
    }
  }, [offlineAreas]);

  /**
   * Save a data point when offline
   */
  const saveDataPointOffline = useCallback(async (dataPoint: FieldDataPoint): Promise<FieldDataPoint> => {
    // Generate a temporary ID for the data point
    const tempId = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const dataPointWithId = {
      ...dataPoint,
      id: tempId,
      createdAt: new Date().toISOString(),
      isPending: true
    };
    
    setOfflineDataPoints(prev => [...prev, dataPointWithId]);
    setSyncState('pending');
    
    return dataPointWithId;
  }, []);

  /**
   * Save an area when offline
   */
  const saveAreaOffline = useCallback(async (area: AuditArea): Promise<AuditArea> => {
    // Generate a temporary ID for the area
    const tempId = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const areaWithId = {
      ...area,
      id: tempId,
      createdAt: new Date().toISOString(),
      isPending: true
    };
    
    setOfflineAreas(prev => [...prev, areaWithId]);
    setSyncState('pending');
    
    return areaWithId;
  }, []);

  /**
   * Delete a data point when offline
   */
  const deleteDataPointOffline = useCallback(async (id: string): Promise<void> => {
    if (id.startsWith('offline_')) {
      // If it's an offline data point, just remove it from state
      setOfflineDataPoints(prev => prev.filter(point => point.id !== id));
    } else {
      // If it's a server data point, mark it for deletion
      const deleteMarker = {
        id,
        isDeleted: true,
        deletedAt: new Date().toISOString()
      };
      
      // Store the delete marker
      const deleteMarkers = JSON.parse(localStorage.getItem('offline_deletes_datapoints') || '[]');
      localStorage.setItem('offline_deletes_datapoints', JSON.stringify([...deleteMarkers, deleteMarker]));
    }
  }, []);

  /**
   * Delete an area when offline
   */
  const deleteAreaOffline = useCallback(async (id: string): Promise<void> => {
    if (id.startsWith('offline_')) {
      // If it's an offline area, just remove it from state
      setOfflineAreas(prev => prev.filter(area => area.id !== id));
    } else {
      // If it's a server area, mark it for deletion
      const deleteMarker = {
        id,
        isDeleted: true,
        deletedAt: new Date().toISOString()
      };
      
      // Store the delete marker
      const deleteMarkers = JSON.parse(localStorage.getItem('offline_deletes_areas') || '[]');
      localStorage.setItem('offline_deletes_areas', JSON.stringify([...deleteMarkers, deleteMarker]));
    }
  }, []);

  /**
   * Sync offline data with the server
   */
  const syncOfflineData = useCallback(async (): Promise<void> => {
    if (!isOnline) {
      throw new Error('Cannot sync while offline');
    }
    
    setSyncState('syncing');
    
    try {
      // Sync data points
      if (offlineDataPoints.length > 0) {
        for (const dataPoint of offlineDataPoints) {
          if (dataPoint.isPending) {
            // This is a new data point created offline
            const { id, isPending, ...dataPointWithoutTempId } = dataPoint;
            await energyAuditService.createFieldDataPoint(dataPointWithoutTempId);
          }
        }
        // Clear offline data points
        setOfflineDataPoints([]);
        localStorage.removeItem('offline_data_points');
      }
      
      // Sync areas
      if (offlineAreas.length > 0) {
        for (const area of offlineAreas) {
          if (area.isPending) {
            // This is a new area created offline
            const { id, isPending, ...areaWithoutTempId } = area;
            await energyAuditService.createAuditArea(areaWithoutTempId);
          }
        }
        // Clear offline areas
        setOfflineAreas([]);
        localStorage.removeItem('offline_areas');
      }
      
      // Process deleted data points
      const deletedDataPoints = JSON.parse(localStorage.getItem('offline_deletes_datapoints') || '[]');
      if (deletedDataPoints.length > 0) {
        for (const { id } of deletedDataPoints) {
          await energyAuditService.deleteFieldDataPoint(id);
        }
        localStorage.removeItem('offline_deletes_datapoints');
      }
      
      // Process deleted areas
      const deletedAreas = JSON.parse(localStorage.getItem('offline_deletes_areas') || '[]');
      if (deletedAreas.length > 0) {
        for (const { id } of deletedAreas) {
          await energyAuditService.deleteAuditArea(id);
        }
        localStorage.removeItem('offline_deletes_areas');
      }
      
      setSyncState('synced');
    } catch (error) {
      console.error('Sync error:', error);
      setSyncState('error');
      throw error;
    }
  }, [isOnline, offlineDataPoints, offlineAreas]);

  /**
   * Get the count of offline data waiting to be synced
   */
  const getOfflineDataCount = useCallback((): OfflineDataCount => {
    const dataPoints = offlineDataPoints.length;
    const areas = offlineAreas.length;
    
    // Also count delete markers
    const deletedDataPoints = JSON.parse(localStorage.getItem('offline_deletes_datapoints') || '[]').length;
    const deletedAreas = JSON.parse(localStorage.getItem('offline_deletes_areas') || '[]').length;
    
    return {
      dataPoints: dataPoints + deletedDataPoints,
      areas: areas + deletedAreas,
      total: dataPoints + areas + deletedDataPoints + deletedAreas
    };
  }, [offlineDataPoints, offlineAreas]);

  return {
    isOnline,
    syncState,
    saveDataPointOffline,
    saveAreaOffline,
    deleteDataPointOffline,
    deleteAreaOffline,
    syncOfflineData,
    getOfflineDataCount
  };
};

export default useEnergyAuditSync; 