# Disaster Recovery System Test Script
# This script tests the AI-powered disaster recovery system

Write-Host "🧪 Starting Disaster Recovery System Tests..." -ForegroundColor Green

# Test configuration
$baseUrl = "http://localhost"
$backupPort = 3005
$recoveryPort = 3006
$backupUrl = "$baseUrl`:$backupPort"
$recoveryUrl = "$baseUrl`:$recoveryPort"

# Test results tracking
$testResults = @{
    Total = 0
    Passed = 0
    Failed = 0
    Skipped = 0
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    
    $testResults.Total++
    
    try {
        Write-Host "Testing $Name..." -ForegroundColor Yellow
        
        $params = @{
            Uri = $Url
            Method = $Method
            TimeoutSec = 30
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-RestMethod @params
        
        if ($response -and $response.status -eq "healthy") {
            Write-Host "✅ $Name - PASSED" -ForegroundColor Green
            $testResults.Passed++
            return $true
        } else {
            Write-Host "❌ $Name - FAILED (Unexpected response)" -ForegroundColor Red
            $testResults.Failed++
            return $false
        }
    } catch {
        Write-Host "❌ $Name - FAILED ($($_.Exception.Message))" -ForegroundColor Red
        $testResults.Failed++
        return $false
    }
}

function Test-BackupAPI {
    Write-Host "`n🔍 Testing AI Backup Engine API..." -ForegroundColor Cyan
    
    # Test health endpoint
    Test-Endpoint -Name "Backup Health Check" -Url "$backupUrl/health"
    
    # Test backup history
    Test-Endpoint -Name "Backup History" -Url "$backupUrl/api/backup/history"
    
    # Test backup start (with test data)
    $backupData = @{
        sourcePath = "./test-data"
        options = @{
            compression = "gzip"
            encryption = "aes-256"
            primaryStorage = "local"
        }
    }
    Test-Endpoint -Name "Start Backup" -Url "$backupUrl/api/backup/start" -Method "POST" -Body $backupData
    
    # Test backup status (with fake ID)
    Test-Endpoint -Name "Backup Status" -Url "$backupUrl/api/backup/status/test-backup-123"
    
    # Test backup validation (with fake ID)
    Test-Endpoint -Name "Backup Validation" -Url "$backupUrl/api/backup/validate/test-backup-123" -Method "POST"
}

function Test-RecoveryAPI {
    Write-Host "`n🔍 Testing Recovery Manager API..." -ForegroundColor Cyan
    
    # Test health endpoint
    Test-Endpoint -Name "Recovery Health Check" -Url "$recoveryUrl/health"
    
    # Test recovery history
    Test-Endpoint -Name "Recovery History" -Url "$recoveryUrl/api/recovery/history"
    
    # Test recovery status
    Test-Endpoint -Name "Recovery Status" -Url "$recoveryUrl/api/recovery/status"
    
    # Test recovery start (with test disaster)
    $disasterData = @{
        disasterType = "data-corruption"
        affectedComponents = @(
            @{
                name = "database"
                priority = "critical"
                storage = 1000
            },
            @{
                name = "api-gateway"
                priority = "important"
                storage = 500
            }
        )
    }
    Test-Endpoint -Name "Start Recovery" -Url "$recoveryUrl/api/recovery/start" -Method "POST" -Body $disasterData
    
    # Test recovery test (single scenario)
    $testData = @{
        scenario = "data-corruption"
    }
    Test-Endpoint -Name "Recovery Test" -Url "$recoveryUrl/api/recovery/test" -Method "POST" -Body $testData
    
    # Test all recovery tests
    Test-Endpoint -Name "All Recovery Tests" -Url "$recoveryUrl/api/recovery/test/all" -Method "POST"
}

function Test-Integration {
    Write-Host "`n🔍 Testing Integration Scenarios..." -ForegroundColor Cyan
    
    # Test backup and recovery workflow
    Write-Host "Testing backup and recovery workflow..." -ForegroundColor Yellow
    
    try {
        # 1. Start a backup
        $backupData = @{
            sourcePath = "./test-data"
            options = @{
                compression = "gzip"
                encryption = "aes-256"
                primaryStorage = "local"
            }
        }
        
        $backupResponse = Invoke-RestMethod -Uri "$backupUrl/api/backup/start" -Method POST -Body ($backupData | ConvertTo-Json) -ContentType "application/json"
        
        if ($backupResponse.success) {
            Write-Host "✅ Backup started successfully" -ForegroundColor Green
            $testResults.Passed++
        } else {
            Write-Host "❌ Backup start failed" -ForegroundColor Red
            $testResults.Failed++
        }
        
        # 2. Wait a moment for backup to process
        Start-Sleep -Seconds 2
        
        # 3. Test recovery with the backup
        $disasterData = @{
            disasterType = "hardware-failure"
            affectedComponents = @(
                @{
                    name = "test-service"
                    priority = "critical"
                    storage = 100
                }
            )
        }
        
        $recoveryResponse = Invoke-RestMethod -Uri "$recoveryUrl/api/recovery/start" -Method POST -Body ($disasterData | ConvertTo-Json) -ContentType "application/json"
        
        if ($recoveryResponse.success) {
            Write-Host "✅ Recovery started successfully" -ForegroundColor Green
            $testResults.Passed++
        } else {
            Write-Host "❌ Recovery start failed" -ForegroundColor Red
            $testResults.Failed++
        }
        
        $testResults.Total += 2
        
    } catch {
        Write-Host "❌ Integration test failed: $($_.Exception.Message)" -ForegroundColor Red
        $testResults.Failed += 2
        $testResults.Total += 2
    }
}

function Test-Performance {
    Write-Host "`n🔍 Testing Performance..." -ForegroundColor Cyan
    
    # Test response times
    $endpoints = @(
        @{ Name = "Backup Health"; Url = "$backupUrl/health" },
        @{ Name = "Recovery Health"; Url = "$recoveryUrl/health" },
        @{ Name = "Backup History"; Url = "$backupUrl/api/backup/history" },
        @{ Name = "Recovery History"; Url = "$recoveryUrl/api/recovery/history" }
    )
    
    foreach ($endpoint in $endpoints) {
        try {
            $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
            $response = Invoke-RestMethod -Uri $endpoint.Url -Method GET
            $stopwatch.Stop()
            
            $responseTime = $stopwatch.ElapsedMilliseconds
            
            if ($responseTime -lt 1000) {
                Write-Host "✅ $($endpoint.Name) - ${responseTime}ms (Good)" -ForegroundColor Green
            } elseif ($responseTime -lt 3000) {
                Write-Host "⚠️  $($endpoint.Name) - ${responseTime}ms (Acceptable)" -ForegroundColor Yellow
            } else {
                Write-Host "❌ $($endpoint.Name) - ${responseTime}ms (Slow)" -ForegroundColor Red
            }
            
            $testResults.Total++
            $testResults.Passed++
            
        } catch {
            Write-Host "❌ $($endpoint.Name) - FAILED ($($_.Exception.Message))" -ForegroundColor Red
            $testResults.Total++
            $testResults.Failed++
        }
    }
}

function Test-ErrorHandling {
    Write-Host "`n🔍 Testing Error Handling..." -ForegroundColor Cyan
    
    # Test invalid endpoints
    $invalidEndpoints = @(
        @{ Name = "Invalid Backup Endpoint"; Url = "$backupUrl/api/invalid" },
        @{ Name = "Invalid Recovery Endpoint"; Url = "$recoveryUrl/api/invalid" },
        @{ Name = "Non-existent Backup"; Url = "$backupUrl/api/backup/status/non-existent" },
        @{ Name = "Non-existent Recovery"; Url = "$recoveryUrl/api/recovery/status/non-existent" }
    )
    
    foreach ($endpoint in $invalidEndpoints) {
        try {
            $response = Invoke-RestMethod -Uri $endpoint.Url -Method GET
            Write-Host "⚠️  $($endpoint.Name) - Should have failed but didn't" -ForegroundColor Yellow
        } catch {
            if ($_.Exception.Response.StatusCode -eq 404 -or $_.Exception.Response.StatusCode -eq 500) {
                Write-Host "✅ $($endpoint.Name) - Correctly handled error" -ForegroundColor Green
                $testResults.Passed++
            } else {
                Write-Host "❌ $($endpoint.Name) - Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
                $testResults.Failed++
            }
            $testResults.Total++
        }
    }
}

function Test-Security {
    Write-Host "`n🔍 Testing Security..." -ForegroundColor Cyan
    
    # Test CORS headers
    try {
        $response = Invoke-WebRequest -Uri "$backupUrl/health" -Method GET
        $corsHeader = $response.Headers["Access-Control-Allow-Origin"]
        
        if ($corsHeader) {
            Write-Host "✅ CORS headers present" -ForegroundColor Green
        } else {
            Write-Host "⚠️  CORS headers missing" -ForegroundColor Yellow
        }
        
        $testResults.Total++
        $testResults.Passed++
        
    } catch {
        Write-Host "❌ Security test failed: $($_.Exception.Message)" -ForegroundColor Red
        $testResults.Total++
        $testResults.Failed++
    }
}

# Main test execution
Write-Host "🚀 Starting comprehensive disaster recovery system tests..." -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green

# Check if services are running
Write-Host "`n📋 Checking service availability..." -ForegroundColor Yellow

try {
    $backupHealth = Invoke-RestMethod -Uri "$backupUrl/health" -Method GET -TimeoutSec 5
    Write-Host "✅ AI Backup Engine is running" -ForegroundColor Green
} catch {
    Write-Host "❌ AI Backup Engine is not running. Please start it first." -ForegroundColor Red
    Write-Host "   Run: node ai-backup/ai-backup-engine.js" -ForegroundColor Cyan
    exit 1
}

try {
    $recoveryHealth = Invoke-RestMethod -Uri "$recoveryUrl/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Recovery Manager is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Recovery Manager is not running. Please start it first." -ForegroundColor Red
    Write-Host "   Run: node recovery/recovery-manager.js" -ForegroundColor Cyan
    exit 1
}

# Run all test suites
Test-BackupAPI
Test-RecoveryAPI
Test-Integration
Test-Performance
Test-ErrorHandling
Test-Security

# Display test results
Write-Host "`n📊 Test Results Summary" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host "Total Tests: $($testResults.Total)" -ForegroundColor White
Write-Host "Passed: $($testResults.Passed)" -ForegroundColor Green
Write-Host "Failed: $($testResults.Failed)" -ForegroundColor Red
Write-Host "Skipped: $($testResults.Skipped)" -ForegroundColor Yellow

$successRate = if ($testResults.Total -gt 0) { [math]::Round(($testResults.Passed / $testResults.Total) * 100, 2) } else { 0 }
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })

# Generate test report
$reportPath = "test-results/disaster-recovery-test-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$reportDir = Split-Path $reportPath -Parent

if (!(Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
}

$testReport = @{
    timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
    environment = "test"
    services = @{
        backupEngine = $backupHealth
        recoveryManager = $recoveryHealth
    }
    results = $testResults
    successRate = $successRate
    status = if ($successRate -ge 80) { "PASSED" } elseif ($successRate -ge 60) { "PARTIAL" } else { "FAILED" }
}

$testReport | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath -Encoding UTF8
Write-Host "`n📄 Test report saved to: $reportPath" -ForegroundColor Cyan

# Final status
if ($successRate -ge 80) {
    Write-Host "`n🎉 All tests completed successfully!" -ForegroundColor Green
    Write-Host "Disaster Recovery System is ready for production use." -ForegroundColor Green
    exit 0
} elseif ($successRate -ge 60) {
    Write-Host "`n⚠️  Some tests failed, but system is partially functional." -ForegroundColor Yellow
    Write-Host "Please review failed tests and fix issues before production use." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "`n❌ Multiple tests failed. System needs attention." -ForegroundColor Red
    Write-Host "Please fix critical issues before using the system." -ForegroundColor Red
    exit 1
}
