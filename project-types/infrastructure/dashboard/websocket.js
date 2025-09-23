// Universal Automation Platform - WebSocket Manager
// Version: 2.2 - AI Enhanced

class WebSocketManager {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.websocket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second
        this.maxReconnectDelay = 30000; // Max 30 seconds
        this.isConnected = false;
        this.heartbeatInterval = null;
        this.heartbeatTimeout = null;
        
        this.init();
    }

    init() {
        console.log('🔌 Initializing WebSocket Manager...');
        this.connect();
    }

    connect() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            
            console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);
            
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onopen = () => {
                console.log('✅ WebSocket connected successfully');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.reconnectDelay = 1000;
                this.startHeartbeat();
                this.dashboard.updateStatusIndicator();
            };
            
            this.websocket.onmessage = (event) => {
                this.handleMessage(event);
            };
            
            this.websocket.onclose = (event) => {
                console.log('🔌 WebSocket disconnected:', event.code, event.reason);
                this.isConnected = false;
                this.stopHeartbeat();
                this.dashboard.updateStatusIndicator();
                
                if (event.code !== 1000) { // Not a normal closure
                    this.scheduleReconnect();
                }
            };
            
            this.websocket.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.isConnected = false;
                this.dashboard.updateStatusIndicator();
            };
            
        } catch (error) {
            console.error('❌ Failed to create WebSocket connection:', error);
            this.scheduleReconnect();
        }
    }

    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'heartbeat':
                    this.handleHeartbeat();
                    break;
                case 'metrics':
                    this.dashboard.updateMetrics(data.payload);
                    break;
                case 'project':
                    this.dashboard.updateProject(data.payload);
                    break;
                case 'build':
                    this.dashboard.updateBuild(data.payload);
                    break;
                case 'activity':
                    this.dashboard.addActivity(data.payload);
                    break;
                case 'alert':
                    this.dashboard.addAlert(data.payload);
                    break;
                case 'system_status':
                    this.handleSystemStatus(data.payload);
                    break;
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
        }
    }

    handleHeartbeat() {
        // Reset heartbeat timeout
        if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
        }
        
        // Set new timeout
        this.heartbeatTimeout = setTimeout(() => {
            console.log('⚠️ Heartbeat timeout, reconnecting...');
            this.reconnect();
        }, 30000); // 30 seconds timeout
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected && this.websocket.readyState === WebSocket.OPEN) {
                this.send({
                    type: 'heartbeat',
                    timestamp: new Date().toISOString()
                });
            }
        }, 10000); // Send heartbeat every 10 seconds
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        
        if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
            this.heartbeatTimeout = null;
        }
    }

    handleSystemStatus(status) {
        console.log('📊 System status update:', status);
        
        // Update dashboard with system status
        if (status.online !== undefined) {
            this.dashboard.isOnline = status.online;
            this.dashboard.updateStatusIndicator();
        }
        
        if (status.uptime) {
            document.getElementById('uptime').textContent = status.uptime;
        }
    }

    send(data) {
        if (this.isConnected && this.websocket.readyState === WebSocket.OPEN) {
            try {
                this.websocket.send(JSON.stringify(data));
                return true;
            } catch (error) {
                console.error('❌ Error sending WebSocket message:', error);
                return false;
            }
        } else {
            console.warn('⚠️ WebSocket not connected, cannot send message');
            return false;
        }
    }

    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            return;
        }
        
        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
        
        console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
        
        setTimeout(() => {
            this.reconnect();
        }, delay);
    }

    reconnect() {
        console.log('🔄 Attempting to reconnect...');
        this.disconnect();
        this.connect();
    }

    disconnect() {
        console.log('🔌 Disconnecting WebSocket...');
        
        this.stopHeartbeat();
        
        if (this.websocket) {
            this.websocket.close(1000, 'Client disconnecting');
            this.websocket = null;
        }
        
        this.isConnected = false;
    }

    // Public methods for external use
    subscribeToMetrics() {
        this.send({
            type: 'subscribe',
            channel: 'metrics'
        });
    }

    subscribeToProjects() {
        this.send({
            type: 'subscribe',
            channel: 'projects'
        });
    }

    subscribeToBuilds() {
        this.send({
            type: 'subscribe',
            channel: 'builds'
        });
    }

    subscribeToActivities() {
        this.send({
            type: 'subscribe',
            channel: 'activities'
        });
    }

    subscribeToAlerts() {
        this.send({
            type: 'subscribe',
            channel: 'alerts'
        });
    }

    unsubscribeFromChannel(channel) {
        this.send({
            type: 'unsubscribe',
            channel: channel
        });
    }

    requestSystemStatus() {
        this.send({
            type: 'request',
            action: 'system_status'
        });
    }

    requestMetrics() {
        this.send({
            type: 'request',
            action: 'metrics'
        });
    }

    requestProjects() {
        this.send({
            type: 'request',
            action: 'projects'
        });
    }

    requestBuilds() {
        this.send({
            type: 'request',
            action: 'builds'
        });
    }

    requestActivities() {
        this.send({
            type: 'request',
            action: 'activities'
        });
    }

    requestAlerts() {
        this.send({
            type: 'request',
            action: 'alerts'
        });
    }

    // Simulate real-time data for development/testing
    startSimulation() {
        console.log('🎭 Starting WebSocket simulation mode...');
        
        // Simulate metrics updates
        setInterval(() => {
            if (this.isConnected) {
                this.send({
                    type: 'metrics',
                    payload: {
                        cpuUsage: Math.floor(Math.random() * 40) + 20,
                        memoryUsage: Math.floor(Math.random() * 30) + 50,
                        diskUsage: Math.floor(Math.random() * 20) + 60,
                        networkLatency: Math.floor(Math.random() * 50) + 10
                    }
                });
            }
        }, 5000);
        
        // Simulate random activities
        setInterval(() => {
            if (this.isConnected && Math.random() < 0.3) {
                const activities = [
                    { type: 'build', message: 'Build process started', icon: '🔨' },
                    { type: 'test', message: 'Running unit tests', icon: '🧪' },
                    { type: 'deploy', message: 'Deploying to staging', icon: '🚀' },
                    { type: 'build', message: 'Build completed successfully', icon: '✅' },
                    { type: 'test', message: 'All tests passed', icon: '🎉' },
                    { type: 'deploy', message: 'Production deployment successful', icon: '🚀' }
                ];
                
                const activity = activities[Math.floor(Math.random() * activities.length)];
                this.send({
                    type: 'activity',
                    payload: activity
                });
            }
        }, 10000);
        
        // Simulate occasional alerts
        setInterval(() => {
            if (this.isConnected && Math.random() < 0.1) {
                const alerts = [
                    {
                        type: 'warning',
                        title: 'High Memory Usage',
                        description: 'Memory usage is above 80%',
                        icon: '⚠️'
                    },
                    {
                        type: 'info',
                        title: 'New Version Available',
                        description: 'Dashboard v2.3 is ready for deployment',
                        icon: 'ℹ️'
                    },
                    {
                        type: 'critical',
                        title: 'Build Failure',
                        description: 'Build #42 failed due to test errors',
                        icon: '🚨'
                    }
                ];
                
                const alert = alerts[Math.floor(Math.random() * alerts.length)];
                this.send({
                    type: 'alert',
                    payload: alert
                });
            }
        }, 30000);
    }

    stopSimulation() {
        console.log('🎭 Stopping WebSocket simulation...');
        // Simulation intervals are cleared when WebSocket disconnects
    }

    getConnectionStatus() {
        return {
            connected: this.isConnected,
            readyState: this.websocket ? this.websocket.readyState : null,
            reconnectAttempts: this.reconnectAttempts,
            maxReconnectAttempts: this.maxReconnectAttempts
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebSocketManager;
}
