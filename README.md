# Energy Audit Platform

Energy Audit Platform is a web-based application for conducting comprehensive energy audits, with a focus on calculations, standards references, and manual values.

## Features

### 1. Calculation Tools
- Energy consumption calculators (lighting, HVAC, equipment)
- Power quality analysis tools (power factor, harmonic distortion)
- Voltage regulation and conductor sizing tools
- Illumination level calculators
- ROI and financial calculators
- Batch calculation support for multiple scenario analysis

### 2. Standards Reference System
- Philippine Electrical Code (PEC) 2017 searchable database
- Illumination requirements lookup by room type
- Standards compliance checking
- Educational resources and annotations
- Tag-based filtering and organization
- Full-text search with advanced filtering options

### 3. Report Management
- Report generation for energy audit findings
- PDF export with charts and tables
- Collaborative editing and comments
- Report templates and customization

## Recent Implementations

### Advanced Reporting Integration
- Implemented comprehensive integrated reporting system for Schedule of Loads and Voltage Drop Analysis
- Professional PDF reports with company branding and customization options
- Table of contents with automatic page references
- Multiple report sections including:
  - Schedule of Loads analysis with circuit details
  - Voltage Drop compliance visualization
  - Circuit optimization recommendations
  - Power consumption analysis with cost estimates
- Customizable report generation through intuitive UI
- Support for company logos and corporate branding
- Role-based report templates for different user needs

### Voltage Regulation Calculator
- Implemented comprehensive Voltage Regulation Calculator based on PEC 2017 Section 2.30
- Calculate voltage drop and power losses in electrical circuits
- Support for different conductor types, materials, and configurations
- Automatic conductor size optimization for compliance
- Detailed recommendations for improving non-compliant circuits
- Educational reference information on voltage regulation standards
- Interactive voltage profile visualization along conductor length
- Conductor size comparison visualization for optimal selection

### Batch Calculation Feature
- Implemented for Harmonic Distortion Calculator
- Run multiple calculation scenarios in parallel
- Compare results side-by-side to identify optimal solutions
- Save all results at once for further analysis
- Supports IEEE 519-2014 standards compliance for all scenarios

### Standards Reference System
- Implemented database schema for standards, sections, tables, and figures
- Created API endpoints for accessing standards content
- Built illumination requirements lookup tool with PEC 2017
- Integrated with calculator components for standards compliance
- Added comprehensive tag management system
- Implemented full-text search with tag-based filtering
- Enhanced error handling across the application

### Illumination Level Calculator
- Enhanced with standards-based requirements lookup
- Added real-time validation and detailed recommendations
- Improved calculation accuracy with environment factors
- Added compliance status based on PEC 2017 Rule 1075

### Circuit Synchronization System (75% Complete)

We've implemented a robust circuit data synchronization system to maintain consistency between the Voltage Drop Calculator and Schedule of Loads Calculator:

1. **Core Infrastructure**
   - CircuitSynchronizationContext for shared state management
   - Event-based notification system for data changes
   - Bidirectional data conversion between calculators
   - Auto-sync capabilities with manual override
   - Conflict detection algorithm

2. **User Interface**
   - SynchronizationPanel with status indicators and controls
   - Conflict resolution dialog for handling data inconsistencies
   - SyncHistoryDialog for tracking synchronization events
   - Settings dialog for configuration

3. **Integration**
   - Fully integrated with Voltage Drop Calculator
   - Schedule of Loads integration pending (next priority)

This system ensures that circuit design decisions made in one calculator are automatically reflected in the other, improving workflow efficiency and data consistency across the platform.

## Next Steps

1. Complete Schedule of Loads integration
2. Enhance the history tracking system
3. Improve conflict detection and resolution
4. Add comprehensive documentation and testing

## Getting Started

### Prerequisites
- Node.js 14+
- MySQL 8.0+

### Installation
1. Clone the repository
2. Install dependencies with `npm run install-all`
3. Configure database settings by running `npm run setup:db`
4. Verify database connection with `npm run verify:db`
5. Run migrations with `npm run migrate`
6. Start the server with `npm run server`
7. Start the client with `npm run client`

### Database Configuration
The application uses MySQL for data storage. You can configure the database connection in two ways:

1. **Using the Setup Script:**
   ```
   npm run setup:db
   ```
   This interactive script will prompt you for database credentials and save them to the `.env` file.

2. **Manual Configuration:**
   Create or edit the `.env` file in the project root with the following variables:
   ```
   PORT=8000
   NODE_ENV=development
   DB_HOST=localhost
   DB_USER=sdmi
   DB_PASS=SMD1SQLADM1N
   DB_NAME=energyauditdb
   JWT_SECRET=your_secret_key
   CORS_ORIGIN=http://localhost:3000
   ```

### Database Verification and Troubleshooting
You can verify your database connection by running:
```
npm run verify:db
```

This script will:
1. Test the connection to your MySQL server
2. Check if the specified database exists
3. Offer to create the database if it doesn't exist
4. Check for existing tables

Common database issues and solutions:

| Issue | Solution |
|-------|----------|
| Access denied error | Check your username and password in `.env` file |
| Connection refused | Make sure MySQL is running on the specified host and port |
| Database doesn't exist | Run `npm run verify:db` to create it |
| Migration errors | Check the migration files in `server/src/database/migrations` |

### Running Migrations
To set up or update the database schema, run:
```
npm run migrate
```

To roll back migrations:
```
npm run migrate:down
```

## Development Roadmap

### Phase 1: Core Framework (Completed)
- Basic calculation tools
- Standards database structure
- Authentication system

### Phase 2: Enhanced Features (In Progress)
- Complete standards reference system
- Advanced calculation modules
- Report management system

### Phase 3: Future Enhancements (Planned)
- Building profile management
- Mobile field data collection
- AI-powered analysis

## Overview
A modern, educational, and user-friendly Energy Audit system for the University of Cebu-Lapu-Lapu and Mandaue (UCLM), focused on manual inspection, reference-driven learning, and role-based access for students, faculty, maintenance, and admin.

---

## Implementation Roadmap

### Phase 1: Foundation
- [x] User authentication and role management
- [x] Main dashboard and navigation
- [x] Standards reference library (basic)

### Phase 2: Core Audit Tools
- [x] Energy Audit Wizard (manual, reference-driven)
  - [x] Lighting inspection checklist with PEC 2017/EMH references
  - [x] HVAC inspection checklist with ASHRAE references
  - [x] Building envelope inspection checklist with energy code references
  - [x] Educational tooltips and explanations for each item
  - [x] Evidence upload and note-taking capabilities
  - [x] Comprehensive PDF/CSV reporting with checklist data
- [ ] Calculators suite (reference-based, no mock data)
- [x] Electrical inspection checklists (from reference material)
  - [x] PEC 2017-based electrical inspection items
  - [x] Category-based organization (General, Distribution Panels, Wiring, etc.)
  - [x] Progress tracking by category
  - [x] Filtering by completion status and category
  - [x] PDF/CSV export with completion data

### Phase 3: Learning & Reporting
- [ ] Learning Center (resources, tutorials, guides)
- [ ] Interactive data visualization
- [ ] Recommendation engine
- [ ] Audit history & comparison

### Phase 4: Advanced Features
- [ ] Building visualization (3D/2D)
- [ ] Mobile-friendly field data collection
- [ ] AI-assisted audit recommendations
- [ ] Integration with school facility management

---

## Progress Tracker

| Feature | Status | Notes |
|---------|--------|-------|
| User Authentication | ✅ Complete | Role-based access implemented |
| Energy Audit Wizard | ✅ Complete | Educational checklists with references |
| Findings Management | ✅ Complete | Create, track, and approve findings |
| Standards Reference | ✅ Complete | PEC 2017 with tagging and advanced search |
| Electrical Inspection | ✅ Complete | PEC 2017-based checklist with categories |
| Calculators | 🔄 In Progress | Energy calculations with educational components |
| Voltage Regulation | ✅ Complete | PEC 2017 Section 2.30 compliance calculator |
| Learning Center | 📅 Planned | Educational resources |
| Reporting | ✅ Complete | PDF, CSV with checklist data |
| Admin Tools | ✅ Complete | User management, workflow config, tag management |

---

## Current Focus

**Implementing the Calculators Module**
- Energy load calculators
- ROI/payback period tools
- Electrical system calculators
- ✅ Voltage Regulation Calculator
- ✅ Harmonic Distortion Calculator with visualizations

---

## Technical Stack
- Frontend: React with Material-UI
- Backend: Node.js with Express
- Database: MongoDB
- Authentication: JWT
- Reporting: PDF/CSV generation

---

## Educational Components
The system emphasizes learning through:
- Reference-driven checklists with standards citations
- Educational tooltips and explanations
- Real-world calculation methods
- Standards compliance checking
- Guided audit workflows

---

## For Developers
See the documentation in `/docs` for setup instructions and contribution guidelines.

## Installation and Setup
```sh
npm install
npm run dev
```

## Usage
Navigate to the Energy Audit module in the application to access the various components and tools.

## Building Visualization Module

The Building Visualization module provides tools for displaying and analyzing floor plans with room detection capabilities.

### Features

- Automatic room detection using enhanced image processing
- Integration with Schedule of Loads (SOL) data
- Energy consumption analysis
- Lighting simulation with compliance checking
- Interactive room editing

### Advanced Room Detection Technology

The system now incorporates a multi-layered approach to room detection:

1. **Neural Network Detection**: State-of-the-art deep learning models identify rooms even in complex floor plans
2. **Traditional Computer Vision Processing**: Enhanced image segmentation as a reliable fallback
3. **Adaptive Learning System**: Improves accuracy by learning from corrections and prior successful detections

The neural network model uses semantic segmentation to detect:
- Room boundaries and walls
- Doors and windows
- Room types based on layout patterns
- Text elements to be excluded from detection

### Adaptive Learning for Room Detection

The system includes an adaptive learning mechanism that improves detection accuracy over time:

1. **Learning Process**: When users apply detected rooms, the system saves high-confidence detections as reference data
2. **Application**: Future detection attempts use previous successful detections to improve accuracy
3. **Pattern Recognition**: The system matches detected rooms to known room patterns based on position and characteristics
4. **Critical Thinking**: The system can identify when the current detection misses rooms that should be present
5. **Statistical Analysis**: Pattern consistency analysis determines which room patterns are most reliable
6. **Continuous Improvement**: Detection quality improves with each successful correction

### Using the Room Detection Feature

1. Select a floor from the dropdown
2. Choose either "Lighting" or "Power" view mode
3. Click "Detect" to run automatic room detection
4. Review detected rooms and make any manual adjustments
5. Click "Apply" to confirm room detection and train the model
6. Use the room editor to refine room properties

### Manual Editing Features

- Click on a room to select it
- Use the edit mode to move and resize rooms
- Add new rooms with the "Add Room" button
- Customize room properties in the Room Editor dialog

## Accessibility Features

The application provides several accessibility features to ensure it can be used by as many people as possible:

### High Contrast Mode
- Global toggle in accessibility settings
- Enhanced contrast for charts and UI elements
- Pattern fills for better distinction between chart elements
- Optimized for screen readers and keyboard navigation

### Color Blindness Simulation
- Simulates 8 different types of color vision deficiencies
- Helps developers understand how users with color blindness see the application
- Provides accessible color palettes optimized for different types of color blindness
- Visual demonstrations in the color blindness demo page
- Accessible charts with improved color schemes

### Keyboard Navigation
- Full keyboard navigation support for all interactive elements
- Enhanced keyboard support for charts with arrow key navigation
- Focus indicators for keyboard users
- Skip links for better keyboard accessibility

### Screen Reader Support
- Semantic HTML structure for better screen reader usage
- ARIA labels for all interactive elements
- Alternative text for all images and charts
- Data tables as alternatives to visual charts

### Accessibility Testing
- Built-in accessibility testing tools
- Automated accessibility testing with axe-core
- Visual indicators for accessibility issues
- Recommendations for fixing accessibility problems
# compat
