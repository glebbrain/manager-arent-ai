// Global setup file
// This file is run once before all tests

module.exports = async () => {
  console.log('🚀 Setting up Advanced Automation Enhanced v3.1 test environment...');

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
  process.env.PORT = '3001';

  // Create test directories if they don't exist
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
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });

  console.log('✅ Test environment setup completed');
};
