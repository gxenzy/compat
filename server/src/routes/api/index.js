const express = require('express');
const router = express.Router();

// Import route modules
const userRoutes = require('./userRoutes');
const projectRoutes = require('./projectRoutes');
const calculationRoutes = require('./calculationRoutes');
const complianceRoutes = require('./complianceRoutes');

// Register route modules
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/calculations', calculationRoutes);
router.use('/compliance', complianceRoutes);

module.exports = router; 