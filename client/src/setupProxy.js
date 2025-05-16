const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Log proxy initialization 
  console.log('Setting up development proxy to http://localhost:8000');
  
  // Create the proxy middleware with more detailed options
  const apiProxy = createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true, // Changes the origin of the host header to the target URL
    secure: false, // Don't verify SSL certificates
    logLevel: 'debug', // More detailed logging for troubleshooting
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[PROXY] ${req.method} ${req.url} => ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
      console.error('[PROXY ERROR]', err);
      res.writeHead(500, {
        'Content-Type': 'text/plain',
      });
      res.end('Proxy Error: Could not connect to the API server. See console for details.');
    },
    // Additional configuration for handling streaming responses
    onProxyReq: (proxyReq, req, res) => {
      // Get the token from localStorage if available 
      // (browser localStorage not available in Node.js)
      const token = req.headers.authorization;
      if (token) {
        proxyReq.setHeader('Authorization', token);
      }
      
      if (req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    }
  });
  
  // Apply the proxy middleware to all /api routes
  app.use('/api', apiProxy);
  
  // Add additional routes for direct backend access
  app.use('/auth', apiProxy);
  app.use('/login', apiProxy);
  app.use('/standards', apiProxy);
  app.use('/standards-api', apiProxy);
  app.use('/users', apiProxy);
  app.use('/compliance', apiProxy);
  app.use('/energy-audit', apiProxy);
}; 