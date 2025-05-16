/**
 * Simple Server Ping
 * 
 * This script checks if the server is accepting connections on port 8000
 * without any HTTP request complexity
 */
const net = require('net');

const serverHost = 'localhost';
const serverPort = 8000;

console.log(`Testing connection to ${serverHost}:${serverPort}...`);

const socket = new net.Socket();
let connected = false;

socket.setTimeout(2000);  // 2 second timeout

socket.on('connect', () => {
  connected = true;
  console.log(`Successfully connected to ${serverHost}:${serverPort}`);
  console.log('Server is running and accepting TCP connections.');
  socket.end();
});

socket.on('timeout', () => {
  console.error('Connection attempt timed out');
  socket.destroy();
});

socket.on('error', (err) => {
  console.error(`Connection error: ${err.message}`);
  if (err.code === 'ECONNREFUSED') {
    console.error(`\nServer on ${serverHost}:${serverPort} is not running or refusing connections.`);
    console.error('Please make sure the server is started.');
  }
});

socket.on('close', () => {
  if (!connected) {
    console.error('Could not connect to the server.');
    process.exit(1);
  } else {
    console.log('Connection test completed successfully.');
    process.exit(0);
  }
});

socket.connect(serverPort, serverHost); 