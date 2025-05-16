import { DetectedRoom, ImageDetectionResult, RoomDetail } from '../interfaces';
import { Point } from '../interfaces/buildingInterfaces';
import { getItem, setItem } from '../../../../../utils/storageUtils';
import { solDataService } from '../services/solDataService';
import { neuralDetection, detectRoomsWithNeuralNetwork } from './neuralDetection';
import { ROOM_NAMES } from '../constants/roomNames';

// Class mapping for room types based on actual building data
const ROOM_CLASS_MAPPING: Record<string, string> = {
  'office': 'Office',
  'classroom': 'Classroom',
  'restroom': 'Restroom',
  'laboratory': 'Laboratory',
  'storage': 'Storage',
  'electrical': 'Electrical Room',
  'hallway': 'Hallway',
  'stairs': 'Staircase',
  'cisco': 'Computer Laboratory',
  'faculty': 'Faculty Room',
  'kitchen': 'Kitchen',
  'lobby': 'Lobby'
};

// Track processing state
let isProcessing = false;

/**
 * Loads the image and prepares it for processing
 */
const loadImage = (imageSrc: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // Set timeout to prevent hanging
    const timeout = setTimeout(() => {
      reject(new Error('Image loading timed out'));
    }, 15000); // Longer timeout for potentially slow connections
    
    img.onload = () => {
      clearTimeout(timeout);
      if (img.width > 0 && img.height > 0) {
        console.log(`Traditional detection: Image loaded with dimensions ${img.width}x${img.height}`);
        resolve(img);
      } else {
        reject(new Error(`Image has invalid dimensions: ${img.width}x${img.height}`));
      }
    };
    
    img.onerror = (e) => {
      clearTimeout(timeout);
      console.error('Image loading error:', e);
      reject(new Error(`Failed to load image: ${imageSrc}`));
    };
    
    // Check if src is valid before setting
    if (!imageSrc || typeof imageSrc !== 'string') {
      clearTimeout(timeout);
      reject(new Error(`Invalid image source: ${imageSrc}`));
      return;
    }
    
    // Add timestamp to bypass cache if needed
    const cacheBuster = imageSrc.includes('?') ? `&_t=${Date.now()}` : `?_t=${Date.now()}`;
    img.src = imageSrc + cacheBuster;
  });
};

/**
 * Create a canvas with the image for processing
 */
const createImageCanvas = (img: HTMLImageElement): CanvasRenderingContext2D => {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }
  
  ctx.drawImage(img, 0, 0, img.width, img.height);
  return ctx;
};

/**
 * Enhanced text elements removal with better detection of labels and annotations
 * This helps prevent floor plan text from being detected as architectural elements
 */
const removeTextElements = (ctx: CanvasRenderingContext2D): void => {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Clear standard areas that typically contain text
  // Bottom margin (page numbers, figure text)
  const bottomThreshold = height * 0.92;
  // Top margin (title text, figure numbers)
  const titleAreaThreshold = height * 0.08;
  // Side margins (legends, notes)
  const sideThreshold = width * 0.07;
  
  // Remove text at the bottom (page numbers, figure labels)
  for (let y = Math.floor(bottomThreshold); y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      data[idx] = 255;      // R
      data[idx + 1] = 255;  // G
      data[idx + 2] = 255;  // B
      data[idx + 3] = 255;  // A
    }
  }
  
  // Remove text at the top (title area, "Power Layout", "Lighting Layout")
  for (let y = 0; y < titleAreaThreshold; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = 255;
    }
  }
  
  // Remove text on the sides (often contains legends or notes)
  for (let y = 0; y < height; y++) {
    // Left side
    for (let x = 0; x < sideThreshold; x++) {
      const idx = (y * width + x) * 4;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = 255;
    }
    
    // Right side
    for (let x = width - sideThreshold; x < width; x++) {
      const idx = (y * width + x) * 4;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = 255;
    }
  }
  
  // Enhanced detection for "Figure" labels which are often in the corners
  const cornerSize = Math.min(width, height) * 0.15;
  
  // Bottom-right corner (often contains figure numbers)
  for (let y = height - cornerSize; y < height; y++) {
    for (let x = width - cornerSize; x < width; x++) {
      const idx = (y * width + x) * 4;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = 255;
    }
  }
  
  // Bottom-left corner (sometimes contains page references)
  for (let y = height - cornerSize; y < height; y++) {
    for (let x = 0; x < cornerSize; x++) {
      const idx = (y * width + x) * 4;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = 255;
    }
  }
  
  // Text detection in the entire image using connected component analysis
  // This detects and removes text labels inside the floor plan
  detectAndRemoveText(ctx, data, width, height);
  
  // New: Enhanced detection for small text blocks, figures, and annotations
  detectAndRemoveFigureText(data, width, height);
  
  ctx.putImageData(imageData, 0, 0);
};

/**
 * New function: Enhanced detection for figure labels, small annotations and number indicators
 * Uses more sophisticated pattern recognition to identify text-like elements inside the floor plan
 */
const detectAndRemoveFigureText = (data: Uint8ClampedArray, width: number, height: number): void => {
  // First pass: identify potential text areas by looking for specific patterns
  // Text typically has high contrast edges in small areas
  
  // Create an edge strength map
  const edgeStrength = new Uint8Array(width * height);
  const textProbability = new Float32Array(width * height);
  
  // Simple edge detection
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Get pixel and surrounding pixel values
      const centerLuminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      
      const topIdx = ((y - 1) * width + x) * 4;
      const bottomIdx = ((y + 1) * width + x) * 4;
      const leftIdx = (y * width + (x - 1)) * 4;
      const rightIdx = (y * width + (x + 1)) * 4;
      
      const topLuminance = 0.299 * data[topIdx] + 0.587 * data[topIdx + 1] + 0.114 * data[topIdx + 2];
      const bottomLuminance = 0.299 * data[bottomIdx] + 0.587 * data[bottomIdx + 1] + 0.114 * data[bottomIdx + 2];
      const leftLuminance = 0.299 * data[leftIdx] + 0.587 * data[leftIdx + 1] + 0.114 * data[leftIdx + 2];
      const rightLuminance = 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];
      
      // Calculate gradient
      const gradient = Math.abs(topLuminance - bottomLuminance) + Math.abs(leftLuminance - rightLuminance);
      
      // High gradient = potential text edge
      edgeStrength[y * width + x] = Math.min(255, gradient);
    }
  }
  
  // Second pass: Identify text-like patterns
  // Text typically has high edge density in small regions with distinctive patterns
  const blockSize = 8;
  const textDensityThreshold = 0.15; // Percentage of high edge pixels to consider as text
  
  // Analyze blocks of pixels for text-like patterns
  for (let by = 0; by < height; by += blockSize) {
    for (let bx = 0; bx < width; bx += blockSize) {
      let edgeCount = 0;
      let pixelCount = 0;
      
      // Count edge pixels in this block
      for (let y = by; y < by + blockSize && y < height; y++) {
        for (let x = bx; x < bx + blockSize && x < width; x++) {
          pixelCount++;
          if (edgeStrength[y * width + x] > 50) {
            edgeCount++;
          }
        }
      }
      
      // Calculate edge density
      const edgeDensity = edgeCount / pixelCount;
      const textLikelihood = edgeDensity > textDensityThreshold ? 0.8 : 0;
      
      // Mark all pixels in this block with text likelihood
      for (let y = by; y < by + blockSize && y < height; y++) {
        for (let x = bx; x < bx + blockSize && x < width; x++) {
          textProbability[y * width + x] = textLikelihood;
        }
      }
    }
  }
  
  // Third pass: Refine text regions
  // Use clustering to identify and remove isolated text regions
  const textThreshold = 0.7;
  const visited = new Uint8Array(width * height);
  const queue: Array<[number, number]> = [];
  
  // Identify and remove text clusters
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      // Skip if not text or already visited
      if (textProbability[idx] < textThreshold || visited[idx]) continue;
      
      // Found a text pixel, do BFS to find connected text region
      queue.push([x, y]);
      visited[idx] = 1;
      
      let clusterSize = 0;
      const clusterPixels: Array<[number, number]> = [];
      
      while (queue.length > 0) {
        const [cx, cy] = queue.shift()!;
        clusterSize++;
        clusterPixels.push([cx, cy]);
        
        // Check neighbors
        const neighbors = [
          [cx - 1, cy], [cx + 1, cy],
          [cx, cy - 1], [cx, cy + 1]
        ];
        
        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nidx = ny * width + nx;
            if (textProbability[nidx] >= textThreshold && !visited[nidx]) {
              queue.push([nx, ny]);
              visited[nidx] = 1;
            }
          }
        }
      }
      
      // If cluster is within the text size range, remove it
      if (clusterSize >= 5 && clusterSize <= 1000) {
        // Remove the text by setting pixels to white
        clusterPixels.forEach(([px, py]) => {
          const pidx = (py * width + px) * 4;
          data[pidx] = 255;
          data[pidx + 1] = 255;
          data[pidx + 2] = 255;
          data[pidx + 3] = 255;
        });
      }
    }
  }
};

/**
 * Advanced text detection and removal across the entire image
 * Uses connected component analysis to find and remove text-like elements
 */
const detectAndRemoveText = (
  ctx: CanvasRenderingContext2D, 
  data: Uint8ClampedArray, 
  width: number, 
  height: number
): void => {
  // Convert to grayscale for processing
  const grayscale = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    grayscale[i] = Math.round(
      0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
    );
  }
  
  // Detect text-like components (small, isolated dark regions)
  // These are typical characteristics of text in floor plans
  const binaryThreshold = 180;
  const binary = new Uint8Array(width * height);
  
  for (let i = 0; i < grayscale.length; i++) {
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
      
      // Check neighbors (4-connectivity)
      const neighbors: number[] = [];
      
      if (x > 0 && binary[idx - 1] === 1) {
        neighbors.push(labels[idx - 1]);
      }
      
      if (y > 0 && binary[idx - width] === 1) {
        neighbors.push(labels[idx - width]);
      }
      
      if (neighbors.length === 0) {
        // No labeled neighbors, assign new label
        labels[idx] = nextLabel++;
      } else {
        // Use minimum of neighbor labels
        labels[idx] = Math.min(...neighbors.filter(n => n > 0));
      }
    }
  }
  
  // Analyze components to identify text-like elements
  const componentSizes = new Map<number, number>();
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    if (label > 0) {
      componentSizes.set(label, (componentSizes.get(label) || 0) + 1);
    }
  }
  
  // Filter for text-like components (small size is characteristic of text)
  const textSizeThresholdMin = 5;   // Min pixels for text component
  const textSizeThresholdMax = 300; // Max pixels for text component
  
  const textComponents = new Set<number>();
  
  componentSizes.forEach((size, label) => {
    if (size >= textSizeThresholdMin && size <= textSizeThresholdMax) {
      textComponents.add(label);
    }
  });
  
  // Remove detected text components
  for (let i = 0; i < labels.length; i++) {
    if (textComponents.has(labels[i])) {
      const idx = i * 4;
      // Set to white
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = 255;
    }
  }
};

/**
 * Extract architecture-based contours from the floor plan
 * Enhanced to better handle different image orientations
 */
const extractRoomContours = (ctx: CanvasRenderingContext2D): Promise<{x: number, y: number, width: number, height: number}[]> => {
  return new Promise((resolve) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Pre-process the image based on orientation
    const isLandscape = width > height;
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Use setTimeout to keep UI responsive
    setTimeout(() => {
      console.log('Starting architectural contour extraction');
      
      // Step 1: Convert to grayscale
      const grayData = new Uint8Array(width * height);
      for (let i = 0; i < data.length; i += 4) {
        // Standard grayscale conversion (weighted)
        grayData[i / 4] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      }
      
      // Step 2: Apply threshold to create binary image (walls vs space)
      // Adjust threshold based on image orientation - landscapes may have different lighting
      const threshold = isLandscape ? 175 : 185;
      const binaryData = new Uint8Array(width * height);
      
      for (let i = 0; i < grayData.length; i++) {
        // Black (walls) are represented by 255, white (space) by 0
        binaryData[i] = grayData[i] < threshold ? 255 : 0;
      }
      
      // Step 3: Apply morphological operations to enhance wall definition
      setTimeout(() => {
        console.log('Enhancing architectural features');
        
        // Dilate to connect broken wall lines
        const dilatedData = new Uint8Array(width * height);
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            // Check if any neighbor is a wall
            let hasWall = false;
            for (let ny = Math.max(0, y - 1); ny <= Math.min(height - 1, y + 1); ny++) {
              for (let nx = Math.max(0, x - 1); nx <= Math.min(width - 1, x + 1); nx++) {
                if (binaryData[ny * width + nx] === 255) {
                  hasWall = true;
                  break;
                }
              }
              if (hasWall) break;
            }
            
            dilatedData[y * width + x] = hasWall ? 255 : 0;
          }
        }
        
        // Find rooms by inverting (rooms are the spaces between walls)
        const invertedData = new Uint8Array(width * height);
        for (let i = 0; i < dilatedData.length; i++) {
          invertedData[i] = dilatedData[i] === 255 ? 0 : 255;
        }
        
        // Step 4: Connected component analysis to identify distinct rooms
        setTimeout(() => {
          console.log('Room identification in progress');
          
          // Connected component labeling algorithm
          // This will identify separate enclosed areas as unique rooms
          const labels = new Int32Array(width * height).fill(0);
          let nextLabel = 1;
          const equivalences: number[][] = [];
          
          // First pass: assign initial labels
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = y * width + x;
              
              // Skip wall pixels
              if (invertedData[idx] === 0) continue;
              
              // Check west and north neighbors
              const westIdx = x > 0 ? idx - 1 : -1;
              const northIdx = y > 0 ? idx - width : -1;
              
              const westLabel = westIdx >= 0 && invertedData[westIdx] === 255 ? labels[westIdx] : 0;
              const northLabel = northIdx >= 0 && invertedData[northIdx] === 255 ? labels[northIdx] : 0;
              
              if (westLabel === 0 && northLabel === 0) {
                // New component
                labels[idx] = nextLabel++;
                equivalences.push([labels[idx]]);
              } else if (westLabel !== 0 && northLabel === 0) {
                // Connected to west
                labels[idx] = westLabel;
              } else if (westLabel === 0 && northLabel !== 0) {
                // Connected to north
                labels[idx] = northLabel;
              } else {
                // Connected to both, use smaller label and note equivalence
                labels[idx] = Math.min(westLabel, northLabel);
                
                // Record equivalence if different
                if (westLabel !== northLabel) {
                  const westEquiv = equivalences.find(eq => eq.includes(westLabel));
                  const northEquiv = equivalences.find(eq => eq.includes(northLabel));
                  
                  if (westEquiv === northEquiv && westEquiv) {
                    // Already in same equivalence class
                    continue;
                  } else if (westEquiv && northEquiv) {
                    // Merge equivalence classes
                    westEquiv.push(...northEquiv);
                    equivalences.splice(equivalences.indexOf(northEquiv), 1);
                  } else if (westEquiv) {
                    // Add north label to west's equivalence class
                    westEquiv.push(northLabel);
                  } else if (northEquiv) {
                    // Add west label to north's equivalence class
                    northEquiv.push(westLabel);
                  } else {
                    // Create new equivalence class
                    equivalences.push([westLabel, northLabel]);
                  }
                }
              }
            }
          }
          
          // Flatten equivalence classes and create mapping to canonical labels
          const canonicalLabels = new Map<number, number>();
          equivalences.forEach((eq, i) => {
            const canonicalLabel = Math.min(...eq);
            eq.forEach(label => {
              canonicalLabels.set(label, canonicalLabel);
            });
          });
          
          // Second pass: resolve equivalences
          for (let i = 0; i < labels.length; i++) {
            if (labels[i] > 0) {
              labels[i] = canonicalLabels.get(labels[i]) || labels[i];
            }
          }
          
          // Analyze regions to find rooms
          const regions = new Map<number, {
            minX: number;
            minY: number;
            maxX: number;
            maxY: number;
            area: number;
            perimeter: number;
          }>();
          
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const label = labels[y * width + x];
              
              if (label > 0) {
                if (!regions.has(label)) {
                  regions.set(label, {
                    minX: x,
                    minY: y,
                    maxX: x,
                    maxY: y,
                    area: 0,
                    perimeter: 0
                  });
                }
                
                const region = regions.get(label)!;
                region.minX = Math.min(region.minX, x);
                region.minY = Math.min(region.minY, y);
                region.maxX = Math.max(region.maxX, x);
                region.maxY = Math.max(region.maxY, y);
                region.area++;
                
                // Check if this is a perimeter pixel
                const isPerimeter = 
                  x === 0 || 
                  y === 0 || 
                  x === width - 1 || 
                  y === height - 1 ||
                  labels[y * width + (x - 1)] !== label ||
                  labels[y * width + (x + 1)] !== label ||
                  labels[(y - 1) * width + x] !== label ||
                  labels[(y + 1) * width + x] !== label;
                
                if (isPerimeter) {
                  region.perimeter++;
                }
              }
            }
          }
          
          // Set adaptive size thresholds based on image dimensions
          // This ensures proper detection on both portrait and landscape orientations
          const minRoomSizePercent = 0.02; // 2% of image dimension
          const maxRoomSizePercent = 0.7; // 70% of image dimension
          
          const minRoomSize = Math.min(width, height) * minRoomSizePercent;
          const maxRoomSize = Math.max(width, height) * maxRoomSizePercent;
          
          const rectangles: {x: number, y: number, width: number, height: number}[] = [];
          
          regions.forEach((region) => {
            const rectWidth = region.maxX - region.minX + 1;
            const rectHeight = region.maxY - region.minY + 1;
            const aspectRatio = rectWidth / rectHeight;
            
            // Compute compactness (area / perimeter^2) - circle has highest compactness
            const compactness = region.area / (region.perimeter * region.perimeter);
            
            // Compute fill ratio (area / bounding box area)
            const fillRatio = region.area / (rectWidth * rectHeight);
            
            // Filter thresholds adjusted for orientation
            const minAspectRatio = isLandscape ? 0.1 : 0.15;
            const maxAspectRatio = isLandscape ? 10 : 8;
            const minFillRatio = isLandscape ? 0.4 : 0.45;
            const minCompactness = 0.01;
            
            // Filter by size, shape and density
            if (rectWidth > minRoomSize && rectHeight > minRoomSize &&
                rectWidth < maxRoomSize && rectHeight < maxRoomSize &&
                aspectRatio > minAspectRatio && aspectRatio < maxAspectRatio &&
                fillRatio > minFillRatio && compactness > minCompactness) {
              
              rectangles.push({
                x: region.minX,
                y: region.minY,
                width: rectWidth,
                height: rectHeight
              });
            }
          });
          
          console.log(`Found ${rectangles.length} architectural room contours`);
          
          // Remove overlapping room regions
          const finalRegions = removeOverlappingRegions(rectangles);
          resolve(finalRegions);
        }, 50);
      }, 50);
    }, 0);
  });
};

/**
 * Remove regions that overlap significantly or are contained within others
 */
const removeOverlappingRegions = (regions: {x: number, y: number, width: number, height: number}[]): {x: number, y: number, width: number, height: number}[] => {
  if (regions.length <= 1) return regions;
  
  // Sort by area (largest first)
  const sortedRegions = [...regions].sort((a, b) => 
    (b.width * b.height) - (a.width * a.height)
  );
  
  const result: {x: number, y: number, width: number, height: number}[] = [];
  
  // Keep largest rooms, discard significantly overlapping smaller rooms
  for (const region of sortedRegions) {
    let shouldAdd = true;
    
    // Check against all previously added regions
    for (const addedRegion of result) {
      // Calculate intersection
      const xOverlap = Math.max(0, Math.min(region.x + region.width, addedRegion.x + addedRegion.width) - 
                               Math.max(region.x, addedRegion.x));
      const yOverlap = Math.max(0, Math.min(region.y + region.height, addedRegion.y + addedRegion.height) - 
                               Math.max(region.y, addedRegion.y));
      const overlapArea = xOverlap * yOverlap;
      
      const regionArea = region.width * region.height;
      const overlapRatio = overlapArea / regionArea;
      
      // Discard if significant overlap
      if (overlapRatio > 0.35) {
        shouldAdd = false;
        break;
      }
    }
    
    if (shouldAdd) {
      result.push(region);
    }
  }
  
  return result;
};

/**
 * Extract floor name from image path
 */
const extractFloorFromPath = (imagePath: string): string => {
  const lowerPath = imagePath.toLowerCase();
  
  if (lowerPath.includes('ground')) return 'ground';
  if (lowerPath.includes('mezzanine')) return 'mezzanine';
  if (lowerPath.includes('second')) return 'second';
  if (lowerPath.includes('third')) return 'third';
  if (lowerPath.includes('fourth')) return 'fourth';
  if (lowerPath.includes('fifth')) return 'fifth';
  
  return 'unknown';
};

/**
 * Get room names for a specific floor
 */
const getRoomNamesForFloor = (floor: string): Record<string, string> => {
  return ROOM_NAMES[floor] || {};
};

/**
 * Adaptive Learning System for Room Detection
 * This system learns from previous detections to improve future accuracy
 */
class AdaptiveLearningSystem {
  private readonly STORAGE_KEY = 'room-detection-learning';
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.75;
  private readonly MAX_SAMPLES_PER_FLOOR = 5;
  private readonly RECENCY_WEIGHT = 0.6; // Weight for recency in pattern matching

  /**
   * Save a successful detection for future learning
   */
  saveDetection(rooms: DetectedRoom[], floorId: string, confidence: number): void {
    try {
      // Only save high-confidence detections
      if (confidence < this.MIN_CONFIDENCE_THRESHOLD) return;
      
      console.log(`Saving detection with ${rooms.length} rooms at ${confidence.toFixed(2)} confidence`);
      
      // Get existing learning data
      const learningData: Record<string, any[]> = getItem<Record<string, any[]>>(this.STORAGE_KEY, {}) || {};
      
      // Initialize floor array if needed
      if (!learningData[floorId]) {
        learningData[floorId] = [];
      }
      
      // Add new detection with timestamp
      learningData[floorId].push({
        timestamp: Date.now(),
        confidence,
        rooms: rooms.map(room => ({
          id: room.id,
          name: room.name,
          type: room.type,
          x: room.x,
          y: room.y,
          width: room.width,
          height: room.height
        }))
      });
      
      // Keep only the most recent detections
      if (learningData[floorId].length > this.MAX_SAMPLES_PER_FLOOR) {
        // Sort by timestamp (newest first) and confidence
        learningData[floorId].sort((a, b) => {
          const recencyDiff = b.timestamp - a.timestamp;
          const confidenceDiff = b.confidence - a.confidence;
          // Weight recency more than confidence
          return (recencyDiff * this.RECENCY_WEIGHT) + (confidenceDiff * (1 - this.RECENCY_WEIGHT));
        });
        
        // Keep only the best samples
        learningData[floorId] = learningData[floorId].slice(0, this.MAX_SAMPLES_PER_FLOOR);
      }
      
      // Save updated data
      setItem(this.STORAGE_KEY, learningData);
      
    } catch (error) {
      console.error('Error saving detection learning data:', error);
    }
  }
  
  /**
   * Apply learned patterns to improve a new detection
   */
  enhanceDetection(detectedRooms: DetectedRoom[], floorId: string): DetectedRoom[] {
    try {
      // Clone rooms to avoid modifying originals
      const enhancedRooms = [...detectedRooms];
      
      // Get learning data
      const learningData = getItem<Record<string, any[]>>(this.STORAGE_KEY, {});
      
      // If no data for this floor, return original
      if (!learningData || !learningData[floorId] || learningData[floorId].length === 0) {
        return enhancedRooms;
      }
      
      console.log(`Applying learning from ${learningData[floorId].length} previous detections`);
      
      // Get SOL data for this floor for better room naming
      const solData = solDataService.getFloorSOLData(floorId);
      const solRoomNames = solData ? 
        solData.schedules.reduce((names: Record<string, string>, schedule: { roomId: string; panelName: string }) => {
          if (schedule.roomId) names[schedule.roomId] = schedule.panelName.replace(' Panel', '');
          return names;
        }, {} as Record<string, string>) : {};
      
      // Calculate consistency scores for each detection
      const patternConsistency = this.calculatePatternConsistency(learningData[floorId]);
      
      // Apply critical thinking to improve detection
      return this.applyCriticalThinking(enhancedRooms, learningData[floorId], patternConsistency, solRoomNames);
      
    } catch (error) {
      console.error('Error applying learning to detection:', error);
      return detectedRooms;
    }
  }
  
  /**
   * Calculate how consistent each learned pattern is across multiple detections
   */
  private calculatePatternConsistency(learningData: any[]): Record<string, number> {
    const consistency: Record<string, number> = {};
    
    // If only one detection, all patterns are considered perfectly consistent
    if (learningData.length <= 1) {
      return consistency;
    }
    
    // Create a map of room names to positions across detections
    const roomPositions: Record<string, {x: number[], y: number[], width: number[], height: number[]}> = {};
    
    // Collect positions for each named room across all detections
    learningData.forEach(detection => {
      detection.rooms.forEach((room: any) => {
        if (!room.name) return;
        
        if (!roomPositions[room.name]) {
          roomPositions[room.name] = { x: [], y: [], width: [], height: [] };
        }
        
        roomPositions[room.name].x.push(room.x);
        roomPositions[room.name].y.push(room.y);
        roomPositions[room.name].width.push(room.width);
        roomPositions[room.name].height.push(room.height);
      });
    });
    
    // Calculate standard deviation for each dimension as a measure of consistency
    Object.keys(roomPositions).forEach(roomName => {
      const pos = roomPositions[roomName];
      const xStdDev = this.calculateStandardDeviation(pos.x);
      const yStdDev = this.calculateStandardDeviation(pos.y);
      const widthStdDev = this.calculateStandardDeviation(pos.width);
      const heightStdDev = this.calculateStandardDeviation(pos.height);
      
      // Normalize by average dimension to get relative consistency
      const xAvg = pos.x.reduce((sum, val) => sum + val, 0) / pos.x.length;
      const yAvg = pos.y.reduce((sum, val) => sum + val, 0) / pos.y.length;
      const widthAvg = pos.width.reduce((sum, val) => sum + val, 0) / pos.width.length;
      const heightAvg = pos.height.reduce((sum, val) => sum + val, 0) / pos.height.length;
      
      // Calculate overall consistency (lower stddev = higher consistency)
      const relativePosStdDev = (xStdDev / xAvg + yStdDev / yAvg) / 2;
      const relativeSizeStdDev = (widthStdDev / widthAvg + heightStdDev / heightAvg) / 2;
      
      // Combined consistency score (1 = perfectly consistent, 0 = totally inconsistent)
      consistency[roomName] = 1 - Math.min(1, (relativePosStdDev * 0.6 + relativeSizeStdDev * 0.4));
    });
    
    return consistency;
  }
  
  /**
   * Calculate standard deviation of an array of numbers
   */
  private calculateStandardDeviation(values: number[]): number {
    if (values.length <= 1) return 0;
    
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(val => Math.pow(val - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  }
  
  /**
   * Apply critical thinking to improve detection based on learned patterns
   */
  private applyCriticalThinking(
    currentRooms: DetectedRoom[],
    learningData: any[],
    patternConsistency: Record<string, number>,
    solRoomNames: Record<string, string>
  ): DetectedRoom[] {
    if (!learningData || learningData.length === 0) {
      return currentRooms;
    }

    // Get the most recent detection as primary reference
    const recentDetection = learningData[0];
    
    // Phase 1: Match existing rooms with learned patterns to improve accuracy
    currentRooms = currentRooms.map(room => {
      // Find potential matches in learned data based on position
      const matchingRooms = recentDetection.rooms
        .map((learnedRoom: any, index: number) => {
          // Calculate overlap or proximity score between current room and learned room
          const distanceScore = this.calculateProximityScore(room, learnedRoom);
          const sizeScore = this.calculateSizeScore(room, learnedRoom);
          const matchScore = distanceScore * 0.7 + sizeScore * 0.3;
          
          // Add consistency bonus if this room has consistent patterns
          const consistencyBonus = patternConsistency[learnedRoom.name] || 0;
          const finalScore = matchScore + (consistencyBonus * 0.3);
          
          return {
            learnedRoom,
            score: finalScore,
            index
          };
        })
        .filter((match: any) => match.score > 0.5) // Only consider good matches
        .sort((a: any, b: any) => b.score - a.score); // Sort by score descending
      
      // If we have a good match, apply learned properties
      if (matchingRooms.length > 0) {
        const bestMatch = matchingRooms[0];
        
        // Improve confidence based on match quality
        const confidenceBoost = bestMatch.score * 0.3;
        
        // Find a SOL room name if available
        const solRoomName = solRoomNames[bestMatch.learnedRoom.type] || null;
        
        return {
          ...room,
          name: solRoomName || bestMatch.learnedRoom.name,
          type: bestMatch.learnedRoom.type,
          confidence: Math.min(1.0, room.confidence + confidenceBoost)
        };
      }
      
      return room;
    });
    
    // Phase 2: Identify missing critical rooms from learned patterns
    const missingRooms: DetectedRoom[] = [];
    
    // Get rooms from recent detection that don't match any current rooms
    const currentPositions = currentRooms.map(room => ({ x: room.x, y: room.y }));
    
    recentDetection.rooms.forEach((learnedRoom: any) => {
      // Skip if this room has low consistency
      if ((patternConsistency[learnedRoom.name] || 0) < 0.7) return;
      
      // Check if this learned room is missing from current detection
      const isRoomMissing = !currentPositions.some(pos => {
        const dx = Math.abs(pos.x - learnedRoom.x);
        const dy = Math.abs(pos.y - learnedRoom.y);
        return dx < learnedRoom.width / 2 && dy < learnedRoom.height / 2;
      });
      
      // If room is missing and we're fairly confident about its pattern, add it
      if (isRoomMissing) {
        // Find SOL room name if available
        const solRoomName = solRoomNames[learnedRoom.type] || null;
        
        missingRooms.push({
          id: `adaptive-${Date.now()}-${learnedRoom.type}-${missingRooms.length}`,
          name: solRoomName || learnedRoom.name,
          x: learnedRoom.x,
          y: learnedRoom.y,
          width: learnedRoom.width,
          height: learnedRoom.height,
          confidence: Math.min(0.85, patternConsistency[learnedRoom.name] || 0.6), // Cap confidence for adaptive rooms
          type: learnedRoom.type
        });
      }
    });
    
    console.log(`Added ${missingRooms.length} rooms based on learned patterns`);
    
    // Phase 3: Remove low-confidence rooms that conflict with high-consistency patterns
    const roomsToKeep = currentRooms.filter(room => {
      // Keep rooms with good confidence
      if (room.confidence > 0.7) return true;
      
      // Check if this low-confidence room conflicts with any consistent pattern
      for (const learnedRoom of recentDetection.rooms) {
        const consistency = patternConsistency[learnedRoom.name] || 0;
        if (consistency < 0.7) continue; // Only consider consistent patterns
        
        // Calculate overlap
        const overlapScore = this.calculateOverlap(room, learnedRoom);
        
        // If significant overlap with a consistent pattern but not matching it,
        // this might be a false detection
        if (overlapScore > 0.7) {
          const matchScore = this.calculateProximityScore(room, learnedRoom);
          if (matchScore < 0.5) {
            // This room overlaps with a consistent pattern but doesn't match it
            // Likely a false detection, so remove it
            return false;
          }
        }
      }
      
      return true;
    });
    
    // Combine kept rooms and missing rooms from learned patterns
    return [...roomsToKeep, ...missingRooms];
  }
  
  /**
   * Calculate proximity score between two rooms (0-1)
   */
  private calculateProximityScore(room1: any, room2: any): number {
    const dx = Math.abs(room1.x - room2.x);
    const dy = Math.abs(room1.y - room2.y);
    
    // Normalize by average dimensions
    const avgWidth = (room1.width + room2.width) / 2;
    const avgHeight = (room1.height + room2.height) / 2;
    
    const normalizedDx = dx / avgWidth;
    const normalizedDy = dy / avgHeight;
    
    // Calculate proximity score (1 = perfect match, 0 = far away)
    return Math.max(0, 1 - Math.sqrt(normalizedDx * normalizedDx + normalizedDy * normalizedDy));
  }
  
  /**
   * Calculate size similarity score between two rooms (0-1) 
   */
  private calculateSizeScore(room1: any, room2: any): number {
    const widthRatio = Math.min(room1.width, room2.width) / Math.max(room1.width, room2.width);
    const heightRatio = Math.min(room1.height, room2.height) / Math.max(room1.height, room2.height);
    
    return (widthRatio + heightRatio) / 2;
  }
  
  /**
   * Calculate overlap between two rooms (0-1)
   */
  private calculateOverlap(room1: any, room2: any): number {
    // Calculate boundaries
    const r1Left = room1.x - room1.width / 2;
    const r1Right = room1.x + room1.width / 2;
    const r1Top = room1.y - room1.height / 2;
    const r1Bottom = room1.y + room1.height / 2;
    
    const r2Left = room2.x - room2.width / 2;
    const r2Right = room2.x + room2.width / 2;
    const r2Top = room2.y - room2.height / 2;
    const r2Bottom = room2.y + room2.height / 2;
    
    // Check for no overlap
    if (r1Right < r2Left || r1Left > r2Right || r1Bottom < r2Top || r1Top > r2Bottom) {
      return 0;
    }
    
    // Calculate overlap dimensions
    const overlapWidth = Math.min(r1Right, r2Right) - Math.max(r1Left, r2Left);
    const overlapHeight = Math.min(r1Bottom, r2Bottom) - Math.max(r1Top, r2Top);
    const overlapArea = overlapWidth * overlapHeight;
    
    // Calculate areas
    const area1 = room1.width * room1.height;
    const area2 = room2.width * room2.height;
    
    // Normalize by the smaller area
    return overlapArea / Math.min(area1, area2);
  }
}

// Singleton instance of the adaptive learning system
export const adaptiveLearning = new AdaptiveLearningSystem();

/**
 * Main room detection function using hybrid approach (neural + traditional)
 */
export const detectRoomsFromImage = async (
  imageSrc: string, 
  containerWidth: number, 
  containerHeight: number
): Promise<ImageDetectionResult> => {
  // Prevent multiple simultaneous processing
  if (isProcessing) {
    console.log('Room detection already in progress');
    return {
      rooms: generateFallbackRooms(containerWidth, containerHeight),
      orientation: containerWidth > containerHeight ? 'landscape' : 'portrait',
      confidenceScore: 0.5
    };
  }
  
  try {
    isProcessing = true;
    console.log('Starting hybrid room detection on:', imageSrc);
    
    // First try neural detection with traditional fallback
    return await detectRoomsWithNeuralNetwork(
      imageSrc,
      containerWidth,
      containerHeight,
      traditionalRoomDetection
    );
    
  } catch (error) {
    console.error('Error in room detection:', error);
    // Return fallback on error
    return {
      rooms: generateFallbackRooms(containerWidth, containerHeight, 'unknown'),
      orientation: containerWidth > containerHeight ? 'landscape' : 'portrait',
      confidenceScore: 0.5
    };
  } finally {
    isProcessing = false;
  }
};

/**
 * Traditional algorithm-based room detection (used as fallback)
 */
export const traditionalRoomDetection = async (
  imageSrc: string, 
  containerWidth: number, 
  containerHeight: number
): Promise<ImageDetectionResult> => {
  console.log('Using traditional room detection algorithm');
  
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
  const orientation = img.width > img.height ? 'landscape' : 'portrait';
  console.log(`Image orientation: ${orientation}`);
  
  // Create context for processing
  const ctx = createImageCanvas(img);
  
  // Enhanced text element removal
  removeTextElements(ctx);
  
  // Detect rooms using architecture-based contour extraction
  // The algorithm is now optimized for different orientations
  const regions = await extractRoomContours(ctx);
  console.log(`Detected ${regions.length} architectural room regions`);
  
  // Calculate scaling factors based on container dimensions
  const scaleX = containerWidth / ctx.canvas.width;
  const scaleY = containerHeight / ctx.canvas.height;
  
  // Generate rooms from regions with enhanced accuracy
  let rooms: DetectedRoom[] = regions.map((region, index) => {
    // Scale coordinates to container size
    const scaledX = Math.round(region.x * scaleX);
    const scaledY = Math.round(region.y * scaleY);
    const scaledWidth = Math.round(region.width * scaleX);
    const scaledHeight = Math.round(region.height * scaleY);
    
    // Calculate room characteristics
    const area = scaledWidth * scaledHeight;
    const aspectRatio = scaledWidth / scaledHeight;
    
    // Use improved room type detection with position awareness
    const roomType = determineRoomType(area, aspectRatio, scaledX, scaledY, floor);
    
    // Use smarter room naming that considers floor layout
    const roomName = determineRoomName(roomType, index, floor, floorRoomNames);
    
    // Generate unique ID with timestamp for versioning
    const id = `room-${floor}-${Date.now()}-${index}`;
    
    // Calculate confidence with improved metrics
    const confidence = calculateConfidence(area, aspectRatio, roomType);
    
    return {
      id,
      name: roomName,
      x: scaledX,
      y: scaledY,
      width: scaledWidth,
      height: scaledHeight,
      confidence: confidence,
      type: roomType.toLowerCase()
    };
  });
  
  const processingTime = performance.now() - startTime;
  console.log(`Traditional room detection completed in ${processingTime.toFixed(0)}ms, found ${rooms.length} rooms`);
  
  // If no rooms were detected, generate fallback
  if (rooms.length === 0) {
    console.log('No rooms detected, using fallback');
    const fallbackRooms = generateFallbackRooms(containerWidth, containerHeight, floor);
    return {
      rooms: fallbackRooms,
      orientation,
      confidenceScore: 0.5
    };
  }
  
  // Enhanced room accuracy using SOL data
  rooms = assignAccurateRoomNames(rooms, floor);
  
  // Apply adaptive learning to improve detection using past knowledge
  rooms = adaptiveLearning.enhanceDetection(rooms, floor);
  
  // Filter out any tiny rooms or oversized ones
  rooms = rooms.filter(room => 
    room.width > 30 && room.height > 30 && 
    room.width < containerWidth * 0.9 && room.height < containerHeight * 0.9
  );
  
  // Calculate overall confidence for the detection
  const detectionConfidence = calculateOverallConfidence(rooms, floor);
  
  return {
    rooms,
    orientation,
    confidenceScore: detectionConfidence
  };
};

/**
 * Calculate confidence level of room detection based on multiple factors
 * Enhanced with better metrics for accuracy assessment
 */
const calculateConfidence = (area: number, aspectRatio: number, roomType: string): number => {
  // Area confidence (higher for medium-sized rooms, lower for very small or large)
  let areaConfidence = 0;
  if (area < 1000) {
    areaConfidence = area / 1000; // Linear increase up to 1000px²
  } else if (area <= 10000) {
    areaConfidence = 1.0; // Maximum confidence for medium sized rooms
  } else {
    areaConfidence = 1.0 - Math.min(1.0, (area - 10000) / 40000); // Linear decrease after 10000px²
  }
  
  // Aspect ratio confidence (higher for more square-like rooms)
  // 1.0 is perfect square, further from 1.0 is less confidence
  const aspectRatioConfidence = aspectRatio >= 1.0 
    ? Math.min(1.0, 3.0 / aspectRatio) 
    : Math.min(1.0, aspectRatio * 3.0);
  
  // Room type confidence (certain types of rooms are more reliably detected)
  const roomTypeConfidenceMap: Record<string, number> = {
    'Office': 0.9,
    'Classroom': 0.9,
    'Laboratory': 0.85,
    'Storage': 0.75,
    'Restroom': 0.7,
    'Hallway': 0.65,
    'Stairs': 0.6,
    'Electrical': 0.75,
    'Lobby': 0.8,
    'default': 0.6
  };
  
  const roomTypeConfidence = roomTypeConfidenceMap[roomType] || roomTypeConfidenceMap['default'];
  
  // Weight the different factors
  const areaWeight = 0.4;
  const aspectWeight = 0.3;
  const typeWeight = 0.3;
  
  // Calculate weighted confidence
  const weightedConfidence = 
    areaConfidence * areaWeight +
    aspectRatioConfidence * aspectWeight +
    roomTypeConfidence * typeWeight;
  
  // Return bounded confidence score
  return Math.min(1.0, Math.max(0.3, weightedConfidence));
};

/**
 * Calculate overall confidence for the entire detection
 * Enhanced with consistency metrics between detected rooms
 */
const calculateOverallConfidence = (rooms: DetectedRoom[], floor: string): number => {
  if (rooms.length === 0) return 0.5;
  
  // Base confidence from average of individual room confidences
  const avgRoomConfidence = rooms.reduce((sum, room) => sum + room.confidence, 0) / rooms.length;
  
  // Room count confidence
  // Based on expected number of rooms per floor
  const expectedRoomCounts: Record<string, number> = {
    'ground': 8,
    'mezzanine': 12,
    'second': 8,
    'third': 10,
    'fourth': 8,
    'fifth': 10,
    'unknown': 9
  };
  
  const expectedCount = expectedRoomCounts[floor] || expectedRoomCounts['unknown'];
  const countDifference = Math.abs(rooms.length - expectedCount);
  const roomCountConfidence = Math.max(0, 1 - countDifference / expectedCount);
  
  // Room distribution confidence
  // Checks if rooms are evenly distributed (not all clustered in one area)
  let distributionConfidence = 1.0;
  
  if (rooms.length >= 3) {
    // Check if all rooms are in one quadrant
    const quadrants = [0, 0, 0, 0]; // top-left, top-right, bottom-left, bottom-right
    
    rooms.forEach(room => {
      const quadrantX = room.x < room.width * 2 ? 0 : 1;
      const quadrantY = room.y < room.height * 2 ? 0 : 1;
      const quadrantIdx = quadrantY * 2 + quadrantX;
      quadrants[quadrantIdx]++;
    });
    
    const maxQuadrantCount = Math.max(...quadrants);
    const quadrantRatio = maxQuadrantCount / rooms.length;
    
    // Penalize if more than 70% of rooms are in one quadrant
    if (quadrantRatio > 0.7) {
      distributionConfidence = 0.7;
    }
  }
  
  // Apply weights to different confidence metrics
  const avgConfidenceWeight = 0.6;
  const countConfidenceWeight = 0.2;
  const distributionWeight = 0.2;
  
  const overallConfidence = 
    avgRoomConfidence * avgConfidenceWeight + 
    roomCountConfidence * countConfidenceWeight +
    distributionConfidence * distributionWeight;
  
  // Return bounded confidence
  return Math.min(1.0, Math.max(0.3, overallConfidence));
};

/**
 * Determine room type based on size, aspect ratio, position and orientation
 * Enhanced with better positional awareness and floor-specific logic
 */
const determineRoomType = (area: number, aspectRatio: number, x: number, y: number, floor: string): string => {
  // Special room types per floor
  const floorRoomTypes: Record<string, Array<{type: string, condition: (area: number, aspectRatio: number, x: number, y: number) => boolean}>> = {
    'ground': [
      { 
        type: 'Office', 
        condition: (area, ratio) => area < 6000 && ratio > 0.5 && ratio < 2.0
      },
      {
        type: 'Lobby',
        condition: (area) => area > 9000
      },
      {
        type: 'Restroom',
        condition: (area, ratio) => area < 4000 && ratio > 0.8 && ratio < 1.2
      }
    ],
    'mezzanine': [
      { 
        type: 'Classroom', 
        condition: (area) => area > 4000 && area < 10000
      },
      {
        type: 'Laboratory',
        condition: (area, ratio) => area > 6000 && ratio > 0.7 && ratio < 1.5
      },
      {
        type: 'Office',
        condition: (area) => area < 4000
      }
    ],
    'second': [
      {
        type: 'Classroom',
        condition: (area) => area > 5000
      },
      {
        type: 'Laboratory',
        condition: (area, ratio) => area > 7000 && ratio > 0.7 && ratio < 1.5
      },
      {
        type: 'Office',
        condition: (area) => area < 4000 && area > 2000
      }
    ],
    'third': [
      {
        type: 'Classroom',
        condition: (area) => area > 5000 && area < 8000
      },
      {
        type: 'Laboratory',
        condition: (area) => area > 7000
      },
      {
        type: 'Office',
        condition: (area) => area < 4000
      }
    ],
    'fourth': [
      {
        type: 'Laboratory',
        condition: (area) => area > 7000
      },
      {
        type: 'Kitchen',
        condition: (area, ratio, x, y) => area > 4000 && area < 7000 && y < 300
      },
      {
        type: 'Office',
        condition: (area) => area < 3500
      }
    ],
    'fifth': [
      {
        type: 'Laboratory',
        condition: (area) => area > 5000
      },
      {
        type: 'Office',
        condition: (area) => area < 4000 && area > 2000
      },
      {
        type: 'Storage',
        condition: (area) => area < 2000
      }
    ]
  };
  
  // Check for floor-specific room types
  const floorTypes = floorRoomTypes[floor] || [];
  for (const { type, condition } of floorTypes) {
    if (condition(area, aspectRatio, x, y)) {
      return type;
    }
  }
  
  // General room type determination
  if (aspectRatio < 0.3 || aspectRatio > 3.5) {
    return 'Hallway';
  }
  
  if (area < 3000) {
    return Math.random() > 0.4 ? 'Office' : 'Storage';
  }
  
  if (area > 8000) {
    return Math.random() > 0.5 ? 'Laboratory' : 'Classroom';
  }
  
  // Default room types based on size
  if (area < 5000) {
    return 'Office';
  } else {
    return 'Classroom';
  }
};

/**
 * Enhanced room naming with better SOL data integration
 */
const determineRoomName = (roomType: string, index: number, floor: string, floorRoomNames: Record<string, string>): string => {
  // Get available room names for this floor
  const roomNames = Object.values(floorRoomNames);
  
  // If we have a specific name available, use it
  if (index < roomNames.length) {
    return roomNames[index];
  }
  
  // Map of room name prefixes by type
  const roomPrefixes: Record<string, string> = {
    'Office': 'Office',
    'Classroom': 'Room',
    'Laboratory': 'Lab',
    'Storage': 'Storage',
    'Restroom': 'Restroom',
    'Hallway': 'Corridor',
    'Stairs': 'Stairway',
    'Electrical': 'Electrical Room',
    'Lobby': 'Lobby',
    'Kitchen': 'Kitchen'
  };
  
  // Generate floor-specific room number using floor prefix
  const floorPrefix: Record<string, string> = {
    'ground': 'G',
    'mezzanine': 'M',
    'second': '2',
    'third': '3',
    'fourth': '4',
    'fifth': '5',
    'unknown': 'U'
  };
  
  const prefix = floorPrefix[floor] || floorPrefix['unknown'];
  const roomNumber = index + 1;
  const paddedNumber = roomNumber.toString().padStart(2, '0');
  
  // Use type-specific naming if available, otherwise fallback to generic
  const typePrefix = roomPrefixes[roomType] || roomType;
  return `${typePrefix} ${prefix}-${paddedNumber}`;
};

/**
 * Generate fallback rooms when detection fails
 */
const generateFallbackRooms = (width: number, height: number, floor: string = 'unknown'): DetectedRoom[] => {
  // Get available room names for this floor
  const floorRoomNames = getRoomNamesForFloor(floor);
  const roomNames = Object.values(floorRoomNames);
  
  const roomTypes = ['Office', 'Classroom', 'Laboratory', 'Storage', 'Hallway'];
  const rooms: DetectedRoom[] = [];
  
  // Create a grid of rooms
  const numCols = 3;
  const numRows = 2;
  const roomWidth = width / (numCols + 1);
  const roomHeight = height / (numRows + 1);
  
  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      const index = row * numCols + col;
      const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
      
      // Use a specific room name if available, or generate one
      const roomName = index < roomNames.length 
        ? roomNames[index] 
        : `${roomType} ${index + 1}`;
      
      rooms.push({
        id: `fallback-${floor}-${Date.now()}-${row}-${col}`,
        name: roomName,
        x: Math.round((col + 0.5) * roomWidth) + 50,
        y: Math.round((row + 0.5) * roomHeight) + 50,
        width: Math.round(roomWidth * 0.8),
        height: Math.round(roomHeight * 0.8),
        confidence: 0.6,
        type: roomType.toLowerCase()
      });
    }
  }
  
  return rooms;
};

/**
 * Calculate a grid layout for a collection of rooms
 */
export const calculateGridLayout = (
  rooms: DetectedRoom[] | RoomDetail[],
  containerWidth: number,
  containerHeight: number
): DetectedRoom[] | RoomDetail[] => {
  if (rooms.length === 0) return rooms;
  
  const count = rooms.length;
  const columns = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);
  
  const cellWidth = containerWidth / (columns + 1);
  const cellHeight = containerHeight / (rows + 1);
  
  return rooms.map((room, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    
    const x = Math.round((col + 0.5) * cellWidth) + 50;
    const y = Math.round((row + 0.5) * cellHeight) + 50;
    
    return {
      ...room,
      x,
      y,
      width: Math.round(cellWidth * 0.8),
      height: Math.round(cellHeight * 0.8)
    } as any; // Using 'any' to handle both types
  });
};

/**
 * Convert detected rooms to room details
 */
export const convertDetectedRoomsToRoomDetails = (detectedRooms: DetectedRoom[]): RoomDetail[] => {
  return detectedRooms.map(room => {
    // Calculate room dimensions in meters (approximate)
    const roomWidth = room.width || 200;
    const roomHeight = room.height || 150;
    const lengthInMeters = roomWidth / 50; // Convert pixels to meters
    const widthInMeters = roomHeight / 50;
    const areaInMeters = lengthInMeters * widthInMeters;
    
    // Estimate default values based on room type and dimensions
    let roomType = room.type || 'office';
    let requiredLux = 300;
    let recommendedFixtures = Math.ceil(areaInMeters / 10); // 1 fixture per 10 sq meters
    
    // Adjust values based on room type
    if (roomType === 'conference') {
      requiredLux = 400;
      recommendedFixtures = Math.ceil(areaInMeters / 8);
    } else if (roomType === 'classroom') {
      requiredLux = 500;
      recommendedFixtures = Math.ceil(areaInMeters / 6);
    } else if (roomType === 'storage') {
      requiredLux = 200;
      recommendedFixtures = Math.ceil(areaInMeters / 15);
    } else if (roomType === 'hallway') {
      requiredLux = 150;
      recommendedFixtures = Math.ceil(areaInMeters / 20);
    }
    
    // Determine if this is a polygon room
    const hasPolygon = (room as any).points && (room as any).points.length >= 3;
    const roomShape = hasPolygon ? 'poly' : 'rect';
    
    // Create a fully editable room detail object
    return {
      id: room.id,
      name: room.name || `Room ${Math.floor(Math.random() * 100)}`,
      roomType: roomType,
      length: lengthInMeters,
      width: widthInMeters,
      height: 3, // Default ceiling height
      area: areaInMeters,
      coords: {
        x: room.x,
        y: room.y,
        width: roomWidth,
        height: roomHeight
      },
      reflectanceCeiling: 0.7,
      reflectanceWalls: 0.5,
      reflectanceFloor: 0.2,
      maintenanceFactor: 0.8,
      requiredLux: requiredLux,
      recommendedFixtures: recommendedFixtures,
      actualFixtures: recommendedFixtures,
      compliance: 100,
      shape: roomShape, // Use determined shape
      editable: true, // Ensure the room is editable
      isDetected: true, // Mark as detected for reference
      
      // Always include points array (even if empty) for consistency
      points: hasPolygon ? (room as any).points : [],
      
      // Add lighting design properties
      lightingFixtures: [],
      lightingCalculations: {
        averageLux: requiredLux,
        uniformity: 0.7,
        energyEfficiency: 85
      }
    };
  });
};

/**
 * Assign accurate room names based on SOL files with enhanced matching
 */
const assignAccurateRoomNames = (rooms: DetectedRoom[], floor: string): DetectedRoom[] => {
  // Get the room names for this floor from SOL files
  const floorRoomNames = ROOM_NAMES[floor] || {};
  const roomNameList = Object.values(floorRoomNames);
  
  if (roomNameList.length === 0) {
    return rooms; // No specific room names available
  }
  
  // Sort rooms by size (larger rooms first) to prioritize main rooms
  const sortedRooms = [...rooms].sort((a, b) => 
    (b.width * b.height) - (a.width * a.height)
  );
  
  // Enhanced algorithm that considers position for more accurate naming
  // This helps match names to their likely location in the building
  
  // Create position quadrants for the floor
  const positionMatches: Record<string, number[]> = {
    'north': [],   // Top of plan
    'south': [],   // Bottom of plan
    'east': [],    // Right of plan
    'west': [],    // Left of plan
    'center': [],  // Middle of plan
  };
  
  // Find the centroid for all rooms
  let totalX = 0, totalY = 0;
  sortedRooms.forEach(room => {
    totalX += room.x;
    totalY += room.y;
  });
  
  const centerX = totalX / sortedRooms.length;
  const centerY = totalY / sortedRooms.length;
  
  // Group rooms by position
  sortedRooms.forEach((room, index) => {
    // Determine position relative to center
    const isNorth = room.y < centerY * 0.8;
    const isSouth = room.y > centerY * 1.2;
    const isEast = room.x > centerX * 1.2;
    const isWest = room.x < centerX * 0.8;
    
    if (isNorth && isEast) positionMatches['north'].push(index);
    else if (isNorth && isWest) positionMatches['west'].push(index);
    else if (isSouth && isEast) positionMatches['east'].push(index);
    else if (isSouth && isWest) positionMatches['south'].push(index);
    else positionMatches['center'].push(index);
  });
  
  // Position-based name patterns
  const positionPatterns: Record<string, string[]> = {
    'north': ['faculty', 'office', 'admin', 'staff'],
    'south': ['entrance', 'lobby', 'reception', 'exit'],
    'east': ['laboratory', 'lab', 'workshop'],
    'west': ['storage', 'utility', 'restroom'],
    'center': ['classroom', 'conference', 'hall']
  };
  
  // NEW: Use SOL data ID patterns to match room names
  const solBasedMatching: Record<string, RegExp[]> = {
    'registrar': [/registrar/i, /admission/i],
    'guidance': [/guidance/i, /counseling/i],
    'accounting': [/accounting/i, /finance/i, /cashier/i],
    'edp': [/edp/i, /data/i, /processing/i],
    'gsr1': [/gsr.*1/i, /seminar.*1/i],
    'gsr2': [/gsr.*2/i, /seminar.*2/i],
    'cisco1': [/cisco.*1/i, /network.*lab.*1/i],
    'cisco2': [/cisco.*2/i, /network.*lab.*2/i],
    'nursing_skills1': [/nursing.*skills.*1/i, /nursing.*lab.*1/i],
    'nursing_skills2': [/nursing.*skills.*2/i, /nursing.*lab.*2/i],
    'kitchen1': [/kitchen.*1/i, /culinary.*1/i],
    'ee_lab': [/ee.*lab/i, /electrical.*lab/i, /engineering.*lab/i]
  };
  
  // Assign names based on position patterns
  const finalRooms = [...sortedRooms];
  
  // First, assign names directly when good position matches exist
  Object.entries(positionPatterns).forEach(([position, patterns]) => {
    const roomIndices = positionMatches[position];
    if (!roomIndices.length) return;
    
    // Find room names that match this position's typical rooms
    const matchingNames = roomNameList.filter(name => 
      patterns.some(pattern => name.toLowerCase().includes(pattern))
    );
    
    // Assign names to rooms in this position
    matchingNames.forEach((name, idx) => {
      if (idx < roomIndices.length) {
        const roomIndex = roomIndices[idx];
        finalRooms[roomIndex] = {
          ...finalRooms[roomIndex],
          name: name
        };
      }
    });
  });
  
  // NEW: For each SOL room ID, try to find a matching detected room based on patterns
  Object.entries(floorRoomNames).forEach(([roomId, roomName]) => {
    // Skip if this room is already assigned
    if (finalRooms.some(r => r.name === roomName)) return;
    
    // Get patterns for this room ID
    const patterns = solBasedMatching[roomId] || [new RegExp(roomId, 'i')];
    
    // Try to find an unnamed room that matches based on proximity to typical position
    const unnamedRooms = finalRooms.filter(r => !roomNameList.includes(r.name));
    
    if (unnamedRooms.length > 0) {
      // For simplicity, just assign to the first unnamed room
      // In a real implementation, we would use more sophisticated matching
      const targetRoom = unnamedRooms[0];
      const roomIndex = finalRooms.findIndex(r => r.id === targetRoom.id);
      
      if (roomIndex >= 0) {
        finalRooms[roomIndex] = {
          ...finalRooms[roomIndex],
          name: roomName
        };
      }
    }
  });
  
  // For remaining unnamed rooms, use sequential naming
  let nameIndex = 0;
  finalRooms.forEach((room, idx) => {
    // Skip rooms that already have SOL names assigned
    if (roomNameList.includes(room.name)) return;
    
    // Find next available name
    while (nameIndex < roomNameList.length && 
           finalRooms.some(r => r.name === roomNameList[nameIndex])) {
      nameIndex++;
    }
    
    // Assign name if available, otherwise keep original
    if (nameIndex < roomNameList.length) {
      finalRooms[idx] = {
        ...finalRooms[idx],
        name: roomNameList[nameIndex]
      };
      nameIndex++;
    }
  });
  
  return finalRooms;
}; 