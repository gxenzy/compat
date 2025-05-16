/**
 * Seeder for standards tables
 */
exports.seed = async function(knex) {
  // Clear existing data
  await knex('building_type_standards').del();
  await knex('project_type_standards').del();
  await knex('compliance_recommendations').del();

  // Insert building type standards
  await knex('building_type_standards').insert([
    {
      building_type: 'commercial',
      standard_type: 'illumination',
      standard_code: 'PGBC-LPD',
      minimum_value: null,
      maximum_value: 10.5,
      unit: 'W/m²',
      description: 'Maximum lighting power density for commercial buildings'
    },
    {
      building_type: 'commercial',
      standard_type: 'energy_efficiency',
      standard_code: 'DOE-EE-EUI',
      minimum_value: null,
      maximum_value: 180,
      unit: 'kWh/m²/year',
      description: 'Maximum energy use intensity for commercial buildings'
    },
    {
      building_type: 'residential',
      standard_type: 'illumination',
      standard_code: 'PGBC-LPD',
      minimum_value: null,
      maximum_value: 8.0,
      unit: 'W/m²',
      description: 'Maximum lighting power density for residential buildings'
    },
    {
      building_type: 'residential',
      standard_type: 'energy_efficiency',
      standard_code: 'DOE-EE-EUI',
      minimum_value: null,
      maximum_value: 120,
      unit: 'kWh/m²/year',
      description: 'Maximum energy use intensity for residential buildings'
    },
    {
      building_type: 'institutional',
      standard_type: 'illumination',
      standard_code: 'PGBC-LPD',
      minimum_value: null,
      maximum_value: 12.0,
      unit: 'W/m²',
      description: 'Maximum lighting power density for institutional buildings'
    }
  ]);

  // Insert project type standards
  await knex('project_type_standards').insert([
    {
      project_type: 'lighting_retrofit',
      standard_type: 'financial',
      standard_code: 'FNANCL-ROI',
      minimum_value: 15.0,
      maximum_value: null,
      unit: '%',
      description: 'Minimum return on investment for lighting retrofit projects'
    },
    {
      project_type: 'lighting_retrofit',
      standard_type: 'financial',
      standard_code: 'FNANCL-PAYBCK',
      minimum_value: null,
      maximum_value: 3.0,
      unit: 'years',
      description: 'Maximum payback period for lighting retrofit projects'
    },
    {
      project_type: 'hvac_upgrade',
      standard_type: 'financial',
      standard_code: 'FNANCL-ROI',
      minimum_value: 12.0,
      maximum_value: null,
      unit: '%',
      description: 'Minimum return on investment for HVAC upgrade projects'
    },
    {
      project_type: 'hvac_upgrade',
      standard_type: 'financial',
      standard_code: 'FNANCL-PAYBCK',
      minimum_value: null,
      maximum_value: 5.0,
      unit: 'years',
      description: 'Maximum payback period for HVAC upgrade projects'
    }
  ]);

  // Insert compliance recommendations
  await knex('compliance_recommendations').insert([
    {
      rule_id: 1,
      non_compliance_type: 'high_lpd',
      recommendation_text: 'Replace existing lighting fixtures with LED alternatives to reduce lighting power density.',
      priority: 'high',
      calculator_type: 'lighting'
    },
    {
      rule_id: 2,
      non_compliance_type: 'high_eui',
      recommendation_text: 'Implement energy efficiency measures to reduce overall energy consumption.',
      priority: 'high',
      calculator_type: 'energy'
    },
    {
      rule_id: 3,
      non_compliance_type: 'low_roi',
      recommendation_text: 'Evaluate alternative solutions or phased implementation to improve ROI.',
      priority: 'medium',
      calculator_type: 'financial'
    }
  ]);
}; 