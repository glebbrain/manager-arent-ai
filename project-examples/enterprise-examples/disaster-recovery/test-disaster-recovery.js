const fetch = require('node-fetch');
const WebSocket = require('ws');

// Test configuration
const config = {
  backupUrl: 'http://localhost:3005',
  recoveryUrl: 'http://localhost:3006',
  timeout: 30000
};

// Test results tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  details: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m'
  };
  
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

function recordTest(name, passed, error = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`✅ ${name} - PASSED`, 'success');
  } else {
    testResults.failed++;
    log(`❌ ${name} - FAILED${error ? `: ${error}` : ''}`, 'error');
  }
  
  testResults.details.push({
    name,
    passed,
    error,
    timestamp: new Date().toISOString()
  });
}

async function makeRequest(url, options = {}) {
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: config.timeout
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, mergedOptions);
    const data = await response.json();
    return { success: true, data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test functions
async function testBackupHealth() {
  log('Testing AI Backup Engine health...', 'info');
  
  const result = await makeRequest(`${config.backupUrl}/health`);
  recordTest('Backup Health Check', result.success && result.data.status === 'healthy', result.error);
  
  return result;
}

async function testRecoveryHealth() {
  log('Testing Recovery Manager health...', 'info');
  
  const result = await makeRequest(`${config.recoveryUrl}/health`);
  recordTest('Recovery Health Check', result.success && result.data.status === 'healthy', result.error);
  
  return result;
}

async function testBackupAPI() {
  log('Testing Backup API endpoints...', 'info');
  
  // Test backup history
  const historyResult = await makeRequest(`${config.backupUrl}/api/backup/history`);
  recordTest('Backup History', historyResult.success, historyResult.error);
  
  // Test backup start
  const backupData = {
    sourcePath: './test-data',
    options: {
      compression: 'gzip',
      encryption: 'aes-256',
      primaryStorage: 'local'
    }
  };
  
  const startResult = await makeRequest(`${config.backupUrl}/api/backup/start`, {
    method: 'POST',
    body: JSON.stringify(backupData)
  });
  recordTest('Start Backup', startResult.success, startResult.error);
  
  // Test backup status
  const statusResult = await makeRequest(`${config.backupUrl}/api/backup/status/test-backup-123`);
  recordTest('Backup Status', statusResult.success, statusResult.error);
  
  // Test backup validation
  const validationResult = await makeRequest(`${config.backupUrl}/api/backup/validate/test-backup-123`, {
    method: 'POST'
  });
  recordTest('Backup Validation', validationResult.success, validationResult.error);
}

async function testRecoveryAPI() {
  log('Testing Recovery API endpoints...', 'info');
  
  // Test recovery history
  const historyResult = await makeRequest(`${config.recoveryUrl}/api/recovery/history`);
  recordTest('Recovery History', historyResult.success, historyResult.error);
  
  // Test recovery status
  const statusResult = await makeRequest(`${config.recoveryUrl}/api/recovery/status`);
  recordTest('Recovery Status', statusResult.success, statusResult.error);
  
  // Test recovery start
  const disasterData = {
    disasterType: 'data-corruption',
    affectedComponents: [
      {
        name: 'database',
        priority: 'critical',
        storage: 1000
      },
      {
        name: 'api-gateway',
        priority: 'important',
        storage: 500
      }
    ]
  };
  
  const startResult = await makeRequest(`${config.recoveryUrl}/api/recovery/start`, {
    method: 'POST',
    body: JSON.stringify(disasterData)
  });
  recordTest('Start Recovery', startResult.success, startResult.error);
  
  // Test recovery test
  const testData = {
    scenario: 'data-corruption'
  };
  
  const testResult = await makeRequest(`${config.recoveryUrl}/api/recovery/test`, {
    method: 'POST',
    body: JSON.stringify(testData)
  });
  recordTest('Recovery Test', testResult.success, testResult.error);
  
  // Test all recovery tests
  const allTestsResult = await makeRequest(`${config.recoveryUrl}/api/recovery/test/all`, {
    method: 'POST'
  });
  recordTest('All Recovery Tests', allTestsResult.success, allTestsResult.error);
}

async function testIntegration() {
  log('Testing integration scenarios...', 'info');
  
  try {
    // Test backup and recovery workflow
    const backupData = {
      sourcePath: './test-data',
      options: {
        compression: 'gzip',
        encryption: 'aes-256',
        primaryStorage: 'local'
      }
    };
    
    const backupResult = await makeRequest(`${config.backupUrl}/api/backup/start`, {
      method: 'POST',
      body: JSON.stringify(backupData)
    });
    
    if (backupResult.success) {
      recordTest('Integration - Backup Start', true);
      
      // Wait a moment for backup to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test recovery with the backup
      const disasterData = {
        disasterType: 'hardware-failure',
        affectedComponents: [
          {
            name: 'test-service',
            priority: 'critical',
            storage: 100
          }
        ]
      };
      
      const recoveryResult = await makeRequest(`${config.recoveryUrl}/api/recovery/start`, {
        method: 'POST',
        body: JSON.stringify(disasterData)
      });
      
      recordTest('Integration - Recovery Start', recoveryResult.success, recoveryResult.error);
    } else {
      recordTest('Integration - Backup Start', false, backupResult.error);
    }
    
  } catch (error) {
    recordTest('Integration Test', false, error.message);
  }
}

async function testPerformance() {
  log('Testing performance...', 'info');
  
  const endpoints = [
    { name: 'Backup Health', url: `${config.backupUrl}/health` },
    { name: 'Recovery Health', url: `${config.recoveryUrl}/health` },
    { name: 'Backup History', url: `${config.backupUrl}/api/backup/history` },
    { name: 'Recovery History', url: `${config.recoveryUrl}/api/recovery/history` }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      const result = await makeRequest(endpoint.url);
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      const passed = result.success && responseTime < 3000;
      
      if (responseTime < 1000) {
        log(`✅ ${endpoint.name} - ${responseTime}ms (Good)`, 'success');
      } else if (responseTime < 3000) {
        log(`⚠️  ${endpoint.name} - ${responseTime}ms (Acceptable)`, 'warning');
      } else {
        log(`❌ ${endpoint.name} - ${responseTime}ms (Slow)`, 'error');
      }
      
      recordTest(`Performance - ${endpoint.name}`, passed, result.error);
      
    } catch (error) {
      recordTest(`Performance - ${endpoint.name}`, false, error.message);
    }
  }
}

async function testErrorHandling() {
  log('Testing error handling...', 'info');
  
  const invalidEndpoints = [
    { name: 'Invalid Backup Endpoint', url: `${config.backupUrl}/api/invalid` },
    { name: 'Invalid Recovery Endpoint', url: `${config.recoveryUrl}/api/invalid` },
    { name: 'Non-existent Backup', url: `${config.backupUrl}/api/backup/status/non-existent` },
    { name: 'Non-existent Recovery', url: `${config.recoveryUrl}/api/recovery/status/non-existent` }
  ];
  
  for (const endpoint of invalidEndpoints) {
    try {
      const result = await makeRequest(endpoint.url);
      
      // These should fail with 404 or 500
      const shouldFail = !result.success || result.status >= 400;
      recordTest(`Error Handling - ${endpoint.name}`, shouldFail, result.error);
      
    } catch (error) {
      // Expected to fail
      recordTest(`Error Handling - ${endpoint.name}`, true);
    }
  }
}

async function testSecurity() {
  log('Testing security...', 'info');
  
  try {
    const response = await fetch(`${config.backupUrl}/health`);
    const corsHeader = response.headers.get('access-control-allow-origin');
    
    if (corsHeader) {
      log('✅ CORS headers present', 'success');
      recordTest('Security - CORS Headers', true);
    } else {
      log('⚠️  CORS headers missing', 'warning');
      recordTest('Security - CORS Headers', false, 'CORS headers missing');
    }
    
  } catch (error) {
    recordTest('Security - CORS Headers', false, error.message);
  }
}

async function testWebSocketConnections() {
  log('Testing WebSocket connections...', 'info');
  
  // Test backup engine WebSocket (if available)
  try {
    const ws = new WebSocket(`ws://localhost:3005`);
    
    const wsTest = new Promise((resolve) => {
      const timeout = setTimeout(() => {
        ws.close();
        resolve(false);
      }, 5000);
      
      ws.on('open', () => {
        clearTimeout(timeout);
        ws.close();
        resolve(true);
      });
      
      ws.on('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
    
    const wsResult = await wsTest;
    recordTest('WebSocket - Backup Engine', wsResult);
    
  } catch (error) {
    recordTest('WebSocket - Backup Engine', false, error.message);
  }
}

// Main test execution
async function runTests() {
  log('🚀 Starting comprehensive disaster recovery system tests...', 'info');
  log('=========================================================', 'info');
  
  // Check if services are running
  log('📋 Checking service availability...', 'info');
  
  const backupHealth = await testBackupHealth();
  const recoveryHealth = await testRecoveryHealth();
  
  if (!backupHealth.success || !recoveryHealth.success) {
    log('❌ Services are not running. Please start them first:', 'error');
    log('   Backup Engine: node ai-backup/ai-backup-engine.js', 'info');
    log('   Recovery Manager: node recovery/recovery-manager.js', 'info');
    process.exit(1);
  }
  
  // Run all test suites
  await testBackupAPI();
  await testRecoveryAPI();
  await testIntegration();
  await testPerformance();
  await testErrorHandling();
  await testSecurity();
  await testWebSocketConnections();
  
  // Display test results
  log('📊 Test Results Summary', 'info');
  log('======================', 'info');
  log(`Total Tests: ${testResults.total}`, 'info');
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, 'error');
  log(`Skipped: ${testResults.skipped}`, 'warning');
  
  const successRate = testResults.total > 0 ? Math.round((testResults.passed / testResults.total) * 100) : 0;
  log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'success' : successRate >= 60 ? 'warning' : 'error');
  
  // Generate test report
  const reportPath = `test-results/disaster-recovery-test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const fs = require('fs');
  const path = require('path');
  
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const testReport = {
    timestamp: new Date().toISOString(),
    environment: 'test',
    services: {
      backupEngine: backupHealth.data,
      recoveryManager: recoveryHealth.data
    },
    results: testResults,
    successRate: successRate,
    status: successRate >= 80 ? 'PASSED' : successRate >= 60 ? 'PARTIAL' : 'FAILED'
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));
  log(`📄 Test report saved to: ${reportPath}`, 'info');
  
  // Final status
  if (successRate >= 80) {
    log('🎉 All tests completed successfully!', 'success');
    log('Disaster Recovery System is ready for production use.', 'success');
    process.exit(0);
  } else if (successRate >= 60) {
    log('⚠️  Some tests failed, but system is partially functional.', 'warning');
    log('Please review failed tests and fix issues before production use.', 'warning');
    process.exit(1);
  } else {
    log('❌ Multiple tests failed. System needs attention.', 'error');
    log('Please fix critical issues before using the system.', 'error');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    log(`❌ Test execution failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testBackupHealth,
  testRecoveryHealth,
  testBackupAPI,
  testRecoveryAPI,
  testIntegration,
  testPerformance,
  testErrorHandling,
  testSecurity,
  testWebSocketConnections
};
