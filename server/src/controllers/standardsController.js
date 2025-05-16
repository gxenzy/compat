/**
 * Standards Controller
 */
const Standard = require('../models/Standard');

/**
 * Get all standards
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllStandards = async (req, res) => {
  try {
    const standards = await Standard.getAll();
    res.status(200).json(standards);
  } catch (error) {
    console.error('Error fetching standards:', error);
    res.status(500).json({ error: 'Error fetching standards' });
  }
};

/**
 * Get a standard by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getStandardById = async (req, res) => {
  try {
    const { id } = req.params;
    const standard = await Standard.getById(id);
    
    if (!standard) {
      return res.status(404).json({ error: 'Standard not found' });
    }
    
    res.status(200).json(standard);
  } catch (error) {
    console.error('Error fetching standard:', error);
    res.status(500).json({ error: 'Error fetching standard' });
  }
};

/**
 * Get sections for a standard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSections = async (req, res) => {
  try {
    const { standardId } = req.params;
    const { parentId } = req.query;
    
    const sections = await Standard.getSections(standardId, parentId);
    res.status(200).json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ error: 'Error fetching sections' });
  }
};

/**
 * Get a section by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const section = await Standard.getSectionById(id);
    
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }
    
    res.status(200).json(section);
  } catch (error) {
    console.error('Error fetching section:', error);
    res.status(500).json({ error: 'Error fetching section' });
  }
};

/**
 * Search standards
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.searchStandards = async (req, res) => {
  try {
    const filters = req.query;
    const results = await Standard.searchSections(filters);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error searching standards:', error);
    res.status(500).json({ error: 'Error searching standards' });
  }
};

/**
 * Get all tags
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllTags = async (req, res) => {
  try {
    const tags = await Standard.getAllTags();
    res.status(200).json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Error fetching tags' });
  }
};

/**
 * Get sections by tag
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSectionsByTag = async (req, res) => {
  try {
    const { tagId } = req.params;
    const sections = await Standard.getSectionsByTag(tagId);
    res.status(200).json(sections);
  } catch (error) {
    console.error('Error fetching sections by tag:', error);
    res.status(500).json({ error: 'Error fetching sections' });
  }
};

/**
 * Get user bookmarks
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookmarks = await Standard.getUserBookmarks(userId);
    res.status(200).json(bookmarks);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ error: 'Error fetching bookmarks' });
  }
};

/**
 * Add a bookmark
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.addBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sectionId } = req.params;
    
    const bookmarkId = await Standard.addBookmark(userId, sectionId);
    
    if (bookmarkId === null) {
      return res.status(409).json({ message: 'Bookmark already exists' });
    }
    
    res.status(201).json({ id: bookmarkId });
  } catch (error) {
    console.error('Error adding bookmark:', error);
    res.status(500).json({ error: 'Error adding bookmark' });
  }
};

/**
 * Remove a bookmark
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.removeBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sectionId } = req.params;
    
    const success = await Standard.removeBookmark(userId, sectionId);
    
    if (!success) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
    
    res.status(200).json({ message: 'Bookmark removed' });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).json({ error: 'Error removing bookmark' });
  }
};

/**
 * Get section notes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSectionNotes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sectionId } = req.params;
    
    const notes = await Standard.getSectionNotes(userId, sectionId);
    res.status(200).json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Error fetching notes' });
  }
};

/**
 * Add a note
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.addNote = async (req, res) => {
  try {
    const userId = req.user.id;
    const { section_id, note_text } = req.body;
    
    if (!section_id || !note_text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const noteId = await Standard.addNote({
      user_id: userId,
      section_id,
      note_text
    });
    
    res.status(201).json({ id: noteId });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: 'Error adding note' });
  }
};

/**
 * Update a note
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateNote = async (req, res) => {
  try {
    const userId = req.user.id;
    const { noteId } = req.params;
    const { note_text } = req.body;
    
    if (!note_text) {
      return res.status(400).json({ error: 'Missing note text' });
    }
    
    const success = await Standard.updateNote(noteId, note_text, userId);
    
    if (!success) {
      return res.status(404).json({ error: 'Note not found or not owned by user' });
    }
    
    res.status(200).json({ message: 'Note updated' });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Error updating note' });
  }
};

/**
 * Delete a note
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteNote = async (req, res) => {
  try {
    const userId = req.user.id;
    const { noteId } = req.params;
    
    const success = await Standard.deleteNote(noteId, userId);
    
    if (!success) {
      return res.status(404).json({ error: 'Note not found or not owned by user' });
    }
    
    res.status(200).json({ message: 'Note deleted' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Error deleting note' });
  }
};

/**
 * Search sections
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.searchSections = async (req, res) => {
  try {
    const filters = req.query;
    const results = await Standard.searchSections(filters);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error searching sections:', error);
    res.status(500).json({ error: 'Error searching sections' });
  }
};

/**
 * Get resources
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getResources = async (req, res) => {
  try {
    const filters = req.query;
    const resources = await Standard.getResources(filters);
    res.status(200).json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Error fetching resources' });
  }
};

/**
 * Get section tags
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSectionTags = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const tags = await Standard.getSectionTags(sectionId);
    res.status(200).json(tags);
  } catch (error) {
    console.error('Error fetching section tags:', error);
    res.status(500).json({ error: 'Error fetching section tags' });
  }
};

/**
 * Create a standard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createStandard = async (req, res) => {
  try {
    const standardData = req.body;
    const standardId = await Standard.create(standardData);
    res.status(201).json({ id: standardId });
  } catch (error) {
    console.error('Error creating standard:', error);
    res.status(500).json({ error: 'Error creating standard' });
  }
};

/**
 * Create a section
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createSection = async (req, res) => {
  try {
    const { standardId } = req.params;
    const sectionData = {
      ...req.body,
      standard_id: standardId
    };
    
    const sectionId = await Standard.addSection(sectionData);
    res.status(201).json({ id: sectionId });
  } catch (error) {
    console.error('Error creating section:', error);
    res.status(500).json({ error: 'Error creating section' });
  }
};

/**
 * Add a table to a section
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.addTable = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const tableData = {
      ...req.body,
      section_id: sectionId
    };
    
    const tableId = await Standard.addTable(tableData);
    res.status(201).json({ id: tableId });
  } catch (error) {
    console.error('Error adding table:', error);
    res.status(500).json({ error: 'Error adding table' });
  }
};

/**
 * Add a figure to a section
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.addFigure = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const figureData = {
      ...req.body,
      section_id: sectionId
    };
    
    const figureId = await Standard.addFigure(figureData);
    res.status(201).json({ id: figureId });
  } catch (error) {
    console.error('Error adding figure:', error);
    res.status(500).json({ error: 'Error adding figure' });
  }
};

/**
 * Add a compliance requirement to a section
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.addComplianceRequirement = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const requirementData = {
      ...req.body,
      section_id: sectionId
    };
    
    const requirementId = await Standard.addComplianceRequirement(requirementData);
    res.status(201).json({ id: requirementId });
  } catch (error) {
    console.error('Error adding compliance requirement:', error);
    res.status(500).json({ error: 'Error adding compliance requirement' });
  }
};

/**
 * Add a resource to a section
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.addResource = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const resourceData = {
      ...req.body,
      section_id: sectionId
    };
    
    const resourceId = await Standard.addResource(resourceData);
    res.status(201).json({ id: resourceId });
  } catch (error) {
    console.error('Error adding resource:', error);
    res.status(500).json({ error: 'Error adding resource' });
  }
};

/**
 * Add a tag
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.addTag = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' });
    }
    
    const tagId = await Standard.addTag(name);
    res.status(201).json({ id: tagId });
  } catch (error) {
    console.error('Error adding tag:', error);
    res.status(500).json({ error: 'Error adding tag' });
  }
};

/**
 * Add a tag to a section
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.addSectionTag = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { tagId } = req.body;
    
    if (!tagId) {
      return res.status(400).json({ error: 'Tag ID is required' });
    }
    
    const result = await Standard.addSectionTag(sectionId, tagId);
    res.status(201).json({ success: true, id: result });
  } catch (error) {
    console.error('Error adding section tag:', error);
    res.status(500).json({ error: 'Error adding section tag' });
  }
};

/**
 * Remove a tag from a section
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.removeSectionTag = async (req, res) => {
  try {
    const { sectionId, tagId } = req.params;
    
    const success = await Standard.removeSectionTag(sectionId, tagId);
    
    if (!success) {
      return res.status(404).json({ error: 'Section tag not found' });
    }
    
    res.status(200).json({ message: 'Tag removed from section' });
  } catch (error) {
    console.error('Error removing section tag:', error);
    res.status(500).json({ error: 'Error removing section tag' });
  }
};

/**
 * Lookup illumination requirements
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.lookupIlluminationRequirements = async (req, res) => {
  try {
    const { buildingType, roomType } = req.query;
    
    // This is a placeholder - replace with actual implementation
    // that connects to the appropriate Standard model method
    res.status(200).json({
      message: 'Illumination requirements lookup not fully implemented',
      params: { buildingType, roomType }
    });
  } catch (error) {
    console.error('Error looking up illumination requirements:', error);
    res.status(500).json({ error: 'Error looking up illumination requirements' });
  }
};

/**
 * Get standard categories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getStandardCategories = async (req, res) => {
  try {
    const { type } = req.params;
    
    // This is a placeholder - replace with actual implementation
    // that connects to the appropriate Standard model method
    res.status(200).json({
      message: 'Standard categories lookup not fully implemented',
      type
    });
  } catch (error) {
    console.error('Error getting standard categories:', error);
    res.status(500).json({ error: 'Error getting standard categories' });
  }
};

/**
 * Get standard values
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getStandardValues = async (req, res) => {
  try {
    const { type, categoryId } = req.params;
    
    // This is a placeholder - replace with actual implementation
    // that connects to the appropriate Standard model method
    res.status(200).json({
      message: 'Standard values lookup not fully implemented',
      type,
      categoryId
    });
  } catch (error) {
    console.error('Error getting standard values:', error);
    res.status(500).json({ error: 'Error getting standard values' });
  }
};

module.exports = exports;
