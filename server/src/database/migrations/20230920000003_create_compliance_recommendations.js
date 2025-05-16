/**
 * Migration to create the compliance_recommendations table
 */
exports.up = function(knex) {
  return knex.schema.createTable('compliance_recommendations', function(table) {
    table.increments('id').primary();
    table.integer('rule_id').notNullable();
    table.string('non_compliance_type').notNullable();
    table.text('recommendation_text').notNullable();
    table.enum('priority', ['high', 'medium', 'low']).defaultTo('medium');
    table.string('calculator_type').notNullable();
    table.timestamps(true, true);

    // Add unique constraint to prevent duplicates
    table.unique(['rule_id', 'non_compliance_type', 'calculator_type']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('compliance_recommendations');
}; 