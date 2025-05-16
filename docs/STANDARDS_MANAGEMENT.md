# Standards Management Module

## Overview

The Standards Management module allows administrators to manage building standards, project standards, and compliance recommendations. These standards are used throughout the application to verify compliance with regulatory requirements.

## Features

- View, add, edit, and delete building standards
- View, add, edit, and delete project standards 
- View, add, edit, and delete compliance recommendations
- Import and export standards data
- Form validation to ensure data integrity

## Technical Implementation

### Data Format Standardization

The system handles data format transformation between the backend (snake_case) and frontend (camelCase) using utility functions:

```javascript
// client/src/utils/dataFormatters.js
export const snakeToCamel = (data) => { ... }
export const camelToSnake = (data) => { ... }
export const normalizeDataFormat = (data) => { ... }
```

These utilities ensure consistent data format regardless of the source, making the application more robust against API changes.

### API Services

The compliance service handles all API calls to manage standards:

```javascript
// client/src/services/complianceService.js
const complianceService = {
  getAllBuildingTypeStandards: async () => { ... },
  createBuildingTypeStandard: async (data) => { ... },
  updateBuildingTypeStandard: async (id, data) => { ... },
  deleteBuildingTypeStandard: async (id) => { ... },
  
  getAllProjectTypeStandards: async () => { ... },
  createProjectTypeStandard: async (data) => { ... },
  updateProjectTypeStandard: async (id, data) => { ... },
  deleteProjectTypeStandard: async (id) => { ... },
  
  getAllComplianceRecommendations: async () => { ... },
  createComplianceRecommendation: async (data) => { ... },
  updateComplianceRecommendation: async (id, data) => { ... },
  deleteComplianceRecommendation: async (id) => { ... },
}
```

### Database Structure

The standards are stored in three main tables:

1. `building_type_standards` - Standards associated with building types
2. `project_type_standards` - Standards associated with project types
3. `compliance_recommendations` - Recommendations for addressing non-compliance

## Data Schema

### Building Type Standards

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| building_type | String | Type of building |
| standard_type | String | Type of standard |
| standard_code | String | Reference code for the standard |
| minimum_value | Float | Minimum allowable value |
| maximum_value | Float | Maximum allowable value |
| unit | String | Unit of measurement |
| description | Text | Detailed description |

### Project Type Standards

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| project_type | String | Type of project |
| standard_type | String | Type of standard |
| standard_code | String | Reference code for the standard |
| minimum_value | Float | Minimum allowable value |
| maximum_value | Float | Maximum allowable value |
| unit | String | Unit of measurement |
| description | Text | Detailed description |

### Compliance Recommendations

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| rule_id | Integer | ID of the compliance rule |
| non_compliance_type | String | Type of non-compliance |
| recommendation_text | Text | Recommended action |
| priority | String | Priority level (high/medium/low) |
| calculator_type | String | Associated calculator type |

## Usage Guide

### Adding a New Standard

1. Navigate to the Standards Management page
2. Select the appropriate tab (Building Standards, Project Standards, or Recommendations)
3. Click "Add New"
4. Fill in the required fields
5. Click "Save"

### Editing a Standard

1. Navigate to the Standards Management page
2. Select the appropriate tab
3. Click the edit icon next to the standard you want to modify
4. Update the fields as needed
5. Click "Save"

### Deleting a Standard

1. Navigate to the Standards Management page
2. Select the appropriate tab
3. Click the delete icon next to the standard you want to remove
4. Confirm the deletion

### Importing/Exporting Standards

1. Navigate to the Standards Management page
2. Click "Import/Export"
3. For export: Click "Export Data" to download the current standards
4. For import: Paste JSON data in the provided field and click "Import"

## Future Enhancements

- Bulk import from CSV/Excel files
- Standard templates for common building and project types
- Version history for standards to track changes over time
- Standard categorization and tagging for easier search and filtering 