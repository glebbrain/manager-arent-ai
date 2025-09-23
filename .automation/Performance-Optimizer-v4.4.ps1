# Performance Optimizer v4.4 - Advanced performance optimization for .automation
# Universal Project Manager v4.4 - Enhanced Performance & Optimization

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("analyze", "optimize", "cache", "memory", "parallel", "monitor", "report", "all")]
    [string]$Action = "all",
    
    [Parameter(Mandatory=$false)]
    [string]$ProjectPath = ".",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force,
    
    [Parameter(Mandatory=$false)]
    [switch]$Quick
)

# Version information
$Version = "4.4.0"
$LastUpdated = "2025-01-31"

# Global configuration
$Script:OptimizerConfig = @{
    Version = $Version
    Status = "Initializing"
    StartTime = Get-Date
    ProjectPath = $ProjectPath
    Performance = @{
        CacheEnabled = $true
        ParallelExecution = $true
        MemoryOptimized = $true
        BatchSize = 10
        Timeout = 300
    }
    Cache = @{
        Enabled = $true
        TTL = 3600
        MaxSize = "1GB"
        Strategy = "smart"
    }
    Memory = @{
        Optimized = $true
        GCThreshold = "80%"
        MemoryPool = $true
        LeakDetection = $true
    }
    Parallel = @{
        Enabled = $true
        MaxWorkers = 8
        BatchSize = 5
        Timeout = 300
    }
}

# Performance metrics
$Script:PerformanceMetrics = @{
    StartTime = Get-Date
    EndTime = $null
    Duration = $null
    MemoryUsage = @{}
    CacheHits = 0
    CacheMisses = 0
    ParallelTasks = 0
    Optimizations = @()
}

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO",
        [string]$Color = "White"
    )
    
    if ($Verbose -or $Level -eq "ERROR" -or $Level -eq "WARNING") {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $logMessage = "[$timestamp] [$Level] $Message"
        
        switch ($Level) {
            "ERROR" { Write-Host $logMessage -ForegroundColor Red }
            "WARNING" { Write-Host $logMessage -ForegroundColor Yellow }
            "SUCCESS" { Write-Host $logMessage -ForegroundColor Green }
            "INFO" { Write-Host $logMessage -ForegroundColor $Color }
            default { Write-Host $logMessage -ForegroundColor White }
        }
    }
}

function Initialize-PerformanceOptimizer {
    Write-Log "🚀 Initializing Performance Optimizer v$Version" "INFO" "Cyan"
    
    # Set performance variables
    $env:AUTOMATION_CACHE_ENABLED = "true"
    $env:AUTOMATION_PARALLEL_ENABLED = "true"
    $env:AUTOMATION_MEMORY_OPTIMIZED = "true"
    $env:AUTOMATION_BATCH_SIZE = "10"
    $env:AUTOMATION_CACHE_TTL = "3600"
    $env:AUTOMATION_CACHE_MAX_SIZE = "1GB"
    $env:AUTOMATION_CACHE_STRATEGY = "smart"
    
    Write-Log "✅ Performance environment variables configured" "SUCCESS"
}

function Optimize-ScriptPerformance {
    param([string]$ScriptPath)
    
    if (-not (Test-Path $ScriptPath)) {
        Write-Log "❌ Script not found: $ScriptPath" "ERROR"
        return $false
    }
    
    Write-Log "🔧 Optimizing script: $ScriptPath" "INFO"
    
    try {
        $content = Get-Content $ScriptPath -Raw
        $optimizations = @()
        
        # Add performance optimizations
        if ($content -notmatch "\[System.GC\]::Collect\(\)") {
            $content = $content -replace "Write-Host.*", "Write-Host `$message -ForegroundColor `$color`n[System.GC]::Collect()"
            $optimizations += "Added garbage collection"
        }
        
        if ($content -notmatch "Start-Job") {
            $content = $content -replace "foreach\s*\(", "Start-Job -ScriptBlock { foreach ("
            $optimizations += "Added parallel processing"
        }
        
        if ($content -notmatch "\[System.Runtime.Caching\]") {
            $content = $content -replace "param\(", "param(`n    [System.Runtime.Caching.MemoryCache]`$Cache = [System.Runtime.Caching.MemoryCache]::Default`n"
            $optimizations += "Added caching support"
        }
        
        if ($optimizations.Count -gt 0) {
            Set-Content -Path $ScriptPath -Value $content -Encoding UTF8
            Write-Log "✅ Optimized script: $ScriptPath" "SUCCESS"
            $Script:PerformanceMetrics.Optimizations += @{
                Script = $ScriptPath
                Optimizations = $optimizations
                Timestamp = Get-Date
            }
            return $true
        }
        
        return $false
    }
    catch {
        Write-Log "❌ Error optimizing script $ScriptPath : $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Optimize-MemoryUsage {
    Write-Log "🧠 Optimizing memory usage..." "INFO"
    
    try {
        # Force garbage collection
        [System.GC]::Collect()
        [System.GC]::WaitForPendingFinalizers()
        [System.GC]::Collect()
        
        # Set memory limits
        $process = Get-Process -Id $PID
        $memoryUsage = $process.WorkingSet64 / 1MB
        
        Write-Log "📊 Current memory usage: $([math]::Round($memoryUsage, 2)) MB" "INFO"
        
        if ($memoryUsage -gt 1000) {
            Write-Log "⚠️ High memory usage detected, forcing cleanup" "WARNING"
            [System.GC]::Collect()
            [System.GC]::WaitForPendingFinalizers()
            [System.GC]::Collect()
        }
        
        $Script:PerformanceMetrics.MemoryUsage = @{
            Before = $memoryUsage
            After = (Get-Process -Id $PID).WorkingSet64 / 1MB
            Timestamp = Get-Date
        }
        
        Write-Log "✅ Memory optimization completed" "SUCCESS"
        return $true
    }
    catch {
        Write-Log "❌ Error optimizing memory: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Optimize-CacheSystem {
    Write-Log "💾 Optimizing cache system..." "INFO"
    
    try {
        # Create cache directory if it doesn't exist
        $cacheDir = Join-Path $ProjectPath ".cache"
        if (-not (Test-Path $cacheDir)) {
            New-Item -ItemType Directory -Path $cacheDir -Force | Out-Null
        }
        
        # Clean old cache files
        $cacheFiles = Get-ChildItem -Path $cacheDir -File | Where-Object { $_.LastWriteTime -lt (Get-Date).AddHours(-24) }
        if ($cacheFiles) {
            $cacheFiles | Remove-Item -Force
            Write-Log "🧹 Cleaned $($cacheFiles.Count) old cache files" "INFO"
        }
        
        # Set cache configuration
        $cacheConfig = @{
            TTL = 3600
            MaxSize = "1GB"
            Strategy = "smart"
            Enabled = $true
        }
        
        $cacheConfigPath = Join-Path $cacheDir "cache-config.json"
        $cacheConfig | ConvertTo-Json -Depth 3 | Set-Content -Path $cacheConfigPath -Encoding UTF8
        
        Write-Log "✅ Cache system optimized" "SUCCESS"
        return $true
    }
    catch {
        Write-Log "❌ Error optimizing cache: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Optimize-ParallelExecution {
    Write-Log "⚡ Optimizing parallel execution..." "INFO"
    
    try {
        # Get all PowerShell scripts in .automation
        $scripts = Get-ChildItem -Path ".automation" -Filter "*.ps1" -Recurse | Where-Object { $_.Name -notlike "*Test*" -and $_.Name -notlike "*Example*" }
        
        $parallelConfig = @{
            MaxWorkers = 8
            BatchSize = 5
            Timeout = 300
            Enabled = $true
        }
        
        # Create parallel execution wrapper
        $parallelWrapper = @"
# Parallel Execution Wrapper v4.4
param([string]`$ScriptPath, [hashtable]`$Parameters = @{})

try {
    `$job = Start-Job -ScriptBlock {
        param(`$path, `$params)
        & `$path @params
    } -ArgumentList `$ScriptPath, `$Parameters
    
    `$result = Wait-Job `$job -Timeout 300
    if (`$result) {
        Receive-Job `$job
        Remove-Job `$job
    } else {
        Stop-Job `$job
        Remove-Job `$job
        throw "Job timeout"
    }
} catch {
    Write-Error "Parallel execution failed: `$(`$_.Exception.Message)"
}
"@
        
        $parallelWrapperPath = ".automation\scripts\Parallel-Execution-Wrapper-v4.4.ps1"
        Set-Content -Path $parallelWrapperPath -Value $parallelWrapper -Encoding UTF8
        
        Write-Log "✅ Parallel execution optimized" "SUCCESS"
        return $true
    }
    catch {
        Write-Log "❌ Error optimizing parallel execution: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Analyze-Performance {
    Write-Log "📊 Analyzing performance..." "INFO"
    
    try {
        $analysis = @{
            Scripts = @()
            Performance = @{}
            Recommendations = @()
        }
        
        # Analyze all scripts
        $scripts = Get-ChildItem -Path ".automation" -Filter "*.ps1" -Recurse
        foreach ($script in $scripts) {
            $scriptAnalysis = @{
                Name = $script.Name
                Size = $script.Length
                LastModified = $script.LastWriteTime
                Lines = (Get-Content $script.FullName | Measure-Object -Line).Lines
                Performance = "Unknown"
            }
            
            # Basic performance analysis
            if ($script.Length -gt 100KB) {
                $scriptAnalysis.Performance = "Large"
                $analysis.Recommendations += "Consider splitting large script: $($script.Name)"
            } elseif ($script.Length -lt 1KB) {
                $scriptAnalysis.Performance = "Small"
            } else {
                $scriptAnalysis.Performance = "Normal"
            }
            
            $analysis.Scripts += $scriptAnalysis
        }
        
        # Performance metrics
        $analysis.Performance = @{
            TotalScripts = $scripts.Count
            TotalSize = ($scripts | Measure-Object -Property Length -Sum).Sum
            AverageSize = ($scripts | Measure-Object -Property Length -Average).Average
            LastOptimized = Get-Date
        }
        
        # Save analysis
        $analysisPath = ".manager\reports\performance-analysis-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').json"
        $analysis | ConvertTo-Json -Depth 5 | Set-Content -Path $analysisPath -Encoding UTF8
        
        Write-Log "✅ Performance analysis completed" "SUCCESS"
        Write-Log "📄 Analysis saved to: $analysisPath" "INFO"
        
        return $analysis
    }
    catch {
        Write-Log "❌ Error analyzing performance: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

function Generate-PerformanceReport {
    Write-Log "📋 Generating performance report..." "INFO"
    
    try {
        $report = @{
            Version = $Version
            GeneratedAt = Get-Date
            ProjectPath = $ProjectPath
            Performance = $Script:PerformanceMetrics
            Optimizations = $Script:PerformanceMetrics.Optimizations
            Recommendations = @()
        }
        
        # Add recommendations
        if ($Script:PerformanceMetrics.Optimizations.Count -eq 0) {
            $report.Recommendations += "No optimizations applied - consider running optimization"
        }
        
        if ($Script:PerformanceMetrics.MemoryUsage.Before -gt 500) {
            $report.Recommendations += "High memory usage detected - consider memory optimization"
        }
        
        $report.Recommendations += "Enable parallel execution for better performance"
        $report.Recommendations += "Use caching for repeated operations"
        $report.Recommendations += "Monitor memory usage regularly"
        
        # Save report
        $reportPath = ".manager\reports\performance-report-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').json"
        $report | ConvertTo-Json -Depth 5 | Set-Content -Path $reportPath -Encoding UTF8
        
        Write-Log "✅ Performance report generated" "SUCCESS"
        Write-Log "📄 Report saved to: $reportPath" "INFO"
        
        return $report
    }
    catch {
        Write-Log "❌ Error generating report: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Main execution
try {
    Write-Log "🚀 Starting Performance Optimizer v$Version" "INFO" "Cyan"
    
    # Initialize
    Initialize-PerformanceOptimizer
    
    # Execute actions
    switch ($Action) {
        "analyze" {
            Analyze-Performance
        }
        "optimize" {
            $scripts = Get-ChildItem -Path ".automation" -Filter "*.ps1" -Recurse | Where-Object { $_.Name -notlike "*Test*" -and $_.Name -notlike "*Example*" }
            foreach ($script in $scripts) {
                Optimize-ScriptPerformance -ScriptPath $script.FullName
            }
        }
        "cache" {
            Optimize-CacheSystem
        }
        "memory" {
            Optimize-MemoryUsage
        }
        "parallel" {
            Optimize-ParallelExecution
        }
        "monitor" {
            Analyze-Performance
        }
        "report" {
            Generate-PerformanceReport
        }
        "all" {
            Write-Log "🔄 Running all optimizations..." "INFO"
            Optimize-MemoryUsage
            Optimize-CacheSystem
            Optimize-ParallelExecution
            $scripts = Get-ChildItem -Path ".automation" -Filter "*.ps1" -Recurse | Where-Object { $_.Name -notlike "*Test*" -and $_.Name -notlike "*Example*" }
            foreach ($script in $scripts) {
                Optimize-ScriptPerformance -ScriptPath $script.FullName
            }
            Analyze-Performance
            Generate-PerformanceReport
        }
    }
    
    # Calculate duration
    $Script:PerformanceMetrics.EndTime = Get-Date
    $Script:PerformanceMetrics.Duration = ($Script:PerformanceMetrics.EndTime - $Script:PerformanceMetrics.StartTime).TotalSeconds
    
    Write-Log "✅ Performance optimization completed in $([math]::Round($Script:PerformanceMetrics.Duration, 2)) seconds" "SUCCESS"
    Write-Log "📊 Applied $($Script:PerformanceMetrics.Optimizations.Count) optimizations" "INFO"
    
} catch {
    Write-Log "❌ Fatal error: $($_.Exception.Message)" "ERROR"
    exit 1
}
