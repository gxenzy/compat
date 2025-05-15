import React from 'react';
import BuildingVisualizationImpl from './BuildingVisualizationImpl';
import { Box } from '@mui/material';
import { BuildingProvider } from './contexts/BuildingContext';

// Re-export all interfaces and utils for external usage
export * from './interfaces/buildingInterfaces';
export * from './utils/typeGuards';

/**
 * Export the BuildingVisualization component
 * 
 * This represents a complete implementation of the floor plan visualization
 * functionality including:
 * 
 * - Floor plan visualization
 * - Room detection
 * - Energy analysis
 * - Interactive controls
 * - Fullscreen mode
 */
const BuildingVisualization: React.FC = () => {
  return (
    <Box sx={{
      height: '100%',
      maxHeight: 'calc(100vh - 72px - 64px - 32px)', // Tab height + app bar + padding
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <BuildingProvider>
        <BuildingVisualizationImpl />
      </BuildingProvider>
    </Box>
  );
};

export default BuildingVisualization; 