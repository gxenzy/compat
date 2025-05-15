import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Box, Tabs, Tab, Typography, Button, useTheme } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  BarChart as AnalyticsIcon,
  ListAlt as ListIcon,
  SsidChart as ChartIcon,
  OfflineBolt as EnergyIcon,
  Description as ReportIcon,
  DataObject as DataIcon,
  CompareArrows as CompareIcon,
  Calculate as CalculateIcon,
  Lightbulb as LightbulbIcon,
  Warning as WarningIcon,
  Devices as DevicesIcon,
  Construction as BuildIcon,
  BuildCircle as MaintenanceIcon,
  PhoneAndroid as MobileIcon,
  Rule as RuleIcon,
  ViewInAr as ViewInArIcon,
  CheckBox as CheckBoxIcon,
  OfflineBolt as OfflineBoltIcon
} from '@mui/icons-material';
import { useThemeMode } from '../../contexts/ThemeContext';
import { alpha } from '@mui/material/styles';

// Import Dashboard component
import Dashboard from './Dashboard';

// Import individual component implementations 
import BuildingVisualization from './components/BuildingVisualization';
import StandardsReference from './components/StandardsReference';
import EnergyConsumptionAnalytics from './components/Analytics/EnergyConsumptionAnalytics';
import ROICalculatorComponent from './components/ROICalculator/ROICalculatorComponent';
import InspectionChecklistComponent from './components/InspectionChecklist/InspectionChecklistComponent';
import { AuditWorkflow } from './AuditManagementWorkflow';
import BasicEnergyCalculator from './components/EnergyCalculators/BasicEnergyCalculator';
import ChecklistDetail from './components/StandardsReference/Compliance/ChecklistDetail';

// For placeholder components that haven't been fully implemented yet,
// create simple functional components directly in this file
const AnomalyDetection = () => (
  <Box sx={{ p: 3, textAlign: 'center' }}>
    <Typography variant="h4" gutterBottom>Anomaly Detection</Typography>
    <Typography variant="body1">This component will be implemented as part of the Energy Audit system.</Typography>
  </Box>
);

const AIRecommendations = () => (
  <Box sx={{ p: 3, textAlign: 'center' }}>
    <Typography variant="h4" gutterBottom>AI Recommendations</Typography>
    <Typography variant="body1">This component will be implemented as part of the Energy Audit system.</Typography>
  </Box>
);

const PredictiveMaintenanceModel = () => (
  <Box sx={{ p: 3, textAlign: 'center' }}>
    <Typography variant="h4" gutterBottom>Predictive Maintenance Model</Typography>
    <Typography variant="body1">This component will be implemented as part of the Energy Audit system.</Typography>
  </Box>
);

const BuildingViewer = () => (
  <Box sx={{ p: 3, textAlign: 'center' }}>
    <Typography variant="h4" gutterBottom>Building Visualization</Typography>
    <Typography variant="body1">This component will be implemented as part of the Energy Audit system.</Typography>
  </Box>
);

const StandardsCompliance = () => (
  <Box sx={{ p: 3, textAlign: 'center' }}>
    <Typography variant="h4" gutterBottom>Standards Compliance</Typography>
    <Typography variant="body1">This component will be implemented as part of the Energy Audit system.</Typography>
  </Box>
);

const MobileDataCollection = () => (
  <Box sx={{ p: 3, textAlign: 'center' }}>
    <Typography variant="h4" gutterBottom>Mobile Field Data Collection</Typography>
    <Typography variant="body1">This component will be implemented as part of the Energy Audit system.</Typography>
  </Box>
);

const BenchmarkingComponent = () => (
  <Box sx={{ p: 3, textAlign: 'center' }}>
    <Typography variant="h4" gutterBottom>Benchmarking</Typography>
    <Typography variant="body1">This component will be implemented as part of the Energy Audit system.</Typography>
  </Box>
);

const ReportGeneratorComponent = () => (
  <Box sx={{ p: 3, textAlign: 'center' }}>
    <Typography variant="h4" gutterBottom>Report Generator</Typography>
    <Typography variant="body1">This component will be implemented as part of the Energy Audit system.</Typography>
  </Box>
);

const IntegrationHub = () => (
  <Box sx={{ p: 3, textAlign: 'center' }}>
    <Typography variant="h4" gutterBottom>Integration Hub</Typography>
    <Typography variant="body1">This component will be implemented as part of the Energy Audit system.</Typography>
  </Box>
);

const EnergyAuditRouter: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { mode } = useThemeMode();
  
  const isSpecialTheme = ['blue', 'gray', 'energy'].includes(mode);
  
  // Get background colors based on theme
  const getBackgroundColor = () => {
    if (mode === 'blue') return '#0c4a6e'; // Same as content for blue
    if (mode === 'gray') return '#374151'; // Same as content for gray
    if (mode === 'energy') return '#064e3b'; // Same as content for energy
    return theme.palette.mode === 'dark' ? theme.palette.background.paper : '#f5f5f5';
  };
  
  // Get main content background colors based on theme
  const getContentBackgroundColor = () => {
    if (mode === 'blue') return '#0c4a6e'; // Deep blue for content
    if (mode === 'gray') return '#374151'; // Deep gray for content
    if (mode === 'energy') return '#064e3b'; // Deep green for content
    return theme.palette.background.paper;
  };
  
  // Function to extract tab from path
  const getTabFromPath = (path: string) => {
    const pathParts = path.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    return lastPart === 'energy-audit' || lastPart === '' ? 'dashboard' : lastPart;
  };
  
  const [activeTab, setActiveTab] = useState(() => {
    return getTabFromPath(location.pathname);
  });
  
  // Update activeTab when location changes
  useEffect(() => {
    const tab = getTabFromPath(location.pathname);
    setActiveTab(tab);
  }, [location.pathname]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
    navigate(`/energy-audit/${newValue}`);
  };

  // Define tabs for navigation
  const tabs = [
    {
      label: 'Dashboard',
      value: 'dashboard',
      icon: <DashboardIcon />,
      component: <Dashboard />
    },
    {
      label: 'Building Visualization',
      value: 'building-visualization',
      icon: <ViewInArIcon />,
      component: <BuildingVisualization />
    },
    {
      label: 'Standards Reference',
      value: 'standards-reference',
      icon: <RuleIcon />,
      component: <StandardsReference />
    },
    {
      label: 'Energy Analytics',
      value: 'energy-analytics',
      icon: <AnalyticsIcon />,
      component: <EnergyConsumptionAnalytics />
    },
    {
      label: 'Inspection Checklist',
      value: 'inspection-checklist',
      icon: <CheckBoxIcon />,
      component: <InspectionChecklistComponent />
    },
    {
      label: 'Energy Calculators',
      value: 'energy-calculators',
      icon: <OfflineBoltIcon />,
      component: <BasicEnergyCalculator />
    },
    {
      label: 'Audit Workflow',
      value: 'audit-workflow',
      icon: <ListIcon />,
      component: <AuditWorkflow />
    },
    {
      label: 'ROI Calculator',
      value: 'roi-calculator',
      icon: <CalculateIcon />,
      component: <ROICalculatorComponent />
    }
  ];

  return (
    <Box sx={{ 
      width: '100%', 
      bgcolor: isSpecialTheme ? getContentBackgroundColor() : 'background.paper',
      color: isSpecialTheme ? '#ffffff' : 'text.primary',
      minHeight: '90vh',
      maxHeight: 'calc(100vh - 64px)', // Standardized height calculation across all themes
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: isSpecialTheme ? 'rgba(255,255,255,0.1)' : 'divider',
        bgcolor: getBackgroundColor(),
        overflowX: 'auto',
        flexShrink: 0, // Don't allow this element to shrink
        '&::-webkit-scrollbar': {
          height: '8px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: isSpecialTheme ? 'rgba(255,255,255,0.3)' : theme.palette.mode === 'dark' ? '#555' : '#ccc',
          borderRadius: '4px',
        },
      }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            height: '72px', // Fixed height for all themes
            '& .MuiTab-root': {
              color: isSpecialTheme ? '#ffffff' : undefined,
              opacity: isSpecialTheme ? 0.8 : undefined,
              height: '72px',
              minHeight: '72px',
              transition: 'all 0.2s ease',
              padding: '0px 16px', // Consistent padding
              '&.Mui-selected': {
                color: isSpecialTheme ? '#ffffff' : undefined,
                fontWeight: isSpecialTheme ? 700 : 600,
                opacity: isSpecialTheme ? 1 : undefined,
                backgroundColor: isSpecialTheme ? 'rgba(255,255,255,0.1)' : undefined,
              },
              '& .MuiSvgIcon-root': {
                color: isSpecialTheme ? '#ffffff' : undefined,
                opacity: isSpecialTheme ? 0.9 : undefined,
                fontSize: '1.6rem',
                marginBottom: '4px',
              },
              '& .MuiTypography-caption': {
                color: isSpecialTheme ? '#ffffff' : undefined,
                fontWeight: isSpecialTheme ? 500 : undefined,
                textTransform: 'none',
              },
              '&:hover': {
                backgroundColor: isSpecialTheme ? 'rgba(255,255,255,0.1)' : undefined,
                opacity: isSpecialTheme ? 1 : undefined,
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: isSpecialTheme ? '#ffffff' : undefined,
              height: isSpecialTheme ? 3 : undefined,
            }
          }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.value}
              label={
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  flexDirection: 'column', 
                  py: 0.5
                }}>
                  {tab.icon}
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mt: 0.5,
                      fontSize: '0.75rem',
                      fontWeight: activeTab === tab.value ? 700 : 500,
                      textShadow: isSpecialTheme ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                    }}
                  >
                    {tab.label}
                  </Typography>
                </Box>
              }
              value={tab.value}
              sx={{ 
                minWidth: 92,
                px: 1.5,
                borderRadius: '4px 4px 0 0',
              }}
            />
          ))}
        </Tabs>
      </Box>
      <Box sx={{ 
        py: 2, // Reduced vertical padding
        px: 2,
        flex: 1, // Take the remaining height
        overflow: 'auto', // Make content scrollable
        height: 'calc(100vh - 72px - 64px)', // Tab height + app bar
        maxHeight: 'calc(100vh - 72px - 64px)',
        color: isSpecialTheme ? '#ffffff' : 'inherit',
        '& .MuiPaper-root': {
          bgcolor: isSpecialTheme ? alpha('#ffffff', 0.05) : undefined,
          backdropFilter: isSpecialTheme ? 'blur(10px)' : undefined,
          borderRadius: 2,
          boxShadow: isSpecialTheme ? '0 4px 20px rgba(0,0,0,0.1)' : undefined,
          borderColor: isSpecialTheme ? alpha('#ffffff', 0.1) : undefined,
        },
        '& .MuiAlert-root, & .MuiCard-root, & [class*="infoBox"]': {
          bgcolor: isSpecialTheme ? alpha('#ffffff', 0.07) : undefined,
          borderColor: isSpecialTheme ? alpha('#ffffff', 0.1) : undefined,
          borderRadius: 2,
          boxShadow: isSpecialTheme ? '0 4px 12px rgba(0,0,0,0.1)' : undefined,
        },
        '& .MuiTypography-root': {
          color: isSpecialTheme ? '#ffffff' : undefined,
        },
        '& .MuiTypography-body1, & .MuiTypography-body2': {
          color: isSpecialTheme ? alpha('#ffffff', 0.85) : undefined
        },
        '& .MuiButton-root': {
          fontWeight: 500,
          borderRadius: '8px !important',
          textTransform: 'none',
          boxShadow: isSpecialTheme ? '0 2px 6px rgba(0,0,0,0.15)' : undefined,
          padding: '6px 16px',
          minHeight: '36px',
          fontSize: '0.875rem',
        },
        '& .MuiButton-contained': {
          backgroundColor: mode === 'energy' ? '#10b981' : 
                          mode === 'blue' ? '#0284c7' : 
                          mode === 'gray' ? '#4b5563' : undefined,
          color: '#ffffff',
          '&:hover': {
            backgroundColor: mode === 'energy' ? '#059669' : 
                            mode === 'blue' ? '#0369a1' : 
                            mode === 'gray' ? '#374151' : undefined,
          }
        },
        '& .MuiIconButton-root': {
          borderRadius: '8px',
          padding: '8px',
          backgroundColor: mode === 'energy' ? 'rgba(16, 185, 129, 0.1)' : 
                           mode === 'blue' ? 'rgba(2, 132, 199, 0.1)' : 
                           mode === 'gray' ? 'rgba(75, 85, 99, 0.1)' : undefined,
          '&:hover': {
            backgroundColor: mode === 'energy' ? 'rgba(16, 185, 129, 0.2)' : 
                             mode === 'blue' ? 'rgba(2, 132, 199, 0.2)' : 
                             mode === 'gray' ? 'rgba(75, 85, 99, 0.2)' : undefined,
          }
        },
        '& .MuiOutlinedInput-root': {
          borderRadius: '8px',
          '& fieldset': {
            borderColor: isSpecialTheme ? alpha('#ffffff', 0.2) : undefined,
          },
          '&:hover fieldset': {
            borderColor: isSpecialTheme ? alpha('#ffffff', 0.4) : undefined,
          },
          '&.Mui-focused fieldset': {
            borderColor: mode === 'energy' ? '#10b981' : 
                         mode === 'blue' ? '#0284c7' : 
                         mode === 'gray' ? '#4b5563' : undefined,
          }
        },
        '& .MuiSelect-select': {
          borderRadius: '8px',
          padding: '10px 14px',
        },
        '& .MuiInputBase-root': {
          color: isSpecialTheme ? '#ffffff' : undefined,
        },
        '& .MuiFormLabel-root': {
          color: isSpecialTheme ? alpha('#ffffff', 0.7) : undefined,
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: isSpecialTheme ? alpha('#ffffff', 0.2) : undefined,
        },
        '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: isSpecialTheme ? alpha('#ffffff', 0.5) : undefined,
        },
        // Special styling for controls in the BuildingVisualization component
        '& [class*="floorPlanControls"]': {
          '& button, & .MuiButton-root': {
            borderRadius: '8px !important',
            padding: '6px 16px !important',
            minHeight: '36px !important',
            backgroundColor: isSpecialTheme ? alpha('#ffffff', 0.1) : undefined,
            color: isSpecialTheme ? '#ffffff' : undefined,
            '&:hover': {
              backgroundColor: isSpecialTheme ? alpha('#ffffff', 0.2) : undefined,
            }
          },
          '& .MuiSelect-select, & .MuiOutlinedInput-root': {
            borderRadius: '8px !important',
            backgroundColor: isSpecialTheme ? alpha('#ffffff', 0.05) : undefined,
          }
        },
        // Special styling for tabs in the BuildingVisualization component
        '& [role="tablist"]': {
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 500,
            color: isSpecialTheme ? '#ffffff' : undefined,
            opacity: isSpecialTheme ? 0.8 : undefined,
            '&.Mui-selected': {
              color: isSpecialTheme ? '#ffffff' : undefined,
              opacity: isSpecialTheme ? 1 : undefined,
              fontWeight: 600,
            }
          },
          '& .MuiTabs-indicator': {
            backgroundColor: mode === 'energy' ? '#10b981' : 
                             mode === 'blue' ? '#0284c7' : 
                             mode === 'gray' ? '#4b5563' : undefined,
            height: 3,
          }
        }
      }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          {tabs.map((tab) => (
            <Route key={tab.value} path={`/${tab.value}`} element={tab.component} />
          ))}
          
          {/* Add new routes for compliance checker components */}
          <Route path="/standards-reference/compliance/checklist/:id" element={<ChecklistDetail />} />
          
          {/* Redirect to dashboard if no route matches */}
          <Route path="*" element={<Navigate to="/energy-audit/dashboard" replace />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default EnergyAuditRouter; 