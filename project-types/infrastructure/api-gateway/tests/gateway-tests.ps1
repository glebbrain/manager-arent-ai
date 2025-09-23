# ManagerAgentAI API Gateway Tests
# Comprehensive test suite for API Gateway functionality

param(
    [switch]$All,
    [switch]$Unit,
    [switch]$Integration,
    [switch]$Performance,
    [switch]$Security,
    [switch]$Help
)

$TestResults = @{
    "Total" = 0
    "Passed" = 0
    "Failed" = 0
    "Skipped" = 0
    "StartTime" = Get-Date
}

function Show-Help {
    Write-Host @"
🧪 ManagerAgentAI API Gateway Tests

Comprehensive test suite for API Gateway functionality.

Usage:
  .\gateway-tests.ps1 [options]

Options:
  -All           Run all tests
  -Unit          Run unit tests
  -Integration   Run integration tests
  -Performance   Run performance tests
  -Security      Run security tests
  -Help          Show this help

Examples:
  .\gateway-tests.ps1 -All
  .\gateway-tests.ps1 -Unit -Integration
  .\gateway-tests.ps1 -Performance
"@
}

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Message = "",
        [string]$Duration = "0ms"
    )
    
    $TestResults.Total++
    
    if ($Passed) {
        $TestResults.Passed++
        Write-Host "✅ $TestName" -ForegroundColor Green
        if ($Message) { Write-Host "   $Message" -ForegroundColor Gray }
        if ($Duration -ne "0ms") { Write-Host "   Duration: $Duration" -ForegroundColor Gray }
    } else {
        $TestResults.Failed++
        Write-Host "❌ $TestName" -ForegroundColor Red
        if ($Message) { Write-Host "   $Message" -ForegroundColor Red }
        if ($Duration -ne "0ms") { Write-Host "   Duration: $Duration" -ForegroundColor Gray }
    }
}

function Test-GatewayInitialization {
    Write-Host "`n🔧 Testing Gateway Initialization..." -ForegroundColor Yellow
    
    $startTime = Get-Date
    
    try {
        # Test gateway initialization
        $result = & ".\scripts\api-gateway.ps1" "init" 2>&1
        $success = $LASTEXITCODE -eq 0
        
        $duration = (Get-Date) - $startTime
        $durationStr = "$([math]::Round($duration.TotalMilliseconds))ms"
        
        Write-TestResult -TestName "Gateway Initialization" -Passed $success -Message "Initialize API gateway" -Duration $durationStr
        
        # Test configuration files exist
        $configFile = "api-gateway\config\gateway.json"
        $servicesFile = "api-gateway\config\services.json"
        
        $configExists = Test-Path $configFile
        Write-TestResult -TestName "Gateway Config File" -Passed $configExists -Message "Configuration file created"
        
        $servicesExists = Test-Path $servicesFile
        Write-TestResult -TestName "Services Config File" -Passed $servicesExists -Message "Services registry created"
        
        # Test configuration validity
        if ($configExists) {
            try {
                $config = Get-Content $configFile | ConvertFrom-Json
                $validConfig = $config.port -and $config.host -and $config.rateLimit
                Write-TestResult -TestName "Config Validity" -Passed $validConfig -Message "Configuration is valid JSON"
            } catch {
                Write-TestResult -TestName "Config Validity" -Passed $false -Message "Invalid JSON configuration"
            }
        }
        
    } catch {
        Write-TestResult -TestName "Gateway Initialization" -Passed $false -Message $_.Exception.Message
    }
}

function Test-GatewayCommands {
    Write-Host "`n📋 Testing Gateway Commands..." -ForegroundColor Yellow
    
    # Test help command
    try {
        $result = & ".\scripts\api-gateway.ps1" "help" 2>&1
        $success = $result -match "ManagerAgentAI API Gateway"
        Write-TestResult -TestName "Help Command" -Passed $success -Message "Help command displays correctly"
    } catch {
        Write-TestResult -TestName "Help Command" -Passed $false -Message $_.Exception.Message
    }
    
    # Test status command
    try {
        $result = & ".\scripts\api-gateway.ps1" "status" 2>&1
        $success = $result -match "API Gateway Status"
        Write-TestResult -TestName "Status Command" -Passed $success -Message "Status command works"
    } catch {
        Write-TestResult -TestName "Status Command" -Passed $false -Message $_.Exception.Message
    }
    
    # Test list command
    try {
        $result = & ".\scripts\api-gateway.ps1" "list" 2>&1
        $success = $result -match "Registered Services"
        Write-TestResult -TestName "List Command" -Passed $success -Message "List command works"
    } catch {
        Write-TestResult -TestName "List Command" -Passed $false -Message $_.Exception.Message
    }
    
    # Test metrics command
    try {
        $result = & ".\scripts\api-gateway.ps1" "metrics" 2>&1
        $success = $result -match "API Gateway Metrics"
        Write-TestResult -TestName "Metrics Command" -Passed $success -Message "Metrics command works"
    } catch {
        Write-TestResult -TestName "Metrics Command" -Passed $false -Message $_.Exception.Message
    }
}

function Test-ServiceRegistry {
    Write-Host "`n🔌 Testing Service Registry..." -ForegroundColor Yellow
    
    $servicesFile = "api-gateway\config\services.json"
    
    if (Test-Path $servicesFile) {
        try {
            $services = Get-Content $servicesFile | ConvertFrom-Json
            
            # Test required services exist
            $requiredServices = @("project-manager", "ai-planner", "workflow-orchestrator", "smart-notifications", "template-generator", "consistency-manager")
            
            foreach ($service in $requiredServices) {
                $exists = $services.PSObject.Properties.Name -contains $service
                Write-TestResult -TestName "Service $service" -Passed $exists -Message "Service registered in registry"
            }
            
            # Test service configuration structure
            foreach ($serviceName in $services.PSObject.Properties.Name) {
                $service = $services.$serviceName
                $hasName = $service.name
                $hasEndpoint = $service.endpoint
                $hasRoutes = $service.routes -and $service.routes.Count -gt 0
                
                Write-TestResult -TestName "Service $serviceName Structure" -Passed ($hasName -and $hasEndpoint -and $hasRoutes) -Message "Service has required properties"
            }
            
        } catch {
            Write-TestResult -TestName "Service Registry Parsing" -Passed $false -Message "Failed to parse services registry"
        }
    } else {
        Write-TestResult -TestName "Service Registry File" -Passed $false -Message "Services registry file not found"
    }
}

function Test-GatewayConfiguration {
    Write-Host "`n⚙️ Testing Gateway Configuration..." -ForegroundColor Yellow
    
    $configFile = "api-gateway\config\gateway.json"
    
    if (Test-Path $configFile) {
        try {
            $config = Get-Content $configFile | ConvertFrom-Json
            
            # Test required configuration properties
            $requiredProps = @("port", "host", "rateLimit", "cors", "auth", "logging", "monitoring")
            
            foreach ($prop in $requiredProps) {
                $exists = $config.PSObject.Properties.Name -contains $prop
                Write-TestResult -TestName "Config Property $prop" -Passed $exists -Message "Required configuration property exists"
            }
            
            # Test configuration values
            $validPort = $config.port -and $config.port -gt 0 -and $config.port -lt 65536
            Write-TestResult -TestName "Port Configuration" -Passed $validPort -Message "Port is valid"
            
            $validHost = $config.host -and $config.host -ne ""
            Write-TestResult -TestName "Host Configuration" -Passed $validHost -Message "Host is configured"
            
            $validRateLimit = $config.rateLimit -and $config.rateLimit.requests -gt 0
            Write-TestResult -TestName "Rate Limit Configuration" -Passed $validRateLimit -Message "Rate limiting is configured"
            
            $validCORS = $config.cors -and $config.cors.enabled -eq $true
            Write-TestResult -TestName "CORS Configuration" -Passed $validCORS -Message "CORS is enabled"
            
            $validAuth = $config.auth -and $config.auth.enabled -eq $true
            Write-TestResult -TestName "Auth Configuration" -Passed $validAuth -Message "Authentication is enabled"
            
        } catch {
            Write-TestResult -TestName "Configuration Parsing" -Passed $false -Message "Failed to parse gateway configuration"
        }
    } else {
        Write-TestResult -TestName "Configuration File" -Passed $false -Message "Gateway configuration file not found"
    }
}

function Test-JavaScriptVersion {
    Write-Host "`n📦 Testing JavaScript Version..." -ForegroundColor Yellow
    
    $jsFile = "scripts\api-gateway.js"
    
    if (Test-Path $jsFile) {
        Write-TestResult -TestName "JavaScript File Exists" -Passed $true -Message "JavaScript version available"
        
        # Test JavaScript syntax
        try {
            $nodeVersion = node --version 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-TestResult -TestName "Node.js Available" -Passed $true -Message "Node.js is installed: $nodeVersion"
                
                # Test JavaScript file syntax
                $syntaxCheck = node -c $jsFile 2>&1
                $syntaxValid = $LASTEXITCODE -eq 0
                Write-TestResult -TestName "JavaScript Syntax" -Passed $syntaxValid -Message "JavaScript file syntax is valid"
            } else {
                Write-TestResult -TestName "Node.js Available" -Passed $false -Message "Node.js is not installed"
            }
        } catch {
            Write-TestResult -TestName "Node.js Check" -Passed $false -Message "Failed to check Node.js"
        }
    } else {
        Write-TestResult -TestName "JavaScript File" -Passed $false -Message "JavaScript version not found"
    }
}

function Test-Performance {
    Write-Host "`n⚡ Testing Performance..." -ForegroundColor Yellow
    
    $startTime = Get-Date
    
    # Test command execution speed
    try {
        $cmdStart = Get-Date
        $result = & ".\scripts\api-gateway.ps1" "status" 2>&1
        $cmdEnd = Get-Date
        $cmdDuration = ($cmdEnd - $cmdStart).TotalMilliseconds
        
        $fastExecution = $cmdDuration -lt 5000  # Should complete in under 5 seconds
        Write-TestResult -TestName "Command Execution Speed" -Passed $fastExecution -Message "Command completed in $([math]::Round($cmdDuration))ms"
        
    } catch {
        Write-TestResult -TestName "Command Execution Speed" -Passed $false -Message $_.Exception.Message
    }
    
    # Test memory usage
    try {
        $process = Get-Process powershell | Where-Object { $_.CommandLine -like "*api-gateway*" } | Select-Object -First 1
        if ($process) {
            $memoryMB = [math]::Round($process.WorkingSet64 / 1MB, 2)
            $reasonableMemory = $memoryMB -lt 100  # Should use less than 100MB
            Write-TestResult -TestName "Memory Usage" -Passed $reasonableMemory -Message "Memory usage: ${memoryMB}MB"
        } else {
            Write-TestResult -TestName "Memory Usage" -Passed $true -Message "No gateway process running"
        }
    } catch {
        Write-TestResult -TestName "Memory Usage" -Passed $false -Message $_.Exception.Message
    }
}

function Test-Security {
    Write-Host "`n🔒 Testing Security..." -ForegroundColor Yellow
    
    $configFile = "api-gateway\config\gateway.json"
    
    if (Test-Path $configFile) {
        try {
            $config = Get-Content $configFile | ConvertFrom-Json
            
            # Test authentication is enabled
            $authEnabled = $config.auth.enabled -eq $true
            Write-TestResult -TestName "Authentication Enabled" -Passed $authEnabled -Message "Authentication is enabled"
            
            # Test JWT secret is configured
            $hasSecret = $config.auth.secret -and $config.auth.secret.Length -gt 10
            Write-TestResult -TestName "JWT Secret Configured" -Passed $hasSecret -Message "JWT secret is properly configured"
            
            # Test CORS is configured
            $corsEnabled = $config.cors.enabled -eq $true
            Write-TestResult -TestName "CORS Enabled" -Passed $corsEnabled -Message "CORS is enabled"
            
            # Test rate limiting is enabled
            $rateLimitEnabled = $config.rateLimit.enabled -eq $true
            Write-TestResult -TestName "Rate Limiting Enabled" -Passed $rateLimitEnabled -Message "Rate limiting is enabled"
            
            # Test security headers
            $securityEnabled = $config.security -and $config.security.helmet -eq $true
            Write-TestResult -TestName "Security Headers" -Passed $securityEnabled -Message "Security headers are enabled"
            
        } catch {
            Write-TestResult -TestName "Security Configuration" -Passed $false -Message "Failed to check security configuration"
        }
    } else {
        Write-TestResult -TestName "Security Configuration" -Passed $false -Message "Configuration file not found"
    }
}

function Test-Integration {
    Write-Host "`n🔗 Testing Integration..." -ForegroundColor Yellow
    
    # Test that all required scripts exist
    $requiredScripts = @(
        "scripts\api-gateway.ps1",
        "scripts\project-manager.ps1",
        "scripts\ai-planner.ps1",
        "scripts\workflow-orchestrator.ps1",
        "scripts\smart-notifications.ps1",
        "scripts\template-generator.ps1",
        "scripts\consistency-manager.ps1"
    )
    
    foreach ($script in $requiredScripts) {
        $exists = Test-Path $script
        $scriptName = Split-Path $script -Leaf
        Write-TestResult -TestName "Script $scriptName" -Passed $exists -Message "Required script exists"
    }
    
    # Test that templates exist
    $templatesDir = "templates"
    $templatesExist = Test-Path $templatesDir
    Write-TestResult -TestName "Templates Directory" -Passed $templatesExist -Message "Templates directory exists"
    
    if ($templatesExist) {
        $templateFiles = Get-ChildItem $templatesDir -Recurse -Filter "*.json" | Measure-Object
        $hasTemplates = $templateFiles.Count -gt 0
        Write-TestResult -TestName "Template Files" -Passed $hasTemplates -Message "Template files exist ($($templateFiles.Count) found)"
    }
}

function Show-TestSummary {
    $endTime = Get-Date
    $totalDuration = $endTime - $TestResults.StartTime
    
    Write-Host "`n📊 Test Summary" -ForegroundColor Green
    Write-Host "===============" -ForegroundColor Green
    Write-Host "Total Tests: $($TestResults.Total)" -ForegroundColor Cyan
    Write-Host "✅ Passed: $($TestResults.Passed)" -ForegroundColor Green
    Write-Host "❌ Failed: $($TestResults.Failed)" -ForegroundColor Red
    Write-Host "⏭️ Skipped: $($TestResults.Skipped)" -ForegroundColor Yellow
    Write-Host "⏱️ Duration: $([math]::Round($totalDuration.TotalSeconds, 2))s" -ForegroundColor Cyan
    
    $successRate = if ($TestResults.Total -gt 0) { [math]::Round(($TestResults.Passed / $TestResults.Total) * 100, 2) } else { 0 }
    Write-Host "📈 Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 90) { "Green" } elseif ($successRate -ge 70) { "Yellow" } else { "Red" })
    
    if ($TestResults.Failed -eq 0) {
        Write-Host "`n🎉 All tests passed!" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️ Some tests failed. Please review the results above." -ForegroundColor Yellow
    }
}

# Main execution
if ($Help) {
    Show-Help
    exit 0
}

Write-Host "🧪 ManagerAgentAI API Gateway Test Suite" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

if ($All -or $Unit) {
    Test-GatewayInitialization
    Test-GatewayCommands
    Test-ServiceRegistry
    Test-GatewayConfiguration
    Test-JavaScriptVersion
}

if ($All -or $Integration) {
    Test-Integration
}

if ($All -or $Performance) {
    Test-Performance
}

if ($All -or $Security) {
    Test-Security
}

# If no specific tests selected, run all
if (-not ($All -or $Unit -or $Integration -or $Performance -or $Security)) {
    Test-GatewayInitialization
    Test-GatewayCommands
    Test-ServiceRegistry
    Test-GatewayConfiguration
    Test-JavaScriptVersion
    Test-Integration
    Test-Performance
    Test-Security
}

Show-TestSummary

# Exit with error code if any tests failed
if ($TestResults.Failed -gt 0) {
    exit 1
} else {
    exit 0
}
