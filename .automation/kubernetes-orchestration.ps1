# Kubernetes Orchestration Script for ManagerAgentAI v2.5
# Enterprise orchestration support for all platforms

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "deploy", "scale", "update", "rollback", "delete", "status", "logs")]
    [string]$Action = "all",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "api-gateway", "event-bus", "microservices", "dashboard", "notifications", "forecasting", "benchmarking", "data-export", "deadline-prediction", "sprint-planning", "task-distribution", "task-dependency", "status-updates")]
    [string]$Service = "all",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose,
    
    [Parameter(Mandatory=$false)]
    [string]$Namespace = "manageragent",
    
    [Parameter(Mandatory=$false)]
    [string]$ConfigPath = "kubernetes",
    
    [Parameter(Mandatory=$false)]
    [int]$Replicas = 2,
    
    [Parameter(Mandatory=$false)]
    [string]$ImageTag = "latest"
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Script configuration
$ScriptName = "Kubernetes-Orchestration"
$Version = "2.5.0"
$LogFile = "kubernetes-orchestration.log"

# Colors for output
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    if ($Verbose -or $Level -eq "ERROR") {
        Write-ColorOutput $logEntry -Color $Level.ToLower()
    }
    Add-Content -Path $LogFile -Value $logEntry -ErrorAction SilentlyContinue
}

function Show-Header {
    Write-ColorOutput "☸️ ManagerAgentAI Kubernetes Orchestration v2.5" -Color Header
    Write-ColorOutput "=============================================" -Color Header
    Write-ColorOutput "Enterprise orchestration support" -Color Info
    Write-ColorOutput ""
}

function Test-KubernetesPrerequisites {
    Write-ColorOutput "Testing Kubernetes prerequisites..." -Color Info
    Write-Log "Testing Kubernetes prerequisites" "INFO"
    
    $prerequisites = @{
        Kubectl = $false
        Kubernetes = $false
        Docker = $false
        Helm = $false
        Overall = $false
    }
    
    # Test kubectl
    try {
        $kubectlVersion = kubectl version --client 2>$null
        if ($LASTEXITCODE -eq 0) {
            $prerequisites.Kubectl = $true
            Write-ColorOutput "✅ kubectl: Available" -Color Success
            Write-Log "kubectl prerequisite: PASS" "INFO"
        } else {
            Write-ColorOutput "❌ kubectl: Not found" -Color Error
            Write-Log "kubectl prerequisite: FAIL (Not found)" "ERROR"
        }
    } catch {
        Write-ColorOutput "❌ kubectl: Test failed" -Color Error
        Write-Log "kubectl prerequisite test failed: $($_.Exception.Message)" "ERROR"
    }
    
    # Test Kubernetes cluster
    try {
        $clusterInfo = kubectl cluster-info 2>$null
        if ($LASTEXITCODE -eq 0) {
            $prerequisites.Kubernetes = $true
            Write-ColorOutput "✅ Kubernetes: Cluster accessible" -Color Success
            Write-Log "Kubernetes prerequisite: PASS" "INFO"
        } else {
            Write-ColorOutput "❌ Kubernetes: Cluster not accessible" -Color Error
            Write-Log "Kubernetes prerequisite: FAIL (Cluster not accessible)" "ERROR"
        }
    } catch {
        Write-ColorOutput "❌ Kubernetes: Test failed" -Color Error
        Write-Log "Kubernetes prerequisite test failed: $($_.Exception.Message)" "ERROR"
    }
    
    # Test Docker
    try {
        $dockerVersion = docker --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $prerequisites.Docker = $true
            Write-ColorOutput "✅ Docker: Available" -Color Success
            Write-Log "Docker prerequisite: PASS" "INFO"
        } else {
            Write-ColorOutput "❌ Docker: Not found" -Color Error
            Write-Log "Docker prerequisite: FAIL (Not found)" "ERROR"
        }
    } catch {
        Write-ColorOutput "❌ Docker: Test failed" -Color Error
        Write-Log "Docker prerequisite test failed: $($_.Exception.Message)" "ERROR"
    }
    
    # Test Helm
    try {
        $helmVersion = helm version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $prerequisites.Helm = $true
            Write-ColorOutput "✅ Helm: Available" -Color Success
            Write-Log "Helm prerequisite: PASS" "INFO"
        } else {
            Write-ColorOutput "⚠️ Helm: Not found (optional)" -Color Warning
            Write-Log "Helm prerequisite: WARN (Not found)" "WARN"
        }
    } catch {
        Write-ColorOutput "⚠️ Helm: Test failed (optional)" -Color Warning
        Write-Log "Helm prerequisite test failed: $($_.Exception.Message)" "WARN"
    }
    
    $prerequisites.Overall = $prerequisites.Kubectl -and $prerequisites.Kubernetes -and $prerequisites.Docker
    
    return $prerequisites
}

function Create-KubernetesManifests {
    Write-ColorOutput "Creating Kubernetes manifests..." -Color Info
    Write-Log "Creating Kubernetes manifests" "INFO"
    
    $manifestResults = @()
    
    try {
        # Create namespace
        $namespaceManifest = @"
apiVersion: v1
kind: Namespace
metadata:
  name: $Namespace
  labels:
    name: $Namespace
    app: manageragent
"@
        
        $namespaceFile = Join-Path $ConfigPath "namespace.yaml"
        $namespaceManifest | Out-File -FilePath $namespaceFile -Encoding UTF8
        $manifestResults += @{ Type = "Namespace"; File = $namespaceFile; Status = "Created" }
        Write-ColorOutput "✅ Namespace manifest created: $namespaceFile" -Color Success
        Write-Log "Namespace manifest created: $namespaceFile" "INFO"
        
        # Create ConfigMap
        $configMapManifest = @"
apiVersion: v1
kind: ConfigMap
metadata:
  name: manageragent-config
  namespace: $Namespace
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  API_VERSION: "v2.5"
"@
        
        $configMapFile = Join-Path $ConfigPath "configmap.yaml"
        $configMapManifest | Out-File -FilePath $configMapFile -Encoding UTF8
        $manifestResults += @{ Type = "ConfigMap"; File = $configMapFile; Status = "Created" }
        Write-ColorOutput "✅ ConfigMap manifest created: $configMapFile" -Color Success
        Write-Log "ConfigMap manifest created: $configMapFile" "INFO"
        
        # Create services
        $services = @(
            @{ Name = "api-gateway"; Port = 3000; TargetPort = 3000 },
            @{ Name = "event-bus"; Port = 3001; TargetPort = 3001 },
            @{ Name = "microservices"; Port = 3002; TargetPort = 3002 },
            @{ Name = "dashboard"; Port = 3003; TargetPort = 3003 },
            @{ Name = "notifications"; Port = 3004; TargetPort = 3004 },
            @{ Name = "forecasting"; Port = 3005; TargetPort = 3005 },
            @{ Name = "benchmarking"; Port = 3006; TargetPort = 3006 },
            @{ Name = "data-export"; Port = 3007; TargetPort = 3007 },
            @{ Name = "deadline-prediction"; Port = 3008; TargetPort = 3008 },
            @{ Name = "sprint-planning"; Port = 3009; TargetPort = 3009 },
            @{ Name = "task-distribution"; Port = 3010; TargetPort = 3010 },
            @{ Name = "task-dependency"; Port = 3011; TargetPort = 3011 },
            @{ Name = "status-updates"; Port = 3012; TargetPort = 3012 }
        )
        
        foreach ($service in $services) {
            $serviceManifest = @"
apiVersion: v1
kind: Service
metadata:
  name: $($service.Name)
  namespace: $Namespace
  labels:
    app: $($service.Name)
spec:
  selector:
    app: $($service.Name)
  ports:
    - port: $($service.Port)
      targetPort: $($service.TargetPort)
      protocol: TCP
  type: ClusterIP
"@
            
            $serviceFile = Join-Path $ConfigPath "$($service.Name)-service.yaml"
            $serviceManifest | Out-File -FilePath $serviceFile -Encoding UTF8
            $manifestResults += @{ Type = "Service"; File = $serviceFile; Status = "Created" }
            Write-ColorOutput "✅ Service manifest created: $serviceFile" -Color Success
            Write-Log "Service manifest created: $serviceFile" "INFO"
        }
        
        # Create deployments
        foreach ($service in $services) {
            $deploymentManifest = @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: $($service.Name)
  namespace: $Namespace
  labels:
    app: $($service.Name)
spec:
  replicas: $Replicas
  selector:
    matchLabels:
      app: $($service.Name)
  template:
    metadata:
      labels:
        app: $($service.Name)
    spec:
      containers:
      - name: $($service.Name)
        image: manageragent/$($service.Name):$ImageTag
        ports:
        - containerPort: $($service.TargetPort)
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: manageragent-config
              key: NODE_ENV
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: manageragent-config
              key: LOG_LEVEL
        - name: API_VERSION
          valueFrom:
            configMapKeyRef:
              name: manageragent-config
              key: API_VERSION
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: $($service.TargetPort)
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: $($service.TargetPort)
          initialDelaySeconds: 5
          periodSeconds: 5
"@
            
            $deploymentFile = Join-Path $ConfigPath "$($service.Name)-deployment.yaml"
            $deploymentManifest | Out-File -FilePath $deploymentFile -Encoding UTF8
            $manifestResults += @{ Type = "Deployment"; File = $deploymentFile; Status = "Created" }
            Write-ColorOutput "✅ Deployment manifest created: $deploymentFile" -Color Success
            Write-Log "Deployment manifest created: $deploymentFile" "INFO"
        }
        
        # Create Ingress
        $ingressManifest = @"
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: manageragent-ingress
  namespace: $Namespace
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
spec:
  rules:
  - host: manageragent.local
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 3000
      - path: /events
        pathType: Prefix
        backend:
          service:
            name: event-bus
            port:
              number: 3001
      - path: /microservices
        pathType: Prefix
        backend:
          service:
            name: microservices
            port:
              number: 3002
      - path: /dashboard
        pathType: Prefix
        backend:
          service:
            name: dashboard
            port:
              number: 3003
      - path: /notifications
        pathType: Prefix
        backend:
          service:
            name: notifications
            port:
              number: 3004
      - path: /forecasting
        pathType: Prefix
        backend:
          service:
            name: forecasting
            port:
              number: 3005
      - path: /benchmarking
        pathType: Prefix
        backend:
          service:
            name: benchmarking
            port:
              number: 3006
      - path: /data-export
        pathType: Prefix
        backend:
          service:
            name: data-export
            port:
              number: 3007
      - path: /deadline-prediction
        pathType: Prefix
        backend:
          service:
            name: deadline-prediction
            port:
              number: 3008
      - path: /sprint-planning
        pathType: Prefix
        backend:
          service:
            name: sprint-planning
            port:
              number: 3009
      - path: /task-distribution
        pathType: Prefix
        backend:
          service:
            name: task-distribution
            port:
              number: 3010
      - path: /task-dependency
        pathType: Prefix
        backend:
          service:
            name: task-dependency
            port:
              number: 3011
      - path: /status-updates
        pathType: Prefix
        backend:
          service:
            name: status-updates
            port:
              number: 3012
"@
        
        $ingressFile = Join-Path $ConfigPath "ingress.yaml"
        $ingressManifest | Out-File -FilePath $ingressFile -Encoding UTF8
        $manifestResults += @{ Type = "Ingress"; File = $ingressFile; Status = "Created" }
        Write-ColorOutput "✅ Ingress manifest created: $ingressFile" -Color Success
        Write-Log "Ingress manifest created: $ingressFile" "INFO"
        
    } catch {
        Write-ColorOutput "❌ Failed to create Kubernetes manifests" -Color Error
        Write-Log "Failed to create Kubernetes manifests: $($_.Exception.Message)" "ERROR"
    }
    
    return $manifestResults
}

function Deploy-KubernetesResources {
    Write-ColorOutput "Deploying Kubernetes resources..." -Color Info
    Write-Log "Deploying Kubernetes resources" "INFO"
    
    $deployResults = @()
    
    try {
        # Create namespace
        Write-ColorOutput "Creating namespace..." -Color Info
        $namespaceCommand = "kubectl apply -f $ConfigPath/namespace.yaml"
        $namespaceOutput = Invoke-Expression $namespaceCommand 2>&1
        $namespaceExitCode = $LASTEXITCODE
        
        if ($namespaceExitCode -eq 0) {
            $deployResults += @{ Resource = "Namespace"; Status = "Success" }
            Write-ColorOutput "✅ Namespace created successfully" -Color Success
            Write-Log "Namespace created successfully" "INFO"
        } else {
            $deployResults += @{ Resource = "Namespace"; Status = "Failed"; Output = $namespaceOutput }
            Write-ColorOutput "❌ Failed to create namespace" -Color Error
            Write-Log "Failed to create namespace: $namespaceOutput" "ERROR"
        }
        
        # Apply ConfigMap
        Write-ColorOutput "Applying ConfigMap..." -Color Info
        $configMapCommand = "kubectl apply -f $ConfigPath/configmap.yaml"
        $configMapOutput = Invoke-Expression $configMapCommand 2>&1
        $configMapExitCode = $LASTEXITCODE
        
        if ($configMapExitCode -eq 0) {
            $deployResults += @{ Resource = "ConfigMap"; Status = "Success" }
            Write-ColorOutput "✅ ConfigMap applied successfully" -Color Success
            Write-Log "ConfigMap applied successfully" "INFO"
        } else {
            $deployResults += @{ Resource = "ConfigMap"; Status = "Failed"; Output = $configMapOutput }
            Write-ColorOutput "❌ Failed to apply ConfigMap" -Color Error
            Write-Log "Failed to apply ConfigMap: $configMapOutput" "ERROR"
        }
        
        # Apply services
        Write-ColorOutput "Applying services..." -Color Info
        $serviceFiles = Get-ChildItem -Path $ConfigPath -Filter "*-service.yaml"
        foreach ($serviceFile in $serviceFiles) {
            $serviceCommand = "kubectl apply -f $($serviceFile.FullName)"
            $serviceOutput = Invoke-Expression $serviceCommand 2>&1
            $serviceExitCode = $LASTEXITCODE
            
            if ($serviceExitCode -eq 0) {
                $deployResults += @{ Resource = "Service"; File = $serviceFile.Name; Status = "Success" }
                Write-ColorOutput "✅ Service applied: $($serviceFile.Name)" -Color Success
                Write-Log "Service applied: $($serviceFile.Name)" "INFO"
            } else {
                $deployResults += @{ Resource = "Service"; File = $serviceFile.Name; Status = "Failed"; Output = $serviceOutput }
                Write-ColorOutput "❌ Failed to apply service: $($serviceFile.Name)" -Color Error
                Write-Log "Failed to apply service: $($serviceFile.Name) - $serviceOutput" "ERROR"
            }
        }
        
        # Apply deployments
        Write-ColorOutput "Applying deployments..." -Color Info
        $deploymentFiles = Get-ChildItem -Path $ConfigPath -Filter "*-deployment.yaml"
        foreach ($deploymentFile in $deploymentFiles) {
            $deploymentCommand = "kubectl apply -f $($deploymentFile.FullName)"
            $deploymentOutput = Invoke-Expression $deploymentCommand 2>&1
            $deploymentExitCode = $LASTEXITCODE
            
            if ($deploymentExitCode -eq 0) {
                $deployResults += @{ Resource = "Deployment"; File = $deploymentFile.Name; Status = "Success" }
                Write-ColorOutput "✅ Deployment applied: $($deploymentFile.Name)" -Color Success
                Write-Log "Deployment applied: $($deploymentFile.Name)" "INFO"
            } else {
                $deployResults += @{ Resource = "Deployment"; File = $deploymentFile.Name; Status = "Failed"; Output = $deploymentOutput }
                Write-ColorOutput "❌ Failed to apply deployment: $($deploymentFile.Name)" -Color Error
                Write-Log "Failed to apply deployment: $($deploymentFile.Name) - $deploymentOutput" "ERROR"
            }
        }
        
        # Apply Ingress
        Write-ColorOutput "Applying Ingress..." -Color Info
        $ingressCommand = "kubectl apply -f $ConfigPath/ingress.yaml"
        $ingressOutput = Invoke-Expression $ingressCommand 2>&1
        $ingressExitCode = $LASTEXITCODE
        
        if ($ingressExitCode -eq 0) {
            $deployResults += @{ Resource = "Ingress"; Status = "Success" }
            Write-ColorOutput "✅ Ingress applied successfully" -Color Success
            Write-Log "Ingress applied successfully" "INFO"
        } else {
            $deployResults += @{ Resource = "Ingress"; Status = "Failed"; Output = $ingressOutput }
            Write-ColorOutput "❌ Failed to apply Ingress" -Color Error
            Write-Log "Failed to apply Ingress: $ingressOutput" "ERROR"
        }
        
    } catch {
        Write-ColorOutput "❌ Kubernetes deployment error: $($_.Exception.Message)" -Color Error
        Write-Log "Kubernetes deployment error: $($_.Exception.Message)" "ERROR"
    }
    
    return $deployResults
}

function Scale-KubernetesServices {
    Write-ColorOutput "Scaling Kubernetes services..." -Color Info
    Write-Log "Scaling Kubernetes services" "INFO"
    
    $scaleResults = @()
    
    try {
        $services = @(
            "api-gateway", "event-bus", "microservices", "dashboard", "notifications",
            "forecasting", "benchmarking", "data-export", "deadline-prediction",
            "sprint-planning", "task-distribution", "task-dependency", "status-updates"
        )
        
        foreach ($service in $services) {
            if ($Service -eq "all" -or $Service -eq $service) {
                Write-ColorOutput "Scaling $service to $Replicas replicas..." -Color Info
                Write-Log "Scaling service: $service to $Replicas replicas" "INFO"
                
                $scaleCommand = "kubectl scale deployment $service --replicas=$Replicas -n $Namespace"
                $scaleOutput = Invoke-Expression $scaleCommand 2>&1
                $scaleExitCode = $LASTEXITCODE
                
                if ($scaleExitCode -eq 0) {
                    $scaleResults += @{ Service = $service; Replicas = $Replicas; Status = "Success" }
                    Write-ColorOutput "✅ $service scaled to $Replicas replicas" -Color Success
                    Write-Log "Service scaled successfully: $service to $Replicas replicas" "INFO"
                } else {
                    $scaleResults += @{ Service = $service; Replicas = $Replicas; Status = "Failed"; Output = $scaleOutput }
                    Write-ColorOutput "❌ Failed to scale $service" -Color Error
                    Write-Log "Failed to scale service: $service - $scaleOutput" "ERROR"
                }
            }
        }
    } catch {
        Write-ColorOutput "❌ Kubernetes scaling error: $($_.Exception.Message)" -Color Error
        Write-Log "Kubernetes scaling error: $($_.Exception.Message)" "ERROR"
    }
    
    return $scaleResults
}

function Get-KubernetesStatus {
    Write-ColorOutput "Getting Kubernetes status..." -Color Info
    Write-Log "Getting Kubernetes status" "INFO"
    
    $statusResults = @()
    
    try {
        # Get namespace status
        $namespaceStatus = kubectl get namespace $Namespace 2>$null
        if ($LASTEXITCODE -eq 0) {
            $statusResults += @{ Resource = "Namespace"; Status = "Available"; Details = $namespaceStatus }
            Write-ColorOutput "✅ Namespace status:" -Color Success
            Write-ColorOutput $namespaceStatus -Color Info
            Write-Log "Namespace status: $namespaceStatus" "INFO"
        } else {
            $statusResults += @{ Resource = "Namespace"; Status = "Not Found"; Details = "Namespace $Namespace not found" }
            Write-ColorOutput "❌ Namespace not found" -Color Error
            Write-Log "Namespace not found: $Namespace" "ERROR"
        }
        
        # Get pods status
        $podsStatus = kubectl get pods -n $Namespace 2>$null
        if ($LASTEXITCODE -eq 0) {
            $statusResults += @{ Resource = "Pods"; Status = "Available"; Details = $podsStatus }
            Write-ColorOutput "✅ Pods status:" -Color Success
            Write-ColorOutput $podsStatus -Color Info
            Write-Log "Pods status: $podsStatus" "INFO"
        } else {
            $statusResults += @{ Resource = "Pods"; Status = "Not Found"; Details = "No pods found in namespace $Namespace" }
            Write-ColorOutput "❌ No pods found" -Color Error
            Write-Log "No pods found in namespace: $Namespace" "ERROR"
        }
        
        # Get services status
        $servicesStatus = kubectl get services -n $Namespace 2>$null
        if ($LASTEXITCODE -eq 0) {
            $statusResults += @{ Resource = "Services"; Status = "Available"; Details = $servicesStatus }
            Write-ColorOutput "✅ Services status:" -Color Success
            Write-ColorOutput $servicesStatus -Color Info
            Write-Log "Services status: $servicesStatus" "INFO"
        } else {
            $statusResults += @{ Resource = "Services"; Status = "Not Found"; Details = "No services found in namespace $Namespace" }
            Write-ColorOutput "❌ No services found" -Color Error
            Write-Log "No services found in namespace: $Namespace" "ERROR"
        }
        
        # Get deployments status
        $deploymentsStatus = kubectl get deployments -n $Namespace 2>$null
        if ($LASTEXITCODE -eq 0) {
            $statusResults += @{ Resource = "Deployments"; Status = "Available"; Details = $deploymentsStatus }
            Write-ColorOutput "✅ Deployments status:" -Color Success
            Write-ColorOutput $deploymentsStatus -Color Info
            Write-Log "Deployments status: $deploymentsStatus" "INFO"
        } else {
            $statusResults += @{ Resource = "Deployments"; Status = "Not Found"; Details = "No deployments found in namespace $Namespace" }
            Write-ColorOutput "❌ No deployments found" -Color Error
            Write-Log "No deployments found in namespace: $Namespace" "ERROR"
        }
        
    } catch {
        Write-ColorOutput "❌ Kubernetes status error: $($_.Exception.Message)" -Color Error
        Write-Log "Kubernetes status error: $($_.Exception.Message)" "ERROR"
    }
    
    return $statusResults
}

function Show-Usage {
    Write-ColorOutput "Usage: .\kubernetes-orchestration.ps1 -Action <action> [options]" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Actions:" -Color Info
    Write-ColorOutput "  all      - Deploy, scale, and get status" -Color Info
    Write-ColorOutput "  deploy   - Deploy Kubernetes resources" -Color Info
    Write-ColorOutput "  scale    - Scale services" -Color Info
    Write-ColorOutput "  update   - Update deployments" -Color Info
    Write-ColorOutput "  rollback - Rollback deployments" -Color Info
    Write-ColorOutput "  delete   - Delete resources" -Color Info
    Write-ColorOutput "  status   - Get status" -Color Info
    Write-ColorOutput "  logs     - Get logs" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Services:" -Color Info
    Write-ColorOutput "  all                    - All services" -Color Info
    Write-ColorOutput "  api-gateway           - API Gateway service" -Color Info
    Write-ColorOutput "  event-bus             - Event Bus service" -Color Info
    Write-ColorOutput "  microservices         - Microservices" -Color Info
    Write-ColorOutput "  dashboard             - Dashboard service" -Color Info
    Write-ColorOutput "  notifications         - Smart Notifications service" -Color Info
    Write-ColorOutput "  forecasting           - Forecasting service" -Color Info
    Write-ColorOutput "  benchmarking          - Benchmarking service" -Color Info
    Write-ColorOutput "  data-export           - Data Export service" -Color Info
    Write-ColorOutput "  deadline-prediction   - Deadline Prediction service" -Color Info
    Write-ColorOutput "  sprint-planning       - Sprint Planning service" -Color Info
    Write-ColorOutput "  task-distribution     - Task Distribution service" -Color Info
    Write-ColorOutput "  task-dependency       - Task Dependency Management service" -Color Info
    Write-ColorOutput "  status-updates        - Automatic Status Updates service" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Options:" -Color Info
    Write-ColorOutput "  -Verbose     - Show detailed output" -Color Info
    Write-ColorOutput "  -Namespace   - Kubernetes namespace (default: manageragent)" -Color Info
    Write-ColorOutput "  -ConfigPath  - Path for configuration files (default: kubernetes)" -Color Info
    Write-ColorOutput "  -Replicas    - Number of replicas (default: 2)" -Color Info
    Write-ColorOutput "  -ImageTag    - Image tag (default: latest)" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" -Color Info
    Write-ColorOutput "  .\kubernetes-orchestration.ps1 -Action all" -Color Info
    Write-ColorOutput "  .\kubernetes-orchestration.ps1 -Action deploy -Service api-gateway" -Color Info
    Write-ColorOutput "  .\kubernetes-orchestration.ps1 -Action scale -Replicas 3" -Color Info
    Write-ColorOutput "  .\kubernetes-orchestration.ps1 -Action status -Verbose" -Color Info
}

# Main execution
function Main {
    Show-Header
    
    # Test prerequisites
    $prerequisites = Test-KubernetesPrerequisites
    if (-not $prerequisites.Overall) {
        Write-ColorOutput "❌ Prerequisites not met. Please install required tools." -Color Error
        Write-Log "Prerequisites not met" "ERROR"
        return
    }
    
    Write-ColorOutput "✅ All prerequisites met" -Color Success
    Write-Log "All prerequisites met" "INFO"
    
    # Create configuration directory
    if (-not (Test-Path $ConfigPath)) {
        New-Item -ItemType Directory -Path $ConfigPath -Force
        Write-ColorOutput "✅ Configuration directory created: $ConfigPath" -Color Success
        Write-Log "Configuration directory created: $ConfigPath" "INFO"
    }
    
    # Execute action based on parameter
    switch ($Action) {
        "all" {
            Write-ColorOutput "Running complete Kubernetes orchestration workflow..." -Color Info
            Write-Log "Running complete Kubernetes orchestration workflow" "INFO"
            
            $manifestResults = Create-KubernetesManifests
            $deployResults = Deploy-KubernetesResources
            $scaleResults = Scale-KubernetesServices
            $statusResults = Get-KubernetesStatus
            
            # Show summary
            Write-ColorOutput ""
            Write-ColorOutput "Kubernetes Orchestration Summary:" -Color Header
            Write-ColorOutput "=================================" -Color Header
            
            $successfulManifests = ($manifestResults | Where-Object { $_.Status -eq "Created" }).Count
            $totalManifests = $manifestResults.Count
            Write-ColorOutput "Manifests: $successfulManifests/$totalManifests created" -Color $(if ($successfulManifests -eq $totalManifests) { "Success" } else { "Warning" })
            
            $successfulDeploys = ($deployResults | Where-Object { $_.Status -eq "Success" }).Count
            $totalDeploys = $deployResults.Count
            Write-ColorOutput "Deployments: $successfulDeploys/$totalDeploys successful" -Color $(if ($successfulDeploys -eq $totalDeploys) { "Success" } else { "Warning" })
            
            $successfulScales = ($scaleResults | Where-Object { $_.Status -eq "Success" }).Count
            $totalScales = $scaleResults.Count
            Write-ColorOutput "Scaling: $successfulScales/$totalScales successful" -Color $(if ($successfulScales -eq $totalScales) { "Success" } else { "Warning" })
        }
        "deploy" {
            Write-ColorOutput "Deploying Kubernetes resources..." -Color Info
            Write-Log "Deploying Kubernetes resources" "INFO"
            $manifestResults = Create-KubernetesManifests
            $deployResults = Deploy-KubernetesResources
        }
        "scale" {
            Write-ColorOutput "Scaling Kubernetes services..." -Color Info
            Write-Log "Scaling Kubernetes services" "INFO"
            $scaleResults = Scale-KubernetesServices
        }
        "status" {
            Write-ColorOutput "Getting Kubernetes status..." -Color Info
            Write-Log "Getting Kubernetes status" "INFO"
            $statusResults = Get-KubernetesStatus
        }
        default {
            Write-ColorOutput "Unknown action: $Action" -Color Error
            Write-Log "Unknown action: $Action" "ERROR"
            Show-Usage
        }
    }
    
    Write-Log "Kubernetes orchestration completed for action: $Action" "INFO"
}

# Run main function
Main
