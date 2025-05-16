import { useState, useCallback, useRef, useEffect, KeyboardEvent } from 'react';
import { ChartConfiguration } from 'chart.js';

/**
 * Interface for a chart data point used for accessibility
 */
export interface AccessibleDataPoint {
  label: string;
  value: string | number;
  index: number;
  datasetIndex: number;
  seriesName?: string;
  formattedValue?: string;
}

/**
 * Options for the chart keyboard navigation hook
 */
export interface ChartKeyboardNavigationOptions {
  /**
   * Whether to enable keyboard navigation
   */
  enabled?: boolean;
  
  /**
   * Whether to enable screen reader announcements for data points
   */
  announcements?: boolean;
  
  /**
   * Custom aria label for the chart
   */
  ariaLabel?: string;
  
  /**
   * Chart title for announcements
   */
  title?: string;
  
  /**
   * Callback called when a data point is selected via keyboard
   */
  onDataPointSelect?: (dataPoint: AccessibleDataPoint) => void;
  
  /**
   * Callback to generate custom announcement text for a data point
   */
  generateAnnouncementText?: (dataPoint: AccessibleDataPoint) => string;
}

/**
 * Hook to provide keyboard navigation for charts
 */
export const useChartKeyboardNavigation = (
  configuration: ChartConfiguration | undefined,
  options: ChartKeyboardNavigationOptions = {}
) => {
  const {
    enabled = true,
    announcements = true,
    ariaLabel = '',
    title = 'Chart',
    onDataPointSelect,
    generateAnnouncementText
  } = options;
  
  // Reference to the chart container
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Accessibility state management
  const [focusIndex, setFocusIndex] = useState<number>(-1);
  const [activeDataPointIndex, setActiveDataPointIndex] = useState<number | null>(null);
  const [announcementText, setAnnouncementText] = useState<string>('');
  const [accessibleDataPoints, setAccessibleDataPoints] = useState<AccessibleDataPoint[]>([]);
  
  // Extract data points for keyboard navigation and screen readers
  useEffect(() => {
    if (!configuration || !configuration.data) return;
    
    const extractedPoints: AccessibleDataPoint[] = [];
    
    const labels = configuration.data.labels || [];
    
    // Process each dataset
    configuration.data.datasets?.forEach((dataset, datasetIndex) => {
      const datasetLabel = dataset.label || `Dataset ${datasetIndex + 1}`;
      
      // Process each data point
      if (Array.isArray(dataset.data)) {
        dataset.data.forEach((value: any, index) => {
          let pointLabel = '';
          let pointValue: string | number = '';
          
          // Different handling based on chart type
          if (configuration.type === 'pie' || configuration.type === 'doughnut') {
            pointLabel = labels[index]?.toString() || `Slice ${index + 1}`;
            pointValue = typeof value === 'object' ? (value as any).value || value : value;
          } else {
            pointLabel = `${labels[index]?.toString() || `Point ${index + 1}`}`;
            pointValue = typeof value === 'object' ? (value as any).y || value : value;
          }
          
          extractedPoints.push({
            label: pointLabel,
            value: pointValue,
            index,
            datasetIndex,
            seriesName: datasetLabel,
            formattedValue: typeof pointValue === 'number' ? pointValue.toLocaleString() : String(pointValue)
          });
        });
      }
    });
    
    setAccessibleDataPoints(extractedPoints);
  }, [configuration]);
  
  // Generate chart description for screen readers
  const generateChartDescription = useCallback(() => {
    if (!configuration || !configuration.data) return '';
    
    const chartType = configuration.type || 'unknown';
    const datasetCount = configuration.data.datasets?.length || 0;
    const pointCount = configuration.data.datasets?.[0]?.data?.length || 0;
    
    let description = `${title}. This is a ${chartType} chart`;
    if (configuration.options?.plugins?.title?.text) {
      description += `. ${configuration.options.plugins.title.text}`;
    }
    description += `. Contains ${datasetCount} dataset${datasetCount !== 1 ? 's' : ''} with ${pointCount} data point${pointCount !== 1 ? 's' : ''} each.`;
    description += ` Use arrow keys to history.push between data points. Press Enter to view details about a data point.`;
    
    return description;
  }, [configuration, title]);
  
  // Announce data point to screen readers
  const announceDataPoint = useCallback((dataPoint: AccessibleDataPoint) => {
    if (!announcements) return;
    
    let text = '';
    
    if (generateAnnouncementText) {
      // Use custom announcement generator if provided
      text = generateAnnouncementText(dataPoint);
    } else {
      // Default announcement format
      if (configuration?.type === 'pie' || configuration?.type === 'doughnut') {
        text = `${dataPoint.label}: ${dataPoint.formattedValue || dataPoint.value}`;
      } else {
        text = `${dataPoint.seriesName}, ${dataPoint.label}: ${dataPoint.formattedValue || dataPoint.value}`;
      }
    }
    
    setAnnouncementText(text);
    
    // Call the select callback if provided
    if (onDataPointSelect) {
      onDataPointSelect(dataPoint);
    }
  }, [announcements, configuration?.type, generateAnnouncementText, onDataPointSelect]);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (!enabled || !accessibleDataPoints.length) return;
    
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        setFocusIndex(prevIndex => {
          const newIndex = prevIndex >= accessibleDataPoints.length - 1 ? 0 : prevIndex + 1;
          if (newIndex >= 0 && newIndex < accessibleDataPoints.length) {
            setActiveDataPointIndex(newIndex);
            announceDataPoint(accessibleDataPoints[newIndex]);
          }
          return newIndex;
        });
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        setFocusIndex(prevIndex => {
          const newIndex = prevIndex <= 0 ? accessibleDataPoints.length - 1 : prevIndex - 1;
          if (newIndex >= 0 && newIndex < accessibleDataPoints.length) {
            setActiveDataPointIndex(newIndex);
            announceDataPoint(accessibleDataPoints[newIndex]);
          }
          return newIndex;
        });
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusIndex >= 0 && focusIndex < accessibleDataPoints.length) {
          setActiveDataPointIndex(focusIndex);
          announceDataPoint(accessibleDataPoints[focusIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setActiveDataPointIndex(null);
        setAnnouncementText('');
        break;
      case 'Home':
        event.preventDefault();
        if (accessibleDataPoints.length > 0) {
          setFocusIndex(0);
          setActiveDataPointIndex(0);
          announceDataPoint(accessibleDataPoints[0]);
        }
        break;
      case 'End':
        event.preventDefault();
        if (accessibleDataPoints.length > 0) {
          const lastIndex = accessibleDataPoints.length - 1;
          setFocusIndex(lastIndex);
          setActiveDataPointIndex(lastIndex);
          announceDataPoint(accessibleDataPoints[lastIndex]);
        }
        break;
      default:
        break;
    }
  }, [enabled, accessibleDataPoints, focusIndex, announceDataPoint]);
  
  return {
    containerRef,
    handleKeyDown,
    accessibleDataPoints,
    activeDataPointIndex,
    focusIndex,
    announcementText,
    chartDescription: generateChartDescription(),
    navigateToDataPoint: (index: number) => {
      if (index >= 0 && index < accessibleDataPoints.length) {
        setFocusIndex(index);
        setActiveDataPointIndex(index);
        announceDataPoint(accessibleDataPoints[index]);
      }
    },
    clearActiveDataPoint: () => {
      setActiveDataPointIndex(null);
      setAnnouncementText('');
    }
  };
}; 