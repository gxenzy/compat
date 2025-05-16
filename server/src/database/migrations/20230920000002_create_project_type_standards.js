/**
 * Migration to create the project_type_standards table
 */
exports.up = function(knex) {
  return knex.schema.createTable('project_type_standards', function(table) {
    table.increments('id').primary();
    table.string('project_type').notNullable();
    table.string('standard_type').notNullable();
    table.string('standard_code').notNullable();
    table.float('minimum_value').nullable();
    table.float('maximum_value').nullable();
    table.string('unit').nullable();
    table.text('description').nullable();
    table.timestamps(true, true);

    // Add unique constraint to prevent duplicates
    table.unique(['project_type', 'standard_type', 'standard_code']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('project_type_standards');
}; 