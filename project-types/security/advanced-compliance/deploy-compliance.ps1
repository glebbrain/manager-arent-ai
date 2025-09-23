# Advanced Compliance Automation Deployment Script
# Version: 2.9
# Description: Deploys GDPR, HIPAA, SOX compliance automation

param(
    [string]$Namespace = "manager-agent-ai",
    [string]$Environment = "production",
    [switch]$DryRun = $false,
    [switch]$SkipValidation = $false,
    [switch]$EnableGDPR = $true,
    [switch]$EnableHIPAA = $true,
    [switch]$EnableSOX = $true,
    [switch]$EnableMonitoring = $true,
    [switch]$EnableReporting = $true,
    [switch]$EnableAutomation = $true
)

Write-Host "🔒 Starting Advanced Compliance Automation Deployment v2.9" -ForegroundColor Green
Write-Host "Namespace: $Namespace" -ForegroundColor Yellow
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "GDPR: $EnableGDPR" -ForegroundColor Yellow
Write-Host "HIPAA: $EnableHIPAA" -ForegroundColor Yellow
Write-Host "SOX: $EnableSOX" -ForegroundColor Yellow
Write-Host "Monitoring: $EnableMonitoring" -ForegroundColor Yellow
Write-Host "Reporting: $EnableReporting" -ForegroundColor Yellow
Write-Host "Automation: $EnableAutomation" -ForegroundColor Yellow

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

# Function to deploy compliance engine
function Deploy-ComplianceEngine {
    Write-Host "🔒 Deploying Compliance Engine..." -ForegroundColor Cyan
    
    # Create compliance engine deployment
    $complianceYaml = @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: compliance-engine
  namespace: $Namespace
  labels:
    app: compliance-engine
    version: "2.9"
    compliance: "enabled"
spec:
  replicas: 2
  selector:
    matchLabels:
      app: compliance-engine
  template:
    metadata:
      labels:
        app: compliance-engine
        version: "2.9"
        compliance: "enabled"
    spec:
      serviceAccountName: compliance-engine-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 2000
      containers:
      - name: compliance-engine
        image: manager-agent-ai/compliance-engine:2.9.0
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
        - name: GDPR_ENABLED
          value: "$EnableGDPR"
        - name: HIPAA_ENABLED
          value: "$EnableHIPAA"
        - name: SOX_ENABLED
          value: "$EnableSOX"
        - name: MONITORING_ENABLED
          value: "$EnableMonitoring"
        - name: REPORTING_ENABLED
          value: "$EnableReporting"
        - name: AUTOMATION_ENABLED
          value: "$EnableAutomation"
        - name: DB_HOST
          value: "postgresql"
        - name: DB_PORT
          value: "5432"
        - name: DB_NAME
          value: "compliance_db"
        - name: DB_USER
          value: "compliance_user"
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: compliance-secrets
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
              name: compliance-secrets
              key: elasticsearch-password
        resources:
          requests:
            memory: "1Gi"
            cpu: "1000m"
            ephemeral-storage: "2Gi"
          limits:
            memory: "4Gi"
            cpu: "4000m"
            ephemeral-storage: "4Gi"
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
      volumes:
      - name: tmp
        emptyDir: {}
      - name: cache
        emptyDir: {}
      - name: data
        persistentVolumeClaim:
          claimName: compliance-engine-pvc
      nodeSelector:
        kubernetes.io/os: linux
        node.kubernetes.io/instance-type: "m5.large"
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
                  - compliance-engine
              topologyKey: kubernetes.io/hostname
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            preference:
              matchExpressions:
              - key: node.kubernetes.io/instance-type
                operator: In
                values:
                - "m5.large"
                - "m5.xlarge"
                - "m5.2xlarge"
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
  name: compliance-engine-service
  namespace: $Namespace
  labels:
    app: compliance-engine
    version: "2.9"
    compliance: "enabled"
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
    app: compliance-engine
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
  name: compliance-engine-pvc
  namespace: $Namespace
  labels:
    app: compliance-engine
    version: "2.9"
    compliance: "enabled"
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
  name: compliance-engine-sa
  namespace: $Namespace
  labels:
    app: compliance-engine
    version: "2.9"
    compliance: "enabled"
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: compliance-engine-role
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
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: compliance-engine-rolebinding
  namespace: $Namespace
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: compliance-engine-role
subjects:
- kind: ServiceAccount
  name: compliance-engine-sa
  namespace: $Namespace
---
apiVersion: v1
kind: Secret
metadata:
  name: compliance-secrets
  namespace: $Namespace
  labels:
    app: compliance-engine
    version: "2.9"
    compliance: "enabled"
type: Opaque
data:
  db-password: "Y29tcGxpYW5jZV9wYXNzd29yZA=="
  elasticsearch-password: "ZWxhc3RpY19wYXNzd29yZA=="
  jwt-secret: "Y29tcGxpYW5jZV9qd3Rfc2VjcmV0"
  encryption-key: "Y29tcGxpYW5jZV9lbmNyeXB0aW9uX2tleQ=="
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: compliance-engine-hpa
  namespace: $Namespace
  labels:
    app: compliance-engine
    version: "2.9"
    compliance: "enabled"
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: compliance-engine
  minReplicas: 2
  maxReplicas: 10
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
        averageValue: "100"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 2
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
  name: compliance-engine-pdb
  namespace: $Namespace
  labels:
    app: compliance-engine
    version: "2.9"
    compliance: "enabled"
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: compliance-engine
"@
    
    $complianceYaml | Out-File -FilePath "compliance-deployment.yaml" -Encoding UTF8
    $success = Invoke-Kubectl "kubectl apply -f compliance-deployment.yaml" "Deploy Compliance Engine"
    Remove-Item "compliance-deployment.yaml" -Force -ErrorAction SilentlyContinue
    
    if ($success) {
        Wait-ForDeployment "compliance-engine" $Namespace
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
          value: "compliance_db"
        - name: POSTGRES_USER
          value: "compliance_user"
        - name: POSTGRES_PASSWORD
          value: "compliance_password"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
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
      storage: 50Gi
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
    $deployments = @("compliance-engine", "postgresql")
    
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
    Write-Host "`n📊 Compliance Deployment Status:" -ForegroundColor Cyan
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
    Write-Host "`n🎯 Starting Advanced Compliance Automation Deployment Process" -ForegroundColor Green
    Write-Host "=============================================================" -ForegroundColor Green
    
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
    
    # Step 3: Deploy compliance engine
    if (-not (Deploy-ComplianceEngine)) {
        Write-Host "❌ Compliance engine deployment failed. Exiting." -ForegroundColor Red
        exit 1
    }
    
    # Step 4: Validate deployment
    if (-not (Test-Deployment)) {
        Write-Host "❌ Deployment validation failed. Exiting." -ForegroundColor Red
        exit 1
    }
    
    # Step 5: Show status
    Show-DeploymentStatus
    
    Write-Host "`n🎉 Advanced Compliance Automation Deployment Completed Successfully!" -ForegroundColor Green
    Write-Host "=====================================================================" -ForegroundColor Green
    Write-Host "Namespace: $Namespace" -ForegroundColor Yellow
    Write-Host "Environment: $Environment" -ForegroundColor Yellow
    Write-Host "GDPR: $EnableGDPR" -ForegroundColor Yellow
    Write-Host "HIPAA: $EnableHIPAA" -ForegroundColor Yellow
    Write-Host "SOX: $EnableSOX" -ForegroundColor Yellow
    Write-Host "Monitoring: $EnableMonitoring" -ForegroundColor Yellow
    Write-Host "Reporting: $EnableReporting" -ForegroundColor Yellow
    Write-Host "Automation: $EnableAutomation" -ForegroundColor Yellow
    
    Write-Host "`n📚 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Monitor the deployment: kubectl get pods -n $Namespace -w" -ForegroundColor White
    Write-Host "2. Check compliance engine logs: kubectl logs -f deployment/compliance-engine -n $Namespace" -ForegroundColor White
    Write-Host "3. Access compliance engine: kubectl port-forward svc/compliance-engine-service -n $Namespace 3000:3000" -ForegroundColor White
    Write-Host "4. Test GDPR compliance: curl -X POST http://localhost:3000/api/v1/compliance/gdpr/classify" -ForegroundColor White
    Write-Host "5. Test HIPAA compliance: curl -X POST http://localhost:3000/api/v1/compliance/hipaa/classify" -ForegroundColor White
    Write-Host "6. Test SOX compliance: curl -X POST http://localhost:3000/api/v1/compliance/sox/test" -ForegroundColor White
    
} catch {
    Write-Host "`n❌ Deployment failed with error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
