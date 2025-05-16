const fs = require('fs');
const path = require('path');

// Function to recursively find files
function findFiles(dir, extensions) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively search directories
      results = results.concat(findFiles(filePath, extensions));
    } else {
      // Check if the file has one of the specified extensions
      const ext = path.extname(file).toLowerCase();
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

// Function to fix imports in a file
function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix useHistory import
    const useHistoryImportRegex = /import\s+(\{[\s\S]*?)?\s*useHistory\s*(\}.*?)?\s*from\s+['"]react-router-dom['"]/g;
    if (useHistoryImportRegex.test(content)) {
      console.log(`Fixing useHistory in: ${filePath}`);
      
      // Replace with proper named import
      content = content.replace(
        useHistoryImportRegex, 
        (match) => {
          // If it's already a named import, return as is
          if (match.includes('{') && match.includes('}')) {
            return match;
          }
          
          // Otherwise convert to named import
          return "import { useHistory } from 'react-router-dom'";
        }
      );
      
      modified = true;
    }
    
    // Fix Redirect import
    const redirectImportRegex = /import\s+Redirect\s+from\s+['"]react-router-dom['"]/g;
    if (redirectImportRegex.test(content)) {
      console.log(`Fixing Redirect in: ${filePath}`);
      
      // Replace with named import
      content = content.replace(
        redirectImportRegex,
        "import { Redirect } from 'react-router-dom'"
      );
      
      modified = true;
    }
    
    // Fix useLocation import
    const useLocationImportRegex = /import\s+useLocation\s+from\s+['"]react-router-dom['"]/g;
    if (useLocationImportRegex.test(content)) {
      console.log(`Fixing useLocation in: ${filePath}`);
      
      // Replace with named import
      content = content.replace(
        useLocationImportRegex,
        "import { useLocation } from 'react-router-dom'"
      );
      
      modified = true;
    }
    
    // Fix useParams import
    const useParamsImportRegex = /import\s+useParams\s+from\s+['"]react-router-dom['"]/g;
    if (useParamsImportRegex.test(content)) {
      console.log(`Fixing useParams in: ${filePath}`);
      
      // Replace with named import
      content = content.replace(
        useParamsImportRegex,
        "import { useParams } from 'react-router-dom'"
      );
      
      modified = true;
    }
    
    // Fix useRouteMatch import
    const useRouteMatchImportRegex = /import\s+useRouteMatch\s+from\s+['"]react-router-dom['"]/g;
    if (useRouteMatchImportRegex.test(content)) {
      console.log(`Fixing useRouteMatch in: ${filePath}`);
      
      // Replace with named import
      content = content.replace(
        useRouteMatchImportRegex,
        "import { useRouteMatch } from 'react-router-dom'"
      );
      
      modified = true;
    }
    
    // Fix Route import
    const routeImportRegex = /import\s+Route\s+from\s+['"]react-router-dom['"]/g;
    if (routeImportRegex.test(content)) {
      console.log(`Fixing Route in: ${filePath}`);
      
      // Replace with named import
      content = content.replace(
        routeImportRegex,
        "import { Route } from 'react-router-dom'"
      );
      
      modified = true;
    }
    
    // Fix Switch import
    const switchImportRegex = /import\s+Switch\s+from\s+['"]react-router-dom['"]/g;
    if (switchImportRegex.test(content)) {
      console.log(`Fixing Switch in: ${filePath}`);
      
      // Replace with named import
      content = content.replace(
        switchImportRegex,
        "import { Switch } from 'react-router-dom'"
      );
      
      modified = true;
    }
    
    // Fix Link import
    const linkImportRegex = /import\s+Link\s+from\s+['"]react-router-dom['"]/g;
    if (linkImportRegex.test(content)) {
      console.log(`Fixing Link in: ${filePath}`);
      
      // Replace with named import
      content = content.replace(
        linkImportRegex,
        "import { Link } from 'react-router-dom'"
      );
      
      modified = true;
    }

    // If using useNavigate in v5 project, replace with useHistory
    if (content.includes('useNavigate')) {
      console.log(`Fixing useNavigate in: ${filePath}`);
      
      // Replace useNavigate import with useHistory
      content = content.replace(
        /import\s+\{\s*(\w+,\s*)*(useNavigate)(\s*,\s*\w+)*\s*\}\s*from\s+['"]react-router-dom['"]/g,
        (match) => {
          return match.replace('useNavigate', 'useHistory');
        }
      );
      
      // Replace direct usage of useNavigate() with useHistory()
      content = content.replace(
        /const\s+navigate\s*=\s*useNavigate\(\);/g,
        'const history = useHistory();'
      );
      
      // Replace navigate('/path') with history.push('/path')
      content = content.replace(
        /navigate\(['"]([^'"]+)['"](,\s*\{[^}]*\})?\)/g,
        "history.push('$1')"
      );
      
      modified = true;
    }
    
    // Write the fixed content back to the file
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return false;
  }
}

// Main function
function main() {
  const srcDir = path.join(__dirname, 'client', 'src');
  const extensions = ['.js', '.jsx', '.ts', '.tsx'];
  
  console.log('Scanning for files with incorrect router imports...');
  const files = findFiles(srcDir, extensions);
  
  console.log(`Found ${files.length} files to check.`);
  
  let fixedCount = 0;
  
  files.forEach(file => {
    if (fixImportsInFile(file)) {
      fixedCount++;
    }
  });
  
  console.log(`Fixed ${fixedCount} files.`);
}

main(); 