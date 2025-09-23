# AI-Enhanced Kubernetes Deployment Script
# Version: 2.9
# Description: Deploys the complete AI-enhanced platform to Kubernetes

param(
    [string]$Namespace = "manager-agent-ai",
    [string]$Environment = "production",
    [switch]$DryRun = $false,
    [switch]$SkipValidation = $false,
    [switch]$EnableAI = $true,
    [switch]$EnableMonitoring = $true,
    [switch]$EnableSecurity = $true,
    [switch]$EnableAutoScaling = $true,
    [switch]$EnableCostOptimization = $true
)

Write-Host "🚀 Starting AI-Enhanced Kubernetes Deployment v2.9" -ForegroundColor Green
Write-Host "Namespace: $Namespace" -ForegroundColor Yellow
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "AI Features: $EnableAI" -ForegroundColor Yellow
Write-Host "Monitoring: $EnableMonitoring" -ForegroundColor Yellow
Write-Host "Security: $EnableSecurity" -ForegroundColor Yellow
Write-Host "Auto Scaling: $EnableAutoScaling" -ForegroundColor Yellow
Write-Host "Cost Optimization: $EnableCostOptimization" -ForegroundColor Yellow

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
        Invoke-Kubectl "kubectl apply -f ai-enhanced-namespace.yaml" "Create namespace"
    }
    
    Write-Host "✅ Prerequisites validated successfully" -ForegroundColor Green
    return $true
}

# Function to deploy core configurations
function Deploy-CoreConfigs {
    Write-Host "🔧 Deploying core configurations..." -ForegroundColor Cyan
    
    $configFiles = @(
        "ai-enhanced-configmap.yaml",
        "secrets.yaml"
    )
    
    foreach ($configFile in $configFiles) {
        if (Test-Path $configFile) {
            $success = Invoke-Kubectl "kubectl apply -f $configFile" "Deploy $configFile"
            if (-not $success) {
                Write-Host "❌ Failed to deploy $configFile" -ForegroundColor Red
                return $false
            }
        } else {
            Write-Host "⚠️ Configuration file $configFile not found, skipping..." -ForegroundColor Yellow
        }
    }
    
    Write-Host "✅ Core configurations deployed successfully" -ForegroundColor Green
    return $true
}

# Function to deploy API Gateway
function Deploy-APIGateway {
    Write-Host "🌐 Deploying API Gateway..." -ForegroundColor Cyan
    
    $success = Invoke-Kubectl "kubectl apply -f ai-enhanced-api-gateway.yaml" "Deploy API Gateway"
    if ($success) {
        Wait-ForDeployment "api-gateway-enhanced" $Namespace
    }
    
    return $success
}

# Function to deploy Analytics Dashboard
function Deploy-AnalyticsDashboard {
    Write-Host "📊 Deploying Analytics Dashboard..." -ForegroundColor Cyan
    
    $success = Invoke-Kubectl "kubectl apply -f ai-enhanced-analytics-dashboard.yaml" "Deploy Analytics Dashboard"
    if ($success) {
        Wait-ForDeployment "analytics-dashboard-enhanced" $Namespace
    }
    
    return $success
}

# Function to deploy monitoring stack
function Deploy-MonitoringStack {
    if (-not $EnableMonitoring) {
        Write-Host "⏭️ Skipping monitoring stack deployment (monitoring disabled)" -ForegroundColor Yellow
        return $true
    }
    
    Write-Host "📈 Deploying monitoring stack..." -ForegroundColor Cyan
    
    # Deploy Prometheus
    $prometheusYaml = @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: $Namespace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:latest
        ports:
        - containerPort: 9090
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus-service
  namespace: $Namespace
spec:
  selector:
    app: prometheus
  ports:
  - port: 9090
    targetPort: 9090
  type: ClusterIP
"@
    
    $prometheusYaml | Out-File -FilePath "prometheus-deployment.yaml" -Encoding UTF8
    $success = Invoke-Kubectl "kubectl apply -f prometheus-deployment.yaml" "Deploy Prometheus"
    Remove-Item "prometheus-deployment.yaml" -Force -ErrorAction SilentlyContinue
    
    if ($success) {
        Wait-ForDeployment "prometheus" $Namespace
    }
    
    return $success
}

# Function to deploy security policies
function Deploy-SecurityPolicies {
    if (-not $EnableSecurity) {
        Write-Host "⏭️ Skipping security policies deployment (security disabled)" -ForegroundColor Yellow
        return $true
    }
    
    Write-Host "🔒 Deploying security policies..." -ForegroundColor Cyan
    
    # Deploy Network Policies
    $networkPolicyYaml = @"
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: $Namespace
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-gateway-network-policy
  namespace: $Namespace
spec:
  podSelector:
    matchLabels:
      app: api-gateway-enhanced
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: istio-system
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: $Namespace
    ports:
    - protocol: TCP
      port: 3000
"@
    
    $networkPolicyYaml | Out-File -FilePath "network-policy.yaml" -Encoding UTF8
    $success = Invoke-Kubectl "kubectl apply -f network-policy.yaml" "Deploy Network Policies"
    Remove-Item "network-policy.yaml" -Force -ErrorAction SilentlyContinue
    
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
    $deployments = @("api-gateway-enhanced", "analytics-dashboard-enhanced")
    if ($EnableMonitoring) {
        $deployments += "prometheus"
    }
    
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
    
    # Show HPA
    if ($EnableAutoScaling) {
        Write-Host "`n📈 Horizontal Pod Autoscalers:" -ForegroundColor Yellow
        kubectl get hpa -n $Namespace
    }
    
    # Show PDB
    Write-Host "`n🛡️ Pod Disruption Budgets:" -ForegroundColor Yellow
    kubectl get pdb -n $Namespace
    
    # Show Network Policies
    if ($EnableSecurity) {
        Write-Host "`n🔒 Network Policies:" -ForegroundColor Yellow
        kubectl get networkpolicies -n $Namespace
    }
}

# Main deployment process
try {
    Write-Host "`n🎯 Starting AI-Enhanced Kubernetes Deployment Process" -ForegroundColor Green
    Write-Host "=====================================================" -ForegroundColor Green
    
    # Step 1: Validate prerequisites
    if (-not (Test-Prerequisites)) {
        Write-Host "❌ Prerequisites validation failed. Exiting." -ForegroundColor Red
        exit 1
    }
    
    # Step 2: Deploy core configurations
    if (-not (Deploy-CoreConfigs)) {
        Write-Host "❌ Core configuration deployment failed. Exiting." -ForegroundColor Red
        exit 1
    }
    
    # Step 3: Deploy API Gateway
    if (-not (Deploy-APIGateway)) {
        Write-Host "❌ API Gateway deployment failed. Exiting." -ForegroundColor Red
        exit 1
    }
    
    # Step 4: Deploy Analytics Dashboard
    if (-not (Deploy-AnalyticsDashboard)) {
        Write-Host "❌ Analytics Dashboard deployment failed. Exiting." -ForegroundColor Red
        exit 1
    }
    
    # Step 5: Deploy monitoring stack
    if (-not (Deploy-MonitoringStack)) {
        Write-Host "❌ Monitoring stack deployment failed. Exiting." -ForegroundColor Red
        exit 1
    }
    
    # Step 6: Deploy security policies
    if (-not (Deploy-SecurityPolicies)) {
        Write-Host "❌ Security policies deployment failed. Exiting." -ForegroundColor Red
        exit 1
    }
    
    # Step 7: Validate deployment
    if (-not (Test-Deployment)) {
        Write-Host "❌ Deployment validation failed. Exiting." -ForegroundColor Red
        exit 1
    }
    
    # Step 8: Show status
    Show-DeploymentStatus
    
    Write-Host "`n🎉 AI-Enhanced Kubernetes Deployment Completed Successfully!" -ForegroundColor Green
    Write-Host "===========================================================" -ForegroundColor Green
    Write-Host "Namespace: $Namespace" -ForegroundColor Yellow
    Write-Host "Environment: $Environment" -ForegroundColor Yellow
    Write-Host "AI Features: $EnableAI" -ForegroundColor Yellow
    Write-Host "Monitoring: $EnableMonitoring" -ForegroundColor Yellow
    Write-Host "Security: $EnableSecurity" -ForegroundColor Yellow
    Write-Host "Auto Scaling: $EnableAutoScaling" -ForegroundColor Yellow
    Write-Host "Cost Optimization: $EnableCostOptimization" -ForegroundColor Yellow
    
    Write-Host "`n📚 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Monitor the deployment: kubectl get pods -n $Namespace -w" -ForegroundColor White
    Write-Host "2. Check logs: kubectl logs -f deployment/api-gateway-enhanced -n $Namespace" -ForegroundColor White
    Write-Host "3. Access the API Gateway: kubectl port-forward svc/api-gateway-enhanced-service -n $Namespace 3000:3000" -ForegroundColor White
    Write-Host "4. Access Analytics Dashboard: kubectl port-forward svc/analytics-dashboard-enhanced-service -n $Namespace 3001:3001" -ForegroundColor White
    if ($EnableMonitoring) {
        Write-Host "5. Access Prometheus: kubectl port-forward svc/prometheus-service -n $Namespace 9090:9090" -ForegroundColor White
    }
    
} catch {
    Write-Host "`n❌ Deployment failed with error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
