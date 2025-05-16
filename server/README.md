# Energy Audit Platform - Server

This is the backend server for the Energy Audit Platform, providing API endpoints for calculator data, standards references, and report management.

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=8000
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_db_user
   DB_PASS=your_db_password
   DB_NAME=energyauditdb
   JWT_SECRET=your_secret_key
   JWT_EXPIRES_IN=1d
   ```

4. Set up the database:
   - Create a MySQL database named `energyauditdb`
   - Run the schema.sql file to create the necessary tables:
     ```bash
     mysql -u root -p energyauditdb < src/database/schema.sql
     ```

## Development

To set up the database and run seeders:

```bash
npm run dev
```

The server will automatically create tables and run seeders in development mode.

## Production

To build and run the server in production mode:
```bash
npm run build
npm start
```

## API Endpoints

### Standards API

#### Standard Endpoints
- `GET /api/standards` - Get all standards
- `GET /api/standards/:id` - Get a standard by ID
- `POST /api/standards` - Create a new standard (auth required)
- `GET /api/standards/:standardId/sections` - Get sections for a standard, optionally filtered by parent section
- `POST /api/standards/:standardId/sections` - Create a new section (auth required)

#### Section Endpoints
- `GET /api/sections/:id` - Get a section by ID with tables and figures
- `GET /api/search/sections` - Search sections by query
- `POST /api/sections/:sectionId/tables` - Add a table to a section (auth required)
- `POST /api/sections/:sectionId/figures` - Add a figure to a section (auth required)
- `POST /api/sections/:sectionId/requirements` - Add a compliance requirement (auth required)
- `POST /api/sections/:sectionId/resources` - Add an educational resource (auth required)

#### Resource Endpoints
- `GET /api/resources` - Get educational resources with optional filtering

#### User Interaction Endpoints
- `POST /api/bookmarks` - Add a bookmark (auth required)
- `DELETE /api/users/:userId/bookmarks/:sectionId` - Remove a bookmark (auth required)
- `GET /api/users/:userId/bookmarks` - Get all bookmarks for a user (auth required)
- `POST /api/notes` - Add a note (auth required)
- `PUT /api/notes/:id` - Update a note (auth required)
- `DELETE /api/notes/:id` - Delete a note (auth required)
- `GET /api/users/:userId/sections/:sectionId/notes` - Get all notes for a user on a section (auth required)

#### Special Lookup Endpoints
- `GET /api/lookup/illumination` - Look up illumination requirements by room type

### Report API

- `GET /api/reports` - Get all reports (auth required)
- `GET /api/reports/:id` - Get a report by ID (auth required)
- `POST /api/reports` - Create a new report (auth required)
- `PUT /api/reports/:id` - Update a report (auth required)
- `DELETE /api/reports/:id` - Delete a report (auth required)
- `POST /api/reports/:id/share` - Share a report with another user (auth required)
- `GET /api/reports/shared/list` - Get reports shared with the current user (auth required)

## Database Schema

### Standards Schema
- `standards` - Stores information about standards (e.g., PEC 2017)
- `standard_sections` - Sections and subsections of standards
- `standard_tables` - Tables within sections
- `standard_figures` - Figures within sections
- `standard_keywords` - Keywords for search functionality
- `section_keywords` - Many-to-many relationship between sections and keywords
- `compliance_requirements` - Compliance requirements linked to sections
- `educational_resources` - Educational resources linked to sections
- `standard_bookmarks` - User bookmarks for standards sections
- `standard_notes` - User notes on standard sections

### Reports Schema
- `reports` - Stores report metadata
- `report_sections` - Sections within reports
- `report_data` - Data associated with report sections
- `report_shares` - Tracks report sharing between users
- `report_comments` - Comments on reports
- `report_attachments` - Files attached to reports

## Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with hot reloading
- `npm run seed` - Run data seeders to populate the database
- `npm test` - Run tests
- `npm run lint` - Run linting

## API Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer your_jwt_token
```

## Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Testing

To run tests:
```bash
npm test
```

# Energy Audit Platform - Compliance Verification System

## Overview

The Compliance Verification System enables automatic checking of calculation results against applicable standards and codes. It provides:

1. **Standards-Based Verification**: Compare calculation results with appropriate industry standards
2. **Recommendations**: Get tailored recommendations for non-compliant results
3. **Tracking**: Store verification history for audits and compliance reporting
4. **Admin Interface**: Manage standards, rules, and recommendations

## Database Schema

The system uses the following tables:

### Main Tables

1. **standards**
   - Stores reference to original standard documents (e.g., PEC 2017)
   - Fields: `id`, `code_name`, `full_name`, `version`, `issuing_body`, `effective_date`, `description`

2. **building_type_standards**
   - Standards specific to building types (e.g., illumination levels for offices)
   - Fields: `id`, `building_type`, `standard_type`, `standard_code`, `minimum_value`, `maximum_value`, `unit`, `source_standard_id`, `description`

3. **project_type_standards**
   - Standards specific to project types (e.g., ROI for lighting retrofits)
   - Fields: `id`, `project_type`, `standard_type`, `standard_code`, `minimum_value`, `maximum_value`, `unit`, `source_standard_id`, `description`

4. **compliance_rules**
   - Rules for checking compliance (e.g., illumination must meet minimum levels)
   - Fields: `id`, `rule_code`, `title`, `description`, `severity`, `type`, `verification_method`, `evaluation_criteria`, `failure_impact`, `remediation_advice`, `active`

5. **compliance_recommendations**
   - Specific recommendations for non-compliant results
   - Fields: `id`, `rule_id`, `non_compliance_type`, `recommendation_text`, `priority`, `calculator_type`

6. **compliance_verifications**
   - Records of verification results
   - Fields: `id`, `calculation_id`, `user_id`, `result_data`, `compliant_count`, `non_compliant_count`, `status`

## API Endpoints

### Standards and Rules

#### Get Building Type Standards
- **GET** `/api/compliance/building-standards`
- **Query Params**: `buildingType` (required), `standardType` (optional)
- **Returns**: Array of standards for the specified building type

#### Get Project Type Standards
- **GET** `/api/compliance/project-standards`
- **Query Params**: `projectType` (required), `standardType` (optional)
- **Returns**: Array of standards for the specified project type

#### Get Applicable Rules
- **GET** `/api/compliance/rules`
- **Query Params**: `calculationType` (optional)
- **Returns**: Array of compliance rules

#### Get Recommendations
- **GET** `/api/compliance/recommendations`
- **Query Params**: `calculatorType` (optional), `nonComplianceType` (optional)
- **Returns**: Array of recommendations

### Verification

#### Verify Calculation
- **POST** `/api/compliance/verify-calculation`
- **Body**:
  ```json
  {
    "calculationId": "unique-id",
    "calculationType": "illumination|lpd|power_factor|roi|payback",
    "calculationData": { /* calculator-specific data */ },
    "buildingType": "office|classroom|hospital|etc",
    "projectType": "lighting_retrofit|hvac_upgrade|etc" (optional)
  }
  ```
- **Returns**: Verification results with compliance status and recommendations

#### Get Verification History
- **GET** `/api/compliance/verification-history`
- **Auth**: Required
- **Returns**: Array of past verifications for the authenticated user

## Setup and Configuration

### Installation

1. Ensure database tables are created:
   ```
   node src/scripts/setup-compliance.js
   ```

2. Test the API:
   ```
   node src/scripts/test-compliance-api.js
   ```

### Adding New Standards

To add new standards, use the admin interface or directly insert into the database:

```javascript
// Example: Add new building type standard
const newStandard = await BuildingTypeStandard.create({
  buildingType: 'hospital',
  standardType: 'illumination',
  standardCode: 'PEC1075-HOSPITAL-SURGERY',
  minimumValue: 1000,
  unit: 'lux',
  description: 'Illumination level for hospital surgery rooms',
  sourceStandardId: 1  // Reference to PEC 2017
});
```

## Verification Process

1. Client submits calculation data through API
2. Server retrieves applicable rules based on calculation type
3. Rules are processed against calculation data
4. Non-compliant results trigger recommendations
5. Complete verification results are returned and optionally saved

## Compliance Rules Implementation

The `Compliance.js` model handles verification logic:

```javascript
static async getRulesByType(calculationType) {
  // Get rules specific to calculation type
  // Returns array of matching rules
}

static async processComplianceRules(rules, calculationType, calculationData) {
  // Apply rules to calculation data
  // Return compliance status with recommendations
}
```

## Integration with Calculators

Calculators should call the verification API after completing calculations:

```javascript
// Example client-side code
async function verifyCalculation(calculationResult) {
  const response = await api.post('/compliance/verify-calculation', {
    calculationId: calculationResult.id,
    calculationType: 'illumination',
    calculationData: calculationResult.data,
    buildingType: calculationResult.buildingType
  });
  
  return response.data; // Verification results
}
```

## Admin Interface

The admin interface allows management of:

1. Standards by building and project type
2. Compliance rules
3. Recommendations
4. Verification results

## Troubleshooting

### Common Issues

1. **Missing Standards**: Ensure all required standards are seeded in the database
2. **Rule Mismatch**: Check that rules have the correct rule_code pattern (e.g., 'PEC-IL%')
3. **Database Connection**: Verify database credentials in .env file

### Validation

Use the validation script to check database setup:
```
node src/scripts/validate-compliance-tables.js
```

# Server for Energy Audit Application

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```
cp .env.example .env
```
Edit the `.env` file with your database credentials and other configuration.

## Database Setup

### Run Migrations

To create the database tables:

```bash
npx knex migrate:latest
```

### Run Seeders

To populate the database with initial data:

```bash
npx knex seed:run
```

If you want to run a specific seeder:

```bash
npx knex seed:run --specific=20230920000001_seed_standards.js
```

## Standards Management Tables

The application includes three tables for standards management:

1. **building_type_standards**: Standards related to building types (commercial, residential, etc.)
2. **project_type_standards**: Standards related to project types (lighting retrofit, HVAC upgrade, etc.)
3. **compliance_recommendations**: Recommendations for addressing non-compliance with standards

### Running Migrations for Standards Tables

To create just the standards tables:

```bash
npx knex migrate:up 20230920000001_create_building_type_standards.js
npx knex migrate:up 20230920000002_create_project_type_standards.js
npx knex migrate:up 20230920000003_create_compliance_recommendations.js
```

## API Endpoints

### Building Type Standards

- `GET /api/compliance/building-standards/all` - Get all building type standards
- `GET /api/compliance/building-standards?buildingType=commercial` - Get standards for a specific building type
- `POST /api/compliance/building-standards` - Create a new building type standard
- `PUT /api/compliance/building-standards/:id` - Update a building type standard
- `DELETE /api/compliance/building-standards/:id` - Delete a building type standard

### Project Type Standards

- `GET /api/compliance/project-standards/all` - Get all project type standards
- `GET /api/compliance/project-standards?projectType=lighting_retrofit` - Get standards for a specific project type
- `POST /api/compliance/project-standards` - Create a new project type standard
- `PUT /api/compliance/project-standards/:id` - Update a project type standard
- `DELETE /api/compliance/project-standards/:id` - Delete a project type standard

### Compliance Recommendations

- `GET /api/compliance/recommendations/all` - Get all compliance recommendations
- `GET /api/compliance/recommendations?calculatorType=lighting` - Get recommendations by criteria
- `POST /api/compliance/recommendations` - Create a new compliance recommendation
- `PUT /api/compliance/recommendations/:id` - Update a compliance recommendation
- `DELETE /api/compliance/recommendations/:id` - Delete a compliance recommendation

## Development

Start the development server:

```bash
npm run dev
```

This will start the server with nodemon for automatic reloading during development. 