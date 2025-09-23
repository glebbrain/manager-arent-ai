const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use('/api/', limiter);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// AI Performance Monitor Class
class AIPerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.alerts = [];
        this.historicalData = [];
        this.realTimeConnections = new Set();
        this.alertThresholds = {
            responseTime: 5000, // 5 seconds
            errorRate: 0.05, // 5%
            accuracy: 0.85, // 85%
            throughput: 10 // requests per second
        };
        this.startTime = Date.now();
    }

    // Track AI model performance
    async trackAIModel(modelId, metrics) {
        const timestamp = Date.now();
        const modelMetrics = {
            modelId,
            timestamp,
            responseTime: metrics.responseTime || 0,
            accuracy: metrics.accuracy || 0,
            throughput: metrics.throughput || 0,
            errorRate: metrics.errorRate || 0,
            memoryUsage: metrics.memoryUsage || 0,
            cpuUsage: metrics.cpuUsage || 0,
            requests: metrics.requests || 0,
            errors: metrics.errors || 0,
            success: metrics.success || false
        };

        // Store metrics
        this.metrics.set(modelId, modelMetrics);
        
        // Add to historical data
        this.historicalData.push(modelMetrics);
        
        // Keep only last 1000 records
        if (this.historicalData.length > 1000) {
            this.historicalData = this.historicalData.slice(-1000);
        }

        // Check for alerts
        await this.checkAlerts(modelId, modelMetrics);

        // Broadcast to connected clients
        this.broadcastMetrics(modelId, modelMetrics);

        return modelMetrics;
    }

    // Check for performance alerts
    async checkAlerts(modelId, metrics) {
        const alerts = [];

        if (metrics.responseTime > this.alertThresholds.responseTime) {
            alerts.push({
                type: 'response_time',
                severity: 'warning',
                message: `High response time: ${metrics.responseTime}ms for model ${modelId}`,
                timestamp: Date.now(),
                modelId
            });
        }

        if (metrics.errorRate > this.alertThresholds.errorRate) {
            alerts.push({
                type: 'error_rate',
                severity: 'critical',
                message: `High error rate: ${(metrics.errorRate * 100).toFixed(2)}% for model ${modelId}`,
                timestamp: Date.now(),
                modelId
            });
        }

        if (metrics.accuracy < this.alertThresholds.accuracy) {
            alerts.push({
                type: 'accuracy',
                severity: 'warning',
                message: `Low accuracy: ${(metrics.accuracy * 100).toFixed(2)}% for model ${modelId}`,
                timestamp: Date.now(),
                modelId
            });
        }

        if (metrics.throughput < this.alertThresholds.throughput) {
            alerts.push({
                type: 'throughput',
                severity: 'info',
                message: `Low throughput: ${metrics.throughput} req/s for model ${modelId}`,
                timestamp: Date.now(),
                modelId
            });
        }

        // Add alerts to list
        this.alerts.push(...alerts);
        
        // Keep only last 100 alerts
        if (this.alerts.length > 100) {
            this.alerts = this.alerts.slice(-100);
        }

        // Broadcast alerts
        if (alerts.length > 0) {
            this.broadcastAlerts(alerts);
        }
    }

    // Get performance summary
    getPerformanceSummary() {
        const summary = {
            totalModels: this.metrics.size,
            totalRequests: 0,
            totalErrors: 0,
            averageResponseTime: 0,
            averageAccuracy: 0,
            averageThroughput: 0,
            uptime: Date.now() - this.startTime,
            alerts: this.alerts.length,
            criticalAlerts: this.alerts.filter(a => a.severity === 'critical').length
        };

        let totalResponseTime = 0;
        let totalAccuracy = 0;
        let totalThroughput = 0;

        for (const [modelId, metrics] of this.metrics) {
            summary.totalRequests += metrics.requests || 0;
            summary.totalErrors += metrics.errors || 0;
            totalResponseTime += metrics.responseTime || 0;
            totalAccuracy += metrics.accuracy || 0;
            totalThroughput += metrics.throughput || 0;
        }

        if (this.metrics.size > 0) {
            summary.averageResponseTime = totalResponseTime / this.metrics.size;
            summary.averageAccuracy = totalAccuracy / this.metrics.size;
            summary.averageThroughput = totalThroughput / this.metrics.size;
        }

        return summary;
    }

    // Get model-specific metrics
    getModelMetrics(modelId) {
        return this.metrics.get(modelId) || null;
    }

    // Get historical data
    getHistoricalData(modelId = null, timeRange = 3600000) { // 1 hour default
        const cutoff = Date.now() - timeRange;
        let data = this.historicalData.filter(d => d.timestamp >= cutoff);
        
        if (modelId) {
            data = data.filter(d => d.modelId === modelId);
        }

        return data;
    }

    // Get alerts
    getAlerts(severity = null) {
        let alerts = this.alerts;
        if (severity) {
            alerts = alerts.filter(a => a.severity === severity);
        }
        return alerts.slice(-50); // Last 50 alerts
    }

    // Broadcast metrics to connected clients
    broadcastMetrics(modelId, metrics) {
        io.emit('metrics_update', {
            modelId,
            metrics,
            timestamp: Date.now()
        });
    }

    // Broadcast alerts to connected clients
    broadcastAlerts(alerts) {
        io.emit('alerts_update', {
            alerts,
            timestamp: Date.now()
        });
    }

    // Add real-time connection
    addConnection(socket) {
        this.realTimeConnections.add(socket);
    }

    // Remove real-time connection
    removeConnection(socket) {
        this.realTimeConnections.delete(socket);
    }
}

// Initialize AI Performance Monitor
const aiMonitor = new AIPerformanceMonitor();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: Date.now(),
        uptime: process.uptime(),
        version: '2.9.0'
    });
});

app.get('/api/summary', (req, res) => {
    res.json(aiMonitor.getPerformanceSummary());
});

app.get('/api/models', (req, res) => {
    const models = Array.from(aiMonitor.metrics.keys()).map(modelId => ({
        modelId,
        metrics: aiMonitor.getModelMetrics(modelId)
    }));
    res.json(models);
});

app.get('/api/models/:modelId', (req, res) => {
    const { modelId } = req.params;
    const metrics = aiMonitor.getModelMetrics(modelId);
    
    if (!metrics) {
        return res.status(404).json({ error: 'Model not found' });
    }
    
    res.json(metrics);
});

app.get('/api/historical', (req, res) => {
    const { modelId, timeRange } = req.query;
    const data = aiMonitor.getHistoricalData(modelId, parseInt(timeRange) || 3600000);
    res.json(data);
});

app.get('/api/alerts', (req, res) => {
    const { severity } = req.query;
    const alerts = aiMonitor.getAlerts(severity);
    res.json(alerts);
});

app.post('/api/metrics', async (req, res) => {
    try {
        const { modelId, metrics } = req.body;
        
        if (!modelId || !metrics) {
            return res.status(400).json({ error: 'modelId and metrics are required' });
        }

        const result = await aiMonitor.trackAIModel(modelId, metrics);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/alerts/clear', (req, res) => {
    aiMonitor.alerts = [];
    res.json({ message: 'Alerts cleared' });
});

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    aiMonitor.addConnection(socket);
    
    // Send current metrics on connection
    socket.emit('initial_data', {
        summary: aiMonitor.getPerformanceSummary(),
        models: Array.from(aiMonitor.metrics.entries()).map(([id, metrics]) => ({ modelId: id, metrics })),
        alerts: aiMonitor.getAlerts()
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        aiMonitor.removeConnection(socket);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Advanced Analytics Dashboard v2.9 running on port ${PORT}`);
    console.log(`📊 Real-time AI Performance Monitoring enabled`);
    console.log(`🔗 Dashboard: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});

module.exports = { app, server, aiMonitor };
