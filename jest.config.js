/**
 * Minimal Jest configuration
 * Forces tests to pass even when none are found
 */
module.exports = {
  // Automatically pass when no tests are found
  passWithNoTests: true,
  
  // The test environment
  testEnvironment: 'node',
  
  // Force test to run in CI mode (no watch mode)
  ci: true
}; 