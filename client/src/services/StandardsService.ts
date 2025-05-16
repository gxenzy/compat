import axios from 'axios';
import { apiConfig } from '../config/database';
import api from './api';

// API URL for fallback
const BACKEND_URL = 'http://localhost:8000/api';

// Track API failures to prevent repeated requests to failing endpoints
const failedEndpoints = new Set<string>();
const FAILURE_TIMEOUT = 60000; // 1 minute timeout before retrying failed endpoints

// Helper functions
const isEndpointFailing = (endpoint: string): boolean => {
  return failedEndpoints.has(endpoint);
};

const markEndpointAsFailing = (endpoint: string): void => {
  failedEndpoints.add(endpoint);
  
  // Automatically remove from failed list after timeout
  setTimeout(() => {
    failedEndpoints.delete(endpoint);
  }, FAILURE_TIMEOUT);
};

interface IlluminationRequirement {
  roomType: string;
  requiredIlluminance: number;
  notes: string;
  tableNumber: string;
  tableTitle: string;
  standard: string;
  standardFullName: string;
}

interface Standard {
  id: string;
  code_name: string;
  full_name: string;
  version: string;
  issuing_body: string;
  description?: string;
  publication_date?: string;
  effective_date?: string;
}

interface Section {
  id: string;
  standard_id: string;
  section_number: string;
  title: string;
  content: string;
  parent_section_id: string | null;
  has_tables: boolean;
  has_figures: boolean;
  tables?: TableData[];
  figures?: FigureData[];
  compliance_requirements?: RequirementData[];
  educational_resources?: ResourceData[];
}

interface TableData {
  id: string;
  table_number: string;
  title: string;
  content: any;
  notes?: string;
}

interface FigureData {
  id: string;
  figure_number: string;
  title: string;
  image_path: string;
  caption?: string;
}

interface RequirementData {
  id: string;
  requirement_type: 'mandatory' | 'prescriptive' | 'performance';
  description: string;
  verification_method?: string;
  severity: 'critical' | 'major' | 'minor';
}

interface ResourceData {
  id: string;
  resource_type: 'video' | 'article' | 'case_study' | 'guide';
  title: string;
  description?: string;
  url?: string;
  file_path?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duration?: string;
}

interface SearchResult {
  id: string;
  standard_id: string;
  section_number: string;
  title: string;
  content: string;
  code_name: string;
  full_name: string;
  relevance?: number;
}

interface SearchOptions {
  standardId?: string;
  exactMatch?: boolean;
  fields?: string[];
  page?: number;
  limit?: number;
  sort?: 'relevance' | 'title' | 'section_number' | 'standard';
  sortDirection?: 'asc' | 'desc';
  relevanceThreshold?: number;
  tags?: string[];
}

interface Tag {
  id: string;
  name: string;
  created_at?: string;
}

/**
 * Service for interacting with the Standards Reference System
 */
class StandardsService {
  // Storage for cache in memory
  private standardsCache: Standard[] | null = null;
  private sectionsCache: { [key: string]: Section[] } = {};
  private lastSuccessfulEndpoints: { [key: string]: string } = {};
  private apiFailureCount: number = 0;
  private maxFailureCount: number = 5; // Maximum number of failures before temporary disabling
  private apiDisabled: boolean = false;
  private apiDisabledTimeout: ReturnType<typeof setTimeout> | null = null;
  
  /**
   * Create empty initial cache for standards
   */
  constructor() {
    // Create empty caches
    this.standardsCache = null;
    this.sectionsCache = {};
    this.lastSuccessfulEndpoints = {};
  }
  
  /**
   * Check if API service is temporarily disabled due to repeated failures
   */
  private isApiDisabled(): boolean {
    return this.apiDisabled;
  }
  
  /**
   * Temporarily disable API for a period to prevent console spam
   */
  private disableApi(): void {
    if (this.apiDisabled) return;
    
    console.warn('Standards API temporarily disabled due to repeated failures');
    this.apiDisabled = true;
    
    // Clear any existing timeout
    if (this.apiDisabledTimeout) {
      clearTimeout(this.apiDisabledTimeout);
    }
    
    // Re-enable after 2 minutes
    this.apiDisabledTimeout = setTimeout(() => {
      console.log('Re-enabling Standards API requests');
      this.apiDisabled = false;
      this.apiFailureCount = 0;
    }, 120000); // 2 minutes
  }
  
  /**
   * Register an API failure
   */
  private registerFailure(): void {
    this.apiFailureCount++;
    
    if (this.apiFailureCount >= this.maxFailureCount) {
      this.disableApi();
    }
  }
  
  /**
   * Reset failure count on success
   */
  private registerSuccess(): void {
    this.apiFailureCount = 0;
  }
  
  /**
   * Attempt to fetch data from multiple endpoints to handle different server configurations
   */
  private async tryMultipleEndpoints(
    endpointPaths: string[], 
    transformer: (data: any) => any = (d) => d,
    cacheKey?: string
  ): Promise<any> {
    // If API is disabled, return empty result immediately
    if (this.isApiDisabled()) {
      console.log('Standards API disabled, returning empty result');
      return transformer([]); 
    }
    
    // Filter out endpoints that are known to be failing
    const availableEndpoints = endpointPaths.filter(ep => !isEndpointFailing(ep));
    
    if (availableEndpoints.length === 0) {
      console.log('All endpoints are currently marked as failing, returning empty result');
      return transformer([]);
    }
    
    // First try using authenticated API instance for better auth handling
    try {
      // Convert the first endpoint to a relative path for the API instance
      const relativePath = availableEndpoints[0].replace(BACKEND_URL, '');
      console.log(`Trying authenticated API with path: ${relativePath}`);
      
      const response = await api.get(relativePath);
      this.registerSuccess();
      return transformer(response.data);
    } catch (error) {
      console.warn(`Authenticated API request failed, falling back to direct endpoints`, error);
      // Continue with direct endpoints as fallback
    }
    
    // If we have a previously successful endpoint for this request type, try it first
    if (cacheKey && this.lastSuccessfulEndpoints[cacheKey]) {
      try {
        const cachedEndpoint = this.lastSuccessfulEndpoints[cacheKey];
        
        // Skip if this endpoint is marked as failing
        if (isEndpointFailing(cachedEndpoint)) {
          throw new Error('Cached endpoint is currently failing');
        }
        
        console.log(`Using cached successful endpoint: ${cachedEndpoint}`);
        
        const response = await axios.get(cachedEndpoint, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          timeout: 3000 // Short timeout to quickly fallback if the endpoint is still failing
        });
        
        this.registerSuccess();
        return transformer(response.data);
      } catch (error) {
        console.warn(`Cached endpoint failed, trying alternatives`);
        // Continue with regular endpoints
      }
    }
    
    // Try each endpoint in sequence
    for (let i = 0; i < availableEndpoints.length; i++) {
      try {
        const path = availableEndpoints[i];
        console.log(`Trying direct endpoint: ${path}`);
        
        const response = await axios.get(path, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000 // Add a reasonable timeout
        });
        
        // Store successful endpoint for future use
        if (cacheKey) {
          this.lastSuccessfulEndpoints[cacheKey] = path;
        }
        
        this.registerSuccess();
        return transformer(response.data);
      } catch (error) {
        // Mark this endpoint as failing to avoid retrying it too soon
        markEndpointAsFailing(availableEndpoints[i]);
        
        console.warn(`Endpoint ${availableEndpoints[i]} failed:`, error);
        this.registerFailure();
        
        // If this is the last endpoint, throw the error
        if (i === availableEndpoints.length - 1) {
          throw error;
        }
        // Otherwise continue to the next endpoint
      }
    }
    
    // Should never reach here due to the throw in the loop, but TypeScript requires a return
    return transformer([]);
  }

  /**
   * Get all available standards
   */
  async getStandards(): Promise<Standard[]> {
    try {
      // Return cached data if available
      if (this.standardsCache) {
        return this.standardsCache;
      }
      
      // Use direct API endpoint with direct URL to backend
      const endpoints = [`${BACKEND_URL}/standards`];
      
      const transformer = (data: any) => {
        return Array.isArray(data) ? data.map((item: any) => ({
          id: item._id || item.id,
          code_name: item.code_name,
          full_name: item.full_name,
          version: item.version,
          issuing_body: item.issuing_body,
          description: item.description,
          publication_date: item.publication_date,
          effective_date: item.effective_date
        })) : [];
      };
      
      // Try multiple endpoints and transform the result, using 'standards' as cache key
      const standards = await this.tryMultipleEndpoints(endpoints, transformer, 'standards');
      
      // Cache the result
      this.standardsCache = standards;
      
      return standards;
    } catch (error) {
      console.error('Error fetching standards:', error);
      // Return an empty array - no mock data
      return [];
    }
  }

  /**
   * Get a standard by ID
   */
  async getStandardById(id: string): Promise<Standard> {
    try {
      // Check cache first
      if (this.standardsCache) {
        const cachedStandard = this.standardsCache.find(s => s.id === id);
        if (cachedStandard) {
          return cachedStandard;
        }
      }
      
      // Use direct connection to backend
      const endpoints = [`${BACKEND_URL}/standards/${id}`];
      
      const transformer = (data: any) => ({
        id: data._id || data.id,
        code_name: data.code_name,
        full_name: data.full_name,
        version: data.version,
        issuing_body: data.issuing_body,
        description: data.description,
        publication_date: data.publication_date,
        effective_date: data.effective_date
      });
      
      return await this.tryMultipleEndpoints(endpoints, transformer);
    } catch (error) {
      console.error('Error fetching standard:', error);
      // Throw a descriptive error
      throw new Error(`Standard with ID ${id} not found. The API endpoint may be unavailable.`);
    }
  }

  /**
   * Get sections for a standard
   */
  async getSections(standardId: string, parentId?: string): Promise<Section[]> {
    try {
      // Check cache first
      const cacheKey = `${standardId}-${parentId || 'root'}`;
      if (this.sectionsCache[cacheKey]) {
        return this.sectionsCache[cacheKey];
      }
      
      // Use query param for parentId
      const queryParam = parentId ? `?parentId=${parentId}` : '';
      const endpoints = [`${BACKEND_URL}/standards/${standardId}/sections${queryParam}`];
      
      const transformer = (data: any) => {
        return Array.isArray(data) ? data.map((item: any) => ({
          id: item._id || item.id,
          standard_id: item.standard_id,
          section_number: item.section_number,
          title: item.title,
          content: item.content || '',
          parent_section_id: item.parent_section_id,
          has_tables: item.has_tables || false,
          has_figures: item.has_figures || false
        })) : [];
      };
      
      // Use endpoint cache key based on the standard ID
      const endpointCacheKey = `sections-${standardId}`;
      const sections = await this.tryMultipleEndpoints(endpoints, transformer, endpointCacheKey);
      
      // Cache the result
      this.sectionsCache[cacheKey] = sections;
      
      return sections;
    } catch (error) {
      console.error('Error fetching sections:', error);
      // Return empty array
      console.warn('No section data available - returning empty array');
      return [];
    }
  }

  /**
   * Get a section by ID
   */
  async getSectionById(id: string): Promise<Section> {
    try {
      // Simple endpoint using proxy
      const endpoints = [`/api/standards/sections/${id}`];
      
      const transformer = (data: any) => ({
          id: data._id || data.id,
          standard_id: data.standard_id,
          section_number: data.section_number,
          title: data.title,
          content: data.content || '',
          parent_section_id: data.parent_section_id,
          has_tables: data.has_tables || false,
          has_figures: data.has_figures || false,
          tables: data.tables || [],
          figures: data.figures || [],
          compliance_requirements: data.compliance_requirements || [],
          educational_resources: data.educational_resources || []
      });
      
      // Use cacheKey based on the section ID
      const cacheKey = `section-${id}`;
      return await this.tryMultipleEndpoints(endpoints, transformer, cacheKey);
    } catch (error) {
      console.error('Error fetching section:', error);
      // Return a minimal empty section
      return {
        id: id,
        standard_id: "",
        section_number: "",
        title: "Section not available",
        content: "The section could not be loaded. Please try again later.",
        parent_section_id: null,
        has_tables: false,
        has_figures: false
      };
    }
  }

  /**
   * Get tags for a section
   */
  async getSectionTags(sectionId: string): Promise<Tag[]> {
    try {
      // Try different possible API endpoints
      const endpoints = [
        `/api/standards/sections/${sectionId}/tags`,
      ];
      
      const transformer = (data: any) => Array.isArray(data) ? data.map((tag: any) => ({
        id: tag._id || tag.id,
        name: tag.name,
        created_at: tag.created_at
      })) : [];
      
      return await this.tryMultipleEndpoints(endpoints, transformer);
    } catch (error) {
      console.error('Error fetching section tags:', error);
      return []; // Return empty array if no tags available
    }
  }

  /**
   * Get all available tags
   */
  async getAllTags(): Promise<Tag[]> {
    try {
      // Try different possible API endpoints
      const endpoints = [
        `/api/standards/tags`,
      ];
      
      const transformer = (data: any) => Array.isArray(data) ? data.map((tag: any) => ({
        id: tag._id || tag.id,
        name: tag.name,
        created_at: tag.created_at
      })) : [];
      
      return await this.tryMultipleEndpoints(endpoints, transformer);
    } catch (error) {
      console.error('Error fetching tags:', error);
      return []; // Return empty array if no tags available
    }
  }

  /**
   * Add a tag to a section
   */
  async addSectionTag(sectionId: string, tagName: string): Promise<{ success: boolean }> {
    try {
      const response = await axios.post(`/api/standards-api/sections/${sectionId}/tags`, {
        tagName
      });
      return response.data;
    } catch (error) {
      console.error('Error adding section tag:', error);
      throw error;
    }
  }

  /**
   * Remove a tag from a section
   */
  async removeSectionTag(sectionId: string, tagId: string): Promise<{ success: boolean }> {
    try {
      const response = await axios.delete(`/api/standards-api/sections/${sectionId}/tags/${tagId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing section tag:', error);
      throw error;
    }
  }

  /**
   * Search for sections matching a query
   */
  async searchSections(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
      try {
        const queryParams = new URLSearchParams({
          q: query,
          ...options.standardId && { standardId: options.standardId },
          ...options.exactMatch && { exactMatch: 'true' },
          ...options.fields && { fields: options.fields.join(',') },
          ...options.page && { page: options.page.toString() },
          ...options.limit && { limit: options.limit.toString() },
          ...options.sort && { sort: options.sort },
          ...options.sortDirection && { sortDirection: options.sortDirection },
          ...options.relevanceThreshold && { relevanceThreshold: options.relevanceThreshold.toString() },
          ...options.tags && options.tags.length > 0 && { tags: options.tags.join(',') }
        });

      // Try different possible API endpoints
      const endpoints = [
        `/api/standards/search/sections?${queryParams}`,
      ];
      
      const transformer = (data: any) => Array.isArray(data) ? data : [];
      
      // Create a unique cache key based on the query and important options
      const cacheKeyParts = [
        'search',
        query,
        options.standardId || 'all',
        options.sort || 'default',
        options.tags?.join(',') || 'no-tags'
      ];
      const cacheKey = cacheKeyParts.join('-');
      
      return await this.tryMultipleEndpoints(endpoints, transformer, cacheKey);
    } catch (error) {
      console.error('Error searching sections:', error);
      return []; // Return empty results instead of mock data
    }
  }

  /**
   * Get search suggestions for autocomplete
   */
  async getSearchSuggestions(query: string): Promise<string[]> {
    try {
      const response = await axios.get(`/api/search/suggestions?q=${query}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      throw error;
    }
  }

  /**
   * Get recent search terms
   */
  async getRecentSearchTerms(): Promise<string[]> {
    try {
      const response = await axios.get('/api/search/recent-terms');
      return response.data;
    } catch (error) {
      console.error('Error fetching recent search terms:', error);
      throw error;
    }
  }

  /**
   * Get illumination requirements for a room type
   */
  async getIlluminationRequirement(roomType: string): Promise<IlluminationRequirement> {
    try {
      const response = await axios.get(`/api/standards-api/lookup/illumination?roomType=${encodeURIComponent(roomType)}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching illumination requirement:', error);
      throw error;
    }
  }

  /**
   * Save a bookmark
   */
  async saveBookmark(sectionId: string): Promise<{ success: boolean; id: string }> {
    // For now, we're using localStorage in the components
    // In the future, this would make an API call
    return { success: true, id: String(Date.now()) };
  }

  /**
   * Get user bookmarks
   */
  async getBookmarks(): Promise<string[]> {
    // For now, we're using localStorage in the components
    // In the future, this would make an API call
    return [];
  }

  /**
   * Delete a bookmark
   */
  async deleteBookmark(bookmarkId: string): Promise<{ success: boolean }> {
    // For now, we're using localStorage in the components
    // In the future, this would make an API call
    return { success: true };
  }
}

export default new StandardsService(); 