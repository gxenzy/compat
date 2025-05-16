/**
 * Test Server Connectivity
 * 
 * This script checks if the server is available and tests basic API functionality.
 */
const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000/api';
const WS_URL = 'ws://localhost:8000';

console.log('====================================================');
console.log('STARTING SERVER CONNECTIVITY TEST');
console.log('====================================================');

async function testServerConnectivity() {
  console.log('Testing server connectivity...');
  
  try {
    // Test simple ping endpoint first
    console.log('Testing simple ping endpoint...');
    try {
      const pingResponse = await axios.get(`${API_BASE_URL.replace('/api', '')}/ping`, { timeout: 1500 });
      console.log('Ping response:', pingResponse.status, pingResponse.data);
    } catch (err) {
      console.error('Ping error:', err.message);
      if (err.code === 'ECONNREFUSED') {
        throw new Error('Server is not running - connection refused');
      }
      console.warn('Simple ping failed, trying public health endpoint');
    }
    
    // Test public health endpoint
    console.log('\nTesting public health endpoint...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL.replace('/api', '')}/api/public/health`, { timeout: 1500 });
      console.log('Public health check response:', healthResponse.status, healthResponse.data);
    } catch (err) {
      console.error('Health check error:', err.message);
      throw new Error('Could not connect to server health endpoints');
    }
    
    // Server is confirmed running, now test protected endpoints
    console.log('\nServer is running. Testing auth endpoints...');
    
    // Test socket availability endpoint
    console.log('Testing socket availability endpoint...');
    try {
      const socketResponse = await axios.get(`${API_BASE_URL}/socket-available`, {
        headers: { 'X-Skip-Auth': 'true' }
      });
      console.log('Socket check response:', socketResponse.status, socketResponse.data);
    } catch (err) {
      console.warn('Socket availability endpoint failed, trying health check next');
    }
    
    // Try authentication endpoints
    console.log('\nTesting auth endpoint availability (not actual login)...');
    try {
      // Just checking if endpoint exists, expect 401 for invalid credentials
      await axios.post(`${API_BASE_URL}/auth/login`, { username: 'test', password: 'test' });
    } catch (error) {
      if (error.response) {
        console.log('Auth endpoint responded with:', error.response.status);
        if (error.response.status === 401) {
          console.log('Auth endpoint is available (returned 401 as expected for invalid credentials)');
        } else {
          console.warn('Auth endpoint returned unexpected status:', error.response.status);
        }
      } else {
        console.error('Auth endpoint error:', error.message);
      }
    }
    
    console.log('\nConnectivity test completed.');
    console.log('API server appears to be available at:', API_BASE_URL);
    console.log('WebSocket server should be available at:', WS_URL);
    
  } catch (error) {
    console.error('\n====================================================');
    console.error('SERVER CONNECTIVITY TEST FAILED');
    console.error('Error:', error.message);
    if (error.stack) console.error(error.stack);
    console.error('====================================================\n');
    process.exit(1); // Exit with error code
  }
}

testServerConnectivity()
  .then(() => {
    console.log('====================================================');
    console.log('CONNECTIVITY TEST COMPLETED');
    console.log('====================================================');
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  }); 