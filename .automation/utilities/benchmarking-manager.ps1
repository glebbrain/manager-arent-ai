# ManagerAgentAI Benchmarking Manager v2.4
# PowerShell script for managing benchmarking operations

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("status", "validate", "benchmark", "get", "compare", "trends", "analytics", "recommendations", "improvement-plan", "standards", "leaderboard", "monitor", "backup", "restore", "report", "logs")]
    [string]$Action,
    
    [string]$ProjectId,
    [string]$BenchmarkType = "comprehensive",
    [string]$ComparisonTargets,
    [string]$TimeRange = "30d",
    [string]$Category,
    [string]$Metric,
    [string]$Priority,
    [string]$FocusAreas,
    [string]$Timeline = "3m",
    [string]$StartDate,
    [string]$EndDate,
    [string]$GroupBy = "day",
    [string]$BackupPath,
    [string]$InputFile,
    [switch]$IncludeHistory,
    [switch]$Verbose
)

# Configuration
$ServiceName = "benchmarking"
$ServicePort = 3014
$ServiceUrl = "http://localhost:$ServicePort"
$LogFile = "benchmarking/logs/benchmarking-manager.log"
$ConfigFile = "benchmarking/config/benchmarking.json"

# Ensure log directory exists
if (!(Test-Path "benchmarking/logs")) {
    New-Item -ItemType Directory -Path "benchmarking/logs" -Force | Out-Null
}

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry
    Add-Content -Path $LogFile -Value $logEntry
}

# Check if service is running
function Test-ServiceRunning {
    try {
        $response = Invoke-RestMethod -Uri "$ServiceUrl/health" -Method GET -TimeoutSec 5
        return $response.status -eq "healthy"
    }
    catch {
        return $false
    }
}

# Start service if not running
function Start-Service {
    if (!(Test-ServiceRunning)) {
        Write-Log "Starting $ServiceName service..."
        try {
            Set-Location "benchmarking"
            Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Hidden
            Set-Location ".."
            
            # Wait for service to start
            $timeout = 30
            $elapsed = 0
            while (!(Test-ServiceRunning) -and $elapsed -lt $timeout) {
                Start-Sleep -Seconds 2
                $elapsed += 2
            }
            
            if (Test-ServiceRunning) {
                Write-Log "$ServiceName service started successfully"
                return $true
            } else {
                Write-Log "Failed to start $ServiceName service" "ERROR"
                return $false
            }
        }
        catch {
            Write-Log "Error starting $ServiceName service: $($_.Exception.Message)" "ERROR"
            return $false
        }
    }
    return $true
}

# Get service status
function Get-ServiceStatus {
    try {
        $response = Invoke-RestMethod -Uri "$ServiceUrl/api/system/status" -Method GET
        return $response
    }
    catch {
        Write-Log "Error getting service status: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Validate configuration
function Test-Configuration {
    Write-Log "Validating $ServiceName configuration..."
    
    # Check if service is running
    if (!(Test-ServiceRunning)) {
        Write-Log "Service is not running. Starting service..." "WARN"
        if (!(Start-Service)) {
            Write-Log "Failed to start service" "ERROR"
            return $false
        }
    }
    
    # Check configuration file
    if (Test-Path $ConfigFile) {
        Write-Log "Configuration file found: $ConfigFile"
    } else {
        Write-Log "Configuration file not found: $ConfigFile" "WARN"
    }
    
    # Test API endpoints
    try {
        $healthResponse = Invoke-RestMethod -Uri "$ServiceUrl/health" -Method GET
        Write-Log "Health check passed: $($healthResponse.status)"
        
        $statusResponse = Invoke-RestMethod -Uri "$ServiceUrl/api/system/status" -Method GET
        Write-Log "System status check passed"
        
        Write-Log "Configuration validation completed successfully"
        return $true
    }
    catch {
        Write-Log "Configuration validation failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Run benchmark
function Invoke-Benchmark {
    param(
        [string]$ProjectId,
        [string]$BenchmarkType,
        [hashtable]$Metrics = @{}
    )
    
    Write-Log "Running $BenchmarkType benchmark for project $ProjectId..."
    
    try {
        $body = @{
            projectId = $ProjectId
            benchmarkType = $BenchmarkType
            metrics = $Metrics
        } | ConvertTo-Json -Depth 10
        
        $response = Invoke-RestMethod -Uri "$ServiceUrl/api/benchmarks" -Method POST -Body $body -ContentType "application/json"
        
        if ($response.success) {
            Write-Log "Benchmark completed successfully"
            Write-Log "Score: $($response.result.score)"
            Write-Log "Grade: $($response.result.grade)"
            
            if ($Verbose) {
                Write-Host "Benchmark Details:" -ForegroundColor Green
                $response.result | ConvertTo-Json -Depth 10 | Write-Host
            }
            
            return $response.result
        } else {
            Write-Log "Benchmark failed: $($response.error)" "ERROR"
            return $null
        }
    }
    catch {
        Write-Log "Error running benchmark: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Get benchmarks
function Get-Benchmarks {
    param(
        [string]$ProjectId,
        [string]$BenchmarkType,
        [bool]$IncludeHistory = $false,
        [int]$Limit = 50
    )
    
    Write-Log "Getting benchmarks for project $ProjectId..."
    
    try {
        $uri = "$ServiceUrl/api/benchmarks/$ProjectId"
        $queryParams = @()
        
        if ($BenchmarkType) { $queryParams += "benchmarkType=$BenchmarkType" }
        if ($IncludeHistory) { $queryParams += "includeHistory=true" }
        if ($Limit) { $queryParams += "limit=$Limit" }
        
        if ($queryParams.Count -gt 0) {
            $uri += "?" + ($queryParams -join "&")
        }
        
        $response = Invoke-RestMethod -Uri $uri -Method GET
        
        if ($response.success) {
            Write-Log "Retrieved $($response.benchmarks.Count) benchmarks"
            
            if ($Verbose) {
                Write-Host "Benchmarks:" -ForegroundColor Green
                $response.benchmarks | ConvertTo-Json -Depth 10 | Write-Host
            }
            
            return $response.benchmarks
        } else {
            Write-Log "Failed to get benchmarks: $($response.error)" "ERROR"
            return $null
        }
    }
    catch {
        Write-Log "Error getting benchmarks: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Compare benchmarks
function Compare-Benchmarks {
    param(
        [string]$ProjectId,
        [string]$ComparisonTargets,
        [string]$BenchmarkType = "comprehensive"
    )
    
    Write-Log "Comparing benchmarks for project $ProjectId with targets: $ComparisonTargets"
    
    try {
        $targets = $ComparisonTargets -split ","
        $comparisonTargets = @()
        
        foreach ($target in $targets) {
            if ($target -eq "industry") {
                $comparisonTargets += @{ type = "industry"; category = "general" }
            } else {
                $comparisonTargets += @{ type = "project"; projectId = $target }
            }
        }
        
        $body = @{
            projectId = $ProjectId
            comparisonTargets = $comparisonTargets
            benchmarkType = $BenchmarkType
        } | ConvertTo-Json -Depth 10
        
        $response = Invoke-RestMethod -Uri "$ServiceUrl/api/benchmarks/compare" -Method POST -Body $body -ContentType "application/json"
        
        if ($response.success) {
            Write-Log "Comparison completed successfully"
            
            if ($Verbose) {
                Write-Host "Comparison Results:" -ForegroundColor Green
                $response.result | ConvertTo-Json -Depth 10 | Write-Host
            }
            
            return $response.result
        } else {
            Write-Log "Comparison failed: $($response.error)" "ERROR"
            return $null
        }
    }
    catch {
        Write-Log "Error comparing benchmarks: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Analyze trends
function Analyze-Trends {
    param(
        [string]$ProjectId,
        [string]$TimeRange,
        [string]$BenchmarkType
    )
    
    Write-Log "Analyzing trends for project $ProjectId over $TimeRange..."
    
    try {
        $body = @{
            projectId = $ProjectId
            timeRange = $TimeRange
            benchmarkType = $BenchmarkType
        } | ConvertTo-Json -Depth 10
        
        $response = Invoke-RestMethod -Uri "$ServiceUrl/api/benchmarks/trends" -Method POST -Body $body -ContentType "application/json"
        
        if ($response.success) {
            Write-Log "Trend analysis completed successfully"
            
            if ($Verbose) {
                Write-Host "Trend Analysis:" -ForegroundColor Green
                $response.trends | ConvertTo-Json -Depth 10 | Write-Host
            }
            
            return $response.trends
        } else {
            Write-Log "Trend analysis failed: $($response.error)" "ERROR"
            return $null
        }
    }
    catch {
        Write-Log "Error analyzing trends: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Get analytics
function Get-Analytics {
    param(
        [string]$ProjectId,
        [string]$StartDate,
        [string]$EndDate,
        [string]$GroupBy
    )
    
    Write-Log "Getting analytics for project $ProjectId..."
    
    try {
        $uri = "$ServiceUrl/api/benchmarks/analytics"
        $queryParams = @()
        
        if ($ProjectId) { $queryParams += "projectId=$ProjectId" }
        if ($StartDate) { $queryParams += "startDate=$StartDate" }
        if ($EndDate) { $queryParams += "endDate=$EndDate" }
        if ($GroupBy) { $queryParams += "groupBy=$GroupBy" }
        
        if ($queryParams.Count -gt 0) {
            $uri += "?" + ($queryParams -join "&")
        }
        
        $response = Invoke-RestMethod -Uri $uri -Method GET
        
        if ($response.success) {
            Write-Log "Analytics retrieved successfully"
            
            if ($Verbose) {
                Write-Host "Analytics:" -ForegroundColor Green
                $response.analytics | ConvertTo-Json -Depth 10 | Write-Host
            }
            
            return $response.analytics
        } else {
            Write-Log "Failed to get analytics: $($response.error)" "ERROR"
            return $null
        }
    }
    catch {
        Write-Log "Error getting analytics: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Get recommendations
function Get-Recommendations {
    param(
        [string]$ProjectId,
        [string]$Category,
        [string]$Priority
    )
    
    Write-Log "Getting recommendations for project $ProjectId..."
    
    try {
        $uri = "$ServiceUrl/api/benchmarks/recommendations"
        $queryParams = @()
        
        if ($ProjectId) { $queryParams += "projectId=$ProjectId" }
        if ($Category) { $queryParams += "category=$Category" }
        if ($Priority) { $queryParams += "priority=$Priority" }
        
        if ($queryParams.Count -gt 0) {
            $uri += "?" + ($queryParams -join "&")
        }
        
        $response = Invoke-RestMethod -Uri $uri -Method GET
        
        if ($response.success) {
            Write-Log "Retrieved $($response.recommendations.Count) recommendations"
            
            if ($Verbose) {
                Write-Host "Recommendations:" -ForegroundColor Green
                $response.recommendations | ConvertTo-Json -Depth 10 | Write-Host
            }
            
            return $response.recommendations
        } else {
            Write-Log "Failed to get recommendations: $($response.error)" "ERROR"
            return $null
        }
    }
    catch {
        Write-Log "Error getting recommendations: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Generate improvement plan
function New-ImprovementPlan {
    param(
        [string]$ProjectId,
        [string]$FocusAreas,
        [string]$Timeline
    )
    
    Write-Log "Generating improvement plan for project $ProjectId..."
    
    try {
        $focusAreasArray = if ($FocusAreas) { $FocusAreas -split "," } else { @() }
        
        $body = @{
            projectId = $ProjectId
            focusAreas = $focusAreasArray
            timeline = $Timeline
        } | ConvertTo-Json -Depth 10
        
        $response = Invoke-RestMethod -Uri "$ServiceUrl/api/benchmarks/improvement-plan" -Method POST -Body $body -ContentType "application/json"
        
        if ($response.success) {
            Write-Log "Improvement plan generated successfully"
            
            if ($Verbose) {
                Write-Host "Improvement Plan:" -ForegroundColor Green
                $response.plan | ConvertTo-Json -Depth 10 | Write-Host
            }
            
            return $response.plan
        } else {
            Write-Log "Failed to generate improvement plan: $($response.error)" "ERROR"
            return $null
        }
    }
    catch {
        Write-Log "Error generating improvement plan: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Get industry standards
function Get-IndustryStandards {
    param(
        [string]$Category,
        [string]$Metric
    )
    
    Write-Log "Getting industry standards..."
    
    try {
        $uri = "$ServiceUrl/api/benchmarks/industry-standards"
        $queryParams = @()
        
        if ($Category) { $queryParams += "category=$Category" }
        if ($Metric) { $queryParams += "metric=$Metric" }
        
        if ($queryParams.Count -gt 0) {
            $uri += "?" + ($queryParams -join "&")
        }
        
        $response = Invoke-RestMethod -Uri $uri -Method GET
        
        if ($response.success) {
            Write-Log "Industry standards retrieved successfully"
            
            if ($Verbose) {
                Write-Host "Industry Standards:" -ForegroundColor Green
                $response.standards | ConvertTo-Json -Depth 10 | Write-Host
            }
            
            return $response.standards
        } else {
            Write-Log "Failed to get industry standards: $($response.error)" "ERROR"
            return $null
        }
    }
    catch {
        Write-Log "Error getting industry standards: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Get leaderboard
function Get-Leaderboard {
    param(
        [string]$Category,
        [string]$Metric,
        [string]$TimeRange
    )
    
    Write-Log "Getting leaderboard..."
    
    try {
        $uri = "$ServiceUrl/api/benchmarks/leaderboard"
        $queryParams = @()
        
        if ($Category) { $queryParams += "category=$Category" }
        if ($Metric) { $queryParams += "metric=$Metric" }
        if ($TimeRange) { $queryParams += "timeRange=$TimeRange" }
        
        if ($queryParams.Count -gt 0) {
            $uri += "?" + ($queryParams -join "&")
        }
        
        $response = Invoke-RestMethod -Uri $uri -Method GET
        
        if ($response.success) {
            Write-Log "Leaderboard retrieved successfully"
            
            if ($Verbose) {
                Write-Host "Leaderboard:" -ForegroundColor Green
                $response.leaderboard | ConvertTo-Json -Depth 10 | Write-Host
            }
            
            return $response.leaderboard
        } else {
            Write-Log "Failed to get leaderboard: $($response.error)" "ERROR"
            return $null
        }
    }
    catch {
        Write-Log "Error getting leaderboard: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Monitor system
function Start-Monitoring {
    Write-Log "Starting system monitoring..."
    
    while ($true) {
        try {
            $status = Get-ServiceStatus
            if ($status) {
                Write-Log "System Status - Running: $($status.status.isRunning), Total Benchmarks: $($status.status.totalBenchmarks), Active Projects: $($status.status.activeProjects)"
            } else {
                Write-Log "Failed to get system status" "ERROR"
            }
            
            Start-Sleep -Seconds 30
        }
        catch {
            Write-Log "Error during monitoring: $($_.Exception.Message)" "ERROR"
            Start-Sleep -Seconds 30
        }
    }
}

# Backup configuration
function Backup-Configuration {
    Write-Log "Backing up configuration..."
    
    try {
        $backupDir = "benchmarking/backups"
        if (!(Test-Path $backupDir)) {
            New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        }
        
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $backupFile = "$backupDir/benchmarking-backup-$timestamp.json"
        
        $backupData = @{
            timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            service = $ServiceName
            version = "2.4.0"
            configuration = if (Test-Path $ConfigFile) { Get-Content $ConfigFile -Raw | ConvertFrom-Json } else { @{} }
            status = Get-ServiceStatus
        }
        
        $backupData | ConvertTo-Json -Depth 10 | Out-File -FilePath $backupFile -Encoding UTF8
        
        Write-Log "Configuration backed up to: $backupFile"
        return $backupFile
    }
    catch {
        Write-Log "Error backing up configuration: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Restore configuration
function Restore-Configuration {
    param([string]$BackupPath)
    
    Write-Log "Restoring configuration from: $BackupPath"
    
    try {
        if (!(Test-Path $BackupPath)) {
            Write-Log "Backup file not found: $BackupPath" "ERROR"
            return $false
        }
        
        $backupData = Get-Content $BackupPath -Raw | ConvertFrom-Json
        
        if ($backupData.configuration) {
            $backupData.configuration | ConvertTo-Json -Depth 10 | Out-File -FilePath $ConfigFile -Encoding UTF8
            Write-Log "Configuration restored successfully"
        }
        
        Write-Log "Restore completed successfully"
        return $true
    }
    catch {
        Write-Log "Error restoring configuration: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Generate report
function New-Report {
    Write-Log "Generating comprehensive report..."
    
    try {
        $reportDir = "benchmarking/reports"
        if (!(Test-Path $reportDir)) {
            New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
        }
        
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $reportFile = "$reportDir/benchmarking-report-$timestamp.html"
        
        $status = Get-ServiceStatus
        $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>Benchmarking Report - $timestamp</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background-color: #e8f4f8; border-radius: 5px; }
        .status { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Benchmarking System Report</h1>
        <p>Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")</p>
        <p>Service: $ServiceName v2.4.0</p>
    </div>
    
    <div class="section">
        <h2>System Status</h2>
        <div class="metric">
            <strong>Status:</strong> <span class="status">$($status.status.isRunning)</span>
        </div>
        <div class="metric">
            <strong>Total Benchmarks:</strong> $($status.status.totalBenchmarks)
        </div>
        <div class="metric">
            <strong>Active Projects:</strong> $($status.status.activeProjects)
        </div>
        <div class="metric">
            <strong>Pending Benchmarks:</strong> $($status.status.pendingBenchmarks)
        </div>
        <div class="metric">
            <strong>Recommendations:</strong> $($status.status.recommendations)
        </div>
    </div>
    
    <div class="section">
        <h2>Service Information</h2>
        <p><strong>Uptime:</strong> $($status.status.uptime) seconds</p>
        <p><strong>Last Update:</strong> $($status.status.lastUpdate)</p>
    </div>
</body>
</html>
"@
        
        $html | Out-File -FilePath $reportFile -Encoding UTF8
        
        Write-Log "Report generated: $reportFile"
        return $reportFile
    }
    catch {
        Write-Log "Error generating report: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Main execution
Write-Log "ManagerAgentAI Benchmarking Manager v2.4"
Write-Log "Action: $Action"

switch ($Action) {
    "status" {
        if (Test-ServiceRunning) {
            $status = Get-ServiceStatus
            if ($status) {
                Write-Host "Service Status: Running" -ForegroundColor Green
                Write-Host "Total Benchmarks: $($status.status.totalBenchmarks)"
                Write-Host "Active Projects: $($status.status.activeProjects)"
                Write-Host "Pending Benchmarks: $($status.status.pendingBenchmarks)"
                Write-Host "Recommendations: $($status.status.recommendations)"
                Write-Host "Uptime: $($status.status.uptime) seconds"
            }
        } else {
            Write-Host "Service Status: Not Running" -ForegroundColor Red
        }
    }
    
    "validate" {
        if (Test-Configuration) {
            Write-Host "Configuration validation: PASSED" -ForegroundColor Green
        } else {
            Write-Host "Configuration validation: FAILED" -ForegroundColor Red
            exit 1
        }
    }
    
    "benchmark" {
        if (!$ProjectId) {
            Write-Log "ProjectId is required for benchmark action" "ERROR"
            exit 1
        }
        
        if (!(Start-Service)) {
            Write-Log "Failed to start service" "ERROR"
            exit 1
        }
        
        $result = Invoke-Benchmark -ProjectId $ProjectId -BenchmarkType $BenchmarkType
        if ($result) {
            Write-Host "Benchmark completed successfully" -ForegroundColor Green
        } else {
            Write-Host "Benchmark failed" -ForegroundColor Red
            exit 1
        }
    }
    
    "get" {
        if (!$ProjectId) {
            Write-Log "ProjectId is required for get action" "ERROR"
            exit 1
        }
        
        if (!(Start-Service)) {
            Write-Log "Failed to start service" "ERROR"
            exit 1
        }
        
        $result = Get-Benchmarks -ProjectId $ProjectId -BenchmarkType $BenchmarkType -IncludeHistory $IncludeHistory
        if ($result) {
            Write-Host "Benchmarks retrieved successfully" -ForegroundColor Green
        } else {
            Write-Host "Failed to retrieve benchmarks" -ForegroundColor Red
            exit 1
        }
    }
    
    "compare" {
        if (!$ProjectId -or !$ComparisonTargets) {
            Write-Log "ProjectId and ComparisonTargets are required for compare action" "ERROR"
            exit 1
        }
        
        if (!(Start-Service)) {
            Write-Log "Failed to start service" "ERROR"
            exit 1
        }
        
        $result = Compare-Benchmarks -ProjectId $ProjectId -ComparisonTargets $ComparisonTargets -BenchmarkType $BenchmarkType
        if ($result) {
            Write-Host "Comparison completed successfully" -ForegroundColor Green
        } else {
            Write-Host "Comparison failed" -ForegroundColor Red
            exit 1
        }
    }
    
    "trends" {
        if (!$ProjectId) {
            Write-Log "ProjectId is required for trends action" "ERROR"
            exit 1
        }
        
        if (!(Start-Service)) {
            Write-Log "Failed to start service" "ERROR"
            exit 1
        }
        
        $result = Analyze-Trends -ProjectId $ProjectId -TimeRange $TimeRange -BenchmarkType $BenchmarkType
        if ($result) {
            Write-Host "Trend analysis completed successfully" -ForegroundColor Green
        } else {
            Write-Host "Trend analysis failed" -ForegroundColor Red
            exit 1
        }
    }
    
    "analytics" {
        if (!(Start-Service)) {
            Write-Log "Failed to start service" "ERROR"
            exit 1
        }
        
        $result = Get-Analytics -ProjectId $ProjectId -StartDate $StartDate -EndDate $EndDate -GroupBy $GroupBy
        if ($result) {
            Write-Host "Analytics retrieved successfully" -ForegroundColor Green
        } else {
            Write-Host "Failed to retrieve analytics" -ForegroundColor Red
            exit 1
        }
    }
    
    "recommendations" {
        if (!$ProjectId) {
            Write-Log "ProjectId is required for recommendations action" "ERROR"
            exit 1
        }
        
        if (!(Start-Service)) {
            Write-Log "Failed to start service" "ERROR"
            exit 1
        }
        
        $result = Get-Recommendations -ProjectId $ProjectId -Category $Category -Priority $Priority
        if ($result) {
            Write-Host "Recommendations retrieved successfully" -ForegroundColor Green
        } else {
            Write-Host "Failed to retrieve recommendations" -ForegroundColor Red
            exit 1
        }
    }
    
    "improvement-plan" {
        if (!$ProjectId) {
            Write-Log "ProjectId is required for improvement-plan action" "ERROR"
            exit 1
        }
        
        if (!(Start-Service)) {
            Write-Log "Failed to start service" "ERROR"
            exit 1
        }
        
        $result = New-ImprovementPlan -ProjectId $ProjectId -FocusAreas $FocusAreas -Timeline $Timeline
        if ($result) {
            Write-Host "Improvement plan generated successfully" -ForegroundColor Green
        } else {
            Write-Host "Failed to generate improvement plan" -ForegroundColor Red
            exit 1
        }
    }
    
    "standards" {
        if (!(Start-Service)) {
            Write-Log "Failed to start service" "ERROR"
            exit 1
        }
        
        $result = Get-IndustryStandards -Category $Category -Metric $Metric
        if ($result) {
            Write-Host "Industry standards retrieved successfully" -ForegroundColor Green
        } else {
            Write-Host "Failed to retrieve industry standards" -ForegroundColor Red
            exit 1
        }
    }
    
    "leaderboard" {
        if (!(Start-Service)) {
            Write-Log "Failed to start service" "ERROR"
            exit 1
        }
        
        $result = Get-Leaderboard -Category $Category -Metric $Metric -TimeRange $TimeRange
        if ($result) {
            Write-Host "Leaderboard retrieved successfully" -ForegroundColor Green
        } else {
            Write-Host "Failed to retrieve leaderboard" -ForegroundColor Red
            exit 1
        }
    }
    
    "monitor" {
        Start-Monitoring
    }
    
    "backup" {
        $result = Backup-Configuration
        if ($result) {
            Write-Host "Configuration backed up successfully" -ForegroundColor Green
        } else {
            Write-Host "Backup failed" -ForegroundColor Red
            exit 1
        }
    }
    
    "restore" {
        if (!$BackupPath) {
            Write-Log "BackupPath is required for restore action" "ERROR"
            exit 1
        }
        
        $result = Restore-Configuration -BackupPath $BackupPath
        if ($result) {
            Write-Host "Configuration restored successfully" -ForegroundColor Green
        } else {
            Write-Host "Restore failed" -ForegroundColor Red
            exit 1
        }
    }
    
    "report" {
        $result = New-Report
        if ($result) {
            Write-Host "Report generated successfully: $result" -ForegroundColor Green
        } else {
            Write-Host "Report generation failed" -ForegroundColor Red
            exit 1
        }
    }
    
    "logs" {
        if (Test-Path $LogFile) {
            Get-Content $LogFile -Tail 50
        } else {
            Write-Host "Log file not found: $LogFile" -ForegroundColor Red
        }
    }
    
    default {
        Write-Log "Unknown action: $Action" "ERROR"
        Write-Host "Usage: .\benchmarking-manager.ps1 -Action <action> [parameters]"
        Write-Host "Actions: status, validate, benchmark, get, compare, trends, analytics, recommendations, improvement-plan, standards, leaderboard, monitor, backup, restore, report, logs"
        exit 1
    }
}

Write-Log "Action completed: $Action"
