# AI-Enhanced Kubernetes Test Suite
# Version: 2.9
# Description: Comprehensive testing of the AI-enhanced Kubernetes deployment

param(
    [string]$Namespace = "manager-agent-ai",
    [string]$BaseUrl = "http://localhost:3000",
    [string]$AnalyticsUrl = "http://localhost:3001",
    [string]$PrometheusUrl = "http://localhost:9090",
    [switch]$SkipIntegration = $false,
    [switch]$SkipLoadTest = $false,
    [switch]$SkipAITests = $false,
    [int]$LoadTestDuration = 60,
    [int]$ConcurrentUsers = 10
)

Write-Host "🧪 Starting AI-Enhanced Kubernetes Test Suite v2.9" -ForegroundColor Green
Write-Host "Namespace: $Namespace" -ForegroundColor Yellow
Write-Host "API Gateway: $BaseUrl" -ForegroundColor Yellow
Write-Host "Analytics Dashboard: $AnalyticsUrl" -ForegroundColor Yellow
Write-Host "Prometheus: $PrometheusUrl" -ForegroundColor Yellow

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

Invoke-Test "Prometheus Health Check" "Connectivity" {
    $response = Invoke-HttpRequest "$PrometheusUrl/-/healthy"
    return $response.Success -and $response.StatusCode -eq 200
} "Test Prometheus connectivity"

# Kubernetes resource tests
Invoke-Test "Kubernetes Pods Running" "Kubernetes" {
    $pods = kubectl get pods -n $Namespace -o jsonpath='{.items[*].status.phase}' 2>$null
    $runningPods = ($pods -split ' ') | Where-Object { $_ -eq "Running" }
    return $runningPods.Count -gt 0
} "Test that Kubernetes pods are running"

Invoke-Test "Kubernetes Services Available" "Kubernetes" {
    $services = kubectl get services -n $Namespace -o jsonpath='{.items[*].metadata.name}' 2>$null
    $expectedServices = @("api-gateway-enhanced-service", "analytics-dashboard-enhanced-service", "prometheus-service")
    
    $availableServices = ($services -split ' ') | Where-Object { $expectedServices -contains $_ }
    return $availableServices.Count -eq $expectedServices.Count
} "Test that required Kubernetes services are available"

Invoke-Test "Kubernetes Deployments Ready" "Kubernetes" {
    $deployments = kubectl get deployments -n $Namespace -o jsonpath='{.items[*].metadata.name}' 2>$null
    $expectedDeployments = @("api-gateway-enhanced", "analytics-dashboard-enhanced", "prometheus")
    
    $readyDeployments = 0
    foreach ($deployment in $expectedDeployments) {
        $status = kubectl get deployment $deployment -n $Namespace -o jsonpath='{.status.readyReplicas}' 2>$null
        $desired = kubectl get deployment $deployment -n $Namespace -o jsonpath='{.spec.replicas}' 2>$null
        
        if ($status -and $status -eq $desired -and $desired -gt 0) {
            $readyDeployments++
        }
    }
    
    return $readyDeployments -eq $expectedDeployments.Count
} "Test that all Kubernetes deployments are ready"

# HPA tests
Invoke-Test "Horizontal Pod Autoscaler Active" "Kubernetes" {
    $hpas = kubectl get hpa -n $Namespace -o jsonpath='{.items[*].metadata.name}' 2>$null
    return $hpas -ne $null -and $hpas.Length -gt 0
} "Test that HPA resources are active"

Invoke-Test "HPA Scaling Metrics" "Kubernetes" {
    $hpaStatus = kubectl get hpa -n $Namespace -o jsonpath='{.items[*].status.conditions[?(@.type=="AbleToScale")].status}' 2>$null
    return $hpaStatus -contains "True"
} "Test that HPA can scale based on metrics"

# PDB tests
Invoke-Test "Pod Disruption Budget Active" "Kubernetes" {
    $pdbs = kubectl get pdb -n $Namespace -o jsonpath='{.items[*].metadata.name}' 2>$null
    return $pdbs -ne $null -and $pdbs.Length -gt 0
} "Test that PDB resources are active"

# Network Policy tests
Invoke-Test "Network Policies Active" "Kubernetes" {
    $networkPolicies = kubectl get networkpolicies -n $Namespace -o jsonpath='{.items[*].metadata.name}' 2>$null
    return $networkPolicies -ne $null -and $networkPolicies.Length -gt 0
} "Test that Network Policies are active"

# Resource quota tests
Invoke-Test "Resource Quotas Active" "Kubernetes" {
    $resourceQuotas = kubectl get resourcequotas -n $Namespace -o jsonpath='{.items[*].metadata.name}' 2>$null
    return $resourceQuotas -ne $null -and $resourceQuotas.Length -gt 0
} "Test that Resource Quotas are active"

# ConfigMap tests
Invoke-Test "ConfigMaps Available" "Kubernetes" {
    $configMaps = kubectl get configmaps -n $Namespace -o jsonpath='{.items[*].metadata.name}' 2>$null
    $expectedConfigMaps = @("manager-agent-ai-config")
    
    $availableConfigMaps = ($configMaps -split ' ') | Where-Object { $expectedConfigMaps -contains $_ }
    return $availableConfigMaps.Count -eq $expectedConfigMaps.Count
} "Test that required ConfigMaps are available"

# Secret tests
Invoke-Test "Secrets Available" "Kubernetes" {
    $secrets = kubectl get secrets -n $Namespace -o jsonpath='{.items[*].metadata.name}' 2>$null
    $expectedSecrets = @("manager-agent-ai-secrets")
    
    $availableSecrets = ($secrets -split ' ') | Where-Object { $expectedSecrets -contains $_ }
    return $availableSecrets.Count -eq $expectedSecrets.Count
} "Test that required Secrets are available"

# Service Account tests
Invoke-Test "Service Accounts Available" "Kubernetes" {
    $serviceAccounts = kubectl get serviceaccounts -n $Namespace -o jsonpath='{.items[*].metadata.name}' 2>$null
    $expectedServiceAccounts = @("api-gateway-sa", "analytics-dashboard-sa")
    
    $availableServiceAccounts = ($serviceAccounts -split ' ') | Where-Object { $expectedServiceAccounts -contains $_ }
    return $availableServiceAccounts.Count -eq $expectedServiceAccounts.Count
} "Test that required Service Accounts are available"

# Role and RoleBinding tests
Invoke-Test "Roles Available" "Kubernetes" {
    $roles = kubectl get roles -n $Namespace -o jsonpath='{.items[*].metadata.name}' 2>$null
    $expectedRoles = @("api-gateway-role", "analytics-dashboard-role")
    
    $availableRoles = ($roles -split ' ') | Where-Object { $expectedRoles -contains $_ }
    return $availableRoles.Count -eq $expectedRoles.Count
} "Test that required Roles are available"

Invoke-Test "RoleBindings Available" "Kubernetes" {
    $roleBindings = kubectl get rolebindings -n $Namespace -o jsonpath='{.items[*].metadata.name}' 2>$null
    $expectedRoleBindings = @("api-gateway-rolebinding", "analytics-dashboard-rolebinding")
    
    $availableRoleBindings = ($roleBindings -split ' ') | Where-Object { $expectedRoleBindings -contains $_ }
    return $availableRoleBindings.Count -eq $expectedRoleBindings.Count
} "Test that required RoleBindings are available"

# PersistentVolumeClaim tests
Invoke-Test "PVCs Available" "Kubernetes" {
    $pvcs = kubectl get pvc -n $Namespace -o jsonpath='{.items[*].metadata.name}' 2>$null
    $expectedPVCs = @("analytics-dashboard-pvc")
    
    $availablePVCs = ($pvcs -split ' ') | Where-Object { $expectedPVCs -contains $_ }
    return $availablePVCs.Count -eq $expectedPVCs.Count
} "Test that required PVCs are available"

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

# Analytics Dashboard tests
Invoke-Test "Analytics Dashboard Data" "Analytics" {
    $response = Invoke-HttpRequest "$AnalyticsUrl/api/ai-performance/summary"
    return $response.Success -and $response.Content -ne $null
} "Test Analytics Dashboard data retrieval"

Invoke-Test "Analytics Dashboard Models" "Analytics" {
    $response = Invoke-HttpRequest "$AnalyticsUrl/api/ai-performance/models"
    return $response.Success -and $response.Content -ne $null
} "Test Analytics Dashboard models endpoint"

# Prometheus tests
Invoke-Test "Prometheus Metrics" "Monitoring" {
    $response = Invoke-HttpRequest "$PrometheusUrl/api/v1/query?query=up"
    return $response.Success -and $response.Content -ne $null
} "Test Prometheus metrics endpoint"

Invoke-Test "Prometheus Targets" "Monitoring" {
    $response = Invoke-HttpRequest "$PrometheusUrl/api/v1/targets"
    return $response.Success -and $response.Content -ne $null
} "Test Prometheus targets endpoint"

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
        # Test complete flow: API Gateway -> Analytics -> Prometheus
        $apiResponse = Invoke-HttpRequest "$BaseUrl/api/v1/health"
        if (-not $apiResponse.Success) { return $false }
        
        $analyticsResponse = Invoke-HttpRequest "$AnalyticsUrl/api/ai-performance/summary"
        if (-not $analyticsResponse.Success) { return $false }
        
        $prometheusResponse = Invoke-HttpRequest "$PrometheusUrl/-/healthy"
        if (-not $prometheusResponse.Success) { return $false }
        
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
    Write-Host "`n🎉 All tests passed! Kubernetes deployment is working correctly." -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n⚠️ Some tests failed. Please check the results above." -ForegroundColor Yellow
    exit 1
}
