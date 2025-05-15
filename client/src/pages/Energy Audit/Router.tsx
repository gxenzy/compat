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
    <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f5f5f5',
        overflowX: 'auto',
        '&::-webkit-scrollbar': {
          height: '8px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: theme.palette.mode === 'dark' ? '#555' : '#ccc',
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
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.value}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', py: 0.5 }}>
                  {tab.icon}
                  <Typography variant="caption" sx={{ mt: 0.5 }}>
                    {tab.label}
                  </Typography>
                </Box>
              }
              value={tab.value}
              sx={{ 
                minWidth: 90,
                px: 1,
              }}
            />
          ))}
        </Tabs>
      </Box>
      <Box sx={{ py: 3 }}>
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