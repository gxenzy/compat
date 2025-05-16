/**
 * BuildingTypeStandard model
 * Represents standards values specific to building types
 */
const { Model } = require('objection');
const db = require('../database/db');
const Standard = require('./StandardModel');

Model.knex(db);

/**
 * BuildingTypeStandard model representing the building_type_standards table
 */
class BuildingTypeStandard extends Model {
  static get tableName() {
    return 'building_type_standards';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['building_type', 'standard_type', 'standard_code'],
      
      properties: {
        id: { type: 'integer' },
        building_type: { type: 'string', minLength: 1, maxLength: 255 },
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

  static associate(models) {
    BuildingTypeStandard.belongsTo(models.Standard, {
      foreignKey: 'sourceStandardId',
      as: 'sourceStandard'
    });
  }

  /**
   * Get standards for a specific building type
   * @param {String} buildingType - The building type
   * @returns {Promise<Array>} - Array of standards for the building type
   */
  static async getStandardsByBuildingType(buildingType) {
    return await BuildingTypeStandard.query().where('building_type', buildingType);
  }

  /**
   * Get standards by building type and standard type
   * @param {String} buildingType - The building type
   * @param {String} standardType - The standard type
   * @returns {Promise<Array>} - Array of standards
   */
  static async getStandardsByTypeAndBuilding(buildingType, standardType) {
    return await BuildingTypeStandard.query().where('building_type', buildingType).andWhere('standard_type', standardType);
  }

  /**
   * Get a standard value for a specific building type, standard type, and code
   * @param {String} buildingType - The building type
   * @param {String} standardType - The standard type
   * @param {String} standardCode - The standard code
   * @returns {Promise<Object>} - The standard value
   */
  static async getStandardValue(buildingType, standardType, standardCode) {
    return await BuildingTypeStandard.query().where('building_type', buildingType).andWhere('standard_type', standardType).andWhere('standard_code', standardCode).first();
  }

  /**
   * Get standard values for Energy Use Intensity by building type
   * @param {String} buildingType - The building type
   * @returns {Promise<Object>} - The EUI standard value
   */
  static async getEUIStandard(buildingType) {
    return await BuildingTypeStandard.query().where('building_type', buildingType).andWhere('standard_type', 'energy_efficiency').andWhere('standard_code', 'DOE-EE-EUI').first();
  }

  /**
   * Get standard values for Lighting Power Density by building type
   * @param {String} buildingType - The building type
   * @returns {Promise<Object>} - The LPD standard value
   */
  static async getLPDStandard(buildingType) {
    return await BuildingTypeStandard.query().where('building_type', buildingType).andWhere('standard_type', 'illumination').andWhere('standard_code', 'PGBC-LPD').first();
  }
}

module.exports = BuildingTypeStandard; 