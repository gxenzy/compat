import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { apiClient, API_BASE_URL, STANDARDS_API, COMPLIANCE_API, USER_API } from './apiConfig';

/**
 * ApiTester Component
 * 
 * This is a utility component to test different API endpoints and verify
 * that they're working correctly. Can be accessed via a hidden route for debugging.
 */
const ApiTester: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{endpoint: string, status: 'success' | 'error', data?: any, error?: any}>>([]);
  
  const testEndpoint = async (name: string, url: string) => {
    try {
      setLoading(true);
      
      // Add to results with pending status
      setResults(prev => [...prev, { endpoint: name, status: 'loading' as any }]);
      
      // Make the request
      const response = await apiClient.get(url);
      
      // Update results with success
      setResults(prev => 
        prev.map(item => 
          item.endpoint === name 
            ? { endpoint: name, status: 'success', data: response.data } 
            : item
        )
      );
      
      return true;
    } catch (error) {
      // Update results with error
      setResults(prev => 
        prev.map(item => 
          item.endpoint === name 
            ? { endpoint: name, status: 'error', error } 
            : item
        )
      );
      
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const runAllTests = async () => {
    // Clear previous results
    setResults([]);
    
    // Basic health check
    await testEndpoint('Server Health Check', `${API_BASE_URL}/health`);
    
    // Standards API tests
    await testEndpoint('Standards List', STANDARDS_API.STANDARDS);
    
    // Compliance API tests
    await testEndpoint('Compliance Rules', COMPLIANCE_API.RULES);
    
    // User API tests
    const roles = ['admin', 'auditor'];
    await testEndpoint('Users by Roles', USER_API.BY_ROLES(roles));
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>API Connection Tester</Typography>
      <Typography variant="body1" paragraph>
        This utility tests API connections to diagnose network or server issues.
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Button 
          variant="contained"
          onClick={runAllTests}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Testing...' : 'Run Tests'}
        </Button>
      </Box>
      
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Test Results</Typography>
        
        {results.length === 0 ? (
          <Typography color="text.secondary">No tests run yet. Click "Run Tests" to begin.</Typography>
        ) : (
          <List>
            {results.map((result, index) => (
              <React.Fragment key={result.endpoint}>
                <ListItem>
                  <ListItemText 
                    primary={result.endpoint}
                    secondary={
                      result.status === 'success'
                        ? `Success - Received data with ${Array.isArray(result.data) ? result.data.length + ' items' : 'object'}`
                        : result.status === 'error'
                        ? `Error: ${result.error?.message || 'Unknown error'} (${result.error?.response?.status || 'No status'})`
                        : 'Loading...'
                    }
                  />
                  {result.status === 'success' ? (
                    <Alert severity="success" sx={{ ml: 2 }}>OK</Alert>
                  ) : result.status === 'error' ? (
                    <Alert severity="error" sx={{ ml: 2 }}>Failed</Alert>
                  ) : (
                    <CircularProgress size={20} />
                  )}
                </ListItem>
                {index < results.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default ApiTester; 