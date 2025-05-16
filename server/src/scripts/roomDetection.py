"""
Room Detection Script using OpenCV
----------------------------------

This script detects rooms in floor plan images using OpenCV.
The detection pipeline includes:
1. Text detection to find room labels
2. Flood filling from text locations to identify room boundaries
3. Contour extraction for room shapes
4. Exporting detected rooms to JSON for use in the application

Usage:
    python roomDetection.py [floorplan_image_path]
"""

import os
import sys
import json
import uuid
import numpy as np
import cv2
import pytesseract
from pathlib import Path
import re
import math

# Default paths
FLOORPLAN_DIR = os.path.join('client', 'public', 'floorplan')
OUTPUT_DIR = os.path.join('server', 'src', 'data', 'roomDetection')

# Ensure output directory exists
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR, exist_ok=True)

# Mapping of common room types based on size and proportion
ROOM_TYPES = {
    "large_square": "office",
    "large_rectangle": "classroom",
    "medium_square": "conference",
    "small_square": "storage",
    "small_rectangle": "restroom", 
    "corridor": "hallway",
    "entrance": "reception",
    "tiny": "utility"
}

def load_image(image_path):
    """Load an image and ensure it's in the correct format"""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")
    
    # Load image
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Failed to load image: {image_path}")
    
    # Convert to RGB format for processing
    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

def preprocess_for_text_detection(image):
    """
    Preprocess the image to enhance text for detection
    """
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    
    # Apply adaptive thresholding to get binary image
    binary = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY_INV, 11, 2
    )
    
    # Clean up noise
    kernel = np.ones((2, 2), np.uint8)
    cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=1)
    
    return cleaned, gray

def detect_text_regions(image):
    """
    Detect potential text regions in the image using OCR or contour analysis
    Returns list of (x, y, w, h) bounding boxes for text regions
    """
    # Convert to grayscale if it's not already
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    else:
        gray = image.copy()
    
    # Apply binary thresholding
    _, binary = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY_INV)
    
    # Find potential text contours
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Filter contours to find potential text regions
    text_regions = []
    height, width = gray.shape
    
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        area = cv2.contourArea(contour)
        
        # Filter based on properties of typical text
        # Text is usually small, not taking up too much area, and has reasonable aspect ratio
        if area < 5000 and area > 100 and w < width * 0.2 and h < height * 0.2:
            # Aspect ratio check for text (not too stretched)
            aspect_ratio = float(w) / h if h > 0 else 0
            if 0.2 < aspect_ratio < 5.0:
                text_regions.append((x, y, w, h))
    
    return text_regions

def get_room_contour(image, text_region):
    """
    Detect room contour by flood filling from text region
    Uses the approach described in the blog post
    
    Args:
        image: Original image
        text_region: (x, y, w, h) bounding box of the text
        
    Returns:
        Contour of the detected room
    """
    # Create a copy of the image for processing
    height, width = image.shape[:2]
    
    # 1. Binarize the image
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    else:
        gray = image.copy()
    
    # Apply thresholding to get binary image (walls as black)
    _, binary = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)
    
    # Make a copy for flood filling
    flood_image = binary.copy()
    
    # 2. Find a good seed point inside the room but outside the text box
    x, y, w, h = text_region
    
    # Calculate the center of the text box
    center_x = x + w // 2
    center_y = y + h // 2
    
    # Try different offsets from the text box center
    seed_points = [
        (center_x, center_y - h),  # Above text
        (center_x, center_y + h),  # Below text
        (center_x - w, center_y),  # Left of text
        (center_x + w, center_y)   # Right of text
    ]
    
    # We'll use the first seed point that is within bounds and not on a wall (white pixel)
    seed_point = None
    for sx, sy in seed_points:
        if 0 <= sx < width and 0 <= sy < height and binary[sy, sx] == 255:
            seed_point = (sx, sy)
            break
    
    # If no valid seed point was found, use center of the text as a fallback
    if seed_point is None:
        seed_point = (center_x, center_y)
    
    # 3. Apply flood fill from the seed point
    # Create mask for flood fill (must be 2 pixels larger than image)
    mask = np.zeros((height + 2, width + 2), np.uint8)
    
    # Use a neutral gray for flood fill
    flood_value = 128
    
    # Apply flood fill
    cv2.floodFill(flood_image, mask, seed_point, flood_value)
    
    # 4. Binarize again to isolate the room
    room_mask = cv2.inRange(flood_image, flood_value, flood_value)
    
    # 5. Fill the text-shaped hole left by the flood fill
    cv2.rectangle(room_mask, (x, y), (x + w, y + h), 255, -1)
    
    # 6. Find contours in the room mask
    contours, _ = cv2.findContours(room_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # If no contours found, return None
    if not contours:
        return None
    
    # Return the largest contour which should be the room
    return max(contours, key=cv2.contourArea)

def classify_room_type(area, aspect_ratio, total_area):
    """Classify room type based on size and shape"""
    area_ratio = area / total_area
    
    if area_ratio > 0.25:  # Very large room
        if aspect_ratio > 3.0:
            return "hallway"
        return "hall"
    
    if area_ratio > 0.15:  # Large room
        if 0.7 < aspect_ratio < 1.3:
            return "conference"
        if aspect_ratio > 2.0:
            return "hallway"
        return "classroom"
    
    if area_ratio > 0.05:  # Medium room
        if 0.7 < aspect_ratio < 1.3:
            return "office"
        if aspect_ratio > 3.0:
            return "hallway"
        return "laboratory"
    
    if area_ratio > 0.02:  # Small room
        if 0.7 < aspect_ratio < 1.3:
            return "storage"
        if aspect_ratio > 2.5:
            return "corridor"
        return "office"
    
    # Very small room
    if 0.7 < aspect_ratio < 1.3:
        return "utility"
    if aspect_ratio > 3.0:
        return "corridor"
    
    return "storage"  # Default for very small rooms

def create_room_visualization(original_image, rooms):
    """Create visualization of detected rooms with colored overlays"""
    # Create a copy of the original image for visualization
    visualization = original_image.copy()
    
    # Define distinct colors for rooms
    room_colors = [
        (255, 0, 0),     # Red
        (0, 255, 0),     # Green
        (0, 0, 255),     # Blue
        (255, 0, 255),   # Magenta
        (0, 255, 255),   # Cyan
        (255, 255, 0),   # Yellow
        (128, 0, 128),   # Purple
        (0, 128, 0),     # Dark green
        (128, 0, 0),     # Maroon
        (0, 0, 128),     # Navy
        (128, 128, 0),   # Olive
        (0, 128, 128),   # Teal
        (255, 165, 0),   # Orange
        (75, 0, 130),    # Indigo
    ]
    
    # Draw each room with a different color and label
    for i, room in enumerate(rooms):
        color = room_colors[i % len(room_colors)]
        
        # Draw room contour
        if 'contour' in room:
            contour = np.array(room['contour']).reshape((-1, 1, 2)).astype(np.int32)
            cv2.drawContours(visualization, [contour], -1, color, 2)
            
            # Fill room with transparent color
            overlay = visualization.copy()
            cv2.drawContours(overlay, [contour], -1, color, -1)
            alpha = 0.3  # Transparency factor
            cv2.addWeighted(overlay, alpha, visualization, 1 - alpha, 0, visualization)
            
            # Add room label
            # Calculate the centroid of the contour
            M = cv2.moments(contour)
            if M["m00"] != 0:
                cx = int(M["m10"] / M["m00"])
                cy = int(M["m01"] / M["m00"])
            else:
                cx = room['x'] + room['width'] // 2
                cy = room['y'] + room['height'] // 2
                
            # Add room label with white background
            label = f"room_{chr(65+i)}"
            text_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)[0]
            cv2.rectangle(
                visualization,
                (cx - text_size[0] // 2 - 5, cy - text_size[1] // 2 - 5),
                (cx + text_size[0] // 2 + 5, cy + text_size[1] // 2 + 5),
                (255, 255, 255),
                -1
            )
            cv2.putText(
                visualization,
                label,
                (cx - text_size[0] // 2, cy + text_size[1] // 2),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                color,
                2
            )
            
            # Add room type label
            type_label = f"{room['type']} ({room['area'] / 100:.1f}m²)"
            cv2.putText(
                visualization,
                type_label,
                (room['x'] + 5, room['y'] + room['height'] - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 0, 0),
                1
            )
            
    return visualization

def process_floorplan(image_path):
    """Process a floor plan image and detect rooms"""
    print(f"Processing: {image_path}")
    
    # Extract floor type from filename
    floor_name = Path(image_path).stem
    floor_type = "unknown"
    
    # Try to determine floor level from filename
    floor_match = re.search(r'(ground|mezzanine|first|second|third|fourth|fifth)', floor_name.lower())
    if floor_match:
        floor_type = floor_match.group(1)
    
    # Load image
    original = load_image(image_path)
    height, width = original.shape[:2]
    total_area = height * width
    
    # Preprocess for text detection
    preprocessed, gray = preprocess_for_text_detection(original)
    
    # Detect text regions
    text_regions = detect_text_regions(gray)
    print(f"Detected {len(text_regions)} potential text regions")
    
    # Process each text region to find room contours
    rooms = []
    
    for i, region in enumerate(text_regions):
        # Get room contour using flood fill approach
        contour = get_room_contour(original, region)
        
        if contour is not None:
            # Get bounding rectangle
            x, y, w, h = cv2.boundingRect(contour)
            
            # Calculate area and aspect ratio
            area = cv2.contourArea(contour)
            aspect_ratio = float(w) / h if h > 0 else 0
            
            # Filter out unreasonably small or large areas
            min_area = total_area * 0.003  # 0.3% of total area
            max_area = total_area * 0.6    # 60% of total area
            
            if min_area < area < max_area and 0.1 < aspect_ratio < 10:
                # Generate unique ID
                room_id = f"room-{str(uuid.uuid4())[:8]}"
                
                # Determine room type
                room_type = classify_room_type(area, aspect_ratio, total_area)
                
                # Add to rooms list
                rooms.append({
                    "id": room_id,
                    "name": f"Room {len(rooms) + 1}",
                    "type": room_type,
                    "x": int(x),
                    "y": int(y),
                    "width": int(w),
                    "height": int(h),
                    "area": int(area),
                    "aspect_ratio": float(aspect_ratio),
                    "confidence": 0.85,
                    "contour": contour.tolist()
                })
    
    # Remove duplicate/overlapping rooms (keep the larger one)
    filtered_rooms = []
    for room in sorted(rooms, key=lambda r: r['area'], reverse=True):
        should_add = True
        for existing in filtered_rooms:
            # Check for significant overlap
            x1, y1, w1, h1 = room['x'], room['y'], room['width'], room['height']
            x2, y2, w2, h2 = existing['x'], existing['y'], existing['width'], existing['height']
            
            # Calculate overlap area
            overlap_x = max(0, min(x1 + w1, x2 + w2) - max(x1, x2))
            overlap_y = max(0, min(y1 + h1, y2 + h2) - max(y1, y2))
            overlap_area = overlap_x * overlap_y
            
            # If significant overlap, don't add
            if overlap_area > 0.7 * min(room['area'], existing['area']):
                should_add = False
                break
                
        if should_add:
            filtered_rooms.append(room)
    
    # Prepare rooms data for JSON (without contours)
    rooms_json = []
    for room in filtered_rooms:
        room_dict = {}
        for k, v in room.items():
            if k != 'contour':
                room_dict[k] = v
        rooms_json.append(room_dict)
    
    # Generate output file path
    filename = Path(image_path).stem
    output_path = os.path.join(OUTPUT_DIR, f"{filename}_rooms.json")
    
    # Save results to JSON
    result = {
        "source": image_path,
        "width": width,
        "height": height,
        "floor": floor_type,
        "rooms": rooms_json,
        "processingComplete": True
    }
    
    with open(output_path, 'w') as f:
        json.dump(result, f, indent=2)
    
    # Create visualizations
    print("Creating visualizations...")
    
    # Create visualization with detected rooms
    visualization = create_room_visualization(original, filtered_rooms)
    vis_path = os.path.join(OUTPUT_DIR, f"{filename}_visualization.jpg")
    cv2.imwrite(vis_path, cv2.cvtColor(visualization, cv2.COLOR_RGB2BGR))
    
    # Create overlay visualization on original floor plan
    overlay = original.copy()
    for i, room in enumerate(filtered_rooms):
        color = (0, 255, 0) if i % 2 == 0 else (255, 0, 0)  # Alternate green/red
        contour = np.array(room['contour']).reshape((-1, 1, 2)).astype(np.int32)
        cv2.drawContours(overlay, [contour], -1, color, 2)
    
    overlay_path = os.path.join(OUTPUT_DIR, f"{filename}_overlay.jpg")
    cv2.imwrite(overlay_path, cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR))
    
    print(f"Detected {len(filtered_rooms)} rooms. Results saved to {output_path}")
    print(f"Visualizations saved to {vis_path} and {overlay_path}")
    
    return filtered_rooms

def process_all_floorplans():
    """Process all floor plans in the specified directory"""
    if not os.path.exists(FLOORPLAN_DIR):
        print(f"Floorplan directory not found: {FLOORPLAN_DIR}")
        return
    
    for filename in os.listdir(FLOORPLAN_DIR):
        if filename.endswith(('.jpg', '.jpeg', '.png')) and not filename.startswith('placeholder'):
            image_path = os.path.join(FLOORPLAN_DIR, filename)
            try:
                process_floorplan(image_path)
            except Exception as e:
                print(f"Error processing {filename}: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Process a single specified image
        image_path = sys.argv[1]
        process_floorplan(image_path)
    else:
        # Process all images in the default directory
        process_all_floorplans() 