// Simple test script to check if the API server is running
const http = require('http');

// Try to connect to the API server
const options = {
  hostname: 'localhost',
  port: 8000,
  path: '/api/health-check',
  method: 'GET'
};

console.log('Testing API server connectivity...');

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  if (res.statusCode === 200) {
    console.log('✅ API server is running and responding!');
  } else {
    console.log('⚠️ API server returned a non-200 status code');
  }
  
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error('⛔ ERROR: API server connection failed');
  console.error(`Error message: ${e.message}`);
  console.error('The server may not be running or there could be a network issue.');
});

req.end(); 