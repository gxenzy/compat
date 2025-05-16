# Energy Audit Platform - Client

This is the frontend client for the Energy Audit Platform, built with React, TypeScript, and Material-UI.

## Report Management System

The platform includes a comprehensive Report Management System with the following features:

### Core Functionality
- Create, edit, view, and share reports for various audit types
- Generate PDF exports of reports with all content types
- Select from pre-defined templates for quick report creation
- Add custom company branding and cover pages

### Report Content Types
- Rich text content with formatting
- Tables with custom headers and data
- Charts for data visualization (bar, line, pie, etc.)
- Images with captions
- Section headers and page breaks

### Sharing and Collaboration
- Share reports with specific users with different permission levels
- Generate public links for external sharing
- Revoke access when no longer needed
- Set reports as public/private

### PDF Export
- Export reports to PDF format for distribution
- Include company branding and metadata
- Support for all content types including tables, charts, and images
- Proper pagination and table of contents

### Accessibility Features
- ARIA attributes for screen reader support
- Keyboard navigation for all interactive elements
- Focus management for modals and dialogs
- Color contrast optimized for better visibility

## Development Setup for Windows

Due to ESM module resolution issues with MUI packages in the current webpack/React configuration, follow these steps to resolve the problems:

### Option 1: Fix Current Setup
1. Delete the node_modules folder:
```powershell
Remove-Item node_modules -Recurse -Force
```

2. Downgrade MUI packages to compatible versions:
```bash
npm install --save @mui/material@5.6.4 @mui/icons-material@5.6.4 @mui/system@5.6.4 @mui/styles@5.6.4 @mui/utils@5.6.4 @mui/x-data-grid@5.10.0 @emotion/react@11.9.0 @emotion/styled@11.8.1
```

3. Use the alternate start script:
```bash
npm run start:direct
```

### Option 2: Create a Clean Installation
If you continue to experience issues with the current setup, you can create a fresh React application to connect to the existing API:

1. Create a new React app outside this folder:
```bash
npx create-react-app energy-audit-new --template typescript
```

2. Install required dependencies:
```bash
cd energy-audit-new
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled axios react-router-dom
```

3. Copy the src files from this project to your new project
4. Update the API URL in the services to point to the correct backend

## Environment Variables

- `REACT_APP_API_URL`: API server URL (default: http://localhost:8000/api)
- `WDS_SOCKET_HOST`: WebSocket host for development (default: localhost)
- `DANGEROUSLY_DISABLE_HOST_CHECK`: Set to true to disable host header checking

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.

### `npm run start:direct`

Starts dev server using webpack.config.js

### `npm run start:rewired`

Starts dev server with react-app-rewired

### `npm run eject`

Ejects from create-react-app

## Learn More

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app). 