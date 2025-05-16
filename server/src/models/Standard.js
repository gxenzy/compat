const { query } = require('../config/database');

/**
 * Standard class for managing standards, sections, and related entities
 */
class Standard {
  /**
   * Create a new standard
   * @param {Object} data Standard data
   * @returns {Promise<number>} Standard ID
   */
  static async create(data) {
    try {
      const { code_name, full_name, version, issuing_body, effective_date, description } = data;
      
      // Check if standard already exists
      const existingStandard = await query(
        `SELECT id FROM standards 
        WHERE code_name = ? AND version = ?`,
        [code_name, version]
      );
      
      if (existingStandard.length > 0) {
        return existingStandard[0].id;
      }
      
      // Insert new standard if it doesn't exist
      const result = await query(
        `INSERT INTO standards 
        (code_name, full_name, version, issuing_body, effective_date, description)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          code_name, 
          full_name, 
          version, 
          issuing_body, 
          effective_date || null, 
          description || null
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating standard:', error);
      throw error;
    }
  }
  
  /**
   * Get all standards
   * @returns {Promise<Array>} Array of standards
   */
  static async getAll() {
    try {
      const result = await query(
        `SELECT * FROM standards
        ORDER BY code_name ASC`
      );
      
      return result;
    } catch (error) {
      console.error('Error getting standards:', error);
      throw error;
    }
  }
  
  /**
   * Get a standard by ID
   * @param {number|string} id Standard ID
   * @returns {Promise<Object|null>} Standard data
   */
  static async getById(id) {
    try {
      const result = await query(
        `SELECT * FROM standards
        WHERE id = ?`,
        [id]
      );
      
      if (result.length === 0) {
        return null;
      }
      
      return result[0];
    } catch (error) {
      console.error('Error getting standard by ID:', error);
      throw error;
    }
  }
  
  /**
   * Add a section to a standard
   * @param {Object} data Section data
   * @returns {Promise<number>} Section ID
   */
  static async addSection(data) {
    try {
      const {
        standard_id,
        section_number,
        title,
        parent_section_id,
        content,
        has_tables,
        has_figures
      } = data;
      
      // Check if section already exists
      const existingSection = await query(
        `SELECT id FROM standard_sections 
        WHERE standard_id = ? AND section_number = ?`,
        [standard_id, section_number]
      );
      
      if (existingSection.length > 0) {
        return existingSection[0].id;
      }
      
      // Insert new section if it doesn't exist
      const result = await query(
        `INSERT INTO standard_sections
        (standard_id, section_number, title, parent_section_id, content, has_tables, has_figures)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          standard_id,
          section_number,
          title,
          parent_section_id || null,
          content || null,
          has_tables || false,
          has_figures || false
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error adding section:', error);
      throw error;
    }
  }
  
  /**
   * Get sections for a standard
   * @param {number|string} standardId Standard ID
   * @param {number|string} [parentId] Optional parent section ID for hierarchical retrieval
   * @returns {Promise<Array>} Array of sections
   */
  static async getSections(standardId, parentId) {
    try {
      let sql = `
        SELECT * FROM standard_sections
        WHERE standard_id = ?
      `;
      
      const params = [standardId];
      
      if (parentId !== undefined) {
        sql += ` AND parent_section_id = ?`;
        params.push(parentId);
      } else {
        sql += ` AND (parent_section_id IS NULL OR parent_section_id = 0)`;
      }
      
      sql += ` ORDER BY section_number ASC`;
      
      const result = await query(sql, params);
      return result;
    } catch (error) {
      console.error('Error getting sections:', error);
      throw error;
    }
  }
  
  /**
   * Get a section by ID
   * @param {number|string} id Section ID
   * @returns {Promise<Object|null>} Section data with tables and figures
   */
  static async getSectionById(id) {
    try {
      // Get section
      const sectionResult = await query(
        `SELECT * FROM standard_sections
        WHERE id = ?`,
        [id]
      );
      
      if (sectionResult.length === 0) {
        return null;
      }
      
      const section = sectionResult[0];
      
      // Get tables if any
      let tables = [];
      if (section.has_tables) {
        tables = await query(
          `SELECT * FROM standard_tables
          WHERE section_id = ?
          ORDER BY table_number ASC`,
          [id]
        );
      }
      
      // Get figures if any
      let figures = [];
      if (section.has_figures) {
        figures = await query(
          `SELECT * FROM standard_figures
          WHERE section_id = ?
          ORDER BY figure_number ASC`,
          [id]
        );
      }
      
      // Get compliance requirements
      const requirements = await query(
        `SELECT * FROM compliance_requirements
        WHERE section_id = ?`,
        [id]
      );
      
      // Get educational resources
      const resources = await query(
        `SELECT * FROM educational_resources
        WHERE section_id = ?`,
        [id]
      );
      
      return {
        ...section,
        tables,
        figures,
        compliance_requirements: requirements,
        educational_resources: resources
      };
    } catch (error) {
      console.error('Error getting section by ID:', error);
      throw error;
    }
  }
  
  /**
   * Search for sections by keyword
   * @param {Object} filters Search filters
   * @returns {Promise<Array>} Search results
   */
  static async searchSections(filters) {
    try {
      let sql;
      const params = [];
      const conditions = [];
      
      // Base query depends on whether we're doing a keyword search or normal search
      if (filters.query && filters.useKeywords) {
        // Search using keywords for better relevance
        sql = `
          SELECT s.*, st.code_name, st.full_name,
          SUM(sk.weight * k.weight) as relevance_score
          FROM standard_sections s
          JOIN standards st ON s.standard_id = st.id
          LEFT JOIN section_keywords sk ON s.id = sk.section_id
          LEFT JOIN standard_keywords k ON sk.keyword_id = k.id
        `;
        
        // Match keywords or use LIKE for direct matches
        conditions.push(`(
          k.keyword LIKE ? OR
          (${this.buildFieldConditions(filters)})
        )`);
        
        params.push(`%${filters.query}%`);
        
        // Add parameters for the field conditions
        if (filters.fields && filters.fields.includes('title')) {
          params.push(filters.exactMatch ? filters.query : `%${filters.query}%`);
        }
        if (filters.fields && filters.fields.includes('content')) {
          params.push(filters.exactMatch ? `% ${filters.query} %` : `%${filters.query}%`);
        }
        if (filters.fields && filters.fields.includes('section_number')) {
          params.push(filters.exactMatch ? filters.query : `%${filters.query}%`);
        }
      } else {
        // Regular search without using keywords
        sql = `
          SELECT s.*, st.code_name, st.full_name
          FROM standard_sections s
          JOIN standards st ON s.standard_id = st.id
        `;
        
        // Build normal search conditions
        if (filters.query) {
          // Build search condition based on selected fields
          conditions.push(`(${this.buildFieldConditions(filters)})`);
          
          // Add parameters for the field conditions
          if (filters.fields && filters.fields.includes('title')) {
            params.push(filters.exactMatch ? filters.query : `%${filters.query}%`);
          }
          if (filters.fields && filters.fields.includes('content')) {
            params.push(filters.exactMatch ? `% ${filters.query} %` : `%${filters.query}%`);
          }
          if (filters.fields && filters.fields.includes('section_number')) {
            params.push(filters.exactMatch ? filters.query : `%${filters.query}%`);
          }
        }
      }
      
      // Add standard filter if specified
      if (filters.standard_id) {
        conditions.push(`s.standard_id = ?`);
        params.push(filters.standard_id);
      }
      
      // Add section number filter if specified
      if (filters.section_number) {
        conditions.push(`s.section_number LIKE ?`);
        params.push(`%${filters.section_number}%`);
      }
      
      // Add tags filter if specified
      if (filters.tags && filters.tags.length > 0) {
        const tagPlaceholders = filters.tags.map(() => '?').join(',');
        conditions.push(`
          EXISTS (
            SELECT 1 FROM section_tags st 
            JOIN standard_tags t ON st.tag_id = t.id
            WHERE st.section_id = s.id AND t.name IN (${tagPlaceholders})
          )
        `);
        params.push(...filters.tags);
      }
      
      // Combine all conditions
      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      // Group by and order by relevance for keyword search, otherwise by standard and section
      if (filters.query && filters.useKeywords) {
        sql += ` GROUP BY s.id ORDER BY relevance_score DESC, st.code_name ASC, s.section_number ASC`;
      } else {
        sql += ` ORDER BY st.code_name ASC, s.section_number ASC`;
      }
      
      const result = await query(sql, params);
      return result;
    } catch (error) {
      console.error('Error searching sections:', error);
      throw error;
    }
  }
  
  // Helper method to build field conditions
  static buildFieldConditions(filters) {
    const fieldConditions = [];
    const fields = filters.fields || ['title', 'content', 'section_number'];
    
    if (fields.includes('title')) {
      if (filters.exactMatch) {
        fieldConditions.push(`s.title = ?`);
      } else {
        fieldConditions.push(`s.title LIKE ?`);
      }
    }
    
    if (fields.includes('content')) {
      if (filters.exactMatch) {
        fieldConditions.push(`s.content LIKE ?`);
      } else {
        fieldConditions.push(`s.content LIKE ?`);
      }
    }
    
    if (fields.includes('section_number')) {
      if (filters.exactMatch) {
        fieldConditions.push(`s.section_number = ?`);
      } else {
        fieldConditions.push(`s.section_number LIKE ?`);
      }
    }
    
    return fieldConditions.join(' OR ');
  }
  
  /**
   * Add a compliance requirement
   * @param {Object} data Requirement data
   * @returns {Promise<number>} Requirement ID
   */
  static async addComplianceRequirement(data) {
    try {
      const {
        section_id,
        requirement_type,
        description,
        verification_method,
        severity
      } = data;
      
      // Check if a similar requirement already exists
      const existingRequirement = await query(
        `SELECT id FROM compliance_requirements 
        WHERE section_id = ? AND requirement_type = ? AND SUBSTRING(description, 1, 255) = SUBSTRING(?, 1, 255)`,
        [section_id, requirement_type, description]
      );
      
      if (existingRequirement.length > 0) {
        return existingRequirement[0].id;
      }
      
      // Insert new requirement if it doesn't exist
      const result = await query(
        `INSERT INTO compliance_requirements
        (section_id, requirement_type, description, verification_method, severity)
        VALUES (?, ?, ?, ?, ?)`,
        [
          section_id,
          requirement_type,
          description,
          verification_method || null,
          severity
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error adding compliance requirement:', error);
      throw error;
    }
  }
  
  /**
   * Get educational resources
   * @param {Object} [filters={}] Filters for resources
   * @returns {Promise<Array>} Array of resources
   */
  static async getResources(filters = {}) {
    try {
      let sql = `
        SELECT er.*, ss.section_number, ss.title as section_title, st.code_name
        FROM educational_resources er
        JOIN standard_sections ss ON er.section_id = ss.id
        JOIN standards st ON ss.standard_id = st.id
      `;
      
      const conditions = [];
      const params = [];
      
      if (filters.section_id) {
        conditions.push(`er.section_id = ?`);
        params.push(filters.section_id);
      }
      
      if (filters.resource_type) {
        conditions.push(`er.resource_type = ?`);
        params.push(filters.resource_type);
      }
      
      if (filters.difficulty) {
        conditions.push(`er.difficulty = ?`);
        params.push(filters.difficulty);
      }
      
      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      sql += ` ORDER BY er.created_at DESC`;
      
      const result = await query(sql, params);
      return result;
    } catch (error) {
      console.error('Error getting resources:', error);
      throw error;
    }
  }
  
  /**
   * Add a table to a section
   * @param {Object} data Table data
   * @returns {Promise<number>} Table ID
   */
  static async addTable(data) {
    try {
      const { section_id, table_number, title, content, notes } = data;
      
      // Check if table already exists
      const existingTable = await query(
        `SELECT id FROM standard_tables 
        WHERE section_id = ? AND table_number = ?`,
        [section_id, table_number]
      );
      
      if (existingTable.length > 0) {
        return existingTable[0].id;
      }
      
      // Insert new table if it doesn't exist
      const result = await query(
        `INSERT INTO standard_tables
        (section_id, table_number, title, content, notes)
        VALUES (?, ?, ?, ?, ?)`,
        [
          section_id,
          table_number,
          title,
          JSON.stringify(content),
          notes || null
        ]
      );
      
      // Update the section to indicate it has tables
      await query(
        `UPDATE standard_sections SET has_tables = true WHERE id = ?`,
        [section_id]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error adding table:', error);
      throw error;
    }
  }
  
  /**
   * Add a figure to a section
   * @param {Object} data Figure data
   * @returns {Promise<number>} Figure ID
   */
  static async addFigure(data) {
    try {
      const { section_id, figure_number, title, image_path, caption } = data;
      
      // Check if figure already exists
      const existingFigure = await query(
        `SELECT id FROM standard_figures 
        WHERE section_id = ? AND figure_number = ?`,
        [section_id, figure_number]
      );
      
      if (existingFigure.length > 0) {
        return existingFigure[0].id;
      }
      
      // Insert new figure if it doesn't exist
      const result = await query(
        `INSERT INTO standard_figures
        (section_id, figure_number, title, image_path, caption)
        VALUES (?, ?, ?, ?, ?)`,
        [
          section_id,
          figure_number,
          title,
          image_path,
          caption || null
        ]
      );
      
      // Update the section to indicate it has figures
      await query(
        `UPDATE standard_sections SET has_figures = true WHERE id = ?`,
        [section_id]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error adding figure:', error);
      throw error;
    }
  }
  
  /**
   * Add an educational resource
   * @param {Object} data Resource data
   * @returns {Promise<number>} Resource ID
   */
  static async addResource(data) {
    try {
      const {
        section_id,
        resource_type,
        title,
        description,
        url,
        difficulty,
        duration,
        tags
      } = data;
      
      // Check if a similar resource already exists
      const existingResource = await query(
        `SELECT id FROM educational_resources 
        WHERE section_id = ? AND resource_type = ? AND title = ? AND url = ?`,
        [section_id, resource_type, title, url]
      );
      
      if (existingResource.length > 0) {
        return existingResource[0].id;
      }
      
      // Insert new resource if it doesn't exist
      const result = await query(
        `INSERT INTO educational_resources
        (section_id, resource_type, title, description, url, difficulty, duration, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          section_id,
          resource_type,
          title,
          description || null,
          url,
          difficulty || 'intermediate',
          duration || null,
          tags || null
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error adding educational resource:', error);
      throw error;
    }
  }
  
  /**
   * Add a bookmark for a user
   * @param {number} userId User ID
   * @param {number} sectionId Section ID
   * @returns {Promise<number|null>} Bookmark ID or null if already exists
   */
  static async addBookmark(userId, sectionId) {
    try {
      // Check if bookmark already exists
      const existingBookmark = await query(
        `SELECT id FROM standard_bookmarks
        WHERE user_id = ? AND section_id = ?`,
        [userId, sectionId]
      );
      
      if (existingBookmark.length > 0) {
        return null; // Bookmark already exists
      }
      
      const result = await query(
        `INSERT INTO standard_bookmarks
        (user_id, section_id)
        VALUES (?, ?)`,
        [userId, sectionId]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  }
  
  /**
   * Remove a bookmark for a user
   * @param {number} userId User ID
   * @param {number} sectionId Section ID
   * @returns {Promise<boolean>} Success boolean
   */
  static async removeBookmark(userId, sectionId) {
    try {
      const result = await query(
        `DELETE FROM standard_bookmarks
        WHERE user_id = ? AND section_id = ?`,
        [userId, sectionId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error removing bookmark:', error);
      throw error;
    }
  }
  
  /**
   * Get all bookmarks for a user
   * @param {number} userId User ID
   * @returns {Promise<Array>} Array of bookmarked sections
   */
  static async getUserBookmarks(userId) {
    try {
      const result = await query(
        `SELECT b.id, b.section_id, b.created_at, 
        s.section_number, s.title, s.standard_id,
        st.code_name, st.full_name
        FROM standard_bookmarks b
        JOIN standard_sections s ON b.section_id = s.id
        JOIN standards st ON s.standard_id = st.id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC`,
        [userId]
      );
      
      return result;
    } catch (error) {
      console.error('Error getting user bookmarks:', error);
      throw error;
    }
  }
  
  /**
   * Add a note for a user on a section
   * @param {Object} data Note data
   * @returns {Promise<number>} Note ID
   */
  static async addNote(data) {
    try {
      const { user_id, section_id, note_text } = data;
      
      // Check if a similar note already exists
      const existingNote = await query(
        `SELECT id FROM standard_notes 
        WHERE user_id = ? AND section_id = ? AND SUBSTRING(note_text, 1, 255) = SUBSTRING(?, 1, 255)`,
        [user_id, section_id, note_text]
      );
      
      if (existingNote.length > 0) {
        return existingNote[0].id;
      }
      
      // Insert new note if it doesn't exist
      const result = await query(
        `INSERT INTO standard_notes
        (user_id, section_id, note_text)
        VALUES (?, ?, ?)`,
        [user_id, section_id, note_text]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  }
  
  /**
   * Update a user's note
   * @param {number} noteId Note ID
   * @param {string} noteText New note text
   * @param {number} [userId] User ID (for security)
   * @returns {Promise<boolean>} Success boolean
   */
  static async updateNote(noteId, noteText, userId) {
    try {
      let sql = `UPDATE standard_notes
        SET note_text = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`;
      
      const params = [noteText, noteId];
      
      if (userId) {
        sql += ` AND user_id = ?`;
        params.push(userId);
      }
      
      const result = await query(sql, params);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }
  
  /**
   * Delete a user's note
   * @param {number} noteId Note ID
   * @param {number} [userId] User ID (for security)
   * @returns {Promise<boolean>} Success boolean
   */
  static async deleteNote(noteId, userId) {
    try {
      let sql = `DELETE FROM standard_notes WHERE id = ?`;
      const params = [noteId];
      
      if (userId) {
        sql += ` AND user_id = ?`;
        params.push(userId);
      }
      
      const result = await query(sql, params);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }
  
  /**
   * Get all notes for a user on a section
   * @param {number} userId User ID
   * @param {number} sectionId Section ID
   * @returns {Promise<Array>} Array of notes
   */
  static async getSectionNotes(userId, sectionId) {
    try {
      const result = await query(
        `SELECT * FROM standard_notes
        WHERE user_id = ? AND section_id = ?
        ORDER BY created_at DESC`,
        [userId, sectionId]
      );
      
      return result;
    } catch (error) {
      console.error('Error getting section notes:', error);
      throw error;
    }
  }
  
  /**
   * Add a keyword or update its weight
   * @param {string} keyword Keyword text
   * @param {number} [weight=1] Optional weight value
   * @returns {Promise<number>} Keyword ID
   */
  static async addKeyword(keyword, weight = 1) {
    try {
      // Check if keyword exists
      const existingKeyword = await query(
        `SELECT id FROM standard_keywords
        WHERE keyword = ?`,
        [keyword]
      );
      
      if (existingKeyword.length > 0) {
        // Update weight if it exists
        if (weight !== 1) {
          await query(
            `UPDATE standard_keywords
            SET weight = ?
            WHERE keyword = ?`,
            [weight, keyword]
          );
        }
        return existingKeyword[0].id;
      }
      
      // Insert new keyword
      const result = await query(
        `INSERT INTO standard_keywords
        (keyword, weight)
        VALUES (?, ?)`,
        [keyword, weight]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error adding keyword:', error);
      throw error;
    }
  }
  
  /**
   * Associate a keyword with a section
   * @param {number} sectionId Section ID
   * @param {number} keywordId Keyword ID
   * @returns {Promise<boolean>} Success boolean
   */
  static async addSectionKeyword(sectionId, keywordId) {
    try {
      await query(
        `INSERT IGNORE INTO section_keywords
        (section_id, keyword_id)
        VALUES (?, ?)`,
        [sectionId, keywordId]
      );
      
      return true;
    } catch (error) {
      console.error('Error adding section keyword:', error);
      throw error;
    }
  }
  
  /**
   * Add a tag or get existing tag ID
   * @param {string} tagName Tag name
   * @returns {Promise<number>} Tag ID
   */
  static async addTag(tagName) {
    try {
      // Check if tag exists
      const existingTag = await query(
        `SELECT id FROM standard_tags
        WHERE name = ?`,
        [tagName]
      );
      
      if (existingTag.length > 0) {
        return existingTag[0].id;
      }
      
      // Insert new tag
      const result = await query(
        `INSERT INTO standard_tags
        (name, created_at)
        VALUES (?, NOW())`,
        [tagName]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error adding tag:', error);
      throw error;
    }
  }
  
  /**
   * Associate a tag with a section
   * @param {number} sectionId Section ID
   * @param {number} tagId Tag ID
   * @returns {Promise<boolean>} Success flag
   */
  static async addSectionTag(sectionId, tagId) {
    try {
      // Check if association already exists
      const existingAssociation = await query(
        `SELECT 1 FROM section_tags
        WHERE section_id = ? AND tag_id = ?`,
        [sectionId, tagId]
      );
      
      if (existingAssociation.length > 0) {
        return true; // Already exists
      }
      
      // Create association
      await query(
        `INSERT INTO section_tags
        (section_id, tag_id, created_at)
        VALUES (?, ?, NOW())`,
        [sectionId, tagId]
      );
      
      return true;
    } catch (error) {
      console.error('Error adding section tag:', error);
      throw error;
    }
  }
  
  /**
   * Remove a tag from a section
   * @param {number} sectionId Section ID
   * @param {number} tagId Tag ID
   * @returns {Promise<boolean>} Success flag
   */
  static async removeSectionTag(sectionId, tagId) {
    try {
      const result = await query(
        `DELETE FROM section_tags
        WHERE section_id = ? AND tag_id = ?`,
        [sectionId, tagId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error removing section tag:', error);
      throw error;
    }
  }
  
  /**
   * Get all tags for a section
   * @param {number} sectionId Section ID
   * @returns {Promise<Array>} Array of tags
   */
  static async getSectionTags(sectionId) {
    try {
      const result = await query(
        `SELECT t.id, t.name, t.created_at
        FROM section_tags st
        JOIN standard_tags t ON st.tag_id = t.id
        WHERE st.section_id = ?
        ORDER BY t.name ASC`,
        [sectionId]
      );
      
      return result;
    } catch (error) {
      console.error('Error getting section tags:', error);
      throw error;
    }
  }
  
  /**
   * Get all available tags
   * @returns {Promise<Array>} Array of tags
   */
  static async getAllTags() {
    try {
      const result = await query(
        `SELECT id, name, created_at
        FROM standard_tags
        ORDER BY name ASC`
      );
      
      return result;
    } catch (error) {
      console.error('Error getting all tags:', error);
      throw error;
    }
  }
  
  /**
   * Get sections by tag
   * @param {number|string} tagId Tag ID
   * @returns {Promise<Array>} Array of sections
   */
  static async getSectionsByTag(tagId) {
    try {
      const result = await query(
        `SELECT s.*, st.code_name, st.full_name
        FROM standard_sections s
        JOIN standards st ON s.standard_id = st.id
        JOIN section_tags stg ON s.id = stg.section_id
        WHERE stg.tag_id = ?
        ORDER BY st.code_name ASC, s.section_number ASC`,
        [tagId]
      );
      
      return result;
    } catch (error) {
      console.error('Error getting sections by tag:', error);
      throw error;
    }
  }
}

module.exports = Standard; 