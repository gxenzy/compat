#!/usr/bin/env node
/**
 * Floor Plan Processing Script
 * 
 * This script:
 * 1. Runs the Python preprocessFloorplans.py script to remove text and ensure landscape orientation
 * 2. Updates the floorPlanConfig.ts file to use the processed images
 * 3. Provides a simple CLI for processing floor plans
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// Configuration
const PYTHON_SCRIPT = path.join(__dirname, '../server/src/scripts/preprocessFloorplans.py');
const CONFIG_FILE = path.join(__dirname, '../client/src/pages/Energy Audit/components/BuildingVisualization/config/floorPlanConfig.ts');
const INPUT_DIR = path.join(__dirname, '../client/public/floorplan');
const OUTPUT_DIR = path.join(__dirname, '../client/public/floorplan/processed');

/**
 * Run the Python preprocessing script
 */
async function runPreprocessing() {
  return new Promise((resolve, reject) => {
    console.log('Running floor plan preprocessing script...');
    
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Determine correct Python command (python3 or python)
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    
    // Run the preprocessing script
    const pythonProcess = spawn(pythonCommand, [
      PYTHON_SCRIPT,
      '--input', INPUT_DIR,
      '--output', OUTPUT_DIR
    ]);
    
    pythonProcess.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    pythonProcess.stderr.on('data', (data) => {
      console.error(`Error: ${data.toString()}`);
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Floor plan preprocessing completed successfully');
        resolve();
      } else {
        reject(new Error(`Python script exited with code ${code}`));
      }
    });
  });
}

/**
 * Update the floor plan config file to use processed images
 */
async function updateConfigPaths() {
  try {
    console.log(`Updating config file: ${CONFIG_FILE}`);
    
    // Read the config file
    const configContent = await readFile(CONFIG_FILE, 'utf8');
    
    // Check if processed directory already being used
    if (configContent.includes('/floorplan/processed/')) {
      console.log('Config file already using processed images.');
      return;
    }
    
    // Replace image paths to use the processed directory
    const updatedContent = configContent.replace(
      /['"]\/floorplan\/([^'"]+)['"] ?\+/g, 
      '"/floorplan/processed/$1" +'
    );
    
    // Write the updated config
    await writeFile(CONFIG_FILE, updatedContent, 'utf8');
    console.log('Config file updated to use processed floor plan images');
  } catch (error) {
    console.error('Error updating config file:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting floor plan processing...');
    
    // Step 1: Preprocess floor plan images
    await runPreprocessing();
    
    // Step 2: Update config to use processed images
    await updateConfigPaths();
    
    console.log('Floor plan processing completed successfully');
  } catch (error) {
    console.error('Error processing floor plans:', error);
    process.exit(1);
  }
}

// Run the script
main(); 