const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

// Logs with colors
const log = {
  info: (msg) => console.log(`${colors.cyan}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

// Helper function to run commands safely
function runCommand(command, cwd = null) {
  try {
    log.info(`Running: ${command}`);
    const options = { stdio: 'inherit' };
    if (cwd) options.cwd = cwd;
    execSync(command, options);
    return true;
  } catch (error) {
    log.error(`Command failed: ${command}`);
    log.error(error.message);
    return false;
  }
}

// Check if package-lock.json is up to date with package.json
function isPackageLockUpToDate(directory) {
  try {
    const packageJsonPath = path.join(directory, 'package.json');
    const packageLockPath = path.join(directory, 'package-lock.json');
    
    if (!fs.existsSync(packageLockPath)) return false;
    
    const packageJsonStat = fs.statSync(packageJsonPath);
    const packageLockStat = fs.statSync(packageLockPath);
    
    return packageLockStat.mtime >= packageJsonStat.mtime;
  } catch (error) {
    log.warn(`Could not check package-lock.json in ${directory}: ${error.message}`);
    return false;
  }
}

// Ensure node_modules is up to date
function ensureNodeModules(directory, force = false) {
  const nodeModulesPath = path.join(directory, 'node_modules');
  const packageJsonPath = path.join(directory, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    log.warn(`No package.json found in ${directory}`);
    return;
  }
  
  let shouldInstall = force;

  if (!shouldInstall) {
    // Check if node_modules exists
    if (!fs.existsSync(nodeModulesPath)) {
      log.info(`node_modules not found in ${directory}`);
      shouldInstall = true;
    } else if (!isPackageLockUpToDate(directory)) {
      log.info(`package-lock.json is out of date in ${directory}`);
      shouldInstall = true;
    }
  }

  if (shouldInstall) {
    log.info(`Installing dependencies in ${directory}`);
    // Use ci when package-lock.json exists for exact versions
    const hasPackageLock = fs.existsSync(path.join(directory, 'package-lock.json'));
    const installCmd = hasPackageLock ? 'npm ci' : 'npm install';
    
    if (runCommand(installCmd, directory)) {
      log.success(`Dependencies installed in ${directory}`);
    } else {
      log.error(`Failed to install dependencies in ${directory}`);
      if (hasPackageLock && !runCommand('npm install', directory)) {
        log.error(`Could not recover with 'npm install' in ${directory}`);
      }
    }
  } else {
    log.success(`Dependencies appear to be up to date in ${directory}`);
  }
}

// Create or update .env files if they don't exist
function ensureEnvFiles() {
  log.header('Checking environment files');
  
  // Settings for .env files
  const settings = {
    server: {
      path: path.join(__dirname, 'server', '.env'),
      content: `PORT=8000
NODE_ENV=development
DB_HOST=localhost
DB_USER=sdmi
DB_PASS=SMD1SQLADM1N
DB_NAME=energyauditdb
JWT_SECRET=e465aa6a212abe4bb21fb3218aa044ed2be68720b46298c20b22f861ab7324f3d299f35ec4720e2ab57a03e4810a7a885e5aac6c1
CORS_ORIGIN=http://localhost:3000
`
    },
    client: {
      path: path.join(__dirname, 'client', '.env'),
      content: `REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_WS_URL=ws://localhost:8000
REACT_APP_TITLE=Energy Audit Panel
`
    }
  };
  
  // Create each .env file if it doesn't exist
  Object.values(settings).forEach(({ path: filePath, content }) => {
    const relativePath = path.relative(__dirname, filePath);
    if (!fs.existsSync(filePath)) {
      try {
        fs.writeFileSync(filePath, content);
        log.success(`Created ${relativePath}`);
      } catch (error) {
        log.error(`Failed to create ${relativePath}: ${error.message}`);
      }
    } else {
      log.info(`${relativePath} already exists`);
    }
  });
}

// Main function to check and install dependencies
async function setupDependencies(force = false) {
  log.header('Setting up Energy Audit Panel dependencies');
  
  // Create .env files if needed
  ensureEnvFiles();
  
  // Define the directories to check
  const directories = [
    { name: 'Root', path: __dirname },
    { name: 'Client', path: path.join(__dirname, 'client') },
    { name: 'Server', path: path.join(__dirname, 'server') }
  ];
  
  // Process each directory
  for (const dir of directories) {
    log.header(`Checking ${dir.name} dependencies`);
    ensureNodeModules(dir.path, force);
  }
  
  log.header('Setup complete!');
  log.info('To start the application:');
  log.info('1. Start the backend: cd server && npm run dev');
  log.info('2. Start the frontend: cd client && npm start');
  log.info('Or use the root command to start both: npm run dev');
}

// Check if force flag is provided
const forceInstall = process.argv.includes('--force');

// Run the setup
setupDependencies(forceInstall); 