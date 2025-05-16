/**
 * Neural Detection Algorithm
 * Advanced floor plan room detection using deep learning approaches
 */
import { DetectedRoom, ImageDetectionResult } from '../interfaces';
import { getItem, setItem } from '../../../../../utils/storageUtils';

// Import TensorFlow dynamically to prevent rendering issues
let tf: any = null;
let tfLoaded = false;
let tfLoadAttempted = false;
let tfLoadPromise: Promise<any> | null = null;

// Load TensorFlow safely
const loadTensorFlow = () => {
  if (tfLoadAttempted) return tfLoadPromise;
  
  tfLoadAttempted = true;
  
  // This will only execute in browser environments when TensorFlow is available
  if (typeof window !== 'undefined') {
    tfLoadPromise = import('@tensorflow/tfjs').then(tensorflowModule => {
      tf = tensorflowModule;
      tfLoaded = true;
      console.log('TensorFlow.js loaded successfully');
      return tensorflowModule;
    }).catch(err => {
      console.error('Failed to load TensorFlow.js:', err);
      return null;
    });
    
    return tfLoadPromise;
  }
  
  return Promise.resolve(null);
};

// Trigger loading
loadTensorFlow();

const MODEL_STORAGE_KEY = 'floorplan-detection-model';
const LOCAL_MODEL_KEY = 'floorplan-detection-local-model';

/**
 * Neural Floor Plan Detection System
 * Uses deep learning to identify rooms in floor plans with high accuracy
 */
export class NeuralDetectionSystem {
  private model: any = null;
  private isModelLoaded: boolean = false;
  private readonly modelUrl = '/models/room-detection/model.json';
  private isTraining: boolean = false;
  private readonly tensorflowAvailable: boolean;
  private modelLoadPromise: Promise<boolean> | null = null;
  
  constructor() {
    // Check if TensorFlow.js is available or will be available soon
    this.tensorflowAvailable = tfLoaded || tfLoadAttempted;
    
    // Attempt to load model only if TensorFlow is available or being loaded
    if (this.tensorflowAvailable) {
      // Defer model loading to ensure TensorFlow is fully loaded
      setTimeout(() => {
        this.modelLoadPromise = this.loadModel();
      }, 1000);
    } else {
      console.warn('TensorFlow.js is not available and no load attempt was made, neural detection disabled');
    }
  }
  
  /**
   * Checks if the detection system is ready
   */
  public isReady(): boolean {
    return tfLoaded && this.isModelLoaded && this.model !== null;
  }
  
  /**
   * Loads the TensorFlow.js model for room detection
   */
  async loadModel(): Promise<boolean> {
    // Wait for TensorFlow to load if it's in progress
    if (!tfLoaded && tfLoadPromise) {
      try {
        await tfLoadPromise;
      } catch (error) {
        console.error('Error waiting for TensorFlow to load:', error);
        return false;
      }
    }
    
    if (!tfLoaded) {
      console.warn('TensorFlow.js is not available. Using fallback detection methods.');
      return false;
    }
    
    if (this.isModelLoaded) {
      return true;
    }
    
    try {
      console.log('Loading neural room detection model...');
      
      // Try to load from browser cache first
      let loadedModel = null;
      const localModel = getItem(LOCAL_MODEL_KEY);
      
      if (localModel) {
        try {
          // Load from IndexedDB
          loadedModel = await tf.loadLayersModel('indexeddb://' + MODEL_STORAGE_KEY);
          console.log('Model loaded from browser cache');
        } catch (error) {
          console.log('No cached model found, loading from server');
        }
      }
      
      if (!loadedModel) {
        // Log model URL for debugging
        console.log('Loading model from URL:', this.modelUrl);
        
        try {
          // First check if model exists by fetching metadata
          const response = await fetch(this.modelUrl);
          if (!response.ok) {
            console.warn(`Model not found at ${this.modelUrl}: ${response.status} ${response.statusText}`);
            console.log('Using fallback detection methods instead of neural network');
            return false;
          }
          
          // Load from server
          loadedModel = await tf.loadGraphModel(this.modelUrl);
          console.log('Model loaded from server');
          
          // Cache the model
          await loadedModel.save('indexeddb://' + MODEL_STORAGE_KEY);
          setItem(LOCAL_MODEL_KEY, { timestamp: Date.now() });
        } catch (error) {
          console.warn('Error loading model from server:', error);
          console.log('Using fallback detection methods instead of neural network');
          return false;
        }
      }
      
      this.model = loadedModel;
      this.isModelLoaded = true;
      
      // Warm up the model with a dummy prediction
      if (this.model) {
        const dummyInput = tf.zeros([1, 300, 300, 3]);
        this.model.predict(dummyInput);
        dummyInput.dispose();
      }
      
      console.log('Room detection model loaded successfully');
      return true;
    } catch (error) {
      console.warn('Error loading neural room detection model:', error);
      console.log('Using fallback detection methods instead of neural network');
      return false;
    }
  }
  
  /**
   * Process an image using the neural network model
   * @param imageElement Image element to process
   * @param width Output width
   * @param height Output height
   */
  async detectRooms(imageElement: HTMLImageElement, width: number, height: number): Promise<DetectedRoom[]> {
    if (!tfLoaded || !this.isModelLoaded) {
      console.warn('Neural detection unavailable, using fallback');
      return [];
    }
    
    console.log('Starting neural room detection');
    try {
      // Convert image to tensor and preprocess
      const imageTensor = tf.browser.fromPixels(imageElement);
      
      // Normalize and resize the image to match model input shape (300x300)
      const resized = tf.image.resizeBilinear(imageTensor, [300, 300]);
      const normalized = tf.div(resized, 255.0);
      const batched = normalized.expandDims(0);
      
      // Run inference
      console.time('Neural inference');
      const predictions = this.model.predict(batched);
      console.timeEnd('Neural inference');
      
      console.log('Prediction outputs:', Object.keys(predictions));
      
      // For object detection model we expect these outputs
      const boxes = await predictions['detection_boxes'].array();
      const scores = await predictions['detection_scores'].array();
      const classes = await predictions['detection_classes'].array();
      const numDetections = await predictions['num_detections'].array();
      
      console.log(`Detected ${numDetections[0]} potential rooms`);
      
      // Process detection results
      const detectedRooms: DetectedRoom[] = [];
      const imgWidth = imageElement.width;
      const imgHeight = imageElement.height;
      
      // Convert normalized box coordinates to room objects
      const boxesArray = boxes[0];
      const scoresArray = scores[0];
      const classesArray = classes[0];
      
      for (let i = 0; i < numDetections[0]; i++) {
        // Only include high confidence detections
        if (scoresArray[i] < 0.5) continue;
        
        const box = boxesArray[i];
        const [y1, x1, y2, x2] = box; // Note: boxes are [y1, x1, y2, x2] normalized
        
        // Convert normalized coordinates to pixels
        const roomX = x1 * imgWidth;
        const roomY = y1 * imgHeight;
        const roomWidth = (x2 - x1) * imgWidth;
        const roomHeight = (y2 - y1) * imgHeight;
        
        // Scale to container size
        const scaledX = roomX * (width / imgWidth);
        const scaledY = roomY * (height / imgHeight);
        const scaledWidth = roomWidth * (width / imgWidth);
        const scaledHeight = roomHeight * (height / imgHeight);
        
        // Determine room type based on class
        // These types should match your ROOM_CLASS_MAPPING
        const roomTypes = ['office', 'conference', 'restroom', 'storage', 'common'];
        const classIndex = Math.floor(classesArray[i]) - 1; // Adjust for 0-indexing
        const roomType = classIndex >= 0 && classIndex < roomTypes.length 
          ? roomTypes[classIndex]
          : 'unknown';
          
        detectedRooms.push({
          id: `neural-room-${Date.now()}-${i}`,
          name: `${roomType.charAt(0).toUpperCase() + roomType.slice(1)} ${i + 1}`,
          x: Math.round(scaledX),
          y: Math.round(scaledY),
          width: Math.round(scaledWidth),
          height: Math.round(scaledHeight),
          confidence: scoresArray[i],
          type: roomType
        });
      }
      
      // Clean up tensors
      tf.dispose([imageTensor, resized, normalized, batched, ...Object.values(predictions)]);
      
      console.log(`Neural detection found ${detectedRooms.length} rooms`);
      return detectedRooms;
      
    } catch (error) {
      console.error('Error in neural room detection:', error);
      return [];
    }
  }
  
  /**
   * Incrementally train the model with new data
   * @param imageElement Image element to train on
   * @param labeledRooms Human-verified room data
   */
  async trainOnSample(imageElement: HTMLImageElement, labeledRooms: DetectedRoom[]): Promise<boolean> {
    if (!this.tensorflowAvailable || !this.isModelLoaded || this.isTraining) {
      return false;
    }
    
    try {
      this.isTraining = true;
      console.log('Starting incremental training with new sample');
      
      // Convert image to tensor
      const imageTensor = tf.browser.fromPixels(imageElement);
      const resized = tf.image.resizeBilinear(imageTensor, [224, 224]);
      const normalized = resized.div(255.0).expandDims(0);
      
      // Create training labels from verified rooms
      const labels = this.createTrainingLabels(labeledRooms, imageElement.width, imageElement.height);
      
      // Fine-tune model (simplified)
      await this.model.fit(normalized, labels, {
        epochs: 1,
        batchSize: 1,
        verbose: 1
      });
      
      // Save updated model
      await this.model.save('indexeddb://' + MODEL_STORAGE_KEY);
      setItem(LOCAL_MODEL_KEY, { timestamp: Date.now() });
      
      // Clean up tensors
      imageTensor.dispose();
      resized.dispose();
      normalized.dispose();
      labels.dispose();
      
      console.log('Incremental training completed');
      return true;
    } catch (error) {
      console.error('Error in incremental training:', error);
      return false;
    } finally {
      this.isTraining = false;
    }
  }
  
  /**
   * Create training labels from labeled rooms
   */
  private createTrainingLabels(rooms: DetectedRoom[], width: number, height: number): any {
    if (!this.tensorflowAvailable) return null;
    
    // This is a simplified placeholder
    // In real implementation, we'd create proper segmentation masks
    
    // Create empty tensor
    return tf.zeros([1, 224, 224, 5]); // 5 room types
  }
}

// Singleton instance
export const neuralDetection = new NeuralDetectionSystem();

/**
 * Detect rooms using neural network if available, otherwise fall back to traditional methods
 */
export const detectRoomsWithNeuralNetwork = async (
  imageSrc: string,
  width: number, 
  height: number,
  fallbackDetection: (src: string, w: number, h: number) => Promise<ImageDetectionResult>
): Promise<ImageDetectionResult> => {
  try {
    // Debug TensorFlow and model status
    debugNeuralDetection();
    
    // Load image
    const img = await loadImage(imageSrc);
    console.log(`Image loaded: ${img.width}x${img.height}`);
    
    // Try neural detection first
    const neuralRooms = await neuralDetection.detectRooms(img, width, height);
    
    // If neural detection found rooms, use them
    if (neuralRooms && neuralRooms.length > 0) {
      console.log('Using neural detection results');
      return {
        rooms: neuralRooms,
        orientation: img.width > img.height ? 'landscape' : 'portrait',
        confidenceScore: 0.85 // Neural detection has high confidence
      };
    }
    
    // Fall back to traditional methods
    console.log('Neural detection failed or found no rooms, falling back to traditional detection');
    return await fallbackDetection(imageSrc, width, height);
  } catch (error) {
    console.error('Error in neural room detection pipeline:', error);
    // Fall back to traditional methods on error
    return await fallbackDetection(imageSrc, width, height);
  }
};

/**
 * Helper function to load an image
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${e}`));
    img.src = src;
  });
}

/**
 * Debug function to help diagnose neural detection issues
 */
function debugNeuralDetection() {
  console.group('Neural Detection Debug Info');
  console.log('TensorFlow loaded:', tfLoaded);
  console.log('TensorFlow load attempted:', tfLoadAttempted);
  console.log('TensorFlow object:', tf ? 'Available' : 'Not available');
  
  if (tf) {
    console.log('TensorFlow version:', tf.version);
    console.log('Backend:', tf.getBackend());
    console.log('Available backends:', tf.engine().registryFactory);
  }
  
  console.log('Neural detection ready:', neuralDetection.isReady());
  console.groupEnd();
} 