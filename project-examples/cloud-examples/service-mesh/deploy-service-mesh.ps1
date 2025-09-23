# AI-Enhanced Service Mesh Deployment Script
# Version: 2.9
# Description: Deploys the complete AI-enhanced service mesh with Istio

param(
    [string]$Namespace = "manager-agent-ai",
    [string]$Environment = "production",
    [switch]$DryRun = $false,
    [switch]$SkipValidation = $false,
    [switch]$EnableAI = $true,
    [switch]$EnableMonitoring = $true,
    [switch]$EnableSecurity = $true
)

Write-Host "🚀 Starting AI-Enhanced Service Mesh Deployment v2.9" -ForegroundColor Green
Write-Host "Namespace: $Namespace" -ForegroundColor Yellow
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "AI Features: $EnableAI" -ForegroundColor Yellow
Write-Host "Monitoring: $EnableMonitoring" -ForegroundColor Yellow
Write-Host "Security: $EnableSecurity" -ForegroundColor Yellow

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
    
    # Check if Istio is installed
    $istioNamespace = kubectl get namespace istio-system 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Istio is not installed. Please install Istio first." -ForegroundColor Red
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

# Function to deploy Istio configurations
function Deploy-IstioConfigs {
    Write-Host "🔧 Deploying Istio configurations..." -ForegroundColor Cyan
    
    $configFiles = @(
        "istio/gateway.yaml",
        "istio/virtual-service.yaml",
        "istio/ai-enhanced-virtual-service.yaml",
        "istio/ai-enhanced-destination-rule.yaml",
        "istio/ai-enhanced-authorization-policy.yaml",
        "istio/ai-enhanced-telemetry.yaml"
    )
    
    foreach ($configFile in $configFiles) {
        if (Test-Path $configFile) {
            $success = Invoke-Kubectl "kubectl apply -f $configFile -n $Namespace" "Deploy $configFile"
            if (-not $success) {
                Write-Host "❌ Failed to deploy $configFile" -ForegroundColor Red
                return $false
            }
        } else {
            Write-Host "⚠️ Configuration file $configFile not found, skipping..." -ForegroundColor Yellow
        }
    }
    
    Write-Host "✅ Istio configurations deployed successfully" -ForegroundColor Green
    return $true
}

# Function to deploy AI orchestrator
function Deploy-AIOrchestrator {
    if (-not $EnableAI) {
        Write-Host "⏭️ Skipping AI orchestrator deployment (AI disabled)" -ForegroundColor Yellow
        return $true
    }
    
    Write-Host "🤖 Deploying AI Service Mesh Orchestrator..." -ForegroundColor Cyan
    
    # Create orchestrator deployment
    $orchestratorYaml = @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: service-mesh-orchestrator
  namespace: $Namespace
  labels:
    app: service-mesh-orchestrator
    version: v2.9
    ai-enhanced: "true"
spec:
  replicas: 2
  selector:
    matchLabels:
      app: service-mesh-orchestrator
  template:
    metadata:
      labels:
        app: service-mesh-orchestrator
        version: v2.9
        ai-enhanced: "true"
    spec:
      serviceAccountName: service-mesh-orchestrator
      containers:
      - name: orchestrator
        image: service-mesh-orchestrator:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "$Environment"
        - name: KUBECONFIG
          value: "/var/run/secrets/kubernetes.io/serviceaccount"
        - name: AI_ENABLED
          value: "true"
        - name: MONITORING_ENABLED
          value: "$EnableMonitoring"
        - name: SECURITY_ENABLED
          value: "$EnableSecurity"
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: service-mesh-orchestrator-service
  namespace: $Namespace
  labels:
    app: service-mesh-orchestrator
spec:
  selector:
    app: service-mesh-orchestrator
  ports:
  - port: 3000
    targetPort: 3000
    protocol: TCP
  type: ClusterIP
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: service-mesh-orchestrator
  namespace: $Namespace
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: service-mesh-orchestrator
rules:
- apiGroups: [""]
  resources: ["pods", "services", "endpoints", "nodes"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch", "update", "patch"]
- apiGroups: ["networking.istio.io"]
  resources: ["virtualservices", "destinationrules", "gateways"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["security.istio.io"]
  resources: ["authorizationpolicies", "peerauthentications"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["telemetry.istio.io"]
  resources: ["telemetries"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: service-mesh-orchestrator
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: service-mesh-orchestrator
subjects:
- kind: ServiceAccount
  name: service-mesh-orchestrator
  namespace: $Namespace
"@
    
    $orchestratorYaml | Out-File -FilePath "orchestrator-deployment.yaml" -Encoding UTF8
    $success = Invoke-Kubectl "kubectl apply -f orchestrator-deployment.yaml" "Deploy AI orchestrator"
    Remove-Item "orchestrator-deployment.yaml" -Force -ErrorAction SilentlyContinue
    
    if ($success) {
        Wait-ForDeployment "service-mesh-orchestrator" $Namespace
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
    $deployments = @("api-gateway-service", "advanced-analytics-dashboard")
    if ($EnableAI) {
        $deployments += "service-mesh-orchestrator"
    }
    
    foreach ($deployment in $deployments) {
        $status = kubectl get deployment $deployment -n $Namespace -o jsonpath='{.status.readyReplicas}' 2>$null
        $desired = kubectl get deployment $deployment -n $Namespace -o jsonpath='{.spec.replicas}' 2>$null
        
        if (-not $status -or $status -ne $desired) {
            Write-Host "❌ Deployment $deployment is not ready ($status/$desired)" -ForegroundColor Red
            return $false
        }
    }
    
    # Check if services are accessible
    $services = @("api-gateway-service", "advanced-analytics-dashboard-service")
    if ($EnableAI) {
        $services += "service-mesh-orchestrator-service"
    }
    
    foreach ($service in $services) {
        $endpoints = kubectl get endpoints $service -n $Namespace -o jsonpath='{.subsets[0].addresses[0].ip}' 2>$null
        if (-not $endpoints) {
            Write-Host "❌ Service $service has no endpoints" -ForegroundColor Red
            return $false
        }
    }
    
    Write-Host "✅ Deployment validation successful" -ForegroundColor Green
    return $true
}

# Function to display deployment status
function Show-DeploymentStatus {
    Write-Host "`n📊 Deployment Status:" -ForegroundColor Cyan
    Write-Host "===================" -ForegroundColor Cyan
    
    # Show deployments
    Write-Host "`n🚀 Deployments:" -ForegroundColor Yellow
    kubectl get deployments -n $Namespace -o wide
    
    # Show services
    Write-Host "`n🌐 Services:" -ForegroundColor Yellow
    kubectl get services -n $Namespace -o wide
    
    # Show pods
    Write-Host "`n📦 Pods:" -ForegroundColor Yellow
    kubectl get pods -n $Namespace -o wide
    
    # Show Istio resources
    Write-Host "`n🔧 Istio Resources:" -ForegroundColor Yellow
    kubectl get virtualservices,destinationrules,gateways -n $Namespace
    
    if ($EnableAI) {
        Write-Host "`n🤖 AI Resources:" -ForegroundColor Yellow
        kubectl get authorizationpolicies,telemetries -n $Namespace
    }
    
    # Show ingress
    Write-Host "`n🌍 Ingress:" -ForegroundColor Yellow
    kubectl get ingress -n $Namespace
}

# Main deployment process
try {
    Write-Host "`n🎯 Starting AI-Enhanced Service Mesh Deployment Process" -ForegroundColor Green
    Write-Host "=======================================================" -ForegroundColor Green
    
    # Step 1: Validate prerequisites
    if (-not (Test-Prerequisites)) {
        Write-Host "❌ Prerequisites validation failed. Exiting." -ForegroundColor Red
        exit 1
    }
    
    # Step 2: Deploy Istio configurations
    if (-not (Deploy-IstioConfigs)) {
        Write-Host "❌ Istio configuration deployment failed. Exiting." -ForegroundColor Red
        exit 1
    }
    
    # Step 3: Deploy AI orchestrator
    if (-not (Deploy-AIOrchestrator)) {
        Write-Host "❌ AI orchestrator deployment failed. Exiting." -ForegroundColor Red
        exit 1
    }
    
    # Step 4: Validate deployment
    if (-not (Test-Deployment)) {
        Write-Host "❌ Deployment validation failed. Exiting." -ForegroundColor Red
        exit 1
    }
    
    # Step 5: Show status
    Show-DeploymentStatus
    
    Write-Host "`n🎉 AI-Enhanced Service Mesh Deployment Completed Successfully!" -ForegroundColor Green
    Write-Host "=============================================================" -ForegroundColor Green
    Write-Host "Namespace: $Namespace" -ForegroundColor Yellow
    Write-Host "Environment: $Environment" -ForegroundColor Yellow
    Write-Host "AI Features: $EnableAI" -ForegroundColor Yellow
    Write-Host "Monitoring: $EnableMonitoring" -ForegroundColor Yellow
    Write-Host "Security: $EnableSecurity" -ForegroundColor Yellow
    
    if ($EnableAI) {
        Write-Host "`n🤖 AI Orchestrator Endpoints:" -ForegroundColor Cyan
        Write-Host "- Health: http://service-mesh-orchestrator-service.$Namespace.svc.cluster.local:3000/health" -ForegroundColor White
        Write-Host "- Metrics: http://service-mesh-orchestrator-service.$Namespace.svc.cluster.local:3000/metrics" -ForegroundColor White
        Write-Host "- Orchestration: http://service-mesh-orchestrator-service.$Namespace.svc.cluster.local:3000/orchestrate" -ForegroundColor White
    }
    
    Write-Host "`n📚 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Monitor the deployment: kubectl get pods -n $Namespace -w" -ForegroundColor White
    Write-Host "2. Check logs: kubectl logs -f deployment/service-mesh-orchestrator -n $Namespace" -ForegroundColor White
    Write-Host "3. Access the API Gateway: kubectl port-forward svc/api-gateway-service -n $Namespace 3000:3000" -ForegroundColor White
    Write-Host "4. Access Analytics Dashboard: kubectl port-forward svc/advanced-analytics-dashboard-service -n $Namespace 3001:3001" -ForegroundColor White
    
} catch {
    Write-Host "`n❌ Deployment failed with error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
