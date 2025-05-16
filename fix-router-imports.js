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
    
    // Check for default import of useHistory
    const defaultImportRegex = /import\s+useHistory\s+from\s+['"]react-router-dom['"]/;
    const hasDefaultImport = defaultImportRegex.test(content);
    
    if (hasDefaultImport) {
      console.log(`Fixing file: ${filePath}`);
      
      // Replace default import with named import
      content = content.replace(
        defaultImportRegex,
        "import { useHistory } from 'react-router-dom'"
      );
      
      // Write the fixed content back to the file
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
  
  console.log('Scanning for files with incorrect useHistory imports...');
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