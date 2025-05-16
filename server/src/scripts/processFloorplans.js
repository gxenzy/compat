/**
 * Floor Plan Processing Script
 * ----------------------------
 * 
 * This script processes floor plan images to prepare them for room detection:
 * 1. Removes text elements (Figure numbers, page numbers, titles)
 * 2. Enhances contrast for better wall detection
 * 3. Saves processed images for further analysis
 * 
 * Usage:
 *   node processFloorplans.js
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Directory paths
const FLOORPLAN_DIR = path.join(process.cwd(), 'client', 'public', 'floorplan');
const PROCESSED_DIR = path.join(FLOORPLAN_DIR, 'processed');

// Create processed directory if it doesn't exist
if (!fs.existsSync(PROCESSED_DIR)) {
  fs.mkdirSync(PROCESSED_DIR, { recursive: true });
}

// Text removal thresholds
const TEXT_SIZE_THRESHOLD = 30; // Maximum text component size
const EDGE_THRESHOLD = 50;      // Threshold for edge detection
const TEXT_COLOR_THRESHOLD = 50; // Grayscale threshold for text detection

/**
 * Load an image file and return a canvas with the image drawn on it
 */
async function loadAndCreateCanvas(imagePath) {
  try {
    const image = await loadImage(imagePath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    return { canvas, ctx, width: image.width, height: image.height };
  } catch (error) {
    console.error(`Error loading image ${imagePath}:`, error);
    throw error;
  }
}

/**
 * Remove text elements from floor plan
 * This focuses on removing figure numbers, page numbers, and titles
 */
function removeTextElements(ctx, width, height) {
  console.log('Removing text elements...');
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // 1. Clear border areas (where figure numbers and page numbers typically appear)
  const borderWidth = Math.round(width * 0.05);  // 5% of width
  const borderHeight = Math.round(height * 0.05); // 5% of height
  
  // Clear top border (titles)
  for (let y = 0; y < borderHeight; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      data[idx] = 255;     // R
      data[idx + 1] = 255; // G
      data[idx + 2] = 255; // B
    }
  }
  
  // Clear bottom border (page numbers)
  for (let y = height - borderHeight; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
    }
  }
  
  // Clear left and right borders
  for (let y = 0; y < height; y++) {
    // Left border
    for (let x = 0; x < borderWidth; x++) {
      const idx = (y * width + x) * 4;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
    }
    
    // Right border
    for (let x = width - borderWidth; x < width; x++) {
      const idx = (y * width + x) * 4;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
    }
  }
  
  // 2. Remove text in the corner areas (often contains figure labels)
  const cornerSize = Math.round(Math.min(width, height) * 0.1); // 10% of smaller dimension
  
  // Bottom-right corner (often contains figure references)
  for (let y = height - cornerSize; y < height; y++) {
    for (let x = width - cornerSize; x < width; x++) {
      const idx = (y * width + x) * 4;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
    }
  }
  
  // 3. Detect and remove small text-like objects throughout the image
  // This uses a simplified connected component analysis
  
  // Convert to grayscale for processing
  const grayscale = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    grayscale[i] = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
  }
  
  // Create binary image (text is dark, background is light)
  const binary = new Uint8Array(width * height);
  for (let i = 0; i < grayscale.length; i++) {
    binary[i] = grayscale[i] < TEXT_COLOR_THRESHOLD ? 1 : 0;
  }
  
  // Connected component labeling
  const labels = new Int32Array(width * height).fill(0);
  let nextLabel = 1;
  
  // First pass: assign initial labels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      // Skip background pixels
      if (binary[idx] === 0) continue;
      
      // Check neighbors (4-connectivity)
      const neighbors = [];
      
      if (x > 0 && binary[idx - 1] === 1) {
        neighbors.push(labels[idx - 1]);
      }
      
      if (y > 0 && binary[idx - width] === 1) {
        neighbors.push(labels[idx - width]);
      }
      
      if (neighbors.length === 0) {
        // New component
        labels[idx] = nextLabel++;
      } else {
        // Use minimum of neighbor labels
        labels[idx] = Math.min(...neighbors.filter(n => n > 0));
      }
    }
  }
  
  // Calculate component sizes
  const componentSizes = new Map();
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    if (label > 0) {
      componentSizes.set(label, (componentSizes.get(label) || 0) + 1);
    }
  }
  
  // Remove small components (likely to be text)
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    if (label > 0 && componentSizes.get(label) < TEXT_SIZE_THRESHOLD) {
      const idx = i * 4;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
    }
  }
  
  // Update image with modified data
  ctx.putImageData(imageData, 0, 0);
  console.log('Text elements removed');
}

/**
 * Enhance contrast to make walls more visible
 */
function enhanceContrast(ctx, width, height) {
  console.log('Enhancing contrast...');
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Calculate histogram
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    histogram[gray]++;
  }
  
  // Find minimum and maximum non-zero values
  let min = 0;
  let max = 255;
  
  for (let i = 0; i < 256; i++) {
    if (histogram[i] > 0) {
      min = i;
      break;
    }
  }
  
  for (let i = 255; i >= 0; i--) {
    if (histogram[i] > 0) {
      max = i;
      break;
    }
  }
  
  // Apply contrast stretching
  const range = max - min;
  for (let i = 0; i < data.length; i += 4) {
    for (let j = 0; j < 3; j++) {
      const value = data[i + j];
      data[i + j] = Math.max(0, Math.min(255, Math.round((value - min) * 255 / range)));
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  console.log('Contrast enhanced');
}

/**
 * Process a single floor plan image
 */
async function processFloorPlan(filename) {
  const inputPath = path.join(FLOORPLAN_DIR, filename);
  const outputPath = path.join(PROCESSED_DIR, filename);
  
  console.log(`Processing ${filename}...`);
  
  try {
    // Load image and create canvas
    const { canvas, ctx, width, height } = await loadAndCreateCanvas(inputPath);
    
    // 1. Remove text elements
    removeTextElements(ctx, width, height);
    
    // 2. Enhance contrast
    enhanceContrast(ctx, width, height);
    
    // Save processed image
    const outputStream = fs.createWriteStream(outputPath);
    const stream = canvas.createJPEGStream({ quality: 0.95 });
    stream.pipe(outputStream);
    
    return new Promise((resolve, reject) => {
      outputStream.on('finish', () => {
        console.log(`Saved processed image to ${outputPath}`);
        resolve();
      });
      
      outputStream.on('error', reject);
    });
  } catch (error) {
    console.error(`Error processing ${filename}:`, error);
    throw error;
  }
}

/**
 * Process all floor plan images
 */
async function processAllFloorPlans() {
  console.log('Starting floor plan processing...');
  
  try {
    // Get all floor plan images
    const files = fs.readdirSync(FLOORPLAN_DIR)
      .filter(filename => 
        filename.endsWith('.jpg') || 
        filename.endsWith('.jpeg') || 
        filename.endsWith('.png')
      )
      .filter(filename => !filename.includes('processed'));
    
    console.log(`Found ${files.length} floor plan images to process`);
    
    // Process each image
    for (const filename of files) {
      await processFloorPlan(filename);
    }
    
    console.log('Floor plan processing complete!');
    
    // Copy processed images back to original directory
    console.log('Copying processed images back to original directory...');
    
    const processedFiles = fs.readdirSync(PROCESSED_DIR);
    for (const filename of processedFiles) {
      const sourcePath = path.join(PROCESSED_DIR, filename);
      const destPath = path.join(FLOORPLAN_DIR, filename);
      fs.copyFileSync(sourcePath, destPath);
    }
    
    console.log('Process complete!');
  } catch (error) {
    console.error('Error processing floor plans:', error);
    process.exit(1);
  }
}

// Run the main function
processAllFloorPlans(); 