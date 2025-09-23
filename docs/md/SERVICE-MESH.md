# ☸️ ManagerAgentAI Service Mesh Guide v2.4

Complete service mesh implementation using Istio for microservice management, security, and observability.

## 🎯 Overview

This guide covers the implementation of Istio service mesh for ManagerAgentAI, providing:
- **Service Discovery** - Automatic service registration and discovery
- **Load Balancing** - Intelligent traffic distribution
- **Security** - mTLS, authorization policies, and network security
- **Observability** - Distributed tracing, metrics, and monitoring
- **Traffic Management** - Routing, circuit breaking, and retry policies

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Istio         │───▶│   ManagerAgentAI│───▶│   Microservices │
│   Gateway       │    │   Services      │    │   (Sidecar)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Monitoring    │    │   Security      │    │   Tracing       │
│   (Prometheus)  │    │   (mTLS/RBAC)   │    │   (Jaeger)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Prerequisites

```powershell
# Check Kubernetes installation
kubectl version --client

# Check Istio installation
istioctl version
```

### 2. Install Service Mesh

```powershell
# Install Istio service mesh
.\scripts\service-mesh-manager.ps1 -Action install

# Configure for ManagerAgentAI
.\scripts\service-mesh-manager.ps1 -Action configure

# Check status
.\scripts\service-mesh-manager.ps1 -Action status
```

### 3. Access Services

| Service | URL | Description |
|---------|-----|-------------|
| **API Gateway** | http://localhost:80/api | Main API endpoint |
| **Dashboard** | http://localhost:80/dashboard | Real-time dashboard |
| **Kiali** | http://localhost:20001 | Service mesh visualization |
| **Grafana** | http://localhost:3000 | Metrics dashboard |
| **Jaeger** | http://localhost:16686 | Distributed tracing |
| **Prometheus** | http://localhost:9090 | Metrics collection |

## 📋 Service Mesh Management

### Installation and Configuration

```powershell
# Install service mesh
.\scripts\service-mesh-manager.ps1 -Action install

# Configure for ManagerAgentAI
.\scripts\service-mesh-manager.ps1 -Action configure

# Check status
.\scripts\service-mesh-manager.ps1 -Action status

# Monitor services
.\scripts\service-mesh-manager.ps1 -Action monitor
```

### Traffic Management

```powershell
# View traffic distribution
.\scripts\service-mesh-manager.ps1 -Action traffic

# Check routing rules
kubectl get virtualservice -n manager-agent-ai

# Check destination rules
kubectl get destinationrule -n manager-agent-ai
```

### Security Management

```powershell
# View security configuration
.\scripts\service-mesh-manager.ps1 -Action security

# Check authorization policies
kubectl get authorizationpolicy -n manager-agent-ai

# Check peer authentication
kubectl get peerauthentication -n manager-agent-ai
```

### Monitoring and Observability

```powershell
# View metrics and monitoring
.\scripts\service-mesh-manager.ps1 -Action metrics

# View distributed tracing
.\scripts\service-mesh-manager.ps1 -Action tracing

# Health check
.\scripts\service-mesh-manager.ps1 -Action health
```

## 🔧 Configuration

### Gateway Configuration

```yaml
# External gateway for public access
apiVersion: networking.istio.io/v1alpha3
kind: Gateway
metadata:
  name: manager-agent-ai-gateway
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - "*"
    tls:
      httpsRedirect: true
```

### Virtual Service Configuration

```yaml
# Traffic routing rules
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: manager-agent-ai-vs
spec:
  hosts:
  - "*"
  gateways:
  - manager-agent-ai-gateway
  http:
  - match:
    - uri:
        prefix: /api/
    route:
    - destination:
        host: api-gateway-service
        port:
          number: 3000
    timeout: 30s
    retries:
      attempts: 3
      perTryTimeout: 10s
```

### Destination Rule Configuration

```yaml
# Load balancing and circuit breaking
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: api-gateway-dr
spec:
  host: api-gateway-service
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        maxRequestsPerConnection: 10
    circuitBreaker:
      consecutiveErrors: 3
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
```

## 🔒 Security Features

### mTLS (Mutual TLS)

```yaml
# Enforce mTLS for all services
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: manager-agent-ai-mtls
spec:
  mtls:
    mode: STRICT
```

### Authorization Policies

```yaml
# Service-to-service authorization
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: manager-agent-ai-authz
spec:
  selector:
    matchLabels:
      app: api-gateway
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/istio-system/sa/istio-ingressgateway-service-account"]
    to:
    - operation:
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
        paths: ["/api/*", "/health", "/metrics"]
```

### Network Security

- **mTLS Encryption** - All inter-service communication encrypted
- **RBAC** - Role-based access control for services
- **Network Policies** - Kubernetes network policies
- **Firewall Rules** - Istio security policies

## 📊 Observability

### Metrics Collection

```yaml
# Prometheus metrics configuration
apiVersion: telemetry.istio.io/v1alpha1
kind: Telemetry
metadata:
  name: manager-agent-ai-telemetry
spec:
  metrics:
  - providers:
    - name: prometheus
  - overrides:
    - match:
        metric: ALL_METRICS
      tagOverrides:
        request_protocol:
          value: "http"
        response_code:
          value: "200"
```

### Distributed Tracing

```yaml
# Jaeger tracing configuration
apiVersion: telemetry.istio.io/v1alpha1
kind: Telemetry
metadata:
  name: manager-agent-ai-tracing
spec:
  tracing:
  - providers:
    - name: jaeger
  - overrides:
    - match:
        metric: ALL_METRICS
      providers:
        - name: jaeger
```

### Monitoring Dashboards

- **Kiali** - Service mesh visualization and management
- **Grafana** - Metrics visualization and alerting
- **Jaeger** - Distributed tracing and performance analysis
- **Prometheus** - Metrics collection and querying

## 🚦 Traffic Management

### Load Balancing

```yaml
# Round-robin load balancing
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: project-manager-dr
spec:
  host: project-manager-service
  trafficPolicy:
    loadBalancer:
      simple: ROUND_ROBIN
```

### Circuit Breaking

```yaml
# Circuit breaker configuration
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: api-gateway-dr
spec:
  host: api-gateway-service
  trafficPolicy:
    circuitBreaker:
      consecutiveErrors: 3
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
```

### Retry Policies

```yaml
# Retry configuration
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: api-gateway-vs
spec:
  http:
  - route:
    - destination:
        host: api-gateway-service
    retries:
      attempts: 3
      perTryTimeout: 10s
      retryOn: 5xx,reset,connect-failure,refused-stream
```

## 📈 Performance Optimization

### Connection Pooling

```yaml
# Connection pool configuration
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: api-gateway-dr
spec:
  host: api-gateway-service
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        maxRequestsPerConnection: 10
```

### Outlier Detection

```yaml
# Outlier detection configuration
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: project-manager-dr
spec:
  host: project-manager-service
  trafficPolicy:
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 30
```

### Resource Limits

| Service | CPU Request | CPU Limit | Memory Request | Memory Limit |
|---------|-------------|-----------|----------------|--------------|
| **Istio Gateway** | 100m | 1000m | 128Mi | 512Mi |
| **API Gateway** | 500m | 1000m | 512Mi | 1Gi |
| **Project Manager** | 1000m | 2000m | 1Gi | 2Gi |
| **AI Planner** | 2000m | 4000m | 2Gi | 4Gi |

## 🚨 Troubleshooting

### Common Issues

1. **Service Unreachable**
   ```powershell
   # Check Istio sidecar injection
   kubectl get pods -n manager-agent-ai -o jsonpath='{.items[*].spec.containers[*].name}'
   
   # Check Istio configuration
   istioctl proxy-config cluster -n manager-agent-ai
   ```

2. **mTLS Issues**
   ```powershell
   # Check mTLS status
   istioctl authz check -n manager-agent-ai
   
   # Check peer authentication
   kubectl get peerauthentication -n manager-agent-ai
   ```

3. **Traffic Routing Issues**
   ```powershell
   # Check virtual services
   kubectl get virtualservice -n manager-agent-ai
   
   # Check destination rules
   kubectl get destinationrule -n manager-agent-ai
   ```

4. **Monitoring Issues**
   ```powershell
   # Check Prometheus status
   kubectl get pods -n istio-system -l app=prometheus
   
   # Check Grafana status
   kubectl get pods -n istio-system -l app=grafana
   ```

### Debug Commands

```powershell
# Service mesh status
.\scripts\service-mesh-manager.ps1 -Action status

# Traffic management
.\scripts\service-mesh-manager.ps1 -Action traffic

# Security configuration
.\scripts\service-mesh-manager.ps1 -Action security

# Health check
.\scripts\service-mesh-manager.ps1 -Action health
```

## 🔄 CI/CD Integration

### Istio Configuration Management

```yaml
# GitOps with ArgoCD
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: manager-agent-ai-service-mesh
spec:
  source:
    repoURL: https://github.com/your-org/manager-agent-ai
    path: service-mesh/istio
  destination:
    server: https://kubernetes.default.svc
    namespace: manager-agent-ai
```

### Automated Testing

```yaml
# Service mesh testing
apiVersion: v1
kind: ConfigMap
metadata:
  name: service-mesh-tests
data:
  test-script.sh: |
    #!/bin/bash
    # Test service connectivity
    curl -f http://api-gateway-service:3000/health
    curl -f http://project-manager-service:3000/health
    
    # Test mTLS
    istioctl authz check -n manager-agent-ai
    
    # Test traffic routing
    istioctl proxy-config cluster -n manager-agent-ai
```

## 📚 Best Practices

### Service Mesh Design

1. **Sidecar Injection** - Automatic sidecar injection for all services
2. **mTLS** - Mutual TLS for all inter-service communication
3. **Circuit Breaking** - Circuit breakers for fault tolerance
4. **Retry Policies** - Intelligent retry mechanisms
5. **Load Balancing** - Multiple load balancing strategies

### Security

1. **Zero Trust** - Default deny, explicit allow
2. **mTLS** - Encrypt all inter-service communication
3. **RBAC** - Role-based access control
4. **Network Policies** - Kubernetes network policies
5. **Regular Updates** - Keep Istio and configurations updated

### Monitoring

1. **Comprehensive Metrics** - Collect all relevant metrics
2. **Distributed Tracing** - Track requests across services
3. **Alerting** - Set up alerts for critical issues
4. **Dashboards** - Visualize system health and performance
5. **Logging** - Centralized logging for all services

## 🎉 Success Metrics

### Performance KPIs

- **Latency**: < 100ms p95
- **Throughput**: > 1000 RPS
- **Availability**: 99.9%
- **Error Rate**: < 0.1%
- **mTLS Coverage**: 100%

### Operational KPIs

- **Service Discovery**: < 1 second
- **Configuration Update**: < 30 seconds
- **Circuit Breaker**: < 5 seconds
- **Retry Success**: > 95%
- **Monitoring Coverage**: 100%

---

**ManagerAgentAI Service Mesh v2.4** - Complete service mesh solution for secure, observable, and manageable microservices.
