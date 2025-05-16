/**
 * ProjectTypeStandard model
 * Represents standards values specific to project types (for ROI, payback, etc.)
 */
const { Model } = require('objection');
const db = require('../database/db');

Model.knex(db);

/**
 * ProjectTypeStandard model representing the project_type_standards table
 */
class ProjectTypeStandard extends Model {
  static get tableName() {
    return 'project_type_standards';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['project_type', 'standard_type', 'standard_code'],
      
      properties: {
        id: { type: 'integer' },
        project_type: { type: 'string', minLength: 1, maxLength: 255 },
        standard_type: { type: 'string', minLength: 1, maxLength: 255 },
        standard_code: { type: 'string', minLength: 1, maxLength: 255 },
        minimum_value: { type: ['number', 'null'] },
        maximum_value: { type: ['number', 'null'] },
        unit: { type: ['string', 'null'], maxLength: 50 },
        description: { type: ['string', 'null'] },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  // Validation rules
  static get modelPaths() {
    return [__dirname];
  }

  /**
   * Applies additional validation rules beyond the JSON schema
   */
  $beforeInsert() {
    this.created_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();
    
    // Ensure minimum_value <= maximum_value if both are defined
    this.validateMinMaxValues();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
    
    // Ensure minimum_value <= maximum_value if both are defined
    this.validateMinMaxValues();
  }

  /**
   * Validates that minimum_value <= maximum_value if both are defined
   */
  validateMinMaxValues() {
    if (this.minimum_value !== null && this.maximum_value !== null &&
        this.minimum_value !== undefined && this.maximum_value !== undefined &&
        this.minimum_value > this.maximum_value) {
      throw new Error('Minimum value cannot be greater than maximum value');
    }
  }

  /**
   * Get standards for a specific project type
   * @param {string} projectType - The project type to get standards for
   * @returns {Promise<Array>} - Array of project type standards
   */
  static async getStandardsByProjectType(projectType) {
    return await ProjectTypeStandard.query().where('project_type', projectType);
  }

  /**
   * Get standards for a specific project type and standard type
   * @param {string} projectType - The project type
   * @param {string} standardType - The standard type
   * @returns {Promise<Array>} - Array of project type standards
   */
  static async getStandardsByTypeAndProject(projectType, standardType) {
    return await ProjectTypeStandard.query()
      .where('project_type', projectType)
      .andWhere('standard_type', standardType);
  }

  /**
   * Get a specific standard value for a project type
   * @param {string} projectType - The project type
   * @param {string} standardType - The standard type
   * @param {string} standardCode - The standard code
   * @returns {Promise<Object>} - The project type standard
   */
  static async getStandardValue(projectType, standardType, standardCode) {
    return await ProjectTypeStandard.query()
      .where('project_type', projectType)
      .andWhere('standard_type', standardType)
      .andWhere('standard_code', standardCode)
      .first();
  }

  /**
   * Get ROI standard for a project type
   * @param {String} projectType - The project type
   * @returns {Promise<Object>} - The ROI standard value
   */
  static async getROIStandard(projectType) {
    return await ProjectTypeStandard.query()
      .where('project_type', projectType)
      .andWhere('standard_type', 'financial')
      .andWhere('standard_code', 'FNANCL-ROI')
      .first();
  }

  /**
   * Get payback period standard for a project type
   * @param {String} projectType - The project type
   * @returns {Promise<Object>} - The payback period standard value
   */
  static async getPaybackStandard(projectType) {
    return await ProjectTypeStandard.query()
      .where('project_type', projectType)
      .andWhere('standard_type', 'financial')
      .andWhere('standard_code', 'FNANCL-PAYBCK')
      .first();
  }

  /**
   * Get NPV ratio standard for a project type
   * @param {String} projectType - The project type
   * @returns {Promise<Object>} - The NPV ratio standard value
   */
  static async getNPVRatioStandard(projectType) {
    return await ProjectTypeStandard.query()
      .where('project_type', projectType)
      .andWhere('standard_type', 'financial')
      .andWhere('standard_code', 'FNANCL-NPV')
      .first();
  }

  /**
   * Get IRR margin standard for a project type
   * @param {String} projectType - The project type
   * @returns {Promise<Object>} - The IRR margin standard value
   */
  static async getIRRMarginStandard(projectType) {
    return await ProjectTypeStandard.query()
      .where('project_type', projectType)
      .andWhere('standard_type', 'financial')
      .andWhere('standard_code', 'FNANCL-IRR')
      .first();
  }
}

module.exports = ProjectTypeStandard; 