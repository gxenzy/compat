import React, { lazy, Suspense } from 'react';
import { Switch, Route, Redirect, useLocation } from 'react-router-dom';
import { CircularProgress, Box, Typography } from '@mui/material';
import MainLayout from '../layouts/MainLayout';
import EnergyAuditDashboard from '../pages/Energy Audit/Dashboard';
import ElectricalSystem from '../pages/ElectricalSystem';
import Login from '../pages/Login';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';
import UserManagement from '../pages/UserManagement';
import { useAuthContext } from '../contexts/AuthContext';
import PageTransition from '../components/PageTransition';
import { UserRole } from '../types';
import EnergyAuditV2Router from '../pages/Energy Audit/Router';
import StandardsReference from '../pages/Energy Audit/components/StandardsReference/StandardsReference';
import IlluminationLevelCalculator from '../pages/Energy Audit/components/Calculators/IlluminationLevelCalculator';
import SavedCalculationsViewer from '../pages/Energy Audit/components/Calculators/SavedCalculationsViewer';
import StandardsManagement from '../pages/AdminSettings/StandardsManagement';
import SystemSettingsPage from '../pages/Admin/Dashboard/SystemSettings';
import AccessibilityChartExample from '../components/UI/AccessibilityChartExample';
import AccessibilityTester from '../components/UI/AccessibilityTester';
import ChartTypeSelector from '../components/UI/ChartTypeSelector';
import ColorBlindnessDemo from '../components/UI/ColorBlindnessDemo';
import EnhancedPatternDemo from '../components/UI/EnhancedPatternDemo';
import ScreenReaderAccessibilityDemo from '../components/UI/ScreenReaderAccessibilityDemo';
import ChartAccessibilityTestSuite from '../components/UI/ChartAccessibilityTestSuite';
import ChartAccessibilityTestRecorder from '../components/UI/ChartAccessibilityTestRecorder';
import ChartAccessibilityTestReports from '../components/UI/ChartAccessibilityTestReports';
import ScreenReaderTestingGuide from '../components/UI/ScreenReaderTestingGuide';
import ChartAccessibilityTestStats from '../components/UI/ChartAccessibilityTestStats';
import AccessibilityTestingDashboard from '../components/UI/AccessibilityTestingDashboard';
import ChartAccessibilityRoadmap from '../components/UI/ChartAccessibilityRoadmap';
import { useTheme } from '@mui/material/styles';
import { ChartConfiguration } from 'chart.js';

// Report Management Components
import { ReportList, ReportView, ReportEditor, ReportShare } from '../components/ReportManagement';
import Reports from '../pages/Reports';

// Auth Components
const LoginPage = lazy(() => import('../pages/Login'));
const NotFoundPage = lazy(() => import('../pages/NotFound'));

// Define a default chart configuration for the AccessibilityTester
const defaultChartConfig: ChartConfiguration = {
  type: 'bar' as const,
  data: {
    labels: ['January', 'February', 'March', 'April', 'May', 'June'],
    datasets: [{
      label: 'Energy Consumption',
      data: [65, 59, 80, 81, 56, 55],
      backgroundColor: [
        'rgba(75, 192, 192, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)'
      ],
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)'
      ],
      borderWidth: 1
    }]
  },
  options: {
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
};

// Protected route component
const ProtectedRoute: React.FC<{ 
  component: React.ComponentType<any>;
  requiredRole?: UserRole;
  path: string;
  exact?: boolean;
}> = ({ component: Component, requiredRole, ...rest }) => {
  const { isAuthenticated, user } = useAuthContext();
  
  return (
    <Route
      {...rest}
      render={props => {
        if (!isAuthenticated) {
          return <Redirect to="/login" />;
        }
        
        if (requiredRole && user?.role !== requiredRole) {
          return <Redirect to="/dashboard" />;
        }
        
        return <Component {...props} />;
      }}
    />
  );
};

// MainLayout wrapper component
const MainLayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <MainLayout>{children}</MainLayout>;
};

// Loading component for Suspense
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

const AppRoutes: React.FC = () => {
  // Using direct token check for authentication instead of AuthContext
  const isTokenAuthenticated = !!localStorage.getItem('token');
  const location = useLocation();
  
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        {/* Public routes */}
        <Route 
          path="/login" 
          render={() => 
            isTokenAuthenticated ? 
            <Redirect to="/dashboard" /> : 
            <PageTransition variant="fade">
              <LoginPage />
            </PageTransition>
          } 
        />
        
        {/* Protected routes with MainLayout */}
        <Route path="/" render={props => (
          isTokenAuthenticated ? (
            <MainLayout>
              <Switch location={location} key={location.pathname}>
                <Route 
                  exact 
                  path="/" 
                  render={() => (
                    <PageTransition variant="fade" key="home">
                      <EnergyAuditDashboard />
                    </PageTransition>
                  )} 
                />
                
                <Route 
                  exact
                  path="/dashboard" 
                  render={() => (
                    <PageTransition variant="fade" key="dashboard">
                      <EnergyAuditDashboard />
                    </PageTransition>
                  )} 
                />
                
                <Route 
                  path="/energy-audit" 
                  render={() => (
                    <PageTransition variant="slide" key="energy-audit">
                      <EnergyAuditV2Router />
                    </PageTransition>
                  )} 
                />
                
                <Route 
                  path="/energy-audit-v2" 
                  render={() => <Redirect to="/energy-audit" />} 
                />
                
                <Route 
                  exact
                  path="/electrical-system" 
                  render={() => (
                    <PageTransition variant="slide" key="electrical-system">
                      <ElectricalSystem />
                    </PageTransition>
                  )} 
                />
                
                {/* Standards Reference Route - Redirect to Energy Audit */}
                <Route 
                  exact
                  path="/standards" 
                  render={() => <Redirect to="/energy-audit/standards-reference" />} 
                />
                
                {/* Report Management Routes */}
                <Route 
                  exact
                  path="/reports" 
                  render={() => <Redirect to="/energy-audit/reports" />}
                />
                
                {/* User Management Route */}
                <Route 
                  path="/user-management" 
                  render={() => (
                    <PageTransition variant="slide" key="user-management">
                      <UserManagement />
                    </PageTransition>
                  )} 
                />
                
                {/* Profile Route */}
                <Route 
                  exact
                  path="/profile" 
                  render={() => (
                    <PageTransition variant="fade" key="profile">
                      <Profile />
                    </PageTransition>
                  )} 
                />
                
                {/* Settings Route */}
                <Route 
                  exact
                  path="/settings" 
                  render={() => (
                    <PageTransition variant="fade" key="settings">
                      <Settings />
                    </PageTransition>
                  )} 
                />
                
                {/* Add System Settings route */}
                <Route 
                  path="/settings/system" 
                  render={() => (
                    <PageTransition variant="scale" key="system-settings">
                      <SystemSettingsPage />
                    </PageTransition>
                  )} 
                />
                
                {/* Standards Management Route */}
                <Route 
                  path="/admin/standards-management" 
                  render={() => (
                    <PageTransition variant="scale" key="standards-management">
                      <StandardsManagement />
                    </PageTransition>
                  )} 
                />
                
                {/* Add route for accessibility chart example */}
                <Route 
                  path="/accessibility/example"
                  render={() => (
                    <PageTransition variant="scale" key="accessibility-example">
                      <Box sx={{ p: 3 }}>
                        <AccessibilityChartExample />
                      </Box>
                    </PageTransition>
                  )}
                />
                
                {/* Add route for accessibility tester */}
                <Route 
                  path="/accessibility/tester"
                  render={() => (
                    <PageTransition variant="scale">
                      <AccessibilityTester 
                        title="Chart Accessibility Tester"
                        chartConfig={defaultChartConfig}
                        themeName="energy" 
                      />
                    </PageTransition>
                  )}
                />
                
                {/* Chart Type Selector route */}
                <Route 
                  path="/accessibility/chart-types"
                  render={() => (
                    <PageTransition variant="scale">
                      <ChartTypeSelector />
                    </PageTransition>
                  )}
                />
                
                {/* Color Blindness Demo route */}
                <Route 
                  path="/accessibility/color-blindness"
                  render={() => (
                    <PageTransition variant="scale">
                      <ColorBlindnessDemo />
                    </PageTransition>
                  )}
                />
                
                {/* Pattern Demo route */}
                <Route 
                  path="/accessibility/patterns"
                  render={() => (
                    <PageTransition variant="scale">
                      <EnhancedPatternDemo />
                    </PageTransition>
                  )}
                />
                
                {/* Screen Reader Demo route */}
                <Route 
                  path="/accessibility/screen-reader"
                  render={() => (
                    <PageTransition variant="scale">
                      <ScreenReaderAccessibilityDemo />
                    </PageTransition>
                  )}
                />
                
                {/* Test Suite route */}
                <Route 
                  path="/accessibility/test-suite"
                  render={() => (
                    <PageTransition variant="scale">
                      <ChartAccessibilityTestSuite />
                    </PageTransition>
                  )}
                />
                
                {/* Test Recorder route */}
                <Route 
                  path="/accessibility/test-recorder"
                  render={() => (
                    <PageTransition variant="scale">
                      <ChartAccessibilityTestRecorder />
                    </PageTransition>
                  )}
                />
                
                {/* Test Reports route */}
                <Route 
                  path="/accessibility/test-reports"
                  render={() => (
                    <PageTransition variant="scale">
                      <ChartAccessibilityTestReports />
                    </PageTransition>
                  )}
                />
                
                {/* Screen Reader Guide route */}
                <Route 
                  path="/accessibility/screen-reader-guide"
                  render={() => (
                    <PageTransition variant="scale">
                      <ScreenReaderTestingGuide />
                    </PageTransition>
                  )}
                />
                
                {/* Test Stats route */}
                <Route 
                  path="/accessibility/test-stats"
                  render={() => (
                    <PageTransition variant="scale">
                      <ChartAccessibilityTestStats />
                    </PageTransition>
                  )}
                />
                
                {/* AccessibilityTestingDashboard route */}
                <Route 
                  path="/accessibility/dashboard"
                  render={() => (
                    <PageTransition variant="scale">
                      <AccessibilityTestingDashboard />
                    </PageTransition>
                  )}
                />
                
                {/* Accessibility Roadmap route */}
                <Route 
                  path="/accessibility/roadmap"
                  render={() => (
                    <PageTransition variant="scale">
                      <ChartAccessibilityRoadmap />
                    </PageTransition>
                  )}
                />

                {/* Not Found route - catch all other routes */}
                <Route 
                  path="*" 
                  render={() => (
                    <PageTransition variant="fade">
                      <NotFoundPage />
                    </PageTransition>
                  )} 
                />
              </Switch>
            </MainLayout>
          ) : <Redirect to="/login" />
        )} />
      </Switch>
    </Suspense>
  );
};

export default AppRoutes;
