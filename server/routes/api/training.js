/**
 * Model training API routes
 * Placeholder implementation to prevent missing module errors
 */
const express = require('express');
const router = express.Router();

// GET /api/training/status
router.get('/status', (req, res) => {
  res.json({
    status: 'available',
    models: ['room-detection'],
    message: 'Training API is available'
  });
});

// POST /api/training/start
router.post('/start', (req, res) => {
  res.json({
    status: 'not_implemented',
    message: 'Training functionality is not yet implemented'
  });
});

module.exports = router;
// For TypeScript compatibility
module.exports.default = router; 