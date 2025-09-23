#!/usr/bin/env node

/**
 * Service Mesh Orchestrator v2.9 - Test Suite
 * Comprehensive testing for AI-powered microservices orchestration
 */

const http = require('http');
const WebSocket = require('ws');

const BASE_URL = 'http://localhost:8080';
const WS_URL = 'ws://localhost:8081';

class OrchestratorTester {
    constructor() {
        this.testResults = [];
        this.ws = null;
    }

    async runTests() {
        console.log('🚀 Starting Service Mesh Orchestrator v2.9 Tests\n');

        try {
            // Test basic connectivity
            await this.testHealthCheck();
            await this.testBasicEndpoints();
            
            // Test service management
            await this.testServiceManagement();
            
            // Test traffic management
            await this.testTrafficManagement();
            
            // Test AI features
            await this.testAIFeatures();
            
            // Test WebSocket functionality
            await this.testWebSocketConnection();
            await this.testWebSocketEvents();
            
            // Test monitoring and analytics
            await this.testMonitoring();
            
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
            
            if (data.status === 'healthy' && data.service === 'service-mesh-orchestrator') {
                this.addResult('Health Check', true, 'Orchestrator is healthy and running');
            } else {
                this.addResult('Health Check', false, 'Health check failed or wrong service');
            }
        } catch (error) {
            this.addResult('Health Check', false, error.message);
        }
    }

    async testBasicEndpoints() {
        console.log('🔍 Testing basic endpoints...');
        
        const endpoints = [
            '/api/v1/mesh/status',
            '/api/v1/services',
            '/api/v1/traffic',
            '/api/v1/security',
            '/api/v1/monitoring/metrics',
            '/api/v1/config'
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await this.makeRequest(endpoint);
                const data = JSON.parse(response);
                
                if (data.success !== undefined) {
                    this.addResult(`Endpoint ${endpoint}`, true, 'Endpoint responding correctly');
                } else {
                    this.addResult(`Endpoint ${endpoint}`, false, 'Endpoint returned unexpected format');
                }
            } catch (error) {
                this.addResult(`Endpoint ${endpoint}`, false, error.message);
            }
        }
    }

    async testServiceManagement() {
        console.log('🔍 Testing service management...');
        
        try {
            // Test creating a service
            const serviceConfig = {
                name: 'test-service',
                namespace: 'test-namespace',
                image: 'nginx:alpine',
                port: 80,
                replicas: 2,
                resources: {
                    requests: { cpu: '100m', memory: '128Mi' },
                    limits: { cpu: '200m', memory: '256Mi' }
                }
            };

            const createResponse = await this.makeRequest('/api/v1/services', 'POST', serviceConfig);
            const createData = JSON.parse(createResponse);
            
            if (createData.success) {
                this.addResult('Service Creation', true, 'Successfully created test service');
            } else {
                this.addResult('Service Creation', false, 'Failed to create test service');
                return;
            }

            // Test updating the service
            const updateResponse = await this.makeRequest('/api/v1/services/test-service', 'PUT', {
                replicas: 3,
                resources: {
                    requests: { cpu: '150m', memory: '192Mi' },
                    limits: { cpu: '300m', memory: '384Mi' }
                }
            });
            const updateData = JSON.parse(updateResponse);
            
            if (updateData.success) {
                this.addResult('Service Update', true, 'Successfully updated test service');
            } else {
                this.addResult('Service Update', false, 'Failed to update test service');
            }

            // Test getting services
            const getResponse = await this.makeRequest('/api/v1/services');
            const getData = JSON.parse(getResponse);
            
            if (getData.success && getData.data.length > 0) {
                this.addResult('Service Retrieval', true, `Retrieved ${getData.data.length} services`);
            } else {
                this.addResult('Service Retrieval', false, 'Failed to retrieve services');
            }

            // Test deleting the service
            const deleteResponse = await this.makeRequest('/api/v1/services/test-service', 'DELETE');
            const deleteData = JSON.parse(deleteResponse);
            
            if (deleteData.success) {
                this.addResult('Service Deletion', true, 'Successfully deleted test service');
            } else {
                this.addResult('Service Deletion', false, 'Failed to delete test service');
            }

        } catch (error) {
            this.addResult('Service Management', false, error.message);
        }
    }

    async testTrafficManagement() {
        console.log('🔍 Testing traffic management...');
        
        try {
            // Test traffic splitting
            const trafficSplitResponse = await this.makeRequest('/api/v1/traffic/split', 'POST', {
                serviceName: 'api-gateway',
                versions: ['v1', 'v2'],
                weights: [70, 30]
            });
            const trafficSplitData = JSON.parse(trafficSplitResponse);
            
            if (trafficSplitData.success) {
                this.addResult('Traffic Splitting', true, 'Successfully created traffic split');
            } else {
                this.addResult('Traffic Splitting', false, 'Failed to create traffic split');
            }

            // Test canary deployment
            const canaryResponse = await this.makeRequest('/api/v1/traffic/canary', 'POST', {
                serviceName: 'api-gateway',
                canaryVersion: 'v2',
                trafficPercentage: 10
            });
            const canaryData = JSON.parse(canaryResponse);
            
            if (canaryData.success) {
                this.addResult('Canary Deployment', true, 'Successfully created canary deployment');
            } else {
                this.addResult('Canary Deployment', false, 'Failed to create canary deployment');
            }

        } catch (error) {
            this.addResult('Traffic Management', false, error.message);
        }
    }

    async testAIFeatures() {
        console.log('🔍 Testing AI features...');
        
        try {
            // Test AI recommendations
            const recommendationsResponse = await this.makeRequest('/api/v1/ai/recommendations');
            const recommendationsData = JSON.parse(recommendationsResponse);
            
            if (recommendationsData.success) {
                this.addResult('AI Recommendations', true, 'AI recommendations system working');
            } else {
                this.addResult('AI Recommendations', false, 'AI recommendations not available');
            }

            // Test mesh optimization
            const optimizeResponse = await this.makeRequest('/api/v1/ai/optimize', 'POST', {});
            const optimizeData = JSON.parse(optimizeResponse);
            
            if (optimizeData.success) {
                this.addResult('AI Optimization', true, 'AI optimization system working');
            } else {
                this.addResult('AI Optimization', false, 'AI optimization not available');
            }

            // Test auto scaling
            const scaleResponse = await this.makeRequest('/api/v1/ai/scale', 'POST', {});
            const scaleData = JSON.parse(scaleResponse);
            
            if (scaleData.success) {
                this.addResult('AI Auto Scaling', true, 'AI auto scaling system working');
            } else {
                this.addResult('AI Auto Scaling', false, 'AI auto scaling not available');
            }

        } catch (error) {
            this.addResult('AI Features', false, error.message);
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
            const expectedEvents = ['services_updated', 'ai_recommendations', 'alerts'];

            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    eventsReceived++;
                    
                    if (expectedEvents.includes(message.type)) {
                        this.addResult('WebSocket Events', true, `Received ${eventsReceived} events`);
                    }
                } catch (error) {
                    // Ignore non-JSON messages
                }
            });

            // Test subscribing to updates
            this.ws.send(JSON.stringify({
                type: 'subscribe',
                subscriptions: ['services', 'recommendations']
            }));

            // Test getting status
            this.ws.send(JSON.stringify({
                type: 'get_status'
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

    async testMonitoring() {
        console.log('🔍 Testing monitoring and analytics...');
        
        try {
            // Test metrics endpoint
            const metricsResponse = await this.makeRequest('/api/v1/monitoring/metrics');
            const metricsData = JSON.parse(metricsResponse);
            
            if (metricsData.success) {
                this.addResult('Metrics Collection', true, 'Metrics collection working');
            } else {
                this.addResult('Metrics Collection', false, 'Metrics collection not available');
            }

            // Test service topology
            const topologyResponse = await this.makeRequest('/api/v1/monitoring/topology');
            const topologyData = JSON.parse(topologyResponse);
            
            if (topologyData.success) {
                this.addResult('Service Topology', true, 'Service topology monitoring working');
            } else {
                this.addResult('Service Topology', false, 'Service topology not available');
            }

            // Test traces
            const tracesResponse = await this.makeRequest('/api/v1/monitoring/traces');
            const tracesData = JSON.parse(tracesResponse);
            
            if (tracesData.success) {
                this.addResult('Distributed Tracing', true, 'Distributed tracing working');
            } else {
                this.addResult('Distributed Tracing', false, 'Distributed tracing not available');
            }

        } catch (error) {
            this.addResult('Monitoring', false, error.message);
        }
    }

    async makeRequest(path, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 8080,
                path: path,
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(body);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                    }
                });
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
            console.log('\n🎉 All tests passed! Service Mesh Orchestrator v2.9 is working perfectly!');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the orchestrator configuration.');
        }

        if (this.ws) {
            this.ws.close();
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new OrchestratorTester();
    tester.runTests().catch(console.error);
}

module.exports = OrchestratorTester;
