# AI Performance Monitor for LearnEnglishBot
# Monitors OpenAI API performance, costs, and model efficiency

param(
    [switch]$RealTime,
    [switch]$GenerateReport,
    [switch]$AlertMode,
    [int]$Interval = 60,
    [string]$OutputFile = "ai_performance_report.json"
)

Write-Host "AI Performance Monitor for LearnEnglishBot" -ForegroundColor Green
Write-Host "Monitoring OpenAI API performance and costs" -ForegroundColor Cyan

# Configuration
$config = @{
    "OpenAI_API_Key" = $env:OPENAI_API_KEY
    "Telegram_Bot_Token" = $env:TELEGRAM_BOT_TOKEN
    "Monitoring_Interval" = $Interval
    "Cost_Threshold" = 0.10  # Alert if cost exceeds $0.10
    "Response_Time_Threshold" = 3.0  # Alert if response time exceeds 3 seconds
    "Error_Rate_Threshold" = 0.05  # Alert if error rate exceeds 5%
}

# Performance metrics storage
$performanceMetrics = @{
    "start_time" = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "total_requests" = 0
    "successful_requests" = 0
    "failed_requests" = 0
    "total_cost" = 0.0
    "total_tokens" = 0
    "average_response_time" = 0.0
    "response_times" = @()
    "costs" = @()
    "errors" = @()
    "model_usage" = @{}
    "hourly_stats" = @{}
}

# Function to get current AI performance metrics
function Get-AIPerformanceMetrics {
    try {
        # Check if Python environment is available
        $pythonCheck = python -c "import sys; print('Python version:', sys.version)" 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw "Python not available or not in PATH"
        }
        
        # Import and test AI client
        $aiTest = python -c "
import sys
import os
sys.path.append('.')
try:
    from bot.ai_client import EnglishLearningAI
    ai = EnglishLearningAI()
    print('AI client imported successfully')
    print('AI client available:', ai.is_available() if hasattr(ai, 'is_available') else 'Unknown')
except Exception as e:
    print(f'AI client error: {e}')
    sys.exit(1)
" 2>$null
        
        if ($LASTEXITCODE -ne 0) {
            throw "AI client test failed"
        }
        
        return @{
            "status" = "available"
            "python_version" = ($pythonCheck -split "Python version: ")[1]
            "ai_client" = "working"
        }
        
    } catch {
        return @{
            "status" = "error"
            "error" = $_.Exception.Message
            "ai_client" = "failed"
        }
    }
}

# Function to test AI performance with sample requests
function Test-AIPerformance {
    param(
        [string]$TestText = "Hello, how are you today?",
        [string]$UserLevel = "beginner"
    )
    
    $startTime = Get-Date
    $testResult = @{
        "success" = $false
        "response_time" = 0.0
        "tokens_used" = 0
        "estimated_cost" = 0.0
        "error" = $null
    }
    
    try {
        # Test AI response
        $aiResponse = python -c "
import time
import sys
import os
sys.path.append('.')

try:
    from bot.ai_client import EnglishLearningAI
    ai = EnglishLearningAI()
    
    start_time = time.time()
    result = ai.analyze_text('$TestText', '$UserLevel')
    response_time = time.time() - start_time
    
    print(f'SUCCESS:{result.get(\"success\", False)}')
    print(f'RESPONSE_TIME:{response_time:.3f}')
    print(f'FEEDBACK_LENGTH:{len(result.get(\"feedback\", \"\"))}')
    print(f'ERROR:{result.get(\"error\", \"None\")}')
    
except Exception as e:
    print(f'SUCCESS:False')
    print(f'RESPONSE_TIME:0.0')
    print(f'FEEDBACK_LENGTH:0')
    print(f'ERROR:{str(e)}')
" 2>$null
        
        $endTime = Get-Date
        $responseTime = ($endTime - $startTime).TotalSeconds
        
        # Parse response
        $lines = $aiResponse -split "`n"
        foreach ($line in $lines) {
            if ($line -match "SUCCESS:(.+)") {
                $testResult.success = $matches[1] -eq "True"
            } elseif ($line -match "RESPONSE_TIME:(.+)") {
                $testResult.response_time = [double]$matches[1]
            } elseif ($line -match "FEEDBACK_LENGTH:(.+)") {
                $feedbackLength = [int]$matches[1]
            } elseif ($line -match "ERROR:(.+)") {
                $testResult.error = $matches[1]
            }
        }
        
        # Estimate tokens and cost (rough calculation)
        $testResult.tokens_used = [math]::Round(($TestText.Length + $feedbackLength) / 4)
        $testResult.estimated_cost = $testResult.tokens_used * 0.000002  # Rough estimate
        
        return $testResult
        
    } catch {
        $testResult.error = $_.Exception.Message
        return $testResult
    }
}

# Function to update performance metrics
function Update-PerformanceMetrics {
    param($testResult)
    
    $performanceMetrics.total_requests++
    
    if ($testResult.success) {
        $performanceMetrics.successful_requests++
        $performanceMetrics.response_times += $testResult.response_time
        $performanceMetrics.costs += $testResult.estimated_cost
        $performanceMetrics.total_tokens += $testResult.tokens_used
        $performanceMetrics.total_cost += $testResult.estimated_cost
        
        # Update average response time
        $performanceMetrics.average_response_time = ($performanceMetrics.response_times | Measure-Object -Average).Average
        
        # Update hourly stats
        $currentHour = Get-Date -Format "yyyy-MM-dd HH"
        if (-not $performanceMetrics.hourly_stats.ContainsKey($currentHour)) {
            $performanceMetrics.hourly_stats[$currentHour] = @{
                "requests" = 0
                "success_rate" = 0.0
                "avg_response_time" = 0.0
                "total_cost" = 0.0
            }
        }
        
        $performanceMetrics.hourly_stats[$currentHour].requests++
        $performanceMetrics.hourly_stats[$currentHour].total_cost += $testResult.estimated_cost
        
    } else {
        $performanceMetrics.failed_requests++
        $performanceMetrics.errors += @{
            "timestamp" = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            "error" = $testResult.error
            "test_text" = $testResult.test_text
        }
    }
}

# Function to check for performance alerts
function Check-PerformanceAlerts {
    $alerts = @()
    
    # Cost threshold alert
    if ($performanceMetrics.total_cost -gt $config.Cost_Threshold) {
        $alerts += @{
            "type" = "cost_threshold"
            "message" = "Total cost exceeded threshold: $($performanceMetrics.total_cost) > $($config.Cost_Threshold)"
            "severity" = "warning"
        }
    }
    
    # Response time alert
    if ($performanceMetrics.average_response_time -gt $config.Response_Time_Threshold) {
        $alerts += @{
            "type" = "response_time"
            "message" = "Average response time exceeded threshold: $($performanceMetrics.average_response_time) > $($config.Response_Time_Threshold)"
            "severity" = "warning"
        }
    }
    
    # Error rate alert
    if ($performanceMetrics.total_requests -gt 0) {
        $errorRate = $performanceMetrics.failed_requests / $performanceMetrics.total_requests
        if ($errorRate -gt $config.Error_Rate_Threshold) {
            $alerts += @{
                "type" = "error_rate"
                "message" = "Error rate exceeded threshold: $([math]::Round($errorRate * 100, 2))% > $([math]::Round($config.Error_Rate_Threshold * 100, 2))%"
                "severity" = "critical"
            }
        }
    }
    
    return $alerts
}

# Function to generate performance report
function Generate-PerformanceReport {
    $report = @{
        "timestamp" = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        "summary" = @{
            "total_requests" = $performanceMetrics.total_requests
            "success_rate" = if ($performanceMetrics.total_requests -gt 0) { 
                [math]::Round(($performanceMetrics.successful_requests / $performanceMetrics.total_requests) * 100, 2) 
            } else { 0 }
            "total_cost" = [math]::Round($performanceMetrics.total_cost, 4)
            "total_tokens" = $performanceMetrics.total_tokens
            "average_response_time" = [math]::Round($performanceMetrics.average_response_time, 3)
        }
        "hourly_breakdown" = $performanceMetrics.hourly_stats
        "recent_errors" = $performanceMetrics.errors[-5..-1]  # Last 5 errors
        "alerts" = Check-PerformanceAlerts
    }
    
    return $report
}

# Function to display real-time performance dashboard
function Show-PerformanceDashboard {
    Clear-Host
    Write-Host "AI Performance Dashboard - LearnEnglishBot" -ForegroundColor Green
    Write-Host "=" * 50 -ForegroundColor Gray
    Write-Host "Last Updated: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Yellow
    Write-Host ""
    
    # Summary stats
    Write-Host "📊 Performance Summary" -ForegroundColor Cyan
    Write-Host "  Total Requests: $($performanceMetrics.total_requests)" -ForegroundColor White
    Write-Host "  Success Rate: $([math]::Round(($performanceMetrics.successful_requests / [math]::Max($performanceMetrics.total_requests, 1)) * 100, 1))%" -ForegroundColor White
    Write-Host "  Total Cost: $([math]::Round($performanceMetrics.total_cost, 4))" -ForegroundColor White
    Write-Host "  Total Tokens: $($performanceMetrics.total_tokens)" -ForegroundColor White
    Write-Host "  Avg Response Time: $([math]::Round($performanceMetrics.average_response_time, 3))s" -ForegroundColor White
    Write-Host ""
    
    # Recent activity
    Write-Host "🕐 Recent Activity (Last Hour)" -ForegroundColor Cyan
    $currentHour = Get-Date -Format "yyyy-MM-dd HH"
    if ($performanceMetrics.hourly_stats.ContainsKey($currentHour)) {
        $hourStats = $performanceMetrics.hourly_stats[$currentHour]
        Write-Host "  Requests: $($hourStats.requests)" -ForegroundColor White
        Write-Host "  Cost: $([math]::Round($hourStats.total_cost, 4))" -ForegroundColor White
    } else {
        Write-Host "  No activity in current hour" -ForegroundColor Gray
    }
    Write-Host ""
    
    # Alerts
    $alerts = Check-PerformanceAlerts
    if ($alerts.Count -gt 0) {
        Write-Host "🚨 Active Alerts" -ForegroundColor Red
        foreach ($alert in $alerts) {
            $color = if ($alert.severity -eq "critical") { "Red" } else { "Yellow" }
            Write-Host "  [$($alert.type)] $($alert.message)" -ForegroundColor $color
        }
        Write-Host ""
    } else {
        Write-Host "✅ No active alerts" -ForegroundColor Green
        Write-Host ""
    }
    
    # Status
    Write-Host "🔧 System Status" -ForegroundColor Cyan
    $aiStatus = Get-AIPerformanceMetrics
    if ($aiStatus.status -eq "available") {
        Write-Host "  AI Client: ✅ Available" -ForegroundColor Green
        Write-Host "  Python: ✅ $($aiStatus.python_version)" -ForegroundColor Green
    } else {
        Write-Host "  AI Client: ❌ $($aiStatus.error)" -ForegroundColor Red
    }
    Write-Host ""
    
    Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Yellow
}

# Main execution
Write-Host "Initializing AI Performance Monitor..." -ForegroundColor Yellow

# Check initial AI status
$initialStatus = Get-AIPerformanceMetrics
if ($initialStatus.status -eq "available") {
    Write-Host "✅ AI system available and ready for monitoring" -ForegroundColor Green
} else {
    Write-Host "❌ AI system not available: $($initialStatus.error)" -ForegroundColor Red
    Write-Host "Please check your Python environment and AI client configuration" -ForegroundColor Yellow
    exit 1
}

if ($GenerateReport) {
    # Generate one-time report
    Write-Host "`nGenerating performance report..." -ForegroundColor Yellow
    
    # Run a few test requests to gather data
    $testTexts = @(
        "Hello, how are you?",
        "I want to learn English",
        "Can you help me with grammar?"
    )
    
    foreach ($testText in $testTexts) {
        Write-Host "Testing: $testText" -ForegroundColor Cyan
        $testResult = Test-AIPerformance -TestText $testText -UserLevel "beginner"
        Update-PerformanceMetrics -testResult $testResult
        
        Start-Sleep -Seconds 2  # Rate limiting
    }
    
    $report = Generate-PerformanceReport
    $report | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputFile -Encoding UTF8
    
    Write-Host "`nPerformance report generated: $OutputFile" -ForegroundColor Green
    Write-Host "Summary:" -ForegroundColor Cyan
    Write-Host "  Total Requests: $($report.summary.total_requests)" -ForegroundColor White
    Write-Host "  Success Rate: $($report.summary.success_rate)%" -ForegroundColor White
    Write-Host "  Total Cost: $($report.summary.total_cost)" -ForegroundColor White
    Write-Host "  Avg Response Time: $($report.summary.average_response_time)s" -ForegroundColor White
    
} elseif ($RealTime) {
    # Real-time monitoring mode
    Write-Host "Starting real-time monitoring (Press Ctrl+C to stop)..." -ForegroundColor Green
    
    try {
        while ($true) {
            Show-PerformanceDashboard
            
            # Run performance test
            $testResult = Test-AIPerformance -TestText "Performance test" -UserLevel "intermediate"
            Update-PerformanceMetrics -testResult $testResult
            
            # Check for alerts
            $alerts = Check-PerformanceAlerts
            if ($alerts.Count -gt 0 -and $AlertMode) {
                foreach ($alert in $alerts) {
                    $sound = if ($alert.severity -eq "critical") { "SystemExclamation" } else { "SystemAsterisk" }
                    [System.Media.SystemSounds]::$sound.Play()
                }
            }
            
            Start-Sleep -Seconds $Interval
        }
    } catch {
        Write-Host "`nMonitoring stopped by user" -ForegroundColor Yellow
    }
    
} else {
    # Single test mode
    Write-Host "Running single performance test..." -ForegroundColor Yellow
    
    $testResult = Test-AIPerformance -TestText "Hello, this is a performance test" -UserLevel "beginner"
    
    Write-Host "`nTest Results:" -ForegroundColor Green
    Write-Host "  Success: $($testResult.success)" -ForegroundColor White
    Write-Host "  Response Time: $($testResult.response_time)s" -ForegroundColor White
    Write-Host "  Tokens Used: $($testResult.tokens_used)" -ForegroundColor White
    Write-Host "  Estimated Cost: $($testResult.estimated_cost)" -ForegroundColor White
    
    if ($testResult.error) {
        Write-Host "  Error: $($testResult.error)" -ForegroundColor Red
    }
    
    # Update metrics
    Update-PerformanceMetrics -testResult $testResult
    
    # Show summary
    Write-Host "`nPerformance Summary:" -ForegroundColor Cyan
    Write-Host "  Total Requests: $($performanceMetrics.total_requests)" -ForegroundColor White
    Write-Host "  Success Rate: $([math]::Round(($performanceMetrics.successful_requests / $performanceMetrics.total_requests) * 100, 1))%" -ForegroundColor White
    Write-Host "  Total Cost: $([math]::Round($performanceMetrics.total_cost, 4))" -ForegroundColor White
    Write-Host "  Average Response Time: $([math]::Round($performanceMetrics.average_response_time, 3))s" -ForegroundColor White
}

Write-Host "`nAI Performance Monitor completed" -ForegroundColor Green
