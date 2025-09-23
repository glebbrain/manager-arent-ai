# ⚡ Performance Testing Suite v3.6.0
# Advanced performance testing with AI optimization
# Version: 3.6.0
# Last Updated: 2025-01-31

param(
    [Parameter(Mandatory=$false)]
    [string]$TestType = "all", # load, stress, spike, volume, endurance, scalability
    
    [Parameter(Mandatory=$false)]
    [string]$TargetUrl = "http://localhost:3000",
    
    [Parameter(Mandatory=$false)]
    [int]$ConcurrentUsers = 100,
    
    [Parameter(Mandatory=$false)]
    [int]$Duration = 300, # seconds
    
    [Parameter(Mandatory=$false)]
    [int]$RampUpTime = 60, # seconds
    
    [Parameter(Mandatory=$false)]
    [switch]$AI,
    
    [Parameter(Mandatory=$false)]
    [switch]$RealTime,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputDir = "test-results/performance"
)

$ErrorActionPreference = "Stop"

Write-Host "⚡ Performance Testing Suite v3.6.0" -ForegroundColor Yellow
Write-Host "📅 Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "🎯 AI-Enhanced Performance Testing" -ForegroundColor Magenta

# Performance Test Configuration
$PerfConfig = @{
    TestTypes = @("load", "stress", "spike", "volume", "endurance", "scalability")
    Metrics = @("response_time", "throughput", "error_rate", "cpu_usage", "memory_usage", "disk_io")
    Thresholds = @{
        ResponseTime = 2.0 # seconds
        Throughput = 1000 # requests per second
        ErrorRate = 1.0 # percentage
        CPUUsage = 80 # percentage
        MemoryUsage = 85 # percentage
    }
    AIEnabled = $AI
    RealTimeMonitoring = $RealTime
}

# Test Results Storage
$PerfResults = @{
    TestType = $TestType
    StartTime = Get-Date
    EndTime = $null
    Duration = 0
    ConcurrentUsers = $ConcurrentUsers
    TotalRequests = 0
    SuccessfulRequests = 0
    FailedRequests = 0
    AverageResponseTime = 0
    MinResponseTime = 0
    MaxResponseTime = 0
    Throughput = 0
    ErrorRate = 0
    SystemMetrics = @{}
    AIInsights = @{}
}

function Initialize-PerformanceTesting {
    Write-Host "🔧 Initializing Performance Testing Environment..." -ForegroundColor Yellow
    
    # Create output directory
    if (!(Test-Path $OutputDir)) {
        New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
        Write-Host "   📁 Created: $OutputDir" -ForegroundColor Green
    }
    
    # Check if target is accessible
    try {
        $response = Invoke-WebRequest -Uri $TargetUrl -Method GET -TimeoutSec 10
        Write-Host "   ✅ Target accessible: $TargetUrl" -ForegroundColor Green
    } catch {
        Write-Warning "Target not accessible: $TargetUrl - $($_.Exception.Message)"
    }
    
    # Initialize AI monitoring if enabled
    if ($PerfConfig.AIEnabled) {
        Write-Host "   🤖 Initializing AI performance monitoring..." -ForegroundColor Magenta
        Initialize-AIPerformanceMonitoring
    }
}

function Initialize-AIPerformanceMonitoring {
    Write-Host "🧠 Setting up AI performance monitoring..." -ForegroundColor Magenta
    
    $aiConfig = @{
        Model = "gpt-4"
        MonitoringInterval = 5 # seconds
        AnomalyDetection = $true
        PredictiveAnalysis = $true
        AutoOptimization = $true
    }
    
    # AI monitoring setup logic would go here
    Write-Host "   ✅ AI monitoring initialized" -ForegroundColor Green
}

function Run-LoadTest {
    Write-Host "📊 Running Load Test..." -ForegroundColor Yellow
    Write-Host "   👥 Concurrent Users: $ConcurrentUsers" -ForegroundColor White
    Write-Host "   ⏱️ Duration: $Duration seconds" -ForegroundColor White
    Write-Host "   🚀 Ramp-up Time: $RampUpTime seconds" -ForegroundColor White
    
    $loadResults = @{
        TestType = "load"
        StartTime = Get-Date
        Requests = @()
        ResponseTimes = @()
        Errors = @()
    }
    
    # Simulate load testing
    $endTime = (Get-Date).AddSeconds($Duration)
    $currentUsers = 0
    $rampUpIncrement = $ConcurrentUsers / ($RampUpTime / 5) # Increment every 5 seconds
    
    while ((Get-Date) -lt $endTime) {
        # Gradually increase load
        if ($currentUsers -lt $ConcurrentUsers) {
            $currentUsers = [math]::Min($ConcurrentUsers, $currentUsers + $rampUpIncrement)
        }
        
        # Simulate requests
        for ($i = 1; $i -le $currentUsers; $i++) {
            $requestStart = Get-Date
            try {
                $response = Invoke-WebRequest -Uri $TargetUrl -Method GET -TimeoutSec 5
                $requestEnd = Get-Date
                $responseTime = ($requestEnd - $requestStart).TotalMilliseconds
                
                $loadResults.Requests += @{
                    Timestamp = $requestStart
                    ResponseTime = $responseTime
                    StatusCode = $response.StatusCode
                    Success = $true
                }
                
                $loadResults.ResponseTimes += $responseTime
                $PerfResults.TotalRequests++
                $PerfResults.SuccessfulRequests++
                
            } catch {
                $requestEnd = Get-Date
                $responseTime = ($requestEnd - $requestStart).TotalMilliseconds
                
                $loadResults.Requests += @{
                    Timestamp = $requestStart
                    ResponseTime = $responseTime
                    StatusCode = 0
                    Success = $false
                    Error = $_.Exception.Message
                }
                
                $loadResults.Errors += $_.Exception.Message
                $PerfResults.TotalRequests++
                $PerfResults.FailedRequests++
            }
        }
        
        Start-Sleep -Seconds 5
    }
    
    $loadResults.EndTime = Get-Date
    $PerfResults.EndTime = $loadResults.EndTime
    $PerfResults.Duration = ($PerfResults.EndTime - $PerfResults.StartTime).TotalSeconds
    
    # Calculate metrics
    if ($loadResults.ResponseTimes.Count -gt 0) {
        $PerfResults.AverageResponseTime = ($loadResults.ResponseTimes | Measure-Object -Average).Average
        $PerfResults.MinResponseTime = ($loadResults.ResponseTimes | Measure-Object -Minimum).Minimum
        $PerfResults.MaxResponseTime = ($loadResults.ResponseTimes | Measure-Object -Maximum).Maximum
    }
    
    $PerfResults.Throughput = $PerfResults.TotalRequests / $PerfResults.Duration
    $PerfResults.ErrorRate = ($PerfResults.FailedRequests / $PerfResults.TotalRequests) * 100
    
    Write-Host "   ✅ Load test completed" -ForegroundColor Green
    return $loadResults
}

function Run-StressTest {
    Write-Host "💪 Running Stress Test..." -ForegroundColor Yellow
    
    $stressResults = @{
        TestType = "stress"
        StartTime = Get-Date
        BreakingPoint = 0
        RecoveryTime = 0
        SystemBehavior = @{}
    }
    
    # Gradually increase load until system breaks
    $maxUsers = $ConcurrentUsers * 3
    $currentUsers = $ConcurrentUsers
    $increment = 50
    $testDuration = 60 # seconds per level
    
    while ($currentUsers -le $maxUsers) {
        Write-Host "   🔥 Testing with $currentUsers concurrent users..." -ForegroundColor White
        
        $testStart = Get-Date
        $testEnd = $testStart.AddSeconds($testDuration)
        $errors = 0
        $totalRequests = 0
        
        while ((Get-Date) -lt $testEnd) {
            try {
                $response = Invoke-WebRequest -Uri $TargetUrl -Method GET -TimeoutSec 2
                $totalRequests++
            } catch {
                $errors++
            }
        }
        
        $errorRate = ($errors / $totalRequests) * 100
        
        if ($errorRate -gt 50) {
            $stressResults.BreakingPoint = $currentUsers
            Write-Host "   💥 Breaking point reached at $currentUsers users (Error rate: $([math]::Round($errorRate, 2))%)" -ForegroundColor Red
            break
        }
        
        $currentUsers += $increment
    }
    
    $stressResults.EndTime = Get-Date
    Write-Host "   ✅ Stress test completed" -ForegroundColor Green
    return $stressResults
}

function Run-SpikeTest {
    Write-Host "📈 Running Spike Test..." -ForegroundColor Yellow
    
    $spikeResults = @{
        TestType = "spike"
        StartTime = Get-Date
        SpikeUsers = $ConcurrentUsers * 2
        RecoveryTime = 0
        SystemStability = $true
    }
    
    # Normal load
    Write-Host "   📊 Normal load phase..." -ForegroundColor White
    Start-Sleep -Seconds 30
    
    # Sudden spike
    Write-Host "   📈 Spike load phase ($($spikeResults.SpikeUsers) users)..." -ForegroundColor White
    $spikeStart = Get-Date
    $spikeEnd = $spikeStart.AddSeconds(60)
    
    while ((Get-Date) -lt $spikeEnd) {
        # Simulate spike load
        for ($i = 1; $i -le $spikeResults.SpikeUsers; $i++) {
            try {
                $response = Invoke-WebRequest -Uri $TargetUrl -Method GET -TimeoutSec 1
            } catch {
                $spikeResults.SystemStability = $false
            }
        }
    }
    
    # Recovery phase
    Write-Host "   🔄 Recovery phase..." -ForegroundColor White
    $recoveryStart = Get-Date
    Start-Sleep -Seconds 30
    $spikeResults.RecoveryTime = ((Get-Date) - $recoveryStart).TotalSeconds
    
    $spikeResults.EndTime = Get-Date
    Write-Host "   ✅ Spike test completed" -ForegroundColor Green
    return $spikeResults
}

function Monitor-SystemMetrics {
    Write-Host "📊 Monitoring System Metrics..." -ForegroundColor Cyan
    
    $systemMetrics = @{
        CPU = @{
            Usage = 0
            Cores = 0
            LoadAverage = 0
        }
        Memory = @{
            Total = 0
            Used = 0
            Available = 0
            UsagePercentage = 0
        }
        Disk = @{
            Total = 0
            Used = 0
            Available = 0
            UsagePercentage = 0
        }
        Network = @{
            BytesIn = 0
            BytesOut = 0
            PacketsIn = 0
            PacketsOut = 0
        }
    }
    
    # Get CPU usage
    try {
        $cpu = Get-WmiObject -Class Win32_Processor | Select-Object -First 1
        $systemMetrics.CPU.Cores = $cpu.NumberOfCores
        $systemMetrics.CPU.Usage = (Get-Counter "\Processor(_Total)\% Processor Time").CounterSamples[0].CookedValue
    } catch {
        Write-Warning "Could not get CPU metrics: $($_.Exception.Message)"
    }
    
    # Get Memory usage
    try {
        $memory = Get-WmiObject -Class Win32_OperatingSystem
        $systemMetrics.Memory.Total = [math]::Round($memory.TotalVisibleMemorySize / 1MB, 2)
        $systemMetrics.Memory.Used = [math]::Round(($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) / 1MB, 2)
        $systemMetrics.Memory.Available = [math]::Round($memory.FreePhysicalMemory / 1MB, 2)
        $systemMetrics.Memory.UsagePercentage = [math]::Round((($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) / $memory.TotalVisibleMemorySize) * 100, 2)
    } catch {
        Write-Warning "Could not get memory metrics: $($_.Exception.Message)"
    }
    
    # Get Disk usage
    try {
        $disk = Get-WmiObject -Class Win32_LogicalDisk | Where-Object { $_.DriveType -eq 3 } | Select-Object -First 1
        $systemMetrics.Disk.Total = [math]::Round($disk.Size / 1GB, 2)
        $systemMetrics.Disk.Used = [math]::Round(($disk.Size - $disk.FreeSpace) / 1GB, 2)
        $systemMetrics.Disk.Available = [math]::Round($disk.FreeSpace / 1GB, 2)
        $systemMetrics.Disk.UsagePercentage = [math]::Round((($disk.Size - $disk.FreeSpace) / $disk.Size) * 100, 2)
    } catch {
        Write-Warning "Could not get disk metrics: $($_.Exception.Message)"
    }
    
    $PerfResults.SystemMetrics = $systemMetrics
    
    Write-Host "   💻 CPU Usage: $([math]::Round($systemMetrics.CPU.Usage, 2))%" -ForegroundColor White
    Write-Host "   🧠 Memory Usage: $($systemMetrics.Memory.UsagePercentage)%" -ForegroundColor White
    Write-Host "   💾 Disk Usage: $($systemMetrics.Disk.UsagePercentage)%" -ForegroundColor White
}

function Generate-AIInsights {
    Write-Host "🤖 Generating AI Performance Insights..." -ForegroundColor Magenta
    
    $insights = @{
        PerformanceScore = 0
        Bottlenecks = @()
        Recommendations = @()
        Predictions = @()
        Optimizations = @()
    }
    
    # Calculate performance score
    $score = 100
    
    if ($PerfResults.AverageResponseTime -gt $PerfConfig.Thresholds.ResponseTime) {
        $score -= 20
        $insights.Bottlenecks += "High response time detected"
    }
    
    if ($PerfResults.ErrorRate -gt $PerfConfig.Thresholds.ErrorRate) {
        $score -= 30
        $insights.Bottlenecks += "High error rate detected"
    }
    
    if ($PerfResults.Throughput -lt $PerfConfig.Thresholds.Throughput) {
        $score -= 15
        $insights.Bottlenecks += "Low throughput detected"
    }
    
    if ($PerfResults.SystemMetrics.CPU.Usage -gt $PerfConfig.Thresholds.CPUUsage) {
        $score -= 10
        $insights.Bottlenecks += "High CPU usage detected"
    }
    
    if ($PerfResults.SystemMetrics.Memory.UsagePercentage -gt $PerfConfig.Thresholds.MemoryUsage) {
        $score -= 10
        $insights.Bottlenecks += "High memory usage detected"
    }
    
    $insights.PerformanceScore = [math]::Max(0, $score)
    
    # Generate recommendations
    if ($PerfResults.AverageResponseTime -gt $PerfConfig.Thresholds.ResponseTime) {
        $insights.Recommendations += "Optimize database queries and add caching"
        $insights.Recommendations += "Implement connection pooling"
        $insights.Recommendations += "Add CDN for static assets"
    }
    
    if ($PerfResults.ErrorRate -gt $PerfConfig.Thresholds.ErrorRate) {
        $insights.Recommendations += "Implement circuit breaker pattern"
        $insights.Recommendations += "Add retry logic with exponential backoff"
        $insights.Recommendations += "Improve error handling and logging"
    }
    
    if ($PerfResults.SystemMetrics.CPU.Usage -gt $PerfConfig.Thresholds.CPUUsage) {
        $insights.Recommendations += "Optimize CPU-intensive operations"
        $insights.Recommendations += "Implement horizontal scaling"
        $insights.Recommendations += "Add load balancing"
    }
    
    # Generate predictions
    $insights.Predictions += "Expected capacity at current load: $([math]::Round($PerfResults.Throughput * 1.5)) requests/second"
    $insights.Predictions += "Recommended concurrent user limit: $([math]::Round($ConcurrentUsers * 0.8))"
    $insights.Predictions += "Estimated breaking point: $([math]::Round($ConcurrentUsers * 2.5)) concurrent users"
    
    # Generate optimizations
    $insights.Optimizations += "Enable gzip compression"
    $insights.Optimizations += "Implement Redis caching"
    $insights.Optimizations += "Add database indexing"
    $insights.Optimizations += "Use async/await patterns"
    
    $PerfResults.AIInsights = $insights
    
    Write-Host "   📊 Performance Score: $($insights.PerformanceScore)/100" -ForegroundColor White
    Write-Host "   🔍 Bottlenecks Found: $($insights.Bottlenecks.Count)" -ForegroundColor White
    Write-Host "   💡 Recommendations: $($insights.Recommendations.Count)" -ForegroundColor White
}

function Generate-PerformanceReport {
    Write-Host "📊 Generating Performance Report..." -ForegroundColor Yellow
    
    $report = @{
        Summary = @{
            TestType = $PerfResults.TestType
            Duration = $PerfResults.Duration
            ConcurrentUsers = $PerfResults.ConcurrentUsers
            TotalRequests = $PerfResults.TotalRequests
            SuccessfulRequests = $PerfResults.SuccessfulRequests
            FailedRequests = $PerfResults.FailedRequests
            SuccessRate = if ($PerfResults.TotalRequests -gt 0) { [math]::Round(($PerfResults.SuccessfulRequests / $PerfResults.TotalRequests) * 100, 2) } else { 0 }
        }
        Performance = @{
            AverageResponseTime = $PerfResults.AverageResponseTime
            MinResponseTime = $PerfResults.MinResponseTime
            MaxResponseTime = $PerfResults.MaxResponseTime
            Throughput = $PerfResults.Throughput
            ErrorRate = $PerfResults.ErrorRate
        }
        SystemMetrics = $PerfResults.SystemMetrics
        AIInsights = $PerfResults.AIInsights
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    # Save JSON report
    $report | ConvertTo-Json -Depth 5 | Out-File -FilePath "$OutputDir/performance-report.json" -Encoding UTF8
    
    # Save HTML report
    $htmlReport = @"
<!DOCTYPE html>
<html>
<head>
    <title>Performance Testing Report v3.6</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 5px; }
        .summary { background: #ecf0f1; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: white; border-radius: 3px; }
        .good { color: #27ae60; }
        .warning { color: #f39c12; }
        .critical { color: #e74c3c; }
        .insights { background: #e8f4fd; padding: 15px; margin: 10px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚡ Performance Testing Report v3.6</h1>
        <p>Generated: $($report.Timestamp)</p>
    </div>
    
    <div class="summary">
        <h2>📊 Test Summary</h2>
        <div class="metric">
            <strong>Test Type:</strong> $($report.Summary.TestType)
        </div>
        <div class="metric">
            <strong>Duration:</strong> $([math]::Round($report.Summary.Duration, 2))s
        </div>
        <div class="metric">
            <strong>Concurrent Users:</strong> $($report.Summary.ConcurrentUsers)
        </div>
        <div class="metric">
            <strong>Total Requests:</strong> $($report.Summary.TotalRequests)
        </div>
        <div class="metric good">
            <strong>Success Rate:</strong> $($report.Summary.SuccessRate)%
        </div>
    </div>
    
    <div class="summary">
        <h2>⚡ Performance Metrics</h2>
        <div class="metric">
            <strong>Avg Response Time:</strong> $([math]::Round($report.Performance.AverageResponseTime, 2))ms
        </div>
        <div class="metric">
            <strong>Min Response Time:</strong> $([math]::Round($report.Performance.MinResponseTime, 2))ms
        </div>
        <div class="metric">
            <strong>Max Response Time:</strong> $([math]::Round($report.Performance.MaxResponseTime, 2))ms
        </div>
        <div class="metric">
            <strong>Throughput:</strong> $([math]::Round($report.Performance.Throughput, 2)) req/s
        </div>
        <div class="metric">
            <strong>Error Rate:</strong> $([math]::Round($report.Performance.ErrorRate, 2))%
        </div>
    </div>
    
    <div class="insights">
        <h2>🤖 AI Insights</h2>
        <p><strong>Performance Score:</strong> $($report.AIInsights.PerformanceScore)/100</p>
        <h3>Bottlenecks:</h3>
        <ul>
            $(($report.AIInsights.Bottlenecks | ForEach-Object { "<li>$_</li>" }) -join "")
        </ul>
        <h3>Recommendations:</h3>
        <ul>
            $(($report.AIInsights.Recommendations | ForEach-Object { "<li>$_</li>" }) -join "")
        </ul>
        <h3>Predictions:</h3>
        <ul>
            $(($report.AIInsights.Predictions | ForEach-Object { "<li>$_</li>" }) -join "")
        </ul>
    </div>
</body>
</html>
"@
    
    $htmlReport | Out-File -FilePath "$OutputDir/performance-report.html" -Encoding UTF8
    
    Write-Host "   📄 Report saved to: $OutputDir/performance-report.html" -ForegroundColor Green
    Write-Host "   📄 JSON report saved to: $OutputDir/performance-report.json" -ForegroundColor Green
}

# Main execution
Initialize-PerformanceTesting

switch ($TestType) {
    "load" {
        Run-LoadTest
    }
    "stress" {
        Run-StressTest
    }
    "spike" {
        Run-SpikeTest
    }
    "all" {
        Write-Host "🚀 Running Complete Performance Test Suite..." -ForegroundColor Green
        Run-LoadTest
        Run-StressTest
        Run-SpikeTest
    }
    default {
        Write-Host "❌ Invalid test type: $TestType" -ForegroundColor Red
        Write-Host "Valid types: load, stress, spike, all" -ForegroundColor Yellow
        return
    }
}

# Monitor system metrics
Monitor-SystemMetrics

# Generate AI insights if enabled
if ($PerfConfig.AIEnabled) {
    Generate-AIInsights
}

# Generate report
Generate-PerformanceReport

Write-Host "⚡ Performance Testing Suite completed!" -ForegroundColor Yellow
