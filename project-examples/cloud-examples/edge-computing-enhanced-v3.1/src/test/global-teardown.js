// Global teardown for Edge Computing Enhanced v3.1 tests

module.exports = async () => {
  // Clean up test environment
  const fs = require('fs');
  const path = require('path');
  
  // Remove test directories
  const testDirs = [
    'logs',
    'models',
    'data'
  ];
  
  testDirs.forEach(dir => {
    const dirPath = path.join(__dirname, '../../', dir);
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  });
  
  console.log('Global test teardown completed');
};
