# Database Duplicate Prevention System

This document describes the duplicate prevention system implemented in the Energy Audit application to prevent database duplication issues.

## Overview

The system uses multiple strategies to prevent duplicates:

1. **Database constraints** - Unique constraints are added to database tables
2. **Model validation** - Data layer checks for duplicates before insertion
3. **Seeder safety** - Seed scripts check for existing records before insertion

## Implementation Details

### 1. Database Constraints

The following tables have unique constraints:

- `standards`: `unique_standard` constraint on `(code_name, version)`
- `standard_sections`: `unique_standard_section` constraint on `(standard_id, section_number)`
- `standard_tables`: `unique_standard_table` constraint on `(section_id, table_number)`
- `standard_figures`: `unique_standard_figure` constraint on `(section_id, figure_number)`
- `compliance_requirements`: `unique_compliance_requirement` constraint on `(section_id, description(255))`
- `educational_resources`: `unique_educational_resource` constraint on `(section_id, url(255))`
- `standard_notes`: `unique_standard_note` constraint on `(user_id, section_id, note_text(255))`

These constraints are automatically added during server startup via the `preventDuplicates.js` script.

### 2. Model Validation

The `Standard.js` model class includes duplicate prevention in methods like:

- `create()` - Checks for existing standards by code_name and version
- `addSection()` - Checks for existing sections by standard_id and section_number
- `addTable()` - Checks for existing tables by section_id and table_number
- `addFigure()` - Checks for existing figures by section_id and figure_number
- `addComplianceRequirement()` - Checks for existing requirements by section_id and description
- `addResource()` - Checks for existing resources by section_id and url
- `addNote()` - Checks for existing notes by user_id, section_id, and note_text

When a duplicate is detected, these methods return the existing record's ID instead of inserting a new record.

### 3. Seeder Safety

Database seeders in `src/database/seeders/` check for existing records before insertion, using:

- `ON DUPLICATE KEY UPDATE` clauses for tables with unique constraints
- Explicit SELECT queries to check for duplicates before insertion
- Skipping insertion when duplicates are found

## Utility Scripts

- `npm run prevent-duplicates` - Manually run the preventDuplicates script
- `npm run fix-duplicates` - Fix existing duplicates in the database

## How to Fix Duplication Issues

If you encounter duplication issues:

1. Run `npm run fix-duplicates` to clean up existing duplicates
2. If issues persist, check the specific error message for which constraint is failing
3. Modify the affected seeder to handle duplicates correctly
4. Review any custom data insertion code to ensure it checks for duplicates

## Troubleshooting

If you see errors like `Duplicate entry '...' for key '...'`, it means the unique constraint is working correctly but your code is trying to insert a duplicate. Update your code to check for existing records before insertion.

For additional help, please contact the development team. 