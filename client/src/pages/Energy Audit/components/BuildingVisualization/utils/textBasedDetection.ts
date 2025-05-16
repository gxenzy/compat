/**
 * Text-based room detection algorithm
 * Uses OCR-like methods to detect room labels and flood fill from these points
 * Based on approach from https://ivanovi.ch/blog/2019/12/how-heatmap-works-3/
 */

import { DetectedRoom, ImageDetectionResult, Point } from '../interfaces/buildingInterfaces';
import { ROOM_NAMES } from '../constants/roomNames';

/**
 * Load image from source URL
 */
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // Set timeout to prevent hanging
    const timeout = setTimeout(() => {
      reject(new Error('Image loading timed out'));
    }, 15000);
    
    img.onload = () => {
      clearTimeout(timeout);
      if (img.width > 0 && img.height > 0) {
        console.log(`Text-based detection: Image loaded with dimensions ${img.width}x${img.height}`);
        resolve(img);
      } else {
        reject(new Error(`Image has invalid dimensions: ${img.width}x${img.height}`));
      }
    };
    
    img.onerror = (e) => {
      clearTimeout(timeout);
      console.error('Image loading error:', e);
      reject(new Error(`Failed to load image: ${src}`));
    };
    
    // Check if src is valid before setting
    if (!src || typeof src !== 'string') {
      clearTimeout(timeout);
      reject(new Error(`Invalid image source: ${src}`));
      return;
    }
    
    // Add timestamp to bypass cache if needed
    const cacheBuster = src.includes('?') ? `&_t=${Date.now()}` : `?_t=${Date.now()}`;
    img.src = src + cacheBuster;
  });
};

/**
 * Create canvas context from image
 */
const createImageCanvas = (img: HTMLImageElement): CanvasRenderingContext2D => {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  ctx.drawImage(img, 0, 0);
  return ctx;
};

/**
 * Extract floor information from image path
 */
const extractFloorFromPath = (path: string): string => {
  const floorMatches = [
    { pattern: /ground|1st/i, floor: 'ground' },
    { pattern: /mezz|2nd/i, floor: 'mezzanine' },
    { pattern: /2nd|second/i, floor: 'second' },
    { pattern: /3rd|third/i, floor: 'third' },
    { pattern: /4th|fourth/i, floor: 'fourth' },
    { pattern: /5th|fifth/i, floor: 'fifth' }
  ];
  
  for (const { pattern, floor } of floorMatches) {
    if (pattern.test(path)) {
      return floor;
    }
  }
  
  return 'unknown';
};

/**
 * Get room names for a specific floor
 */
const getRoomNamesForFloor = (floor: string): Record<string, string> => {
  return ROOM_NAMES[floor] || {};
};

/**
 * Detect text labels in the floor plan image
 * This uses a connected component approach to identify text-like elements
 */
const detectTextLabels = (ctx: CanvasRenderingContext2D): Array<{x: number, y: number, width: number, height: number, text?: string}> => {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Convert to grayscale for processing
  const grayscale = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    grayscale[i] = Math.round(
      0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
    );
  }
  
  // Use dynamic threshold to create binary image (text vs background)
  // Analyze histogram to find the optimal threshold
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < grayscale.length; i++) {
    histogram[grayscale[i]]++;
  }
  
  // Otsu's method for optimal threshold
  let threshold = 128; // Default threshold
  let maxVariance = 0;
  let sum = 0;
  let sumB = 0;
  let wB = 0;
  let wF = 0;
  
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }
  
  for (let i = 0; i < 256; i++) {
    wB += histogram[i]; // Weight Background
    if (wB === 0) continue;
    
    wF = grayscale.length - wB; // Weight Foreground
    if (wF === 0) break;
    
    sumB += i * histogram[i];
    const mB = sumB / wB; // Mean Background
    const mF = (sum - sumB) / wF; // Mean Foreground
    
    // Between class variance
    const variance = wB * wF * (mB - mF) * (mB - mF);
    
    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = i;
    }
  }
  
  console.log(`Calculated optimal threshold: ${threshold}`);
  
  // Use threshold with offset (slightly lower to catch more text)
  const binaryThreshold = Math.max(30, threshold - 20);
  const binary = new Uint8Array(width * height);
  
  for (let i = 0; i < grayscale.length; i++) {
    // Text (dark) pixels are represented by 1, background (light) by 0
    binary[i] = grayscale[i] < binaryThreshold ? 1 : 0;
  }
  
  // Connected component labeling to find text clusters
  const labels = new Int32Array(width * height).fill(0);
  let nextLabel = 1;
  
  // First pass: assign initial labels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      // Skip background pixels
      if (binary[idx] === 0) continue;
      
      // Check neighbors (8-connectivity for better text detection)
      const neighbors: number[] = [];
      
      // Check 8 surrounding pixels
      for (let ny = Math.max(0, y - 1); ny <= Math.min(height - 1, y + 1); ny++) {
        for (let nx = Math.max(0, x - 1); nx <= Math.min(width - 1, x + 1); nx++) {
          if (ny === y && nx === x) continue; // Skip the current pixel
          
          const nidx = ny * width + nx;
          if (binary[nidx] === 1 && labels[nidx] > 0) {
            neighbors.push(labels[nidx]);
          }
        }
      }
      
      if (neighbors.length === 0) {
        // No labeled neighbors, assign new label
        labels[idx] = nextLabel++;
      } else {
        // Use minimum of neighbor labels
        labels[idx] = Math.min(...neighbors);
      }
    }
  }
  
  // Second pass: merge equivalent labels
  const equivalences = new Array(nextLabel).fill(0);
  for (let i = 0; i < nextLabel; i++) {
    equivalences[i] = i;
  }
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      if (binary[idx] === 0) continue;
      
      const currentLabel = labels[idx];
      
      // Check 8-connected neighbors for different labels
      for (let ny = Math.max(0, y - 1); ny <= Math.min(height - 1, y + 1); ny++) {
        for (let nx = Math.max(0, x - 1); nx <= Math.min(width - 1, x + 1); nx++) {
          if (ny === y && nx === x) continue;
          
          const nidx = ny * width + nx;
          if (binary[nidx] === 1) {
            const neighborLabel = labels[nidx];
            // Unite the equivalence classes
            if (neighborLabel !== currentLabel) {
              const root1 = findRoot(equivalences, currentLabel);
              const root2 = findRoot(equivalences, neighborLabel);
              if (root1 !== root2) {
                equivalences[Math.max(root1, root2)] = Math.min(root1, root2);
              }
            }
          }
        }
      }
    }
  }
  
  // Update labels based on equivalences
  for (let i = 0; i < labels.length; i++) {
    if (labels[i] > 0) {
      labels[i] = findRoot(equivalences, labels[i]);
    }
  }
  
  // Analyze components to identify text-like elements
  const componentBounds = new Map<number, {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    pixelCount: number;
  }>();
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const label = labels[idx];
      
      if (label > 0) {
        if (!componentBounds.has(label)) {
          componentBounds.set(label, {
            minX: x,
            minY: y,
            maxX: x,
            maxY: y,
            pixelCount: 0
          });
        }
        
        const bounds = componentBounds.get(label)!;
        bounds.minX = Math.min(bounds.minX, x);
        bounds.minY = Math.min(bounds.minY, y);
        bounds.maxX = Math.max(bounds.maxX, x);
        bounds.maxY = Math.max(bounds.maxY, y);
        bounds.pixelCount++;
      }
    }
  }
  
  // Filter for text-like components with improved criteria
  const textLabels: Array<{x: number, y: number, width: number, height: number, text?: string}> = [];
  
  // Match against common room name patterns
  const roomPatterns = [
    /room\s*\d+/i,     // Room 123
    /office\s*\d*/i,   // Office, Office 1
    /conf(erence)?/i,  // Conference, Conf
    /meeting/i,        // Meeting Room
    /hallway/i,        // Hallway
    /lab(oratory)?/i,  // Lab, Laboratory
    /kitchen/i,        // Kitchen
    /toilet/i,         // Toilet
    /reception/i,      // Reception
    /lobby/i,          // Lobby
    /stairs/i,         // Stairs
    /elevator/i,       // Elevator
    /storage/i,        // Storage
    /pantry/i,         // Pantry
    /electrical/i,     // Electrical Room
    /mech(anical)?/i,  // Mechanical, Mech Room
    /server/i,         // Server Room
    /\d{1,3}/          // Just numbers (like 101, 102)
  ];
  
  componentBounds.forEach((bounds, label) => {
    const width = bounds.maxX - bounds.minX + 1;
    const height = bounds.maxY - bounds.minY + 1;
    const aspectRatio = width / height;
    
    // Text components typically have specific characteristics:
    // 1. Not too small (to avoid noise)
    // 2. Not too large (actual text labels, not large structures)
    // 3. Reasonable aspect ratio (not extremely thin or wide)
    // 4. Reasonable density (filled area compared to bounding box)
    
    const minTextSize = 5; // Minimum text size in pixels - lower to catch more text
    const maxTextWidth = Math.min(ctx.canvas.width, ctx.canvas.height) * 0.2; // Max 20% of canvas dimension
    const maxTextHeight = Math.min(ctx.canvas.width, ctx.canvas.height) * 0.07; // Max 7% of canvas dimension
    const minAspectRatio = 0.2;
    const maxAspectRatio = 15.0; // Higher to catch wider text
    const density = bounds.pixelCount / (width * height);
    const minDensity = 0.15; // At least 15% of the bounding box should be filled
    
    if (width >= minTextSize && height >= minTextSize &&
        width <= maxTextWidth && height <= maxTextHeight &&
        aspectRatio >= minAspectRatio && aspectRatio <= maxAspectRatio &&
        density >= minDensity) {
        
      // Extract the text content by creating a temporary canvas
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        // Draw the region to the temp canvas
        tempCtx.drawImage(
          ctx.canvas,
          bounds.minX, bounds.minY, width, height,
          0, 0, width, height
        );
        
        // Use a browser-based OCR library if available, or
        // manually analyze for basic text pattern detection
        const tempImageData = tempCtx.getImageData(0, 0, width, height);
        const tempData = tempImageData.data;
        
        // Enhance contrast to make text more visible
        for (let i = 0; i < tempData.length; i += 4) {
          const avg = (tempData[i] + tempData[i + 1] + tempData[i + 2]) / 3;
          const newVal = avg < 128 ? 0 : 255;
          tempData[i] = tempData[i + 1] = tempData[i + 2] = newVal;
        }
        tempCtx.putImageData(tempImageData, 0, 0);
        
        // TODO: In a real implementation, we'd use a proper OCR here
        // For now, we'll just use these extracted regions as potential room labels
        const detectedText = ''; // Placeholder for OCR result
        
        // Check if this matches a room pattern
        const isRoomLabel = roomPatterns.some(pattern => pattern.test(detectedText));
        
        // All text regions are considered potential room labels
        textLabels.push({
          x: bounds.minX, 
          y: bounds.minY,
          width, 
          height,
          text: detectedText || undefined
        });
      }
    }
  });
  
  return textLabels;
};

// Helper function to find the root of an equivalence class
function findRoot(equivalences: number[], label: number): number {
  while (equivalences[label] !== label) {
    label = equivalences[label];
  }
  return label;
}

/**
 * Flood fill algorithm to identify room boundaries from a starting point
 * This will fill outward until it hits walls (darker pixels)
 */
const floodFill = (
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  wallThreshold: number
): {
  x: number;
  y: number;
  width: number;
  height: number;
  polygon: Point[];
} => {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Convert to grayscale for processing
  const grayscale = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    grayscale[i] = Math.round(
      0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
    );
  }
  
  // Create a visited map
  const visited = new Uint8Array(width * height);
  // Queue for BFS
  const queue: [number, number][] = [[Math.floor(startX), Math.floor(startY)]];
  // Track the boundaries of the filled region
  let minX = width, minY = height, maxX = 0, maxY = 0;
  
  // Track the filled pixels for polygon creation
  const filledPixels: Point[] = [];
  
  // BFS to fill the region
  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    const idx = y * width + x;
    
    // Skip if out of bounds, already visited, or is a wall
    if (x < 0 || x >= width || y < 0 || y >= height || 
        visited[idx] === 1 || grayscale[idx] < wallThreshold) {
      continue;
    }
    
    // Mark as visited
    visited[idx] = 1;
    
    // Update boundaries
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    
    // Add to filled pixels
    filledPixels.push({ x, y });
    
    // Explore neighbors (4-connectivity)
    queue.push([x + 1, y]);
    queue.push([x - 1, y]);
    queue.push([x, y + 1]);
    queue.push([x, y - 1]);
  }
  
  // If the fill reaches the edges of the image, it's likely not a valid room
  const isTouchingEdge = minX <= 1 || minY <= 1 || maxX >= width - 2 || maxY >= height - 2;
  
  // Extract room boundaries using the filled region
  if (isTouchingEdge) {
    // If touching edge, create a smaller default room around the seed point
    const defaultSize = Math.min(width, height) * 0.1;
    minX = Math.max(0, Math.floor(startX - defaultSize / 2));
    minY = Math.max(0, Math.floor(startY - defaultSize / 2));
    maxX = Math.min(width - 1, Math.floor(startX + defaultSize / 2));
    maxY = Math.min(height - 1, Math.floor(startY + defaultSize / 2));
  }
  
  // Extract simplified polygon from filled pixels (if we have enough points)
  const polygon = filledPixels.length > 10 ? extractPolygon(filledPixels) : 
    [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY }
    ];
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    polygon
  };
};

/**
 * Extract a simplified polygon from the set of filled pixels
 * Uses a convex hull or boundary tracing algorithm
 */
const extractPolygon = (pixels: Point[]): Point[] => {
  // For simplicity, we'll just return a rectangular outline
  // A more sophisticated version could use convex hull or contour tracing
  
  // Find min/max coordinates
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  pixels.forEach(pixel => {
    minX = Math.min(minX, pixel.x);
    minY = Math.min(minY, pixel.y);
    maxX = Math.max(maxX, pixel.x);
    maxY = Math.max(maxY, pixel.y);
  });
  
  // Create rectangle polygon
  return [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY }
  ];
};

/**
 * Determine room type based on size and aspect ratio
 */
const determineRoomType = (
  area: number, 
  aspectRatio: number, 
  x: number, 
  y: number, 
  floor: string
): string => {
  // Simple room type classification based on size and aspect ratio
  if (aspectRatio < 0.3 || aspectRatio > 3.5) {
    return 'Hallway';
  }
  
  if (area < 3000) {
    return 'Office';
  }
  
  if (area > 8000) {
    return 'Laboratory';
  }
  
  return 'Room';
};

/**
 * Determine room name based on type and floor
 */
const determineRoomName = (
  roomType: string, 
  index: number, 
  floor: string, 
  floorRoomNames: Record<string, string>
): string => {
  // Use predefined room names if available
  const roomNameList = Object.values(floorRoomNames);
  
  if (index < roomNameList.length) {
    return roomNameList[index];
  }
  
  // Generate a name based on room type and index
  return `${roomType} ${index + 1}`;
};

/**
 * Calculate confidence score for a detected room
 */
const calculateConfidence = (
  area: number, 
  aspectRatio: number, 
  roomType: string
): number => {
  // Base confidence
  let confidence = 0.7;
  
  // Adjust based on aspect ratio (prefer more square-like rooms)
  const aspectRatioScore = aspectRatio > 0.7 && aspectRatio < 1.5 ? 0.2 : 0;
  
  // Adjust based on area (medium sized rooms are more likely to be correct)
  const areaScore = area > 3000 && area < 15000 ? 0.1 : 0;
  
  return Math.min(0.95, confidence + aspectRatioScore + areaScore);
};

/**
 * Main text-based room detection algorithm
 */
export const textBasedRoomDetection = async (
  imageSrc: string, 
  containerWidth: number, 
  containerHeight: number
): Promise<ImageDetectionResult> => {
  console.log('Using text-based room detection algorithm');
  
  // Extract floor information from image path
  const floor = extractFloorFromPath(imageSrc);
  console.log(`Detected floor: ${floor}`);
  
  // Get floor-specific room names
  const floorRoomNames = getRoomNamesForFloor(floor);
  
  // Measure performance
  const startTime = performance.now();
  
  // Load image and create canvas
  const img = await loadImage(imageSrc);
  console.log(`Image loaded: ${img.width}x${img.height}`);
  
  // Determine image orientation
  const orientation: 'landscape' | 'portrait' = img.width > img.height ? 'landscape' : 'portrait';
  console.log(`Image orientation: ${orientation}`);
  
  // Create context for processing
  const ctx = createImageCanvas(img);
  
  // Detect text elements (instead of removing them)
  const textLabels = detectTextLabels(ctx);
  console.log(`Detected ${textLabels.length} potential text labels`);
  
  // Wall detection threshold (adjustable based on image characteristics)
  // Walls are typically darker, so we use a threshold to distinguish walls from floors
  const wallThreshold = 180; // Pixels darker than this are considered walls

  // Calculate scaling factors based on container dimensions
  const scaleX = containerWidth / ctx.canvas.width;
  const scaleY = containerHeight / ctx.canvas.height;
  
  // Start flood fill from each detected text label to find rooms
  const detectedRoomRegions: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    polygon: Point[];
  }> = [];
  
  for (const label of textLabels) {
    // Use the center of the text label as the starting point
    const startX = label.x;
    const startY = label.y;
    
    // Perform flood fill to detect room boundaries
    const roomRegion = floodFill(ctx, startX, startY, wallThreshold);
    
    // Filter out tiny or huge regions (not likely to be actual rooms)
    const minRoomSize = Math.min(ctx.canvas.width, ctx.canvas.height) * 0.02; // 2% of image dimension
    const maxRoomSize = Math.max(ctx.canvas.width, ctx.canvas.height) * 0.6; // 60% of image dimension
    
    if (roomRegion.width >= minRoomSize && roomRegion.height >= minRoomSize &&
        roomRegion.width <= maxRoomSize && roomRegion.height <= maxRoomSize) {
      detectedRoomRegions.push(roomRegion);
    }
  }
  
  console.log(`Detected ${detectedRoomRegions.length} room regions using text-based flood fill`);
  
  // Remove overlapping rooms by merging or choosing the larger one
  const finalRoomRegions = removeOverlappingRegions(detectedRoomRegions);
  
  // Generate rooms from the detected regions
  const rooms: DetectedRoom[] = finalRoomRegions.map((region, index) => {
    // Scale coordinates to container size
    const scaledX = Math.round(region.x * scaleX);
    const scaledY = Math.round(region.y * scaleY);
    const scaledWidth = Math.round(region.width * scaleX);
    const scaledHeight = Math.round(region.height * scaleY);
    
    // Calculate room characteristics
    const area = scaledWidth * scaledHeight;
    const aspectRatio = scaledWidth / scaledHeight;
    
    // Determine room type and name
    const roomType = determineRoomType(area, aspectRatio, scaledX, scaledY, floor);
    const roomName = determineRoomName(roomType, index, floor, floorRoomNames);
    
    // Generate unique ID
    const id = `room-${floor}-${Date.now()}-${index}`;
    
    // Calculate confidence
    const confidence = calculateConfidence(area, aspectRatio, roomType);
    
    // Scale polygon points if available
    const scaledPolygon = region.polygon.map(point => ({
      x: Math.round(point.x * scaleX),
      y: Math.round(point.y * scaleY)
    }));
    
    return {
      id,
      name: roomName,
      x: scaledX,
      y: scaledY,
      width: scaledWidth,
      height: scaledHeight,
      confidence,
      type: roomType.toLowerCase(),
      polygon: scaledPolygon
    };
  });
  
  const processingTime = performance.now() - startTime;
  console.log(`Text-based room detection completed in ${processingTime.toFixed(0)}ms, found ${rooms.length} rooms`);
  
  // Calculate overall confidence score
  const overallConfidence = rooms.length > 0 
    ? rooms.reduce((sum, room) => sum + (room.confidence || 0.5), 0) / rooms.length
    : 0.5;
  
  return {
    rooms,
    orientation,
    confidenceScore: overallConfidence
  };
};

/**
 * Remove overlapping room regions by keeping the larger one
 */
const removeOverlappingRegions = <T extends {x: number, y: number, width: number, height: number}>(
  regions: T[]
): T[] => {
  if (regions.length <= 1) {
    return regions;
  }
  
  // Sort by area (descending)
  const sortedRegions = [...regions].sort((a, b) => 
    (b.width * b.height) - (a.width * a.height)
  );
  
  const finalRegions: T[] = [];
  
  for (const region of sortedRegions) {
    // Check if this region overlaps significantly with any already added region
    let isOverlapping = false;
    
    for (const existingRegion of finalRegions) {
      // Calculate overlap area
      const xOverlap = Math.max(0, 
        Math.min(region.x + region.width, existingRegion.x + existingRegion.width) - 
        Math.max(region.x, existingRegion.x)
      );
      
      const yOverlap = Math.max(0,
        Math.min(region.y + region.height, existingRegion.y + existingRegion.height) - 
        Math.max(region.y, existingRegion.y)
      );
      
      const overlapArea = xOverlap * yOverlap;
      const regionArea = region.width * region.height;
      const overlapRatio = overlapArea / regionArea;
      
      // If overlap is more than 30%, consider it as duplicate
      if (overlapRatio > 0.3) {
        isOverlapping = true;
        break;
      }
    }
    
    if (!isOverlapping) {
      finalRegions.push(region);
    }
  }
  
  return finalRegions;
}; 