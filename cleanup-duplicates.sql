-- SQL Script to clean up duplicate records in standards tables
-- This will keep the record with the lowest ID for each unique combination of key fields

-- 1. Clean up building_type_standards table
-- First create a temporary table with only the records we want to keep
CREATE TEMPORARY TABLE temp_building_standards AS
SELECT MIN(id) as id 
FROM building_type_standards
GROUP BY building_type, standard_type, standard_code;

-- Delete all records that aren't in our temporary table
DELETE FROM building_type_standards
WHERE id NOT IN (SELECT id FROM temp_building_standards);

-- Drop the temporary table
DROP TEMPORARY TABLE temp_building_standards;

-- Add a unique constraint to prevent future duplicates
ALTER TABLE building_type_standards
ADD CONSTRAINT unique_building_standard 
UNIQUE (building_type, standard_type, standard_code);

-- 2. Clean up project_type_standards table
CREATE TEMPORARY TABLE temp_project_standards AS
SELECT MIN(id) as id 
FROM project_type_standards
GROUP BY project_type, standard_type, standard_code;

DELETE FROM project_type_standards
WHERE id NOT IN (SELECT id FROM temp_project_standards);

DROP TEMPORARY TABLE temp_project_standards;

ALTER TABLE project_type_standards
ADD CONSTRAINT unique_project_standard 
UNIQUE (project_type, standard_type, standard_code);

-- 3. Clean up compliance_recommendations table
CREATE TEMPORARY TABLE temp_recommendations AS
SELECT MIN(id) as id 
FROM compliance_recommendations
GROUP BY non_compliance_type, recommendation_text;

DELETE FROM compliance_recommendations
WHERE id NOT IN (SELECT id FROM temp_recommendations);

DROP TEMPORARY TABLE temp_recommendations;

ALTER TABLE compliance_recommendations
ADD CONSTRAINT unique_recommendation 
UNIQUE (non_compliance_type, recommendation_text(255));

-- 4. Clean up standard table
CREATE TEMPORARY TABLE temp_standards AS
SELECT MIN(id) as id 
FROM standard
GROUP BY code_name, version;

DELETE FROM standard
WHERE id NOT IN (SELECT id FROM temp_standards);

DROP TEMPORARY TABLE temp_standards;

ALTER TABLE standard
ADD CONSTRAINT unique_standard 
UNIQUE (code_name, version);

-- 5. Clean up standard_sections table
CREATE TEMPORARY TABLE temp_sections AS
SELECT MIN(id) as id 
FROM standard_sections
GROUP BY standard_id, section_number;

DELETE FROM standard_sections
WHERE id NOT IN (SELECT id FROM temp_sections);

DROP TEMPORARY TABLE temp_sections;

ALTER TABLE standard_sections
ADD CONSTRAINT unique_section 
UNIQUE (standard_id, section_number);

-- 6. Clean up standard_tables table
CREATE TEMPORARY TABLE temp_tables AS
SELECT MIN(id) as id 
FROM standard_tables
GROUP BY section_id, table_number;

DELETE FROM standard_tables
WHERE id NOT IN (SELECT id FROM temp_tables);

DROP TEMPORARY TABLE temp_tables;

ALTER TABLE standard_tables
ADD CONSTRAINT unique_table 
UNIQUE (section_id, table_number);

-- 7. Clean up standard_notes table
CREATE TEMPORARY TABLE temp_notes AS
SELECT MIN(id) as id 
FROM standard_notes
GROUP BY user_id, section_id, note_text(255);

DELETE FROM standard_notes
WHERE id NOT IN (SELECT id FROM temp_notes);

DROP TEMPORARY TABLE temp_notes;

ALTER TABLE standard_notes
ADD CONSTRAINT unique_note 
UNIQUE (user_id, section_id, note_text(255));

-- 8. Clean up standard_tags table
CREATE TEMPORARY TABLE temp_tags AS
SELECT MIN(id) as id 
FROM standard_tags
GROUP BY name;

DELETE FROM standard_tags
WHERE id NOT IN (SELECT id FROM temp_tags);

DROP TEMPORARY TABLE temp_tags;

ALTER TABLE standard_tags
ADD CONSTRAINT unique_tag 
UNIQUE (name);

-- 9. Clean up compliance_requirements table
CREATE TEMPORARY TABLE temp_compliance_requirements AS
SELECT MIN(id) as id 
FROM compliance_requirements
GROUP BY section_id, requirement_type, description(255);

DELETE FROM compliance_requirements
WHERE id NOT IN (SELECT id FROM temp_compliance_requirements);

DROP TEMPORARY TABLE temp_compliance_requirements;

ALTER TABLE compliance_requirements
ADD CONSTRAINT unique_compliance_requirement 
UNIQUE (section_id, requirement_type, description(255));

-- 10. Clean up educational_resources table
CREATE TEMPORARY TABLE temp_educational_resources AS
SELECT MIN(id) as id 
FROM educational_resources
GROUP BY section_id, resource_type, title, url(255);

DELETE FROM educational_resources
WHERE id NOT IN (SELECT id FROM temp_educational_resources);

DROP TEMPORARY TABLE temp_educational_resources;

ALTER TABLE educational_resources
ADD CONSTRAINT unique_educational_resource 
UNIQUE (section_id, resource_type, title, url(255));

-- 11. Show the counts after cleanup
SELECT 'building_type_standards' as table_name, COUNT(*) as record_count FROM building_type_standards
UNION ALL
SELECT 'project_type_standards' as table_name, COUNT(*) as record_count FROM project_type_standards
UNION ALL
SELECT 'compliance_recommendations' as table_name, COUNT(*) as record_count FROM compliance_recommendations
UNION ALL
SELECT 'standard' as table_name, COUNT(*) as record_count FROM standard
UNION ALL
SELECT 'standard_sections' as table_name, COUNT(*) as record_count FROM standard_sections
UNION ALL
SELECT 'standard_tables' as table_name, COUNT(*) as record_count FROM standard_tables
UNION ALL
SELECT 'standard_notes' as table_name, COUNT(*) as record_count FROM standard_notes
UNION ALL
SELECT 'standard_tags' as table_name, COUNT(*) as record_count FROM standard_tags
UNION ALL
SELECT 'compliance_requirements' as table_name, COUNT(*) as record_count FROM compliance_requirements
UNION ALL
SELECT 'educational_resources' as table_name, COUNT(*) as record_count FROM educational_resources; 