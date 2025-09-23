#!/usr/bin/env node

/**
 * Advanced Analytics Dashboard v2.9 - Test Suite
 * Comprehensive testing for AI performance monitoring features
 */

const http = require('http');
const WebSocket = require('ws');

const BASE_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

class DashboardTester {
    constructor() {
        this.testResults = [];
        this.ws = null;
    }

    async runTests() {
        console.log('🚀 Starting Advanced Analytics Dashboard v2.9 Tests\n');

        try {
            // Test basic connectivity
            await this.testHealthCheck();
            await this.testBasicEndpoints();
            
            // Test AI performance tracking
            await this.testAIPerformanceTracking();
            await this.testPerformancePredictions();
            await this.testAnomalyDetection();
            await this.testHealthScoring();
            
            // Test WebSocket functionality
            await this.testWebSocketConnection();
            await this.testWebSocketEvents();
            
            // Test advanced features
            await this.testModelAnalytics();
            await this.testAlertSystem();
            
            this.printResults();
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            process.exit(1);
        }
    }

    async testHealthCheck() {
        console.log('🔍 Testing health check...');
        
        try {
            const response = await this.makeRequest('/health');
            const data = JSON.parse(response);
            
            if (data.status === 'healthy' && data.version === '2.9.0') {
                this.addResult('Health Check', true, 'Dashboard is healthy and running v2.9.0');
            } else {
                this.addResult('Health Check', false, 'Health check failed or wrong version');
            }
        } catch (error) {
            this.addResult('Health Check', false, error.message);
        }
    }

    async testBasicEndpoints() {
        console.log('🔍 Testing basic endpoints...');
        
        const endpoints = [
            '/api/ai-performance/summary',
            '/api/ai-performance/models',
            '/api/ai-performance/alerts',
            '/api/ai-performance/anomaly-detection'
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await this.makeRequest(endpoint);
                const data = JSON.parse(response);
                
                if (data.success) {
                    this.addResult(`Endpoint ${endpoint}`, true, 'Endpoint responding correctly');
                } else {
                    this.addResult(`Endpoint ${endpoint}`, false, 'Endpoint returned error');
                }
            } catch (error) {
                this.addResult(`Endpoint ${endpoint}`, false, error.message);
            }
        }
    }

    async testAIPerformanceTracking() {
        console.log('🔍 Testing AI performance tracking...');
        
        try {
            const testMetrics = {
                modelId: 'test-model-1',
                metrics: {
                    responseTime: 150,
                    accuracy: 0.95,
                    throughput: 120,
                    errorRate: 0.02,
                    memoryUsage: 0.65,
                    cpuUsage: 0.45,
                    requests: 1,
                    errors: 0
                }
            };

            const response = await this.makeRequest('/api/ai-performance/track', 'POST', testMetrics);
            const data = JSON.parse(response);
            
            if (data.success && data.data.modelId === 'test-model-1') {
                this.addResult('AI Performance Tracking', true, 'Successfully tracked AI model performance');
            } else {
                this.addResult('AI Performance Tracking', false, 'Failed to track AI model performance');
            }
        } catch (error) {
            this.addResult('AI Performance Tracking', false, error.message);
        }
    }

    async testPerformancePredictions() {
        console.log('🔍 Testing performance predictions...');
        
        try {
            // First, add some historical data
            for (let i = 0; i < 20; i++) {
                const testMetrics = {
                    modelId: 'test-model-2',
                    metrics: {
                        responseTime: 100 + Math.random() * 50,
                        accuracy: 0.9 + Math.random() * 0.1,
                        throughput: 100 + Math.random() * 20,
                        errorRate: Math.random() * 0.05,
                        memoryUsage: 0.5 + Math.random() * 0.3,
                        cpuUsage: 0.4 + Math.random() * 0.4,
                        requests: 1,
                        errors: 0
                    }
                };
                
                await this.makeRequest('/api/ai-performance/track', 'POST', testMetrics);
            }

            // Test predictions
            const response = await this.makeRequest('/api/ai-performance/predictions?modelId=test-model-2&timeSteps=5');
            const data = JSON.parse(response);
            
            if (data.success && data.data && data.data.length > 0) {
                this.addResult('Performance Predictions', true, `Generated ${data.data.length} predictions`);
            } else {
                this.addResult('Performance Predictions', false, 'Failed to generate predictions');
            }
        } catch (error) {
            this.addResult('Performance Predictions', false, error.message);
        }
    }

    async testAnomalyDetection() {
        console.log('🔍 Testing anomaly detection...');
        
        try {
            // Test anomaly detection settings
            const settingsResponse = await this.makeRequest('/api/ai-performance/anomaly-detection');
            const settingsData = JSON.parse(settingsResponse);
            
            if (settingsData.success && settingsData.data.enabled) {
                this.addResult('Anomaly Detection Status', true, 'Anomaly detection is enabled');
            } else {
                this.addResult('Anomaly Detection Status', false, 'Anomaly detection not properly configured');
            }

            // Test updating settings
            const updateResponse = await this.makeRequest('/api/ai-performance/anomaly-detection', 'POST', {
                sensitivity: 0.8,
                windowSize: 15
            });
            const updateData = JSON.parse(updateResponse);
            
            if (updateData.success && updateData.data.sensitivity === 0.8) {
                this.addResult('Anomaly Detection Settings', true, 'Successfully updated anomaly detection settings');
            } else {
                this.addResult('Anomaly Detection Settings', false, 'Failed to update anomaly detection settings');
            }
        } catch (error) {
            this.addResult('Anomaly Detection', false, error.message);
        }
    }

    async testHealthScoring() {
        console.log('🔍 Testing health scoring...');
        
        try {
            const response = await this.makeRequest('/api/ai-performance/health-score?modelId=test-model-1');
            const data = JSON.parse(response);
            
            if (data.success && typeof data.data.healthScore === 'number' && data.data.healthScore >= 0 && data.data.healthScore <= 100) {
                this.addResult('Health Scoring', true, `Health score: ${data.data.healthScore} (${data.data.healthStatus})`);
            } else {
                this.addResult('Health Scoring', false, 'Invalid health score returned');
            }
        } catch (error) {
            this.addResult('Health Scoring', false, error.message);
        }
    }

    async testWebSocketConnection() {
        console.log('🔍 Testing WebSocket connection...');
        
        return new Promise((resolve) => {
            try {
                this.ws = new WebSocket(WS_URL);
                
                this.ws.on('open', () => {
                    this.addResult('WebSocket Connection', true, 'Successfully connected to WebSocket');
                    resolve();
                });
                
                this.ws.on('error', (error) => {
                    this.addResult('WebSocket Connection', false, error.message);
                    resolve();
                });
                
                setTimeout(() => {
                    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                        this.addResult('WebSocket Connection', true, 'WebSocket connection established');
                        resolve();
                    } else {
                        this.addResult('WebSocket Connection', false, 'WebSocket connection timeout');
                        resolve();
                    }
                }, 5000);
            } catch (error) {
                this.addResult('WebSocket Connection', false, error.message);
                resolve();
            }
        });
    }

    async testWebSocketEvents() {
        console.log('🔍 Testing WebSocket events...');
        
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.addResult('WebSocket Events', false, 'WebSocket not connected');
            return;
        }

        return new Promise((resolve) => {
            let eventsReceived = 0;
            const expectedEvents = ['initial-data'];

            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    eventsReceived++;
                    
                    if (expectedEvents.includes(message.type) || message.models || message.summary) {
                        this.addResult('WebSocket Events', true, `Received ${eventsReceived} events`);
                    }
                } catch (error) {
                    // Ignore non-JSON messages
                }
            });

            // Test model selection
            this.ws.send(JSON.stringify({
                type: 'select-model',
                modelId: 'test-model-1'
            }));

            setTimeout(() => {
                if (eventsReceived > 0) {
                    this.addResult('WebSocket Events', true, `Received ${eventsReceived} WebSocket events`);
                } else {
                    this.addResult('WebSocket Events', false, 'No WebSocket events received');
                }
                resolve();
            }, 3000);
        });
    }

    async testModelAnalytics() {
        console.log('🔍 Testing model analytics...');
        
        try {
            const response = await this.makeRequest('/api/ai-performance/analytics?modelId=test-model-1&timeRange=24h');
            const data = JSON.parse(response);
            
            if (data.success && data.data.summary && data.data.predictions !== undefined) {
                this.addResult('Model Analytics', true, 'Comprehensive model analytics working');
            } else {
                this.addResult('Model Analytics', false, 'Model analytics incomplete');
            }
        } catch (error) {
            this.addResult('Model Analytics', false, error.message);
        }
    }

    async testAlertSystem() {
        console.log('🔍 Testing alert system...');
        
        try {
            // Generate some alerts by sending poor performance metrics
            const poorMetrics = {
                modelId: 'test-model-alerts',
                metrics: {
                    responseTime: 2000, // High response time
                    accuracy: 0.5, // Low accuracy
                    throughput: 10, // Low throughput
                    errorRate: 0.2, // High error rate
                    memoryUsage: 0.9, // High memory usage
                    cpuUsage: 0.9, // High CPU usage
                    requests: 1,
                    errors: 1
                }
            };

            await this.makeRequest('/api/ai-performance/track', 'POST', poorMetrics);

            // Check for alerts
            const response = await this.makeRequest('/api/ai-performance/alerts');
            const data = JSON.parse(response);
            
            if (data.success) {
                this.addResult('Alert System', true, `Alert system working (${data.data.length} alerts)`);
            } else {
                this.addResult('Alert System', false, 'Alert system not working');
            }
        } catch (error) {
            this.addResult('Alert System', false, error.message);
        }
    }

    async makeRequest(path, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 3001,
                path: path,
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => resolve(body));
            });

            req.on('error', reject);

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    addResult(testName, passed, message) {
        this.testResults.push({
            test: testName,
            passed,
            message
        });
    }

    printResults() {
        console.log('\n📊 Test Results Summary:');
        console.log('========================\n');

        let passed = 0;
        let failed = 0;

        this.testResults.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.test}: ${result.message}`);
            
            if (result.passed) {
                passed++;
            } else {
                failed++;
            }
        });

        console.log('\n📈 Overall Results:');
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📊 Total: ${this.testResults.length}`);
        console.log(`🎯 Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);

        if (failed === 0) {
            console.log('\n🎉 All tests passed! Advanced Analytics Dashboard v2.9 is working perfectly!');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the dashboard configuration.');
        }

        if (this.ws) {
            this.ws.close();
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new DashboardTester();
    tester.runTests().catch(console.error);
}

module.exports = DashboardTester;
