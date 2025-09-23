# Enterprise Security Deployment Script
# Version: 2.9
# Description: Deploys zero-trust architecture and enterprise security

param(
    [string]$Namespace = "manager-agent-ai",
    [string]$Environment = "production",
    [switch]$DryRun = $false,
    [switch]$SkipValidation = $false,
    [switch]$EnableZeroTrust = $true,
    [switch]$EnableIdentity = $true,
    [switch]$EnableAccessControl = $true,
    [switch]$EnableNetworkSecurity = $true,
    [switch]$EnableDataSecurity = $true,
    [switch]$EnableMonitoring = $true
)

Write-Host "🔒 Starting Enterprise Security Deployment v2.9" -ForegroundColor Green
Write-Host "Namespace: $Namespace" -ForegroundColor Yellow
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Zero-Trust: $EnableZeroTrust" -ForegroundColor Yellow
Write-Host "Identity: $EnableIdentity" -ForegroundColor Yellow
Write-Host "Access Control: $EnableAccessControl" -ForegroundColor Yellow
Write-Host "Network Security: $EnableNetworkSecurity" -ForegroundColor Yellow
Write-Host "Data Security: $EnableDataSecurity" -ForegroundColor Yellow
Write-Host "Monitoring: $EnableMonitoring" -ForegroundColor Yellow

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

# Function to deploy zero-trust engine
function Deploy-ZeroTrustEngine {
    if (-not $EnableZeroTrust) {
        Write-Host "⏭️ Skipping zero-trust engine deployment (zero-trust disabled)" -ForegroundColor Yellow
        return $true
    }
    
    Write-Host "🔐 Deploying Zero-Trust Engine..." -ForegroundColor Cyan
    
    # Create zero-trust engine deployment
    $zeroTrustYaml = @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zero-trust-engine
  namespace: $Namespace
  labels:
    app: zero-trust-engine
    version: "2.9"
    security: "enabled"
spec:
  replicas: 3
  selector:
    matchLabels:
      app: zero-trust-engine
  template:
    metadata:
      labels:
        app: zero-trust-engine
        version: "2.9"
        security: "enabled"
    spec:
      serviceAccountName: zero-trust-engine-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 2000
      containers:
      - name: zero-trust-engine
        image: manager-agent-ai/zero-trust-engine:2.9.0
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
        - name: ZERO_TRUST_ENABLED
          value: "$EnableZeroTrust"
        - name: IDENTITY_ENABLED
          value: "$EnableIdentity"
        - name: ACCESS_CONTROL_ENABLED
          value: "$EnableAccessControl"
        - name: NETWORK_SECURITY_ENABLED
          value: "$EnableNetworkSecurity"
        - name: DATA_SECURITY_ENABLED
          value: "$EnableDataSecurity"
        - name: MONITORING_ENABLED
          value: "$EnableMonitoring"
        - name: DB_HOST
          value: "postgresql"
        - name: DB_PORT
          value: "5432"
        - name: DB_NAME
          value: "security_db"
        - name: DB_USER
          value: "security_user"
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: security-secrets
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
              name: security-secrets
              key: elasticsearch-password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: security-secrets
              key: jwt-secret
        - name: ENCRYPTION_KEY
          valueFrom:
            secretKeyRef:
              name: security-secrets
              key: encryption-key
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
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: tmp
        emptyDir: {}
      - name: cache
        emptyDir: {}
      - name: data
        persistentVolumeClaim:
          claimName: zero-trust-engine-pvc
      - name: logs
        persistentVolumeClaim:
          claimName: zero-trust-engine-logs-pvc
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
                  - zero-trust-engine
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
  name: zero-trust-engine-service
  namespace: $Namespace
  labels:
    app: zero-trust-engine
    version: "2.9"
    security: "enabled"
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
    app: zero-trust-engine
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
  name: zero-trust-engine-pvc
  namespace: $Namespace
  labels:
    app: zero-trust-engine
    version: "2.9"
    security: "enabled"
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
  name: zero-trust-engine-logs-pvc
  namespace: $Namespace
  labels:
    app: zero-trust-engine
    version: "2.9"
    security: "enabled"
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
  name: zero-trust-engine-sa
  namespace: $Namespace
  labels:
    app: zero-trust-engine
    version: "2.9"
    security: "enabled"
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: zero-trust-engine-role
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
- apiGroups: ["networking.k8s.io"]
  resources: ["networkpolicies"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["security.istio.io"]
  resources: ["authorizationpolicies", "peerauthentications"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: zero-trust-engine-rolebinding
  namespace: $Namespace
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: zero-trust-engine-role
subjects:
- kind: ServiceAccount
  name: zero-trust-engine-sa
  namespace: $Namespace
---
apiVersion: v1
kind: Secret
metadata:
  name: security-secrets
  namespace: $Namespace
  labels:
    app: zero-trust-engine
    version: "2.9"
    security: "enabled"
type: Opaque
data:
  db-password: "c2VjdXJpdHlfcGFzc3dvcmQ="
  elasticsearch-password: "ZWxhc3RpY19wYXNzd29yZA=="
  jwt-secret: "c2VjdXJpdHlfanN0X3NlY3JldA=="
  encryption-key: "c2VjdXJpdHlfZW5jcnlwdGlvbl9rZXk="
  mfa-secret: "bWZhX3NlY3JldA=="
  api-key: "YXBpX2tleQ=="
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: zero-trust-engine-hpa
  namespace: $Namespace
  labels:
    app: zero-trust-engine
    version: "2.9"
    security: "enabled"
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: zero-trust-engine
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
        averageValue: "200"
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
  name: zero-trust-engine-pdb
  namespace: $Namespace
  labels:
    app: zero-trust-engine
    version: "2.9"
    security: "enabled"
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: zero-trust-engine
"@
    
    $zeroTrustYaml | Out-File -FilePath "zero-trust-deployment.yaml" -Encoding UTF8
    $success = Invoke-Kubectl "kubectl apply -f zero-trust-deployment.yaml" "Deploy Zero-Trust Engine"
    Remove-Item "zero-trust-deployment.yaml" -Force -ErrorAction SilentlyContinue
    
    if ($success) {
        Wait-ForDeployment "zero-trust-engine" $Namespace
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
          value: "security_db"
        - name: POSTGRES_USER
          value: "security_user"
        - name: POSTGRES_PASSWORD
          value: "security_password"
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
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
      storage: 100Gi
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
    $deployments = @("zero-trust-engine", "postgresql")
    
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
    Write-Host "`n📊 Security Deployment Status:" -ForegroundColor Cyan
    Write-Host "=============================" -ForegroundColor Cyan
    
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
    Write-Host "`n🎯 Starting Enterprise Security Deployment Process" -ForegroundColor Green
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
    
    # Step 3: Deploy zero-trust engine
    if (-not (Deploy-ZeroTrustEngine)) {
        Write-Host "❌ Zero-trust engine deployment failed. Exiting." -ForegroundColor Red
        exit 1
    }
    
    # Step 4: Validate deployment
    if (-not (Test-Deployment)) {
        Write-Host "❌ Deployment validation failed. Exiting." -ForegroundColor Red
        exit 1
    }
    
    # Step 5: Show status
    Show-DeploymentStatus
    
    Write-Host "`n🎉 Enterprise Security Deployment Completed Successfully!" -ForegroundColor Green
    Write-Host "=======================================================" -ForegroundColor Green
    Write-Host "Namespace: $Namespace" -ForegroundColor Yellow
    Write-Host "Environment: $Environment" -ForegroundColor Yellow
    Write-Host "Zero-Trust: $EnableZeroTrust" -ForegroundColor Yellow
    Write-Host "Identity: $EnableIdentity" -ForegroundColor Yellow
    Write-Host "Access Control: $EnableAccessControl" -ForegroundColor Yellow
    Write-Host "Network Security: $EnableNetworkSecurity" -ForegroundColor Yellow
    Write-Host "Data Security: $EnableDataSecurity" -ForegroundColor Yellow
    Write-Host "Monitoring: $EnableMonitoring" -ForegroundColor Yellow
    
    Write-Host "`n📚 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Monitor the deployment: kubectl get pods -n $Namespace -w" -ForegroundColor White
    Write-Host "2. Check zero-trust engine logs: kubectl logs -f deployment/zero-trust-engine -n $Namespace" -ForegroundColor White
    Write-Host "3. Access zero-trust engine: kubectl port-forward svc/zero-trust-engine-service -n $Namespace 3000:3000" -ForegroundColor White
    Write-Host "4. Test identity verification: curl -X POST http://localhost:3000/api/v1/security/identity/verify" -ForegroundColor White
    Write-Host "5. Test access control: curl -X POST http://localhost:3000/api/v1/security/access/grant" -ForegroundColor White
    Write-Host "6. Test threat detection: curl -X POST http://localhost:3000/api/v1/security/monitoring/threats" -ForegroundColor White
    
} catch {
    Write-Host "`n❌ Deployment failed with error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
