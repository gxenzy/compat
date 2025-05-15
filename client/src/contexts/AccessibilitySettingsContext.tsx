import React, { createContext, useContext, useState, useEffect } from 'react';
import { ColorBlindnessType } from '../utils/accessibility/colorBlindnessSimulation';
// Import the CSS file with color blindness filters
import '../utils/accessibility/colorBlindnessFilters.css';

/**
 * Interface defining the accessibility settings that can be configured
 */
interface AccessibilitySettings {
  highContrastMode: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  screenReaderOptimization: boolean;
  colorBlindnessSimulation: ColorBlindnessType;
}

/**
 * Interface defining the context value shape with settings and update methods
 */
interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  toggleHighContrast: () => void;
  toggleLargeText: () => void;
  toggleReduceMotion: () => void;
  toggleScreenReaderOptimization: () => void;
  setColorBlindnessType: (type: ColorBlindnessType) => void;
}

/**
 * Default settings for accessibility
 */
const defaultSettings: AccessibilitySettings = {
  highContrastMode: false,
  largeText: false,
  reduceMotion: false,
  screenReaderOptimization: false,
  colorBlindnessSimulation: ColorBlindnessType.NONE
};

/**
 * Storage key for persisting settings in localStorage
 */
const STORAGE_KEY = 'energy-audit-accessibility-settings';

/**
 * Create context with undefined default value
 */
const AccessibilitySettingsContext = createContext<AccessibilityContextType | undefined>(undefined);

/**
 * SVG definitions for color blindness filters
 */
const colorBlindnessFiltersSvg = `
<svg style="position: absolute; height: 0; width: 0;">
  <defs>
    <!-- Protanopia (Red-Blind) Filter -->
    <filter id="protanopia-filter">
      <feColorMatrix
        in="SourceGraphic"
        type="matrix"
        values="0.567, 0.433, 0.000, 0, 0
                0.558, 0.442, 0.000, 0, 0
                0.000, 0.242, 0.758, 0, 0
                0, 0, 0, 1, 0"/>
    </filter>
    
    <!-- Deuteranopia (Green-Blind) Filter -->
    <filter id="deuteranopia-filter">
      <feColorMatrix
        in="SourceGraphic"
        type="matrix"
        values="0.625, 0.375, 0.000, 0, 0
                0.700, 0.300, 0.000, 0, 0
                0.000, 0.300, 0.700, 0, 0
                0, 0, 0, 1, 0"/>
    </filter>
    
    <!-- Tritanopia (Blue-Blind) Filter -->
    <filter id="tritanopia-filter">
      <feColorMatrix
        in="SourceGraphic"
        type="matrix"
        values="0.950, 0.050, 0.000, 0, 0
                0.000, 0.433, 0.567, 0, 0
                0.000, 0.475, 0.525, 0, 0
                0, 0, 0, 1, 0"/>
    </filter>
    
    <!-- Protanomaly (Red-Weak) Filter -->
    <filter id="protanomaly-filter">
      <feColorMatrix
        in="SourceGraphic"
        type="matrix"
        values="0.817, 0.183, 0.000, 0, 0
                0.333, 0.667, 0.000, 0, 0
                0.000, 0.125, 0.875, 0, 0
                0, 0, 0, 1, 0"/>
    </filter>
    
    <!-- Deuteranomaly (Green-Weak) Filter -->
    <filter id="deuteranomaly-filter">
      <feColorMatrix
        in="SourceGraphic"
        type="matrix"
        values="0.800, 0.200, 0.000, 0, 0
                0.258, 0.742, 0.000, 0, 0
                0.000, 0.142, 0.858, 0, 0
                0, 0, 0, 1, 0"/>
    </filter>
    
    <!-- Tritanomaly (Blue-Weak) Filter -->
    <filter id="tritanomaly-filter">
      <feColorMatrix
        in="SourceGraphic"
        type="matrix"
        values="0.967, 0.033, 0.000, 0, 0
                0.000, 0.733, 0.267, 0, 0
                0.000, 0.183, 0.817, 0, 0
                0, 0, 0, 1, 0"/>
    </filter>
  </defs>
</svg>
`;

/**
 * Provider component that manages accessibility settings state and persistence
 */
export const AccessibilitySettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize settings from localStorage or use defaults
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const storedSettings = localStorage.getItem(STORAGE_KEY);
      return storedSettings ? JSON.parse(storedSettings) : defaultSettings;
    } catch (error) {
      console.error('Failed to load accessibility settings from localStorage:', error);
      return defaultSettings;
    }
  });

  // Inject SVG filters for color blindness simulation
  useEffect(() => {
    // Check if filters are already injected
    if (!document.getElementById('color-blindness-filters')) {
      // Create container for SVG filters
      const filterContainer = document.createElement('div');
      filterContainer.id = 'color-blindness-filters';
      filterContainer.innerHTML = colorBlindnessFiltersSvg;
      document.body.appendChild(filterContainer);
    }

    // Clean up on unmount
    return () => {
      const filterContainer = document.getElementById('color-blindness-filters');
      if (filterContainer) {
        document.body.removeChild(filterContainer);
      }
    };
  }, []);

  // Persist settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save accessibility settings to localStorage:', error);
    }
  }, [settings]);

  // Apply settings to document when they change
  useEffect(() => {
    // Apply high contrast mode
    if (settings.highContrastMode) {
      document.documentElement.classList.add('high-contrast-mode');
    } else {
      document.documentElement.classList.remove('high-contrast-mode');
    }

    // Apply large text mode
    if (settings.largeText) {
      document.documentElement.classList.add('large-text-mode');
    } else {
      document.documentElement.classList.remove('large-text-mode');
    }

    // Apply reduced motion
    if (settings.reduceMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }

    // Apply screen reader optimizations
    if (settings.screenReaderOptimization) {
      document.documentElement.classList.add('screen-reader-optimized');
    } else {
      document.documentElement.classList.remove('screen-reader-optimized');
    }
    
    // Apply color blindness simulation type class
    // First remove any existing color blindness classes
    document.documentElement.classList.forEach(className => {
      if (className.startsWith('color-blindness-')) {
        document.documentElement.classList.remove(className);
      }
    });
    
    // Add the current color blindness class if not set to none
    if (settings.colorBlindnessSimulation !== ColorBlindnessType.NONE) {
      document.documentElement.classList.add(
        `color-blindness-${settings.colorBlindnessSimulation}`
      );
    }
  }, [settings]);

  // Update settings method
  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings
    }));
  };

  // Toggle methods for individual settings
  const toggleHighContrast = () => {
    setSettings(prevSettings => ({
      ...prevSettings,
      highContrastMode: !prevSettings.highContrastMode
    }));
  };

  const toggleLargeText = () => {
    setSettings(prevSettings => ({
      ...prevSettings,
      largeText: !prevSettings.largeText
    }));
  };

  const toggleReduceMotion = () => {
    setSettings(prevSettings => ({
      ...prevSettings,
      reduceMotion: !prevSettings.reduceMotion
    }));
  };

  const toggleScreenReaderOptimization = () => {
    setSettings(prevSettings => ({
      ...prevSettings,
      screenReaderOptimization: !prevSettings.screenReaderOptimization
    }));
  };

  const setColorBlindnessType = (type: ColorBlindnessType) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      colorBlindnessSimulation: type
    }));
  };

  // Context value
  const contextValue: AccessibilityContextType = {
    settings,
    updateSettings,
    toggleHighContrast,
    toggleLargeText,
    toggleReduceMotion,
    toggleScreenReaderOptimization,
    setColorBlindnessType
  };

  return (
    <AccessibilitySettingsContext.Provider value={contextValue}>
      {children}
    </AccessibilitySettingsContext.Provider>
  );
};

/**
 * Custom hook for using the accessibility settings context
 */
export const useAccessibilitySettings = () => {
  const context = useContext(AccessibilitySettingsContext);
  if (context === undefined) {
    throw new Error('useAccessibilitySettings must be used within an AccessibilitySettingsProvider');
  }
  return context;
};

export default AccessibilitySettingsContext; 