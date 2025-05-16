/**
 * Standards routes with import functions
 */
const express = require('express');
const router = express.Router();
const standardsController = require('../controllers/standardsController');
const standardsImportController = require('../controllers/standardsImportController');
const auth = require('../middleware/auth');

// Standard routes
router.get('/', standardsController.getAllStandards);
router.get('/:id', standardsController.getStandardById);
router.get('/:standardId/sections', standardsController.getSections);
router.get('/sections/:id', standardsController.getSectionById);
router.get('/search', standardsController.searchStandards);

// Tag routes
router.get('/tags/all', standardsController.getAllTags);
router.get('/tags/:tagId/sections', standardsController.getSectionsByTag);

// Routes that require authentication
router.use(auth);

// Bookmarks and notes (authenticated)
router.get('/bookmarks', standardsController.getUserBookmarks);
router.post('/bookmarks/:sectionId', standardsController.addBookmark);
router.delete('/bookmarks/:sectionId', standardsController.removeBookmark);
router.get('/sections/:sectionId/notes', standardsController.getSectionNotes);
router.post('/notes', standardsController.addNote);
router.put('/notes/:noteId', standardsController.updateNote);
router.delete('/notes/:noteId', standardsController.deleteNote);

// Admin-only routes for importing standards 
router.use(auth.isAdmin);
router.post('/import/verify', standardsImportController.verifyStandardImport);
router.post('/import', standardsImportController.importStandard);
router.post('/import/multiple', standardsImportController.importMultipleStandards);

module.exports = router;
