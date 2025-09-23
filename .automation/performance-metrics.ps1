# Universal Automation Platform - Performance Metrics PowerShell Script
# Version: 2.2 - AI Enhanced

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "status", "export", "analyze", "report")]
    [string]$Action = "start",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFile = "performance-metrics.json",
    
    [Parameter(Mandatory=$false)]
    [int]$Interval = 10,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("json", "csv", "html")]
    [string]$Format = "json",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Script configuration
$ScriptName = "Performance-Metrics"
$Version = "2.2.0"
$LogFile = "performance-metrics.log"

# Logging function
function Write-Log {
    param(
        [string]$Message,
        [ValidateSet("INFO", "WARN", "ERROR", "DEBUG")]
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    if ($Verbose -or $Level -eq "ERROR") {
        Write-Host $logEntry
    }
    
    Add-Content -Path $LogFile -Value $logEntry -ErrorAction SilentlyContinue
}

# Check if Node.js is available
function Test-NodeJS {
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Node.js version: $nodeVersion" "INFO"
            return $true
        }
    }
    catch {
        Write-Log "Node.js not found. Please install Node.js to use this script." "ERROR"
        return $false
    }
    return $false
}

# Start performance metrics collection
function Start-PerformanceMetrics {
    Write-Log "Starting Performance Metrics Collection..." "INFO"
    
    if (-not (Test-NodeJS)) {
        Write-Log "Cannot start metrics collection without Node.js" "ERROR"
        return $false
    }
    
    try {
        # Start the Node.js metrics collector in background
        $processArgs = @(
            "scripts/performance-metrics.js",
            "start"
        )
        
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = "node"
        $processInfo.Arguments = $processArgs -join " "
        $processInfo.UseShellExecute = $false
        $processInfo.RedirectStandardOutput = $true
        $processInfo.RedirectStandardError = $true
        $processInfo.CreateNoWindow = $true
        
        $process = [System.Diagnostics.Process]::Start($processInfo)
        
        # Store process ID for later reference
        $processId = $process.Id
        Set-Content -Path "performance-metrics.pid" -Value $processId
        
        Write-Log "Performance Metrics Collection started with PID: $processId" "INFO"
        Write-Log "Output file: $OutputFile" "INFO"
        Write-Log "Collection interval: $Interval seconds" "INFO"
        
        return $true
    }
    catch {
        Write-Log "Failed to start performance metrics collection: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Stop performance metrics collection
function Stop-PerformanceMetrics {
    Write-Log "Stopping Performance Metrics Collection..." "INFO"
    
    try {
        if (Test-Path "performance-metrics.pid") {
            $processId = Get-Content "performance-metrics.pid"
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            
            if ($process) {
                $process.Kill()
                Write-Log "Stopped process with PID: $processId" "INFO"
            } else {
                Write-Log "Process with PID $processId not found" "WARN"
            }
            
            Remove-Item "performance-metrics.pid" -Force -ErrorAction SilentlyContinue
        } else {
            Write-Log "No PID file found. Attempting to find and stop Node.js processes..." "WARN"
            
            # Try to find and stop Node.js processes running performance-metrics.js
            $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
                $_.CommandLine -like "*performance-metrics.js*"
            }
            
            foreach ($process in $processes) {
                $process.Kill()
                Write-Log "Stopped Node.js process with PID: $($process.Id)" "INFO"
            }
        }
        
        return $true
    }
    catch {
        Write-Log "Failed to stop performance metrics collection: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Get status of performance metrics collection
function Get-PerformanceMetricsStatus {
    Write-Log "Checking Performance Metrics Status..." "INFO"
    
    $status = @{
        Running = $false
        ProcessId = $null
        OutputFile = $OutputFile
        FileExists = Test-Path $OutputFile
        FileSize = 0
        LastModified = $null
        HistoryCount = 0
    }
    
    try {
        # Check if process is running
        if (Test-Path "performance-metrics.pid") {
            $processId = Get-Content "performance-metrics.pid"
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            
            if ($process) {
                $status.Running = $true
                $status.ProcessId = $processId
            }
        }
        
        # Check output file
        if ($status.FileExists) {
            $fileInfo = Get-Item $OutputFile
            $status.FileSize = $fileInfo.Length
            $status.LastModified = $fileInfo.LastWriteTime
            
            # Try to read and count history entries
            try {
                $content = Get-Content $OutputFile -Raw | ConvertFrom-Json
                if ($content.history) {
                    $status.HistoryCount = $content.history.Count
                }
            }
            catch {
                Write-Log "Could not parse output file: $($_.Exception.Message)" "WARN"
            }
        }
        
        # Display status
        Write-Host "`n📊 Performance Metrics Status:" -ForegroundColor Cyan
        Write-Host "Running: $($status.Running)" -ForegroundColor $(if ($status.Running) { "Green" } else { "Red" })
        Write-Host "Process ID: $($status.ProcessId)" -ForegroundColor Yellow
        Write-Host "Output File: $($status.OutputFile)" -ForegroundColor Yellow
        Write-Host "File Exists: $($status.FileExists)" -ForegroundColor $(if ($status.FileExists) { "Green" } else { "Red" })
        Write-Host "File Size: $($status.FileSize) bytes" -ForegroundColor Yellow
        Write-Host "Last Modified: $($status.LastModified)" -ForegroundColor Yellow
        Write-Host "History Entries: $($status.HistoryCount)" -ForegroundColor Yellow
        
        return $status
    }
    catch {
        Write-Log "Failed to get status: $($_.Exception.Message)" "ERROR"
        return $status
    }
}

# Export performance metrics
function Export-PerformanceMetrics {
    param(
        [string]$Format = "json"
    )
    
    Write-Log "Exporting Performance Metrics in $Format format..." "INFO"
    
    if (-not (Test-Path $OutputFile)) {
        Write-Log "Output file not found: $OutputFile" "ERROR"
        return $false
    }
    
    try {
        $content = Get-Content $OutputFile -Raw | ConvertFrom-Json
        
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $exportFile = "performance-metrics-export-$timestamp.$Format"
        
        switch ($Format.ToLower()) {
            "json" {
                $content | ConvertTo-Json -Depth 10 | Set-Content $exportFile
            }
            "csv" {
                $csvData = @()
                $csvData += "timestamp,cpu_usage,memory_usage,active_files,test_coverage"
                
                foreach ($entry in $content.history) {
                    $row = @(
                        $entry.timestamp,
                        $entry.system.cpu.usage,
                        $entry.system.memory.usage,
                        $entry.development.activeFiles,
                        $entry.development.testCoverage
                    ) -join ","
                    $csvData += $row
                }
                
                $csvData | Set-Content $exportFile
            }
            "html" {
                $html = Generate-HTMLReport -Data $content
                $html | Set-Content $exportFile
            }
            default {
                Write-Log "Unsupported format: $Format" "ERROR"
                return $false
            }
        }
        
        Write-Log "Exported metrics to: $exportFile" "INFO"
        Write-Host "📊 Metrics exported to: $exportFile" -ForegroundColor Green
        
        return $true
    }
    catch {
        Write-Log "Failed to export metrics: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Generate HTML report
function Generate-HTMLReport {
    param($Data)
    
    $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>Performance Metrics Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .metric { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .value { font-size: 24px; font-weight: bold; color: #007acc; }
        .chart { width: 100%; height: 300px; background: #f9f9f9; border: 1px solid #ddd; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f0f0f0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Performance Metrics Report</h1>
        <p>Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")</p>
        <p>Data Points: $($Data.history.Count)</p>
    </div>
    
    <div class="metric">
        <h3>Current System Status</h3>
        <p>CPU Usage: <span class="value">$($Data.current.system.cpu.usage)%</span></p>
        <p>Memory Usage: <span class="value">$($Data.current.system.memory.usage)%</span></p>
        <p>Active Files: <span class="value">$($Data.current.development.activeFiles)</span></p>
        <p>Test Coverage: <span class="value">$($Data.current.development.testCoverage)%</span></p>
    </div>
    
    <div class="metric">
        <h3>Project Information</h3>
        <p>Project Path: $($Data.current.project.path)</p>
        <p>File Count: $($Data.current.project.fileCount)</p>
        <p>Directory Count: $($Data.current.project.directoryCount)</p>
        <p>Languages: $($Data.current.project.languages | ConvertTo-Json -Compress)</p>
    </div>
    
    <div class="metric">
        <h3>Quality Metrics</h3>
        <p>Linting: $($Data.current.quality.linting)</p>
        <p>Testing: $($Data.current.quality.testing)</p>
        <p>Type Checking: $($Data.current.quality.typeChecking)</p>
        <p>Security: $($Data.current.quality.security)</p>
    </div>
    
    <div class="metric">
        <h3>Recent History (Last 10 entries)</h3>
        <table>
            <tr>
                <th>Timestamp</th>
                <th>CPU %</th>
                <th>Memory %</th>
                <th>Active Files</th>
                <th>Test Coverage %</th>
            </tr>
"@

        $recentHistory = $Data.history | Select-Object -Last 10
        foreach ($entry in $recentHistory) {
            $html += @"
            <tr>
                <td>$($entry.timestamp)</td>
                <td>$($entry.system.cpu.usage)</td>
                <td>$($entry.system.memory.usage)</td>
                <td>$($entry.development.activeFiles)</td>
                <td>$($entry.development.testCoverage)</td>
            </tr>
"@
        }
        
        $html += @"
        </table>
    </div>
</body>
</html>
"@
    
    return $html
}

# Analyze performance metrics
function Analyze-PerformanceMetrics {
    Write-Log "Analyzing Performance Metrics..." "INFO"
    
    if (-not (Test-Path $OutputFile)) {
        Write-Log "Output file not found: $OutputFile" "ERROR"
        return $false
    }
    
    try {
        $content = Get-Content $OutputFile -Raw | ConvertFrom-Json
        
        Write-Host "`n📈 Performance Analysis Report" -ForegroundColor Cyan
        Write-Host "=" * 50 -ForegroundColor Cyan
        
        # Basic statistics
        $history = $content.history
        if ($history.Count -eq 0) {
            Write-Host "No data available for analysis" -ForegroundColor Yellow
            return $true
        }
        
        # CPU Analysis
        $cpuValues = $history | ForEach-Object { $_.system.cpu.usage }
        $avgCpu = ($cpuValues | Measure-Object -Average).Average
        $maxCpu = ($cpuValues | Measure-Object -Maximum).Maximum
        $minCpu = ($cpuValues | Measure-Object -Minimum).Minimum
        
        Write-Host "`n🖥️ CPU Usage Analysis:" -ForegroundColor Yellow
        Write-Host "Average: $([math]::Round($avgCpu, 2))%" -ForegroundColor White
        Write-Host "Maximum: $maxCpu%" -ForegroundColor White
        Write-Host "Minimum: $minCpu%" -ForegroundColor White
        
        # Memory Analysis
        $memoryValues = $history | ForEach-Object { $_.system.memory.usage }
        $avgMemory = ($memoryValues | Measure-Object -Average).Average
        $maxMemory = ($memoryValues | Measure-Object -Maximum).Maximum
        $minMemory = ($memoryValues | Measure-Object -Minimum).Minimum
        
        Write-Host "`n💾 Memory Usage Analysis:" -ForegroundColor Yellow
        Write-Host "Average: $([math]::Round($avgMemory, 2))%" -ForegroundColor White
        Write-Host "Maximum: $maxMemory%" -ForegroundColor White
        Write-Host "Minimum: $minMemory%" -ForegroundColor White
        
        # Development Activity Analysis
        $activeFilesValues = $history | ForEach-Object { $_.development.activeFiles }
        $avgActiveFiles = ($activeFilesValues | Measure-Object -Average).Average
        $maxActiveFiles = ($activeFilesValues | Measure-Object -Maximum).Maximum
        
        Write-Host "`n📁 Development Activity Analysis:" -ForegroundColor Yellow
        Write-Host "Average Active Files: $([math]::Round($avgActiveFiles, 2))" -ForegroundColor White
        Write-Host "Maximum Active Files: $maxActiveFiles" -ForegroundColor White
        
        # Test Coverage Analysis
        $testCoverageValues = $history | ForEach-Object { $_.development.testCoverage }
        $avgTestCoverage = ($testCoverageValues | Measure-Object -Average).Average
        $maxTestCoverage = ($testCoverageValues | Measure-Object -Maximum).Maximum
        
        Write-Host "`n🧪 Test Coverage Analysis:" -ForegroundColor Yellow
        Write-Host "Average: $([math]::Round($avgTestCoverage, 2))%" -ForegroundColor White
        Write-Host "Maximum: $maxTestCoverage%" -ForegroundColor White
        
        # Recommendations
        Write-Host "`n💡 Recommendations:" -ForegroundColor Green
        if ($avgCpu -gt 70) {
            Write-Host "⚠️ High CPU usage detected. Consider optimizing code or upgrading hardware." -ForegroundColor Yellow
        }
        if ($avgMemory -gt 80) {
            Write-Host "⚠️ High memory usage detected. Consider memory optimization." -ForegroundColor Yellow
        }
        if ($avgTestCoverage -lt 50) {
            Write-Host "⚠️ Low test coverage. Consider adding more tests." -ForegroundColor Yellow
        }
        if ($avgActiveFiles -lt 5) {
            Write-Host "ℹ️ Low development activity. Consider more frequent commits." -ForegroundColor Blue
        }
        
        return $true
    }
    catch {
        Write-Log "Failed to analyze metrics: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Generate comprehensive report
function Generate-PerformanceReport {
    Write-Log "Generating Comprehensive Performance Report..." "INFO"
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $reportFile = "performance-report-$timestamp.html"
    
    try {
        # Export data first
        Export-PerformanceMetrics -Format "json"
        
        # Generate HTML report
        if (Test-Path $OutputFile) {
            $content = Get-Content $OutputFile -Raw | ConvertFrom-Json
            $html = Generate-HTMLReport -Data $content
            $html | Set-Content $reportFile
            
            Write-Log "Performance report generated: $reportFile" "INFO"
            Write-Host "📊 Performance report generated: $reportFile" -ForegroundColor Green
            
            # Try to open the report
            try {
                Start-Process $reportFile
            }
            catch {
                Write-Log "Could not open report automatically: $($_.Exception.Message)" "WARN"
            }
        }
        
        return $true
    }
    catch {
        Write-Log "Failed to generate report: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Main execution
Write-Log "Starting $ScriptName v$Version" "INFO"

switch ($Action.ToLower()) {
    "start" {
        if (Start-PerformanceMetrics) {
            Write-Host "✅ Performance metrics collection started successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to start performance metrics collection" -ForegroundColor Red
            exit 1
        }
    }
    "stop" {
        if (Stop-PerformanceMetrics) {
            Write-Host "✅ Performance metrics collection stopped successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to stop performance metrics collection" -ForegroundColor Red
            exit 1
        }
    }
    "status" {
        Get-PerformanceMetricsStatus
    }
    "export" {
        if (Export-PerformanceMetrics -Format $Format) {
            Write-Host "✅ Metrics exported successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to export metrics" -ForegroundColor Red
            exit 1
        }
    }
    "analyze" {
        if (Analyze-PerformanceMetrics) {
            Write-Host "✅ Analysis completed successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to analyze metrics" -ForegroundColor Red
            exit 1
        }
    }
    "report" {
        if (Generate-PerformanceReport) {
            Write-Host "✅ Report generated successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to generate report" -ForegroundColor Red
            exit 1
        }
    }
    default {
        Write-Host "Usage: .\performance-metrics.ps1 -Action [start|stop|status|export|analyze|report]" -ForegroundColor Yellow
        Write-Host "`nAvailable actions:" -ForegroundColor Cyan
        Write-Host "  start   - Start performance metrics collection" -ForegroundColor White
        Write-Host "  stop    - Stop performance metrics collection" -ForegroundColor White
        Write-Host "  status  - Show current status" -ForegroundColor White
        Write-Host "  export  - Export metrics to file" -ForegroundColor White
        Write-Host "  analyze - Analyze collected metrics" -ForegroundColor White
        Write-Host "  report  - Generate comprehensive HTML report" -ForegroundColor White
        Write-Host "`nExamples:" -ForegroundColor Cyan
        Write-Host "  .\performance-metrics.ps1 -Action start" -ForegroundColor White
        Write-Host "  .\performance-metrics.ps1 -Action export -Format csv" -ForegroundColor White
        Write-Host "  .\performance-metrics.ps1 -Action analyze -Verbose" -ForegroundColor White
    }
}

Write-Log "Script execution completed" "INFO"
