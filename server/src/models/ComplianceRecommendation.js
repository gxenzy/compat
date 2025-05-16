/**
 * ComplianceRecommendation model
 * Represents recommendation templates for non-compliant results
 */
const { Model } = require('objection');
const db = require('../database/db');

Model.knex(db);

/**
 * ComplianceRecommendation model representing the compliance_recommendations table
 */
class ComplianceRecommendation extends Model {
  static get tableName() {
    return 'compliance_recommendations';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['rule_id', 'non_compliance_type', 'recommendation_text', 'calculator_type'],
      
      properties: {
        id: { type: 'integer' },
        rule_id: { type: 'integer' },
        non_compliance_type: { type: 'string', minLength: 1, maxLength: 255 },
        recommendation_text: { type: 'string', minLength: 1 },
        priority: { 
          type: 'string', 
          enum: ['high', 'medium', 'low'],
          default: 'medium'
        },
        calculator_type: { type: 'string', minLength: 1, maxLength: 255 },
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
    
    // Set default priority if not provided
    if (!this.priority) {
      this.priority = 'medium';
    }
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }

  /**
   * Get recommendations by rule ID
   * @param {number} ruleId - The rule ID
   * @returns {Promise<Array>} - Array of recommendations
   */
  static async getRecommendationsByRuleId(ruleId) {
    return await ComplianceRecommendation.query().where('rule_id', ruleId);
  }

  /**
   * Get recommendations by calculator type
   * @param {string} calculatorType - The calculator type
   * @returns {Promise<Array>} - Array of recommendations
   */
  static async getRecommendationsByCalculatorType(calculatorType) {
    return await ComplianceRecommendation.query().where('calculator_type', calculatorType);
  }

  /**
   * Get recommendations by non-compliance type
   * @param {string} nonComplianceType - The non-compliance type
   * @returns {Promise<Array>} - Array of recommendations
   */
  static async getRecommendationsByNonComplianceType(nonComplianceType) {
    return await ComplianceRecommendation.query().where('non_compliance_type', nonComplianceType);
  }

  /**
   * Get recommendations by multiple criteria
   * @param {Object} criteria - The search criteria
   * @param {number} [criteria.ruleId] - Optional rule ID
   * @param {string} [criteria.calculatorType] - Optional calculator type
   * @param {string} [criteria.nonComplianceType] - Optional non-compliance type
   * @param {string} [criteria.priority] - Optional priority
   * @returns {Promise<Array>} - Array of recommendations
   */
  static async getRecommendationsByCriteria(criteria = {}) {
    const query = ComplianceRecommendation.query();
    
    if (criteria.ruleId) {
      query.where('rule_id', criteria.ruleId);
    }
    
    if (criteria.calculatorType) {
      query.where('calculator_type', criteria.calculatorType);
    }
    
    if (criteria.nonComplianceType) {
      query.where('non_compliance_type', criteria.nonComplianceType);
    }
    
    if (criteria.priority) {
      query.where('priority', criteria.priority);
    }
    
    return await query;
  }
}

module.exports = ComplianceRecommendation; 