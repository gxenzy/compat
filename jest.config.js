// jest.config.js
module.exports = {
  // Look for tests in our custom directory structure
  testMatch: [
    '<rootDir>/client/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/client/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
    '<rootDir>/server/src/tests/**/*.{js,jsx,ts,tsx}'
  ],
  
  // Always pass, even with no tests
  passWithNoTests: true,
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/client/src/setupTests.js'],
  
  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': '<rootDir>/node_modules/babel-jest'
  },
  
  // Module name mapper for CSS files
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  
  // Test environment
  testEnvironment: 'jsdom'
}; 