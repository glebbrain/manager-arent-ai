# Advanced Monitoring Deployment Script
# Version: 2.9
# Description: Deploys AI-powered system monitoring and alerting

param(
    [string]$Namespace = "manager-agent-ai",
    [string]$Environment = "production",
    [switch]$DryRun = $false,
    [switch]$SkipValidation = $false,
    [switch]$EnableAI = $true,
    [switch]$EnableAnomalyDetection = $true,
    [switch]$EnablePredictiveAnalytics = $true,
    [switch]$EnableIntelligentAlerting = $true,
    [switch]$EnableDashboards = $true,
    [switch]$EnableAnalytics = $true
)

Write-Host "📊 Starting Advanced Monitoring Deployment v2.9" -ForegroundColor Green
Write-Host "Namespace: $Namespace" -ForegroundColor Yellow
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "AI: $EnableAI" -ForegroundColor Yellow
Write-Host "Anomaly Detection: $EnableAnomalyDetection" -ForegroundColor Yellow
Write-Host "Predictive Analytics: $EnablePredictiveAnalytics" -ForegroundColor Yellow
Write-Host "Intelligent Alerting: $EnableIntelligentAlerting" -ForegroundColor Yellow
Write-Host "Dashboards: $EnableDashboards" -ForegroundColor Yellow
Write-Host "Analytics: $EnableAnalytics" -ForegroundColor Yellow

# Function to execute kubectl commands
function Invoke-Kubectl {
    param([string]$Command, [string]$Description)
    
    Write-Host "📋 $Description" -ForegroundColor Cyan
    
    if ($DryRun) {
        Write-Host "DRY RUN: $Command" -ForegroundColor Yellow
        return $true
    }
    
    try {
        Invoke-Expression $Command
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $Description completed successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ $Description failed with exit code $LASTEXITCODE" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Error executing $Description`: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to wait for deployment
function Wait-ForDeployment {
    param([string]$Name, [string]$Namespace, [int]$Timeout = 300)
    
    Write-Host "⏳ Waiting for deployment $Name to be ready..." -ForegroundColor Yellow
    
    $timeoutSeconds = $Timeout
    $elapsed = 0
    
    while ($elapsed -lt $timeoutSeconds) {
        $status = kubectl get deployment $Name -n $Namespace -o jsonpath='{.status.readyReplicas}' 2>$null
        $desired = kubectl get deployment $Name -n $Namespace -o jsonpath='{.spec.replicas}' 2>$null
        
        if ($status -and $status -eq $desired -and $desired -gt 0) {
            Write-Host "✅ Deployment $Name is ready ($status/$desired replicas)" -ForegroundColor Green
            return $true
        }
        
        Start-Sleep -Seconds 10
        $elapsed += 10
        Write-Host "⏳ Still waiting... ($elapsed/$timeoutSeconds seconds)" -ForegroundColor Yellow
    }
    
    Write-Host "❌ Deployment $Name failed to become ready within $timeoutSeconds seconds" -ForegroundColor Red
    return $false
}

# Function to validate prerequisites
function Test-Prerequisites {
    Write-Host "🔍 Validating prerequisites..." -ForegroundColor Cyan
    
    # Check if kubectl is available
    if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
        Write-Host "❌ kubectl is not installed or not in PATH" -ForegroundColor Red
        return $false
    }
    
    # Check if cluster is accessible
    $clusterInfo = kubectl cluster-info 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Cannot connect to Kubernetes cluster" -ForegroundColor Red
        return $false
    }
    
    # Check if namespace exists
    $namespaceExists = kubectl get namespace $Namespace 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "📝 Creating namespace $Namespace..." -ForegroundColor Yellow
        Invoke-Kubectl "kubectl create namespace $Namespace" "Create namespace"
    }
    
    Write-Host "✅ Prerequisites validated successfully" -ForegroundColor Green
    return $true
}

# Function to deploy AI monitoring engine
function Deploy-AIMonitoringEngine {
    if (-not $EnableAI) {
        Write-Host "⏭️ Skipping AI monitoring engine deployment (AI disabled)" -ForegroundColor Yellow
        return $true
    }
    
    Write-Host "🤖 Deploying AI Monitoring Engine..." -ForegroundColor Cyan
    
    # Create AI monitoring engine deployment
    $aiMonitoringYaml = @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-monitoring-engine
  namespace: $Namespace
  labels:
    app: ai-monitoring-engine
    version: "2.9"
    monitoring: "enabled"
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-monitoring-engine
  template:
    metadata:
      labels:
        app: ai-monitoring-engine
        version: "2.9"
        monitoring: "enabled"
    spec:
      serviceAccountName: ai-monitoring-engine-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 2000
      containers:
      - name: ai-monitoring-engine
        image: manager-agent-ai/ai-monitoring-engine:2.9.0
        ports:
        - containerPort: 3000
          name: http
          protocol: TCP
        - containerPort: 9090
          name: metrics
          protocol: TCP
        env:
        - name: NODE_ENV
          value: "$Environment"
        - name: AI_ENABLED
          value: "$EnableAI"
        - name: ANOMALY_DETECTION_ENABLED
          value: "$EnableAnomalyDetection"
        - name: PREDICTIVE_ANALYTICS_ENABLED
          value: "$EnablePredictiveAnalytics"
        - name: INTELLIGENT_ALERTING_ENABLED
          value: "$EnableIntelligentAlerting"
        - name: DASHBOARDS_ENABLED
          value: "$EnableDashboards"
        - name: ANALYTICS_ENABLED
          value: "$EnableAnalytics"
        - name: DB_HOST
          value: "postgresql"
        - name: DB_PORT
          value: "5432"
        - name: DB_NAME
          value: "monitoring_db"
        - name: DB_USER
          value: "monitoring_user"
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: monitoring-secrets
              key: db-password
        - name: REDIS_URL
          value: "redis://redis:6379"
        - name: ELASTICSEARCH_URL
          value: "http://elasticsearch:9200"
        - name: ELASTICSEARCH_USER
          value: "elastic"
        - name: ELASTICSEARCH_PASSWORD
          valueFrom:
            secretKeyRef:
              name: monitoring-secrets
              key: elasticsearch-password
        - name: TENSORFLOW_MODEL_PATH
          value: "/app/models"
        - name: ML_MODEL_CACHE_SIZE
          value: "1000"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
            ephemeral-storage: "4Gi"
          limits:
            memory: "8Gi"
            cpu: "4000m"
            ephemeral-storage: "8Gi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        startupProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 10
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          runAsNonRoot: true
          runAsUser: 1000
          capabilities:
            drop:
            - ALL
        volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: cache
          mountPath: /app/cache
        - name: data
          mountPath: /app/data
        - name: models
          mountPath: /app/models
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: tmp
        emptyDir: {}
      - name: cache
        emptyDir: {}
      - name: data
        persistentVolumeClaim:
          claimName: ai-monitoring-engine-pvc
      - name: models
        persistentVolumeClaim:
          claimName: ai-monitoring-engine-models-pvc
      - name: logs
        persistentVolumeClaim:
          claimName: ai-monitoring-engine-logs-pvc
      nodeSelector:
        kubernetes.io/os: linux
        node.kubernetes.io/instance-type: "m5.xlarge"
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - ai-monitoring-engine
              topologyKey: kubernetes.io/hostname
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            preference:
              matchExpressions:
              - key: node.kubernetes.io/instance-type
                operator: In
                values:
                - "m5.xlarge"
                - "m5.2xlarge"
                - "m5.4xlarge"
      tolerations:
      - key: "node.kubernetes.io/not-ready"
        operator: "Exists"
        effect: "NoExecute"
        tolerationSeconds: 300
      - key: "node.kubernetes.io/unreachable"
        operator: "Exists"
        effect: "NoExecute"
        tolerationSeconds: 300
---
apiVersion: v1
kind: Service
metadata:
  name: ai-monitoring-engine-service
  namespace: $Namespace
  labels:
    app: ai-monitoring-engine
    version: "2.9"
    monitoring: "enabled"
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
    service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: "true"
    service.beta.kubernetes.io/aws-load-balancer-connection-draining-enabled: "true"
    service.beta.kubernetes.io/aws-load-balancer-connection-draining-timeout: "60"
    service.beta.kubernetes.io/aws-load-balancer-ssl-cert: "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"
    service.beta.kubernetes.io/aws-load-balancer-ssl-ports: "https"
    service.beta.kubernetes.io/aws-load-balancer-backend-protocol: "http"
    service.beta.kubernetes.io/aws-load-balancer-ssl-redirect: "443:80"
spec:
  selector:
    app: ai-monitoring-engine
  ports:
  - name: http
    port: 80
    targetPort: 3000
    protocol: TCP
  - name: https
    port: 443
    targetPort: 3000
    protocol: TCP
  - name: metrics
    port: 9090
    targetPort: 9090
    protocol: TCP
  type: LoadBalancer
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 3600
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ai-monitoring-engine-pvc
  namespace: $Namespace
  labels:
    app: ai-monitoring-engine
    version: "2.9"
    monitoring: "enabled"
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 200Gi
  storageClassName: gp3
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ai-monitoring-engine-models-pvc
  namespace: $Namespace
  labels:
    app: ai-monitoring-engine
    version: "2.9"
    monitoring: "enabled"
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
  storageClassName: gp3
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ai-monitoring-engine-logs-pvc
  namespace: $Namespace
  labels:
    app: ai-monitoring-engine
    version: "2.9"
    monitoring: "enabled"
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
  storageClassName: gp3
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ai-monitoring-engine-sa
  namespace: $Namespace
  labels:
    app: ai-monitoring-engine
    version: "2.9"
    monitoring: "enabled"
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ai-monitoring-engine-role
  namespace: $Namespace
rules:
- apiGroups: [""]
  resources: ["pods", "services", "endpoints", "configmaps", "secrets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["autoscaling"]
  resources: ["horizontalpodautoscalers"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["metrics.k8s.io"]
  resources: ["pods", "nodes"]
  verbs: ["get", "list"]
- apiGroups: ["monitoring.coreos.com"]
  resources: ["servicemonitors", "prometheusrules"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ai-monitoring-engine-rolebinding
  namespace: $Namespace
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: ai-monitoring-engine-role
subjects:
- kind: ServiceAccount
  name: ai-monitoring-engine-sa
  namespace: $Namespace
---
apiVersion: v1
kind: Secret
metadata:
  name: monitoring-secrets
  namespace: $Namespace
  labels:
    app: ai-monitoring-engine
    version: "2.9"
    monitoring: "enabled"
type: Opaque
data:
  db-password: "bW9uaXRvcmluZ19wYXNzd29yZA=="
  elasticsearch-password: "ZWxhc3RpY19wYXNzd29yZA=="
  jwt-secret: "bW9uaXRvcmluZ19qd3Rfc2VjcmV0"
  encryption-key: "bW9uaXRvcmluZ19lbmNyeXB0aW9uX2tleQ=="
  ml-api-key: "bWxfYXBpX2tleQ=="
  alert-webhook-url: "aHR0cHM6Ly9ob29rcy5zbGFjay5jb20vc2VydmljZXMv..."
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-monitoring-engine-hpa
  namespace: $Namespace
  labels:
    app: ai-monitoring-engine
    version: "2.9"
    monitoring: "enabled"
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-monitoring-engine
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "300"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 3
        periodSeconds: 15
      selectPolicy: Max
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
      - type: Pods
        value: 1
        periodSeconds: 60
      selectPolicy: Min
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: ai-monitoring-engine-pdb
  namespace: $Namespace
  labels:
    app: ai-monitoring-engine
    version: "2.9"
    monitoring: "enabled"
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: ai-monitoring-engine
"@
    
    $aiMonitoringYaml | Out-File -FilePath "ai-monitoring-deployment.yaml" -Encoding UTF8
    $success = Invoke-Kubectl "kubectl apply -f ai-monitoring-deployment.yaml" "Deploy AI Monitoring Engine"
    Remove-Item "ai-monitoring-deployment.yaml" -Force -ErrorAction SilentlyContinue
    
    if ($success) {
        Wait-ForDeployment "ai-monitoring-engine" $Namespace
    }
    
    return $success
}

# Function to deploy supporting services
function Deploy-SupportingServices {
    Write-Host "🔧 Deploying Supporting Services..." -ForegroundColor Cyan
    
    # Deploy PostgreSQL
    $postgresYaml = @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgresql
  namespace: $Namespace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgresql
  template:
    metadata:
      labels:
        app: postgresql
    spec:
      containers:
      - name: postgresql
        image: postgres:15
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: "monitoring_db"
        - name: POSTGRES_USER
          value: "monitoring_user"
        - name: POSTGRES_PASSWORD
          value: "monitoring_password"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "8Gi"
            cpu: "4000m"
        volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-data
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgresql
  namespace: $Namespace
spec:
  selector:
    app: postgresql
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: $Namespace
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 200Gi
  storageClassName: gp3
"@
    
    $postgresYaml | Out-File -FilePath "postgres-deployment.yaml" -Encoding UTF8
    $success = Invoke-Kubectl "kubectl apply -f postgres-deployment.yaml" "Deploy PostgreSQL"
    Remove-Item "postgres-deployment.yaml" -Force -ErrorAction SilentlyContinue
    
    if ($success) {
        Wait-ForDeployment "postgresql" $Namespace
    }
    
    return $success
}

# Function to validate deployment
function Test-Deployment {
    if ($SkipValidation) {
        Write-Host "⏭️ Skipping deployment validation" -ForegroundColor Yellow
        return $true
    }
    
    Write-Host "🔍 Validating deployment..." -ForegroundColor Cyan
    
    # Check if all deployments are ready
    $deployments = @("ai-monitoring-engine", "postgresql")
    
    foreach ($deployment in $deployments) {
        $status = kubectl get deployment $deployment -n $Namespace -o jsonpath='{.status.readyReplicas}' 2>$null
        $desired = kubectl get deployment $deployment -n $Namespace -o jsonpath='{.spec.replicas}' 2>$null
        
        if (-not $status -or $status -ne $desired) {
            Write-Host "❌ Deployment $deployment is not ready ($status/$desired)" -ForegroundColor Red
            return $false
        }
    }
    
    Write-Host "✅ Deployment validation successful" -ForegroundColor Green
    return $true
}

# Function to display deployment status
function Show-DeploymentStatus {
    Write-Host "`n📊 Monitoring Deployment Status:" -ForegroundColor Cyan
    Write-Host "===============================" -ForegroundColor Cyan
    
    # Show deployments
    Write-Host "`n🚀 Deployments:" -ForegroundColor Yellow
    kubectl get deployments -n $Namespace -o wide
    
    # Show services
    Write-Host "`n🌐 Services:" -ForegroundColor Yellow
    kubectl get services -n $Namespace -o wide
    
    # Show pods
    Write-Host "`n📦 Pods:" -ForegroundColor Yellow
    kubectl get pods -n $Namespace -o wide
    
    # Show HPA
    Write-Host "`n📈 Horizontal Pod Autoscalers:" -ForegroundColor Yellow
    kubectl get hpa -n $Namespace
    
    # Show PDB
    Write-Host "`n🛡️ Pod Disruption Budgets:" -ForegroundColor Yellow
    kubectl get pdb -n $Namespace
    
    # Show secrets
    Write-Host "`n🔐 Secrets:" -ForegroundColor Yellow
    kubectl get secrets -n $Namespace
}

# Main deployment process
try {
    Write-Host "`n🎯 Starting Advanced Monitoring Deployment Process" -ForegroundColor Green
    Write-Host "=================================================" -ForegroundColor Green
    
    # Step 1: Validate prerequisites
    if (-not (Test-Prerequisites)) {
        Write-Host "❌ Prerequisites validation failed. Exiting." -ForegroundColor Red
        exit 1
    }
    
    # Step 2: Deploy supporting services
    if (-not (Deploy-SupportingServices)) {
        Write-Host "❌ Supporting services deployment failed. Exiting." -ForegroundColor Red
        exit 1
    }
    
    # Step 3: Deploy AI monitoring engine
    if (-not (Deploy-AIMonitoringEngine)) {
        Write-Host "❌ AI monitoring engine deployment failed. Exiting." -ForegroundColor Red
        exit 1
    }
    
    # Step 4: Validate deployment
    if (-not (Test-Deployment)) {
        Write-Host "❌ Deployment validation failed. Exiting." -ForegroundColor Red
        exit 1
    }
    
    # Step 5: Show status
    Show-DeploymentStatus
    
    Write-Host "`n🎉 Advanced Monitoring Deployment Completed Successfully!" -ForegroundColor Green
    Write-Host "=======================================================" -ForegroundColor Green
    Write-Host "Namespace: $Namespace" -ForegroundColor Yellow
    Write-Host "Environment: $Environment" -ForegroundColor Yellow
    Write-Host "AI: $EnableAI" -ForegroundColor Yellow
    Write-Host "Anomaly Detection: $EnableAnomalyDetection" -ForegroundColor Yellow
    Write-Host "Predictive Analytics: $EnablePredictiveAnalytics" -ForegroundColor Yellow
    Write-Host "Intelligent Alerting: $EnableIntelligentAlerting" -ForegroundColor Yellow
    Write-Host "Dashboards: $EnableDashboards" -ForegroundColor Yellow
    Write-Host "Analytics: $EnableAnalytics" -ForegroundColor Yellow
    
    Write-Host "`n📚 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Monitor the deployment: kubectl get pods -n $Namespace -w" -ForegroundColor White
    Write-Host "2. Check AI monitoring engine logs: kubectl logs -f deployment/ai-monitoring-engine -n $Namespace" -ForegroundColor White
    Write-Host "3. Access AI monitoring engine: kubectl port-forward svc/ai-monitoring-engine-service -n $Namespace 3000:3000" -ForegroundColor White
    Write-Host "4. Test metrics collection: curl -X POST http://localhost:3000/api/v1/monitoring/metrics/collect" -ForegroundColor White
    Write-Host "5. Test anomaly detection: curl -X POST http://localhost:3000/api/v1/monitoring/anomaly/detect" -ForegroundColor White
    Write-Host "6. Test predictive analytics: curl -X POST http://localhost:3000/api/v1/monitoring/predict/generate" -ForegroundColor White
    
} catch {
    Write-Host "`n❌ Deployment failed with error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
