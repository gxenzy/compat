const express = require('express');
const router = express.Router();
const { query } = require('../src/config/database');

// GET /api/standards
router.get('/', async (req, res) => {
  try {
    const standards = await query(`
      SELECT * FROM standards
    `);
    res.json(standards);
  } catch (error) {
    console.error('Error fetching standards:', error);
    res.status(500).json({ message: 'Failed to retrieve standards', error: error.message });
  }
});

// GET /api/standards/sections
router.get('/sections', async (req, res) => {
  try {
    const sections = await query(`
      SELECT * FROM standard_sections
    `);
    res.json(sections);
  } catch (error) {
    console.error('Error fetching standard sections:', error);
    res.status(500).json({ message: 'Failed to retrieve standard sections', error: error.message });
  }
});

// GET /api/standards/:id
router.get('/:id', async (req, res) => {
  try {
    const standard = await query(`
      SELECT * FROM standards WHERE id = ?
    `, [req.params.id]);
    
    if (standard.length === 0) {
      return res.status(404).json({ message: 'Standard not found' });
    }
    
    res.json(standard[0]);
  } catch (error) {
    console.error('Error fetching standard:', error);
    res.status(500).json({ message: 'Failed to retrieve standard', error: error.message });
  }
});

module.exports = router; 