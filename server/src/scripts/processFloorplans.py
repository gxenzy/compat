"""
Process Floor Plans Script
-------------------------

This script processes floor plan images from the __all folder__/floorplan directory,
removes text elements like "Figure", "Page Number", layout labels, and isolates
walls while filtering out fixtures, furniture, and wiring.

Usage:
    python processFloorplans.py
"""

import os
import sys
import cv2
import numpy as np
from pathlib import Path

# Get absolute path to workspace root
WORKSPACE_ROOT = os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))))
print(f"Workspace root: {WORKSPACE_ROOT}")

# Paths
SOURCE_DIR = os.path.join(WORKSPACE_ROOT, 'user-workspace', '__all folder__', 'floorplan')
TARGET_DIR = os.path.join(WORKSPACE_ROOT, 'user-workspace', 'client', 'public', 'floorplan')

print(f"Source directory: {SOURCE_DIR}")
print(f"Target directory: {TARGET_DIR}")

# Ensure target directory exists
if not os.path.exists(TARGET_DIR):
    os.makedirs(TARGET_DIR, exist_ok=True)
    print(f"Created target directory: {TARGET_DIR}")

def load_image(image_path):
    """Load an image and ensure it's valid"""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")
    
    # Load image
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Failed to load image: {image_path}")
    
    return image

def ensure_landscape(image):
    """Ensure the image is in landscape orientation"""
    height, width = image.shape[:2]
    if height > width:
        # Rotate 90 degrees to make landscape
        return cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)
    return image

def remove_text_and_symbols(image):
    """
    Advanced text removal that targets text elements,
    legends, and symbols commonly found in floor plans
    """
    # Convert to grayscale for text detection
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply thresholding to identify dark elements (likely text)
    _, binary = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY_INV)
    
    # Identify potential text regions using morphological operations
    # Text typically consists of small, disconnected components
    kernel_small = np.ones((2, 2), np.uint8)
    kernel_large = np.ones((5, 5), np.uint8)
    
    # Opening to remove very small elements (noise)
    opened = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel_small)
    
    # Find all contours
    contours, _ = cv2.findContours(opened, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Create a mask for text and symbol regions
    text_mask = np.zeros_like(gray)
    
    # Filter contours by characteristics to identify text
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        area = cv2.contourArea(contour)
        
        # Get contour properties
        aspect_ratio = float(w) / h if h > 0 else 0
        solidity = area / (w * h) if w * h > 0 else 0
        height_ratio = h / gray.shape[0]
        
        # Text characteristics:
        # 1. Small area relative to image
        # 2. Reasonable aspect ratio (not too elongated)
        # 3. Near borders or isolated
        is_likely_text = (
            (area < 800 and solidity > 0.3) or 
            (area < 3000 and 0.5 < aspect_ratio < 8 and solidity > 0.3) or
            (y < 100 or y > gray.shape[0] - 100 or x < 100 or x > gray.shape[1] - 100) and area < 3000
        )
        
        # Small isolated elements are likely text, symbols, or legend items
        if is_likely_text:
            cv2.drawContours(text_mask, [contour], -1, 255, -1)
            
            # Also check if this is part of a header, footer, or legend box
            # Headers/footers typically have horizontal alignment of text
            if y < 150 or y > gray.shape[0] - 150:
                # Extend the mask horizontally to catch nearby text elements
                cv2.rectangle(text_mask, (max(0, x - 50), y), (min(gray.shape[1], x + w + 50), y + h), 255, -1)
    
    # Dilate the text mask to cover surrounding areas and connect nearby text
    dilated_mask = cv2.dilate(text_mask, kernel_large, iterations=3)
    
    # Use inpainting to remove text
    cleaned = cv2.inpaint(image, dilated_mask, 7, cv2.INPAINT_NS)
    
    return cleaned

def isolate_walls(image):
    """
    Isolate architectural walls while specifically excluding wiring, doors, stairs,
    furniture, and other non-wall elements
    """
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply bilateral filter to reduce noise while preserving edges
    blur = cv2.bilateralFilter(gray, 7, 50, 50)
    
    # Initial adaptive thresholding to identify potential walls
    binary = cv2.adaptiveThreshold(
        blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY_INV, 15, 2
    )
    
    # ------ DETECT AND EXCLUDE ELECTRICAL WIRING ------
    
    # Electrical wiring typically appears as thin, curved lines
    # Use morphological operations to identify these elements
    kernel_thin = np.ones((1, 1), np.uint8)
    wiring_mask = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel_thin)
    
    # Find thin contours that are likely to be wiring
    contours, _ = cv2.findContours(wiring_mask, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    
    wiring = np.zeros_like(binary)
    for contour in contours:
        # Get bounding rectangle
        x, y, w, h = cv2.boundingRect(contour)
        
        # Calculate area and perimeter
        area = cv2.contourArea(contour)
        perimeter = cv2.arcLength(contour, True)
        
        # Wiring typically has high perimeter-to-area ratio and is very thin
        if area > 0 and perimeter / area > 1.0 and (w < 3 or h < 3):
            cv2.drawContours(wiring, [contour], -1, 255, -1)
    
    # ------ DETECT AND EXCLUDE DOORS ------
    
    # Doors typically appear as gaps in walls with arcs
    # First, detect potential door arcs (small curved elements)
    door_mask = np.zeros_like(binary)
    
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        
        # Small arc-like shapes (typical for door swings)
        if max(w, h) < 50 and min(w, h) < 20:
            # Check if it's arc-shaped
            hull = cv2.convexHull(contour)
            hull_area = cv2.contourArea(hull)
            if hull_area > 0:
                solidity = cv2.contourArea(contour) / hull_area
                if 0.3 < solidity < 0.7:  # Arc-like shapes have medium solidity
                    cv2.drawContours(door_mask, [contour], -1, 255, -1)
    
    # ------ DETECT AND EXCLUDE STAIRS ------
    
    # Stairs typically have a pattern of parallel lines with cross-connections
    # Detect based on repetitive patterns
    stair_mask = np.zeros_like(binary)
    
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        
        # Aspect ratio and size typical for stair elements
        aspect_ratio = float(w) / h if h > 0 else 0
        
        # Stair components often have repetitive geometric patterns
        if (3 < aspect_ratio < 30 or 0.03 < aspect_ratio < 0.3) and max(w, h) < 100:
            # Get region to check for repetitive patterns
            roi = binary[y:y+h, x:x+w]
            
            # Check for horizontal or vertical repetitions
            if w > h:  # Horizontal stairs
                profile = np.sum(roi, axis=0) / h  # Average pixel value per column
                steps = np.diff(profile > 127)  # Count transitions
                if np.sum(np.abs(steps)) > w / 10:  # Many transitions indicate stairs
                    cv2.drawContours(stair_mask, [contour], -1, 255, -1)
            else:  # Vertical stairs
                profile = np.sum(roi, axis=1) / w  # Average pixel value per row
                steps = np.diff(profile > 127)
                if np.sum(np.abs(steps)) > h / 10:
                    cv2.drawContours(stair_mask, [contour], -1, 255, -1)
    
    # ------ COMBINE EXCLUSION MASKS ------
    
    # Combine all elements to exclude
    exclude_mask = cv2.bitwise_or(wiring, door_mask)
    exclude_mask = cv2.bitwise_or(exclude_mask, stair_mask)
    
    # Dilate exclusion mask to ensure full coverage
    kernel = np.ones((3, 3), np.uint8)
    exclude_mask = cv2.dilate(exclude_mask, kernel, iterations=2)
    
    # Remove excluded elements from binary image
    walls_only = cv2.bitwise_and(binary, binary, mask=cv2.bitwise_not(exclude_mask))
    
    # ------ ENHANCE WALL STRUCTURE ------
    
    # Use morphological operations to enhance walls
    kernel_h = np.ones((1, 7), np.uint8)  # Horizontal kernel
    kernel_v = np.ones((7, 1), np.uint8)  # Vertical kernel
    
    # Enhance horizontal and vertical walls
    walls_h = cv2.dilate(walls_only, kernel_h, iterations=1)
    walls_v = cv2.dilate(walls_only, kernel_v, iterations=1)
    
    # Combine enhanced walls
    walls = cv2.bitwise_or(walls_h, walls_v)
    
    # Close gaps in walls
    walls = cv2.morphologyEx(walls, cv2.MORPH_CLOSE, kernel, iterations=2)
    
    # Create final mask for visualization
    height, width = gray.shape
    mask = np.zeros((height, width, 3), dtype=np.uint8)
    mask[walls > 0] = [0, 0, 0]  # Black for walls
    mask[walls == 0] = [255, 255, 255]  # White for spaces
    
    # Overlay with original but emphasis on walls
    alpha = 0.7
    wall_overlay = cv2.addWeighted(image, 1 - alpha, mask, alpha, 0)
    
    return wall_overlay

def enhance_drawing_clarity(image):
    """Enhance the clarity of architectural drawing lines and features"""
    # Convert to Lab color space to enhance lines without affecting colors too much
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    
    # Apply CLAHE to improve contrast
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    
    # Merge back and convert to BGR
    enhanced_lab = cv2.merge((l, a, b))
    enhanced = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
    
    # Apply bilateral filter to reduce noise while preserving edges
    bilateral = cv2.bilateralFilter(enhanced, 9, 75, 75)
    
    return bilateral

def process_floor_plans():
    """Process all floor plans in the source directory with improved preprocessing"""
    if not os.path.exists(SOURCE_DIR):
        print(f"Source directory not found: {SOURCE_DIR}")
        return
    
    # List source files
    source_files = [f for f in os.listdir(SOURCE_DIR) if f.endswith(('.jpg', '.jpeg', '.png'))]
    print(f"Found {len(source_files)} floor plan images in source directory")
    
    for filename in source_files:
        try:
            source_path = os.path.join(SOURCE_DIR, filename)
            target_path = os.path.join(TARGET_DIR, filename)
            
            print(f"Processing {filename}...")
            
            # Load image
            image = load_image(source_path)
            
            # Ensure landscape orientation
            image = ensure_landscape(image)
            
            # Multi-stage preprocessing pipeline
            # Step 1: Remove text and symbols
            cleaned = remove_text_and_symbols(image)
            
            # Step 2: Enhance drawing clarity
            enhanced = enhance_drawing_clarity(cleaned)
            
            # Step 3: Isolate and enhance walls
            processed = isolate_walls(enhanced)
            
            # Save processed image
            cv2.imwrite(target_path, processed)
            
            print(f"Saved processed image to {target_path}")
            
        except Exception as e:
            print(f"Error processing {filename}: {e}")
    
    print("All floor plans processed successfully!")

if __name__ == "__main__":
    process_floor_plans() 