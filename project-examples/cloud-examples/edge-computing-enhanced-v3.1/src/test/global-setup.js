// Global setup for Edge Computing Enhanced v3.1 tests

module.exports = async () => {
  // Set up test environment
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
  
  // Create test directories if they don't exist
  const fs = require('fs');
  const path = require('path');
  
  const testDirs = [
    'logs',
    'models',
    'data',
    'coverage'
  ];
  
  testDirs.forEach(dir => {
    const dirPath = path.join(__dirname, '../../', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
  
  console.log('Global test setup completed');
};
