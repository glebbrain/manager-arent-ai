# ManagerAgentAI Forecasting Manager v2.4
# PowerShell script for managing the Forecasting service

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "test", "deploy", "configure", "monitor", "optimize", "validate", "scenarios")]
    [string]$Action,
    
    [Parameter(Mandatory=$false)]
    [string]$ProjectId,
    
    [Parameter(Mandatory=$false)]
    [string]$Horizon = "30d",
    
    [Parameter(Mandatory=$false)]
    [string]$Method = "exponential",
    
    [Parameter(Mandatory=$false)]
    [string]$ConfigFile = "config/forecasting.json",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Configuration
$ServiceName = "forecasting-service"
$ServicePort = 3016
$ServicePath = "forecasting"
$LogFile = "logs/forecasting-manager.log"
$ConfigPath = "config/forecasting.json"

# Colors for output
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    Write-ColorOutput $LogEntry $Level
    Add-Content -Path $LogFile -Value $LogEntry
}

function Test-ServiceRunning {
    try {
        $Response = Invoke-RestMethod -Uri "http://localhost:$ServicePort/health" -Method GET -TimeoutSec 5
        return $Response.status -eq "healthy"
    }
    catch {
        return $false
    }
}

function Start-ForecastingService {
    Write-ColorOutput "Starting Forecasting Service..." "Header"
    
    if (Test-ServiceRunning) {
        Write-ColorOutput "Forecasting Service is already running" "Warning"
        return
    }
    
    try {
        # Check if Node.js is installed
        $NodeVersion = node --version 2>$null
        if (-not $NodeVersion) {
            throw "Node.js is not installed or not in PATH"
        }
        
        # Check if service directory exists
        if (-not (Test-Path $ServicePath)) {
            throw "Forecasting service directory not found: $ServicePath"
        }
        
        # Install dependencies if needed
        if (-not (Test-Path "$ServicePath/node_modules")) {
            Write-ColorOutput "Installing dependencies..." "Info"
            Set-Location $ServicePath
            npm install
            Set-Location ..
        }
        
        # Start the service
        Write-ColorOutput "Starting service on port $ServicePort..." "Info"
        Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $ServicePath -WindowStyle Hidden
        
        # Wait for service to start
        $MaxWait = 30
        $WaitCount = 0
        while (-not (Test-ServiceRunning) -and $WaitCount -lt $MaxWait) {
            Start-Sleep -Seconds 1
            $WaitCount++
        }
        
        if (Test-ServiceRunning) {
            Write-ColorOutput "Forecasting Service started successfully" "Success"
            Write-Log "Forecasting Service started successfully"
        } else {
            throw "Service failed to start within $MaxWait seconds"
        }
    }
    catch {
        Write-ColorOutput "Error starting Forecasting Service: $($_.Exception.Message)" "Error"
        Write-Log "Error starting Forecasting Service: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Stop-ForecastingService {
    Write-ColorOutput "Stopping Forecasting Service..." "Header"
    
    if (-not (Test-ServiceRunning)) {
        Write-ColorOutput "Forecasting Service is not running" "Warning"
        return
    }
    
    try {
        # Find and kill the process
        $Processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
            $_.CommandLine -like "*$ServicePath*"
        }
        
        if ($Processes) {
            $Processes | Stop-Process -Force
            Write-ColorOutput "Forecasting Service stopped" "Success"
            Write-Log "Forecasting Service stopped"
        } else {
            Write-ColorOutput "No running Forecasting Service process found" "Warning"
        }
    }
    catch {
        Write-ColorOutput "Error stopping Forecasting Service: $($_.Exception.Message)" "Error"
        Write-Log "Error stopping Forecasting Service: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Get-ServiceStatus {
    Write-ColorOutput "Checking Forecasting Service Status..." "Header"
    
    try {
        if (Test-ServiceRunning) {
            $Response = Invoke-RestMethod -Uri "http://localhost:$ServicePort/status" -Method GET
            Write-ColorOutput "Service Status: RUNNING" "Success"
            Write-ColorOutput "Port: $ServicePort" "Info"
            Write-ColorOutput "Uptime: $($Response.uptime)" "Info"
            Write-ColorOutput "Version: $($Response.version)" "Info"
            Write-ColorOutput "Total Forecasts: $($Response.totalForecasts)" "Info"
            Write-ColorOutput "Active Scenarios: $($Response.activeScenarios)" "Info"
            Write-ColorOutput "Monitoring: $($Response.monitoring)" "Info"
        } else {
            Write-ColorOutput "Service Status: STOPPED" "Error"
        }
    }
    catch {
        Write-ColorOutput "Error checking service status: $($_.Exception.Message)" "Error"
        Write-Log "Error checking service status: $($_.Exception.Message)" "ERROR"
    }
}

function Get-ServiceLogs {
    Write-ColorOutput "Retrieving Forecasting Service Logs..." "Header"
    
    try {
        $LogFiles = @(
            "logs/forecasting.log",
            "logs/forecasting-error.log",
            "logs/forecasting-monitor.log"
        )
        
        foreach ($LogFile in $LogFiles) {
            if (Test-Path $LogFile) {
                Write-ColorOutput "=== $LogFile ===" "Info"
                Get-Content $LogFile -Tail 20
                Write-ColorOutput "" "Info"
            }
        }
    }
    catch {
        Write-ColorOutput "Error retrieving logs: $($_.Exception.Message)" "Error"
        Write-Log "Error retrieving logs: $($_.Exception.Message)" "ERROR"
    }
}

function Test-ForecastingService {
    Write-ColorOutput "Testing Forecasting Service..." "Header"
    
    try {
        if (-not (Test-ServiceRunning)) {
            throw "Service is not running"
        }
        
        # Test basic endpoints
        $Endpoints = @(
            "/health",
            "/status",
            "/forecast/resource",
            "/forecast/capacity",
            "/forecast/demand",
            "/forecast/risk"
        )
        
        foreach ($Endpoint in $Endpoints) {
            try {
                $Response = Invoke-RestMethod -Uri "http://localhost:$ServicePort$Endpoint" -Method GET -TimeoutSec 5
                Write-ColorOutput "✓ $Endpoint - OK" "Success"
            }
            catch {
                Write-ColorOutput "✗ $Endpoint - FAILED: $($_.Exception.Message)" "Error"
            }
        }
        
        # Test forecasting functionality
        Write-ColorOutput "Testing forecasting functionality..." "Info"
        $TestData = @{
            projectId = "test_project"
            horizon = "7d"
            metrics = @("velocity", "completion_rate")
            options = @{
                method = "linear"
                confidence = 0.8
            }
        }
        
        $Response = Invoke-RestMethod -Uri "http://localhost:$ServicePort/forecast/resource" -Method POST -Body ($TestData | ConvertTo-Json) -ContentType "application/json"
        
        if ($Response.success) {
            Write-ColorOutput "✓ Resource forecasting test - OK" "Success"
        } else {
            Write-ColorOutput "✗ Resource forecasting test - FAILED" "Error"
        }
        
        Write-ColorOutput "Forecasting Service tests completed" "Success"
    }
    catch {
        Write-ColorOutput "Error testing service: $($_.Exception.Message)" "Error"
        Write-Log "Error testing service: $($_.Exception.Message)" "ERROR"
    }
}

function Deploy-ForecastingService {
    Write-ColorOutput "Deploying Forecasting Service..." "Header"
    
    try {
        # Check if Docker is available
        $DockerVersion = docker --version 2>$null
        if (-not $DockerVersion) {
            throw "Docker is not installed or not in PATH"
        }
        
        # Build Docker image
        Write-ColorOutput "Building Docker image..." "Info"
        docker build -f Dockerfile.forecasting -t forecasting-service:latest .
        
        if ($LASTEXITCODE -ne 0) {
            throw "Docker build failed"
        }
        
        # Stop existing container
        $ExistingContainer = docker ps -q --filter "name=$ServiceName"
        if ($ExistingContainer) {
            Write-ColorOutput "Stopping existing container..." "Info"
            docker stop $ServiceName
            docker rm $ServiceName
        }
        
        # Run new container
        Write-ColorOutput "Starting new container..." "Info"
        docker run -d --name $ServiceName -p $ServicePort:$ServicePort forecasting-service:latest
        
        if ($LASTEXITCODE -ne 0) {
            throw "Docker run failed"
        }
        
        # Wait for service to start
        $MaxWait = 30
        $WaitCount = 0
        while (-not (Test-ServiceRunning) -and $WaitCount -lt $MaxWait) {
            Start-Sleep -Seconds 1
            $WaitCount++
        }
        
        if (Test-ServiceRunning) {
            Write-ColorOutput "Forecasting Service deployed successfully" "Success"
            Write-Log "Forecasting Service deployed successfully"
        } else {
            throw "Service failed to start after deployment"
        }
    }
    catch {
        Write-ColorOutput "Error deploying service: $($_.Exception.Message)" "Error"
        Write-Log "Error deploying service: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Configure-ForecastingService {
    Write-ColorOutput "Configuring Forecasting Service..." "Header"
    
    try {
        # Create config directory if it doesn't exist
        if (-not (Test-Path "config")) {
            New-Item -ItemType Directory -Path "config" -Force
        }
        
        # Create default configuration
        $Config = @{
            forecasting = @{
                defaultHorizon = "30d"
                minConfidence = 0.7
                maxScenarios = 10
                optimizationMethod = "genetic"
                monitoringInterval = 60000
                alertThresholds = @{
                    accuracy = 0.7
                    bias = 0.1
                    volatility = 0.3
                    confidence = 0.6
                }
            }
        }
        
        $Config | ConvertTo-Json -Depth 10 | Out-File -FilePath $ConfigPath -Encoding UTF8
        
        Write-ColorOutput "Configuration saved to $ConfigPath" "Success"
        Write-Log "Configuration saved to $ConfigPath"
    }
    catch {
        Write-ColorOutput "Error configuring service: $($_.Exception.Message)" "Error"
        Write-Log "Error configuring service: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Start-Monitoring {
    Write-ColorOutput "Starting Forecasting Monitoring..." "Header"
    
    try {
        if (-not (Test-ServiceRunning)) {
            throw "Service is not running"
        }
        
        $Response = Invoke-RestMethod -Uri "http://localhost:$ServicePort/monitor/start" -Method POST
        
        if ($Response.success) {
            Write-ColorOutput "Monitoring started successfully" "Success"
            Write-Log "Monitoring started successfully"
        } else {
            throw "Failed to start monitoring: $($Response.error)"
        }
    }
    catch {
        Write-ColorOutput "Error starting monitoring: $($_.Exception.Message)" "Error"
        Write-Log "Error starting monitoring: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Optimize-Forecast {
    param(
        [string]$ProjectId,
        [string]$Method = "genetic"
    )
    
    Write-ColorOutput "Optimizing Forecast for Project: $ProjectId..." "Header"
    
    try {
        if (-not (Test-ServiceRunning)) {
            throw "Service is not running"
        }
        
        $OptimizationData = @{
            projectId = $ProjectId
            method = $Method
            options = @{
                maxIterations = 100
                populationSize = 50
            }
        }
        
        $Response = Invoke-RestMethod -Uri "http://localhost:$ServicePort/forecast/optimize" -Method POST -Body ($OptimizationData | ConvertTo-Json) -ContentType "application/json"
        
        if ($Response.success) {
            Write-ColorOutput "Optimization completed successfully" "Success"
            Write-ColorOutput "Optimization ID: $($Response.optimizationId)" "Info"
            Write-ColorOutput "Performance Improvement: $($Response.performanceImprovement.overallImprovement * 100)%" "Info"
            Write-Log "Optimization completed for project: $ProjectId"
        } else {
            throw "Optimization failed: $($Response.error)"
        }
    }
    catch {
        Write-ColorOutput "Error optimizing forecast: $($_.Exception.Message)" "Error"
        Write-Log "Error optimizing forecast: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Validate-Forecast {
    param(
        [string]$ForecastId
    )
    
    Write-ColorOutput "Validating Forecast: $ForecastId..." "Header"
    
    try {
        if (-not (Test-ServiceRunning)) {
            throw "Service is not running"
        }
        
        $ValidationData = @{
            forecastId = $ForecastId
            options = @{
                minAccuracy = 0.8
                maxBias = 0.05
            }
        }
        
        $Response = Invoke-RestMethod -Uri "http://localhost:$ServicePort/forecast/validate" -Method POST -Body ($ValidationData | ConvertTo-Json) -ContentType "application/json"
        
        if ($Response.success) {
            Write-ColorOutput "Validation completed successfully" "Success"
            Write-ColorOutput "Validation Score: $($Response.validationScore)" "Info"
            Write-ColorOutput "Is Valid: $($Response.isValid)" "Info"
            Write-Log "Validation completed for forecast: $ForecastId"
        } else {
            throw "Validation failed: $($Response.error)"
        }
    }
    catch {
        Write-ColorOutput "Error validating forecast: $($_.Exception.Message)" "Error"
        Write-Log "Error validating forecast: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Generate-Scenarios {
    param(
        [string]$ProjectId,
        [string]$Horizon = "30d"
    )
    
    Write-ColorOutput "Generating Scenarios for Project: $ProjectId..." "Header"
    
    try {
        if (-not (Test-ServiceRunning)) {
            throw "Service is not running"
        }
        
        $ScenarioData = @{
            projectId = $ProjectId
            horizon = $Horizon
            scenarios = @(
                @{
                    name = "optimistic"
                    description = "Best case scenario"
                    assumptions = @{ growth_rate = 0.2 }
                },
                @{
                    name = "pessimistic"
                    description = "Worst case scenario"
                    assumptions = @{ growth_rate = -0.1 }
                },
                @{
                    name = "realistic"
                    description = "Most likely scenario"
                    assumptions = @{ growth_rate = 0.05 }
                }
            )
        }
        
        $Response = Invoke-RestMethod -Uri "http://localhost:$ServicePort/forecast/scenarios" -Method POST -Body ($ScenarioData | ConvertTo-Json) -ContentType "application/json"
        
        if ($Response.success) {
            Write-ColorOutput "Scenarios generated successfully" "Success"
            Write-ColorOutput "Scenario ID: $($Response.scenarioId)" "Info"
            Write-ColorOutput "Number of Scenarios: $($Response.scenarios.Count)" "Info"
            Write-Log "Scenarios generated for project: $ProjectId"
        } else {
            throw "Scenario generation failed: $($Response.error)"
        }
    }
    catch {
        Write-ColorOutput "Error generating scenarios: $($_.Exception.Message)" "Error"
        Write-Log "Error generating scenarios: $($_.Exception.Message)" "ERROR"
        throw
    }
}

# Main execution
try {
    Write-ColorOutput "ManagerAgentAI Forecasting Manager v2.4" "Header"
    Write-ColorOutput "Action: $Action" "Info"
    
    switch ($Action) {
        "start" {
            Start-ForecastingService
        }
        "stop" {
            Stop-ForecastingService
        }
        "restart" {
            Stop-ForecastingService
            Start-Sleep -Seconds 2
            Start-ForecastingService
        }
        "status" {
            Get-ServiceStatus
        }
        "logs" {
            Get-ServiceLogs
        }
        "test" {
            Test-ForecastingService
        }
        "deploy" {
            Deploy-ForecastingService
        }
        "configure" {
            Configure-ForecastingService
        }
        "monitor" {
            Start-Monitoring
        }
        "optimize" {
            if (-not $ProjectId) {
                throw "ProjectId is required for optimization"
            }
            Optimize-Forecast -ProjectId $ProjectId -Method $Method
        }
        "validate" {
            if (-not $ProjectId) {
                throw "ProjectId is required for validation"
            }
            Validate-Forecast -ForecastId $ProjectId
        }
        "scenarios" {
            if (-not $ProjectId) {
                throw "ProjectId is required for scenario generation"
            }
            Generate-Scenarios -ProjectId $ProjectId -Horizon $Horizon
        }
        default {
            throw "Unknown action: $Action"
        }
    }
    
    Write-ColorOutput "Operation completed successfully" "Success"
}
catch {
    Write-ColorOutput "Operation failed: $($_.Exception.Message)" "Error"
    Write-Log "Operation failed: $($_.Exception.Message)" "ERROR"
    exit 1
}
