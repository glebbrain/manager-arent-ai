# Universal Automation Platform - Start Performance Monitoring
# Version: 2.2 - AI Enhanced

param(
    [Parameter(Mandatory=$false)]
    [int]$Interval = 10,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFile = "performance-metrics.json",
    
    [Parameter(Mandatory=$false)]
    [switch]$AutoStart,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Script configuration
$ScriptName = "Start-Performance-Monitoring"
$Version = "2.2.0"

# Logging function
function Write-Log {
    param(
        [string]$Message,
        [ValidateSet("INFO", "WARN", "ERROR", "DEBUG")]
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    if ($Verbose -or $Level -eq "ERROR") {
        Write-Host $logEntry
    }
    
    Add-Content -Path "performance-monitoring.log" -Value $logEntry -ErrorAction SilentlyContinue
}

# Check prerequisites
function Test-Prerequisites {
    Write-Log "Checking prerequisites..." "INFO"
    
    $prerequisites = @{
        NodeJS = $false
        PowerShell = $true
        PerformanceMetricsScript = $false
        DashboardServer = $false
    }
    
    # Check Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $prerequisites.NodeJS = $true
            Write-Log "✅ Node.js found: $nodeVersion" "INFO"
        } else {
            Write-Log "❌ Node.js not found" "ERROR"
        }
    }
    catch {
        Write-Log "❌ Node.js not found" "ERROR"
    }
    
    # Check PowerShell version
    $psVersion = $PSVersionTable.PSVersion
    if ($psVersion.Major -ge 5) {
        Write-Log "✅ PowerShell version: $($psVersion.ToString())" "INFO"
    } else {
        $prerequisites.PowerShell = $false
        Write-Log "❌ PowerShell version too old: $($psVersion.ToString())" "ERROR"
    }
    
    # Check performance metrics script
    if (Test-Path "scripts/performance-metrics.js") {
        $prerequisites.PerformanceMetricsScript = $true
        Write-Log "✅ Performance metrics script found" "INFO"
    } else {
        Write-Log "❌ Performance metrics script not found" "ERROR"
    }
    
    # Check dashboard server
    if (Test-Path "dashboard/server.js") {
        $prerequisites.DashboardServer = $true
        Write-Log "✅ Dashboard server found" "INFO"
    } else {
        Write-Log "❌ Dashboard server not found" "ERROR"
    }
    
    return $prerequisites
}

# Install Node.js dependencies
function Install-Dependencies {
    Write-Log "Installing Node.js dependencies..." "INFO"
    
    try {
        # Install dashboard dependencies
        if (Test-Path "dashboard/package.json") {
            Set-Location "dashboard"
            Write-Log "Installing dashboard dependencies..." "INFO"
            npm install --silent
            if ($LASTEXITCODE -eq 0) {
                Write-Log "✅ Dashboard dependencies installed" "INFO"
            } else {
                Write-Log "❌ Failed to install dashboard dependencies" "ERROR"
                return $false
            }
            Set-Location ".."
        }
        
        # Install performance metrics dependencies
        if (Test-Path "scripts/package.json") {
            Set-Location "scripts"
            Write-Log "Installing performance metrics dependencies..." "INFO"
            npm install --silent
            if ($LASTEXITCODE -eq 0) {
                Write-Log "✅ Performance metrics dependencies installed" "INFO"
            } else {
                Write-Log "❌ Failed to install performance metrics dependencies" "ERROR"
                return $false
            }
            Set-Location ".."
        }
        
        return $true
    }
    catch {
        Write-Log "Failed to install dependencies: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Start dashboard server
function Start-DashboardServer {
    Write-Log "Starting dashboard server..." "INFO"
    
    try {
        if (Test-Path "dashboard/server.js") {
            Set-Location "dashboard"
            
            # Start server in background
            $processInfo = New-Object System.Diagnostics.ProcessStartInfo
            $processInfo.FileName = "node"
            $processInfo.Arguments = "server.js"
            $processInfo.UseShellExecute = $false
            $processInfo.RedirectStandardOutput = $true
            $processInfo.RedirectStandardError = $true
            $processInfo.CreateNoWindow = $true
            
            $process = [System.Diagnostics.Process]::Start($processInfo)
            $processId = $process.Id
            
            # Store process ID
            Set-Content -Path "../dashboard-server.pid" -Value $processId
            
            Set-Location ".."
            
            Write-Log "✅ Dashboard server started with PID: $processId" "INFO"
            Write-Log "Dashboard available at: http://localhost:3000" "INFO"
            
            # Wait a moment for server to start
            Start-Sleep -Seconds 3
            
            return $true
        } else {
            Write-Log "❌ Dashboard server not found" "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "Failed to start dashboard server: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Start performance metrics collection
function Start-PerformanceMetrics {
    Write-Log "Starting performance metrics collection..." "INFO"
    
    try {
        # Use the performance metrics PowerShell script
        $result = & ".\scripts\performance-metrics.ps1" -Action "start" -OutputFile $OutputFile -Interval $Interval -Verbose:$Verbose
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Performance metrics collection started" "INFO"
            return $true
        } else {
            Write-Log "❌ Failed to start performance metrics collection" "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "Failed to start performance metrics: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Create monitoring dashboard shortcut
function Create-DashboardShortcut {
    Write-Log "Creating dashboard shortcut..." "INFO"
    
    try {
        $shortcutPath = "Performance-Dashboard.lnk"
        $targetPath = "http://localhost:3000"
        
        # Create VBScript to create shortcut
        $vbsScript = @"
Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = "$shortcutPath"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "$targetPath"
oLink.Description = "Universal Automation Platform - Performance Dashboard"
oLink.Save
"@
        
        $vbsScript | Set-Content "create-shortcut.vbs"
        cscript "create-shortcut.vbs" //NoLogo
        Remove-Item "create-shortcut.vbs" -Force
        
        Write-Log "✅ Dashboard shortcut created: $shortcutPath" "INFO"
        return $true
    }
    catch {
        Write-Log "Failed to create shortcut: $($_.Exception.Message)" "WARN"
        return $false
    }
}

# Create monitoring configuration
function Create-MonitoringConfig {
    Write-Log "Creating monitoring configuration..." "INFO"
    
    try {
        $config = @{
            version = "2.2.0"
            created = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            dashboard = @{
                enabled = $true
                port = 3000
                url = "http://localhost:3000"
            }
            metrics = @{
                enabled = $true
                interval = $Interval
                outputFile = $OutputFile
                historySize = 1000
            }
            features = @{
                systemMetrics = $true
                projectMetrics = $true
                gitMetrics = $true
                buildMetrics = $true
                developmentMetrics = $true
                qualityMetrics = $true
            }
        }
        
        $config | ConvertTo-Json -Depth 10 | Set-Content "monitoring-config.json"
        Write-Log "✅ Monitoring configuration created" "INFO"
        return $true
    }
    catch {
        Write-Log "Failed to create configuration: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Display status and instructions
function Show-StatusAndInstructions {
    Write-Host "`n🚀 Universal Automation Platform - Performance Monitoring Started" -ForegroundColor Green
    Write-Host "=" * 70 -ForegroundColor Green
    
    Write-Host "`n📊 Dashboard:" -ForegroundColor Cyan
    Write-Host "  URL: http://localhost:3000" -ForegroundColor White
    Write-Host "  Status: Running" -ForegroundColor Green
    
    Write-Host "`n📈 Performance Metrics:" -ForegroundColor Cyan
    Write-Host "  Collection: Active" -ForegroundColor Green
    Write-Host "  Interval: $Interval seconds" -ForegroundColor White
    Write-Host "  Output File: $OutputFile" -ForegroundColor White
    
    Write-Host "`n🛠️ Management Commands:" -ForegroundColor Cyan
    Write-Host "  Check Status: .\scripts\performance-metrics.ps1 -Action status" -ForegroundColor White
    Write-Host "  Stop Metrics: .\scripts\performance-metrics.ps1 -Action stop" -ForegroundColor White
    Write-Host "  Export Data: .\scripts\performance-metrics.ps1 -Action export" -ForegroundColor White
    Write-Host "  Analyze Data: .\scripts\performance-metrics.ps1 -Action analyze" -ForegroundColor White
    Write-Host "  Generate Report: .\scripts\performance-metrics.ps1 -Action report" -ForegroundColor White
    
    Write-Host "`n📁 Files Created:" -ForegroundColor Cyan
    Write-Host "  monitoring-config.json - Configuration file" -ForegroundColor White
    Write-Host "  performance-metrics.json - Metrics data" -ForegroundColor White
    Write-Host "  performance-monitoring.log - Log file" -ForegroundColor White
    Write-Host "  Performance-Dashboard.lnk - Dashboard shortcut" -ForegroundColor White
    
    Write-Host "`n💡 Tips:" -ForegroundColor Yellow
    Write-Host "  - Open the dashboard in your browser to see real-time metrics" -ForegroundColor White
    Write-Host "  - Use the management commands to control the monitoring" -ForegroundColor White
    Write-Host "  - Check the log file for detailed information" -ForegroundColor White
    Write-Host "  - The system will automatically collect metrics every $Interval seconds" -ForegroundColor White
    
    Write-Host "`n🛑 To Stop Monitoring:" -ForegroundColor Red
    Write-Host "  .\scripts\stop-performance-monitoring.ps1" -ForegroundColor White
    
    Write-Host "`n" + "=" * 70 -ForegroundColor Green
}

# Main execution
Write-Log "Starting $ScriptName v$Version" "INFO"

# Check prerequisites
$prerequisites = Test-Prerequisites
$allPrerequisitesMet = $prerequisites.Values -notcontains $false

if (-not $allPrerequisitesMet) {
    Write-Host "❌ Prerequisites not met. Please install missing components." -ForegroundColor Red
    Write-Host "Missing components:" -ForegroundColor Yellow
    foreach ($prereq in $prerequisites.GetEnumerator()) {
        if (-not $prereq.Value) {
            Write-Host "  - $($prereq.Key)" -ForegroundColor Red
        }
    }
    exit 1
}

Write-Host "✅ All prerequisites met" -ForegroundColor Green

# Install dependencies
if (-not (Install-Dependencies)) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Create configuration
if (-not (Create-MonitoringConfig)) {
    Write-Host "❌ Failed to create configuration" -ForegroundColor Red
    exit 1
}

# Start dashboard server
if (-not (Start-DashboardServer)) {
    Write-Host "❌ Failed to start dashboard server" -ForegroundColor Red
    exit 1
}

# Start performance metrics
if (-not (Start-PerformanceMetrics)) {
    Write-Host "❌ Failed to start performance metrics collection" -ForegroundColor Red
    exit 1
}

# Create dashboard shortcut
Create-DashboardShortcut | Out-Null

# Show status and instructions
Show-StatusAndInstructions

Write-Log "Performance monitoring setup completed successfully" "INFO"

# Auto-start dashboard if requested
if ($AutoStart) {
    Write-Host "`n🌐 Opening dashboard..." -ForegroundColor Cyan
    try {
        Start-Process "http://localhost:3000"
    }
    catch {
        Write-Log "Could not open dashboard automatically: $($_.Exception.Message)" "WARN"
    }
}
