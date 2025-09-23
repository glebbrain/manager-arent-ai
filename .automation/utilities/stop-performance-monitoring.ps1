# Universal Automation Platform - Stop Performance Monitoring
# Version: 2.2 - AI Enhanced

param(
    [Parameter(Mandatory=$false)]
    [switch]$Force,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Script configuration
$ScriptName = "Stop-Performance-Monitoring"
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

# Stop performance metrics collection
function Stop-PerformanceMetrics {
    Write-Log "Stopping performance metrics collection..." "INFO"
    
    try {
        # Use the performance metrics PowerShell script
        $result = & ".\scripts\performance-metrics.ps1" -Action "stop" -Verbose:$Verbose
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Performance metrics collection stopped" "INFO"
            return $true
        } else {
            Write-Log "❌ Failed to stop performance metrics collection" "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "Failed to stop performance metrics: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Stop dashboard server
function Stop-DashboardServer {
    Write-Log "Stopping dashboard server..." "INFO"
    
    try {
        if (Test-Path "dashboard-server.pid") {
            $processId = Get-Content "dashboard-server.pid"
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            
            if ($process) {
                $process.Kill()
                Write-Log "✅ Dashboard server stopped (PID: $processId)" "INFO"
            } else {
                Write-Log "⚠️ Dashboard server process not found (PID: $processId)" "WARN"
            }
            
            Remove-Item "dashboard-server.pid" -Force -ErrorAction SilentlyContinue
        } else {
            Write-Log "⚠️ No PID file found for dashboard server" "WARN"
            
            # Try to find and stop Node.js processes running server.js
            $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
                $_.CommandLine -like "*server.js*" -or $_.CommandLine -like "*dashboard*"
            }
            
            foreach ($process in $processes) {
                $process.Kill()
                Write-Log "✅ Stopped Node.js process (PID: $($process.Id))" "INFO"
            }
        }
        
        return $true
    }
    catch {
        Write-Log "Failed to stop dashboard server: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Clean up temporary files
function Clear-TemporaryFiles {
    Write-Log "Cleaning up temporary files..." "INFO"
    
    $filesToClean = @(
        "performance-metrics.pid",
        "dashboard-server.pid",
        "create-shortcut.vbs"
    )
    
    foreach ($file in $filesToClean) {
        if (Test-Path $file) {
            try {
                Remove-Item $file -Force
                Write-Log "✅ Removed: $file" "INFO"
            }
            catch {
                Write-Log "⚠️ Could not remove: $file - $($_.Exception.Message)" "WARN"
            }
        }
    }
}

# Generate final report
function Generate-FinalReport {
    Write-Log "Generating final report..." "INFO"
    
    try {
        if (Test-Path "performance-metrics.json") {
            $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
            $reportFile = "performance-monitoring-final-report-$timestamp.html"
            
            # Generate final report
            $result = & ".\scripts\performance-metrics.ps1" -Action "report" -Verbose:$Verbose
            
            if ($LASTEXITCODE -eq 0) {
                Write-Log "✅ Final report generated" "INFO"
                Write-Host "📊 Final report available in the current directory" -ForegroundColor Green
            } else {
                Write-Log "⚠️ Could not generate final report" "WARN"
            }
        } else {
            Write-Log "⚠️ No metrics data found for final report" "WARN"
        }
    }
    catch {
        Write-Log "Failed to generate final report: $($_.Exception.Message)" "WARN"
    }
}

# Show cleanup summary
function Show-CleanupSummary {
    Write-Host "`n🛑 Universal Automation Platform - Performance Monitoring Stopped" -ForegroundColor Red
    Write-Host "=" * 70 -ForegroundColor Red
    
    Write-Host "`n📊 Services Stopped:" -ForegroundColor Cyan
    Write-Host "  Dashboard Server: Stopped" -ForegroundColor Red
    Write-Host "  Performance Metrics: Stopped" -ForegroundColor Red
    
    Write-Host "`n📁 Files Cleaned:" -ForegroundColor Cyan
    Write-Host "  PID files removed" -ForegroundColor White
    Write-Host "  Temporary files cleaned" -ForegroundColor White
    
    Write-Host "`n📈 Data Preserved:" -ForegroundColor Cyan
    if (Test-Path "performance-metrics.json") {
        $fileInfo = Get-Item "performance-metrics.json"
        Write-Host "  performance-metrics.json ($($fileInfo.Length) bytes)" -ForegroundColor White
    }
    if (Test-Path "performance-monitoring.log") {
        $fileInfo = Get-Item "performance-monitoring.log"
        Write-Host "  performance-monitoring.log ($($fileInfo.Length) bytes)" -ForegroundColor White
    }
    if (Test-Path "monitoring-config.json") {
        Write-Host "  monitoring-config.json (configuration)" -ForegroundColor White
    }
    
    Write-Host "`n💡 Next Steps:" -ForegroundColor Yellow
    Write-Host "  - Review the collected metrics data" -ForegroundColor White
    Write-Host "  - Generate reports using: .\scripts\performance-metrics.ps1 -Action report" -ForegroundColor White
    Write-Host "  - Analyze data using: .\scripts\performance-metrics.ps1 -Action analyze" -ForegroundColor White
    Write-Host "  - Export data using: .\scripts\performance-metrics.ps1 -Action export" -ForegroundColor White
    
    Write-Host "`n🔄 To Restart Monitoring:" -ForegroundColor Green
    Write-Host "  .\scripts\start-performance-monitoring.ps1" -ForegroundColor White
    
    Write-Host "`n" + "=" * 70 -ForegroundColor Red
}

# Main execution
Write-Log "Starting $ScriptName v$Version" "INFO"

# Confirm stop if not forced
if (-not $Force) {
    $confirmation = Read-Host "Are you sure you want to stop performance monitoring? (y/N)"
    if ($confirmation -ne "y" -and $confirmation -ne "Y") {
        Write-Host "Operation cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "🛑 Stopping Performance Monitoring..." -ForegroundColor Red

# Stop performance metrics
if (-not (Stop-PerformanceMetrics)) {
    Write-Host "⚠️ Warning: Failed to stop performance metrics collection" -ForegroundColor Yellow
}

# Stop dashboard server
if (-not (Stop-DashboardServer)) {
    Write-Host "⚠️ Warning: Failed to stop dashboard server" -ForegroundColor Yellow
}

# Clean up temporary files
Clear-TemporaryFiles

# Generate final report
Generate-FinalReport

# Show cleanup summary
Show-CleanupSummary

Write-Log "Performance monitoring stopped successfully" "INFO"
Write-Host "`n✅ Performance monitoring stopped successfully" -ForegroundColor Green
