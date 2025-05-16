import React, { Suspense, useEffect } from 'react';
import AppRoutes from './routes/index';
import { AnimatePresence } from 'framer-motion';
import { useLocation, useHistory } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { CircularProgress, Box, Typography, Button } from '@mui/material';
import { EnergyAuditProvider } from './contexts/EnergyAuditContext';
import { AccessibilitySettingsProvider } from './contexts/AccessibilitySettingsContext';
import ChartAccessibilityProvider from './utils/reportGenerator/ChartAccessibilityProvider';
import { Toaster } from 'react-hot-toast';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        p: 3,
        textAlign: 'center',
      }}
    >
      <Typography variant="h4" color="error" gutterBottom>
        Something went wrong
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        {error.message}
      </Typography>
      <Button variant="contained" onClick={resetErrorBoundary}>
        Try again
      </Button>
    </Box>
  );
}

function LoadingFallback() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <CircularProgress />
    </Box>
  );
}

function App() {
  const location = useLocation();
  const history = useHistory();
  
  // Navigation change handler
  useEffect(() => {
    console.log('App: Route changed to', location.pathname);
    // Reset scroll position on navigation
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  // Handle token expiration
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token && location.pathname !== '/login') {
      console.log('App: No token found, redirecting to login');
      history.push('/login');
    }
  }, [location.pathname, history]);
  
  return (
    <>
      <Toaster position="top-right" />
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => {
          // Reset the state of your app here
          window.location.href = '/';
        }}
      >
        <AccessibilitySettingsProvider>
          <ChartAccessibilityProvider>
            <EnergyAuditProvider>
              <Suspense fallback={<LoadingFallback />}>
                <AnimatePresence mode="wait" initial={false}>
                  <AppRoutes key={location.pathname} />
                </AnimatePresence>
              </Suspense>
            </EnergyAuditProvider>
          </ChartAccessibilityProvider>
        </AccessibilitySettingsProvider>
      </ErrorBoundary>
    </>
  );
}

export default App;
