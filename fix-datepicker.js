const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Regular expressions to match DatePicker issues
const renderInputRegex = /renderInput={[^}]+}/g;
const inputFormatRegex = /inputFormat=["'][^"']+["']/g;

// Function to fix DatePicker issues
const fixDatePickerIssues = (fileContent) => {
  // Fix renderInput prop
  fileContent = fileContent.replace(renderInputRegex, (match) => {
    // Extract the parameter name used in the lambda
    const paramMatch = match.match(/renderInput={\([^)]+\)|\(([^)]+)\)|\s*([a-zA-Z0-9_]+)\s*=>/);
    const paramName = paramMatch ? (paramMatch[1] || paramMatch[2] || 'params') : 'params';
    
    // Replace with slotProps syntax
    return `slotProps={{ textField: ${paramName} => ({ ...${paramName}, size: 'small' }) }}`;
  });
  
  // Fix inputFormat prop
  fileContent = fileContent.replace(inputFormatRegex, (match) => {
    // Replace with format prop
    return match.replace('inputFormat=', 'format=');
  });
  
  return fileContent;
};

// Function to process a file
const processFile = (filepath) => {
  try {
    let fileContent = fs.readFileSync(filepath, 'utf-8');
    const originalContent = fileContent;
    
    // Apply the fixes
    fileContent = fixDatePickerIssues(fileContent);
    
    // Only write back if content changed
    if (fileContent !== originalContent) {
      fs.writeFileSync(filepath, fileContent, 'utf-8');
      console.log(`Updated DatePicker in: ${filepath}`);
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
  
  console.log(`Finished processing ${files.length} files. Updated ${totalUpdated} files for DatePicker issues.`);
};

// Run the script
processFiles(); 