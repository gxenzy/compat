"""
Enhanced Room Detection Script using OpenCV
------------------------------------------

This script provides improved room detection in floor plan images using OpenCV.
The detection pipeline includes:
1. Color selection for lines (focusing on wall colors)
2. Edge detection (Canny edge detection)
3. Grayscaling and Gaussian smoothing for noise reduction
4. Region of interest determination
5. Hough transform for line detection
6. Room boundary extraction and polygon formation

Usage:
    python enhancedRoomDetection.py [floorplan_image_path]
"""

import os
import sys
import json
import uuid
import numpy as np
import cv2
from pathlib import Path
import math

# Configure paths
WORKSPACE_ROOT = os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
SOURCE_DIR = os.path.join(WORKSPACE_ROOT, 'client', 'public', 'floorplan')
OUTPUT_DIR = os.path.join(WORKSPACE_ROOT, 'server', 'src', 'data', 'roomDetection')

# Ensure output directory exists
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR, exist_ok=True)

# Room type classification based on area and proportion
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
    
    return image

def color_selection(image):
    """Extract relevant colors (walls) from the image"""
    # Convert to grayscale for processing
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply binary threshold to extract wall-like structures
    _, binary = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY_INV)
    
    # Apply morphological operations to enhance walls
    kernel = np.ones((3, 3), np.uint8)
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=1)
    
    return binary

def edge_detection(image):
    """Apply Canny edge detection"""
    # Apply Canny edge detection
    edges = cv2.Canny(image, 50, 150, apertureSize=3)
    
    # Dilate edges to connect broken lines
    kernel = np.ones((3, 3), np.uint8)
    dilated_edges = cv2.dilate(edges, kernel, iterations=1)
    
    return dilated_edges

def apply_gaussian_smoothing(image):
    """Apply Gaussian blur to reduce noise"""
    return cv2.GaussianBlur(image, (5, 5), 0)

def determine_region_of_interest(image):
    """Determine the main region of interest in the floor plan"""
    height, width = image.shape[:2]
    
    # Remove margins (common areas for text and annotations)
    margin = int(min(width, height) * 0.05)
    
    # Create a mask for the ROI
    mask = np.zeros_like(image)
    roi = np.array([[(margin, margin),
                     (width - margin, margin),
                     (width - margin, height - margin),
                     (margin, height - margin)]], dtype=np.int32)
    
    # Fill the ROI
    cv2.fillPoly(mask, roi, 255)
    
    # Apply the mask
    masked_image = cv2.bitwise_and(image, mask)
    
    return masked_image

def apply_hough_transform(edges, original_image):
    """Apply Hough Transform to detect lines"""
    # Apply Hough Transform
    lines = cv2.HoughLinesP(
        edges, 
        rho=1, 
        theta=np.pi/180, 
        threshold=50, 
        minLineLength=50, 
        maxLineGap=10
    )
    
    # Create a blank canvas for drawing lines
    line_image = np.zeros_like(original_image)
    
    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line[0]
            cv2.line(line_image, (x1, y1), (x2, y2), (0, 255, 0), 2)
    
    return line_image, lines

def find_room_polygons(lines, image_shape):
    """Find room polygons using line intersections"""
    height, width = image_shape[:2]
    
    # Create a blank canvas for room boundaries
    room_boundaries = np.zeros((height, width), dtype=np.uint8)
    
    # Draw all lines
    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line[0]
            cv2.line(room_boundaries, (x1, y1), (x2, y2), 255, 2)
    
    # Apply morphological operations to connect nearby lines
    kernel = np.ones((7, 7), np.uint8)
    room_boundaries = cv2.morphologyEx(room_boundaries, cv2.MORPH_CLOSE, kernel)
    
    # Find contours in the image
    contours, _ = cv2.findContours(room_boundaries, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Filter and simplify contours to get room polygons
    room_polygons = []
    min_area = height * width * 0.003  # Min 0.3% of total area
    max_area = height * width * 0.5    # Max 50% of total area
    
    for contour in contours:
        area = cv2.contourArea(contour)
        
        if min_area < area < max_area:
            # Simplify the contour to reduce points
            epsilon = 0.01 * cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, epsilon, True)
            
            # Calculate aspect ratio
            x, y, w, h = cv2.boundingRect(approx)
            aspect_ratio = float(w) / float(h) if h > 0 else 0
            
            # Filter by aspect ratio to exclude extreme shapes
            if 0.2 < aspect_ratio < 5.0:
                room_polygons.append({
                    'contour': approx.tolist(),
                    'x': x,
                    'y': y,
                    'width': w,
                    'height': h,
                    'area': area,
                    'aspect_ratio': aspect_ratio
                })
    
    return room_polygons

def classify_room_type(area, aspect_ratio, total_area):
    """Classify room type based on size and shape"""
    # Calculate relative area (percentage of total floor area)
    rel_area = area / total_area
    
    # Large rooms
    if rel_area > 0.15:
        if 0.75 < aspect_ratio < 1.5:
            return ROOM_TYPES["large_square"]  # office
        else:
            return ROOM_TYPES["large_rectangle"]  # classroom
    
    # Medium rooms
    elif rel_area > 0.05:
        if 0.75 < aspect_ratio < 1.5:
            return ROOM_TYPES["medium_square"]  # conference
        elif aspect_ratio > 3.0:
            return ROOM_TYPES["corridor"]  # hallway
        else:
            return ROOM_TYPES["large_rectangle"]  # classroom
    
    # Small rooms
    elif rel_area > 0.01:
        if 0.75 < aspect_ratio < 1.5:
            return ROOM_TYPES["small_square"]  # storage
        else:
            return ROOM_TYPES["small_rectangle"]  # restroom
    
    # Tiny rooms/spaces
    else:
        if aspect_ratio > 3.0:
            return ROOM_TYPES["corridor"]  # hallway
        else:
            return ROOM_TYPES["tiny"]  # utility
    
def create_visualization(original_image, room_polygons):
    """Create visualization of detected rooms"""
    visualization = original_image.copy()
    
    # Define room colors for visualization
    room_colors = [
        (0, 255, 0),    # Green
        (0, 0, 255),    # Red
        (255, 0, 0),    # Blue
        (255, 255, 0),  # Cyan
        (0, 255, 255),  # Yellow
        (255, 0, 255),  # Magenta
        (128, 128, 0),  # Olive
        (0, 128, 128),  # Teal
        (128, 0, 128)   # Purple
    ]
    
    for i, room in enumerate(room_polygons):
        color = room_colors[i % len(room_colors)]
        
        # Draw room contour
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
        room_type = room.get('type', 'unknown')
        type_label = f"{room_type} ({room['area'] / 100:.1f}m²)"
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

def remove_overlapping_rooms(rooms):
    """Remove overlapping rooms, keeping the better one"""
    if not rooms:
        return []
    
    # Sort rooms by area (larger first)
    sorted_rooms = sorted(rooms, key=lambda r: r['area'], reverse=True)
    filtered_rooms = []
    
    for room in sorted_rooms:
        should_add = True
        
        for existing in filtered_rooms:
            # Calculate overlap
            x1, y1, w1, h1 = room['x'], room['y'], room['width'], room['height']
            x2, y2, w2, h2 = existing['x'], existing['y'], existing['width'], existing['height']
            
            # Calculate intersection area
            x_overlap = max(0, min(x1 + w1, x2 + w2) - max(x1, x2))
            y_overlap = max(0, min(y1 + h1, y2 + h2) - max(y1, y2))
            overlap_area = x_overlap * y_overlap
            
            # If significant overlap, don't add the room
            if overlap_area > 0.6 * min(room['area'], existing['area']):
                should_add = False
                break
        
        if should_add:
            filtered_rooms.append(room)
    
    return filtered_rooms

def process_floor_plan(image_path):
    """Process a floor plan image using the enhanced OpenCV pipeline"""
    print(f"Processing floor plan: {image_path}")
    
    # Extract floor type from filename
    floor_name = Path(image_path).stem
    floor_type = "unknown"
    
    # Try to determine floor level from filename
    for floor in ["ground", "mezzanine", "second", "third", "fourth", "fifth"]:
        if floor in floor_name.lower():
            floor_type = floor
            break
    
    # 1. Load image
    original_image = load_image(image_path)
    height, width = original_image.shape[:2]
    total_area = height * width
    
    # 2. Color selection to focus on walls
    wall_binary = color_selection(original_image)
    
    # 3. Apply Gaussian smoothing for noise reduction
    smoothed = apply_gaussian_smoothing(wall_binary)
    
    # 4. Apply edge detection
    edges = edge_detection(smoothed)
    
    # 5. Determine region of interest
    roi_edges = determine_region_of_interest(edges)
    
    # 6. Apply Hough transform for line detection
    line_image, lines = apply_hough_transform(roi_edges, original_image)
    
    # 7. Find room polygons from lines
    room_polygons = find_room_polygons(lines, original_image.shape)
    
    # 8. Classify rooms and remove overlaps
    for room in room_polygons:
        room['type'] = classify_room_type(room['area'], room['aspect_ratio'], total_area)
        room['id'] = f"room-{str(uuid.uuid4())[:8]}"
        room['name'] = f"Room {room['type'].capitalize()} {uuid.uuid4().hex[:4]}"
        room['confidence'] = 0.85
    
    # Remove overlapping rooms
    filtered_rooms = remove_overlapping_rooms(room_polygons)
    
    # Create visualization of detected rooms
    visualization = create_visualization(original_image, filtered_rooms)
    
    # Save visualization image
    output_prefix = Path(image_path).stem
    vis_path = os.path.join(OUTPUT_DIR, f"{output_prefix}_enhanced_detection.jpg")
    cv2.imwrite(vis_path, visualization)
    
    # Save results to JSON
    # Prepare rooms data for JSON (without contours to reduce size)
    rooms_json = []
    for room in filtered_rooms:
        room_dict = {}
        for k, v in room.items():
            if k != 'contour':  # Skip contour to reduce JSON size
                room_dict[k] = v
        rooms_json.append(room_dict)
    
    result = {
        "source": image_path,
        "width": width,
        "height": height,
        "floor": floor_type,
        "rooms": rooms_json,
        "processingComplete": True,
        "enhancedDetection": True
    }
    
    json_path = os.path.join(OUTPUT_DIR, f"{output_prefix}_enhanced_rooms.json")
    with open(json_path, 'w') as f:
        json.dump(result, f, indent=2)
    
    print(f"Enhanced room detection complete. Detected {len(filtered_rooms)} rooms.")
    print(f"Results saved to {json_path}")
    print(f"Visualization saved to {vis_path}")
    
    return filtered_rooms

def process_all_floor_plans():
    """Process all floor plans in the public directory"""
    if not os.path.exists(SOURCE_DIR):
        print(f"Source directory not found: {SOURCE_DIR}")
        return
    
    floor_plans = [f for f in os.listdir(SOURCE_DIR) 
                  if f.lower().endswith(('.jpg', '.jpeg', '.png')) 
                  and not f.startswith('placeholder')
                  and 'processed' in f]
    
    print(f"Found {len(floor_plans)} floor plans to process")
    
    for filename in floor_plans:
        try:
            image_path = os.path.join(SOURCE_DIR, filename)
            process_floor_plan(image_path)
        except Exception as e:
            print(f"Error processing {filename}: {str(e)}")

if __name__ == "__main__":
    # Check if a specific file was provided as a command-line argument
    if len(sys.argv) > 1:
        try:
            image_path = sys.argv[1]
            print(f"Processing single file: {image_path}")
            process_floor_plan(image_path)
        except Exception as e:
            print(f"Error processing file: {str(e)}")
            sys.exit(1)
    else:
        # Process all floor plans if no specific file is provided
        process_all_floor_plans() 