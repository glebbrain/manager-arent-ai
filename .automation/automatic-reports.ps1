# Universal Automation Platform - Automatic Reports Management
# Version: 2.2 - AI Enhanced

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "generate", "status", "schedule", "config")]
    [string]$Action = "start",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputDir = "reports",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("html", "json", "pdf", "all")]
    [string]$Format = "all",
    
    [Parameter(Mandatory=$false)]
    [string]$Schedule = "daily",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Script configuration
$ScriptName = "Automatic-Reports"
$Version = "2.2.0"
$LogFile = "automatic-reports.log"

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
    
    Add-Content -Path $LogFile -Value $logEntry -ErrorAction SilentlyContinue
}

# Check prerequisites
function Test-Prerequisites {
    Write-Log "Checking prerequisites..." "INFO"
    
    $prerequisites = @{
        NodeJS = $false
        ReportsScript = $false
        OutputDir = $false
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
    
    # Check reports script
    if (Test-Path "scripts/automatic-reports.js") {
        $prerequisites.ReportsScript = $true
        Write-Log "✅ Automatic reports script found" "INFO"
    } else {
        Write-Log "❌ Automatic reports script not found" "ERROR"
    }
    
    # Check/create output directory
    if (-not (Test-Path $OutputDir)) {
        try {
            New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
            Write-Log "✅ Created output directory: $OutputDir" "INFO"
            $prerequisites.OutputDir = $true
        }
        catch {
            Write-Log "❌ Failed to create output directory: $($_.Exception.Message)" "ERROR"
        }
    } else {
        $prerequisites.OutputDir = $true
        Write-Log "✅ Output directory exists: $OutputDir" "INFO"
    }
    
    return $prerequisites
}

# Start automatic reports generation
function Start-AutomaticReports {
    Write-Log "Starting automatic reports generation..." "INFO"
    
    if (-not (Test-Prerequisites).NodeJS) {
        Write-Log "Cannot start without Node.js" "ERROR"
        return $false
    }
    
    try {
        # Start the Node.js reports generator in background
        $processArgs = @(
            "scripts/automatic-reports.js",
            "start"
        )
        
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = "node"
        $processInfo.Arguments = $processArgs -join " "
        $processInfo.UseShellExecute = $false
        $processInfo.RedirectStandardOutput = $true
        $processInfo.RedirectStandardError = $true
        $processInfo.CreateNoWindow = $true
        
        $process = [System.Diagnostics.Process]::Start($processInfo)
        $processId = $process.Id
        
        # Store process ID for later reference
        Set-Content -Path "automatic-reports.pid" -Value $processId
        
        Write-Log "Automatic reports generation started with PID: $processId" "INFO"
        Write-Log "Output directory: $OutputDir" "INFO"
        
        return $true
    }
    catch {
        Write-Log "Failed to start automatic reports: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Stop automatic reports generation
function Stop-AutomaticReports {
    Write-Log "Stopping automatic reports generation..." "INFO"
    
    try {
        if (Test-Path "automatic-reports.pid") {
            $processId = Get-Content "automatic-reports.pid"
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            
            if ($process) {
                $process.Kill()
                Write-Log "Stopped process with PID: $processId" "INFO"
            } else {
                Write-Log "Process with PID $processId not found" "WARN"
            }
            
            Remove-Item "automatic-reports.pid" -Force -ErrorAction SilentlyContinue
        } else {
            Write-Log "No PID file found. Attempting to find and stop Node.js processes..." "WARN"
            
            # Try to find and stop Node.js processes running automatic-reports.js
            $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
                $_.CommandLine -like "*automatic-reports.js*"
            }
            
            foreach ($process in $processes) {
                $process.Kill()
                Write-Log "Stopped Node.js process with PID: $($process.Id)" "INFO"
            }
        }
        
        return $true
    }
    catch {
        Write-Log "Failed to stop automatic reports: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Generate reports manually
function Generate-Reports {
    Write-Log "Generating reports manually..." "INFO"
    
    try {
        $result = & "node" "scripts/automatic-reports.js" "generate"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Reports generated successfully" "INFO"
            return $true
        } else {
            Write-Log "Failed to generate reports" "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "Failed to generate reports: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Get status of automatic reports
function Get-AutomaticReportsStatus {
    Write-Log "Checking automatic reports status..." "INFO"
    
    $status = @{
        Running = $false
        ProcessId = $null
        OutputDir = $OutputDir
        ReportCount = 0
        LastGenerated = $null
    }
    
    try {
        # Check if process is running
        if (Test-Path "automatic-reports.pid") {
            $processId = Get-Content "automatic-reports.pid"
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            
            if ($process) {
                $status.Running = $true
                $status.ProcessId = $processId
            }
        }
        
        # Check output directory
        if (Test-Path $OutputDir) {
            $reports = Get-ChildItem -Path $OutputDir -Filter "*.html" -ErrorAction SilentlyContinue
            $status.ReportCount = $reports.Count
            
            if ($reports.Count -gt 0) {
                $latestReport = $reports | Sort-Object LastWriteTime -Descending | Select-Object -First 1
                $status.LastGenerated = $latestReport.LastWriteTime
            }
        }
        
        # Display status
        Write-Host "`n📊 Automatic Reports Status:" -ForegroundColor Cyan
        Write-Host "Running: $($status.Running)" -ForegroundColor $(if ($status.Running) { "Green" } else { "Red" })
        Write-Host "Process ID: $($status.ProcessId)" -ForegroundColor Yellow
        Write-Host "Output Directory: $($status.OutputDir)" -ForegroundColor Yellow
        Write-Host "Report Count: $($status.ReportCount)" -ForegroundColor Yellow
        Write-Host "Last Generated: $($status.LastGenerated)" -ForegroundColor Yellow
        
        return $status
    }
    catch {
        Write-Log "Failed to get status: $($_.Exception.Message)" "ERROR"
        return $status
    }
}

# Configure automatic reports
function Set-AutomaticReportsConfig {
    Write-Log "Configuring automatic reports..." "INFO"
    
    try {
        $config = @{
            version = "2.2.0"
            outputDir = $OutputDir
            formats = if ($Format -eq "all") { @("html", "json") } else { @($Format) }
            schedules = @{
                daily = @{
                    enabled = $true
                    cron = "0 9 * * *"
                    template = "daily"
                }
                weekly = @{
                    enabled = $true
                    cron = "0 10 * * 1"
                    template = "weekly"
                }
                monthly = @{
                    enabled = $true
                    cron = "0 11 1 * *"
                    template = "monthly"
                }
            }
            email = @{
                enabled = $false
                smtp = ""
                to = ""
                from = ""
            }
            webhook = @{
                enabled = $false
                url = ""
            }
        }
        
        $config | ConvertTo-Json -Depth 10 | Set-Content "automatic-reports-config.json"
        Write-Log "Configuration saved to automatic-reports-config.json" "INFO"
        
        Write-Host "`n📋 Automatic Reports Configuration:" -ForegroundColor Cyan
        Write-Host "Output Directory: $($config.outputDir)" -ForegroundColor White
        Write-Host "Formats: $($config.formats -join ', ')" -ForegroundColor White
        Write-Host "Schedules:" -ForegroundColor White
        Write-Host "  Daily: $($config.schedules.daily.enabled) (${config.schedules.daily.cron})" -ForegroundColor White
        Write-Host "  Weekly: $($config.schedules.weekly.enabled) (${config.schedules.weekly.cron})" -ForegroundColor White
        Write-Host "  Monthly: $($config.schedules.monthly.enabled) (${config.schedules.monthly.cron})" -ForegroundColor White
        
        return $true
    }
    catch {
        Write-Log "Failed to configure automatic reports: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Show available reports
function Show-AvailableReports {
    Write-Log "Showing available reports..." "INFO"
    
    if (-not (Test-Path $OutputDir)) {
        Write-Host "No reports directory found" -ForegroundColor Yellow
        return
    }
    
    $reports = Get-ChildItem -Path $OutputDir -Filter "*.html" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
    
    if ($reports.Count -eq 0) {
        Write-Host "No reports found in $OutputDir" -ForegroundColor Yellow
        return
    }
    
    Write-Host "`n📊 Available Reports:" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor Cyan
    
    foreach ($report in $reports) {
        $size = [math]::Round($report.Length / 1KB, 2)
        Write-Host "📄 $($report.Name)" -ForegroundColor White
        Write-Host "   Size: ${size}KB" -ForegroundColor Gray
        Write-Host "   Created: $($report.CreationTime)" -ForegroundColor Gray
        Write-Host "   Modified: $($report.LastWriteTime)" -ForegroundColor Gray
        Write-Host ""
    }
    
    Write-Host "Total Reports: $($reports.Count)" -ForegroundColor Green
}

# Open latest report
function Open-LatestReport {
    Write-Log "Opening latest report..." "INFO"
    
    if (-not (Test-Path $OutputDir)) {
        Write-Host "No reports directory found" -ForegroundColor Yellow
        return
    }
    
    $latestReport = Get-ChildItem -Path $OutputDir -Filter "*.html" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    
    if ($latestReport) {
        try {
            Start-Process $latestReport.FullName
            Write-Log "Opened latest report: $($latestReport.Name)" "INFO"
        }
        catch {
            Write-Log "Failed to open report: $($_.Exception.Message)" "ERROR"
        }
    } else {
        Write-Host "No reports found to open" -ForegroundColor Yellow
    }
}

# Main execution
Write-Log "Starting $ScriptName v$Version" "INFO"

switch ($Action.ToLower()) {
    "start" {
        if (Start-AutomaticReports) {
            Write-Host "✅ Automatic reports generation started successfully" -ForegroundColor Green
            Write-Host "📊 Reports will be generated in: $OutputDir" -ForegroundColor Cyan
        } else {
            Write-Host "❌ Failed to start automatic reports generation" -ForegroundColor Red
            exit 1
        }
    }
    "stop" {
        if (Stop-AutomaticReports) {
            Write-Host "✅ Automatic reports generation stopped successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to stop automatic reports generation" -ForegroundColor Red
            exit 1
        }
    }
    "generate" {
        if (Generate-Reports) {
            Write-Host "✅ Reports generated successfully" -ForegroundColor Green
            Show-AvailableReports
        } else {
            Write-Host "❌ Failed to generate reports" -ForegroundColor Red
            exit 1
        }
    }
    "status" {
        Get-AutomaticReportsStatus
        Show-AvailableReports
    }
    "config" {
        if (Set-AutomaticReportsConfig) {
            Write-Host "✅ Configuration saved successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to save configuration" -ForegroundColor Red
            exit 1
        }
    }
    "schedule" {
        Write-Host "📅 Available Schedules:" -ForegroundColor Cyan
        Write-Host "  daily   - Generate daily reports at 9 AM" -ForegroundColor White
        Write-Host "  weekly  - Generate weekly reports on Monday at 10 AM" -ForegroundColor White
        Write-Host "  monthly - Generate monthly reports on 1st at 11 AM" -ForegroundColor White
        Write-Host "`nCurrent schedule: $Schedule" -ForegroundColor Yellow
    }
    default {
        Write-Host "Usage: .\automatic-reports.ps1 -Action [start|stop|generate|status|config|schedule]" -ForegroundColor Yellow
        Write-Host "`nAvailable actions:" -ForegroundColor Cyan
        Write-Host "  start    - Start automatic reports generation" -ForegroundColor White
        Write-Host "  stop     - Stop automatic reports generation" -ForegroundColor White
        Write-Host "  generate - Generate reports manually" -ForegroundColor White
        Write-Host "  status   - Show current status and available reports" -ForegroundColor White
        Write-Host "  config   - Configure automatic reports settings" -ForegroundColor White
        Write-Host "  schedule - Show available schedules" -ForegroundColor White
        Write-Host "`nExamples:" -ForegroundColor Cyan
        Write-Host "  .\automatic-reports.ps1 -Action start" -ForegroundColor White
        Write-Host "  .\automatic-reports.ps1 -Action generate -Format html" -ForegroundColor White
        Write-Host "  .\automatic-reports.ps1 -Action status -Verbose" -ForegroundColor White
    }
}

Write-Log "Script execution completed" "INFO"
