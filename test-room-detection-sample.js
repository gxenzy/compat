/**
 * Test Room Detection with Sample Floor Plan
 * 
 * This script generates a sample floor plan image and tests the OpenCV-based room detection
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path configurations
const WORKSPACE_ROOT = process.cwd();
const OPENCV_SCRIPT_PATH = path.join(WORKSPACE_ROOT, 'server', 'src', 'scripts', 'enhancedRoomDetection.py');
const OUTPUT_DIR = path.join(WORKSPACE_ROOT, 'server', 'src', 'data', 'roomDetection');
const SAMPLE_IMAGE_PATH = path.join(WORKSPACE_ROOT, 'sample-floorplan.jpg');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Created output directory: ${OUTPUT_DIR}`);
}

// Create a sample floor plan image
console.log('Creating sample floor plan image for testing...');

// Create a simple floor plan image using Python and OpenCV
const createSampleImage = spawn('python', ['-c', `
import cv2
import numpy as np

# Create a blank white image (800x600)
img = np.ones((600, 800, 3), np.uint8) * 255

# Draw some room walls (rectangles)
rooms = [
    (50, 50, 200, 150),    # Room 1: (x, y, width, height)
    (300, 50, 200, 150),   # Room 2
    (550, 50, 200, 150),   # Room 3
    (50, 250, 200, 150),   # Room 4
    (300, 250, 200, 150),  # Room 5
    (550, 250, 200, 150),  # Room 6
    (50, 450, 300, 100),   # Room 7
    (400, 450, 350, 100)   # Room 8
]

# Draw the rooms
for x, y, w, h in rooms:
    cv2.rectangle(img, (x, y), (x+w, y+h), (0, 0, 0), 2)

# Add some text labels for rooms
labels = [
    "Office 101",
    "Meeting Room",
    "Storage",
    "Restroom",
    "Lobby",
    "Conference",
    "Hallway",
    "Reception"
]

for i, (x, y, w, h) in enumerate(rooms):
    cv2.putText(img, labels[i], (x+10, y+30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 100, 100), 1)

# Add a title
cv2.putText(img, "Floor Plan - Ground Floor", (250, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)

# Save the image
cv2.imwrite("${SAMPLE_IMAGE_PATH}", img)
print(f"Sample image saved to ${SAMPLE_IMAGE_PATH}")
`]);

createSampleImage.stdout.on('data', (data) => {
  console.log(`[Python] ${data.toString().trim()}`);
});

createSampleImage.stderr.on('data', (data) => {
  console.error(`[Python Error] ${data.toString().trim()}`);
});

createSampleImage.on('close', (code) => {
  if (code === 0) {
    console.log(`Sample floor plan image created: ${SAMPLE_IMAGE_PATH}`);
    runDetection(SAMPLE_IMAGE_PATH);
  } else {
    console.error('Failed to create sample image');
    process.exit(1);
  }
});

/**
 * Run the OpenCV room detection on the provided image
 */
function runDetection(imagePath) {
  console.log(`Processing floor plan: ${imagePath}`);
  
  // Run the Python script
  const pythonProcess = spawn('python', [OPENCV_SCRIPT_PATH, imagePath]);
  
  // Handle process output
  pythonProcess.stdout.on('data', (data) => {
    console.log(`[Python] ${data.toString().trim()}`);
  });
  
  pythonProcess.stderr.on('data', (data) => {
    console.error(`[Python Error] ${data.toString().trim()}`);
  });
  
  pythonProcess.on('close', (code) => {
    if (code === 0) {
      // Process completed successfully
      const baseName = path.basename(imagePath, path.extname(imagePath));
      const outputJsonPath = path.join(OUTPUT_DIR, `${baseName}_enhanced_rooms.json`);
      const visualizationPath = path.join(OUTPUT_DIR, `${baseName}_enhanced_detection.jpg`);
      
      if (fs.existsSync(outputJsonPath)) {
        // Read and display the detection results
        const detectionResults = JSON.parse(fs.readFileSync(outputJsonPath, 'utf8'));
        
        console.log('\nDetection Results:');
        console.log(`Floor: ${detectionResults.floor}`);
        console.log(`Image Size: ${detectionResults.width}x${detectionResults.height}`);
        console.log(`Detected Rooms: ${detectionResults.rooms.length}`);
        
        // Show room details
        if (detectionResults.rooms.length > 0) {
          console.log('\nRoom Details:');
          detectionResults.rooms.forEach((room, index) => {
            console.log(`  Room ${index + 1}: ${room.name} (${room.type})`);
            console.log(`    Size: ${room.width}x${room.height} (${room.area.toFixed(2)} px²)`);
            console.log(`    Position: (${room.x}, ${room.y})`);
            console.log(`    Confidence: ${(room.confidence * 100).toFixed(1)}%`);
          });
        }
        
        console.log(`\nResults saved to: ${outputJsonPath}`);
        
        if (fs.existsSync(visualizationPath)) {
          console.log(`Visualization saved to: ${visualizationPath}`);
        }
      } else {
        console.error('Error: Detection results not found');
      }
    } else {
      console.error(`Python process exited with code ${code}`);
    }
  });
} 