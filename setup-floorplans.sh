#!/bin/bash

# Floor Plan Setup Script
# This script automates the floor plan setup process for the Building Visualization component

echo "===== Building Visualization - Floor Plan Setup ====="
echo "This script will setup floor plans for the visualization tool."

# Define source and destination directories
SOURCE_DIR="./__all folder__/floorplan"
PUBLIC_DIR="./client/public/floorplan"
PYTHON_SCRIPT="./server/src/scripts/roomDetection.py"

# Create destination directory if it doesn't exist
mkdir -p "$PUBLIC_DIR"

echo "1. Checking for source floor plans..."
if [ ! -d "$SOURCE_DIR" ]; then
    echo "ERROR: Source directory not found: $SOURCE_DIR"
    echo "Please ensure floor plan images are in __all folder__/floorplan"
    exit 1
fi

# Count source floor plans
SOURCE_COUNT=$(find "$SOURCE_DIR" -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" | wc -l)
if [ "$SOURCE_COUNT" -eq 0 ]; then
    echo "ERROR: No floor plan images found in $SOURCE_DIR"
    echo "Please add floor plan images in JPG, JPEG, or PNG format"
    exit 1
fi

echo "Found $SOURCE_COUNT floor plan images"

# Clear the public floorplan directory of existing floor plan images
echo "2. Clearing destination directory..."
rm -f "$PUBLIC_DIR"/*.jpg "$PUBLIC_DIR"/*.jpeg "$PUBLIC_DIR"/*.png

# Copy and rename floor plans with proper naming convention
echo "3. Copying and renaming floor plans to match required format..."

# Process each floor
for FLOOR in "ground" "mezzanine" "second" "third" "fourth" "fifth"; do
    # Find and copy lighting files
    LIGHTING_FILE=$(find "$SOURCE_DIR" -type f -iname "*${FLOOR}*lighting*.jpg" -o -iname "*${FLOOR}*lighting*.jpeg" -o -iname "*${FLOOR}*lighting*.png" | head -n 1)
    if [ -n "$LIGHTING_FILE" ]; then
        echo "Processing lighting file for $FLOOR floor: $(basename "$LIGHTING_FILE")"
        cp "$LIGHTING_FILE" "$PUBLIC_DIR/${FLOOR}-floor-lighting.jpg"
        echo "Renamed to ${FLOOR}-floor-lighting.jpg"
    else
        echo "WARNING: No lighting file found for $FLOOR floor"
    fi
    
    # Find and copy power files
    POWER_FILE=$(find "$SOURCE_DIR" -type f -iname "*${FLOOR}*power*.jpg" -o -iname "*${FLOOR}*power*.jpeg" -o -iname "*${FLOOR}*power*.png" | head -n 1)
    if [ -n "$POWER_FILE" ]; then
        echo "Processing power file for $FLOOR floor: $(basename "$POWER_FILE")"
        cp "$POWER_FILE" "$PUBLIC_DIR/${FLOOR}-floor-power.jpg"
        echo "Renamed to ${FLOOR}-floor-power.jpg"
    else
        echo "WARNING: No power file found for $FLOOR floor"
    fi
done

# Count how many files were processed
PROCESSED_COUNT=$(find "$PUBLIC_DIR" -name "*-floor-*.jpg" | wc -l)
echo "Successfully processed $PROCESSED_COUNT floor plan files"

if [ "$PROCESSED_COUNT" -eq 0 ]; then
    echo "ERROR: No floor plans were processed. Check file naming patterns."
    exit 1
fi

# Run image processing script to remove text elements
echo "4. Running image processing to remove text elements..."
echo "This will remove 'Figure', 'Page Number', and layout text from images..."
if command -v node &>/dev/null; then
    if [ -f "server/src/scripts/processFloorplans.js" ]; then
        node server/src/scripts/processFloorplans.js
    else
        echo "WARNING: processFloorplans.js not found"
    fi
else
    echo "WARNING: Node.js not found. Cannot run text removal processing."
fi

# Run room detection if Python is available
echo "5. Checking for Python to run room detection..."
if command -v python3 &>/dev/null; then
    echo "Python found. Checking for OpenCV..."
    
    # Check if OpenCV is installed
    if python3 -c "import cv2" 2>/dev/null; then
        echo "OpenCV found. Running room detection..."
        python3 "$PYTHON_SCRIPT"
    else
        echo "WARNING: OpenCV not found. Room detection requires OpenCV."
        echo "Please install it with: pip install opencv-python numpy"
        echo "Then run: python3 $PYTHON_SCRIPT"
    fi
else
    if command -v python &>/dev/null; then
        echo "Python found. Checking for OpenCV..."
        
        # Check if OpenCV is installed using 'python' command
        if python -c "import cv2" 2>/dev/null; then
            echo "OpenCV found. Running room detection..."
            python "$PYTHON_SCRIPT"
        else
            echo "WARNING: OpenCV not found. Room detection requires OpenCV."
            echo "Please install it with: pip install opencv-python numpy"
        fi
    else
        echo "WARNING: Python not found. Room detection requires Python with OpenCV."
    fi
fi

echo "===== Floor Plan Setup Complete ====="
echo "Floor plans are ready to use in the Building Visualization component."
echo "You can now run the application with: npm run dev" 