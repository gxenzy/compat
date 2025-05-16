/**
 * Model Training Service
 * Handles training data collection, model training, and evaluation
 */

import { DetectedRoom, RoomDetail } from '../interfaces';
import { getItem, setItem } from '../../../../../utils/storageUtils';
import { neuralDetection } from '../utils/neuralDetection';

// Constants
const TRAINING_DATA_KEY = 'room-detection-training-data';
const TRAINING_STATS_KEY = 'room-detection-training-stats';
const TRAINING_QUEUE_KEY = 'room-detection-training-queue';
const MAX_SAMPLES_PER_FLOOR = 10;
const MAX_QUEUE_SIZE = 50;

/**
 * Training data sample structure
 */
interface TrainingSample {
  timestamp: number;
  floorId: string;
  imageUrl: string;
  detectedRooms: DetectedRoom[];
  manualCorrections: boolean;
  confidence: number;
}

/**
 * Enhanced training sample with user corrections
 */
interface UserCorrectedSample extends TrainingSample {
  userCorrectedRooms: RoomDetail[];
  correctionTimestamp: number;
  floorPlanWidth: number;
  floorPlanHeight: number;
}

/**
 * Training statistics
 */
interface TrainingStats {
  totalSamples: number;
  lastTrainingDate: number;
  accuracyHistory: {
    date: number;
    accuracy: number;
  }[];
  floorCoverage: Record<string, number>;
}

/**
 * Model Training Service
 * Manages the collection of training data and model training process
 */
class ModelTrainingService {
  private trainingData: TrainingSample[] = [];
  private trainingQueue: UserCorrectedSample[] = [];
  private contributingEnabled: boolean = false;
  private stats: TrainingStats = {
    totalSamples: 0,
    lastTrainingDate: 0,
    accuracyHistory: [],
    floorCoverage: {}
  };
  
  constructor() {
    // Load existing training data and stats
    this.loadTrainingData();
    this.loadTrainingQueue();
    this.loadStats();
  }
  
  /**
   * Load training data from storage
   */
  private loadTrainingData(): void {
    try {
      const storedData = getItem<TrainingSample[]>(TRAINING_DATA_KEY);
      this.trainingData = storedData || [];
    } catch (error) {
      console.error('Error loading training data:', error);
      this.trainingData = [];
    }
  }
  
  /**
   * Load training queue from storage
   */
  private loadTrainingQueue(): void {
    try {
      const storedQueue = getItem<UserCorrectedSample[]>(TRAINING_QUEUE_KEY);
      this.trainingQueue = storedQueue || [];
    } catch (error) {
      console.error('Error loading training queue:', error);
      this.trainingQueue = [];
    }
  }
  
  /**
   * Load training statistics from storage
   */
  private loadStats(): void {
    const storedStats = getItem<TrainingStats>(TRAINING_STATS_KEY, null);
    
    if (storedStats) {
      this.stats = storedStats;
    } else {
      // Initialize default stats
      this.stats = {
        totalSamples: 0,
        lastTrainingDate: 0,
        accuracyHistory: [],
        floorCoverage: {}
      };
    }
  }
  
  /**
   * Save training data to storage
   */
  private saveTrainingData(): void {
    try {
      setItem(TRAINING_DATA_KEY, this.trainingData);
    } catch (error) {
      console.error('Error saving training data:', error);
    }
  }
  
  /**
   * Save training queue to storage
   */
  private saveTrainingQueue(): void {
    try {
      setItem(TRAINING_QUEUE_KEY, this.trainingQueue);
    } catch (error) {
      console.error('Error saving training queue:', error);
    }
  }
  
  /**
   * Save training statistics to storage
   */
  private saveStats(): void {
    setItem(TRAINING_STATS_KEY, this.stats);
  }
  
  /**
   * Enable or disable contributing to model training
   */
  public setContributingEnabled(enabled: boolean): void {
    this.contributingEnabled = enabled;
    // Store user preference
    try {
      localStorage.setItem('ml-contributing-enabled', String(enabled));
    } catch (error) {
      console.error('Error saving contributing preference:', error);
    }
  }
  
  /**
   * Check if contributing to model training is enabled
   */
  public isContributingEnabled(): boolean {
    // Get stored preference, default to false
    try {
      const storedPreference = localStorage.getItem('ml-contributing-enabled');
      return storedPreference ? storedPreference === 'true' : this.contributingEnabled;
    } catch (error) {
      return this.contributingEnabled;
    }
  }
  
  /**
   * Add a training sample from automatic detection
   */
  public addDetectionSample(
    floorId: string,
    imageUrl: string,
    detectedRooms: DetectedRoom[],
    confidence: number
  ): void {
    // Only add high-confidence samples
    if (confidence < 0.7) return;

    const sample: TrainingSample = {
      timestamp: Date.now(),
      floorId,
      imageUrl,
      detectedRooms,
      manualCorrections: false,
      confidence
    };

    this.addSampleToTrainingData(sample);
  }
  
  /**
   * Add a sample to the training data, maintaining maximum samples per floor
   */
  private addSampleToTrainingData(sample: TrainingSample): void {
    // Get existing samples for this floor
    const floorSamples = this.trainingData.filter(s => s.floorId === sample.floorId);

    // If we already have max samples, remove the oldest
    if (floorSamples.length >= MAX_SAMPLES_PER_FLOOR) {
      // Find oldest sample for this floor
      const oldestSample = floorSamples.reduce((oldest, current) => 
        current.timestamp < oldest.timestamp ? current : oldest, floorSamples[0]);
      
      // Remove it from training data
      this.trainingData = this.trainingData.filter(s => s !== oldestSample);
    }

    // Add new sample
    this.trainingData.push(sample);
    this.saveTrainingData();
  }
  
  /**
   * Add user-corrected rooms to the training queue
   */
  public addUserCorrections(
    floorId: string,
    imageUrl: string,
    originalDetection: DetectedRoom[],
    userCorrectedRooms: RoomDetail[],
    floorPlanWidth: number,
    floorPlanHeight: number
  ): void {
    // Only add if contributing is enabled
    if (!this.contributingEnabled) return;

    const correctedSample: UserCorrectedSample = {
      timestamp: Date.now(),
      floorId,
      imageUrl,
      detectedRooms: originalDetection,
      manualCorrections: true,
      confidence: 0.9, // High confidence as it's user-corrected
      userCorrectedRooms,
      correctionTimestamp: Date.now(),
      floorPlanWidth,
      floorPlanHeight
    };

    // Add to queue
    this.trainingQueue.push(correctedSample);

    // Trim queue if it's too large
    if (this.trainingQueue.length > MAX_QUEUE_SIZE) {
      this.trainingQueue = this.trainingQueue.slice(-MAX_QUEUE_SIZE);
    }

    this.saveTrainingQueue();
    
    // Show feedback to user
    this.showContributionThanks();
  }
  
  /**
   * Show thank you message to user for contributing
   */
  private showContributionThanks(): void {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = 'rgba(76, 175, 80, 0.9)';
    toast.style.color = 'white';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '4px';
    toast.style.zIndex = '10000';
    toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    toast.style.fontFamily = 'Arial, sans-serif';
    toast.style.fontSize = '14px';
    toast.textContent = 'Thank you for contributing to room detection training!';
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s ease';
      setTimeout(() => document.body.removeChild(toast), 500);
    }, 3000);
  }
  
  /**
   * Get the number of user contributions in the queue
   */
  public getContributionCount(): number {
    return this.trainingQueue.length;
  }
  
  /**
   * Manually upload training data to server
   * Sends collected data to the backend API for processing
   */
  public async uploadTrainingData(): Promise<boolean> {
    if (this.trainingQueue.length === 0) return false;
    
    try {
      console.log('Uploading training data to server...');
      
      // Send data to server API
      const response = await fetch('/api/training/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.trainingQueue)
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      // Clear queue after successful upload
      this.trainingQueue = [];
      this.saveTrainingQueue();
      
      return true;
    } catch (error) {
      console.error('Error uploading training data:', error);
      return false;
    }
  }
  
  /**
   * Train the model with all collected training data
   * @returns Promise resolving to training success status
   */
  public async trainModel(): Promise<boolean> {
    if (this.trainingData.length === 0) {
      console.log('No training data available');
      return false;
    }
    
    try {
      console.log(`Training model with ${this.trainingData.length} samples`);
      
      // Sort samples by timestamp (newest first)
      const sortedSamples = [...this.trainingData].sort((a, b) => b.timestamp - a.timestamp);
      
      // Process each sample
      let successCount = 0;
      
      for (const sample of sortedSamples) {
        try {
          // Load image
          const img = await this.loadImage(sample.imageUrl);
          
          // Train on sample
          const success = await neuralDetection.trainOnSample(img, sample.detectedRooms);
          
          if (success) {
            successCount++;
          }
        } catch (error) {
          console.error('Error processing training sample:', error);
        }
      }
      
      // Update stats
      this.stats.lastTrainingDate = Date.now();
      this.stats.accuracyHistory.push({
        date: Date.now(),
        accuracy: successCount / sortedSamples.length
      });
      
      // Keep only the last 10 accuracy records
      if (this.stats.accuracyHistory.length > 10) {
        this.stats.accuracyHistory = this.stats.accuracyHistory.slice(-10);
      }
      
      this.saveStats();
      
      console.log(`Model training completed. ${successCount}/${sortedSamples.length} samples processed successfully`);
      return successCount > 0;
    } catch (error) {
      console.error('Error training model:', error);
      return false;
    }
  }
  
  /**
   * Get training statistics
   * @returns Current training statistics
   */
  public getTrainingStats(): {
    totalSamples: number;
    userCorrectionCount: number;
    floorCoverage: Record<string, number>;
    pendingUploads: number;
  } {
    const floorCoverage: Record<string, number> = {};
    
    this.trainingData.forEach(sample => {
      floorCoverage[sample.floorId] = (floorCoverage[sample.floorId] || 0) + 1;
    });
    
    return {
      totalSamples: this.trainingData.length,
      userCorrectionCount: this.trainingData.filter(s => s.manualCorrections).length,
      floorCoverage,
      pendingUploads: this.trainingQueue.length
    };
  }
  
  /**
   * Clear all training data
   */
  public clearTrainingData(): void {
    this.trainingData = [];
    this.saveTrainingData();
    
    // Reset stats
    this.stats.totalSamples = 0;
    this.stats.floorCoverage = {};
    this.saveStats();
  }
  
  /**
   * Helper function to load an image
   */
  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
}

// Export singleton instance
export const modelTrainingService = new ModelTrainingService(); 