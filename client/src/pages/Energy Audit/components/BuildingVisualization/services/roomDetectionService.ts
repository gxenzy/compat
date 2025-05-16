/**
 * Room Detection Service
 * Orchestrates different room detection algorithms
 */

import { ImageDetectionResult } from '../interfaces/buildingInterfaces';
import { traditionalRoomDetection } from '../utils/cnnDetection';
import { detectRoomsWithNeuralNetwork } from '../utils/neuralDetection';
import { textBasedRoomDetection } from '../utils/textBasedDetection';

// OpenCV detection API endpoint
const OPENCV_DETECTION_API = '/api/room-detection/opencv';

// Check if we're in development environment without API endpoints
const isDevelopmentWithoutApi = () => {
  return process.env.NODE_ENV === 'development' && 
    (localStorage.getItem('mock-api-endpoints') === 'true' || 
     localStorage.getItem('api-endpoints-available') === 'false');
};

/**
 * Detect rooms using the server-side OpenCV implementation
 */
const openCVRoomDetection = async (
  imageSrc: string,
  containerWidth: number,
  containerHeight: number
): Promise<ImageDetectionResult> => {
  try {
    // Skip API call in development mode without backend
    if (isDevelopmentWithoutApi()) {
      console.log('Development mode without API endpoints, skipping OpenCV detection');
      throw new Error('API endpoints not available in development mode');
    }
    
    console.log('Starting OpenCV room detection');
    
    // Extract the image path from the src
    const imagePath = imageSrc.startsWith('/') 
      ? imageSrc 
      : '/' + imageSrc.split('/').slice(3).join('/');
    
    // Call the server API for OpenCV processing
    const response = await fetch(OPENCV_DETECTION_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imagePath,
        width: containerWidth,
        height: containerHeight
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenCV detection API returned ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Convert API response to ImageDetectionResult format
    return {
      rooms: result.rooms.map((room: any) => ({
        id: room.id,
        name: room.name,
        type: room.type,
        x: room.x,
        y: room.y,
        width: room.width,
        height: room.height,
        confidence: room.confidence || 0.85,
        points: room.points || []
      })),
      orientation: result.orientation || 'landscape',
      confidenceScore: result.confidenceScore || 0.85
    };
  } catch (error) {
    console.error('OpenCV room detection failed:', error);
    // When OpenCV detection fails, signal caller to try alternative methods
    throw error;
  }
};

/**
 * Detect rooms in a floor plan using available methods
 */
export const detectRooms = async (
  imageSrc: string, 
  containerWidth: number, 
  containerHeight: number,
  options?: {
    method?: 'neural' | 'traditional' | 'text-based' | 'opencv' | 'auto';
    useCache?: boolean;
  }
): Promise<ImageDetectionResult> => {
  const method = options?.method || 'auto';
  
  console.log(`Starting room detection with method: ${method}`);
  
  try {
    // Mark development environment for faster future calls
    if (process.env.NODE_ENV === 'development') {
      try {
        await fetch('/api/status', { method: 'GET' });
        localStorage.setItem('api-endpoints-available', 'true');
      } catch (error) {
        localStorage.setItem('api-endpoints-available', 'false');
        console.warn('API endpoints not available, will use client-side detection only');
      }
    }
    
    // OpenCV detection (new approach with server-side processing)
    if (method === 'opencv') {
      try {
        return await openCVRoomDetection(imageSrc, containerWidth, containerHeight);
      } catch (error) {
        console.warn('OpenCV detection failed, falling back to text-based detection');
        return await textBasedRoomDetection(imageSrc, containerWidth, containerHeight);
      }
    }
    
    // Text-based detection
    if (method === 'text-based') {
      return await textBasedRoomDetection(imageSrc, containerWidth, containerHeight);
    }
    
    // Neural network detection
    if (method === 'neural') {
      const result = await detectRoomsWithNeuralNetwork(
        imageSrc, 
        containerWidth, 
        containerHeight,
        traditionalRoomDetection
      );
      // Ensure orientation is correctly typed
      return {
        ...result,
        orientation: result.orientation === 'landscape' ? 'landscape' : 'portrait'
      };
    }
    
    // Traditional detection
    if (method === 'traditional') {
      const result = await traditionalRoomDetection(imageSrc, containerWidth, containerHeight);
      // Ensure orientation is correctly typed
      return {
        ...result,
        orientation: result.orientation === 'landscape' ? 'landscape' : 'portrait'
      };
    }
    
    // Auto mode - try each method in succession until one produces results
    // First try OpenCV-based approach (most reliable)
    if (!isDevelopmentWithoutApi()) {
      try {
        console.log('Trying OpenCV room detection first');
        const openCVResult = await openCVRoomDetection(imageSrc, containerWidth, containerHeight);
        
        // If we got enough rooms with reasonable confidence, use this result
        if (openCVResult.rooms.length > 0 && openCVResult.confidenceScore > 0.7) {
          console.log('OpenCV detection successful, using results');
          return openCVResult;
        }
        
        console.log('OpenCV detection produced limited results, trying text-based detection');
      } catch (err) {
        console.warn('OpenCV detection failed, continuing with alternative methods:', err);
      }
    } else {
      console.log('Skipping OpenCV detection in development mode without API endpoints');
    }
    
    // Try text-based approach as fallback
    try {
      console.log('Trying text-based room detection');
      const textBasedResult = await textBasedRoomDetection(imageSrc, containerWidth, containerHeight);
      
      // If we got enough rooms with reasonable confidence, use this result
      if (textBasedResult.rooms.length > 0 && textBasedResult.confidenceScore > 0.6) {
        console.log('Text-based detection successful, using results');
        return textBasedResult;
      }
      
      console.log('Text-based detection produced limited results, trying neural detection');
    } catch (err) {
      console.warn('Text-based detection failed, continuing with alternative methods:', err);
    }
    
    // Then try neural detection
    console.log('Trying neural network detection');
    try {
      const neuralResult = await detectRoomsWithNeuralNetwork(
        imageSrc, 
        containerWidth, 
        containerHeight,
        traditionalRoomDetection
      );
      
      // Ensure orientation is correctly typed
      return {
        ...neuralResult,
        orientation: neuralResult.orientation === 'landscape' ? 'landscape' : 'portrait'
      };
    } catch (err) {
      console.warn('Neural detection failed, falling back to traditional detection:', err);
      
      // Final fallback - traditional detection
      const traditionalResult = await traditionalRoomDetection(imageSrc, containerWidth, containerHeight);
      return {
        ...traditionalResult,
        orientation: traditionalResult.orientation === 'landscape' ? 'landscape' : 'portrait'
      };
    }
  } catch (error) {
    console.error('Room detection failed:', error);
    
    // Return empty result on failure
    return {
      rooms: [],
      orientation: 'landscape',
      confidenceScore: 0
    };
  }
}; 