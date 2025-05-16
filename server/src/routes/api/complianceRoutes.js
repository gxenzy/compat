const express = require('express');
const router = express.Router();
const complianceController = require('../../controllers/complianceController');
const authMiddleware = require('../../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Building type standards routes
router.get('/building-standards/all', complianceController.getAllBuildingTypeStandards);
router.get('/building-standards', complianceController.getBuildingTypeStandards);
router.post('/building-standards', complianceController.createBuildingTypeStandard);
router.put('/building-standards/:id', complianceController.updateBuildingTypeStandard);
router.delete('/building-standards/:id', complianceController.deleteBuildingTypeStandard);

// Project type standards routes
router.get('/project-standards/all', complianceController.getAllProjectTypeStandards);
router.get('/project-standards', complianceController.getProjectTypeStandards);
router.post('/project-standards', complianceController.createProjectTypeStandard);
router.put('/project-standards/:id', complianceController.updateProjectTypeStandard);
router.delete('/project-standards/:id', complianceController.deleteProjectTypeStandard);

// Compliance recommendations routes
router.get('/recommendations/all', complianceController.getAllComplianceRecommendations);
router.get('/recommendations', complianceController.getComplianceRecommendations);
router.post('/recommendations', complianceController.createComplianceRecommendation);
router.put('/recommendations/:id', complianceController.updateComplianceRecommendation);
router.delete('/recommendations/:id', complianceController.deleteComplianceRecommendation);

module.exports = router; 