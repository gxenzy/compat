#!/usr/bin/env python3
"""
Floor Plan Image Preprocessing Script

This script preprocesses floor plan images for better visualization and detection:
1. Removes text elements (Figure numbers, page numbers, title text)
2. Ensures images are in landscape orientation
3. Enhances image contrast for better wall visibility
4. Standardizes output format
"""

import os
import sys
import cv2
import numpy as np
from pathlib import Path
import argparse
import glob

# Default directories
DEFAULT_INPUT_DIR = "../../public/floorplan"
DEFAULT_OUTPUT_DIR = "../../public/floorplan/processed"

def remove_text_regions(image):
    """
    Remove text labels like Figure numbers, page numbers, and title text
    using contour detection and filtering.
    """
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply threshold to get binary image
    _, binary = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY_INV)
    
    # Find contours
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Create a mask for text
    mask = np.zeros_like(gray)
    
    # Filter contours by size and shape to identify text regions
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        area = cv2.contourArea(contour)
        aspect_ratio = w / h if h > 0 else 0
        
        # Text typically has specific characteristics
        if (area < 1000 and area > 50) and (aspect_ratio > 0.2 and aspect_ratio < 5.0):
            # Fill the text region in the mask
            cv2.drawContours(mask, [contour], -1, 255, -1)
    
    # Dilate the mask to ensure complete text removal
    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.dilate(mask, kernel, iterations=2)
    
    # Apply the inverted mask to the original image
    result = image.copy()
    for c in range(3):  # Apply to each color channel
        result[:, :, c] = cv2.bitwise_and(result[:, :, c], result[:, :, c], mask=cv2.bitwise_not(mask))
    
    # Fill text regions with white
    for c in range(3):
        result[:, :, c] = np.where(mask == 255, 255, result[:, :, c])
    
    # Additionally, clear fixed regions that often contain text
    h, w = image.shape[:2]
    
    # Clear bottom margin (page numbers, figure captions)
    result[int(h * 0.9):, :] = 255
    
    # Clear top margin (title text)
    result[:int(h * 0.1), :] = 255
    
    # Clear left and right margins
    result[:, :int(w * 0.05)] = 255
    result[:, int(w * 0.95):] = 255
    
    return result

def ensure_landscape_orientation(image):
    """
    Ensure the image is in landscape orientation.
    Rotate if necessary.
    """
    h, w = image.shape[:2]
    
    # If height is greater than width, rotate to landscape
    if h > w:
        print("  Rotating image to landscape orientation")
        # Rotate 90 degrees clockwise
        image = cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)
    
    return image

def enhance_floor_plan(image):
    """
    Enhance the floor plan image for better wall visibility.
    """
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply adaptive histogram equalization
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced_gray = clahe.apply(gray)
    
    # Apply bilateral filter to preserve edges while reducing noise
    filtered = cv2.bilateralFilter(enhanced_gray, 9, 75, 75)
    
    # Apply Canny edge detection
    edges = cv2.Canny(filtered, 50, 150)
    
    # Dilate edges to make walls more prominent
    kernel = np.ones((2, 2), np.uint8)
    dilated_edges = cv2.dilate(edges, kernel, iterations=1)
    
    # Convert back to color for the final result
    result = cv2.cvtColor(filtered, cv2.COLOR_GRAY2BGR)
    
    # Overlay edges on the original image with blue color
    result[dilated_edges > 0] = [180, 120, 50]  # BGR format
    
    return result

def process_floor_plan(image_path, output_dir, enhance=True):
    """
    Process a single floor plan image.
    """
    # Load image
    print(f"Processing {image_path}...")
    image = cv2.imread(str(image_path))
    
    if image is None:
        print(f"Error: Could not load image {image_path}")
        return False
    
    # Ensure landscape orientation
    image = ensure_landscape_orientation(image)
    
    # Remove text regions
    image = remove_text_regions(image)
    
    # Enhance image if requested
    if enhance:
        enhanced_image = enhance_floor_plan(image)
        # Save both versions
        output_path = Path(output_dir) / f"{Path(image_path).stem}_enhanced{Path(image_path).suffix}"
        cv2.imwrite(str(output_path), enhanced_image)
    
    # Save the processed image
    output_path = Path(output_dir) / Path(image_path).name
    cv2.imwrite(str(output_path), image)
    
    print(f"  Saved to {output_path}")
    return True

def process_all_floor_plans(input_dir, output_dir, enhance=True):
    """
    Process all floor plan images in the given directory.
    """
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Find all image files
    image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.bmp']
    image_files = []
    for ext in image_extensions:
        image_files.extend(glob.glob(os.path.join(input_dir, ext)))
    
    print(f"Found {len(image_files)} image files")
    
    # Process each image
    success_count = 0
    for image_path in image_files:
        if process_floor_plan(image_path, output_dir, enhance):
            success_count += 1
    
    print(f"Successfully processed {success_count} out of {len(image_files)} images")
    return success_count

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Preprocess floor plan images")
    parser.add_argument("--input", default=DEFAULT_INPUT_DIR, help="Input directory containing floor plan images")
    parser.add_argument("--output", default=DEFAULT_OUTPUT_DIR, help="Output directory for processed images")
    parser.add_argument("--no-enhance", action="store_true", help="Skip image enhancement")
    args = parser.parse_args()
    
    process_all_floor_plans(args.input, args.output, not args.no_enhance) 