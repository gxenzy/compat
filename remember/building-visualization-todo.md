# Building Visualization Component Implementation To-Do List

## Current Status of Issues

### 1. Floor Plan Image Issues
- [x] Updated floorPlanConfig.ts to use correct file paths
- [x] Floor plan images now properly loading from client/public/floorplan
- [x] Text removal from floor plans (Figure numbers, page numbers, etc.) - implemented with processFloorplans.py
- [x] Fixed icons for Lighting/Power views with proper LightbulbOutlined and ElectricalServices icons

### 2. Button Functionality Issues
- [x] Fixed pan/move functionality by improving cursor feedback and event handling
- [x] Implemented proper reset room positions function
- [x] Implemented proper fit to view function that centers all rooms
- [x] Separated measurement tool from pan mode to prevent conflicts
- [x] Fixed Add Room functionality to properly show the RoomDialog

### 3. Room Detection Issues
- [x] Implemented improved OpenCV-based room detection algorithm
- [x] Added better text removal for cleaner processing
- [x] Added improved wall detection using Hough transform
- [x] Enhanced room classification based on size and shape
- [ ] Need to implement text detection for automatic room labeling (future enhancement)

### 4. Energy Analysis Improvements
- [ ] Implement real-time energy usage calculation
- [ ] Add comparison against baseline buildings
- [ ] Add exportable energy reports
- [ ] Implement energy usage breakdown by room type

### 5. Lighting Simulation Improvements
- [ ] Add realistic lighting distribution visualization
- [ ] Implement illuminance contour maps
- [ ] Add fixture placement optimization
- [ ] Add glare analysis

## Next Steps
1. Test the improved room detection algorithm with different floor plans
2. Complete the text removal from floor plan images
3. Enhance the measurement tool with distance labeling
4. Implement energy analysis improvements
5. Implement lighting simulation enhancements

## Known Issues
1. RoomEditor and RoomDialog components may be redundant - need to consolidate
2. Room detection algorithm still needs fine-tuning for complex floor plans
3. Measurement tool needs better visual feedback 