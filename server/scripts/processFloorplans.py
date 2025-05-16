"""
Floor Plan Image Processor

This script processes floor plan images from the source directory and:
1. Removes text labels like "Figure X", "Page Number", "Power Layout" or "Lighting Layout"
2. Cleans up background noise and enhances line visibility
3. Ensures all images are in landscape orientation
4. Saves processed images to the target directory

Usage:
    python processFloorplans.py --source SOURCE_DIR --target TARGET_DIR
"""

import os
import cv2
import numpy as np
import argparse
from pathlib import Path
import pytesseract
import re

# Define text patterns to remove
TEXT_PATTERNS = [
    r'Figure\s+\d+',
    r'Page\s+\d+',
    r'Power\s+Layout', 
    r'Lighting\s+Layout',
    r'POWER\s+LAYOUT',
    r'LIGHTING\s+LAYOUT'
]

def identify_text_regions(image):
    """Identify regions in the image that contain text."""
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply thresholding to get binary image
    _, binary = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY_INV)
    
    # Find contours
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Use pytesseract to extract text
    text_regions = []
    
    # Process each contour
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        
        # Filter small contours
        if w < 20 or h < 10:
            continue
            
        # Extract region
        roi = gray[y:y+h, x:x+w]
        
        # Use pytesseract to get text
        text = pytesseract.image_to_string(roi).strip()
        
        # Check if text matches patterns to remove
        if text and any(re.search(pattern, text, re.IGNORECASE) for pattern in TEXT_PATTERNS):
            text_regions.append((x, y, w, h))
    
    return text_regions

def remove_text(image, text_regions):
    """Remove identified text regions from image."""
    # Create a mask for areas to remove
    mask = np.ones(image.shape[:2], dtype=np.uint8) * 255
    
    # Fill text regions with white
    for x, y, w, h in text_regions:
        # Make the region slightly larger to ensure complete removal
        x_pad, y_pad = int(w * 0.1), int(h * 0.1)
        cv2.rectangle(mask, (max(0, x-x_pad), max(0, y-y_pad)), 
                     (min(image.shape[1], x+w+x_pad), min(image.shape[0], y+h+y_pad)), 0, -1)
    
    # Create cleaned image
    cleaned = image.copy()
    cleaned[mask == 0] = [255, 255, 255]  # Set masked regions to white
    
    return cleaned

def ensure_landscape(image):
    """Ensure image is in landscape orientation."""
    h, w = image.shape[:2]
    
    # Rotate if in portrait orientation
    if h > w:
        image = cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)
        print("  - Rotated to landscape orientation")
    
    return image

def enhance_lines(image):
    """Enhance lines in the floor plan."""
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Apply adaptive thresholding
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                  cv2.THRESH_BINARY_INV, 11, 2)
    
    # Dilate to thicken lines
    kernel = np.ones((2, 2), np.uint8)
    dilated = cv2.dilate(thresh, kernel, iterations=1)
    
    # Convert back to color image
    enhanced = cv2.cvtColor(dilated, cv2.COLOR_GRAY2BGR)
    
    # Combine with original image
    result = cv2.addWeighted(image, 0.7, enhanced, 0.3, 0)
    
    return result

def process_image(input_path, output_path):
    """Process a single floor plan image."""
    print(f"Processing {input_path}...")
    
    # Read image
    image = cv2.imread(str(input_path))
    if image is None:
        print(f"  - ERROR: Could not read image {input_path}")
        return False
    
    # Ensure landscape orientation
    image = ensure_landscape(image)
    
    # Identify text regions to remove
    text_regions = identify_text_regions(image)
    print(f"  - Found {len(text_regions)} text regions to remove")
    
    # Remove text regions
    cleaned = remove_text(image, text_regions)
    
    # Enhance lines
    enhanced = enhance_lines(cleaned)
    
    # Save processed image
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    cv2.imwrite(str(output_path), enhanced)
    print(f"  - Saved to {output_path}")
    
    return True

def normalize_filename(filename):
    """Convert filename to lowercase with underscores."""
    # Remove extension
    name = os.path.splitext(filename)[0]
    
    # Replace spaces with underscores
    name = name.replace(' ', '_').lower()
    
    # Add extension back
    return f"{name}.jpg"

def main():
    parser = argparse.ArgumentParser(description='Process floor plan images.')
    parser.add_argument('--source', required=True, help='Source directory with original floor plans')
    parser.add_argument('--target', required=True, help='Target directory for processed floor plans')
    args = parser.parse_args()
    
    source_dir = Path(args.source)
    target_dir = Path(args.target)
    
    # Create target directory if it doesn't exist
    os.makedirs(target_dir, exist_ok=True)
    
    # Process each image in source directory
    count = 0
    for file_path in source_dir.glob('*.jpg'):
        output_path = target_dir / normalize_filename(file_path.name)
        if process_image(file_path, output_path):
            count += 1
    
    print(f"Processed {count} images")

if __name__ == "__main__":
    main() 