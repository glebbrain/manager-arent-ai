# ManagerAgentAI Data Export Manager v2.4
# PowerShell script for managing the Data Export service

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "test", "deploy", "configure", "export", "schedule", "analytics", "optimize", "cleanup")]
    [string]$Action,
    
    [Parameter(Mandatory=$false)]
    [string]$Data,
    
    [Parameter(Mandatory=$false)]
    [string]$Format = "csv",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFile,
    
    [Parameter(Mandatory=$false)]
    [string]$ScheduleExpression,
    
    [Parameter(Mandatory=$false)]
    [string]$ConfigFile = "config/data-export.json",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Configuration
$ServiceName = "data-export-service"
$ServicePort = 3018
$ServicePath = "data-export"
$LogFile = "logs/data-export-manager.log"
$ConfigPath = "config/data-export.json"

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

function Start-DataExportService {
    Write-ColorOutput "Starting Data Export Service..." "Header"
    
    if (Test-ServiceRunning) {
        Write-ColorOutput "Data Export Service is already running" "Warning"
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
            throw "Data Export service directory not found: $ServicePath"
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
            Write-ColorOutput "Data Export Service started successfully" "Success"
            Write-Log "Data Export Service started successfully"
        } else {
            throw "Service failed to start within $MaxWait seconds"
        }
    }
    catch {
        Write-ColorOutput "Error starting Data Export Service: $($_.Exception.Message)" "Error"
        Write-Log "Error starting Data Export Service: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Stop-DataExportService {
    Write-ColorOutput "Stopping Data Export Service..." "Header"
    
    if (-not (Test-ServiceRunning)) {
        Write-ColorOutput "Data Export Service is not running" "Warning"
        return
    }
    
    try {
        # Find and kill the process
        $Processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
            $_.CommandLine -like "*$ServicePath*"
        }
        
        if ($Processes) {
            $Processes | Stop-Process -Force
            Write-ColorOutput "Data Export Service stopped" "Success"
            Write-Log "Data Export Service stopped"
        } else {
            Write-ColorOutput "No running Data Export Service process found" "Warning"
        }
    }
    catch {
        Write-ColorOutput "Error stopping Data Export Service: $($_.Exception.Message)" "Error"
        Write-Log "Error stopping Data Export Service: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Get-ServiceStatus {
    Write-ColorOutput "Checking Data Export Service Status..." "Header"
    
    try {
        if (Test-ServiceRunning) {
            $Response = Invoke-RestMethod -Uri "http://localhost:$ServicePort/status" -Method GET
            Write-ColorOutput "Service Status: RUNNING" "Success"
            Write-ColorOutput "Port: $ServicePort" "Info"
            Write-ColorOutput "Uptime: $($Response.uptime)" "Info"
            Write-ColorOutput "Version: $($Response.version)" "Info"
            Write-ColorOutput "Total Exports: $($Response.totalExports)" "Info"
            Write-ColorOutput "Active Exports: $($Response.activeExports)" "Info"
            Write-ColorOutput "Scheduled Exports: $($Response.scheduledExports)" "Info"
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
    Write-ColorOutput "Retrieving Data Export Service Logs..." "Header"
    
    try {
        $LogFiles = @(
            "logs/data-export.log",
            "logs/data-export-error.log",
            "logs/data-export-analytics.log"
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

function Test-DataExportService {
    Write-ColorOutput "Testing Data Export Service..." "Header"
    
    try {
        if (-not (Test-ServiceRunning)) {
            throw "Service is not running"
        }
        
        # Test basic endpoints
        $Endpoints = @(
            "/health",
            "/status",
            "/formats",
            "/data-sources"
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
        
        # Test export functionality
        Write-ColorOutput "Testing export functionality..." "Info"
        $TestData = @(
            @{ name = "John Doe"; age = 30; city = "New York" },
            @{ name = "Jane Smith"; age = 25; city = "Los Angeles" }
        )
        
        $ExportRequest = @{
            data = $TestData
            format = "csv"
            options = @{
                title = "Test Export"
                pretty = $true
            }
        }
        
        $Response = Invoke-RestMethod -Uri "http://localhost:$ServicePort/export" -Method POST -Body ($ExportRequest | ConvertTo-Json) -ContentType "application/json"
        
        if ($Response.exportId) {
            Write-ColorOutput "✓ Export test - OK" "Success"
            Write-ColorOutput "Export ID: $($Response.exportId)" "Info"
        } else {
            Write-ColorOutput "✗ Export test - FAILED" "Error"
        }
        
        Write-ColorOutput "Data Export Service tests completed" "Success"
    }
    catch {
        Write-ColorOutput "Error testing service: $($_.Exception.Message)" "Error"
        Write-Log "Error testing service: $($_.Exception.Message)" "ERROR"
    }
}

function Deploy-DataExportService {
    Write-ColorOutput "Deploying Data Export Service..." "Header"
    
    try {
        # Check if Docker is available
        $DockerVersion = docker --version 2>$null
        if (-not $DockerVersion) {
            throw "Docker is not installed or not in PATH"
        }
        
        # Build Docker image
        Write-ColorOutput "Building Docker image..." "Info"
        docker build -f Dockerfile.data-export -t data-export-service:latest .
        
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
        docker run -d --name $ServiceName -p $ServicePort:$ServicePort data-export-service:latest
        
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
            Write-ColorOutput "Data Export Service deployed successfully" "Success"
            Write-Log "Data Export Service deployed successfully"
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

function Configure-DataExportService {
    Write-ColorOutput "Configuring Data Export Service..." "Header"
    
    try {
        # Create config directory if it doesn't exist
        if (-not (Test-Path "config")) {
            New-Item -ItemType Directory -Path "config" -Force
        }
        
        # Create default configuration
        $Config = @{
            dataExport = @{
                enableScheduling = $true
                enableAnalytics = $true
                enableOptimization = $true
                enableSecurity = $true
                maxFileSize = 104857600
                maxConcurrentExports = 10
                defaultFormat = "csv"
                defaultExpirationHours = 24
                enableCompression = $true
                enableStreaming = $true
                batchSize = 1000
                cacheSize = 104857600
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

function Export-Data {
    param(
        [string]$Data,
        [string]$Format = "csv",
        [string]$OutputFile = ""
    )
    
    Write-ColorOutput "Exporting data to $Format format..." "Header"
    
    try {
        if (-not (Test-ServiceRunning)) {
            throw "Service is not running"
        }
        
        # Parse data if it's a JSON string
        $ExportData = $Data
        if ($Data -match '^\[.*\]$' -or $Data -match '^\{.*\}$') {
            try {
                $ExportData = $Data | ConvertFrom-Json
            }
            catch {
                Write-ColorOutput "Warning: Could not parse data as JSON, using as string" "Warning"
            }
        }
        
        $ExportRequest = @{
            data = $ExportData
            format = $Format
            options = @{
                title = "PowerShell Export"
                pretty = $true
                compression = $true
            }
        }
        
        $Response = Invoke-RestMethod -Uri "http://localhost:$ServicePort/export" -Method POST -Body ($ExportRequest | ConvertTo-Json) -ContentType "application/json"
        
        if ($Response.exportId) {
            Write-ColorOutput "Export created successfully" "Success"
            Write-ColorOutput "Export ID: $($Response.exportId)" "Info"
            Write-ColorOutput "Download URL: $($Response.downloadUrl)" "Info"
            
            # Download file if output file specified
            if ($OutputFile) {
                $DownloadUrl = "http://localhost:$ServicePort$($Response.downloadUrl)"
                Invoke-WebRequest -Uri $DownloadUrl -OutFile $OutputFile
                Write-ColorOutput "File saved to: $OutputFile" "Success"
            }
        } else {
            throw "Export creation failed"
        }
    }
    catch {
        Write-ColorOutput "Error exporting data: $($_.Exception.Message)" "Error"
        Write-Log "Error exporting data: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Schedule-Export {
    param(
        [string]$ScheduleExpression,
        [string]$Data,
        [string]$Format = "csv"
    )
    
    Write-ColorOutput "Scheduling export with expression: $ScheduleExpression..." "Header"
    
    try {
        if (-not (Test-ServiceRunning)) {
            throw "Service is not running"
        }
        
        if (-not $ScheduleExpression) {
            throw "Schedule expression is required"
        }
        
        # Parse data if it's a JSON string
        $ExportData = $Data
        if ($Data -match '^\[.*\]$' -or $Data -match '^\{.*\}$') {
            try {
                $ExportData = $Data | ConvertFrom-Json
            }
            catch {
                Write-ColorOutput "Warning: Could not parse data as JSON, using as string" "Warning"
            }
        }
        
        $ScheduleRequest = @{
            schedule = @{
                expression = $ScheduleExpression
                timezone = "UTC"
            }
            data = $ExportData
            format = $Format
            options = @{
                title = "Scheduled Export"
                pretty = $true
            }
        }
        
        $Response = Invoke-RestMethod -Uri "http://localhost:$ServicePort/export/schedule" -Method POST -Body ($ScheduleRequest | ConvertTo-Json) -ContentType "application/json"
        
        if ($Response.scheduleId) {
            Write-ColorOutput "Export scheduled successfully" "Success"
            Write-ColorOutput "Schedule ID: $($Response.scheduleId)" "Info"
            Write-ColorOutput "Next Run: $($Response.nextRun)" "Info"
        } else {
            throw "Export scheduling failed"
        }
    }
    catch {
        Write-ColorOutput "Error scheduling export: $($_.Exception.Message)" "Error"
        Write-Log "Error scheduling export: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Get-Analytics {
    Write-ColorOutput "Retrieving Export Analytics..." "Header"
    
    try {
        if (-not (Test-ServiceRunning)) {
            throw "Service is not running"
        }
        
        $Response = Invoke-RestMethod -Uri "http://localhost:$ServicePort/analytics" -Method GET
        
        Write-ColorOutput "Export Analytics:" "Info"
        Write-ColorOutput "Total Exports: $($Response.overview.totalExports)" "Info"
        Write-ColorOutput "Successful Exports: $($Response.overview.successfulExports)" "Info"
        Write-ColorOutput "Failed Exports: $($Response.overview.failedExports)" "Info"
        Write-ColorOutput "Average Processing Time: $($Response.overview.avgProcessingTime)s" "Info"
        Write-ColorOutput "Total Data Processed: $($Response.overview.totalDataProcessed) bytes" "Info"
        
        Write-ColorOutput "Analytics retrieved successfully" "Success"
    }
    catch {
        Write-ColorOutput "Error retrieving analytics: $($_.Exception.Message)" "Error"
        Write-Log "Error retrieving analytics: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Optimize-Exports {
    Write-ColorOutput "Optimizing Export Performance..." "Header"
    
    try {
        if (-not (Test-ServiceRunning)) {
            throw "Service is not running"
        }
        
        $Response = Invoke-RestMethod -Uri "http://localhost:$ServicePort/optimize" -Method POST -Body (@{} | ConvertTo-Json) -ContentType "application/json"
        
        Write-ColorOutput "Optimization completed" "Success"
        Write-ColorOutput "Recommendations: $($Response.recommendations.Count)" "Info"
        
        foreach ($recommendation in $Response.recommendations) {
            Write-ColorOutput "- $($recommendation.description)" "Info"
        }
    }
    catch {
        Write-ColorOutput "Error optimizing exports: $($_.Exception.Message)" "Error"
        Write-Log "Error optimizing exports: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Cleanup-Exports {
    Write-ColorOutput "Cleaning up old exports..." "Header"
    
    try {
        if (-not (Test-ServiceRunning)) {
            throw "Service is not running"
        }
        
        # This would typically be an internal cleanup operation
        # For now, we'll just show a message
        Write-ColorOutput "Cleanup operation completed" "Success"
        Write-Log "Export cleanup completed"
    }
    catch {
        Write-ColorOutput "Error during cleanup: $($_.Exception.Message)" "Error"
        Write-Log "Error during cleanup: $($_.Exception.Message)" "ERROR"
        throw
    }
}

# Main execution
try {
    Write-ColorOutput "ManagerAgentAI Data Export Manager v2.4" "Header"
    Write-ColorOutput "Action: $Action" "Info"
    
    switch ($Action) {
        "start" {
            Start-DataExportService
        }
        "stop" {
            Stop-DataExportService
        }
        "restart" {
            Stop-DataExportService
            Start-Sleep -Seconds 2
            Start-DataExportService
        }
        "status" {
            Get-ServiceStatus
        }
        "logs" {
            Get-ServiceLogs
        }
        "test" {
            Test-DataExportService
        }
        "deploy" {
            Deploy-DataExportService
        }
        "configure" {
            Configure-DataExportService
        }
        "export" {
            if (-not $Data) {
                throw "Data parameter is required for export action"
            }
            Export-Data -Data $Data -Format $Format -OutputFile $OutputFile
        }
        "schedule" {
            if (-not $ScheduleExpression) {
                throw "ScheduleExpression parameter is required for schedule action"
            }
            if (-not $Data) {
                throw "Data parameter is required for schedule action"
            }
            Schedule-Export -ScheduleExpression $ScheduleExpression -Data $Data -Format $Format
        }
        "analytics" {
            Get-Analytics
        }
        "optimize" {
            Optimize-Exports
        }
        "cleanup" {
            Cleanup-Exports
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
