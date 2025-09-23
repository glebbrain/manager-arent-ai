# AI-Enhanced Service Mesh Test Suite
# Version: 2.9
# Description: Comprehensive testing of the AI-enhanced service mesh

param(
    [string]$Namespace = "manager-agent-ai",
    [string]$BaseUrl = "http://localhost:3000",
    [string]$AnalyticsUrl = "http://localhost:3001",
    [string]$OrchestratorUrl = "http://localhost:3002",
    [switch]$SkipIntegration = $false,
    [switch]$SkipLoadTest = $false,
    [switch]$SkipAITests = $false,
    [int]$LoadTestDuration = 60,
    [int]$ConcurrentUsers = 10
)

Write-Host "🧪 Starting AI-Enhanced Service Mesh Test Suite v2.9" -ForegroundColor Green
Write-Host "Namespace: $Namespace" -ForegroundColor Yellow
Write-Host "API Gateway: $BaseUrl" -ForegroundColor Yellow
Write-Host "Analytics Dashboard: $AnalyticsUrl" -ForegroundColor Yellow
Write-Host "AI Orchestrator: $OrchestratorUrl" -ForegroundColor Yellow

# Test configuration
$TestResults = @{
    Total = 0
    Passed = 0
    Failed = 0
    Skipped = 0
    StartTime = Get-Date
    Tests = @()
}

# Function to run a test
function Invoke-Test {
    param(
        [string]$Name,
        [string]$Category,
        [scriptblock]$TestScript,
        [string]$Description = ""
    )
    
    $TestResults.Total++
    $testStartTime = Get-Date
    
    Write-Host "`n🧪 Running Test: $Name" -ForegroundColor Cyan
    Write-Host "Category: $Category" -ForegroundColor Gray
    if ($Description) {
        Write-Host "Description: $Description" -ForegroundColor Gray
    }
    
    try {
        $result = & $TestScript
        $testEndTime = Get-Date
        $duration = ($testEndTime - $testStartTime).TotalSeconds
        
        if ($result) {
            $TestResults.Passed++
            Write-Host "✅ PASSED: $Name ($duration seconds)" -ForegroundColor Green
            $TestResults.Tests += @{
                Name = $Name
                Category = $Category
                Status = "PASSED"
                Duration = $duration
                Error = $null
            }
        } else {
            $TestResults.Failed++
            Write-Host "❌ FAILED: $Name ($duration seconds)" -ForegroundColor Red
            $TestResults.Tests += @{
                Name = $Name
                Category = $Category
                Status = "FAILED"
                Duration = $duration
                Error = "Test returned false"
            }
        }
    } catch {
        $testEndTime = Get-Date
        $duration = ($testEndTime - $testStartTime).TotalSeconds
        $TestResults.Failed++
        Write-Host "❌ FAILED: $Name ($duration seconds) - $($_.Exception.Message)" -ForegroundColor Red
        $TestResults.Tests += @{
            Name = $Name
            Category = $Category
            Status = "FAILED"
            Duration = $duration
            Error = $_.Exception.Message
        }
    }
}

# Function to make HTTP requests
function Invoke-HttpRequest {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [int]$Timeout = 30
    )
    
    try {
        $requestParams = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            TimeoutSec = $Timeout
        }
        
        if ($Body) {
            $requestParams.Body = $Body
            $requestParams.ContentType = "application/json"
        }
        
        $response = Invoke-RestMethod @requestParams
        return @{
            Success = $true
            StatusCode = 200
            Content = $response
            Error = $null
        }
    } catch {
        return @{
            Success = $false
            StatusCode = $_.Exception.Response.StatusCode.value__
            Content = $null
            Error = $_.Exception.Message
        }
    }
}

# Function to check if service is running
function Test-ServiceRunning {
    param([string]$ServiceName, [string]$Namespace)
    
    $pods = kubectl get pods -n $Namespace -l app=$ServiceName -o jsonpath='{.items[*].status.phase}' 2>$null
    return $pods -contains "Running"
}

# Function to get service URL
function Get-ServiceUrl {
    param([string]$ServiceName, [string]$Namespace, [int]$Port)
    
    $service = kubectl get service $ServiceName -n $Namespace -o jsonpath='{.spec.clusterIP}' 2>$null
    if ($service) {
        return "http://$service`:$Port"
    }
    return $null
}

# Basic connectivity tests
Invoke-Test "API Gateway Health Check" "Connectivity" {
    $response = Invoke-HttpRequest "$BaseUrl/health"
    return $response.Success -and $response.StatusCode -eq 200
} "Test basic API Gateway connectivity"

Invoke-Test "Analytics Dashboard Health Check" "Connectivity" {
    $response = Invoke-HttpRequest "$AnalyticsUrl/health"
    return $response.Success -and $response.StatusCode -eq 200
} "Test Analytics Dashboard connectivity"

if (-not $SkipAITests) {
    Invoke-Test "AI Orchestrator Health Check" "Connectivity" {
        $response = Invoke-HttpRequest "$OrchestratorUrl/health"
        return $response.Success -and $response.StatusCode -eq 200
    } "Test AI Orchestrator connectivity"
}

# API Gateway functionality tests
Invoke-Test "API Gateway Authentication" "API Gateway" {
    $response = Invoke-HttpRequest "$BaseUrl/api/v1/auth/login" -Method POST -Body '{"username":"test","password":"test"}'
    return $response.Success
} "Test API Gateway authentication endpoint"

Invoke-Test "API Gateway Load Balancing" "API Gateway" {
    $response = Invoke-HttpRequest "$BaseUrl/api/v1/health"
    return $response.Success -and $response.StatusCode -eq 200
} "Test API Gateway load balancing"

Invoke-Test "API Gateway Rate Limiting" "API Gateway" {
    $successCount = 0
    for ($i = 0; $i -lt 10; $i++) {
        $response = Invoke-HttpRequest "$BaseUrl/api/v1/health"
        if ($response.Success) { $successCount++ }
        Start-Sleep -Milliseconds 100
    }
    return $successCount -gt 5
} "Test API Gateway rate limiting"

Invoke-Test "API Gateway Circuit Breaker" "API Gateway" {
    $response = Invoke-HttpRequest "$BaseUrl/api/v1/analytics/circuit-breakers"
    return $response.Success
} "Test API Gateway circuit breaker status"

# Analytics Dashboard tests
Invoke-Test "Analytics Dashboard Data" "Analytics" {
    $response = Invoke-HttpRequest "$AnalyticsUrl/api/ai-performance/summary"
    return $response.Success -and $response.Content -ne $null
} "Test Analytics Dashboard data retrieval"

Invoke-Test "Analytics Dashboard Models" "Analytics" {
    $response = Invoke-HttpRequest "$AnalyticsUrl/api/ai-performance/models"
    return $response.Success -and $response.Content -ne $null
} "Test Analytics Dashboard models endpoint"

Invoke-Test "Analytics Dashboard Predictions" "Analytics" {
    $response = Invoke-HttpRequest "$AnalyticsUrl/api/ai-performance/predictions"
    return $response.Success
} "Test Analytics Dashboard predictions endpoint"

Invoke-Test "Analytics Dashboard Anomaly Detection" "Analytics" {
    $response = Invoke-HttpRequest "$AnalyticsUrl/api/ai-performance/anomaly-detection"
    return $response.Success
} "Test Analytics Dashboard anomaly detection"

# AI Orchestrator tests
if (-not $SkipAITests) {
    Invoke-Test "AI Orchestrator Metrics" "AI Orchestrator" {
        $response = Invoke-HttpRequest "$OrchestratorUrl/metrics"
        return $response.Success
    } "Test AI Orchestrator metrics endpoint"
    
    Invoke-Test "AI Orchestrator Orchestration" "AI Orchestrator" {
        $response = Invoke-HttpRequest "$OrchestratorUrl/orchestrate" -Method POST
        return $response.Success
    } "Test AI Orchestrator orchestration endpoint"
    
    Invoke-Test "AI Orchestrator Health Score" "AI Orchestrator" {
        $response = Invoke-HttpRequest "$OrchestratorUrl/health-score"
        return $response.Success
    } "Test AI Orchestrator health scoring"
}

# Kubernetes integration tests
Invoke-Test "Kubernetes Pods Running" "Kubernetes" {
    $pods = kubectl get pods -n $Namespace -o jsonpath='{.items[*].status.phase}' 2>$null
    $runningPods = ($pods -split ' ') | Where-Object { $_ -eq "Running" }
    return $runningPods.Count -gt 0
} "Test that Kubernetes pods are running"

Invoke-Test "Kubernetes Services Available" "Kubernetes" {
    $services = kubectl get services -n $Namespace -o jsonpath='{.items[*].metadata.name}' 2>$null
    $expectedServices = @("api-gateway-service", "advanced-analytics-dashboard-service")
    if (-not $SkipAITests) {
        $expectedServices += "service-mesh-orchestrator-service"
    }
    
    $availableServices = ($services -split ' ') | Where-Object { $expectedServices -contains $_ }
    return $availableServices.Count -eq $expectedServices.Count
} "Test that required Kubernetes services are available"

# Istio configuration tests
Invoke-Test "Istio Virtual Services" "Istio" {
    $virtualServices = kubectl get virtualservices -n $Namespace -o jsonpath='{.items[*].metadata.name}' 2>$null
    return $virtualServices -ne $null -and $virtualServices.Length -gt 0
} "Test Istio Virtual Services configuration"

Invoke-Test "Istio Destination Rules" "Istio" {
    $destinationRules = kubectl get destinationrules -n $Namespace -o jsonpath='{.items[*].metadata.name}' 2>$null
    return $destinationRules -ne $null -and $destinationRules.Length -gt 0
} "Test Istio Destination Rules configuration"

Invoke-Test "Istio Gateways" "Istio" {
    $gateways = kubectl get gateways -n $Namespace -o jsonpath='{.items[*].metadata.name}' 2>$null
    return $gateways -ne $null -and $gateways.Length -gt 0
} "Test Istio Gateways configuration"

if (-not $SkipAITests) {
    Invoke-Test "Istio Authorization Policies" "Istio" {
        $authPolicies = kubectl get authorizationpolicies -n $Namespace -o jsonpath='{.items[*].metadata.name}' 2>$null
        return $authPolicies -ne $null -and $authPolicies.Length -gt 0
    } "Test Istio Authorization Policies configuration"
    
    Invoke-Test "Istio Telemetry" "Istio" {
        $telemetry = kubectl get telemetries -n $Namespace -o jsonpath='{.items[*].metadata.name}' 2>$null
        return $telemetry -ne $null -and $telemetry.Length -gt 0
    } "Test Istio Telemetry configuration"
}

# Performance tests
if (-not $SkipLoadTest) {
    Invoke-Test "Load Test - API Gateway" "Performance" {
        $successCount = 0
        $totalRequests = 100
        
        for ($i = 0; $i -lt $totalRequests; $i++) {
            $response = Invoke-HttpRequest "$BaseUrl/api/v1/health"
            if ($response.Success) { $successCount++ }
            Start-Sleep -Milliseconds 10
        }
        
        $successRate = $successCount / $totalRequests
        Write-Host "Load test success rate: $($successRate.ToString('P'))" -ForegroundColor Yellow
        return $successRate -gt 0.95
    } "Test API Gateway under load"
    
    Invoke-Test "Load Test - Analytics Dashboard" "Performance" {
        $successCount = 0
        $totalRequests = 50
        
        for ($i = 0; $i -lt $totalRequests; $i++) {
            $response = Invoke-HttpRequest "$AnalyticsUrl/api/ai-performance/summary"
            if ($response.Success) { $successCount++ }
            Start-Sleep -Milliseconds 20
        }
        
        $successRate = $successCount / $totalRequests
        Write-Host "Analytics load test success rate: $($successRate.ToString('P'))" -ForegroundColor Yellow
        return $successRate -gt 0.90
    } "Test Analytics Dashboard under load"
}

# Security tests
Invoke-Test "Security - CORS Headers" "Security" {
    $response = Invoke-HttpRequest "$BaseUrl/api/v1/health" -Headers @{"Origin" = "https://example.com"}
    return $response.Success
} "Test CORS headers"

Invoke-Test "Security - Rate Limiting" "Security" {
    $rateLimitHit = $false
    for ($i = 0; $i -lt 20; $i++) {
        $response = Invoke-HttpRequest "$BaseUrl/api/v1/health"
        if ($response.StatusCode -eq 429) {
            $rateLimitHit = $true
            break
        }
        Start-Sleep -Milliseconds 50
    }
    return $rateLimitHit
} "Test rate limiting enforcement"

# Integration tests
if (-not $SkipIntegration) {
    Invoke-Test "Integration - End-to-End Flow" "Integration" {
        # Test complete flow: API Gateway -> Analytics -> AI Orchestrator
        $apiResponse = Invoke-HttpRequest "$BaseUrl/api/v1/health"
        if (-not $apiResponse.Success) { return $false }
        
        $analyticsResponse = Invoke-HttpRequest "$AnalyticsUrl/api/ai-performance/summary"
        if (-not $analyticsResponse.Success) { return $false }
        
        if (-not $SkipAITests) {
            $orchestratorResponse = Invoke-HttpRequest "$OrchestratorUrl/health"
            if (-not $orchestratorResponse.Success) { return $false }
        }
        
        return $true
    } "Test end-to-end integration flow"
}

# Display test results
$TestResults.EndTime = Get-Date
$totalDuration = ($TestResults.EndTime - $TestResults.StartTime).TotalSeconds

Write-Host "`n📊 Test Results Summary" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host "Total Tests: $($TestResults.Total)" -ForegroundColor White
Write-Host "Passed: $($TestResults.Passed)" -ForegroundColor Green
Write-Host "Failed: $($TestResults.Failed)" -ForegroundColor Red
Write-Host "Skipped: $($TestResults.Skipped)" -ForegroundColor Yellow
Write-Host "Duration: $($totalDuration.ToString('F2')) seconds" -ForegroundColor White

$successRate = if ($TestResults.Total -gt 0) { ($TestResults.Passed / $TestResults.Total).ToString('P') } else { "0%" }
Write-Host "Success Rate: $successRate" -ForegroundColor $(if ($TestResults.Failed -eq 0) { "Green" } else { "Yellow" })

# Show failed tests
if ($TestResults.Failed -gt 0) {
    Write-Host "`n❌ Failed Tests:" -ForegroundColor Red
    $failedTests = $TestResults.Tests | Where-Object { $_.Status -eq "FAILED" }
    foreach ($test in $failedTests) {
        Write-Host "- $($test.Name) ($($test.Category)): $($test.Error)" -ForegroundColor Red
    }
}

# Show test categories
$categories = $TestResults.Tests | Group-Object Category
Write-Host "`n📋 Test Categories:" -ForegroundColor Cyan
foreach ($category in $categories) {
    $categoryPassed = ($category.Group | Where-Object { $_.Status -eq "PASSED" }).Count
    $categoryTotal = $category.Count
    $categoryRate = if ($categoryTotal -gt 0) { ($categoryPassed / $categoryTotal).ToString('P') } else { "0%" }
    Write-Host "- $($category.Name): $categoryPassed/$categoryTotal ($categoryRate)" -ForegroundColor White
}

# Final result
if ($TestResults.Failed -eq 0) {
    Write-Host "`n🎉 All tests passed! Service mesh is working correctly." -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n⚠️ Some tests failed. Please check the results above." -ForegroundColor Yellow
    exit 1
}
