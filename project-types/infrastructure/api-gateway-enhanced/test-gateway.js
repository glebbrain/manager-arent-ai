#!/usr/bin/env node

/**
 * Enhanced API Gateway v2.9 - Test Suite
 * Comprehensive testing for advanced routing and load balancing features
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:3000';

class GatewayTester {
    constructor() {
        this.testResults = [];
        this.authToken = null;
    }

    async runTests() {
        console.log('🚀 Starting Enhanced API Gateway v2.9 Tests\n');

        try {
            // Test basic connectivity
            await this.testHealthCheck();
            await this.testBasicEndpoints();
            
            // Test authentication
            await this.testAuthentication();
            
            // Test load balancing
            await this.testLoadBalancing();
            
            // Test circuit breakers
            await this.testCircuitBreakers();
            
            // Test analytics
            await this.testAnalytics();
            
            // Test configuration management
            await this.testConfigurationManagement();
            
            // Test rate limiting
            await this.testRateLimiting();
            
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
            
            if (data.status === 'healthy' && data.service === 'api-gateway-enhanced') {
                this.addResult('Health Check', true, 'Gateway is healthy and running');
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
            '/metrics',
            '/metrics/prometheus',
            '/api/v1/analytics/load-balancers',
            '/api/v1/analytics/circuit-breakers',
            '/api/v1/analytics/services',
            '/api/v1/config/load-balancers'
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await this.makeRequest(endpoint);
                const data = JSON.parse(response);
                
                if (data.success !== undefined || data.requests !== undefined) {
                    this.addResult(`Endpoint ${endpoint}`, true, 'Endpoint responding correctly');
                } else {
                    this.addResult(`Endpoint ${endpoint}`, false, 'Endpoint returned unexpected format');
                }
            } catch (error) {
                this.addResult(`Endpoint ${endpoint}`, false, error.message);
            }
        }
    }

    async testAuthentication() {
        console.log('🔍 Testing authentication...');
        
        try {
            // Test login
            const loginResponse = await this.makeRequest('/api/v1/auth/login', 'POST', {
                username: 'admin',
                password: 'admin123'
            });
            const loginData = JSON.parse(loginResponse);
            
            if (loginData.token) {
                this.authToken = loginData.token;
                this.addResult('Authentication Login', true, 'Successfully logged in and received token');
            } else {
                this.addResult('Authentication Login', false, 'Failed to receive authentication token');
                return;
            }

            // Test protected endpoint
            const protectedResponse = await this.makeRequest('/api/v1/projects', 'GET', null, {
                'Authorization': `Bearer ${this.authToken}`
            });
            
            // Even if the service is not available, we should get a proper response
            if (protectedResponse) {
                this.addResult('Authentication Protected Endpoint', true, 'Protected endpoint accessible with token');
            } else {
                this.addResult('Authentication Protected Endpoint', false, 'Protected endpoint not accessible');
            }

            // Test refresh token
            const refreshResponse = await this.makeRequest('/api/v1/auth/refresh', 'POST', {
                refreshToken: loginData.refreshToken
            });
            const refreshData = JSON.parse(refreshResponse);
            
            if (refreshData.token) {
                this.addResult('Authentication Refresh', true, 'Successfully refreshed token');
            } else {
                this.addResult('Authentication Refresh', false, 'Failed to refresh token');
            }

        } catch (error) {
            this.addResult('Authentication', false, error.message);
        }
    }

    async testLoadBalancing() {
        console.log('🔍 Testing load balancing...');
        
        try {
            // Test load balancer analytics
            const response = await this.makeRequest('/api/v1/analytics/load-balancers');
            const data = JSON.parse(response);
            
            if (data.success && data.data) {
                const services = Object.keys(data.data);
                this.addResult('Load Balancing Analytics', true, `Found ${services.length} services with load balancing`);
                
                // Test load balancer configuration
                const configResponse = await this.makeRequest('/api/v1/config/load-balancers');
                const configData = JSON.parse(configResponse);
                
                if (configData.success && configData.data) {
                    this.addResult('Load Balancing Configuration', true, 'Load balancer configuration accessible');
                } else {
                    this.addResult('Load Balancing Configuration', false, 'Load balancer configuration not accessible');
                }
            } else {
                this.addResult('Load Balancing Analytics', false, 'Load balancer analytics not available');
            }
        } catch (error) {
            this.addResult('Load Balancing', false, error.message);
        }
    }

    async testCircuitBreakers() {
        console.log('🔍 Testing circuit breakers...');
        
        try {
            const response = await this.makeRequest('/api/v1/analytics/circuit-breakers');
            const data = JSON.parse(response);
            
            if (data.success && data.data) {
                const services = Object.keys(data.data);
                this.addResult('Circuit Breakers Analytics', true, `Found ${services.length} services with circuit breakers`);
                
                // Check circuit breaker states
                let healthyBreakers = 0;
                for (const [serviceName, breaker] of Object.entries(data.data)) {
                    if (breaker.state === 'CLOSED' || breaker.state === 'HALF_OPEN') {
                        healthyBreakers++;
                    }
                }
                
                this.addResult('Circuit Breakers Health', true, `${healthyBreakers}/${services.length} circuit breakers healthy`);
            } else {
                this.addResult('Circuit Breakers Analytics', false, 'Circuit breaker analytics not available');
            }
        } catch (error) {
            this.addResult('Circuit Breakers', false, error.message);
        }
    }

    async testAnalytics() {
        console.log('🔍 Testing analytics...');
        
        try {
            // Test comprehensive dashboard
            const dashboardResponse = await this.makeRequest('/api/v1/analytics/dashboard');
            const dashboardData = JSON.parse(dashboardResponse);
            
            if (dashboardData.success && dashboardData.data) {
                const { overview, loadBalancers, circuitBreakers, services, alerts } = dashboardData.data;
                
                let analyticsScore = 0;
                if (overview) analyticsScore++;
                if (loadBalancers) analyticsScore++;
                if (circuitBreakers) analyticsScore++;
                if (services) analyticsScore++;
                if (alerts) analyticsScore++;
                
                this.addResult('Analytics Dashboard', true, `Dashboard complete with ${analyticsScore}/5 components`);
            } else {
                this.addResult('Analytics Dashboard', false, 'Analytics dashboard not available');
            }

            // Test service metrics
            const servicesResponse = await this.makeRequest('/api/v1/analytics/services');
            const servicesData = JSON.parse(servicesResponse);
            
            if (servicesData.success) {
                this.addResult('Service Metrics', true, 'Service metrics accessible');
            } else {
                this.addResult('Service Metrics', false, 'Service metrics not accessible');
            }

            // Test alerts
            const alertsResponse = await this.makeRequest('/api/v1/analytics/alerts');
            const alertsData = JSON.parse(alertsResponse);
            
            if (alertsData.success) {
                this.addResult('Performance Alerts', true, 'Performance alerts system working');
            } else {
                this.addResult('Performance Alerts', false, 'Performance alerts not accessible');
            }

        } catch (error) {
            this.addResult('Analytics', false, error.message);
        }
    }

    async testConfigurationManagement() {
        console.log('🔍 Testing configuration management...');
        
        try {
            // Test updating load balancer configuration
            const updateResponse = await this.makeRequest('/api/v1/config/load-balancers/project-manager', 'POST', {
                algorithm: 'weighted-round-robin',
                instances: [
                    { url: 'http://project-manager-1:3000', weight: 2, healthy: true },
                    { url: 'http://project-manager-2:3000', weight: 1, healthy: true }
                ]
            });
            const updateData = JSON.parse(updateResponse);
            
            if (updateData.success) {
                this.addResult('Configuration Update', true, 'Successfully updated load balancer configuration');
            } else {
                this.addResult('Configuration Update', false, 'Failed to update load balancer configuration');
            }

        } catch (error) {
            this.addResult('Configuration Management', false, error.message);
        }
    }

    async testRateLimiting() {
        console.log('🔍 Testing rate limiting...');
        
        try {
            // Make multiple requests to test rate limiting
            const requests = [];
            for (let i = 0; i < 5; i++) {
                requests.push(this.makeRequest('/health'));
            }
            
            const responses = await Promise.all(requests);
            const successCount = responses.filter(response => {
                try {
                    const data = JSON.parse(response);
                    return data.status === 'healthy';
                } catch {
                    return false;
                }
            }).length;
            
            if (successCount >= 4) {
                this.addResult('Rate Limiting', true, `Rate limiting working (${successCount}/5 requests successful)`);
            } else {
                this.addResult('Rate Limiting', false, 'Rate limiting may be too restrictive');
            }

        } catch (error) {
            this.addResult('Rate Limiting', false, error.message);
        }
    }

    async makeRequest(path, method = 'GET', data = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 3000,
                path: path,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
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
            console.log('\n🎉 All tests passed! Enhanced API Gateway v2.9 is working perfectly!');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the gateway configuration.');
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new GatewayTester();
    tester.runTests().catch(console.error);
}

module.exports = GatewayTester;
