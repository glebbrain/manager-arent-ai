// Global teardown file
// This file is run once after all tests

module.exports = async () => {
  console.log('🧹 Cleaning up Advanced Automation Enhanced v3.1 test environment...');

  // Clean up test directories
  const fs = require('fs');
  const path = require('path');

  const testDirs = [
    'logs',
    'models',
    'data',
    'temp'
  ];

  testDirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', '..', dir);
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  });

  console.log('✅ Test environment cleanup completed');
};
