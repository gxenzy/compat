import standardsService from './StandardsService';
import pecStandardsService from './pecStandardsService';

/**
 * Enhanced Standards Service that combines the original standards service 
 * with PEC standards from the database
 */
class EnhancedStandardsService {
  constructor() {
    this.standardsService = standardsService;
    this.pecStandardsService = pecStandardsService;
    this.standardsCache = null;
  }

  /**
   * Get all standards from both services
   * @returns {Promise<Array>} Combined list of standards
   */
  async getStandards() {
    if (this.standardsCache) {
      return this.standardsCache;
    }

    try {
      // Get standards from both services
      const [standardsServiceData, pecServiceData] = await Promise.all([
        this.standardsService.getStandards(),
        this.pecStandardsService.getFormattedStandards()
      ]);

      // Combine the results
      const combinedStandards = [...standardsServiceData, ...pecServiceData];
      this.standardsCache = combinedStandards;
      
      return combinedStandards;
    } catch (error) {
      console.error('Error combining standards:', error);
      return [];
    }
  }

  /**
   * Get a standard by ID - delegates to appropriate service
   * @param {string} id - Standard ID
   * @returns {Promise<Object>} The standard
   */
  async getStandardById(id) {
    // Check if this is a PEC standard
    if (id === 'pec-2017') {
      const pecStandards = await this.pecStandardsService.getFormattedStandards();
      return pecStandards[0];
    }
    
    // Otherwise, delegate to original service
    return await this.standardsService.getStandardById(id);
  }

  /**
   * Get sections for a standard - delegates to appropriate service
   * @param {string} standardId - Standard ID
   * @param {string} parentId - Optional parent section ID
   * @returns {Promise<Array>} List of sections
   */
  async getSections(standardId, parentId) {
    // Check if this is a PEC standard
    if (standardId === 'pec-2017') {
      return await this.pecStandardsService.getSections(standardId, parentId);
    }
    
    // Otherwise, delegate to original service
    return await this.standardsService.getSections(standardId, parentId);
  }

  /**
   * Get section by ID - delegates to appropriate service
   * @param {string} id - Section ID
   * @returns {Promise<Object>} The section
   */
  async getSectionById(id) {
    // Check if this is a PEC section
    if (id.startsWith('pec-')) {
      return await this.pecStandardsService.getSectionById(id);
    }
    
    // Otherwise, delegate to original service
    return await this.standardsService.getSectionById(id);
  }

  /**
   * Search sections across both services
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  async searchSections(query, options = {}) {
    // For now, only use the original service for search
    // Later this could be enhanced to search PEC standards too
    return await this.standardsService.searchSections(query, options);
  }

  /**
   * Delegate other methods to the original service
   */
  async getSectionTags(sectionId) {
    return await this.standardsService.getSectionTags(sectionId);
  }

  async getAllTags() {
    return await this.standardsService.getAllTags();
  }

  async addSectionTag(sectionId, tagName) {
    return await this.standardsService.addSectionTag(sectionId, tagName);
  }

  async removeSectionTag(sectionId, tagId) {
    return await this.standardsService.removeSectionTag(sectionId, tagId);
  }

  async getSearchSuggestions(query) {
    return await this.standardsService.getSearchSuggestions(query);
  }

  async getRecentSearchTerms() {
    return await this.standardsService.getRecentSearchTerms();
  }

  async getIlluminationRequirement(roomType) {
    return await this.standardsService.getIlluminationRequirement(roomType);
  }

  // Bookmark methods
  async saveBookmark(sectionId) {
    return await this.standardsService.saveBookmark(sectionId);
  }

  async getBookmarks() {
    return await this.standardsService.getBookmarks();
  }

  async deleteBookmark(bookmarkId) {
    return await this.standardsService.deleteBookmark(bookmarkId);
  }
}

// Export a singleton instance
const enhancedStandardsService = new EnhancedStandardsService();
export default enhancedStandardsService; 