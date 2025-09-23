# Docker Containerization Script for ManagerAgentAI v2.5
# Cloud deployment ready containers for all platforms

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "build", "deploy", "test", "clean", "push")]
    [string]$Action = "all",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "api-gateway", "event-bus", "microservices", "dashboard", "notifications", "forecasting", "benchmarking", "data-export", "deadline-prediction", "sprint-planning", "task-distribution", "task-dependency", "status-updates")]
    [string]$Service = "all",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose,
    
    [Parameter(Mandatory=$false)]
    [string]$Registry = "manageragent",
    
    [Parameter(Mandatory=$false)]
    [string]$Tag = "latest",
    
    [Parameter(Mandatory=$false)]
    [string]$ConfigPath = "docker"
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Script configuration
$ScriptName = "Docker-Containerization"
$Version = "2.5.0"
$LogFile = "docker-containerization.log"

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
    Write-ColorOutput "🐳 ManagerAgentAI Docker Containerization v2.5" -Color Header
    Write-ColorOutput "=============================================" -Color Header
    Write-ColorOutput "Cloud deployment ready containers" -Color Info
    Write-ColorOutput ""
}

function Test-DockerPrerequisites {
    Write-ColorOutput "Testing Docker prerequisites..." -Color Info
    Write-Log "Testing Docker prerequisites" "INFO"
    
    $prerequisites = @{
        Docker = $false
        DockerCompose = $false
        NodeJS = $false
        PowerShell = $false
        Git = $false
        Overall = $false
    }
    
    # Test Docker
    try {
        $dockerVersion = docker --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $prerequisites.Docker = $true
            Write-ColorOutput "✅ Docker: $dockerVersion" -Color Success
            Write-Log "Docker prerequisite: PASS ($dockerVersion)" "INFO"
        } else {
            Write-ColorOutput "❌ Docker: Not found" -Color Error
            Write-Log "Docker prerequisite: FAIL (Not found)" "ERROR"
        }
    } catch {
        Write-ColorOutput "❌ Docker: Test failed" -Color Error
        Write-Log "Docker prerequisite test failed: $($_.Exception.Message)" "ERROR"
    }
    
    # Test Docker Compose
    try {
        $composeVersion = docker-compose --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $prerequisites.DockerCompose = $true
            Write-ColorOutput "✅ Docker Compose: $composeVersion" -Color Success
            Write-Log "Docker Compose prerequisite: PASS ($composeVersion)" "INFO"
        } else {
            Write-ColorOutput "❌ Docker Compose: Not found" -Color Error
            Write-Log "Docker Compose prerequisite: FAIL (Not found)" "ERROR"
        }
    } catch {
        Write-ColorOutput "❌ Docker Compose: Test failed" -Color Error
        Write-Log "Docker Compose prerequisite test failed: $($_.Exception.Message)" "ERROR"
    }
    
    # Test Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $prerequisites.NodeJS = $true
            Write-ColorOutput "✅ Node.js: $nodeVersion" -Color Success
            Write-Log "Node.js prerequisite: PASS ($nodeVersion)" "INFO"
        } else {
            Write-ColorOutput "❌ Node.js: Not found" -Color Error
            Write-Log "Node.js prerequisite: FAIL (Not found)" "ERROR"
        }
    } catch {
        Write-ColorOutput "❌ Node.js: Test failed" -Color Error
        Write-Log "Node.js prerequisite test failed: $($_.Exception.Message)" "ERROR"
    }
    
    # Test PowerShell
    try {
        $psVersion = $PSVersionTable.PSVersion
        if ($psVersion.Major -ge 5) {
            $prerequisites.PowerShell = $true
            Write-ColorOutput "✅ PowerShell: $psVersion" -Color Success
            Write-Log "PowerShell prerequisite: PASS ($psVersion)" "INFO"
        } else {
            Write-ColorOutput "❌ PowerShell: Incompatible ($psVersion)" -Color Error
            Write-Log "PowerShell prerequisite: FAIL ($psVersion)" "ERROR"
        }
    } catch {
        Write-ColorOutput "❌ PowerShell: Test failed" -Color Error
        Write-Log "PowerShell prerequisite test failed: $($_.Exception.Message)" "ERROR"
    }
    
    # Test Git
    try {
        $gitVersion = git --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $prerequisites.Git = $true
            Write-ColorOutput "✅ Git: $gitVersion" -Color Success
            Write-Log "Git prerequisite: PASS ($gitVersion)" "INFO"
        } else {
            Write-ColorOutput "❌ Git: Not found" -Color Error
            Write-Log "Git prerequisite: FAIL (Not found)" "ERROR"
        }
    } catch {
        Write-ColorOutput "❌ Git: Test failed" -Color Error
        Write-Log "Git prerequisite test failed: $($_.Exception.Message)" "ERROR"
    }
    
    $prerequisites.Overall = $prerequisites.Docker -and $prerequisites.DockerCompose -and $prerequisites.NodeJS -and $prerequisites.PowerShell -and $prerequisites.Git
    
    return $prerequisites
}

function Build-DockerImages {
    Write-ColorOutput "Building Docker images..." -Color Info
    Write-Log "Building Docker images" "INFO"
    
    $services = @(
        @{ Name = "API Gateway"; Dockerfile = "Dockerfile.api-gateway"; Context = "api-gateway" },
        @{ Name = "Event Bus"; Dockerfile = "Dockerfile.event-bus"; Context = "event-bus" },
        @{ Name = "Microservices"; Dockerfile = "Dockerfile.microservices"; Context = "microservices" },
        @{ Name = "Dashboard"; Dockerfile = "Dockerfile.dashboard"; Context = "dashboard" },
        @{ Name = "Smart Notifications"; Dockerfile = "Dockerfile.smart-notifications"; Context = "smart-notifications" },
        @{ Name = "Forecasting"; Dockerfile = "Dockerfile.forecasting"; Context = "forecasting" },
        @{ Name = "Benchmarking"; Dockerfile = "Dockerfile.benchmarking"; Context = "benchmarking" },
        @{ Name = "Data Export"; Dockerfile = "Dockerfile.data-export"; Context = "data-export" },
        @{ Name = "Deadline Prediction"; Dockerfile = "Dockerfile.deadline-prediction"; Context = "deadline-prediction" },
        @{ Name = "Sprint Planning"; Dockerfile = "Dockerfile.sprint-planning"; Context = "sprint-planning" },
        @{ Name = "Task Distribution"; Dockerfile = "Dockerfile.task-distribution"; Context = "task-distribution" },
        @{ Name = "Task Dependency Management"; Dockerfile = "Dockerfile.task-dependency-management"; Context = "task-dependency-management" },
        @{ Name = "Automatic Status Updates"; Dockerfile = "Dockerfile.automatic-status-updates"; Context = "automatic-status-updates" }
    )
    
    $buildResults = @()
    
    foreach ($service in $services) {
        if ($Service -eq "all" -or $Service -eq $service.Name.ToLower().Replace(" ", "-")) {
            Write-ColorOutput "Building $($service.Name)..." -Color Info
            Write-Log "Building service: $($service.Name)" "INFO"
            
            try {
                $imageName = "$Registry/$($service.Name.ToLower().Replace(" ", "-")):$Tag"
                $buildCommand = "docker build -f $($service.Dockerfile) -t $imageName $($service.Context)"
                
                Write-ColorOutput "Command: $buildCommand" -Color Info
                Write-Log "Build command: $buildCommand" "INFO"
                
                $buildOutput = Invoke-Expression $buildCommand 2>&1
                $buildExitCode = $LASTEXITCODE
                
                if ($buildExitCode -eq 0) {
                    $buildResults += @{ Service = $service.Name; Status = "Success"; Image = $imageName }
                    Write-ColorOutput "✅ $($service.Name) built successfully: $imageName" -Color Success
                    Write-Log "$($service.Name) build: SUCCESS ($imageName)" "INFO"
                } else {
                    $buildResults += @{ Service = $service.Name; Status = "Failed"; Error = $buildOutput }
                    Write-ColorOutput "❌ $($service.Name) build failed" -Color Error
                    Write-Log "$($service.Name) build: FAILED ($buildOutput)" "ERROR"
                }
            } catch {
                $buildResults += @{ Service = $service.Name; Status = "Error"; Error = $_.Exception.Message }
                Write-ColorOutput "❌ $($service.Name) build error: $($_.Exception.Message)" -Color Error
                Write-Log "$($service.Name) build: ERROR ($($_.Exception.Message))" "ERROR"
            }
        }
    }
    
    return $buildResults
}

function Deploy-DockerContainers {
    Write-ColorOutput "Deploying Docker containers..." -Color Info
    Write-Log "Deploying Docker containers" "INFO"
    
    $deployResults = @()
    
    try {
        # Create docker-compose.yml if it doesn't exist
        if (-not (Test-Path "docker-compose.yml")) {
            Write-ColorOutput "Creating docker-compose.yml..." -Color Info
            Write-Log "Creating docker-compose.yml" "INFO"
            
            $dockerComposeContent = @"
version: '3.8'

services:
  api-gateway:
    image: $Registry/api-gateway:$Tag
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    depends_on:
      - event-bus
    restart: unless-stopped

  event-bus:
    image: $Registry/event-bus:$Tag
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
    restart: unless-stopped

  microservices:
    image: $Registry/microservices:$Tag
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - PORT=3002
    depends_on:
      - event-bus
    restart: unless-stopped

  dashboard:
    image: $Registry/dashboard:$Tag
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
      - PORT=3003
    depends_on:
      - api-gateway
    restart: unless-stopped

  notifications:
    image: $Registry/smart-notifications:$Tag
    ports:
      - "3004:3004"
    environment:
      - NODE_ENV=production
      - PORT=3004
    depends_on:
      - event-bus
    restart: unless-stopped

  forecasting:
    image: $Registry/forecasting:$Tag
    ports:
      - "3005:3005"
    environment:
      - NODE_ENV=production
      - PORT=3005
    depends_on:
      - event-bus
    restart: unless-stopped

  benchmarking:
    image: $Registry/benchmarking:$Tag
    ports:
      - "3006:3006"
    environment:
      - NODE_ENV=production
      - PORT=3006
    depends_on:
      - event-bus
    restart: unless-stopped

  data-export:
    image: $Registry/data-export:$Tag
    ports:
      - "3007:3007"
    environment:
      - NODE_ENV=production
      - PORT=3007
    depends_on:
      - event-bus
    restart: unless-stopped

  deadline-prediction:
    image: $Registry/deadline-prediction:$Tag
    ports:
      - "3008:3008"
    environment:
      - NODE_ENV=production
      - PORT=3008
    depends_on:
      - event-bus
    restart: unless-stopped

  sprint-planning:
    image: $Registry/sprint-planning:$Tag
    ports:
      - "3009:3009"
    environment:
      - NODE_ENV=production
      - PORT=3009
    depends_on:
      - event-bus
    restart: unless-stopped

  task-distribution:
    image: $Registry/task-distribution:$Tag
    ports:
      - "3010:3010"
    environment:
      - NODE_ENV=production
      - PORT=3010
    depends_on:
      - event-bus
    restart: unless-stopped

  task-dependency:
    image: $Registry/task-dependency-management:$Tag
    ports:
      - "3011:3011"
    environment:
      - NODE_ENV=production
      - PORT=3011
    depends_on:
      - event-bus
    restart: unless-stopped

  status-updates:
    image: $Registry/automatic-status-updates:$Tag
    ports:
      - "3012:3012"
    environment:
      - NODE_ENV=production
      - PORT=3012
    depends_on:
      - event-bus
    restart: unless-stopped

networks:
  default:
    driver: bridge
"@
            
            $dockerComposeContent | Out-File -FilePath "docker-compose.yml" -Encoding UTF8
            Write-ColorOutput "✅ docker-compose.yml created" -Color Success
            Write-Log "docker-compose.yml created successfully" "INFO"
        }
        
        # Deploy containers
        Write-ColorOutput "Starting Docker Compose deployment..." -Color Info
        Write-Log "Starting Docker Compose deployment" "INFO"
        
        $deployCommand = "docker-compose up -d"
        $deployOutput = Invoke-Expression $deployCommand 2>&1
        $deployExitCode = $LASTEXITCODE
        
        if ($deployExitCode -eq 0) {
            $deployResults += @{ Status = "Success"; Output = $deployOutput }
            Write-ColorOutput "✅ Docker containers deployed successfully" -Color Success
            Write-Log "Docker containers deployed successfully" "INFO"
        } else {
            $deployResults += @{ Status = "Failed"; Output = $deployOutput }
            Write-ColorOutput "❌ Docker containers deployment failed" -Color Error
            Write-Log "Docker containers deployment failed: $deployOutput" "ERROR"
        }
    } catch {
        $deployResults += @{ Status = "Error"; Error = $_.Exception.Message }
        Write-ColorOutput "❌ Docker containers deployment error: $($_.Exception.Message)" -Color Error
        Write-Log "Docker containers deployment error: $($_.Exception.Message)" "ERROR"
    }
    
    return $deployResults
}

function Test-DockerContainers {
    Write-ColorOutput "Testing Docker containers..." -Color Info
    Write-Log "Testing Docker containers" "INFO"
    
    $testResults = @()
    
    try {
        # Get running containers
        $containers = docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "Running containers:" -Color Info
            Write-ColorOutput $containers -Color Info
            Write-Log "Running containers: $containers" "INFO"
            
            # Test container health
            $containerNames = (docker ps --format "{{.Names}}" 2>$null) -split "`n"
            foreach ($containerName in $containerNames) {
                if ($containerName) {
                    $health = docker inspect $containerName --format "{{.State.Health.Status}}" 2>$null
                    if ($LASTEXITCODE -eq 0) {
                        $testResults += @{ Container = $containerName; Health = $health; Status = "Success" }
                        Write-ColorOutput "✅ $containerName - Health: $health" -Color Success
                        Write-Log "Container health check: $containerName - $health" "INFO"
                    } else {
                        $testResults += @{ Container = $containerName; Health = "Unknown"; Status = "Failed" }
                        Write-ColorOutput "❌ $containerName - Health check failed" -Color Error
                        Write-Log "Container health check failed: $containerName" "ERROR"
                    }
                }
            }
        } else {
            Write-ColorOutput "❌ Failed to get running containers" -Color Error
            Write-Log "Failed to get running containers" "ERROR"
        }
    } catch {
        Write-ColorOutput "❌ Docker containers test error: $($_.Exception.Message)" -Color Error
        Write-Log "Docker containers test error: $($_.Exception.Message)" "ERROR"
    }
    
    return $testResults
}

function Clean-DockerResources {
    Write-ColorOutput "Cleaning Docker resources..." -Color Info
    Write-Log "Cleaning Docker resources" "INFO"
    
    $cleanResults = @()
    
    try {
        # Stop and remove containers
        Write-ColorOutput "Stopping containers..." -Color Info
        $stopCommand = "docker-compose down"
        $stopOutput = Invoke-Expression $stopCommand 2>&1
        $stopExitCode = $LASTEXITCODE
        
        if ($stopExitCode -eq 0) {
            $cleanResults += @{ Action = "Stop Containers"; Status = "Success" }
            Write-ColorOutput "✅ Containers stopped successfully" -Color Success
            Write-Log "Containers stopped successfully" "INFO"
        } else {
            $cleanResults += @{ Action = "Stop Containers"; Status = "Failed"; Output = $stopOutput }
            Write-ColorOutput "❌ Failed to stop containers" -Color Error
            Write-Log "Failed to stop containers: $stopOutput" "ERROR"
        }
        
        # Remove images
        Write-ColorOutput "Removing images..." -Color Info
        $removeCommand = "docker rmi $Registry/*:$Tag"
        $removeOutput = Invoke-Expression $removeCommand 2>&1
        $removeExitCode = $LASTEXITCODE
        
        if ($removeExitCode -eq 0) {
            $cleanResults += @{ Action = "Remove Images"; Status = "Success" }
            Write-ColorOutput "✅ Images removed successfully" -Color Success
            Write-Log "Images removed successfully" "INFO"
        } else {
            $cleanResults += @{ Action = "Remove Images"; Status = "Failed"; Output = $removeOutput }
            Write-ColorOutput "❌ Failed to remove images" -Color Error
            Write-Log "Failed to remove images: $removeOutput" "ERROR"
        }
        
        # Clean up unused resources
        Write-ColorOutput "Cleaning up unused resources..." -Color Info
        $cleanupCommand = "docker system prune -f"
        $cleanupOutput = Invoke-Expression $cleanupCommand 2>&1
        $cleanupExitCode = $LASTEXITCODE
        
        if ($cleanupExitCode -eq 0) {
            $cleanResults += @{ Action = "System Cleanup"; Status = "Success" }
            Write-ColorOutput "✅ System cleanup completed" -Color Success
            Write-Log "System cleanup completed" "INFO"
        } else {
            $cleanResults += @{ Action = "System Cleanup"; Status = "Failed"; Output = $cleanupOutput }
            Write-ColorOutput "❌ System cleanup failed" -Color Error
            Write-Log "System cleanup failed: $cleanupOutput" "ERROR"
        }
    } catch {
        $cleanResults += @{ Action = "Cleanup"; Status = "Error"; Error = $_.Exception.Message }
        Write-ColorOutput "❌ Docker cleanup error: $($_.Exception.Message)" -Color Error
        Write-Log "Docker cleanup error: $($_.Exception.Message)" "ERROR"
    }
    
    return $cleanResults
}

function Push-DockerImages {
    Write-ColorOutput "Pushing Docker images to registry..." -Color Info
    Write-Log "Pushing Docker images to registry" "INFO"
    
    $pushResults = @()
    
    try {
        # Login to registry
        Write-ColorOutput "Logging in to registry..." -Color Info
        Write-Log "Logging in to registry" "INFO"
        
        $loginCommand = "docker login $Registry"
        $loginOutput = Invoke-Expression $loginCommand 2>&1
        $loginExitCode = $LASTEXITCODE
        
        if ($loginExitCode -eq 0) {
            Write-ColorOutput "✅ Logged in to registry successfully" -Color Success
            Write-Log "Logged in to registry successfully" "INFO"
        } else {
            Write-ColorOutput "❌ Failed to login to registry" -Color Error
            Write-Log "Failed to login to registry: $loginOutput" "ERROR"
            return $pushResults
        }
        
        # Push images
        $images = docker images --format "{{.Repository}}:{{.Tag}}" | Where-Object { $_ -like "$Registry/*" }
        
        foreach ($image in $images) {
            Write-ColorOutput "Pushing $image..." -Color Info
            Write-Log "Pushing image: $image" "INFO"
            
            $pushCommand = "docker push $image"
            $pushOutput = Invoke-Expression $pushCommand 2>&1
            $pushExitCode = $LASTEXITCODE
            
            if ($pushExitCode -eq 0) {
                $pushResults += @{ Image = $image; Status = "Success" }
                Write-ColorOutput "✅ $image pushed successfully" -Color Success
                Write-Log "Image pushed successfully: $image" "INFO"
            } else {
                $pushResults += @{ Image = $image; Status = "Failed"; Output = $pushOutput }
                Write-ColorOutput "❌ Failed to push $image" -Color Error
                Write-Log "Failed to push image: $image - $pushOutput" "ERROR"
            }
        }
    } catch {
        $pushResults += @{ Action = "Push"; Status = "Error"; Error = $_.Exception.Message }
        Write-ColorOutput "❌ Docker push error: $($_.Exception.Message)" -Color Error
        Write-Log "Docker push error: $($_.Exception.Message)" "ERROR"
    }
    
    return $pushResults
}

function Show-Usage {
    Write-ColorOutput "Usage: .\docker-containerization.ps1 -Action <action> [options]" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Actions:" -Color Info
    Write-ColorOutput "  all      - Build, deploy, and test containers" -Color Info
    Write-ColorOutput "  build    - Build Docker images" -Color Info
    Write-ColorOutput "  deploy   - Deploy containers" -Color Info
    Write-ColorOutput "  test     - Test containers" -Color Info
    Write-ColorOutput "  clean    - Clean up resources" -Color Info
    Write-ColorOutput "  push     - Push images to registry" -Color Info
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
    Write-ColorOutput "  -Registry    - Docker registry (default: manageragent)" -Color Info
    Write-ColorOutput "  -Tag         - Image tag (default: latest)" -Color Info
    Write-ColorOutput "  -ConfigPath  - Path for configuration files" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" -Color Info
    Write-ColorOutput "  .\docker-containerization.ps1 -Action all" -Color Info
    Write-ColorOutput "  .\docker-containerization.ps1 -Action build -Service api-gateway" -Color Info
    Write-ColorOutput "  .\docker-containerization.ps1 -Action deploy -Verbose" -Color Info
    Write-ColorOutput "  .\docker-containerization.ps1 -Action push -Registry myregistry" -Color Info
}

# Main execution
function Main {
    Show-Header
    
    # Test prerequisites
    $prerequisites = Test-DockerPrerequisites
    if (-not $prerequisites.Overall) {
        Write-ColorOutput "❌ Prerequisites not met. Please install required tools." -Color Error
        Write-Log "Prerequisites not met" "ERROR"
        return
    }
    
    Write-ColorOutput "✅ All prerequisites met" -Color Success
    Write-Log "All prerequisites met" "INFO"
    
    # Execute action based on parameter
    switch ($Action) {
        "all" {
            Write-ColorOutput "Running complete Docker containerization workflow..." -Color Info
            Write-Log "Running complete Docker containerization workflow" "INFO"
            
            $buildResults = Build-DockerImages
            $deployResults = Deploy-DockerContainers
            $testResults = Test-DockerContainers
            
            # Show summary
            Write-ColorOutput ""
            Write-ColorOutput "Docker Containerization Summary:" -Color Header
            Write-ColorOutput "===============================" -Color Header
            
            $successfulBuilds = ($buildResults | Where-Object { $_.Status -eq "Success" }).Count
            $totalBuilds = $buildResults.Count
            Write-ColorOutput "Builds: $successfulBuilds/$totalBuilds successful" -Color $(if ($successfulBuilds -eq $totalBuilds) { "Success" } else { "Warning" })
            
            $successfulDeploys = ($deployResults | Where-Object { $_.Status -eq "Success" }).Count
            $totalDeploys = $deployResults.Count
            Write-ColorOutput "Deployments: $successfulDeploys/$totalDeploys successful" -Color $(if ($successfulDeploys -eq $totalDeploys) { "Success" } else { "Warning" })
            
            $successfulTests = ($testResults | Where-Object { $_.Status -eq "Success" }).Count
            $totalTests = $testResults.Count
            Write-ColorOutput "Tests: $successfulTests/$totalTests successful" -Color $(if ($successfulTests -eq $totalTests) { "Success" } else { "Warning" })
        }
        "build" {
            Write-ColorOutput "Building Docker images..." -Color Info
            Write-Log "Building Docker images" "INFO"
            $buildResults = Build-DockerImages
        }
        "deploy" {
            Write-ColorOutput "Deploying Docker containers..." -Color Info
            Write-Log "Deploying Docker containers" "INFO"
            $deployResults = Deploy-DockerContainers
        }
        "test" {
            Write-ColorOutput "Testing Docker containers..." -Color Info
            Write-Log "Testing Docker containers" "INFO"
            $testResults = Test-DockerContainers
        }
        "clean" {
            Write-ColorOutput "Cleaning Docker resources..." -Color Info
            Write-Log "Cleaning Docker resources" "INFO"
            $cleanResults = Clean-DockerResources
        }
        "push" {
            Write-ColorOutput "Pushing Docker images..." -Color Info
            Write-Log "Pushing Docker images" "INFO"
            $pushResults = Push-DockerImages
        }
        default {
            Write-ColorOutput "Unknown action: $Action" -Color Error
            Write-Log "Unknown action: $Action" "ERROR"
            Show-Usage
        }
    }
    
    Write-Log "Docker containerization completed for action: $Action" "INFO"
}

# Run main function
Main
