# Control Files Performance Monitor
# Monitors performance and health of the control files system

param(
    [switch]$RealTime,
    [switch]$GenerateReport,
    [switch]$HealthCheck,
    [int]$Interval = 30,
    [string]$OutputFile = "control_files_performance.json"
)

Write-Host "Control Files Performance Monitor" -ForegroundColor Green
Write-Host "Monitoring LearnEnglishBot control files system performance" -ForegroundColor Cyan

# Configuration
$monitorConfig = @{
    "ProjectRoot" = Get-Location
    "ControlFilesDir" = "cursorfiles"
    "MonitoringInterval" = $Interval
    "PerformanceThreshold" = 100  # ms threshold for file operations
    "HealthThreshold" = 0.95  # 95% health threshold
}

# Performance metrics storage
$performanceMetrics = @{
    "start_time" = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "total_operations" = 0
    "file_reads" = 0
    "file_writes" = 0
    "file_searches" = 0
    "average_response_time" = 0.0
    "response_times" = @()
    "errors" = @()
    "file_access_patterns" = @{}
    "system_health" = 1.0
    "last_health_check" = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
}

# Function to check control files structure
function Test-ControlFilesStructure {
    Write-Host "`nChecking control files structure..." -ForegroundColor Yellow
    
    $structureCheck = @{
        "status" = "unknown"
        "missing_files" = @()
        "corrupted_files" = @()
        "total_files" = 0
        "health_score" = 0.0
    }
    
    # Required control files
    $requiredFiles = @(
        "control files/TODO.md",
        "control files/COMPLETED.md", 
        "control files/ERRORS.md",
        "IDEA.md",
        "start.md",
        "cursor.json"
    )
    
    # Required directories
    $requiredDirs = @(
        "control files",
        "prompts"
    )
    
    $totalFiles = 0
    $healthyFiles = 0
    
    # Check required files
    foreach ($file in $requiredFiles) {
        $filePath = Join-Path $monitorConfig.ControlFilesDir $file
        if (Test-Path $filePath) {
            try {
                $content = Get-Content $filePath -Raw -ErrorAction Stop
                if ($content.Length -gt 0) {
                    $healthyFiles++
                    Write-Host "  ✅ $file" -ForegroundColor Green
                } else {
                    $structureCheck.corrupted_files += "$file (empty)"
                    Write-Host "  ⚠️ $file (empty)" -ForegroundColor Yellow
                }
            } catch {
                $structureCheck.corrupted_files += "$file (read error)"
                Write-Host "  ❌ $file (read error)" -ForegroundColor Red
            }
            $totalFiles++
        } else {
            $structureCheck.missing_files += $file
            Write-Host "  ❌ $file (missing)" -ForegroundColor Red
        }
    }
    
    # Check required directories
    foreach ($dir in $requiredDirs) {
        $dirPath = Join-Path $monitorConfig.ControlFilesDir $dir
        if (Test-Path $dirPath) {
            $totalFiles += (Get-ChildItem $dirPath -Recurse -File).Count
            Write-Host "  ✅ Directory: $dir" -ForegroundColor Green
        } else {
            $structureCheck.missing_files += "Directory: $dir"
            Write-Host "  ❌ Directory: $dir (missing)" -ForegroundColor Red
        }
    }
    
    # Calculate health score
    $structureCheck.total_files = $totalFiles
    if ($totalFiles -gt 0) {
        $structureCheck.health_score = [math]::Round($healthyFiles / $totalFiles, 3)
    }
    
    # Determine overall status
    if ($structureCheck.health_score -ge 0.9) {
        $structureCheck.status = "healthy"
    } elseif ($structureCheck.health_score -ge 0.7) {
        $structureCheck.status = "warning"
    } else {
        $structureCheck.status = "critical"
    }
    
    return $structureCheck
}

# Function to test file read performance
function Test-FileReadPerformance {
    param([string]$FilePath)
    
    $startTime = Get-Date
    $testResult = @{
        "success" = $false
        "response_time" = 0.0
        "file_size" = 0
        "error" = $null
    }
    
    try {
        $content = Get-Content $FilePath -Raw -ErrorAction Stop
        $endTime = Get-Date
        $responseTime = ($endTime - $startTime).TotalMilliseconds
        
        $testResult.success = $true
        $testResult.response_time = $responseTime
        $testResult.file_size = $content.Length
        
        $performanceMetrics.file_reads++
        $performanceMetrics.response_times += $responseTime
        $performanceMetrics.total_operations++
        
        # Update average response time
        $performanceMetrics.average_response_time = ($performanceMetrics.response_times | Measure-Object -Average).Average
        
        return $testResult
        
    } catch {
        $testResult.error = $_.Exception.Message
        $performanceMetrics.errors += @{
            "timestamp" = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            "operation" = "file_read"
            "file" = $FilePath
            "error" = $_.Exception.Message
        }
        return $testResult
    }
}

# Function to test file search performance
function Test-FileSearchPerformance {
    param([string]$SearchPattern)
    
    $startTime = Get-Date
    $testResult = @{
        "success" = $false
        "response_time" = 0.0
        "results_count" = 0
        "error" = $null
    }
    
    try {
        $searchResults = Get-ChildItem -Path $monitorConfig.ControlFilesDir -Recurse -Filter $SearchPattern -ErrorAction Stop
        $endTime = Get-Date
        $responseTime = ($endTime - $startTime).TotalMilliseconds
        
        $testResult.success = $true
        $testResult.response_time = $responseTime
        $testResult.results_count = $searchResults.Count
        
        $performanceMetrics.file_searches++
        $performanceMetrics.response_times += $responseTime
        $performanceMetrics.total_operations++
        
        # Update average response time
        $performanceMetrics.average_response_time = ($performanceMetrics.response_times | Measure-Object -Average).Average
        
        return $testResult
        
    } catch {
        $testResult.error = $_.Exception.Message
        $performanceMetrics.errors += @{
            "timestamp" = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            "operation" = "file_search"
            "pattern" = $SearchPattern
            "error" = $_.Exception.Message
        }
        return $testResult
    }
}

# Function to check system health
function Check-SystemHealth {
    Write-Host "`nPerforming system health check..." -ForegroundColor Yellow
    
    $healthMetrics = @{
        "timestamp" = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        "overall_health" = 0.0
        "structure_health" = 0.0
        "performance_health" = 0.0
        "error_health" = 0.0
        "recommendations" = @()
    }
    
    # Check structure health
    $structureCheck = Test-ControlFilesStructure
    $healthMetrics.structure_health = $structureCheck.health_score
    
    # Check performance health
    if ($performanceMetrics.total_operations -gt 0) {
        $slowOperations = $performanceMetrics.response_times | Where-Object { $_ -gt $monitorConfig.PerformanceThreshold }
        $performanceHealth = 1.0 - ($slowOperations.Count / $performanceMetrics.total_operations)
        $healthMetrics.performance_health = [math]::Max(0.0, $performanceHealth)
    } else {
        $healthMetrics.performance_health = 1.0
    }
    
    # Check error health
    if ($performanceMetrics.total_operations -gt 0) {
        $errorHealth = 1.0 - ($performanceMetrics.errors.Count / $performanceMetrics.total_operations)
        $healthMetrics.error_health = [math]::Max(0.0, $errorHealth)
    } else {
        $healthMetrics.error_health = 1.0
    }
    
    # Calculate overall health
    $healthMetrics.overall_health = [math]::Round(($healthMetrics.structure_health + $healthMetrics.performance_health + $healthMetrics.error_health) / 3, 3)
    
    # Generate recommendations
    if ($healthMetrics.structure_health -lt 0.9) {
        $healthMetrics.recommendations += "Fix missing or corrupted control files"
    }
    if ($healthMetrics.performance_health -lt 0.8) {
        $healthMetrics.recommendations += "Optimize file operations for better performance"
    }
    if ($healthMetrics.error_health -lt 0.9) {
        $healthMetrics.recommendations += "Investigate and resolve system errors"
    }
    
    # Update global health metric
    $performanceMetrics.system_health = $healthMetrics.overall_health
    $performanceMetrics.last_health_check = $healthMetrics.timestamp
    
    return $healthMetrics
}

# Function to display performance dashboard
function Show-PerformanceDashboard {
    Clear-Host
    Write-Host "Control Files Performance Dashboard - LearnEnglishBot" -ForegroundColor Green
    Write-Host "=" * 60 -ForegroundColor Gray
    Write-Host "Last Updated: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Yellow
    Write-Host ""
    
    # Performance summary
    Write-Host "📊 Performance Summary" -ForegroundColor Cyan
    Write-Host "  Total Operations: $($performanceMetrics.total_operations)" -ForegroundColor White
    Write-Host "  File Reads: $($performanceMetrics.file_reads)" -ForegroundColor White
    Write-Host "  File Writes: $($performanceMetrics.file_writes)" -ForegroundColor White
    Write-Host "  File Searches: $($performanceMetrics.file_searches)" -ForegroundColor White
    Write-Host "  Avg Response Time: $([math]::Round($performanceMetrics.average_response_time, 2))ms" -ForegroundColor White
    Write-Host ""
    
    # System health
    Write-Host "🏥 System Health" -ForegroundColor Cyan
    $healthColor = if ($performanceMetrics.system_health -ge 0.9) { "Green" } elseif ($performanceMetrics.system_health -ge 0.7) { "Yellow" } else { "Red" }
    Write-Host "  Overall Health: $([math]::Round($performanceMetrics.system_health * 100, 1))%" -ForegroundColor $healthColor
    Write-Host "  Last Check: $($performanceMetrics.last_health_check)" -ForegroundColor White
    Write-Host ""
    
    # Recent activity
    Write-Host "🕐 Recent Activity" -ForegroundColor Cyan
    if ($performanceMetrics.response_times.Count -gt 0) {
        $recentTimes = $performanceMetrics.response_times[-5..-1]
        Write-Host "  Last 5 Response Times:" -ForegroundColor White
        foreach ($time in $recentTimes) {
            $timeColor = if ($time -le $monitorConfig.PerformanceThreshold) { "Green" } else { "Yellow" }
            Write-Host "    $([math]::Round($time, 2))ms" -ForegroundColor $timeColor
        }
    } else {
        Write-Host "  No recent activity" -ForegroundColor Gray
    }
    Write-Host ""
    
    # Errors
    if ($performanceMetrics.errors.Count -gt 0) {
        Write-Host "🚨 Recent Errors" -ForegroundColor Red
        $recentErrors = $performanceMetrics.errors[-3..-1]
        foreach ($error in $recentErrors) {
            Write-Host "  [$($error.operation)] $($error.error)" -ForegroundColor Red
        }
        Write-Host ""
    } else {
        Write-Host "✅ No recent errors" -ForegroundColor Green
        Write-Host ""
    }
    
    # Status
    Write-Host "🔧 System Status" -ForegroundColor Cyan
    $structureCheck = Test-ControlFilesStructure
    $statusColor = if ($structureCheck.status -eq "healthy") { "Green" } elseif ($structureCheck.status -eq "warning") { "Yellow" } else { "Red" }
    Write-Host "  Structure: $($structureCheck.status.ToUpper())" -ForegroundColor $statusColor
    Write-Host "  Health Score: $([math]::Round($structureCheck.health_score * 100, 1))%" -ForegroundColor White
    Write-Host "  Total Files: $($structureCheck.total_files)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Yellow
}

# Function to generate performance report
function Generate-PerformanceReport {
    $report = @{
        "timestamp" = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        "summary" = @{
            "total_operations" = $performanceMetrics.total_operations
            "file_reads" = $performanceMetrics.file_reads
            "file_writes" = $performanceMetrics.file_writes
            "file_searches" = $performanceMetrics.file_searches
            "average_response_time" = [math]::Round($performanceMetrics.average_response_time, 2)
            "system_health" = $performanceMetrics.system_health
        }
        "performance_metrics" = $performanceMetrics
        "health_check" = Check-SystemHealth
        "structure_check" = Test-ControlFilesStructure
    }
    
    return $report
}

# Main execution
Write-Host "Initializing Control Files Performance Monitor..." -ForegroundColor Yellow

# Initial health check
$initialHealth = Check-SystemHealth
Write-Host "Initial system health: $([math]::Round($initialHealth.overall_health * 100, 1))%" -ForegroundColor Green

if ($HealthCheck) {
    # Perform comprehensive health check
    Write-Host "`nPerforming comprehensive health check..." -ForegroundColor Yellow
    
    $healthReport = Check-SystemHealth
    Write-Host "`nHealth Check Results:" -ForegroundColor Green
    Write-Host "  Overall Health: $([math]::Round($healthReport.overall_health * 100, 1))%" -ForegroundColor White
    Write-Host "  Structure Health: $([math]::Round($healthReport.structure_health * 100, 1))%" -ForegroundColor White
    Write-Host "  Performance Health: $([math]::Round($healthReport.performance_health * 100, 1))%" -ForegroundColor White
    Write-Host "  Error Health: $([math]::Round($healthReport.error_health * 100, 1))%" -ForegroundColor White
    
    if ($healthReport.recommendations.Count -gt 0) {
        Write-Host "`nRecommendations:" -ForegroundColor Yellow
        foreach ($rec in $healthReport.recommendations) {
            Write-Host "  - $rec" -ForegroundColor White
        }
    }
    
} elseif ($GenerateReport) {
    # Generate performance report
    Write-Host "`nGenerating performance report..." -ForegroundColor Yellow
    
    # Run performance tests
    $testFiles = @(
        "control files/TODO.md",
        "control files/COMPLETED.md",
        "IDEA.md"
    )
    
    foreach ($testFile in $testFiles) {
        $filePath = Join-Path $monitorConfig.ControlFilesDir $testFile
        if (Test-Path $filePath) {
            Write-Host "Testing: $testFile" -ForegroundColor Cyan
            $testResult = Test-FileReadPerformance -FilePath $filePath
            
            if ($testResult.success) {
                Write-Host "  Response time: $([math]::Round($testResult.response_time, 2))ms" -ForegroundColor Green
            } else {
                Write-Host "  Error: $($testResult.error)" -ForegroundColor Red
            }
        }
    }
    
    # Test search performance
    Write-Host "`nTesting search performance..." -ForegroundColor Cyan
    $searchResult = Test-FileSearchPerformance -SearchPattern "*.md"
    if ($searchResult.success) {
        Write-Host "  Search response time: $([math]::Round($searchResult.response_time, 2))ms" -ForegroundColor Green
        Write-Host "  Results found: $($searchResult.results_count)" -ForegroundColor Green
    }
    
    $report = Generate-PerformanceReport
    $report | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputFile -Encoding UTF8
    
    Write-Host "`nPerformance report generated: $OutputFile" -ForegroundColor Green
    Write-Host "Summary:" -ForegroundColor Cyan
    Write-Host "  Total Operations: $($report.summary.total_operations)" -ForegroundColor White
    Write-Host "  Avg Response Time: $($report.summary.average_response_time)ms" -ForegroundColor White
    Write-Host "  System Health: $([math]::Round($report.summary.system_health * 100, 1))%" -ForegroundColor White
    
} elseif ($RealTime) {
    # Real-time monitoring mode
    Write-Host "Starting real-time monitoring (Press Ctrl+C to stop)..." -ForegroundColor Green
    
    try {
        while ($true) {
            Show-PerformanceDashboard
            
            # Run periodic health check
            if ($performanceMetrics.total_operations % 10 -eq 0) {
                Check-SystemHealth | Out-Null
            }
            
            Start-Sleep -Seconds $Interval
        }
    } catch {
        Write-Host "`nMonitoring stopped by user" -ForegroundColor Yellow
    }
    
} else {
    # Single test mode
    Write-Host "Running single performance test..." -ForegroundColor Yellow
    
    # Test file read performance
    $testFile = Join-Path $monitorConfig.ControlFilesDir "control files/TODO.md"
    if (Test-Path $testFile) {
        $testResult = Test-FileReadPerformance -FilePath $testFile
        
        Write-Host "`nTest Results:" -ForegroundColor Green
        Write-Host "  Success: $($testResult.success)" -ForegroundColor White
        Write-Host "  Response Time: $([math]::Round($testResult.response_time, 2))ms" -ForegroundColor White
        Write-Host "  File Size: $($testResult.file_size) characters" -ForegroundColor White
        
        if ($testResult.error) {
            Write-Host "  Error: $($testResult.error)" -ForegroundColor Red
        }
    }
    
    # Show summary
    Write-Host "`nPerformance Summary:" -ForegroundColor Cyan
    Write-Host "  Total Operations: $($performanceMetrics.total_operations)" -ForegroundColor White
    Write-Host "  Average Response Time: $([math]::Round($performanceMetrics.average_response_time, 2))ms" -ForegroundColor White
}

Write-Host "`nControl Files Performance Monitor completed" -ForegroundColor Green
