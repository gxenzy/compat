const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Regular expressions to match against
const routerImportsV6Regex = /import\s+{?\s*(?:useNavigate|Navigate|Routes|Outlet|NavigateFunction)(?:\s*,\s*[\w\s{}]+)?\s*}?\s+from\s+['"]react-router-dom['"]/g;
const importWithoutBracesRegex = /import\s+(\w+,\s*\w+|\w+\s*,\s*\w+)\s+from\s+['"]react-router-dom['"]/g;
const navigateCallRegex = /\b(navigate\()/g;
const routesElementRegex = /<Route[^>]*\s+element={/g;
const navigateRedirectRegex = /<Navigate\s+to=['"](.*?)['"]\s*(?:replace\s*)?\/>/g;
const useParamsTypeRegex = /useParams<\s*{\s*(\w+):\s*string(?:\s*;\s*)*\s*}>/g;

// Replacement templates
const fixedRouterImport = (match) => {
  // Replace useNavigate with useHistory
  match = match.replace(/useNavigate/g, 'useHistory');
  // Replace NavigateFunction with History
  match = match.replace(/NavigateFunction/g, 'History');
  // Replace Routes with Switch
  match = match.replace(/Routes/g, 'Switch');
  // Replace Navigate with Redirect
  match = match.replace(/Navigate/g, 'Redirect');
  // Remove Outlet
  match = match.replace(/,\s*Outlet/g, '');
  match = match.replace(/Outlet,\s*/g, '');
  match = match.replace(/Outlet/g, '');
  
  return match;
};

// Function to fix issues with imports missing curly braces
const fixImportWithoutBraces = (match) => {
  // Get the imports
  const importNames = match.replace(/import\s+/, '')
    .replace(/\s+from\s+['"]react-router-dom['"]/, '')
    .trim();
  
  // Return the fixed import with proper syntax
  return `import { ${importNames} } from 'react-router-dom'`;
};

// Function to fix navigate calls
const fixNavigateCall = (match) => {
  return 'history.push(';
};

// Function to fix Route elements
const fixRouteElement = (match) => {
  return match.replace('element={', 'component={() => ');
};

// Function to fix Navigate component to Redirect
const fixNavigateRedirect = (match, path) => {
  return `<Redirect to="${path}" />`;
};

// Function to process a file
const processFile = (filepath) => {
  try {
    let fileContent = fs.readFileSync(filepath, 'utf-8');
    const originalContent = fileContent;
    
    // Fix router imports
    fileContent = fileContent.replace(routerImportsV6Regex, fixedRouterImport);
    
    // Fix imports without curly braces
    fileContent = fileContent.replace(importWithoutBracesRegex, fixImportWithoutBraces);
    
    // Fix navigate calls
    fileContent = fileContent.replace(navigateCallRegex, fixNavigateCall);
    
    // Fix Route elements
    fileContent = fileContent.replace(routesElementRegex, fixRouteElement);
    
    // Fix Navigate redirects
    fileContent = fileContent.replace(navigateRedirectRegex, fixNavigateRedirect);
    
    // Replace all 'useHistory()' references with proper declaration
    fileContent = fileContent.replace(/const history = useHistory\(\)/g, 'const history = useHistory()');

    // Fix the useLocation used without proper import
    fileContent = fileContent.replace(/const location = useLocation\(\)/g, 'const location = useLocation()');
    
    // Replace all standalone 'navigate' references with 'history.push'
    fileContent = fileContent.replace(/\bnavigate\b(?!\s*=\s*useNavigate|\s*\(|\s*\{|\s*\)|["'])/g, 'history.push');
    
    // Only write back if content changed
    if (fileContent !== originalContent) {
      fs.writeFileSync(filepath, fileContent, 'utf-8');
      console.log(`Updated: ${filepath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing file ${filepath}:`, error);
    return false;
  }
};

// Function to recursively find and process TypeScript/JavaScript files
const processFiles = () => {
  const files = glob.sync('./client/src/**/*.{ts,tsx,js,jsx}');
  let totalUpdated = 0;
  
  files.forEach(file => {
    const updated = processFile(file);
    if (updated) totalUpdated++;
  });
  
  console.log(`Finished processing ${files.length} files. Updated ${totalUpdated} files.`);
};

// Run the script
processFiles(); 