# ManagerAgentAI Containerization Manager v2.4
# Complete containerization management for all services

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("build", "start", "stop", "restart", "status", "logs", "health", "scale", "clean", "backup", "restore", "deploy-k8s", "test", "help")]
    [string]$Action,
    
    [Parameter(Mandatory=$false)]
    [string]$Service,
    
    [Parameter(Mandatory=$false)]
    [int]$Replicas = 1,
    
    [Parameter(Mandatory=$false)]
    [string]$BackupPath
)

# Configuration
$ProjectName = "manager-agent-ai"
$DockerComposeFile = "docker-compose.yml"
$KubernetesNamespace = "manager-agent-ai"

# Colors for output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Magenta = "`e[35m"
$Cyan = "`e[36m"
$White = "`e[37m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = $White)
    Write-Host "${Color}${Message}${Reset}"
}

function Write-Header {
    param([string]$Title)
    Write-ColorOutput "`n🚀 $Title" $Cyan
    Write-ColorOutput ("=" * 60) $Cyan
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" $Green
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" $Red
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" $Yellow
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput "ℹ️  $Message" $Blue
}

function Test-DockerInstalled {
    try {
        $dockerVersion = docker --version 2>$null
        $dockerComposeVersion = docker-compose --version 2>$null
        
        if ($dockerVersion -and $dockerComposeVersion) {
            Write-Success "Docker and Docker Compose are installed"
            Write-Info "Docker: $dockerVersion"
            Write-Info "Docker Compose: $dockerComposeVersion"
            return $true
        } else {
            Write-Error "Docker or Docker Compose not found"
            return $false
        }
    } catch {
        Write-Error "Docker or Docker Compose not found"
        return $false
    }
}

function Test-DockerComposeFile {
    if (Test-Path $DockerComposeFile) {
        Write-Success "Docker Compose file found: $DockerComposeFile"
        return $true
    } else {
        Write-Error "Docker Compose file not found: $DockerComposeFile"
        return $false
    }
}

function Invoke-BuildImages {
    Write-Header "Building Container Images"
    
    if (-not (Test-DockerInstalled)) { return }
    if (-not (Test-DockerComposeFile)) { return }
    
    try {
        Write-Info "Building all container images..."
        docker-compose -f $DockerComposeFile build --no-cache
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "All images built successfully"
        } else {
            Write-Error "Failed to build images"
            return $false
        }
    } catch {
        Write-Error "Error building images: $($_.Exception.Message)"
        return $false
    }
    
    return $true
}

function Invoke-StartServices {
    param([string]$ServiceName = "")
    
    Write-Header "Starting Services"
    
    if (-not (Test-DockerInstalled)) { return }
    if (-not (Test-DockerComposeFile)) { return }
    
    try {
        if ($ServiceName) {
            Write-Info "Starting service: $ServiceName"
            docker-compose -f $DockerComposeFile up -d $ServiceName
        } else {
            Write-Info "Starting all services..."
            docker-compose -f $DockerComposeFile up -d
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Services started successfully"
            Start-Sleep -Seconds 5
            Invoke-ShowStatus
        } else {
            Write-Error "Failed to start services"
            return $false
        }
    } catch {
        Write-Error "Error starting services: $($_.Exception.Message)"
        return $false
    }
    
    return $true
}

function Invoke-StopServices {
    param([string]$ServiceName = "")
    
    Write-Header "Stopping Services"
    
    if (-not (Test-DockerInstalled)) { return }
    if (-not (Test-DockerComposeFile)) { return }
    
    try {
        if ($ServiceName) {
            Write-Info "Stopping service: $ServiceName"
            docker-compose -f $DockerComposeFile stop $ServiceName
        } else {
            Write-Info "Stopping all services..."
            docker-compose -f $DockerComposeFile down
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Services stopped successfully"
        } else {
            Write-Error "Failed to stop services"
            return $false
        }
    } catch {
        Write-Error "Error stopping services: $($_.Exception.Message)"
        return $false
    }
    
    return $true
}

function Invoke-RestartServices {
    param([string]$ServiceName = "")
    
    Write-Header "Restarting Services"
    
    if (-not (Test-DockerInstalled)) { return }
    if (-not (Test-DockerComposeFile)) { return }
    
    try {
        if ($ServiceName) {
            Write-Info "Restarting service: $ServiceName"
            docker-compose -f $DockerComposeFile restart $ServiceName
        } else {
            Write-Info "Restarting all services..."
            docker-compose -f $DockerComposeFile restart
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Services restarted successfully"
            Start-Sleep -Seconds 5
            Invoke-ShowStatus
        } else {
            Write-Error "Failed to restart services"
            return $false
        }
    } catch {
        Write-Error "Error restarting services: $($_.Exception.Message)"
        return $false
    }
    
    return $true
}

function Invoke-ShowStatus {
    Write-Header "Service Status"
    
    if (-not (Test-DockerInstalled)) { return }
    if (-not (Test-DockerComposeFile)) { return }
    
    try {
        Write-Info "Checking service status..."
        docker-compose -f $DockerComposeFile ps
        
        Write-Info "`nContainer resource usage:"
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
    } catch {
        Write-Error "Error checking status: $($_.Exception.Message)"
    }
}

function Invoke-ShowLogs {
    param([string]$ServiceName = "")
    
    Write-Header "Service Logs"
    
    if (-not (Test-DockerInstalled)) { return }
    if (-not (Test-DockerComposeFile)) { return }
    
    try {
        if ($ServiceName) {
            Write-Info "Showing logs for service: $ServiceName"
            docker-compose -f $DockerComposeFile logs -f --tail=100 $ServiceName
        } else {
            Write-Info "Showing logs for all services..."
            docker-compose -f $DockerComposeFile logs -f --tail=50
        }
    } catch {
        Write-Error "Error showing logs: $($_.Exception.Message)"
    }
}

function Invoke-HealthCheck {
    Write-Header "Health Check"
    
    if (-not (Test-DockerInstalled)) { return }
    if (-not (Test-DockerComposeFile)) { return }
    
    $services = @(
        @{Name="API Gateway"; Port=3000; Path="/health"},
        @{Name="Dashboard"; Port=3001; Path="/health"},
        @{Name="Event Bus"; Port=4000; Path="/health"},
        @{Name="Project Manager"; Port=3002; Path="/health"},
        @{Name="AI Planner"; Port=3003; Path="/health"},
        @{Name="Workflow Orchestrator"; Port=3004; Path="/health"},
        @{Name="Smart Notifications"; Port=3005; Path="/health"},
        @{Name="Template Generator"; Port=3006; Path="/health"},
        @{Name="Consistency Manager"; Port=3007; Path="/health"},
        @{Name="API Versioning"; Port=3008; Path="/health"},
        @{Name="Deadline Prediction"; Port=3009; Path="/health"},
        @{Name="Task Distribution"; Port=3010; Path="/health"},
        @{Name="Automatic Status Updates"; Port=3011; Path="/health"},
        @{Name="Sprint Planning"; Port=3012; Path="/health"},
        @{Name="Task Dependency Management"; Port=3013; Path="/health"}
    )
    
    foreach ($service in $services) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)$($service.Path)" -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Success "$($service.Name) - Healthy"
            } else {
                Write-Warning "$($service.Name) - Unhealthy (Status: $($response.StatusCode))"
            }
        } catch {
            Write-Error "$($service.Name) - Unreachable"
        }
    }
}

function Invoke-ScaleService {
    param([string]$ServiceName, [int]$Replicas)
    
    Write-Header "Scaling Service"
    
    if (-not (Test-DockerInstalled)) { return }
    if (-not (Test-DockerComposeFile)) { return }
    
    if (-not $ServiceName) {
        Write-Error "Service name is required for scaling"
        return
    }
    
    try {
        Write-Info "Scaling $ServiceName to $Replicas replicas..."
        docker-compose -f $DockerComposeFile up -d --scale $ServiceName=$Replicas
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Service scaled successfully"
            Start-Sleep -Seconds 5
            Invoke-ShowStatus
        } else {
            Write-Error "Failed to scale service"
        }
    } catch {
        Write-Error "Error scaling service: $($_.Exception.Message)"
    }
}

function Invoke-Cleanup {
    Write-Header "Cleanup"
    
    if (-not (Test-DockerInstalled)) { return }
    
    try {
        Write-Info "Stopping and removing containers..."
        docker-compose -f $DockerComposeFile down -v
        
        Write-Info "Removing unused images..."
        docker image prune -f
        
        Write-Info "Removing unused volumes..."
        docker volume prune -f
        
        Write-Info "Removing unused networks..."
        docker network prune -f
        
        Write-Success "Cleanup completed"
    } catch {
        Write-Error "Error during cleanup: $($_.Exception.Message)"
    }
}

function Invoke-Backup {
    Write-Header "Backup"
    
    $timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"
    $backupDir = "backups/container-backup-$timestamp"
    
    try {
        Write-Info "Creating backup directory: $backupDir"
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        
        Write-Info "Backing up Docker Compose configuration..."
        Copy-Item $DockerComposeFile "$backupDir/" -Force
        
        Write-Info "Backing up Docker images..."
        docker-compose -f $DockerComposeFile config > "$backupDir/docker-compose-config.yml"
        
        Write-Info "Backing up volumes..."
        docker run --rm -v manager-agent-ai_postgres_data:/data -v ${PWD}/$backupDir:/backup alpine tar czf /backup/postgres-data.tar.gz -C /data .
        docker run --rm -v manager-agent-ai_redis_data:/data -v ${PWD}/$backupDir:/backup alpine tar czf /backup/redis-data.tar.gz -C /data .
        
        Write-Success "Backup completed: $backupDir"
    } catch {
        Write-Error "Error during backup: $($_.Exception.Message)"
    }
}

function Invoke-Restore {
    param([string]$BackupPath)
    
    Write-Header "Restore"
    
    if (-not $BackupPath) {
        Write-Error "Backup path is required for restore"
        return
    }
    
    if (-not (Test-Path $BackupPath)) {
        Write-Error "Backup path not found: $BackupPath"
        return
    }
    
    try {
        Write-Info "Restoring from backup: $BackupPath"
        
        Write-Info "Stopping services..."
        docker-compose -f $DockerComposeFile down
        
        Write-Info "Restoring volumes..."
        docker run --rm -v manager-agent-ai_postgres_data:/data -v ${PWD}/$BackupPath:/backup alpine tar xzf /backup/postgres-data.tar.gz -C /data
        docker run --rm -v manager-agent-ai_redis_data:/data -v ${PWD}/$BackupPath:/backup alpine tar xzf /backup/redis-data.tar.gz -C /data
        
        Write-Info "Starting services..."
        docker-compose -f $DockerComposeFile up -d
        
        Write-Success "Restore completed"
    } catch {
        Write-Error "Error during restore: $($_.Exception.Message)"
    }
}

function Invoke-DeployKubernetes {
    Write-Header "Kubernetes Deployment"
    
    try {
        Write-Info "Checking Kubernetes cluster..."
        kubectl cluster-info
        
        Write-Info "Creating namespace..."
        kubectl create namespace $KubernetesNamespace --dry-run=client -o yaml | kubectl apply -f -
        
        Write-Info "Deploying services to Kubernetes..."
        kubectl apply -f kubernetes/ -n $KubernetesNamespace
        
        Write-Info "Checking deployment status..."
        kubectl get pods -n $KubernetesNamespace
        
        Write-Success "Kubernetes deployment completed"
    } catch {
        Write-Error "Error deploying to Kubernetes: $($_.Exception.Message)"
    }
}

function Invoke-TestContainers {
    Write-Header "Container Testing"
    
    if (-not (Test-DockerInstalled)) { return }
    if (-not (Test-DockerComposeFile)) { return }
    
    try {
        Write-Info "Running container tests..."
        
        # Test container builds
        Write-Info "Testing container builds..."
        docker-compose -f $DockerComposeFile config --quiet
        
        # Test container startup
        Write-Info "Testing container startup..."
        docker-compose -f $DockerComposeFile up -d --timeout 60
        
        Start-Sleep -Seconds 30
        
        # Test health checks
        Write-Info "Testing health checks..."
        Invoke-HealthCheck
        
        Write-Success "Container tests completed"
    } catch {
        Write-Error "Error during container testing: $($_.Exception.Message)"
    }
}

function Show-Help {
    Write-Header "ManagerAgentAI Containerization Manager v2.4"
    
    Write-ColorOutput "`nAvailable Commands:" $Yellow
    Write-ColorOutput "  build                    Build all container images" $White
    Write-ColorOutput "  start [-Service <name>]  Start all services or specific service" $White
    Write-ColorOutput "  stop [-Service <name>]   Stop all services or specific service" $White
    Write-ColorOutput "  restart [-Service <name>] Restart all services or specific service" $White
    Write-ColorOutput "  status                   Show service status" $White
    Write-ColorOutput "  logs [-Service <name>]   Show service logs" $White
    Write-ColorOutput "  health                   Run health checks" $White
    Write-ColorOutput "  scale -Service <name> -Replicas <count> Scale service" $White
    Write-ColorOutput "  clean                    Clean up containers and images" $White
    Write-ColorOutput "  backup                   Create backup" $White
    Write-ColorOutput "  restore -BackupPath <path> Restore from backup" $White
    Write-ColorOutput "  deploy-k8s               Deploy to Kubernetes" $White
    Write-ColorOutput "  test                     Test containers" $White
    Write-ColorOutput "  help                     Show this help" $White
    
    Write-ColorOutput "`nExamples:" $Yellow
    Write-ColorOutput "  .\scripts\containerization-manager.ps1 -Action build" $White
    Write-ColorOutput "  .\scripts\containerization-manager.ps1 -Action start -Service api-gateway" $White
    Write-ColorOutput "  .\scripts\containerization-manager.ps1 -Action scale -Service project-manager -Replicas 3" $White
    Write-ColorOutput "  .\scripts\containerization-manager.ps1 -Action health" $White
}

# Main execution
switch ($Action) {
    "build" { Invoke-BuildImages }
    "start" { Invoke-StartServices -ServiceName $Service }
    "stop" { Invoke-StopServices -ServiceName $Service }
    "restart" { Invoke-RestartServices -ServiceName $Service }
    "status" { Invoke-ShowStatus }
    "logs" { Invoke-ShowLogs -ServiceName $Service }
    "health" { Invoke-HealthCheck }
    "scale" { Invoke-ScaleService -ServiceName $Service -Replicas $Replicas }
    "clean" { Invoke-Cleanup }
    "backup" { Invoke-Backup }
    "restore" { Invoke-Restore -BackupPath $BackupPath }
    "deploy-k8s" { Invoke-DeployKubernetes }
    "test" { Invoke-TestContainers }
    "help" { Show-Help }
    default { Show-Help }
}