# Universal Automation Platform - Risk Prediction Management
# Version: 2.2 - AI Enhanced

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("analyze", "report", "status", "config", "monitor", "alerts")]
    [string]$Action = "analyze",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputDir = "risk-prediction",
    
    [Parameter(Mandatory=$false)]
    [string]$ProjectPath = ".",
    
    [Parameter(Mandatory=$false)]
    [int]$AnalysisPeriod = 30,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("html", "json", "csv")]
    [string]$Format = "html",
    
    [Parameter(Mandatory=$false)]
    [string]$RiskCategories = "technical,schedule,resource,quality,security",
    
    [Parameter(Mandatory=$false)]
    [switch]$Continuous,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Script configuration
$ScriptName = "Risk-Prediction"
$Version = "2.2.0"
$LogFile = "risk-prediction.log"

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
        RiskScript = $false
        ProjectPath = $false
        GitRepo = $false
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
    
    # Check risk prediction script
    if (Test-Path "scripts/risk-prediction.js") {
        $prerequisites.RiskScript = $true
        Write-Log "✅ Risk prediction script found" "INFO"
    } else {
        Write-Log "❌ Risk prediction script not found" "ERROR"
    }
    
    # Check project path
    if (Test-Path $ProjectPath) {
        $prerequisites.ProjectPath = $true
        Write-Log "✅ Project path exists: $ProjectPath" "INFO"
    } else {
        Write-Log "❌ Project path not found: $ProjectPath" "ERROR"
    }
    
    # Check if we're in a git repository
    try {
        $gitStatus = git status 2>$null
        if ($LASTEXITCODE -eq 0) {
            $prerequisites.GitRepo = $true
            Write-Log "✅ Git repository detected" "INFO"
        } else {
            Write-Log "⚠️ Not in a git repository" "WARN"
        }
    }
    catch {
        Write-Log "⚠️ Not in a git repository" "WARN"
    }
    
    return $prerequisites
}

# Run risk prediction analysis
function Start-RiskAnalysis {
    Write-Log "Starting risk prediction analysis..." "INFO"
    
    if (-not (Test-Prerequisites).NodeJS) {
        Write-Log "Cannot start analysis without Node.js" "ERROR"
        return $false
    }
    
    try {
        $processArgs = @(
            "scripts/risk-prediction.js",
            "analyze"
        )
        
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = "node"
        $processInfo.Arguments = $processArgs -join " "
        $processInfo.UseShellExecute = $false
        $processInfo.RedirectStandardOutput = $true
        $processInfo.RedirectStandardError = $true
        $processInfo.CreateNoWindow = $true
        $processInfo.WorkingDirectory = $ProjectPath
        
        $process = [System.Diagnostics.Process]::Start($processInfo)
        $process.WaitForExit()
        
        if ($process.ExitCode -eq 0) {
            Write-Log "Risk analysis completed successfully" "INFO"
            return $true
        } else {
            Write-Log "Risk analysis failed with exit code: $($process.ExitCode)" "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "Failed to run risk analysis: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Generate risk prediction report
function Generate-RiskReport {
    Write-Log "Generating risk prediction report..." "INFO"
    
    try {
        $processArgs = @(
            "scripts/risk-prediction.js",
            "report"
        )
        
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = "node"
        $processInfo.Arguments = $processArgs -join " "
        $processInfo.UseShellExecute = $false
        $processInfo.RedirectStandardOutput = $true
        $processInfo.RedirectStandardError = $true
        $processInfo.CreateNoWindow = $true
        $processInfo.WorkingDirectory = $ProjectPath
        
        $process = [System.Diagnostics.Process]::Start($processInfo)
        $output = $process.StandardOutput.ReadToEnd()
        $process.WaitForExit()
        
        if ($process.ExitCode -eq 0) {
            # Save report to file
            $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
            $reportFile = "$OutputDir/risk-report-$timestamp.html"
            
            if (-not (Test-Path $OutputDir)) {
                New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
            }
            
            $output | Set-Content $reportFile -Encoding UTF8
            Write-Log "Risk report generated: $reportFile" "INFO"
            
            # Try to open the report
            try {
                Start-Process $reportFile
            }
            catch {
                Write-Log "Could not open report automatically: $($_.Exception.Message)" "WARN"
            }
            
            return $true
        } else {
            Write-Log "Failed to generate risk report" "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "Failed to generate risk report: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Get risk analysis status
function Get-RiskAnalysisStatus {
    Write-Log "Checking risk analysis status..." "INFO"
    
    $status = @{
        OutputDir = $OutputDir
        AnalysisFiles = 0
        LatestAnalysis = $null
        OverallRisk = 0
        RiskLevel = "unknown"
        HighRisks = 0
        MediumRisks = 0
    }
    
    try {
        # Check output directory
        if (Test-Path $OutputDir) {
            $analysisFiles = Get-ChildItem -Path $OutputDir -Filter "risk-analysis-*.json" -ErrorAction SilentlyContinue
            $status.AnalysisFiles = $analysisFiles.Count
            
            if ($analysisFiles.Count -gt 0) {
                $latestFile = $analysisFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
                $status.LatestAnalysis = $latestFile.LastWriteTime
                
                # Try to read risk data from latest analysis
                try {
                    $content = Get-Content $latestFile.FullName -Raw | ConvertFrom-Json
                    $status.OverallRisk = $content.overallRisk || 0
                    $status.RiskLevel = $content.overallRisk -ge 80 ? "high" : $content.overallRisk -ge 60 ? "medium" : "low"
                    $status.HighRisks = ($content.risks | Get-Member -MemberType NoteProperty | Where-Object { $content.risks.($_.Name).level -eq "high" }).Count
                    $status.MediumRisks = ($content.risks | Get-Member -MemberType NoteProperty | Where-Object { $content.risks.($_.Name).level -eq "medium" }).Count
                }
                catch {
                    Write-Log "Could not read risk data from analysis file" "WARN"
                }
            }
        }
        
        # Display status
        Write-Host "`n⚠️ Risk Analysis Status:" -ForegroundColor Cyan
        Write-Host "Output Directory: $($status.OutputDir)" -ForegroundColor Yellow
        Write-Host "Analysis Files: $($status.AnalysisFiles)" -ForegroundColor Yellow
        Write-Host "Latest Analysis: $($status.LatestAnalysis)" -ForegroundColor Yellow
        Write-Host "Overall Risk: $($status.OverallRisk)%" -ForegroundColor $(if ($status.OverallRisk -ge 80) { "Red" } elseif ($status.OverallRisk -ge 60) { "Yellow" } else { "Green" })
        Write-Host "Risk Level: $($status.RiskLevel.ToUpper())" -ForegroundColor $(if ($status.RiskLevel -eq "high") { "Red" } elseif ($status.RiskLevel -eq "medium") { "Yellow" } else { "Green" })
        Write-Host "High Risks: $($status.HighRisks)" -ForegroundColor $(if ($status.HighRisks -gt 0) { "Red" } else { "Green" })
        Write-Host "Medium Risks: $($status.MediumRisks)" -ForegroundColor $(if ($status.MediumRisks -gt 0) { "Yellow" } else { "Green" })
        
        return $status
    }
    catch {
        Write-Log "Failed to get risk analysis status: $($_.Exception.Message)" "ERROR"
        return $status
    }
}

# Configure risk prediction system
function Set-RiskPredictionConfig {
    Write-Log "Configuring risk prediction system..." "INFO"
    
    try {
        $config = @{
            version = "2.2.0"
            outputDir = $OutputDir
            projectPath = $ProjectPath
            analysisPeriod = $AnalysisPeriod
            riskCategories = $RiskCategories.Split(',')
            riskFactors = @{
                technical = $true
                schedule = $true
                resource = $true
                quality = $true
                security = $true
                dependency = $true
                team = $true
                external = $true
            }
            thresholds = @{
                high = 80
                medium = 60
                low = 40
            }
            monitoring = @{
                enabled = $Continuous
                interval = 3600  # 1 hour
                alertThreshold = 70
            }
        }
        
        $config | ConvertTo-Json -Depth 10 | Set-Content "risk-prediction-config.json"
        Write-Log "Configuration saved to risk-prediction-config.json" "INFO"
        
        Write-Host "`n📋 Risk Prediction Configuration:" -ForegroundColor Cyan
        Write-Host "Output Directory: $($config.outputDir)" -ForegroundColor White
        Write-Host "Project Path: $($config.projectPath)" -ForegroundColor White
        Write-Host "Analysis Period: $($config.analysisPeriod) days" -ForegroundColor White
        Write-Host "Risk Categories: $($config.riskCategories -join ', ')" -ForegroundColor White
        Write-Host "Monitoring Enabled: $($config.monitoring.enabled)" -ForegroundColor White
        Write-Host "Alert Threshold: $($config.monitoring.alertThreshold)%" -ForegroundColor White
        
        return $true
    }
    catch {
        Write-Log "Failed to configure risk prediction system: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Start continuous risk monitoring
function Start-RiskMonitoring {
    Write-Log "Starting continuous risk monitoring..." "INFO"
    
    if (-not (Test-Prerequisites).NodeJS) {
        Write-Log "Cannot start monitoring without Node.js" "ERROR"
        return $false
    }
    
    try {
        # Create monitoring script
        $monitoringScript = @"
# Risk Monitoring Script
while (`$true) {
    Write-Host "🔍 Running risk analysis..." -ForegroundColor Cyan
    node scripts/risk-prediction.js analyze
    
    if (`$LASTEXITCODE -eq 0) {
        Write-Host "✅ Risk analysis completed" -ForegroundColor Green
    } else {
        Write-Host "❌ Risk analysis failed" -ForegroundColor Red
    }
    
    Write-Host "⏰ Waiting 1 hour before next analysis..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3600
}
"@
        
        $monitoringScript | Set-Content "risk-monitoring.ps1"
        
        # Start monitoring in background
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = "powershell"
        $processInfo.Arguments = "-File risk-monitoring.ps1"
        $processInfo.UseShellExecute = $false
        $processInfo.CreateNoWindow = $true
        
        $process = [System.Diagnostics.Process]::Start($processInfo)
        $processId = $process.Id
        
        # Store process ID
        Set-Content -Path "risk-monitoring.pid" -Value $processId
        
        Write-Log "Risk monitoring started with PID: $processId" "INFO"
        Write-Host "🔍 Risk monitoring started (PID: $processId)" -ForegroundColor Green
        Write-Host "📊 Monitoring will run every hour" -ForegroundColor Cyan
        
        return $true
    }
    catch {
        Write-Log "Failed to start risk monitoring: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Stop risk monitoring
function Stop-RiskMonitoring {
    Write-Log "Stopping risk monitoring..." "INFO"
    
    try {
        if (Test-Path "risk-monitoring.pid") {
            $processId = Get-Content "risk-monitoring.pid"
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            
            if ($process) {
                $process.Kill()
                Write-Log "Stopped risk monitoring process with PID: $processId" "INFO"
            } else {
                Write-Log "Risk monitoring process not found (PID: $processId)" "WARN"
            }
            
            Remove-Item "risk-monitoring.pid" -Force -ErrorAction SilentlyContinue
        } else {
            Write-Log "No monitoring PID file found" "WARN"
        }
        
        # Clean up monitoring script
        if (Test-Path "risk-monitoring.ps1") {
            Remove-Item "risk-monitoring.ps1" -Force -ErrorAction SilentlyContinue
        }
        
        Write-Host "🛑 Risk monitoring stopped" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Log "Failed to stop risk monitoring: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Generate risk alerts
function Generate-RiskAlerts {
    Write-Log "Generating risk alerts..." "INFO"
    
    try {
        $analysisFiles = Get-ChildItem -Path $OutputDir -Filter "risk-analysis-*.json" -ErrorAction SilentlyContinue
        if ($analysisFiles.Count -eq 0) {
            Write-Host "No risk analysis files found" -ForegroundColor Yellow
            return $false
        }
        
        $latestFile = $analysisFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        $content = Get-Content $latestFile.FullName -Raw | ConvertFrom-Json
        
        $alerts = @()
        
        # Check overall risk level
        if ($content.overallRisk -ge 80) {
            $alerts += "🚨 HIGH RISK: Overall project risk is ${content.overallRisk}%"
        } elseif ($content.overallRisk -ge 60) {
            $alerts += "⚠️ MEDIUM RISK: Overall project risk is ${content.overallRisk}%"
        }
        
        # Check individual risk categories
        foreach ($risk in $content.risks.PSObject.Properties) {
            if ($risk.Value.level -eq "high") {
                $alerts += "🔴 HIGH RISK: ${risk.Value.name} - ${risk.Value.score}%"
            } elseif ($risk.Value.level -eq "medium") {
                $alerts += "🟡 MEDIUM RISK: ${risk.Value.name} - ${risk.Value.score}%"
            }
        }
        
        if ($alerts.Count -gt 0) {
            Write-Host "`n🚨 Risk Alerts:" -ForegroundColor Red
            foreach ($alert in $alerts) {
                Write-Host $alert -ForegroundColor Red
            }
            
            # Save alerts to file
            $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
            $alertsFile = "$OutputDir/risk-alerts-$timestamp.txt"
            $alerts | Set-Content $alertsFile
            Write-Log "Risk alerts saved to: $alertsFile" "INFO"
        } else {
            Write-Host "✅ No high-risk alerts found" -ForegroundColor Green
        }
        
        return $true
    }
    catch {
        Write-Log "Failed to generate risk alerts: $($_.Exception.Message)" "ERROR"
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
    
    Write-Host "`n📊 Available Risk Reports:" -ForegroundColor Cyan
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

# Main execution
Write-Log "Starting $ScriptName v$Version" "INFO"

switch ($Action.ToLower()) {
    "analyze" {
        if (Start-RiskAnalysis) {
            Write-Host "✅ Risk analysis completed successfully" -ForegroundColor Green
            Show-AvailableReports
        } else {
            Write-Host "❌ Failed to complete risk analysis" -ForegroundColor Red
            exit 1
        }
    }
    "report" {
        if (Generate-RiskReport) {
            Write-Host "✅ Risk report generated successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to generate risk report" -ForegroundColor Red
            exit 1
        }
    }
    "status" {
        Get-RiskAnalysisStatus
        Show-AvailableReports
    }
    "config" {
        if (Set-RiskPredictionConfig) {
            Write-Host "✅ Risk prediction configuration saved successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to save risk prediction configuration" -ForegroundColor Red
            exit 1
        }
    }
    "monitor" {
        if ($Continuous) {
            if (Start-RiskMonitoring) {
                Write-Host "✅ Risk monitoring started successfully" -ForegroundColor Green
            } else {
                Write-Host "❌ Failed to start risk monitoring" -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "Use -Continuous flag to start monitoring" -ForegroundColor Yellow
        }
    }
    "alerts" {
        if (Generate-RiskAlerts) {
            Write-Host "✅ Risk alerts generated successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to generate risk alerts" -ForegroundColor Red
            exit 1
        }
    }
    "stop" {
        if (Stop-RiskMonitoring) {
            Write-Host "✅ Risk monitoring stopped successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to stop risk monitoring" -ForegroundColor Red
            exit 1
        }
    }
    default {
        Write-Host "Usage: .\risk-prediction.ps1 -Action [analyze|report|status|config|monitor|alerts|stop]" -ForegroundColor Yellow
        Write-Host "`nAvailable actions:" -ForegroundColor Cyan
        Write-Host "  analyze  - Run risk prediction analysis" -ForegroundColor White
        Write-Host "  report   - Generate risk prediction report" -ForegroundColor White
        Write-Host "  status   - Show analysis status and available reports" -ForegroundColor White
        Write-Host "  config   - Configure risk prediction settings" -ForegroundColor White
        Write-Host "  monitor  - Start continuous risk monitoring" -ForegroundColor White
        Write-Host "  alerts   - Generate risk alerts" -ForegroundColor White
        Write-Host "  stop     - Stop risk monitoring" -ForegroundColor White
        Write-Host "`nExamples:" -ForegroundColor Cyan
        Write-Host "  .\risk-prediction.ps1 -Action analyze" -ForegroundColor White
        Write-Host "  .\risk-prediction.ps1 -Action report -Format html" -ForegroundColor White
        Write-Host "  .\risk-prediction.ps1 -Action status -Verbose" -ForegroundColor White
        Write-Host "  .\risk-prediction.ps1 -Action config -AnalysisPeriod 60" -ForegroundColor White
        Write-Host "  .\risk-prediction.ps1 -Action monitor -Continuous" -ForegroundColor White
        Write-Host "  .\risk-prediction.ps1 -Action alerts" -ForegroundColor White
    }
}

Write-Log "Script execution completed" "INFO"
