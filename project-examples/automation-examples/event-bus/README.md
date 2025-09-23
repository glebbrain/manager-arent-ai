# 🔄 ManagerAgentAI Event Bus

Event-driven architecture implementation for ManagerAgentAI services providing decoupled communication, real-time processing, and scalable event handling.

## 🎯 Overview

The Event Bus serves as the central nervous system for ManagerAgentAI services, enabling:

- **Decoupled Communication**: Services communicate through events without direct dependencies
- **Real-time Processing**: Immediate event processing and distribution
- **Scalable Architecture**: Horizontal scaling through event-driven patterns
- **Fault Tolerance**: Resilient event processing with retry mechanisms
- **Event Sourcing**: Complete event history for audit and replay
- **Message Routing**: Intelligent routing based on event types and priorities
- **Monitoring & Analytics**: Comprehensive event tracking and metrics

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Services      │───▶│   Event Bus     │───▶│   Event         │
│   (Publishers)  │    │   (Port 4000)   │    │   Handlers      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Event         │
                       │   Storage       │
                       │   & History     │
                       └─────────────────┘
```

## 📋 Event Types

| Event Type | Priority | Description | Handlers |
|------------|----------|-------------|----------|
| **project.created** | High | Project created event | notification-service, analytics-service, audit-service |
| **project.updated** | Medium | Project updated event | notification-service, analytics-service, audit-service |
| **project.deleted** | High | Project deleted event | notification-service, analytics-service, audit-service, cleanup-service |
| **task.created** | Medium | Task created event | notification-service, ai-planner, workflow-orchestrator |
| **task.completed** | Medium | Task completed event | notification-service, analytics-service, ai-planner |
| **workflow.started** | High | Workflow started event | notification-service, monitoring-service, audit-service |
| **workflow.completed** | High | Workflow completed event | notification-service, analytics-service, monitoring-service |
| **workflow.failed** | Critical | Workflow failed event | notification-service, error-handler, monitoring-service |
| **notification.sent** | Low | Notification sent event | analytics-service, audit-service |
| **user.authenticated** | Medium | User authenticated event | analytics-service, audit-service, session-manager |
| **error.occurred** | Critical | Error occurred event | error-handler, notification-service, monitoring-service |
| **system.health** | Low | System health check event | monitoring-service, alert-service |

## 🚀 Quick Start

### 1. Initialize Event Bus
```powershell
# PowerShell
.\scripts\event-bus.ps1 init

# JavaScript
node scripts\event-bus.js init
```

### 2. Start Event Bus
```powershell
# PowerShell
.\scripts\event-bus.ps1 start

# JavaScript
node scripts\event-bus.js start
```

### 3. Check Status
```powershell
# PowerShell
.\scripts\event-bus.ps1 status

# JavaScript
node scripts\event-bus.js status
```

## 📋 Commands

### Event Bus Management
```powershell
# Initialize event bus
.\scripts\event-bus.ps1 init

# Start event bus server
.\scripts\event-bus.ps1 start

# Stop event bus server
.\scripts\event-bus.ps1 stop

# Show event bus status
.\scripts\event-bus.ps1 status
```

### Event Operations
```powershell
# Publish an event
.\scripts\event-bus.ps1 publish project.created '{"projectId":"123","name":"My Project"}'

# Subscribe to event type
.\scripts\event-bus.ps1 subscribe project.created notification-service

# Unsubscribe from events
.\scripts\event-bus.ps1 unsubscribe notification-service

# Show recent events
.\scripts\event-bus.ps1 events
```

### Monitoring & Analytics
```powershell
# Show event bus metrics
.\scripts\event-bus.ps1 metrics

# Check event bus health
.\scripts\event-bus.ps1 health

# List event types and subscribers
.\scripts\event-bus.ps1 list
```

## 🔧 Configuration

### Event Bus Configuration (`event-bus/config/event-bus.json`)
```json
{
  "port": 4000,
  "host": "localhost",
  "maxEvents": 10000,
  "retentionPeriod": 86400000,
  "persistence": {
    "enabled": true,
    "file": "events.json",
    "backupInterval": 3600000
  },
  "security": {
    "enabled": true,
    "authToken": "event-bus-secret-key-2025",
    "encryption": true
  },
  "monitoring": {
    "enabled": true,
    "metrics": true,
    "health": true
  },
  "routing": {
    "strategy": "broadcast",
    "retryAttempts": 3,
    "retryDelay": 1000,
    "timeout": 30000
  }
}
```

### Event Types Registry (`event-bus/config/event-types.json`)
```json
{
  "project.created": {
    "description": "Project created event",
    "handlers": ["notification-service", "analytics-service", "audit-service"],
    "priority": "high",
    "retention": 2592000000
  }
}
```

## 🌐 API Endpoints

### Event Bus Endpoints
- `POST /events/publish` - Publish an event
- `POST /events/subscribe` - Subscribe to event type
- `POST /events/unsubscribe` - Unsubscribe from events
- `GET /events/list` - List event types and subscribers
- `GET /events/history?limit=10` - Get recent events
- `GET /status` - Event bus status
- `GET /health` - Health check
- `GET /metrics` - Event bus metrics

### Event Publishing
```bash
# Publish project created event
curl -X POST http://localhost:4000/events/publish \
  -H "Content-Type: application/json" \
  -d '{"type":"project.created","data":{"projectId":"123","name":"My Project"}}'

# Publish task completed event
curl -X POST http://localhost:4000/events/publish \
  -H "Content-Type: application/json" \
  -d '{"type":"task.completed","data":{"taskId":"456","duration":3600}}'
```

### Event Subscription
```bash
# Subscribe to project events
curl -X POST http://localhost:4000/events/subscribe \
  -H "Content-Type: application/json" \
  -d '{"eventType":"project.created","subscriberId":"notification-service"}'

# Unsubscribe from all events
curl -X POST http://localhost:4000/events/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{"subscriberId":"notification-service"}'
```

## 🔒 Security Features

### Authentication
- Token-based authentication
- Configurable secret key
- Request validation
- Access control

### Event Security
- Event data encryption
- Secure event transmission
- Access logging
- Audit trail

### Rate Limiting
- Event publishing limits
- Subscription limits
- Request throttling
- Abuse prevention

## 📊 Monitoring & Metrics

### Real-time Metrics
- Events published per second
- Events processed per second
- Event processing latency
- Error rates
- Active subscribers
- Queue size

### Event Analytics
- Event type distribution
- Priority breakdown
- Handler performance
- Success/failure rates
- Historical trends

### Health Monitoring
- Event bus health status
- Service connectivity
- Event processing health
- Resource utilization
- Error tracking

## 🔄 Event Processing Flow

1. **Event Publishing** → Event Bus receives event
2. **Event Validation** → Validate event type and data
3. **Event Queuing** → Add event to processing queue
4. **Event Routing** → Route to appropriate handlers
5. **Handler Processing** → Process event with handlers
6. **Event Storage** → Store event in history
7. **Metrics Update** → Update processing metrics
8. **Notification** → Notify subscribers of completion

## 🛠️ Development

### Adding New Event Types
1. Add event type to `event-types.json`
2. Define handlers and priority
3. Set retention period
4. Restart event bus to load new type

### Custom Event Handlers
- Implement handler interface
- Register with event bus
- Handle event processing
- Report processing status

### Event Filtering
- Event type filtering
- Priority-based filtering
- Data-based filtering
- Subscriber-specific filtering

## 🚨 Troubleshooting

### Common Issues
1. **Event Not Processed**
   - Check event type registration
   - Verify handler availability
   - Check event queue status
   - Review error logs

2. **High Latency**
   - Check queue size
   - Verify handler performance
   - Review system resources
   - Optimize event processing

3. **Memory Issues**
   - Check event retention settings
   - Review event history size
   - Monitor memory usage
   - Adjust max events limit

4. **Connection Issues**
   - Check network connectivity
   - Verify service endpoints
   - Review authentication
   - Check firewall settings

### Debug Commands
```powershell
# Check event bus status
.\scripts\event-bus.ps1 status

# Show recent events
.\scripts\event-bus.ps1 events

# Check metrics
.\scripts\event-bus.ps1 metrics

# Health check
.\scripts\event-bus.ps1 health
```

## 📈 Performance

### Optimization Features
- Event batching
- Parallel processing
- Memory management
- Queue optimization
- Handler pooling

### Scaling
- Horizontal scaling
- Load balancing
- Event partitioning
- Distributed processing
- Cluster support

## 🔮 Future Enhancements

- [ ] Event streaming support
- [ ] Advanced event filtering
- [ ] Event replay capabilities
- [ ] Distributed event bus
- [ ] Event versioning
- [ ] Advanced routing strategies
- [ ] Event correlation
- [ ] Real-time dashboards

---

**ManagerAgentAI Event Bus** - Event-driven architecture for scalable service communication
