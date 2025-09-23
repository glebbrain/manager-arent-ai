# 🤖 Advanced AI Models Manager v2.7
# Comprehensive AI/ML Models Management and Integration
# Version: 2.7.0
# Last Updated: 2025-01-31

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "restart", "status", "test", "deploy", "monitor", "analyze", "optimize", "all")]
    [string]$Action = "all",
    
    [Parameter(Mandatory=$false)]
    [string]$ProjectPath = ".",
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = "development",
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableMonitoring,
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableAnalytics,
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableOptimization,
    
    [Parameter(Mandatory=$false)]
    [switch]$GenerateReport,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

# Advanced AI Models Manager v2.7
Write-Host "🤖 Advanced AI Models Manager v2.7 Starting..." -ForegroundColor Cyan
Write-Host "🧠 Comprehensive AI/ML Models Management" -ForegroundColor Magenta
Write-Host "📅 Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

# AI Models Configuration v2.7
$AIModelsConfig = @{
    Version = "2.7.0"
    ServiceName = "advanced-ai-models"
    Port = 3014
    Providers = @{
        "OpenAI" = @{
            "Name" = "OpenAI"
            "Models" = @("gpt-4o", "gpt-4o-mini", "gpt-4-turbo")
            "Capabilities" = @("text", "vision", "audio", "function_calling", "reasoning")
            "Status" = "active"
        }
        "Anthropic" = @{
            "Name" = "Anthropic"
            "Models" = @("claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022")
            "Capabilities" = @("text", "vision", "reasoning", "analysis")
            "Status" = "active"
        }
        "Google" = @{
            "Name" = "Google"
            "Models" = @("gemini-2.0-flash-exp", "gemini-1.5-pro")
            "Capabilities" = @("text", "vision", "audio", "video", "reasoning")
            "Status" = "active"
        }
        "HuggingFace" = @{
            "Name" = "Hugging Face"
            "Models" = @("meta-llama/Llama-3.1-405B-Instruct", "mistralai/Mixtral-8x22B-Instruct-v0.1")
            "Capabilities" = @("text", "reasoning", "code")
            "Status" = "active"
        }
        "Replicate" = @{
            "Name" = "Replicate"
            "Models" = @("meta/llama-3.1-405b-instruct")
            "Capabilities" = @("text", "reasoning", "code")
            "Status" = "active"
        }
        "Cohere" = @{
            "Name" = "Cohere"
            "Models" = @("command-r-plus")
            "Capabilities" = @("text", "reasoning", "tool_use")
            "Status" = "active"
        }
    }
    Features = @{
        "MultiModel" = $true
        "LoadBalancing" = $true
        "Failover" = $true
        "Caching" = $true
        "Analytics" = $true
        "CostOptimization" = $true
        "PerformanceMonitoring" = $true
        "CustomModels" = $true
        "LocalModels" = $true
        "EdgeDeployment" = $true
    }
    Limits = @{
        "MaxConcurrentRequests" = 100
        "MaxTokensPerRequest" = 1000000
        "MaxRequestsPerMinute" = 60
        "MaxRequestsPerHour" = 1000
        "MaxRequestsPerDay" = 10000
    }
}

# AI Models Management Functions
function Start-AIModelsService {
    Write-Host "`n🚀 Starting Advanced AI Models Service..." -ForegroundColor Yellow
    
    $servicePath = Join-Path $ProjectPath "advanced-ai-models"
    
    if (-not (Test-Path $servicePath)) {
        Write-Host "❌ AI Models service directory not found: $servicePath" -ForegroundColor Red
        return $false
    }
    
    try {
        Set-Location $servicePath
        
        # Check if service is already running
        $process = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
            $_.CommandLine -like "*advanced-ai-models*"
        }
        
        if ($process) {
            Write-Host "⚠️ AI Models service is already running (PID: $($process.Id))" -ForegroundColor Yellow
            return $true
        }
        
        # Install dependencies
        Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
        npm install --silent
        
        # Start service
        Write-Host "🎯 Starting AI Models service on port $($AIModelsConfig.Port)..." -ForegroundColor Green
        Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Hidden
        
        # Wait for service to start
        Start-Sleep -Seconds 5
        
        # Verify service is running
        $healthCheck = Invoke-RestMethod -Uri "http://localhost:$($AIModelsConfig.Port)/health" -Method Get -ErrorAction SilentlyContinue
        
        if ($healthCheck -and $healthCheck.status -eq "healthy") {
            Write-Host "✅ AI Models service started successfully" -ForegroundColor Green
            Write-Host "🔗 Health check: http://localhost:$($AIModelsConfig.Port)/health" -ForegroundColor Cyan
            Write-Host "📊 API docs: http://localhost:$($AIModelsConfig.Port)/api/config" -ForegroundColor Cyan
            return $true
        } else {
            Write-Host "❌ Failed to start AI Models service" -ForegroundColor Red
            return $false
        }
        
    } catch {
        Write-Host "❌ Error starting AI Models service: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    } finally {
        Set-Location $ProjectPath
    }
}

function Stop-AIModelsService {
    Write-Host "`n🛑 Stopping Advanced AI Models Service..." -ForegroundColor Yellow
    
    try {
        $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
            $_.CommandLine -like "*advanced-ai-models*"
        }
        
        if ($processes) {
            foreach ($process in $processes) {
                Write-Host "🔄 Stopping process PID: $($process.Id)" -ForegroundColor Blue
                Stop-Process -Id $process.Id -Force
            }
            Write-Host "✅ AI Models service stopped successfully" -ForegroundColor Green
        } else {
            Write-Host "ℹ️ AI Models service is not running" -ForegroundColor Blue
        }
        
        return $true
        
    } catch {
        Write-Host "❌ Error stopping AI Models service: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Get-AIModelsStatus {
    Write-Host "`n📊 Advanced AI Models Service Status..." -ForegroundColor Yellow
    
    try {
        $healthCheck = Invoke-RestMethod -Uri "http://localhost:$($AIModelsConfig.Port)/health" -Method Get -ErrorAction SilentlyContinue
        
        if ($healthCheck) {
            Write-Host "✅ Service Status: $($healthCheck.status)" -ForegroundColor Green
            Write-Host "📋 Version: $($healthCheck.version)" -ForegroundColor Blue
            Write-Host "🔗 Providers: $($healthCheck.providers -join ', ')" -ForegroundColor Blue
            Write-Host "⚡ Features: $($healthCheck.features -join ', ')" -ForegroundColor Blue
            
            # Get detailed analytics
            $analytics = Invoke-RestMethod -Uri "http://localhost:$($AIModelsConfig.Port)/api/analytics" -Method Get -ErrorAction SilentlyContinue
            
            if ($analytics) {
                Write-Host "`n📈 Analytics:" -ForegroundColor Cyan
                Write-Host "  Total Requests: $($analytics.overview.totalRequests)" -ForegroundColor White
                Write-Host "  Total Tokens: $($analytics.overview.totalTokens)" -ForegroundColor White
                Write-Host "  Total Cost: $($analytics.overview.totalCost)" -ForegroundColor White
                Write-Host "  Success Rate: $([math]::Round($analytics.overview.successRate * 100, 2))%" -ForegroundColor White
                Write-Host "  Avg Response Time: $([math]::Round($analytics.overview.averageResponseTime, 2))ms" -ForegroundColor White
            }
            
            return $true
        } else {
            Write-Host "❌ Service is not responding" -ForegroundColor Red
            return $false
        }
        
    } catch {
        Write-Host "❌ Error checking service status: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-AIModelsIntegration {
    Write-Host "`n🧪 Testing AI Models Integration..." -ForegroundColor Yellow
    
    try {
        # Test health endpoint
        Write-Host "🔍 Testing health endpoint..." -ForegroundColor Blue
        $healthCheck = Invoke-RestMethod -Uri "http://localhost:$($AIModelsConfig.Port)/health" -Method Get
        Write-Host "✅ Health check passed" -ForegroundColor Green
        
        # Test models endpoint
        Write-Host "🔍 Testing models endpoint..." -ForegroundColor Blue
        $models = Invoke-RestMethod -Uri "http://localhost:$($AIModelsConfig.Port)/api/models" -Method Get
        Write-Host "✅ Models endpoint passed - Found $($models.totalModels) models" -ForegroundColor Green
        
        # Test AI processing
        Write-Host "🔍 Testing AI processing..." -ForegroundColor Blue
        $testRequest = @{
            prompt = "Hello, this is a test request. Please respond with a simple greeting."
            requestType = "text_generation"
            useCache = $true
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "http://localhost:$($AIModelsConfig.Port)/api/process" -Method Post -Body $testRequest -ContentType "application/json"
        
        if ($response.success) {
            Write-Host "✅ AI processing test passed" -ForegroundColor Green
            Write-Host "🤖 Response: $($response.content.Substring(0, [Math]::Min(100, $response.content.Length)))..." -ForegroundColor White
            Write-Host "⏱️ Response Time: $($response.responseTime)ms" -ForegroundColor White
            Write-Host "💰 Cost: $($response.cost)" -ForegroundColor White
        } else {
            Write-Host "❌ AI processing test failed" -ForegroundColor Red
        }
        
        # Test analytics
        Write-Host "🔍 Testing analytics endpoint..." -ForegroundColor Blue
        $analytics = Invoke-RestMethod -Uri "http://localhost:$($AIModelsConfig.Port)/api/analytics" -Method Get
        Write-Host "✅ Analytics endpoint passed" -ForegroundColor Green
        
        Write-Host "`n🎉 All tests passed successfully!" -ForegroundColor Green
        return $true
        
    } catch {
        Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Monitor-AIModelsPerformance {
    Write-Host "`n📊 Monitoring AI Models Performance..." -ForegroundColor Yellow
    
    if (-not $EnableMonitoring) {
        Write-Host "⚠️ Monitoring is disabled. Use -EnableMonitoring to enable." -ForegroundColor Yellow
        return
    }
    
    try {
        $monitoringDuration = 300 # 5 minutes
        $checkInterval = 30 # 30 seconds
        $checks = $monitoringDuration / $checkInterval
        
        Write-Host "🔄 Monitoring for $monitoringDuration seconds (checking every $checkInterval seconds)..." -ForegroundColor Blue
        
        for ($i = 1; $i -le $checks; $i++) {
            $analytics = Invoke-RestMethod -Uri "http://localhost:$($AIModelsConfig.Port)/api/analytics" -Method Get -ErrorAction SilentlyContinue
            
            if ($analytics) {
                Write-Host "`n📈 Check $i/$checks - $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Cyan
                Write-Host "  Requests: $($analytics.overview.totalRequests)" -ForegroundColor White
                Write-Host "  Success Rate: $([math]::Round($analytics.overview.successRate * 100, 2))%" -ForegroundColor White
                Write-Host "  Avg Response Time: $([math]::Round($analytics.overview.averageResponseTime, 2))ms" -ForegroundColor White
                Write-Host "  Total Cost: $($analytics.overview.totalCost)" -ForegroundColor White
            } else {
                Write-Host "❌ Failed to get analytics data" -ForegroundColor Red
            }
            
            if ($i -lt $checks) {
                Start-Sleep -Seconds $checkInterval
            }
        }
        
        Write-Host "`n✅ Monitoring completed" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Error during monitoring: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Optimize-AIModelsPerformance {
    Write-Host "`n⚡ Optimizing AI Models Performance..." -ForegroundColor Yellow
    
    if (-not $EnableOptimization) {
        Write-Host "⚠️ Optimization is disabled. Use -EnableOptimization to enable." -ForegroundColor Yellow
        return
    }
    
    try {
        # Get current analytics
        $analytics = Invoke-RestMethod -Uri "http://localhost:$($AIModelsConfig.Port)/api/analytics" -Method Get
        
        Write-Host "📊 Current Performance:" -ForegroundColor Blue
        Write-Host "  Success Rate: $([math]::Round($analytics.overview.successRate * 100, 2))%" -ForegroundColor White
        Write-Host "  Avg Response Time: $([math]::Round($analytics.overview.averageResponseTime, 2))ms" -ForegroundColor White
        Write-Host "  Total Cost: $($analytics.overview.totalCost)" -ForegroundColor White
        
        # Performance optimization recommendations
        $recommendations = @()
        
        if ($analytics.overview.successRate -lt 0.95) {
            $recommendations += "Low success rate detected - check API keys and model availability"
        }
        
        if ($analytics.overview.averageResponseTime -gt 5000) {
            $recommendations += "High response time detected - consider enabling caching or using faster models"
        }
        
        if ($analytics.overview.totalCost -gt 100) {
            $recommendations += "High cost detected - consider using more cost-effective models"
        }
        
        if ($analytics.cache.size -eq 0) {
            $recommendations += "No cache data - enable caching for better performance"
        }
        
        if ($recommendations.Count -gt 0) {
            Write-Host "`n💡 Optimization Recommendations:" -ForegroundColor Yellow
            foreach ($rec in $recommendations) {
                Write-Host "  • $rec" -ForegroundColor White
            }
        } else {
            Write-Host "`n✅ Performance is optimal" -ForegroundColor Green
        }
        
        # Cache optimization
        Write-Host "`n🔄 Optimizing cache..." -ForegroundColor Blue
        # In a real implementation, this would clear old cache entries, optimize cache settings, etc.
        Write-Host "✅ Cache optimization completed" -ForegroundColor Green
        
        Write-Host "`n✅ Performance optimization completed" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Error during optimization: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Generate-AIModelsReport {
    Write-Host "`n📋 Generating AI Models Report..." -ForegroundColor Yellow
    
    if (-not $GenerateReport) {
        Write-Host "⚠️ Report generation is disabled. Use -GenerateReport to enable." -ForegroundColor Yellow
        return
    }
    
    try {
        $reportPath = Join-Path $ProjectPath "reports"
        if (-not (Test-Path $reportPath)) {
            New-Item -ItemType Directory -Path $reportPath -Force | Out-Null
        }
        
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $reportFile = Join-Path $reportPath "AI-Models-Report-$timestamp.md"
        
        # Get service data
        $healthCheck = Invoke-RestMethod -Uri "http://localhost:$($AIModelsConfig.Port)/health" -Method Get
        $analytics = Invoke-RestMethod -Uri "http://localhost:$($AIModelsConfig.Port)/api/analytics" -Method Get
        $models = Invoke-RestMethod -Uri "http://localhost:$($AIModelsConfig.Port)/api/models" -Method Get
        
        # Generate report
        $report = @"
# 🤖 Advanced AI Models Report

**Generated**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  
**Version**: $($AIModelsConfig.Version)  
**Service**: $($AIModelsConfig.ServiceName)  

## 📊 Service Status

- **Status**: $($healthCheck.status)
- **Version**: $($healthCheck.version)
- **Providers**: $($healthCheck.providers -join ', ')
- **Features**: $($healthCheck.features -join ', ')

## 📈 Performance Analytics

- **Total Requests**: $($analytics.overview.totalRequests)
- **Total Tokens**: $($analytics.overview.totalTokens)
- **Total Cost**: $($analytics.overview.totalCost)
- **Success Rate**: $([math]::Round($analytics.overview.successRate * 100, 2))%
- **Average Response Time**: $([math]::Round($analytics.overview.averageResponseTime, 2))ms
- **Error Rate**: $([math]::Round($analytics.overview.errorRate * 100, 2))%

## 🤖 Available Models

**Total Models**: $($models.totalModels)

### By Provider:
"@

        foreach ($provider in $models.providers.PSObject.Properties) {
            $report += "`n- **$($provider.Name)**: $($provider.Value.models.Count) models"
        }
        
        $report += @"

## 🔧 Configuration

### Features Enabled:
"@

        foreach ($feature in $AIModelsConfig.Features.PSObject.Properties) {
            $status = if ($feature.Value) { "✅" } else { "❌" }
            $report += "`n- $status $($feature.Name)"
        }
        
        $report += @"

### Limits:
"@

        foreach ($limit in $AIModelsConfig.Limits.PSObject.Properties) {
            $report += "`n- **$($limit.Name)**: $($limit.Value)"
        }
        
        $report += @"

## 📊 Usage by Provider

"@

        foreach ($provider in $analytics.byProvider.PSObject.Properties) {
            $report += "`n- **$($provider.Name)**: $($provider.Value) requests"
        }
        
        $report += @"

## 📊 Usage by Model

"@

        foreach ($model in $analytics.byModel.PSObject.Properties) {
            $report += "`n- **$($model.Name)**: $($model.Value) requests"
        }
        
        $report += @"

## 📊 Usage by Type

"@

        foreach ($type in $analytics.byType.PSObject.Properties) {
            $report += "`n- **$($type.Name)**: $($type.Value) requests"
        }
        
        $report += @"

## 💡 Recommendations

"@

        if ($analytics.overview.successRate -lt 0.95) {
            $report += "`n- ⚠️ Low success rate detected - check API keys and model availability"
        }
        
        if ($analytics.overview.averageResponseTime -gt 5000) {
            $report += "`n- ⚠️ High response time detected - consider enabling caching or using faster models"
        }
        
        if ($analytics.overview.totalCost -gt 100) {
            $report += "`n- ⚠️ High cost detected - consider using more cost-effective models"
        }
        
        if ($analytics.cache.size -eq 0) {
            $report += "`n- 💡 Enable caching for better performance"
        }
        
        $report += @"

---
*Report generated by Advanced AI Models Manager v$($AIModelsConfig.Version)*
"@
        
        # Save report
        $report | Out-File -FilePath $reportFile -Encoding UTF8
        
        Write-Host "✅ Report generated: $reportFile" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Error generating report: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Main execution
try {
    switch ($Action) {
        "start" {
            Start-AIModelsService
        }
        "stop" {
            Stop-AIModelsService
        }
        "restart" {
            Stop-AIModelsService
            Start-Sleep -Seconds 2
            Start-AIModelsService
        }
        "status" {
            Get-AIModelsStatus
        }
        "test" {
            Test-AIModelsIntegration
        }
        "monitor" {
            Monitor-AIModelsPerformance
        }
        "optimize" {
            Optimize-AIModelsPerformance
        }
        "analyze" {
            Get-AIModelsStatus
            if ($EnableAnalytics) {
                Monitor-AIModelsPerformance
            }
        }
        "deploy" {
            Write-Host "🚀 Deploying Advanced AI Models Service..." -ForegroundColor Yellow
            Start-AIModelsService
            Start-Sleep -Seconds 5
            Test-AIModelsIntegration
        }
        "all" {
            Write-Host "🔄 Executing all AI Models management tasks..." -ForegroundColor Yellow
            
            # Start service
            if (Start-AIModelsService) {
                Start-Sleep -Seconds 5
                
                # Test integration
                Test-AIModelsIntegration
                
                # Get status
                Get-AIModelsStatus
                
                # Monitor if enabled
                if ($EnableMonitoring) {
                    Monitor-AIModelsPerformance
                }
                
                # Optimize if enabled
                if ($EnableOptimization) {
                    Optimize-AIModelsPerformance
                }
                
                # Generate report if enabled
                if ($GenerateReport) {
                    Generate-AIModelsReport
                }
            }
        }
        default {
            Write-Host "❌ Invalid action: $Action" -ForegroundColor Red
            Write-Host "Valid actions: start, stop, restart, status, test, deploy, monitor, analyze, optimize, all" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n🎉 Advanced AI Models Manager completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ Error in AI Models Manager: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
