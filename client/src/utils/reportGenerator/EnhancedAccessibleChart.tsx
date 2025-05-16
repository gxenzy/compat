import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  useTheme,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Button
} from '@mui/material';
import {
  Accessibility as AccessibilityIcon,
  HighQuality as HighContrastIcon,
  TableChart as TableIcon,
  Keyboard as KeyboardIcon
} from '@mui/icons-material';
import InteractiveChart from './InteractiveChart';
import ChartDataTable from './ChartDataTable';
import { useChartKeyboardNavigation } from '../../hooks/useChartKeyboardNavigation';
import { ChartConfiguration, ChartType } from 'chart.js';
import KeyboardShortcutHelp from '../../components/UI/KeyboardShortcutHelp';

/**
 * Props for the EnhancedAccessibleChart component
 */
interface EnhancedAccessibleChartProps {
  /**
   * Chart title
   */
  title?: string;
  
  /**
   * Chart subtitle
   */
  subtitle?: string;
  
  /**
   * Chart.js configuration
   */
  configuration: ChartConfiguration;
  
  /**
   * Chart width
   */
  width?: string | number;
  
  /**
   * Chart height
   */
  height?: string | number;
  
  /**
   * Theme name for the chart
   */
  themeName?: 'default' | 'energy' | 'financial';
  
  /**
   * Whether to show export options
   */
  showExportOptions?: boolean;
  
  /**
   * Whether to show chart type options
   */
  showChartTypeOptions?: boolean;
  
  /**
   * Whether the chart is loading
   */
  isLoading?: boolean;
  
  /**
   * Callback when chart is added to report
   */
  onAddToReport?: (canvas: HTMLCanvasElement) => void;
  
  /**
   * Callback when chart type changes
   */
  onChartTypeChange?: (type: ChartType) => void;
  
  /**
   * Callback when chart is refreshed
   */
  onRefresh?: () => void;
  
  /**
   * Callback when chart is edited
   */
  onEdit?: () => void;
  
  /**
   * Whether to use high contrast mode by default
   */
  highContrastDefault?: boolean;
  
  /**
   * Whether to show data table view by default
   */
  dataTableView?: boolean;
  
  /**
   * Custom aria label for the chart
   */
  ariaLabel?: string;
  
  /**
   * Custom class name
   */
  className?: string;
  
  /**
   * Additional styles
   */
  style?: React.CSSProperties;
  
  /**
   * Callback when chart reference changes
   */
  onChartRefChange?: (chartInstance: any) => void;
}

/**
 * Enhanced accessible chart component with better keyboard navigation and screen reader support
 */
const EnhancedAccessibleChart: React.FC<EnhancedAccessibleChartProps> = ({
  title = 'Chart',
  subtitle,
  configuration,
  width = '100%',
  height = 300,
  themeName = 'default',
  showExportOptions = false,
  showChartTypeOptions = false,
  isLoading = false,
  onAddToReport,
  onChartTypeChange,
  onRefresh,
  onEdit,
  highContrastDefault = false,
  dataTableView = false,
  ariaLabel,
  className,
  style,
  onChartRefChange
}) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Accessibility state
  const [highContrast, setHighContrast] = useState<boolean>(highContrastDefault);
  const [showDataTable, setShowDataTable] = useState<boolean>(dataTableView);
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [keyboardNavigationEnabled, setKeyboardNavigationEnabled] = useState<boolean>(true);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState<boolean>(false);
  
  // Get chart type for keyboard shortcuts
  const chartType = configuration?.type as 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'scatter' | 'default' || 'default';
  const hasMultipleDatasets = configuration?.data?.datasets?.length > 1;
  
  // Use the chart keyboard navigation hook
  const {
    containerRef,
    handleKeyDown,
    accessibleDataPoints,
    activeDataPointIndex,
    focusIndex,
    announcementText,
    chartDescription,
    navigateToDataPoint,
    clearActiveDataPoint
  } = useChartKeyboardNavigation(configuration, {
    enabled: keyboardNavigationEnabled,
    announcements: true,
    ariaLabel: ariaLabel,
    title: title,
    onDataPointSelect: (dataPoint) => {
      console.log(`Selected data point: ${dataPoint.label}:${dataPoint.value}`);
    }
  });
  
  // Toggle high contrast mode
  const toggleHighContrast = () => {
    setHighContrast(!highContrast);
  };
  
  // Toggle data table view
  const toggleDataTableView = () => {
    setShowDataTable(!showDataTable);
  };
  
  // Toggle keyboard shortcuts dialog
  const toggleKeyboardShortcuts = () => {
    setShowKeyboardShortcuts(!showKeyboardShortcuts);
  };
  
  // Handle keyboard shortcuts
  const handleGlobalKeyDown = (event: KeyboardEvent) => {
    // Alt+H to toggle keyboard shortcuts help
    if (event.altKey && event.key === 'h') {
      event.preventDefault();
      toggleKeyboardShortcuts();
    }
    
    // Alt+D to toggle data table view
    if (event.altKey && event.key === 'd') {
      event.preventDefault();
      toggleDataTableView();
    }
    
    // Alt+A to announce chart summary
    if (event.altKey && event.key === 'a') {
      event.preventDefault();
      announceChartSummary();
    }
  };
  
  // Register global keyboard handlers
  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);
  
  // Announce chart summary to screen readers
  const announceChartSummary = () => {
    if (chartDescription) {
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'assertive');
      announcement.textContent = chartDescription;
      
      // Add to DOM, read by screen reader, then remove
      document.body.appendChild(announcement);
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 3000);
    }
  };
  
  // Handle chart render
  const handleChartRender = (canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
  };
  
  // Handle chart ref change
  const handleChartRefChange = (chartInstance: any) => {
    if (onChartRefChange) {
      onChartRefChange(chartInstance);
    }
  };
  
  // Combine the configuration with high contrast settings if needed
  const getChartConfiguration = (): ChartConfiguration => {
    if (!highContrast || !configuration) return configuration;
    
    // Create a deep copy to avoid modifying the original
    const highContrastConfig = JSON.parse(JSON.stringify(configuration)) as ChartConfiguration;
    
    // Apply high contrast colors - this should actually be handled by ChartAccessibilityProvider
    // and is just a placeholder here
    
    return highContrastConfig;
  };
  
  return (
    <Box 
      className={className}
      style={style}
      sx={{ 
        width, 
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel || `${title} chart. Use arrow keys to history.push data points.`}
    >
      {/* Title and controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box>
          {title && <Typography variant="h6">{title}</Typography>}
          {subtitle && <Typography variant="body2" color="textSecondary">{subtitle}</Typography>}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Toggle high contrast mode">
            <IconButton onClick={toggleHighContrast} size="small" color={highContrast ? "primary" : "default"}>
              <HighContrastIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Toggle data table view">
            <IconButton onClick={toggleDataTableView} size="small" color={showDataTable ? "primary" : "default"}>
              <TableIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Keyboard shortcuts (Alt+H)">
            <IconButton onClick={toggleKeyboardShortcuts} size="small">
              <KeyboardIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Accessibility announcement region */}
      {announcementText && (
        <div 
          role="status" 
          aria-live="assertive" 
          className="sr-only"
          style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}
        >
          {announcementText}
        </div>
      )}
      
      {/* Chart or Data Table View */}
      {showDataTable ? (
        <ChartDataTable 
          configuration={configuration} 
          title={title} 
          highContrast={highContrast}
        />
      ) : (
        <InteractiveChart
          configuration={getChartConfiguration()}
          width={width}
          height={height}
          title={title}
          subtitle={subtitle}
          isLoading={isLoading}
          themeName={themeName}
          showExportOptions={showExportOptions}
          showChartTypeOptions={showChartTypeOptions}
          onAddToReport={onAddToReport}
          onChartTypeChange={onChartTypeChange}
          onRefresh={onRefresh}
          onEdit={onEdit}
          onChartRefChange={handleChartRefChange}
        />
      )}
      
      {/* Keyboard navigation help */}
      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
        <Typography variant="caption" color="textSecondary">
          Use arrow keys to history.push. Press Alt+H for keyboard shortcuts.
        </Typography>
      </Box>
      
      {/* Keyboard shortcut help dialog */}
      <KeyboardShortcutHelp
        open={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
        chartType={chartType}
        hasMultipleDatasets={hasMultipleDatasets}
      />
    </Box>
  );
};

export default EnhancedAccessibleChart; 