# Building Visualization Component

## Overview
The Building Visualization component is a comprehensive floor plan visualization tool for energy audits. It allows users to view, analyze, and modify floor plans with interactive features for room management, measurements, and compliance tracking.

## Features
- **Floor Plan Visualization**: Display and navigate different floors with lighting and power view modes
- **Room Detection**: Automatically detect rooms from floor plan images using neural networks and computer vision
- **Room Management**: Create, edit, position and resize rooms with interactive controls
- **Measurement Tool**: Measure distances directly on the floor plan
- **Compliance Tracking**: Track energy compliance for each room
- **Pan & Zoom**: Navigate larger floor plans with interactive pan and zoom
- **Grid System**: Overlay grid for precise positioning
- **Multiple Themes**: Consistent UI across different application themes

## Setup

### Prerequisites
- Node.js (v14+)
- Python 3.6+ (for advanced room detection)
- OpenCV library (`pip install opencv-python`)

### Floor Plan Images
Floor plan images should be placed in `__all folder__/floorplan` directory. The component expects the following naming convention:
- `[floor-name]-floor-lighting.jpg` - For lighting views
- `[floor-name]-floor-power.jpg` - For power views

Supported floors: ground, mezzanine, second, third, fourth, fifth

### Automated Setup
Use the automated setup script to prepare the floor plans:

```bash
npm run setup-floorplans
```

This script:
1. Copies floor plans from `__all folder__/floorplan` to the public folder
2. Processes images to remove text elements like "Figure", "Page Number", etc.
3. Runs room detection using the Python OpenCV script

## Usage

### Basic Implementation
```jsx
import BuildingVisualization from '../path/to/BuildingVisualization';

function MyComponent() {
  return (
    <div>
      <BuildingVisualization />
    </div>
  );
}
```

### View Modes
The component supports two view modes:
- **Lighting View**: For visualizing lighting layouts and compliance
- **Power View**: For electrical system layouts and compliance

### Room Detection
Room detection works through:
1. **JavaScript-based detection** (cnnDetection.ts): Primary detection using TensorFlow.js
2. **Python-based detection** (roomDetection.py): Advanced detection using OpenCV for better accuracy

Room detection can handle various architectural elements and removes text elements (like figure numbers) automatically.

### Measurement Tool
The measurement tool allows:
- Clicking to place measurement points
- Real-time distance calculation
- Visual representation of measurements

## Configuration

### Floor Plan Configuration
Floor plans are configured in `config/floorPlanConfig.ts`. You can add or modify floors and their properties.

Example:
```typescript
export const FLOORS: Record<string, FloorPlanData> = {
  'ground': {
    id: 'ground',
    name: 'Ground Floor',
    level: 'ground',
    lighting: '/floorplan/ground-floor-lighting.jpg',
    power: '/floorplan/ground-floor-power.jpg',
    description: 'Main entrance level with reception, registrar, and primary offices',
    order: 1
  },
  // Additional floors...
}
```

### Room Types
The system supports various room types, each with different visualization styles:
- Office
- Classroom
- Conference Room
- Restroom
- Kitchen
- Storage
- Electrical Room
- Hallway
- Server Room
- Reception
- Lobby
- Laboratory

## Development

### Component Structure
- **BuildingVisualization**: Main container component
- **VisualizationControls**: UI controls for floor plan interaction
- **FloorPlanVisualization**: Core rendering component
- **RoomDialog**: Dialog for adding/editing rooms
- **FloorInformation**: Displays information about the selected floor
- **Utilities**:
  - measurementTool.ts: Distance measurement utilities
  - cnnDetection.ts: Room detection algorithms
  - neuralDetection.ts: Neural network based detection

### Room Detection Algorithm
The room detection pipeline includes:
1. Image preprocessing (removing text elements)
2. Edge detection and contour extraction
3. Room identification based on geometric properties
4. Room type classification based on size and position
5. Adaptive learning to improve detection over time

## Troubleshooting

### Common Issues
- **Floor plan images not loading**: Ensure images follow the correct naming convention and are placed in `__all folder__/floorplan`
- **Poor room detection**: Try adjusting lighting or run the Python-based detection for better results
- **Performance issues**: Large floor plans may cause performance issues; consider optimizing image sizes 