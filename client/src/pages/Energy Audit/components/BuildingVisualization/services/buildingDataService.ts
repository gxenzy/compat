import { BuildingData, RoomDetail, NonCompliantArea, LoadSchedule, DetectedRoom } from '../interfaces';

/**
 * Service for handling building data operations
 */
class BuildingDataService {
  private readonly STORAGE_KEY = 'building_data';
  private readonly API_AVAILABLE_KEY = 'building_data_api_available';
  
  /**
   * Check if the API is available
   */
  private isApiAvailable(): boolean {
    return localStorage.getItem(this.API_AVAILABLE_KEY) !== 'false';
  }
  
  /**
   * Mark API as unavailable for future calls
   */
  private markApiUnavailable(): void {
    localStorage.setItem(this.API_AVAILABLE_KEY, 'false');
  }
  
  /**
   * Fetch building data from the API
   */
  async fetchBuildingData(): Promise<BuildingData> {
    try {
      // First check if we've already determined the API is unavailable
      if (!this.isApiAvailable()) {
        return this.getLocalBuildingData();
      }
      
      // Try to fetch from API
      try {
        const response = await fetch('/api/building-data');
        if (!response.ok) {
          throw new Error(`Failed to fetch building data: ${response.statusText}`);
        }
        const data = await response.json();
        
        // Cache the successful response
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        return data;
      } catch (apiError) {
        console.warn('API fetch failed, using local building data:', apiError);
        this.markApiUnavailable();
        return this.getLocalBuildingData();
      }
    } catch (error) {
      console.error('Error fetching building data:', error);
      return this.getLocalBuildingData();
    }
  }

  /**
   * Save building data to the API and localStorage
   */
  async saveBuildingData(buildingData: BuildingData): Promise<boolean> {
    try {
      // Always save to localStorage first
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(buildingData));
      
      // If API is known to be unavailable, don't attempt the API call
      if (!this.isApiAvailable()) {
        console.log('API known to be unavailable, saved to localStorage only');
        return true;
      }
      
      try {
        const response = await fetch('/api/building-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildingData)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to save building data: ${response.statusText}`);
        }
        return true;
      } catch (apiError) {
        console.warn('API save failed, data saved to localStorage only:', apiError);
        this.markApiUnavailable();
        return true; // Still return true since the save to localStorage succeeded
      }
    } catch (error) {
      console.error('Error saving building data:', error);
      return false;
    }
  }

  /**
   * Add a room to the specified floor
   */
  async addRoom(floorKey: string, room: RoomDetail): Promise<boolean> {
    try {
      // Get current data from local storage
      const buildingData = this.getLocalBuildingData();
      
      // Add the room to the floor
      if (buildingData.floors[floorKey]) {
        buildingData.floors[floorKey].rooms.push(room);
        
        // Save the updated data
        return this.saveBuildingData(buildingData);
      }
      return false;
    } catch (error) {
      console.error('Error adding room:', error);
      return false;
    }
  }

  /**
   * Get building data from localStorage or default
   */
  private getLocalBuildingData(): BuildingData {
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      if (storedData) {
        return JSON.parse(storedData);
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    
    return this.getDefaultBuildingData();
  }

  /**
   * Update a room on the specified floor
   */
  async updateRoom(floorKey: string, roomId: string, roomData: Partial<RoomDetail>): Promise<boolean> {
    try {
      const response = await fetch(`/api/building-data/floors/${floorKey}/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update room: ${response.statusText}`);
      }
      return true;
    } catch (error) {
      console.error('Error updating room:', error);
      return false;
    }
  }

  /**
   * Delete a room from the specified floor
   */
  async deleteRoom(floorKey: string, roomId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/building-data/floors/${floorKey}/rooms/${roomId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete room: ${response.statusText}`);
      }
      return true;
    } catch (error) {
      console.error('Error deleting room:', error);
      return false;
    }
  }

  /**
   * Convert detected rooms from CNN to room details
   */
  convertDetectedRoomsToDetails(detectedRooms: DetectedRoom[]): RoomDetail[] {
    return detectedRooms.map(room => {
      const roomTypeMapping: Record<string, string> = {
        'office': 'Office',
        'conference': 'Conference Room',
        'restroom': 'Restroom',
        'kitchen': 'Kitchen',
        'storage': 'Storage',
        'electrical': 'Electrical Room',
        'hallway': 'Hallway',
        'stairs': 'Staircase',
        'reception': 'Reception',
        'lobby': 'Lobby',
        'classroom': 'Classroom',
        'server': 'Server Room'
      };

      // Get default lux requirement based on room type
      const luxRequirements: Record<string, number> = {
        'office': 500,
        'conference': 400,
        'restroom': 150,
        'kitchen': 500,
        'storage': 150,
        'electrical': 300,
        'hallway': 150,
        'stairs': 200,
        'reception': 300,
        'lobby': 200,
        'classroom': 500,
        'server': 400,
        'default': 300
      };

      const roomType = room.type || 'default';
      const requiredLux = luxRequirements[roomType] || 300;
      const length = room.width / 100; // Convert to meters
      const width = room.height / 100; // Convert to meters
      const area = length * width;
      const recommendedFixtures = Math.ceil(area * requiredLux / 5000);

      return {
        id: room.id,
        name: roomTypeMapping[roomType] || room.name,
        length,
        width,
        height: 3, // Default ceiling height in meters
        area,
        roomType,
        coords: {
          x: room.x,
          y: room.y,
          width: room.width,
          height: room.height
        },
        reflectanceCeiling: 0.7, // Default values for calculations
        reflectanceWalls: 0.5,
        reflectanceFloor: 0.2,
        maintenanceFactor: 0.8,
        requiredLux,
        recommendedFixtures,
        actualFixtures: recommendedFixtures, // Default to recommended
        compliance: 100 // Default compliance - will be calculated later
      };
    });
  }

  /**
   * Calculate lighting compliance based on room data
   */
  calculateLightingCompliance(room: RoomDetail): number {
    if (!room.actualFixtures || !room.recommendedFixtures || !room.requiredLux) {
      return 0;
    }

    // Simple compliance calculation based on fixture ratio
    const fixtureRatio = room.actualFixtures / room.recommendedFixtures;
    
    // Scale: 0.8 to 1.2 is ideal (80-120%)
    if (fixtureRatio < 0.5) return 50; // Critically under-lit
    if (fixtureRatio < 0.7) return 60 + (fixtureRatio - 0.5) * 100; // 60-80%
    if (fixtureRatio < 0.9) return 80 + (fixtureRatio - 0.7) * 50; // 80-90%
    if (fixtureRatio <= 1.1) return 90 + (fixtureRatio - 0.9) * 100; // 90-100%
    if (fixtureRatio <= 1.3) return 100; // 100% compliance for 110-130% fixtures
    
    // Over-provisioned lighting (waste of energy)
    return 100 - ((fixtureRatio - 1.3) * 50); // Gradually reduce compliance as fixtures increase
  }

  /**
   * Get default building data for initialization
   */
  getDefaultBuildingData(): BuildingData {
    return {
      name: 'Sample Building',
      floors: {
        'ground': {
          name: 'Ground Floor',
          rooms: [
            {
              id: 'room-g1',
              name: 'Main Office',
              length: 10,
              width: 8,
              height: 3,
              area: 80,
              roomType: 'office',
              coords: { x: 200, y: 150, width: 200, height: 160 },
              requiredLux: 500,
              recommendedFixtures: 8,
              actualFixtures: 8,
              compliance: 95,
              reflectanceCeiling: 0.7,
              reflectanceWalls: 0.5,
              reflectanceFloor: 0.2,
              maintenanceFactor: 0.8
            },
            {
              id: 'room-g2',
              name: 'Conference Room',
              length: 8,
              width: 6,
              height: 3,
              area: 48,
              roomType: 'conference',
              coords: { x: 450, y: 150, width: 160, height: 120 },
              requiredLux: 400,
              recommendedFixtures: 6,
              actualFixtures: 5,
              compliance: 85,
              reflectanceCeiling: 0.7,
              reflectanceWalls: 0.5,
              reflectanceFloor: 0.2,
              maintenanceFactor: 0.8
            },
            {
              id: 'room-g3',
              name: 'Reception',
              length: 5,
              width: 5,
              height: 3,
              area: 25,
              roomType: 'reception',
              coords: { x: 200, y: 300, width: 100, height: 100 },
              requiredLux: 300,
              recommendedFixtures: 3,
              actualFixtures: 4,
              compliance: 100,
              reflectanceCeiling: 0.7,
              reflectanceWalls: 0.5,
              reflectanceFloor: 0.2,
              maintenanceFactor: 0.8
            },
            {
              id: 'room-g4',
              name: 'Hallway',
              length: 15,
              width: 2,
              height: 3,
              area: 30,
              roomType: 'hallway',
              coords: { x: 350, y: 250, width: 300, height: 40 },
              requiredLux: 150,
              recommendedFixtures: 3,
              actualFixtures: 2,
              compliance: 70,
              reflectanceCeiling: 0.7,
              reflectanceWalls: 0.5,
              reflectanceFloor: 0.2,
              maintenanceFactor: 0.8
            }
          ],
          loadSchedules: [
            {
              id: 'load-g1',
              roomId: 'room-g1',
              panelName: 'LP-GF',
              floorName: 'Ground Floor',
              voltage: 230,
              powerFactor: 0.9,
              totalConnectedLoad: 15000,
              totalDemandLoad: 12000,
              current: 52.17,
              circuitBreaker: '60A',
              conductorSize: '10 mm²',
              incomingFeederSize: '14 mm²',
              feederProtectionSize: '80A',
              loads: [
                {
                  description: 'Lighting Fixtures',
                  quantity: 20,
                  rating: 36,
                  demandFactor: 0.9,
                  current: 2.82,
                  voltAmpere: 720,
                  circuitBreaker: '15A',
                  conductorSize: '1.5 mm²'
                },
                {
                  description: 'Convenience Outlets',
                  quantity: 15,
                  rating: 180,
                  demandFactor: 0.8,
                  current: 9.39,
                  voltAmpere: 2700,
                  circuitBreaker: '20A',
                  conductorSize: '2.5 mm²'
                }
              ]
            }
          ]
        },
        'second': {
          name: 'Second Floor',
          rooms: [
            {
              id: 'room-s1',
              name: 'Executive Office',
              length: 6,
              width: 5,
              height: 3,
              area: 30,
              roomType: 'office',
              coords: { x: 200, y: 150, width: 120, height: 100 },
              requiredLux: 500,
              recommendedFixtures: 6,
              actualFixtures: 6,
              compliance: 100,
              reflectanceCeiling: 0.7,
              reflectanceWalls: 0.5,
              reflectanceFloor: 0.2,
              maintenanceFactor: 0.8
            },
            {
              id: 'room-s2',
              name: 'Staff Office',
              length: 10,
              width: 8,
              height: 3,
              area: 80,
              roomType: 'office',
              coords: { x: 450, y: 150, width: 200, height: 160 },
              requiredLux: 500,
              recommendedFixtures: 10,
              actualFixtures: 8,
              compliance: 80,
              reflectanceCeiling: 0.7,
              reflectanceWalls: 0.5,
              reflectanceFloor: 0.2,
              maintenanceFactor: 0.8
            }
          ],
          loadSchedules: [
            {
              id: 'load-s1',
              roomId: 'room-s1',
              panelName: 'LP-2F',
              floorName: 'Second Floor',
              voltage: 230,
              powerFactor: 0.9,
              totalConnectedLoad: 12000,
              totalDemandLoad: 9600,
              current: 41.74,
              circuitBreaker: '50A',
              conductorSize: '8 mm²',
              incomingFeederSize: '10 mm²',
              feederProtectionSize: '60A',
              loads: [
                {
                  description: 'Lighting Fixtures',
                  quantity: 18,
                  rating: 36,
                  demandFactor: 0.9,
                  current: 2.54,
                  voltAmpere: 648,
                  circuitBreaker: '15A',
                  conductorSize: '1.5 mm²'
                },
                {
                  description: 'Convenience Outlets',
                  quantity: 12,
                  rating: 180,
                  demandFactor: 0.8,
                  current: 7.5,
                  voltAmpere: 2160,
                  circuitBreaker: '20A',
                  conductorSize: '2.5 mm²'
                }
              ]
            }
          ]
        }
      }
    };
  }
}

export const buildingDataService = new BuildingDataService(); 