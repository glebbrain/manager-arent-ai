# Auto-scaling Service

## Overview

The Auto-scaling Service is a comprehensive microservice that provides automatic scaling capabilities for cloud applications and services. It monitors system metrics, evaluates scaling conditions, and automatically adjusts resource allocation based on demand.

## Features

### Core Scaling Features
- **Automatic Scaling**: Scale up/down based on configurable metrics
- **Multiple Scaling Strategies**: CPU, memory, request rate, queue length, and custom metrics
- **Scaling Groups**: Manage groups of instances with unified scaling policies
- **Scaling Rules**: Define custom scaling conditions and actions
- **Scaling Policies**: Pre-configured scaling strategies (conservative, aggressive, balanced, performance, cost-optimized)

### Metrics Collection
- **Real-time Metrics**: Collect system and application metrics
- **Multiple Metric Types**: CPU, memory, disk, network, requests, response time, error rate, queue length
- **Metric Aggregation**: Average, sum, min, max, count, percentiles
- **Custom Metrics**: Support for application-specific metrics
- **Historical Data**: Store and retrieve historical metric data

### Health Monitoring
- **Health Checks**: HTTP, TCP, database, disk, memory, CPU, and custom checks
- **Instance Health**: Monitor individual instance health status
- **Health Alerts**: Configurable alerts for unhealthy instances
- **Health Metrics**: Track healthy vs unhealthy instances

### Scaling Engine
- **Decision Engine**: Evaluate scaling conditions and make decisions
- **Rule Evaluation**: Process multiple scaling rules with priority
- **Cooldown Logic**: Prevent rapid scaling changes
- **Action Generation**: Generate appropriate scaling actions

## Architecture

```
auto-scaling/
├── server.js                 # Express server setup
├── package.json             # Dependencies and scripts
├── modules/
│   ├── scaling-manager.js   # Scaling group management
│   ├── scaling-engine.js    # Scaling decision engine
│   ├── metrics-collector.js # Metrics collection and aggregation
│   └── health-monitor.js    # Health monitoring and checks
├── routes/
│   ├── scaling.js          # Scaling group and action APIs
│   ├── metrics.js          # Metrics collection and query APIs
│   └── health.js           # Health monitoring APIs
└── README.md               # This file
```

## API Endpoints

### Scaling Groups

#### Create Scaling Group
```http
POST /api/scaling/groups
Content-Type: application/json

{
  "name": "web-app-scaling",
  "description": "Scaling group for web application",
  "provider": "aws",
  "region": "us-east-1",
  "template": "web-application",
  "strategy": "cpu-based",
  "minInstances": 2,
  "maxInstances": 10,
  "desiredInstances": 3
}
```

#### Get Scaling Groups
```http
GET /api/scaling/groups?provider=aws&status=active
```

#### Get Scaling Group by ID
```http
GET /api/scaling/groups/{id}
```

#### Update Scaling Group
```http
PUT /api/scaling/groups/{id}
Content-Type: application/json

{
  "maxInstances": 15,
  "strategy": "memory-based"
}
```

#### Delete Scaling Group
```http
DELETE /api/scaling/groups/{id}
```

#### Scale Up
```http
POST /api/scaling/groups/{id}/scale-up
Content-Type: application/json

{
  "instances": 2
}
```

#### Scale Down
```http
POST /api/scaling/groups/{id}/scale-down
Content-Type: application/json

{
  "instances": 1
}
```

### Scaling Rules

#### Get Scaling Rules
```http
GET /api/scaling/rules
```

#### Create Scaling Rule
```http
POST /api/scaling/rules
Content-Type: application/json

{
  "name": "High CPU Rule",
  "description": "Scale up when CPU is high",
  "metric": "cpu_utilization",
  "operator": ">",
  "threshold": 80,
  "action": "scale_up",
  "instances": 1,
  "cooldown": 300,
  "priority": 1
}
```

#### Update Scaling Rule
```http
PUT /api/scaling/rules/{id}
Content-Type: application/json

{
  "threshold": 85
}
```

#### Delete Scaling Rule
```http
DELETE /api/scaling/rules/{id}
```

### Metrics

#### Collect Metrics
```http
POST /api/metrics/collect
Content-Type: application/json

{
  "collectorId": "system"
}
```

#### Get Metrics
```http
GET /api/metrics?name=cpu_utilization&startTime=2024-01-01&endTime=2024-01-02
```

#### Aggregate Metrics
```http
POST /api/metrics/aggregate
Content-Type: application/json

{
  "metricName": "cpu_utilization",
  "aggregation": "average",
  "timeRange": "1h"
}
```

#### Get Metric Types
```http
GET /api/metrics/types
```

#### Get Collectors
```http
GET /api/metrics/collectors
```

### Health Monitoring

#### Perform Health Check
```http
POST /api/health/check
Content-Type: application/json

{
  "instanceId": "instance-123",
  "checkId": "http",
  "config": {
    "path": "/health",
    "timeout": 5000
  }
}
```

#### Get Health Status
```http
GET /api/health/status/{instanceId}
```

#### Get Health Checks
```http
GET /api/health/checks
```

#### Get Health Alerts
```http
GET /api/health/alerts?severity=critical&acknowledged=false
```

## Configuration

### Scaling Strategies

#### CPU-based Scaling
- **Scale Up**: When CPU utilization > 70%
- **Scale Down**: When CPU utilization < 30%
- **Cooldown**: 5 minutes
- **Instances**: 1 per action

#### Memory-based Scaling
- **Scale Up**: When memory utilization > 80%
- **Scale Down**: When memory utilization < 40%
- **Cooldown**: 5 minutes
- **Instances**: 1 per action

#### Request-based Scaling
- **Scale Up**: When requests/second > 100
- **Scale Down**: When requests/second < 20
- **Cooldown**: 3 minutes
- **Instances**: 2 per action

#### Queue-based Scaling
- **Scale Up**: When queue length > 50
- **Scale Down**: When queue length < 10
- **Cooldown**: 2 minutes
- **Instances**: 1 per action

### Scaling Templates

#### Web Application
- **Strategy**: CPU-based
- **Min Instances**: 2
- **Max Instances**: 10
- **Target CPU**: 70%
- **Health Check**: `/health`

#### API Service
- **Strategy**: Request-based
- **Min Instances**: 3
- **Max Instances**: 20
- **Target RPS**: 100
- **Health Check**: `/api/health`

#### Data Processor
- **Strategy**: Queue-based
- **Min Instances**: 1
- **Max Instances**: 15
- **Target Queue Length**: 50
- **Health Check**: `/status`

### Health Check Types

#### HTTP Health Check
- **Path**: `/health`
- **Method**: GET
- **Timeout**: 5000ms
- **Expected Status**: 200
- **Expected Response**: "OK"

#### TCP Health Check
- **Port**: 8080
- **Timeout**: 3000ms

#### Database Health Check
- **Query**: `SELECT 1`
- **Timeout**: 5000ms

#### Disk Health Check
- **Path**: `/`
- **Threshold**: 90%
- **Timeout**: 2000ms

#### Memory Health Check
- **Threshold**: 95%
- **Timeout**: 1000ms

#### CPU Health Check
- **Threshold**: 90%
- **Timeout**: 1000ms

## Usage Examples

### Basic Scaling Setup

```javascript
// Create a scaling group
const scalingGroup = await fetch('/api/scaling/groups', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'my-app-scaling',
    provider: 'aws',
    region: 'us-east-1',
    template: 'web-application',
    minInstances: 2,
    maxInstances: 10
  })
});

// Monitor metrics
const metrics = await fetch('/api/metrics/collect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ collectorId: 'system' })
});

// Check health
const health = await fetch('/api/health/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    instanceId: 'instance-123',
    checkId: 'http'
  })
});
```

### Custom Scaling Rule

```javascript
// Create a custom scaling rule
const rule = await fetch('/api/scaling/rules', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Custom Error Rate Rule',
    description: 'Scale up when error rate is high',
    metric: 'error_rate',
    operator: '>',
    threshold: 5,
    action: 'scale_up',
    instances: 1,
    cooldown: 180,
    priority: 1
  })
});
```

### Metrics Aggregation

```javascript
// Get average CPU utilization for the last hour
const avgCpu = await fetch('/api/metrics/aggregate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    metricName: 'cpu_utilization',
    aggregation: 'average',
    timeRange: '1h'
  })
});
```

## Monitoring and Alerting

### Health Alerts

- **Instance Unhealthy**: Critical alert when instance fails health check
- **Multiple Instances Unhealthy**: Critical alert when multiple instances fail
- **High Error Rate**: Warning alert when error rate > 10%
- **Slow Response Time**: Warning alert when response time > 5 seconds
- **Resource Exhaustion**: Critical alert when resources > 95%

### Metrics Dashboard

- **Real-time Metrics**: Live view of system metrics
- **Historical Data**: Historical metric trends
- **Scaling Actions**: History of scaling actions
- **Health Status**: Instance health overview
- **Performance Metrics**: Response times, throughput, error rates

## Best Practices

### Scaling Configuration
1. **Set Appropriate Thresholds**: Balance between responsiveness and cost
2. **Use Cooldown Periods**: Prevent rapid scaling changes
3. **Monitor Multiple Metrics**: Don't rely on a single metric
4. **Test Scaling Rules**: Validate rules in staging environment
5. **Set Reasonable Limits**: Define min/max instance counts

### Health Monitoring
1. **Multiple Health Checks**: Use different types of health checks
2. **Regular Health Checks**: Perform checks frequently
3. **Monitor Health Trends**: Track health over time
4. **Set Up Alerts**: Configure appropriate alerting
5. **Test Health Checks**: Ensure health checks work correctly

### Performance Optimization
1. **Optimize Metrics Collection**: Use efficient collection methods
2. **Aggregate Data**: Use appropriate aggregation functions
3. **Store Historical Data**: Keep historical data for analysis
4. **Monitor Performance**: Track scaling engine performance
5. **Tune Scaling Rules**: Optimize rules based on performance

## Troubleshooting

### Common Issues

#### Scaling Not Working
- Check scaling rules are enabled
- Verify metric thresholds are appropriate
- Ensure cooldown periods are not too long
- Check scaling group configuration

#### Health Checks Failing
- Verify health check configuration
- Check network connectivity
- Ensure health check endpoints are accessible
- Review health check timeouts

#### Metrics Not Collected
- Check collectors are enabled
- Verify metric collection intervals
- Ensure metric sources are accessible
- Review collection configuration

### Debugging

#### Enable Debug Logging
```javascript
// Set log level to debug
process.env.LOG_LEVEL = 'debug';
```

#### Check Scaling Decisions
```javascript
// Get recent scaling decisions
const decisions = await fetch('/api/scaling/decisions?scalingGroupId=group-123');
```

#### Monitor Health Status
```javascript
// Get health status for instance
const health = await fetch('/api/health/status/instance-123');
```

## Security Considerations

- **API Authentication**: Implement proper authentication
- **Input Validation**: Validate all input parameters
- **Rate Limiting**: Implement rate limiting for API endpoints
- **Access Control**: Control access to scaling operations
- **Audit Logging**: Log all scaling actions and decisions

## Future Enhancements

- **Machine Learning**: AI-powered scaling predictions
- **Cost Optimization**: Automatic cost optimization
- **Multi-Cloud**: Support for multiple cloud providers
- **Advanced Metrics**: Custom metric support
- **Predictive Scaling**: Predictive scaling based on trends
- **Integration**: Integration with monitoring tools
- **Dashboard**: Web-based management dashboard
- **Notifications**: Advanced notification system
