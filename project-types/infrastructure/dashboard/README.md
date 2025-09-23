# 🚀 Universal Automation Platform - Real-time Dashboard

> **Version**: 2.2 - AI Enhanced  
> **Status**: ✅ Production Ready  
> **Features**: Real-time monitoring, WebSocket communication, Interactive charts

## 🎯 Overview

The Universal Automation Platform Dashboard provides real-time monitoring and management capabilities for development projects. It features live data updates, interactive charts, and comprehensive project tracking.

## ✨ Features

### 🔄 Real-time Updates
- **Live Metrics**: CPU, Memory, Disk, Network monitoring
- **WebSocket Communication**: Instant data updates
- **Auto-reconnection**: Robust connection handling
- **Heartbeat Monitoring**: Connection health tracking

### 📊 Interactive Charts
- **Performance Trends**: CPU, Memory, Disk usage over time
- **Test Coverage**: Visual test results breakdown
- **Build Status**: Build duration and success tracking
- **Project Activity**: Radar chart for project metrics

### 🎮 Dashboard Components
- **System Health**: Real-time system metrics
- **Active Projects**: Project status and progress
- **Build Status**: Current and recent builds
- **Activity Feed**: Live development activities
- **Alerts & Notifications**: System alerts and warnings

### 🛠️ Advanced Features
- **Chart Export**: Export charts as PNG images
- **Time Range Selection**: 1h, 6h, 24h, 7d views
- **Responsive Design**: Mobile and desktop optimized
- **Theme Support**: Light and dark themes
- **Data Simulation**: Built-in test data generation

## 🚀 Quick Start

### Prerequisites
- Node.js 14.0.0 or higher
- Modern web browser with WebSocket support

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Server**
   ```bash
   npm start
   ```

3. **Open Dashboard**
   ```
   http://localhost:3000
   ```

### Development Mode

```bash
npm run dev
```

## 📁 Project Structure

```
dashboard/
├── index.html          # Main dashboard HTML
├── styles.css          # Dashboard styles
├── dashboard.js        # Main dashboard logic
├── websocket.js        # WebSocket management
├── charts.js           # Charts and visualization
├── server.js           # Node.js server
├── package.json        # Dependencies
└── README.md           # This file
```

## 🔧 Configuration

### Server Configuration

The server can be configured via environment variables:

```bash
PORT=3000                    # Server port (default: 3000)
NODE_ENV=production          # Environment mode
```

### WebSocket Configuration

WebSocket settings can be modified in `websocket.js`:

```javascript
const config = {
    maxReconnectAttempts: 5,    // Max reconnection attempts
    reconnectDelay: 1000,       // Initial reconnect delay (ms)
    maxReconnectDelay: 30000,   // Max reconnect delay (ms)
    heartbeatInterval: 10000    // Heartbeat interval (ms)
};
```

## 📊 API Endpoints

### REST API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Server health check |
| `/api/metrics` | GET | System metrics |
| `/api/projects` | GET | Project list |
| `/api/builds` | GET | Build status |
| `/api/activities` | GET | Activity feed |
| `/api/alerts` | GET | System alerts |

### WebSocket API

| Message Type | Description |
|--------------|-------------|
| `heartbeat` | Connection heartbeat |
| `metrics` | System metrics update |
| `project` | Project status update |
| `build` | Build status update |
| `activity` | New activity item |
| `alert` | New alert notification |
| `system_status` | System status update |

## 🎨 Customization

### Adding New Charts

1. **Create Chart Canvas**
   ```html
   <canvas id="myChart"></canvas>
   ```

2. **Initialize Chart**
   ```javascript
   const chart = new Chart(ctx, {
       type: 'line',
       data: { /* chart data */ },
       options: { /* chart options */ }
   });
   ```

3. **Add to ChartsManager**
   ```javascript
   this.charts.myChart = chart;
   ```

### Custom Metrics

Add new metrics by extending the metrics object:

```javascript
this.metrics = {
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkLatency: 0,
    customMetric: 0  // Add your metric here
};
```

### Styling

Modify `styles.css` to customize the appearance:

```css
/* Custom theme colors */
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --success-color: #48bb78;
    --warning-color: #ed8936;
    --error-color: #f56565;
}
```

## 🔌 WebSocket Integration

### Client Connection

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
    console.log('Connected to dashboard');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Handle real-time data
};
```

### Server Broadcasting

```javascript
// Broadcast to all connected clients
this.broadcast({
    type: 'metrics',
    payload: { cpuUsage: 75 }
});
```

## 🧪 Testing

### Manual Testing

1. **Start Server**: `npm start`
2. **Open Dashboard**: `http://localhost:3000`
3. **Check WebSocket**: Open browser dev tools → Network → WS
4. **Verify Updates**: Data should update every 5 seconds

### Automated Testing

```bash
# Run tests (when implemented)
npm test
```

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   NODE_ENV=production
   PORT=3000
   ```

2. **Process Management**
   ```bash
   # Using PM2
   pm2 start server.js --name dashboard
   
   # Using systemd
   sudo systemctl start dashboard
   ```

3. **Reverse Proxy (Nginx)**
   ```nginx
   location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
   }
   ```

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check if port 3000 is available
   - Verify firewall settings
   - Check browser WebSocket support

2. **Charts Not Loading**
   - Ensure Chart.js is loaded
   - Check browser console for errors
   - Verify canvas elements exist

3. **Data Not Updating**
   - Check WebSocket connection status
   - Verify server is running
   - Check browser network tab

### Debug Mode

Enable debug logging:

```javascript
// In dashboard.js
const DEBUG = true;

if (DEBUG) {
    console.log('Debug: WebSocket message received', data);
}
```

## 📈 Performance

### Optimization Tips

1. **Chart Performance**
   - Limit data points to 100-200
   - Use `update('none')` for smooth updates
   - Implement data sampling for large datasets

2. **WebSocket Performance**
   - Batch multiple updates
   - Implement message queuing
   - Use compression for large payloads

3. **Memory Management**
   - Clear old data regularly
   - Limit activity/alert history
   - Implement garbage collection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation**: Check this README
- **Issues**: Create GitHub issue
- **Discussions**: Use GitHub Discussions

---

**Universal Automation Platform v2.2** - Real-time Dashboard for Modern Development
