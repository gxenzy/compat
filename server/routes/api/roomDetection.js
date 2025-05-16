const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Workspace root directory
const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..', '..');

// Script paths
const OPENCV_SCRIPT_PATH = path.join(WORKSPACE_ROOT, 'server', 'src', 'scripts', 'enhancedRoomDetection.py');
const ROOM_DETECTION_DATA_DIR = path.join(WORKSPACE_ROOT, 'server', 'src', 'data', 'roomDetection');

// Ensure the data directory exists
if (!fs.existsSync(ROOM_DETECTION_DATA_DIR)) {
  fs.mkdirSync(ROOM_DETECTION_DATA_DIR, { recursive: true });
}

/**
 * @route   POST /api/room-detection/opencv
 * @desc    Process floor plan with OpenCV room detection
 * @access  Private
 */
router.post('/opencv', async (req, res) => {
  try {
    const { imagePath, width, height } = req.body;
    
    if (!imagePath) {
      return res.status(400).json({ error: 'Image path is required' });
    }
    
    // Convert relative path to absolute path if needed
    const fullImagePath = imagePath.startsWith('/') ? 
      path.join(WORKSPACE_ROOT, imagePath.substring(1)) : 
      path.join(WORKSPACE_ROOT, imagePath);
    
    // Check if the image exists
    if (!fs.existsSync(fullImagePath)) {
      return res.status(404).json({ error: `Image not found: ${imagePath}` });
    }
    
    // Process a single floor plan with the Python script
    const pythonProcess = spawn('python', [OPENCV_SCRIPT_PATH, fullImagePath]);
    
    let outputData = '';
    let errorData = '';
    
    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python process exited with code ${code}`);
        console.error('Error output:', errorData);
        return res.status(500).json({ 
          error: 'Room detection failed', 
          details: errorData
        });
      }
      
      // Get the output file path
      const imageFileName = path.basename(fullImagePath);
      const baseName = path.parse(imageFileName).name;
      const outputJsonPath = path.join(ROOM_DETECTION_DATA_DIR, `${baseName}_enhanced_rooms.json`);
      
      // Check if output file exists
      if (!fs.existsSync(outputJsonPath)) {
        return res.status(500).json({ 
          error: 'Room detection output not found',
          details: outputData
        });
      }
      
      // Read the output file
      const detectionResult = JSON.parse(fs.readFileSync(outputJsonPath, 'utf8'));
      
      // Add container dimensions to the result
      detectionResult.containerWidth = width;
      detectionResult.containerHeight = height;
      detectionResult.orientation = 'landscape';
      detectionResult.confidenceScore = 0.85;
      
      return res.json(detectionResult);
    });
  } catch (error) {
    console.error('Room detection error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/room-detection/floors/:floorId
 * @desc    Get saved room detection data for a specific floor
 * @access  Private
 */
router.get('/floors/:floorId', (req, res) => {
  try {
    const { floorId } = req.params;
    
    if (!floorId) {
      return res.status(400).json({ error: 'Floor ID is required' });
    }
    
    // Find matching detection results
    const files = fs.readdirSync(ROOM_DETECTION_DATA_DIR);
    const matchingFile = files.find(file => 
      file.includes(floorId) && file.endsWith('_enhanced_rooms.json')
    );
    
    if (!matchingFile) {
      return res.status(404).json({ error: `No room detection data found for floor: ${floorId}` });
    }
    
    // Read the data
    const filePath = path.join(ROOM_DETECTION_DATA_DIR, matchingFile);
    const detectionData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    return res.json(detectionData);
  } catch (error) {
    console.error('Error retrieving room detection data:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router; 