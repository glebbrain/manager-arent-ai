# Advanced Compliance Enhanced v2.9 - Start Script
# GDPR, HIPAA, SOX compliance automation and monitoring

param(
    [string]$Action = "start",
    [int]$Port = 3000,
    [int]$Workers = 0,
    [switch]$Install,
    [switch]$Dev,
    [switch]$Cluster,
    [switch]$Status,
    [switch]$Health,
    [switch]$Metrics,
    [switch]$RunAssessment,
    [string]$Framework = "",
    [switch]$Help
)

$ErrorActionPreference = "Stop"

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

function Show-Header {
    Write-ColorOutput "`n🔒 Advanced Compliance Enhanced v2.9" -Color "Header"
    Write-ColorOutput "GDPR, HIPAA, SOX compliance automation and monitoring" -Color "Info"
    Write-ColorOutput "===============================================" -Color "Info"
}

function Show-Help {
    Show-Header
    Write-ColorOutput "`nUsage: .\start-compliance.ps1 [options]" -Color "Info"
    Write-ColorOutput "`nOptions:" -Color "Info"
    Write-ColorOutput "  -Action <action>     Action to perform (start, stop, restart, status)" -Color "Info"
    Write-ColorOutput "  -Port <port>         Port to run on (default: 3000)" -Color "Info"
    Write-ColorOutput "  -Workers <count>     Number of worker processes (0 = auto)" -Color "Info"
    Write-ColorOutput "  -Install             Install dependencies" -Color "Info"
    Write-ColorOutput "  -Dev                 Start in development mode" -Color "Info"
    Write-ColorOutput "  -Cluster             Start in cluster mode" -Color "Info"
    Write-ColorOutput "  -Status              Check compliance engine status" -Color "Info"
    Write-ColorOutput "  -Health              Check compliance engine health" -Color "Info"
    Write-ColorOutput "  -Metrics             Show compliance metrics" -Color "Info"
    Write-ColorOutput "  -RunAssessment       Run compliance assessment" -Color "Info"
    Write-ColorOutput "  -Framework <fw>      Compliance framework (gdpr, hipaa, sox)" -Color "Info"
    Write-ColorOutput "  -Help                Show this help message" -Color "Info"
    Write-ColorOutput "`nExamples:" -Color "Info"
    Write-ColorOutput "  .\start-compliance.ps1 -Install" -Color "Info"
    Write-ColorOutput "  .\start-compliance.ps1 -Action start -Port 3000" -Color "Info"
    Write-ColorOutput "  .\start-compliance.ps1 -Cluster -Workers 4" -Color "Info"
    Write-ColorOutput "  .\start-compliance.ps1 -RunAssessment -Framework gdpr" -Color "Info"
    Write-ColorOutput "  .\start-compliance.ps1 -Status" -Color "Info"
}

function Test-Prerequisites {
    Write-ColorOutput "`n🔍 Checking prerequisites..." -Color "Info"
    
    # Check Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Node.js found: $nodeVersion" -Color "Success"
        } else {
            Write-ColorOutput "❌ Node.js not found. Please install Node.js 16+ first." -Color "Error"
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ Node.js not found. Please install Node.js 16+ first." -Color "Error"
        return $false
    }
    
    # Check npm
    try {
        $npmVersion = npm --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ npm found: $npmVersion" -Color "Success"
        } else {
            Write-ColorOutput "❌ npm not found. Please install npm first." -Color "Error"
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ npm not found. Please install npm first." -Color "Error"
        return $false
    }
    
    # Check PostgreSQL (optional)
    try {
        psql --version 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ PostgreSQL found - Database features enabled" -Color "Success"
        } else {
            Write-ColorOutput "ℹ️ PostgreSQL not found - Using in-memory storage" -Color "Info"
        }
    }
    catch {
        Write-ColorOutput "ℹ️ PostgreSQL not found - Using in-memory storage" -Color "Info"
    }
    
    # Check Redis (optional)
    try {
        redis-cli ping 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Redis found - Caching features enabled" -Color "Success"
        } else {
            Write-ColorOutput "ℹ️ Redis not found - Using in-memory storage" -Color "Info"
        }
    }
    catch {
        Write-ColorOutput "ℹ️ Redis not found - Using in-memory storage" -Color "Info"
    }
    
    # Check Elasticsearch (optional)
    try {
        curl -s http://localhost:9200 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Elasticsearch found - Search features enabled" -Color "Success"
        } else {
            Write-ColorOutput "ℹ️ Elasticsearch not found - Using in-memory storage" -Color "Info"
        }
    }
    catch {
        Write-ColorOutput "ℹ️ Elasticsearch not found - Using in-memory storage" -Color "Info"
    }
    
    return $true
}

function Install-Compliance {
    Write-ColorOutput "`n📦 Installing Advanced Compliance Enhanced..." -Color "Info"
    
    if (-not (Test-Prerequisites)) {
        return $false
    }
    
    try {
        # Install dependencies
        Write-ColorOutput "Installing Node.js dependencies..." -Color "Info"
        npm install
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Dependencies installed successfully" -Color "Success"
        } else {
            Write-ColorOutput "❌ Failed to install dependencies" -Color "Error"
            return $false
        }
        
        # Create logs directory
        if (-not (Test-Path "logs")) {
            New-Item -ItemType Directory -Path "logs" -Force | Out-Null
            Write-ColorOutput "✅ Logs directory created" -Color "Success"
        }
        
        # Create config directory
        if (-not (Test-Path "config")) {
            New-Item -ItemType Directory -Path "config" -Force | Out-Null
            Write-ColorOutput "✅ Config directory created" -Color "Success"
        }
        
        return $true
    }
    catch {
        Write-ColorOutput "❌ Error installing Advanced Compliance: $_" -Color "Error"
        return $false
    }
}

function Start-Compliance {
    param(
        [int]$Port = 3000,
        [int]$Workers = 0,
        [switch]$Dev,
        [switch]$Cluster
    )
    
    Write-ColorOutput "`n🚀 Starting Advanced Compliance Enhanced..." -Color "Info"
    
    # Check if port is available
    $portInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($portInUse) {
        Write-ColorOutput "❌ Port $Port is already in use" -Color "Error"
        return $false
    }
    
    # Set environment variables
    $env:PORT = $Port
    $env:WORKERS = if ($Workers -gt 0) { $Workers } else { (Get-WmiObject -Class Win32_Processor).NumberOfCores }
    $env:NODE_ENV = if ($Dev) { "development" } else { "production" }
    
    try {
        if ($Cluster) {
            Write-ColorOutput "🔄 Starting in cluster mode with $($env:WORKERS) workers..." -Color "Info"
            Start-Process -FilePath "node" -ArgumentList "server.js" -NoNewWindow
        } elseif ($Dev) {
            Write-ColorOutput "🔧 Starting in development mode..." -Color "Info"
            Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow
        } else {
            Write-ColorOutput "🏭 Starting in production mode..." -Color "Info"
            Start-Process -FilePath "npm" -ArgumentList "start" -NoNewWindow
        }
        
        # Wait a moment for the server to start
        Start-Sleep -Seconds 3
        
        # Check if the server is running
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:$Port/health" -Method GET -TimeoutSec 5
            if ($response.status -eq "healthy") {
                Write-ColorOutput "✅ Advanced Compliance started successfully" -Color "Success"
                Write-ColorOutput "🔗 Compliance Engine URL: http://localhost:$Port" -Color "Info"
                Write-ColorOutput "📊 Frameworks URL: http://localhost:$Port/api/frameworks" -Color "Info"
                Write-ColorOutput "🔍 Violations URL: http://localhost:$Port/api/violations" -Color "Info"
            } else {
                Write-ColorOutput "❌ Advanced Compliance health check failed" -Color "Error"
                return $false
            }
        }
        catch {
            Write-ColorOutput "❌ Cannot connect to Advanced Compliance: $_" -Color "Error"
            return $false
        }
        
        return $true
    }
    catch {
        Write-ColorOutput "❌ Error starting Advanced Compliance: $_" -Color "Error"
        return $false
    }
}

function Stop-Compliance {
    Write-ColorOutput "`n🛑 Stopping Advanced Compliance Enhanced..." -Color "Info"
    
    try {
        # Find and kill Node.js processes running the compliance engine
        $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
            $_.CommandLine -like "*server.js*" -or $_.CommandLine -like "*compliance*"
        }
        
        if ($processes) {
            $processes | Stop-Process -Force
            Write-ColorOutput "✅ Advanced Compliance processes stopped" -Color "Success"
        } else {
            Write-ColorOutput "ℹ️ No Advanced Compliance processes found" -Color "Info"
        }
    }
    catch {
        Write-ColorOutput "❌ Error stopping Advanced Compliance: $_" -Color "Error"
    }
}

function Get-ComplianceStatus {
    Write-ColorOutput "`n📊 Advanced Compliance Status:" -Color "Info"
    
    try {
        # Check if compliance engine is running
        $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
            $_.CommandLine -like "*server.js*" -or $_.CommandLine -like "*compliance*"
        }
        
        if ($processes) {
            Write-ColorOutput "✅ Advanced Compliance is running" -Color "Success"
            Write-ColorOutput "   Process ID: $($processes.Id)" -Color "Info"
            Write-ColorOutput "   Port: $env:PORT" -Color "Info"
            Write-ColorOutput "   URL: http://localhost:$env:PORT" -Color "Info"
        } else {
            Write-ColorOutput "❌ Advanced Compliance is not running" -Color "Error"
        }
        
        # Check port status
        $portCheck = Get-NetTCPConnection -LocalPort $env:PORT -ErrorAction SilentlyContinue
        if ($portCheck) {
            Write-ColorOutput "✅ Port $($env:PORT) is listening" -Color "Success"
        } else {
            Write-ColorOutput "❌ Port $($env:PORT) is not listening" -Color "Error"
        }
    }
    catch {
        Write-ColorOutput "❌ Error checking status: $_" -Color "Error"
    }
}

function Test-ComplianceHealth {
    Write-ColorOutput "`n🏥 Testing Advanced Compliance health..." -Color "Info"
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$env:PORT/health" -Method GET -TimeoutSec 10
        if ($response.status -eq "healthy") {
            Write-ColorOutput "✅ Advanced Compliance is healthy" -Color "Success"
            Write-ColorOutput "   Version: $($response.version)" -Color "Info"
            Write-ColorOutput "   Uptime: $($response.uptime) seconds" -Color "Info"
            Write-ColorOutput "   Frameworks: $($response.frameworks.Count)" -Color "Info"
            Write-ColorOutput "   Active Assessments: $($response.activeAssessments)" -Color "Info"
            Write-ColorOutput "   Violations: $($response.violations)" -Color "Info"
            Write-ColorOutput "   Remediations: $($response.remediations)" -Color "Info"
        } else {
            Write-ColorOutput "❌ Advanced Compliance health check failed" -Color "Error"
        }
    }
    catch {
        Write-ColorOutput "❌ Cannot connect to Advanced Compliance: $_" -Color "Error"
    }
}

function Get-ComplianceMetrics {
    Write-ColorOutput "`n📈 Advanced Compliance Metrics:" -Color "Info"
    
    try {
        # Get frameworks
        $frameworks = Invoke-RestMethod -Uri "http://localhost:$env:PORT/api/frameworks" -Method GET -TimeoutSec 10
        
        Write-ColorOutput "📊 Compliance Frameworks:" -Color "Info"
        foreach ($framework in $frameworks) {
            Write-ColorOutput "   $($framework.name) ($($framework.type)): $($framework.controls) controls" -Color "Info"
        }
        
        # Get violations
        $violations = Invoke-RestMethod -Uri "http://localhost:$env:PORT/api/violations" -Method GET -TimeoutSec 10
        
        Write-ColorOutput "`n🚨 Violations:" -Color "Info"
        Write-ColorOutput "   Total Violations: $($violations.Count)" -Color "Info"
        
        $openViolations = $violations | Where-Object { $_.status -eq "open" }
        Write-ColorOutput "   Open Violations: $($openViolations.Count)" -Color "Info"
        
        $criticalViolations = $violations | Where-Object { $_.level -eq "critical" }
        Write-ColorOutput "   Critical Violations: $($criticalViolations.Count)" -Color "Info"
        
        # Get policies
        $policies = Invoke-RestMethod -Uri "http://localhost:$env:PORT/api/policies" -Method GET -TimeoutSec 10
        
        Write-ColorOutput "`n📋 Policies:" -Color "Info"
        Write-ColorOutput "   Total Policies: $($policies.Count)" -Color "Info"
        
        $activePolicies = $policies | Where-Object { $_.status -eq "active" }
        Write-ColorOutput "   Active Policies: $($activePolicies.Count)" -Color "Info"
    }
    catch {
        Write-ColorOutput "❌ Cannot retrieve metrics: $_" -Color "Error"
    }
}

function Run-ComplianceAssessment {
    param([string]$Framework = "")
    
    Write-ColorOutput "`n🔍 Running Compliance Assessment..." -Color "Info"
    
    if (-not $Framework) {
        Write-ColorOutput "❌ Please specify framework with -Framework parameter" -Color "Error"
        return $false
    }
    
    try {
        $assessmentData = @{
            frameworkId = $Framework
            scope = @{
                environment = "production"
                systems = @("all")
            }
            options = @{
                includeRemediation = $true
                generateReport = $true
            }
        } | ConvertTo-Json -Depth 3
        
        $response = Invoke-RestMethod -Uri "http://localhost:$env:PORT/api/assessments/run" -Method POST -Body $assessmentData -ContentType "application/json" -TimeoutSec 60
        
        if ($response) {
            Write-ColorOutput "✅ Compliance assessment completed" -Color "Success"
            Write-ColorOutput "   Assessment ID: $($response.id)" -Color "Info"
            Write-ColorOutput "   Framework: $($response.frameworkName)" -Color "Info"
            Write-ColorOutput "   Status: $($response.status)" -Color "Info"
            Write-ColorOutput "   Score: $($response.score)%" -Color "Info"
            Write-ColorOutput "   Violations: $($response.violations.Count)" -Color "Info"
            Write-ColorOutput "   Recommendations: $($response.recommendations.Count)" -Color "Info"
        } else {
            Write-ColorOutput "❌ Compliance assessment failed" -Color "Error"
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ Error running compliance assessment: $_" -Color "Error"
        return $false
    }
}

# Main execution
if ($Help) {
    Show-Help
    exit 0
}

Show-Header

# Set default port if not specified
if (-not $env:PORT) {
    $env:PORT = $Port
}

switch ($Action.ToLower()) {
    "install" {
        if (Install-Compliance) {
            Write-ColorOutput "`n✅ Installation completed successfully!" -Color "Success"
            Write-ColorOutput "Run '.\start-compliance.ps1 -Action start' to start the compliance engine" -Color "Info"
        } else {
            Write-ColorOutput "`n❌ Installation failed!" -Color "Error"
            exit 1
        }
    }
    
    "start" {
        if (Start-Compliance -Port $env:PORT -Workers $Workers -Dev:$Dev -Cluster:$Cluster) {
            Write-ColorOutput "`n✅ Advanced Compliance started successfully!" -Color "Success"
        } else {
            Write-ColorOutput "`n❌ Failed to start Advanced Compliance!" -Color "Error"
            exit 1
        }
    }
    
    "stop" {
        Stop-Compliance
    }
    
    "restart" {
        Stop-Compliance
        Start-Sleep -Seconds 2
        Start-Compliance -Port $env:PORT -Workers $Workers -Dev:$Dev -Cluster:$Cluster
    }
    
    "status" {
        Get-ComplianceStatus
    }
    
    "health" {
        Test-ComplianceHealth
    }
    
    "metrics" {
        Get-ComplianceMetrics
    }
    
    "runassessment" {
        if (Run-ComplianceAssessment -Framework $Framework) {
            Write-ColorOutput "`n✅ Compliance assessment completed successfully!" -Color "Success"
        } else {
            Write-ColorOutput "`n❌ Compliance assessment failed!" -Color "Error"
            exit 1
        }
    }
    
    default {
        Write-ColorOutput "❌ Unknown action: $Action" -Color "Error"
        Show-Help
        exit 1
    }
}

Write-ColorOutput "`n🎉 Operation completed!" -Color "Success"
