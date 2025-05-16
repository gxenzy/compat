-- SQL Script to Insert PEC 2017 Standards into Database
-- This script will add Philippine Electrical Code 2017 standards into the building_type_standards, 
-- project_type_standards, and compliance_recommendations tables

-- Clear existing data first (uncomment if needed)
-- DELETE FROM building_type_standards;
-- DELETE FROM project_type_standards;
-- DELETE FROM compliance_recommendations;

-- Building Type Standards - Illumination Requirements
INSERT INTO building_type_standards (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES 
('office', 'illumination', 'PEC-2017-1075.1', 300, 500, 'lux', 'Office illumination requirement');

INSERT INTO building_type_standards (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES
('residential', 'illumination', 'PEC-2017-1075.2', 150, 300, 'lux', 'Residential illumination requirement');

INSERT INTO building_type_standards (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES
('commercial', 'illumination', 'PEC-2017-1075.3', 300, 750, 'lux', 'Commercial areas illumination requirement');

INSERT INTO building_type_standards (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES
('industrial', 'illumination', 'PEC-2017-1075.4', 300, 1000, 'lux', 'Industrial work areas illumination requirement');

INSERT INTO building_type_standards (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES
('healthcare', 'illumination', 'PEC-2017-1075.5', 300, 1000, 'lux', 'Hospital/healthcare facility illumination requirement');

INSERT INTO building_type_standards (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES
('educational', 'illumination', 'PEC-2017-1075.6', 300, 500, 'lux', 'Educational facility illumination requirement');

INSERT INTO building_type_standards (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES
('laboratory', 'illumination', 'PEC-2017-1075.7', 500, 750, 'lux', 'Laboratory space illumination requirement');

-- Building Type Standards - Lightning Protection
INSERT INTO building_type_standards (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES
('building_class_1', 'lightning_protection', 'PEC-2017-2.90.3.1', NULL, 23, 'm', 'Building under 23m in height - requires Class I protection materials');

INSERT INTO building_type_standards (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES
('building_class_2', 'lightning_protection', 'PEC-2017-2.90.3.1', 23, NULL, 'm', 'Building over 23m in height - requires Class II protection materials');

INSERT INTO building_type_standards (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES
('all', 'lightning_protection', 'PEC-2017-2.90.3.10A', 254, NULL, 'mm', 'Air terminals minimum height above protected object for 6000mm max intervals');

INSERT INTO building_type_standards (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES
('all', 'lightning_protection', 'PEC-2017-2.90.3.10A-2', 600, NULL, 'mm', 'Air terminals minimum height above protected object for 7600mm max intervals');

INSERT INTO building_type_standards (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES
('all', 'lightning_protection', 'PEC-2017-2.90.3.11', NULL, 6000, 'mm', 'Maximum interval for air terminals on ridges of roofs and perimeter of flat/gently sloping roofs');

INSERT INTO building_type_standards (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES
('all', 'lightning_protection', 'PEC-2017-2.90.3.11A', NULL, 15, 'm', 'Maximum width/span for flat/gently sloping roofs requiring additional air terminals');

-- Building Type Standards - Power Distribution
INSERT INTO building_type_standards (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES 
('office', 'power_distribution', 'PEC-2017-6.20.2.3', NULL, NULL, 'ampere', 'Feeder and branch circuit conductors requirements for office buildings');

INSERT INTO building_type_standards (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES
('commercial', 'power_distribution', 'PEC-2017-6.20.2.4', NULL, NULL, 'ampere', 'Feeder demand factor for commercial buildings');

INSERT INTO building_type_standards (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES
('industrial', 'power_distribution', 'PEC-2017-4.30.2.2', NULL, NULL, 'ampere', 'Motor circuit conductor sizing for industrial applications');

-- Building Type Standards - Electrical Safety
INSERT INTO building_type_standards (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES 
('all', 'electrical_safety', 'PEC-2017-6.20.9.5', NULL, NULL, NULL, 'Ground-fault circuit-interrupter protection requirements for personnel');

INSERT INTO building_type_standards (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES
('all', 'electrical_safety', 'PEC-2017-2.50.5', NULL, NULL, NULL, 'Grounding and bonding requirements for electrical installations');

INSERT INTO building_type_standards (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES
('all', 'electrical_safety', 'PEC-2017-6.20.1.5', NULL, NULL, NULL, 'Disconnecting means requirements for electrical equipment');

-- Building Type Standards - Conductor Ampacity
INSERT INTO building_type_standards (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES 
('all', 'conductor_ampacity', 'PEC-2017-3.10.2.51-67', NULL, NULL, 'ampere', 'Ampacities of insulated single copper conductor cables');

INSERT INTO building_type_standards (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES
('all', 'conductor_ampacity', 'PEC-2017-3.10.2.51-68', NULL, NULL, 'ampere', 'Ampacities of insulated single aluminum conductor cables');

INSERT INTO building_type_standards (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES
('all', 'conductor_ampacity', 'PEC-2017-3.10.2.51-69', NULL, NULL, 'ampere', 'Ampacities of insulated single copper conductor isolated in air');

INSERT INTO building_type_standards (building_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES
('all', 'conductor_ampacity', 'PEC-2017-3.10.2.51-70', NULL, NULL, 'ampere', 'Ampacities of insulated single aluminum conductor isolated in air');

-- Building Type Standards - Lighting Power Density
INSERT INTO building_type_standards (building_type, standard_type, standard_code, maximum_value, unit, description)
VALUES 
('office', 'lighting_power_density', 'PEC-2017-LPD.1', 10.5, 'W/m²', 'Office maximum lighting power density'),
('classroom', 'lighting_power_density', 'PEC-2017-LPD.2', 10.5, 'W/m²', 'Classroom maximum lighting power density'),
('hospital', 'lighting_power_density', 'PEC-2017-LPD.3', 11.2, 'W/m²', 'Hospital maximum lighting power density'),
('retail', 'lighting_power_density', 'PEC-2017-LPD.4', 14.5, 'W/m²', 'Retail maximum lighting power density'),
('industrial', 'lighting_power_density', 'PEC-2017-LPD.5', 12.8, 'W/m²', 'Industrial maximum lighting power density'),
('residential', 'lighting_power_density', 'PEC-2017-LPD.6', 8.0, 'W/m²', 'Residential maximum lighting power density'),
('warehouse', 'lighting_power_density', 'PEC-2017-LPD.7', 8.0, 'W/m²', 'Warehouse maximum lighting power density'),
('restaurant', 'lighting_power_density', 'PEC-2017-LPD.8', 12.0, 'W/m²', 'Restaurant maximum lighting power density'),
('hotel', 'lighting_power_density', 'PEC-2017-LPD.9', 10.0, 'W/m²', 'Hotel maximum lighting power density'),
('laboratory', 'lighting_power_density', 'PEC-2017-LPD.10', 14.0, 'W/m²', 'Laboratory maximum lighting power density');

-- Building Type Standards - Safety Standards
INSERT INTO building_type_standards (building_type, standard_type, standard_code, description)
VALUES 
('industrial', 'safety', 'PEC-2017-1100.1', 'Industrial safety standard - General requirements');

-- Project Type Standards - Wiring Methods
INSERT INTO project_type_standards (project_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES 
('elevator', 'wiring_methods', 'PEC-2017-6.20.3.1', NULL, NULL, NULL, 'Elevator wiring method requirements');

INSERT INTO project_type_standards (project_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES
('escalator', 'wiring_methods', 'PEC-2017-6.20.3.1B', NULL, NULL, NULL, 'Escalator wiring method requirements');

-- Project Type Standards - Branch Circuits
INSERT INTO project_type_standards (project_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES 
('elevator', 'branch_circuits', 'PEC-2017-6.20.3.2', NULL, NULL, NULL, 'Branch circuits for elevator car lighting, receptacle(s), ventilation, heating, and air-conditioning'),
('elevator', 'branch_circuits', 'PEC-2017-6.20.3.3', NULL, NULL, NULL, 'Branch circuits for machine room or control room lighting and receptacle(s)'),
('elevator', 'branch_circuits', 'PEC-2017-6.20.3.4', NULL, NULL, NULL, 'Branch circuit for hoistway pit lighting and receptacles'),
('all', 'branch_circuits', 'PEC-2017-6.20.3.5', NULL, NULL, NULL, 'Branch circuits for other utilization equipment');

-- Project Type Standards - Electric Vehicles
INSERT INTO project_type_standards (project_type, standard_type, standard_code, minimum_value, maximum_value, unit, description)
VALUES 
('ev_charging', 'supply_equipment', 'PEC-2017-6.25.1.1', NULL, NULL, NULL, 'Electric vehicle charging system scope'),
('ev_charging', 'supply_equipment', 'PEC-2017-6.25.1.2', NULL, NULL, NULL, 'Electric vehicle charging system definitions');

-- Project Type Standards
INSERT INTO project_type_standards (project_type, standard_type, standard_code, minimum_value, unit, description)
VALUES 
('renovation', 'efficiency', 'PEEP-2020-E1', 85, '%', 'Energy efficiency requirement for renovations'),
('new-construction', 'efficiency', 'PEEP-2020-E2', 90, '%', 'New construction efficiency requirement'),
('lighting', 'efficiency', 'PEEP-2020-LT1', 80, 'lm/W', 'Lighting Efficiency Standards for all general lighting');

INSERT INTO project_type_standards (project_type, standard_type, standard_code, description)
VALUES 
('retrofit', 'safety', 'PEC-2017-S1', 'Retrofit safety requirements'),
('all', 'safety', 'PEC-2017-S2', 'Emergency lighting and exit signage requirements'),
('all', 'wiring', 'PEC-2017-1.3.1', 'All wiring methods and materials shall comply with specified requirements'),
('all', 'wiring', 'PEC-2017-1.3.2', 'Conductor sizes and ratings for various applications');

-- Compliance Recommendations
INSERT INTO compliance_recommendations (rule_id, non_compliance_type, recommendation_text, priority, calculator_type)
VALUES 
(1, 'illumination', 'Ensure office spaces meet illumination requirements of 300-500 lux for optimal workspace visibility and comfort.', 'high', 'lighting');

INSERT INTO compliance_recommendations (rule_id, non_compliance_type, recommendation_text, priority, calculator_type)
VALUES
(2, 'electrical_safety', 'Install ground-fault circuit-interrupter protection for all 125-volt or 250-volt, single-phase, 15- and 20-ampere receptacles in pits, hoistways, and machinery spaces.', 'high', 'safety');

INSERT INTO compliance_recommendations (rule_id, non_compliance_type, recommendation_text, priority, calculator_type)
VALUES
(3, 'power_distribution', 'Size feeder and branch-circuit conductors according to ampacity requirements for the specific load type.', 'high', 'electrical');

INSERT INTO compliance_recommendations (rule_id, non_compliance_type, recommendation_text, priority, calculator_type)
VALUES
(4, 'conductor_ampacity', 'Reference appropriate ampacity tables when sizing conductors to ensure proper current-carrying capacity.', 'medium', 'electrical');

INSERT INTO compliance_recommendations (rule_id, non_compliance_type, recommendation_text, priority, calculator_type)
VALUES
(5, 'wiring_methods', 'Use appropriate wiring methods for different applications including elevators, escalators, and platform lifts.', 'high', 'electrical');

INSERT INTO compliance_recommendations (rule_id, non_compliance_type, recommendation_text, priority, calculator_type)
VALUES
(6, 'ev_charging', 'Follow specific requirements for electric vehicle charging systems to ensure safety and proper operation.', 'medium', 'electrical');

INSERT INTO compliance_recommendations (rule_id, non_compliance_type, recommendation_text, priority, calculator_type)
VALUES
(7, 'grounding', 'Implement proper grounding and bonding for all electrical systems to minimize shock hazards.', 'high', 'safety');

INSERT INTO compliance_recommendations (rule_id, non_compliance_type, recommendation_text, priority, calculator_type)
VALUES
(8, 'disconnect', 'Install proper disconnecting means for all electrical equipment to ensure safety during maintenance.', 'high', 'safety');

INSERT INTO compliance_recommendations (rule_id, non_compliance_type, recommendation_text, priority, calculator_type)
VALUES
(9, 'power_supply', 'Provide a single means for disconnecting all ungrounded main power supply conductors.', 'high', 'electrical');

INSERT INTO compliance_recommendations (rule_id, non_compliance_type, recommendation_text, priority, calculator_type)
VALUES
(10, 'emergency_power', 'For buildings with emergency power systems, ensure elevator systems can properly handle regenerative power.', 'medium', 'emergency');

INSERT INTO compliance_recommendations (rule_id, non_compliance_type, recommendation_text, priority, calculator_type)
VALUES
(11, 'lightning_protection', 'Ensure proper air terminal placement on roofs and perimeters with maximum intervals of 6000mm (or 7600mm for terminals ≥600mm high).', 'high', 'safety');

INSERT INTO compliance_recommendations (rule_id, non_compliance_type, recommendation_text, priority, calculator_type)
VALUES
(12, 'lightning_protection', 'For buildings over 23m in height, use Class II protection materials with heavier conductors and larger air terminals.', 'high', 'safety');

INSERT INTO compliance_recommendations (rule_id, non_compliance_type, recommendation_text, priority, calculator_type)
VALUES
(13, 'lightning_protection', 'Maintain proper minimum height for air terminals: at least 254mm above protected objects (6000mm intervals) or 600mm (7600mm intervals).', 'medium', 'safety'); 