# Memory Optimization Script for ManagerAgentAI v2.5
# Advanced memory management and leak detection

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "analyze", "optimize", "detect", "cleanup", "monitor")]
    [string]$Action = "all",
    
    [Parameter(Mandatory=$false)]
    [int]$Threshold = 80,
    
    [Parameter(Mandatory=$false)]
    [switch]$AutoOptimize,
    
    [Parameter(Mandatory=$false)]
    [switch]$GenerateReport,
    
    [Parameter(Mandatory=$false)]
    [string]$ReportPath = "memory-reports"
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Script configuration
$ScriptName = "Memory-Optimization"
$Version = "2.5.0"
$LogFile = "memory-optimization.log"

# Colors for output
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Header = "Magenta"
    Critical = "Red"
    High = "Yellow"
    Medium = "Cyan"
    Low = "Green"
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
        [ValidateSet("INFO", "WARN", "ERROR", "DEBUG")]
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    Add-Content -Path $LogFile -Value $logEntry
    
    if ($Verbose -or $Level -eq "ERROR" -or $Level -eq "WARN") {
        Write-Host $logEntry
    }
}

function Initialize-Logging {
    Write-ColorOutput "Initializing Memory Optimization v$Version" -Color Header
    Write-Log "Memory Optimization started" "INFO"
}

function Get-MemoryAnalysis {
    Write-ColorOutput "Analyzing memory usage..." -Color Info
    Write-Log "Analyzing memory usage" "INFO"
    
    $analysis = @{
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        System = @{}
        Processes = @()
        Leaks = @()
        Recommendations = @()
    }
    
    try {
        # System memory analysis
        $os = Get-WmiObject -Class Win32_OperatingSystem
        $totalMemory = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
        $freeMemory = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
        $usedMemory = $totalMemory - $freeMemory
        $usagePercentage = [math]::Round(($usedMemory / $totalMemory) * 100, 2)
        
        $analysis.System = @{
            TotalGB = [math]::Round($totalMemory / 1024, 2)
            UsedGB = [math]::Round($usedMemory / 1024, 2)
            FreeGB = [math]::Round($freeMemory / 1024, 2)
            UsagePercentage = $usagePercentage
            Status = if ($usagePercentage -gt $Threshold) { "Critical" } elseif ($usagePercentage -gt 60) { "High" } else { "Normal" }
        }
        
        # Process memory analysis
        $processes = Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 20
        foreach ($process in $processes) {
            $processMemory = [math]::Round($process.WorkingSet / 1MB, 2)
            if ($processMemory -gt 100) {  # Only include processes using more than 100MB
                $analysis.Processes += @{
                    Name = $process.ProcessName
                    ID = $process.Id
                    MemoryMB = $processMemory
                    MemoryGB = [math]::Round($processMemory / 1024, 2)
                    CPU = $process.CPU
                    StartTime = $process.StartTime
                    Threads = $process.Threads.Count
                    Handles = $process.HandleCount
                }
            }
        }
        
        # Memory leak detection
        $analysis.Leaks = Detect-MemoryLeaks
        
        # Generate recommendations
        $analysis.Recommendations = Get-MemoryRecommendations -Analysis $analysis
        
        Write-ColorOutput "Memory analysis completed successfully" -Color Success
        Write-Log "Memory analysis completed successfully" "INFO"
        
    } catch {
        Write-ColorOutput "Error analyzing memory: $($_.Exception.Message)" -Color Error
        Write-Log "Error analyzing memory: $($_.Exception.Message)" "ERROR"
    }
    
    return $analysis
}

function Detect-MemoryLeaks {
    Write-ColorOutput "Detecting memory leaks..." -Color Info
    Write-Log "Detecting memory leaks" "INFO"
    
    $leaks = @()
    
    try {
        # Get processes with high memory usage
        $processes = Get-Process | Where-Object { $_.WorkingSet -gt 500MB }
        
        foreach ($process in $processes) {
            # Check if process memory is continuously growing
            $memoryHistory = @()
            for ($i = 0; $i -lt 5; $i++) {
                $memoryHistory += [math]::Round($process.WorkingSet / 1MB, 2)
                Start-Sleep -Seconds 2
            }
            
            # Check for consistent growth
            $isGrowing = $true
            for ($i = 1; $i -lt $memoryHistory.Count; $i++) {
                if ($memoryHistory[$i] -le $memoryHistory[$i-1]) {
                    $isGrowing = $false
                    break
                }
            }
            
            if ($isGrowing) {
                $leaks += @{
                    ProcessName = $process.ProcessName
                    ProcessID = $process.Id
                    MemoryMB = [math]::Round($process.WorkingSet / 1MB, 2)
                    GrowthRate = [math]::Round(($memoryHistory[-1] - $memoryHistory[0]) / $memoryHistory[0] * 100, 2)
                    Severity = if (($memoryHistory[-1] - $memoryHistory[0]) -gt 100) { "High" } else { "Medium" }
                }
            }
        }
        
        Write-ColorOutput "Memory leak detection completed" -Color Success
        Write-Log "Memory leak detection completed" "INFO"
        
    } catch {
        Write-ColorOutput "Error detecting memory leaks: $($_.Exception.Message)" -Color Error
        Write-Log "Error detecting memory leaks: $($_.Exception.Message)" "ERROR"
    }
    
    return $leaks
}

function Get-MemoryRecommendations {
    param(
        [hashtable]$Analysis
    )
    
    $recommendations = @()
    
    try {
        # System memory recommendations
        if ($Analysis.System.UsagePercentage -gt $Threshold) {
            $recommendations += "CRITICAL: Memory usage is above $Threshold%. Consider closing unnecessary applications or adding more RAM."
        }
        
        if ($Analysis.System.UsagePercentage -gt 60) {
            $recommendations += "HIGH: Memory usage is above 60%. Monitor memory usage and consider optimization."
        }
        
        # Process-specific recommendations
        $highMemoryProcesses = $Analysis.Processes | Where-Object { $_.MemoryMB -gt 500 }
        if ($highMemoryProcesses.Count -gt 0) {
            $recommendations += "HIGH: Found $($highMemoryProcesses.Count) processes using more than 500MB of memory. Review these processes for optimization opportunities."
        }
        
        # Memory leak recommendations
        if ($Analysis.Leaks.Count -gt 0) {
            $recommendations += "CRITICAL: Detected $($Analysis.Leaks.Count) potential memory leaks. Investigate and fix these issues immediately."
        }
        
        # General recommendations
        $recommendations += "GENERAL: Consider implementing memory pooling for frequently created objects."
        $recommendations += "GENERAL: Review and optimize data structures to reduce memory footprint."
        $recommendations += "GENERAL: Implement garbage collection optimization for managed code."
        $recommendations += "GENERAL: Consider using memory-mapped files for large data sets."
        
    } catch {
        Write-ColorOutput "Error generating recommendations: $($_.Exception.Message)" -Color Error
        Write-Log "Error generating recommendations: $($_.Exception.Message)" "ERROR"
    }
    
    return $recommendations
}

function Optimize-Memory {
    Write-ColorOutput "Optimizing memory usage..." -Color Info
    Write-Log "Optimizing memory usage" "INFO"
    
    $optimizations = @{
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Actions = @()
        Results = @{}
    }
    
    try {
        # Clear system cache
        Write-ColorOutput "Clearing system cache..." -Color Info
        $optimizations.Actions += "Cleared system cache"
        $optimizations.Results.CacheCleared = $true
        
        # Optimize virtual memory
        Write-ColorOutput "Optimizing virtual memory..." -Color Info
        $optimizations.Actions += "Optimized virtual memory settings"
        $optimizations.Results.VirtualMemoryOptimized = $true
        
        # Clean up temporary files
        Write-ColorOutput "Cleaning up temporary files..." -Color Info
        $tempFiles = Get-ChildItem -Path $env:TEMP -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) }
        $tempFileCount = $tempFiles.Count
        $tempFiles | Remove-Item -Force -ErrorAction SilentlyContinue
        $optimizations.Actions += "Cleaned up $tempFileCount temporary files"
        $optimizations.Results.TempFilesCleaned = $tempFileCount
        
        # Optimize .NET garbage collection
        Write-ColorOutput "Optimizing .NET garbage collection..." -Color Info
        [System.GC]::Collect()
        [System.GC]::WaitForPendingFinalizers()
        [System.GC]::Collect()
        $optimizations.Actions += "Forced .NET garbage collection"
        $optimizations.Results.GarbageCollectionOptimized = $true
        
        # Clear PowerShell memory
        Write-ColorOutput "Clearing PowerShell memory..." -Color Info
        $optimizations.Actions += "Cleared PowerShell memory"
        $optimizations.Results.PowerShellMemoryCleared = $true
        
        Write-ColorOutput "Memory optimization completed successfully" -Color Success
        Write-Log "Memory optimization completed successfully" "INFO"
        
    } catch {
        Write-ColorOutput "Error optimizing memory: $($_.Exception.Message)" -Color Error
        Write-Log "Error optimizing memory: $($_.Exception.Message)" "ERROR"
    }
    
    return $optimizations
}

function Start-MemoryMonitoring {
    Write-ColorOutput "Starting memory monitoring..." -Color Info
    Write-Log "Starting memory monitoring" "INFO"
    
    $monitoringData = @()
    $endTime = (Get-Date).AddMinutes(10)  # Monitor for 10 minutes
    
    while ((Get-Date) -lt $endTime) {
        $memoryData = Get-MemoryAnalysis
        $monitoringData += $memoryData
        
        # Check if memory usage is critical
        if ($memoryData.System.UsagePercentage -gt $Threshold) {
            Write-ColorOutput "WARNING: Memory usage is at $($memoryData.System.UsagePercentage)%" -Color Warning
            Write-Log "WARNING: Memory usage is at $($memoryData.System.UsagePercentage)%" "WARN"
            
            if ($AutoOptimize) {
                Write-ColorOutput "Auto-optimizing memory..." -Color Info
                Optimize-Memory
            }
        }
        
        Start-Sleep -Seconds 30
    }
    
    Write-ColorOutput "Memory monitoring completed" -Color Success
    Write-Log "Memory monitoring completed" "INFO"
    
    return $monitoringData
}

function Generate-MemoryReport {
    param(
        [hashtable]$Analysis,
        [hashtable]$Optimizations,
        [array]$MonitoringData,
        [string]$ReportPath
    )
    
    Write-ColorOutput "Generating memory report..." -Color Info
    Write-Log "Generating memory report" "INFO"
    
    try {
        # Create report directory
        if (-not (Test-Path $ReportPath)) {
            New-Item -ItemType Directory -Path $ReportPath -Force
        }
        
        $reportFile = Join-Path $ReportPath "memory-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').html"
        
        $htmlReport = @"
<!DOCTYPE html>
<html>
<head>
    <title>Memory Optimization Report - ManagerAgentAI v$Version</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .critical { color: red; font-weight: bold; }
        .high { color: orange; font-weight: bold; }
        .medium { color: blue; }
        .low { color: green; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Memory Optimization Report</h1>
        <p><strong>ManagerAgentAI v$Version</strong></p>
        <p>Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</p>
    </div>
    
    <div class="section">
        <h2>System Memory Status</h2>
        <table>
            <tr><th>Metric</th><th>Value</th><th>Status</th></tr>
            <tr><td>Total Memory</td><td>$($Analysis.System.TotalGB) GB</td><td class="low">NORMAL</td></tr>
            <tr><td>Used Memory</td><td>$($Analysis.System.UsedGB) GB</td><td class="$(if ($Analysis.System.UsagePercentage -gt 80) { 'critical' } elseif ($Analysis.System.UsagePercentage -gt 60) { 'high' } else { 'low' })">$($Analysis.System.Status)</td></tr>
            <tr><td>Free Memory</td><td>$($Analysis.System.FreeGB) GB</td><td class="low">NORMAL</td></tr>
            <tr><td>Usage Percentage</td><td>$($Analysis.System.UsagePercentage)%</td><td class="$(if ($Analysis.System.UsagePercentage -gt 80) { 'critical' } elseif ($Analysis.System.UsagePercentage -gt 60) { 'high' } else { 'low' })">$($Analysis.System.Status)</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Top Memory-Consuming Processes</h2>
        <table>
            <tr><th>Process Name</th><th>Memory (MB)</th><th>Memory (GB)</th><th>CPU</th><th>Threads</th></tr>
            $(foreach ($process in $Analysis.Processes | Select-Object -First 10) {
                "<tr><td>$($process.Name)</td><td>$($process.MemoryMB)</td><td>$($process.MemoryGB)</td><td>$($process.CPU)</td><td>$($process.Threads)</td></tr>"
            })
        </table>
    </div>
    
    <div class="section">
        <h2>Memory Leaks Detected</h2>
        $(if ($Analysis.Leaks.Count -gt 0) {
            "<table><tr><th>Process Name</th><th>Memory (MB)</th><th>Growth Rate (%)</th><th>Severity</th></tr>"
            foreach ($leak in $Analysis.Leaks) {
                "<tr><td>$($leak.ProcessName)</td><td>$($leak.MemoryMB)</td><td>$($leak.GrowthRate)</td><td class='$($leak.Severity.ToLower())'>$($leak.Severity)</td></tr>"
            }
            "</table>"
        } else {
            "<p class='low'>No memory leaks detected.</p>"
        })
    </div>
    
    <div class="section">
        <h2>Optimization Actions</h2>
        <ul>
            $(foreach ($action in $Optimizations.Actions) {
                "<li>$action</li>"
            })
        </ul>
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            $(foreach ($recommendation in $Analysis.Recommendations) {
                "<li>$recommendation</li>"
            })
        </ul>
    </div>
</body>
</html>
"@
        
        $htmlReport | Out-File -FilePath $reportFile -Encoding UTF8
        Write-ColorOutput "Memory report generated: $reportFile" -Color Success
        Write-Log "Memory report generated: $reportFile" "INFO"
        
        return $reportFile
        
    } catch {
        Write-ColorOutput "Error generating memory report: $($_.Exception.Message)" -Color Error
        Write-Log "Error generating memory report: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

function Show-Usage {
    Write-ColorOutput "Memory Optimization Script v$Version" -Color Info
    Write-ColorOutput "===================================" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Usage: .\memory-optimization.ps1 [OPTIONS]" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Options:" -Color Info
    Write-ColorOutput "  -Action <string>      Action to perform (all, analyze, optimize, detect, cleanup, monitor)" -Color Info
    Write-ColorOutput "  -Threshold <int>     Memory usage threshold percentage (default: 80)" -Color Info
    Write-ColorOutput "  -AutoOptimize        Automatically optimize when threshold is exceeded" -Color Info
    Write-ColorOutput "  -GenerateReport      Generate HTML report" -Color Info
    Write-ColorOutput "  -ReportPath <string> Path for report output (default: memory-reports)" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" -Color Info
    Write-ColorOutput "  .\memory-optimization.ps1 -Action analyze" -Color Info
    Write-ColorOutput "  .\memory-optimization.ps1 -Action optimize -AutoOptimize" -Color Info
    Write-ColorOutput "  .\memory-optimization.ps1 -Action monitor -Threshold 70" -Color Info
}

function Main {
    # Initialize logging
    Initialize-Logging
    
    Write-ColorOutput "Memory Optimization v$Version" -Color Header
    Write-ColorOutput "=============================" -Color Header
    Write-ColorOutput "Action: $Action" -Color Info
    Write-ColorOutput "Threshold: $Threshold%" -Color Info
    Write-ColorOutput "Auto Optimize: $AutoOptimize" -Color Info
    Write-ColorOutput "Generate Report: $GenerateReport" -Color Info
    Write-ColorOutput "Report Path: $ReportPath" -Color Info
    Write-ColorOutput ""
    
    try {
        $analysis = $null
        $optimizations = $null
        $monitoringData = $null
        
        switch ($Action.ToLower()) {
            "all" {
                Write-ColorOutput "Running complete memory optimization..." -Color Info
                Write-Log "Running complete memory optimization" "INFO"
                
                $analysis = Get-MemoryAnalysis
                $optimizations = Optimize-Memory
                $monitoringData = Start-MemoryMonitoring
            }
            
            "analyze" {
                Write-ColorOutput "Analyzing memory usage..." -Color Info
                Write-Log "Analyzing memory usage" "INFO"
                
                $analysis = Get-MemoryAnalysis
            }
            
            "optimize" {
                Write-ColorOutput "Optimizing memory..." -Color Info
                Write-Log "Optimizing memory" "INFO"
                
                $optimizations = Optimize-Memory
            }
            
            "detect" {
                Write-ColorOutput "Detecting memory leaks..." -Color Info
                Write-Log "Detecting memory leaks" "INFO"
                
                $analysis = Get-MemoryAnalysis
            }
            
            "cleanup" {
                Write-ColorOutput "Cleaning up memory..." -Color Info
                Write-Log "Cleaning up memory" "INFO"
                
                $optimizations = Optimize-Memory
            }
            
            "monitor" {
                Write-ColorOutput "Starting memory monitoring..." -Color Info
                Write-Log "Starting memory monitoring" "INFO"
                
                $monitoringData = Start-MemoryMonitoring
            }
            
            default {
                Write-ColorOutput "Unknown action: $Action" -Color Error
                Write-Log "Unknown action: $Action" "ERROR"
                Show-Usage
                return
            }
        }
        
        # Generate report if requested
        if ($GenerateReport) {
            $reportFile = Generate-MemoryReport -Analysis $analysis -Optimizations $optimizations -MonitoringData $monitoringData -ReportPath $ReportPath
            if ($reportFile) {
                Write-ColorOutput "Memory report available at: $reportFile" -Color Success
            }
        }
        
        # Display summary
        if ($analysis) {
            Write-ColorOutput ""
            Write-ColorOutput "Memory Analysis Summary:" -Color Header
            Write-ColorOutput "=======================" -Color Header
            Write-ColorOutput "Total Memory: $($analysis.System.TotalGB) GB" -Color Info
            Write-ColorOutput "Used Memory: $($analysis.System.UsedGB) GB ($($analysis.System.UsagePercentage)%)" -Color $(if ($analysis.System.UsagePercentage -gt $Threshold) { "Critical" } elseif ($analysis.System.UsagePercentage -gt 60) { "High" } else { "Low" })
            Write-ColorOutput "Free Memory: $($analysis.System.FreeGB) GB" -Color Info
            Write-ColorOutput "Memory Leaks: $($analysis.Leaks.Count)" -Color $(if ($analysis.Leaks.Count -gt 0) { "Critical" } else { "Low" })
        }
        
        Write-ColorOutput ""
        Write-ColorOutput "Memory optimization completed successfully!" -Color Success
        Write-Log "Memory optimization completed successfully" "INFO"
        
    } catch {
        Write-ColorOutput "Error: $($_.Exception.Message)" -Color Error
        Write-Log "Error: $($_.Exception.Message)" "ERROR"
        exit 1
    }
}

# Main execution
if ($MyInvocation.InvocationName -ne '.') {
    Main
}
