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

// Function to fix router issues in a file
function fixFileIssues(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix import issues - convert default imports to named imports
    const patterns = [
      { regex: /import\s+useHistory\s+from\s+['"]react-router-dom['"]/g, replacement: "import { useHistory } from 'react-router-dom'" },
      { regex: /import\s+useLocation\s+from\s+['"]react-router-dom['"]/g, replacement: "import { useLocation } from 'react-router-dom'" },
      { regex: /import\s+useParams\s+from\s+['"]react-router-dom['"]/g, replacement: "import { useParams } from 'react-router-dom'" },
      { regex: /import\s+useRouteMatch\s+from\s+['"]react-router-dom['"]/g, replacement: "import { useRouteMatch } from 'react-router-dom'" },
      { regex: /import\s+Switch\s+from\s+['"]react-router-dom['"]/g, replacement: "import { Switch } from 'react-router-dom'" },
      { regex: /import\s+Route\s+from\s+['"]react-router-dom['"]/g, replacement: "import { Route } from 'react-router-dom'" },
      { regex: /import\s+Link\s+from\s+['"]react-router-dom['"]/g, replacement: "import { Link } from 'react-router-dom'" },
      { regex: /import\s+NavLink\s+from\s+['"]react-router-dom['"]/g, replacement: "import { NavLink } from 'react-router-dom'" },
      { regex: /import\s+Redirect\s+from\s+['"]react-router-dom['"]/g, replacement: "import { Redirect } from 'react-router-dom'" },
      { regex: /import\s+BrowserRouter\s+from\s+['"]react-router-dom['"]/g, replacement: "import { BrowserRouter } from 'react-router-dom'" },
      { regex: /import\s+withRouter\s+from\s+['"]react-router-dom['"]/g, replacement: "import { withRouter } from 'react-router-dom'" }
    ];
    
    patterns.forEach(pattern => {
      if (pattern.regex.test(content)) {
        console.log(`Fixing ${pattern.regex.source} in: ${filePath}`);
        content = content.replace(pattern.regex, pattern.replacement);
        modified = true;
      }
    });
    
    // Fix useNavigate (React Router v6) to useHistory (React Router v5)
    if (content.includes('useNavigate')) {
      console.log(`Fixing useNavigate in: ${filePath}`);
      
      // Replace import statement
      content = content.replace(
        /import\s+\{\s*(\w+,\s*)*(useNavigate)(\s*,\s*\w+)*\s*\}\s*from\s+['"]react-router-dom['"]/g,
        (match) => match.replace('useNavigate', 'useHistory')
      );
      
      // Replace hook usage
      content = content.replace(
        /const\s+navigate\s*=\s*useNavigate\(\);/g,
        'const history = useHistory();'
      );
      
      // Replace navigate calls with history.push
      content = content.replace(
        /navigate\(['"]([^'"]+)['"](,\s*\{[^}]*\})?\)/g,
        "history.push('$1')"
      );
      
      modified = true;
    }
    
    // Fix React Router v6 Routes component to v5 Switch
    if (content.includes('<Routes>')) {
      console.log(`Fixing Routes to Switch in: ${filePath}`);
      
      // Update import
      content = content.replace(
        /import\s+\{\s*(\w+,\s*)*Routes(\s*,\s*\w+)*\s*\}\s*from\s+['"]react-router-dom['"]/g,
        (match) => match.replace('Routes', 'Switch')
      );
      
      // Update component usage
      content = content.replace(/<Routes>/g, '<Switch>');
      content = content.replace(/<\/Routes>/g, '</Switch>');
      
      modified = true;
    }
    
    // Fix Route element prop (v6) to component prop (v5)
    if (content.includes('element={')) {
      console.log(`Fixing Route element prop to component prop in: ${filePath}`);
      
      content = content.replace(
        /<Route\s+([^>]*?)element=\{([^}]+)\}([^>]*?)>/g,
        '<Route $1component={$2}$3>'
      );
      
      modified = true;
    }
    
    // Fix outlet usage - this is more complex and might need manual intervention
    if (content.includes('<Outlet') || content.includes('useOutlet')) {
      console.log(`WARNING: Outlet usage detected in ${filePath} - this might need manual fixing`);
    }
    
    // Remove 'future' prop from BrowserRouter as it doesn't exist in v5
    if (content.includes('future={')) {
      console.log(`Removing future prop from BrowserRouter in: ${filePath}`);
      
      content = content.replace(
        /future=\{[^}]+\}/g,
        ''
      );
      
      modified = true;
    }
    
    // Write changes back to file
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
  
  console.log('Scanning for React Router v5/v6 compatibility issues...');
  const files = findFiles(srcDir, extensions);
  
  console.log(`Found ${files.length} files to check.`);
  
  let fixedCount = 0;
  
  files.forEach(file => {
    if (fixFileIssues(file)) {
      fixedCount++;
    }
  });
  
  console.log(`Fixed ${fixedCount} files.`);
  console.log('Note: Some complex issues like <Outlet /> usage might need manual intervention.');
}

main(); 