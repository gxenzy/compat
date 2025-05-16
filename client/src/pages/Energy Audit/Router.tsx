import React, { useState, useEffect } from 'react';
import { Switch, Route, useLocation, useHistory } from 'react-router-dom';
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
  OfflineBolt as OfflineBoltIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useThemeMode } from '../../contexts/ThemeContext';
import { alpha } from '@mui/material/styles';
import NotFound from '../../pages/NotFound';

// Import Dashboard component
import Dashboard from './Dashboard';

// Import individual component implementations 
// import BuildingVisualization from './components/BuildingVisualization';
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

// const BuildingViewer = () => (
//   <Box sx={{ p: 3, textAlign: 'center' }}>
//     <Typography variant="h4" gutterBottom>Building Visualization</Typography>
//     <Typography variant="body1">This component will be implemented as part of the Energy Audit system.</Typography>
//   </Box>
// );

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

// Define NavigateFunction type for v5 router
export type NavigateFunction = (path: string) => void;

// Redirect component for v5
const Redirect = ({ to }: { to: string }) => {
  const history = useHistory();
  
  useEffect(() => {
    history.push(to);
  }, [history, to]);
  
  return null;
};

// Create a local NotFound component to avoid import issues
const NotFoundComponent = () => {
  const history = useHistory();
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h1" sx={{ fontSize: '6rem', mb: 2 }}>404</Typography>
      <Typography variant="h4" sx={{ mb: 3 }}>Page Not Found</Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        The page you are looking for might have been removed, had its name
        changed, or is temporarily unavailable.
      </Typography>
      <Button 
        variant="contained" 
        startIcon={<HomeIcon />} 
        onClick={() => history.push('/')}
      >
        Back to Home
      </Button>
    </Box>
  );
};

const EnergyAuditRouter: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const history = useHistory();
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
    if (pathParts.length >= 3 && pathParts[1] === 'energy-audit') {
      return pathParts[2] || 'dashboard';
    }
    return 'dashboard';
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
    history.push(`/energy-audit/${newValue}`);
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
    //   label: 'Building Visualization',
    //   value: 'building-visualization',
    //   icon: <ViewInArIcon />,
    //   component: <BuildingVisualization />
    // },
    // {
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
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      bgcolor: getBackgroundColor(),
      borderRadius: 2,
      overflow: 'hidden'
    }}>
      {/* Navigation tabs */}
      <Box sx={{ 
        bgcolor: isSpecialTheme ? alpha(theme.palette.background.paper, 0.1) : theme.palette.background.default,
        boxShadow: isSpecialTheme ? 'none' : '0 2px 4px rgba(0,0,0,0.05)',
        borderBottom: isSpecialTheme ? `1px solid ${alpha('#fff', 0.1)}` : `1px solid ${theme.palette.divider}`,
      }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="energy audit navigation tabs"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: theme.palette.primary.main,
            }
          }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.value}
              label={tab.label}
              value={tab.value}
              icon={tab.icon}
              iconPosition="start"
              sx={{ 
                color: isSpecialTheme 
                  ? 'rgba(255,255,255,0.7)' 
                  : theme.palette.text.secondary,
                '&.Mui-selected': {
                  color: isSpecialTheme 
                    ? '#fff' 
                    : theme.palette.primary.main,
                  fontWeight: 'bold',
                },
                textTransform: 'none'
              }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Route content */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto',
        bgcolor: getContentBackgroundColor(),
        color: isSpecialTheme ? 'white' : 'inherit',
      }}>
        <Switch>
          <Route exact path="/">
            <Dashboard />
          </Route>
          
          {tabs.map((tab) => (
            <Route key={tab.value} path={`/energy-audit/${tab.value}`}>
              {tab.component}
            </Route>
          ))}
          
          <Route path="/standards-reference/compliance/checklist/:id">
            <ChecklistDetail />
          </Route>
          
          {/* This catch-all is causing reload issues - only redirect for specific cases */}
          <Route path="*">
            {(() => {
              // Only redirect if we're exactly at /energy-audit
              if (location.pathname === '/energy-audit') {
                return <Redirect to="/energy-audit/dashboard" />;
              }
              
              // Only redirect if we're in an energy-audit subpath that doesn't match any tab
              if (location.pathname.startsWith('/energy-audit/')) {
                const requestedTab = location.pathname.split('/')[2]; // Get the second path segment
                const tabExists = tabs.some(tab => tab.value === requestedTab);
                
                if (!tabExists) {
                  // Just return the dashboard for any invalid energy-audit path
                  return <Dashboard />;
                }
              }
              
              // For all other cases, show the NotFound page
              return <NotFoundComponent />;
            })()}
          </Route>
        </Switch>
      </Box>
    </Box>
  );
};

export default EnergyAuditRouter; 