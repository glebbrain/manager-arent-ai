# Cross-Platform Testing Script for ManagerAgentAI v2.5
# Comprehensive testing across Windows, Linux, and macOS

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "windows", "linux", "macos", "compatibility", "performance", "integration", "services")]
    [string]$Platform = "all",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose,
    
    [Parameter(Mandatory=$false)]
    [switch]$GenerateReport,
    
    [Parameter(Mandatory=$false)]
    [string]$ReportPath = "test-reports"
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Script configuration
$ScriptName = "Cross-Platform-Testing"
$Version = "2.5.0"
$LogFile = "cross-platform-test.log"

# Colors for output
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Header = "Magenta"
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
    
    if ($Verbose -or $Level -eq "ERROR") {
        Write-ColorOutput $logEntry -Color $Level.ToLower()
    }
    
    Add-Content -Path $LogFile -Value $logEntry -ErrorAction SilentlyContinue
}

function Show-Header {
    Write-ColorOutput "🧪 ManagerAgentAI Cross-Platform Testing v2.5" -Color Header
    Write-ColorOutput "=============================================" -Color Header
    Write-ColorOutput "Comprehensive testing across all platforms" -Color Info
    Write-ColorOutput ""
}

function Get-PlatformInfo {
    $platformInfo = @{
        OS = $null
        Platform = $null
        Architecture = $null
        PowerShellVersion = $null
        PowerShellEdition = $null
        PythonVersion = $null
        NodeVersion = $null
        GitVersion = $null
        TestDate = Get-Date
    }
    
    # Detect operating system
    if ($IsWindows) {
        $platformInfo.OS = "Windows"
        $platformInfo.Platform = "win32"
    } elseif ($IsLinux) {
        $platformInfo.OS = "Linux"
        $platformInfo.Platform = "linux"
    } elseif ($IsMacOS) {
        $platformInfo.OS = "macOS"
        $platformInfo.Platform = "darwin"
    } else {
        $platformInfo.OS = "Unknown"
        $platformInfo.Platform = "unknown"
    }
    
    # Detect architecture
    $platformInfo.Architecture = [System.Environment]::OSVersion.Platform.ToString()
    
    # Get PowerShell version
    $platformInfo.PowerShellVersion = $PSVersionTable.PSVersion.ToString()
    $platformInfo.PowerShellEdition = $PSVersionTable.PSEdition
    
    # Get Python version
    try {
        $pythonVersion = python --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $platformInfo.PythonVersion = $pythonVersion
        } else {
            $pythonVersion = python3 --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                $platformInfo.PythonVersion = $pythonVersion
            }
        }
    } catch {
        $platformInfo.PythonVersion = "Not found"
    }
    
    # Get Node.js version
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $platformInfo.NodeVersion = $nodeVersion
        }
    } catch {
        $platformInfo.NodeVersion = "Not found"
    }
    
    # Get Git version
    try {
        $gitVersion = git --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $platformInfo.GitVersion = $gitVersion
        }
    } catch {
        $platformInfo.GitVersion = "Not found"
    }
    
    return $platformInfo
}

function Test-PlatformCompatibility {
    Write-ColorOutput "Testing platform compatibility..." -Color Info
    Write-Log "Testing platform compatibility" "INFO"
    
    $compatibilityResults = @{
        PowerShell = $false
        Python = $false
        NodeJS = $false
        Git = $false
        Dependencies = $false
        Scripts = $false
        Services = $false
        Overall = $false
    }
    
    # Test PowerShell compatibility
    try {
        $psVersion = $PSVersionTable.PSVersion
        if ($psVersion.Major -ge 5) {
            $compatibilityResults.PowerShell = $true
            Write-ColorOutput "✅ PowerShell: Compatible ($psVersion)" -Color Success
            Write-Log "PowerShell compatibility: PASS ($psVersion)" "INFO"
        } else {
            Write-ColorOutput "❌ PowerShell: Incompatible ($psVersion)" -Color Error
            Write-Log "PowerShell compatibility: FAIL ($psVersion)" "ERROR"
        }
    } catch {
        Write-ColorOutput "❌ PowerShell: Test failed" -Color Error
        Write-Log "PowerShell compatibility test failed: $($_.Exception.Message)" "ERROR"
    }
    
    # Test Python compatibility
    try {
        $pythonVersion = python --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $compatibilityResults.Python = $true
            Write-ColorOutput "✅ Python: Compatible ($pythonVersion)" -Color Success
            Write-Log "Python compatibility: PASS ($pythonVersion)" "INFO"
        } else {
            $pythonVersion = python3 --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                $compatibilityResults.Python = $true
                Write-ColorOutput "✅ Python3: Compatible ($pythonVersion)" -Color Success
                Write-Log "Python3 compatibility: PASS ($pythonVersion)" "INFO"
            } else {
                Write-ColorOutput "❌ Python: Not found" -Color Error
                Write-Log "Python compatibility: FAIL (Not found)" "ERROR"
            }
        }
    } catch {
        Write-ColorOutput "❌ Python: Test failed" -Color Error
        Write-Log "Python compatibility test failed: $($_.Exception.Message)" "ERROR"
    }
    
    # Test Node.js compatibility
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $compatibilityResults.NodeJS = $true
            Write-ColorOutput "✅ Node.js: Compatible ($nodeVersion)" -Color Success
            Write-Log "Node.js compatibility: PASS ($nodeVersion)" "INFO"
        } else {
            Write-ColorOutput "❌ Node.js: Not found" -Color Error
            Write-Log "Node.js compatibility: FAIL (Not found)" "ERROR"
        }
    } catch {
        Write-ColorOutput "❌ Node.js: Test failed" -Color Error
        Write-Log "Node.js compatibility test failed: $($_.Exception.Message)" "ERROR"
    }
    
    # Test Git compatibility
    try {
        $gitVersion = git --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $compatibilityResults.Git = $true
            Write-ColorOutput "✅ Git: Compatible ($gitVersion)" -Color Success
            Write-Log "Git compatibility: PASS ($gitVersion)" "INFO"
        } else {
            Write-ColorOutput "❌ Git: Not found" -Color Error
            Write-Log "Git compatibility: FAIL (Not found)" "ERROR"
        }
    } catch {
        Write-ColorOutput "❌ Git: Test failed" -Color Error
        Write-Log "Git compatibility test failed: $($_.Exception.Message)" "ERROR"
    }
    
    # Test script compatibility
    $scripts = @(
        "scripts/auto-configurator.ps1",
        "scripts/performance-metrics.ps1",
        "scripts/task-distribution-manager.ps1",
        "scripts/cross-platform-utilities.ps1",
        "scripts/start-platform.ps1"
    )
    
    $scriptResults = @()
    foreach ($script in $scripts) {
        if (Test-Path $script) {
            try {
                pwsh -File $script -WhatIf 2>$null
                if ($LASTEXITCODE -eq 0) {
                    Write-ColorOutput "✅ $script - Compatible" -Color Success
                    $scriptResults += @{ Script = $script; Status = "Pass" }
                } else {
                    Write-ColorOutput "❌ $script - Failed" -Color Error
                    $scriptResults += @{ Script = $script; Status = "Fail" }
                }
            } catch {
                Write-ColorOutput "❌ $script - Error" -Color Error
                $scriptResults += @{ Script = $script; Status = "Error"; Error = $_.Exception.Message }
            }
        } else {
            Write-ColorOutput "⚠️ $script - Not found" -Color Warning
            $scriptResults += @{ Script = $script; Status = "NotFound" }
        }
    }
    
    $compatibilityResults.Scripts = ($scriptResults | Where-Object { $_.Status -eq "Pass" }).Count -gt 0
    $compatibilityResults.Dependencies = $compatibilityResults.PowerShell -and $compatibilityResults.Python -and $compatibilityResults.NodeJS -and $compatibilityResults.Git
    $compatibilityResults.Overall = $compatibilityResults.PowerShell -and $compatibilityResults.NodeJS -and $compatibilityResults.Scripts
    
    return $compatibilityResults
}

function Test-ServiceCompatibility {
    Write-ColorOutput "Testing service compatibility..." -Color Info
    Write-Log "Testing service compatibility" "INFO"
    
    $serviceResults = @{
        APIGateway = $false
        EventBus = $false
        Microservices = $false
        Dashboard = $false
        Notifications = $false
        Forecasting = $false
        Benchmarking = $false
        DataExport = $false
        DeadlinePrediction = $false
        SprintPlanning = $false
        TaskDistribution = $false
        TaskDependency = $false
        StatusUpdates = $false
        Overall = $false
    }
    
    $services = @(
        @{ Name = "API Gateway"; Path = "api-gateway/server.js" },
        @{ Name = "Event Bus"; Path = "event-bus/server.js" },
        @{ Name = "Microservices"; Path = "microservices/server.js" },
        @{ Name = "Dashboard"; Path = "dashboard/server.js" },
        @{ Name = "Smart Notifications"; Path = "smart-notifications/server.js" },
        @{ Name = "Forecasting"; Path = "forecasting/server.js" },
        @{ Name = "Benchmarking"; Path = "benchmarking/server.js" },
        @{ Name = "Data Export"; Path = "data-export/server.js" },
        @{ Name = "Deadline Prediction"; Path = "deadline-prediction/server.js" },
        @{ Name = "Sprint Planning"; Path = "sprint-planning/server.js" },
        @{ Name = "Task Distribution"; Path = "task-distribution/server.js" },
        @{ Name = "Task Dependency Management"; Path = "task-dependency-management/server.js" },
        @{ Name = "Automatic Status Updates"; Path = "automatic-status-updates/server.js" }
    )
    
    $startedServices = 0
    $totalServices = $services.Count
    
    foreach ($service in $services) {
        if (Test-Path $service.Path) {
            try {
                # Test if service can start (dry run)
                $env:PORT = 3000
                $process = Start-Process -FilePath "node" -ArgumentList $service.Path -NoNewWindow -PassThru
                Start-Sleep -Seconds 2
                
                if (-not $process.HasExited) {
                    $process.Kill()
                    $serviceResults.($service.Name.Replace(" ", "")) = $true
                    $startedServices++
                    Write-ColorOutput "✅ $($service.Name) - Compatible" -Color Success
                    Write-Log "$($service.Name) compatibility: PASS" "INFO"
                } else {
                    Write-ColorOutput "❌ $($service.Name) - Failed to start" -Color Error
                    Write-Log "$($service.Name) compatibility: FAIL (Failed to start)" "ERROR"
                }
            } catch {
                Write-ColorOutput "❌ $($service.Name) - Error" -Color Error
                Write-Log "$($service.Name) compatibility: FAIL ($($_.Exception.Message))" "ERROR"
            }
        } else {
            Write-ColorOutput "⚠️ $($service.Name) - Not found" -Color Warning
            Write-Log "$($service.Name) compatibility: FAIL (Not found)" "WARN"
        }
    }
    
    $serviceResults.Overall = $startedServices -gt 0
    $serviceResults.StartedServices = $startedServices
    $serviceResults.TotalServices = $totalServices
    
    return $serviceResults
}

function Test-PerformanceCompatibility {
    Write-ColorOutput "Testing performance compatibility..." -Color Info
    Write-Log "Testing performance compatibility" "INFO"
    
    $performanceResults = @{
        ScriptExecution = $false
        ServiceStartup = $false
        MemoryUsage = $false
        CPUUsage = $false
        Overall = $false
    }
    
    # Test script execution performance
    try {
        $startTime = Get-Date
        pwsh -File "scripts/cross-platform-utilities.ps1" -Action info 2>$null
        $endTime = Get-Date
        $executionTime = ($endTime - $startTime).TotalSeconds
        
        if ($executionTime -lt 10) {
            $performanceResults.ScriptExecution = $true
            Write-ColorOutput "✅ Script Execution: Good ($([math]::Round($executionTime, 2))s)" -Color Success
            Write-Log "Script execution performance: PASS ($executionTime seconds)" "INFO"
        } else {
            Write-ColorOutput "⚠️ Script Execution: Slow ($([math]::Round($executionTime, 2))s)" -Color Warning
            Write-Log "Script execution performance: WARN ($executionTime seconds)" "WARN"
        }
    } catch {
        Write-ColorOutput "❌ Script Execution: Test failed" -Color Error
        Write-Log "Script execution performance test failed: $($_.Exception.Message)" "ERROR"
    }
    
    # Test memory usage
    try {
        $memoryUsage = [System.GC]::GetTotalMemory($false) / 1MB
        if ($memoryUsage -lt 100) {
            $performanceResults.MemoryUsage = $true
            Write-ColorOutput "✅ Memory Usage: Good ($([math]::Round($memoryUsage, 2))MB)" -Color Success
            Write-Log "Memory usage performance: PASS ($memoryUsage MB)" "INFO"
        } else {
            Write-ColorOutput "⚠️ Memory Usage: High ($([math]::Round($memoryUsage, 2))MB)" -Color Warning
            Write-Log "Memory usage performance: WARN ($memoryUsage MB)" "WARN"
        }
    } catch {
        Write-ColorOutput "❌ Memory Usage: Test failed" -Color Error
        Write-Log "Memory usage performance test failed: $($_.Exception.Message)" "ERROR"
    }
    
    $performanceResults.Overall = $performanceResults.ScriptExecution -and $performanceResults.MemoryUsage
    
    return $performanceResults
}

function Test-IntegrationCompatibility {
    Write-ColorOutput "Testing integration compatibility..." -Color Info
    Write-Log "Testing integration compatibility" "INFO"
    
    $integrationResults = @{
        PowerShellModules = $false
        NodeModules = $false
        PythonPackages = $false
        GitIntegration = $false
        FileSystem = $false
        Network = $false
        Overall = $false
    }
    
    # Test PowerShell module integration
    try {
        $modules = Get-Module -ListAvailable
        if ($modules.Count -gt 0) {
            $integrationResults.PowerShellModules = $true
            Write-ColorOutput "✅ PowerShell Modules: Available ($($modules.Count) modules)" -Color Success
            Write-Log "PowerShell modules integration: PASS ($($modules.Count) modules)" "INFO"
        } else {
            Write-ColorOutput "⚠️ PowerShell Modules: None found" -Color Warning
            Write-Log "PowerShell modules integration: WARN (No modules found)" "WARN"
        }
    } catch {
        Write-ColorOutput "❌ PowerShell Modules: Test failed" -Color Error
        Write-Log "PowerShell modules integration test failed: $($_.Exception.Message)" "ERROR"
    }
    
    # Test Node.js module integration
    try {
        if (Test-Path "package.json") {
            $packageJson = Get-Content "package.json" | ConvertFrom-Json
            if ($packageJson.dependencies -or $packageJson.devDependencies) {
                $integrationResults.NodeModules = $true
                Write-ColorOutput "✅ Node.js Modules: Available" -Color Success
                Write-Log "Node.js modules integration: PASS" "INFO"
            } else {
                Write-ColorOutput "⚠️ Node.js Modules: No dependencies found" -Color Warning
                Write-Log "Node.js modules integration: WARN (No dependencies)" "WARN"
            }
        } else {
            Write-ColorOutput "⚠️ Node.js Modules: No package.json found" -Color Warning
            Write-Log "Node.js modules integration: WARN (No package.json)" "WARN"
        }
    } catch {
        Write-ColorOutput "❌ Node.js Modules: Test failed" -Color Error
        Write-Log "Node.js modules integration test failed: $($_.Exception.Message)" "ERROR"
    }
    
    # Test file system integration
    try {
        $testFile = "test-integration.tmp"
        "test" | Out-File -FilePath $testFile
        if (Test-Path $testFile) {
            Remove-Item $testFile
            $integrationResults.FileSystem = $true
            Write-ColorOutput "✅ File System: Working" -Color Success
            Write-Log "File system integration: PASS" "INFO"
        } else {
            Write-ColorOutput "❌ File System: Not working" -Color Error
            Write-Log "File system integration: FAIL" "ERROR"
        }
    } catch {
        Write-ColorOutput "❌ File System: Test failed" -Color Error
        Write-Log "File system integration test failed: $($_.Exception.Message)" "ERROR"
    }
    
    $integrationResults.Overall = $integrationResults.PowerShellModules -and $integrationResults.FileSystem
    
    return $integrationResults
}

function Generate-TestReport {
    param(
        [hashtable]$PlatformInfo,
        [hashtable]$CompatibilityResults,
        [hashtable]$ServiceResults,
        [hashtable]$PerformanceResults,
        [hashtable]$IntegrationResults,
        [string]$ReportPath
    )
    
    Write-ColorOutput "Generating test report..." -Color Info
    Write-Log "Generating test report to: $ReportPath" "INFO"
    
    try {
        # Create report directory
        if (-not (Test-Path $ReportPath)) {
            New-Item -ItemType Directory -Path $ReportPath -Force
        }
        
        $reportFile = Join-Path $ReportPath "cross-platform-test-report-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').html"
        
        $htmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <title>ManagerAgentAI Cross-Platform Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .test-result { margin: 10px 0; padding: 10px; border-radius: 3px; }
        .pass { background-color: #d4edda; color: #155724; }
        .fail { background-color: #f8d7da; color: #721c24; }
        .warn { background-color: #fff3cd; color: #856404; }
        .summary { background-color: #e2e3e5; padding: 15px; border-radius: 5px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 ManagerAgentAI Cross-Platform Test Report</h1>
        <p><strong>Generated:</strong> $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</p>
        <p><strong>Platform:</strong> $($PlatformInfo.OS) ($($PlatformInfo.Platform))</p>
        <p><strong>Architecture:</strong> $($PlatformInfo.Architecture)</p>
    </div>
    
    <div class="section">
        <h2>Platform Information</h2>
        <table>
            <tr><th>Component</th><th>Version</th><th>Status</th></tr>
            <tr><td>PowerShell</td><td>$($PlatformInfo.PowerShellVersion)</td><td>$($PlatformInfo.PowerShellEdition)</td></tr>
            <tr><td>Python</td><td>$($PlatformInfo.PythonVersion)</td><td>$(if ($CompatibilityResults.Python) { '✅' } else { '❌' })</td></tr>
            <tr><td>Node.js</td><td>$($PlatformInfo.NodeVersion)</td><td>$(if ($CompatibilityResults.NodeJS) { '✅' } else { '❌' })</td></tr>
            <tr><td>Git</td><td>$($PlatformInfo.GitVersion)</td><td>$(if ($CompatibilityResults.Git) { '✅' } else { '❌' })</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Compatibility Test Results</h2>
        <div class="test-result $(if ($CompatibilityResults.PowerShell) { 'pass' } else { 'fail' })">
            PowerShell: $(if ($CompatibilityResults.PowerShell) { '✅ PASS' } else { '❌ FAIL' })
        </div>
        <div class="test-result $(if ($CompatibilityResults.Python) { 'pass' } else { 'fail' })">
            Python: $(if ($CompatibilityResults.Python) { '✅ PASS' } else { '❌ FAIL' })
        </div>
        <div class="test-result $(if ($CompatibilityResults.NodeJS) { 'pass' } else { 'fail' })">
            Node.js: $(if ($CompatibilityResults.NodeJS) { '✅ PASS' } else { '❌ FAIL' })
        </div>
        <div class="test-result $(if ($CompatibilityResults.Git) { 'pass' } else { 'fail' })">
            Git: $(if ($CompatibilityResults.Git) { '✅ PASS' } else { '❌ FAIL' })
        </div>
        <div class="test-result $(if ($CompatibilityResults.Scripts) { 'pass' } else { 'fail' })">
            Scripts: $(if ($CompatibilityResults.Scripts) { '✅ PASS' } else { '❌ FAIL' })
        </div>
    </div>
    
    <div class="section">
        <h2>Service Test Results</h2>
        <p><strong>Services Started:</strong> $($ServiceResults.StartedServices) / $($ServiceResults.TotalServices)</p>
        <p><strong>Success Rate:</strong> $([math]::Round(($ServiceResults.StartedServices / $ServiceResults.TotalServices) * 100, 2))%</p>
    </div>
    
    <div class="section">
        <h2>Performance Test Results</h2>
        <div class="test-result $(if ($PerformanceResults.ScriptExecution) { 'pass' } else { 'warn' })">
            Script Execution: $(if ($PerformanceResults.ScriptExecution) { '✅ PASS' } else { '⚠️ WARN' })
        </div>
        <div class="test-result $(if ($PerformanceResults.MemoryUsage) { 'pass' } else { 'warn' })">
            Memory Usage: $(if ($PerformanceResults.MemoryUsage) { '✅ PASS' } else { '⚠️ WARN' })
        </div>
    </div>
    
    <div class="section">
        <h2>Integration Test Results</h2>
        <div class="test-result $(if ($IntegrationResults.PowerShellModules) { 'pass' } else { 'warn' })">
            PowerShell Modules: $(if ($IntegrationResults.PowerShellModules) { '✅ PASS' } else { '⚠️ WARN' })
        </div>
        <div class="test-result $(if ($IntegrationResults.NodeModules) { 'pass' } else { 'warn' })">
            Node.js Modules: $(if ($IntegrationResults.NodeModules) { '✅ PASS' } else { '⚠️ WARN' })
        </div>
        <div class="test-result $(if ($IntegrationResults.FileSystem) { 'pass' } else { 'fail' })">
            File System: $(if ($IntegrationResults.FileSystem) { '✅ PASS' } else { '❌ FAIL' })
        </div>
    </div>
    
    <div class="summary">
        <h2>Overall Test Summary</h2>
        <p><strong>Platform Compatibility:</strong> $(if ($CompatibilityResults.Overall) { '✅ PASS' } else { '❌ FAIL' })</p>
        <p><strong>Service Compatibility:</strong> $(if ($ServiceResults.Overall) { '✅ PASS' } else { '❌ FAIL' })</p>
        <p><strong>Performance:</strong> $(if ($PerformanceResults.Overall) { '✅ PASS' } else { '⚠️ WARN' })</p>
        <p><strong>Integration:</strong> $(if ($IntegrationResults.Overall) { '✅ PASS' } else { '❌ FAIL' })</p>
    </div>
</body>
</html>
"@
        
        $htmlContent | Out-File -FilePath $reportFile -Encoding UTF8
        Write-ColorOutput "✅ Test report generated: $reportFile" -Color Success
        Write-Log "Test report generated successfully: $reportFile" "INFO"
        
        return $reportFile
    } catch {
        Write-ColorOutput "❌ Failed to generate test report" -Color Error
        Write-Log "Failed to generate test report: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

function Show-Usage {
    Write-ColorOutput "Usage: .\cross-platform-testing.ps1 -Platform <platform> [options]" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Platforms:" -Color Info
    Write-ColorOutput "  all           - Test all platforms" -Color Info
    Write-ColorOutput "  windows       - Test Windows compatibility" -Color Info
    Write-ColorOutput "  linux         - Test Linux compatibility" -Color Info
    Write-ColorOutput "  macos         - Test macOS compatibility" -Color Info
    Write-ColorOutput "  compatibility - Test platform compatibility only" -Color Info
    Write-ColorOutput "  performance   - Test performance only" -Color Info
    Write-ColorOutput "  integration   - Test integration only" -Color Info
    Write-ColorOutput "  services      - Test services only" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Options:" -Color Info
    Write-ColorOutput "  -Verbose      - Show detailed output" -Color Info
    Write-ColorOutput "  -GenerateReport - Generate HTML test report" -Color Info
    Write-ColorOutput "  -ReportPath   - Path for test reports (default: test-reports)" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" -Color Info
    Write-ColorOutput "  .\cross-platform-testing.ps1 -Platform all" -Color Info
    Write-ColorOutput "  .\cross-platform-testing.ps1 -Platform windows -Verbose" -Color Info
    Write-ColorOutput "  .\cross-platform-testing.ps1 -Platform all -GenerateReport" -Color Info
}

# Main execution
function Main {
    Show-Header
    
    # Get platform information
    $platformInfo = Get-PlatformInfo
    Write-ColorOutput "Testing on: $($platformInfo.OS) ($($platformInfo.Platform))" -Color Info
    Write-Log "Testing on platform: $($platformInfo.OS) ($($platformInfo.Platform))" "INFO"
    
    $testResults = @{
        PlatformInfo = $platformInfo
        Compatibility = $null
        Services = $null
        Performance = $null
        Integration = $null
    }
    
    # Run tests based on platform parameter
    switch ($Platform) {
        "all" {
            Write-ColorOutput "Running comprehensive cross-platform tests..." -Color Info
            $testResults.Compatibility = Test-PlatformCompatibility
            $testResults.Services = Test-ServiceCompatibility
            $testResults.Performance = Test-PerformanceCompatibility
            $testResults.Integration = Test-IntegrationCompatibility
        }
        "compatibility" {
            Write-ColorOutput "Running compatibility tests..." -Color Info
            $testResults.Compatibility = Test-PlatformCompatibility
        }
        "services" {
            Write-ColorOutput "Running service tests..." -Color Info
            $testResults.Services = Test-ServiceCompatibility
        }
        "performance" {
            Write-ColorOutput "Running performance tests..." -Color Info
            $testResults.Performance = Test-PerformanceCompatibility
        }
        "integration" {
            Write-ColorOutput "Running integration tests..." -Color Info
            $testResults.Integration = Test-IntegrationCompatibility
        }
        default {
            Write-ColorOutput "Running platform-specific tests for $Platform..." -Color Info
            $testResults.Compatibility = Test-PlatformCompatibility
            $testResults.Services = Test-ServiceCompatibility
        }
    }
    
    # Generate report if requested
    if ($GenerateReport) {
        $reportFile = Generate-TestReport -PlatformInfo $platformInfo -CompatibilityResults $testResults.Compatibility -ServiceResults $testResults.Services -PerformanceResults $testResults.Performance -IntegrationResults $testResults.Integration -ReportPath $ReportPath
        if ($reportFile) {
            Write-ColorOutput "📊 Test report available at: $reportFile" -Color Success
        }
    }
    
    # Show summary
    Write-ColorOutput ""
    Write-ColorOutput "Test Summary:" -Color Header
    Write-ColorOutput "============" -Color Header
    
    if ($testResults.Compatibility) {
        $totalTests = $testResults.Compatibility.Count
        $passedTests = ($testResults.Compatibility.Values | Where-Object { $_ -eq $true }).Count
        Write-ColorOutput "Compatibility: $passedTests/$totalTests tests passed" -Color $(if ($passedTests -eq $totalTests) { "Success" } else { "Warning" })
    }
    
    if ($testResults.Services) {
        Write-ColorOutput "Services: $($testResults.Services.StartedServices)/$($testResults.Services.TotalServices) services started" -Color $(if ($testResults.Services.Overall) { "Success" } else { "Warning" })
    }
    
    if ($testResults.Performance) {
        Write-ColorOutput "Performance: $(if ($testResults.Performance.Overall) { 'PASS' } else { 'WARN' })" -Color $(if ($testResults.Performance.Overall) { "Success" } else { "Warning" })
    }
    
    if ($testResults.Integration) {
        Write-ColorOutput "Integration: $(if ($testResults.Integration.Overall) { 'PASS' } else { 'FAIL' })" -Color $(if ($testResults.Integration.Overall) { "Success" } else { "Error" })
    }
    
    Write-Log "Cross-platform testing completed for platform: $Platform" "INFO"
}

# Run main function
Main
