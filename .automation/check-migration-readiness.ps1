# Migration Readiness Check Script
# Version: 1.0
# Description: Checks if system is ready for migration from old to new system

param(
    [switch]$Detailed = $false,
    [switch]$FixIssues = $false
)

# Configuration
$LOG_PATH = "F:\ProjectsAI\logs"

# Create logs directory if it doesn't exist
if (-not (Test-Path $LOG_PATH)) {
    New-Item -ItemType Directory -Path $LOG_PATH -Force | Out-Null
}

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage
    Add-Content -Path "$LOG_PATH\migration-readiness.log" -Value $logMessage
}

# Display banner
function Show-Banner {
    Write-Host "`n🔍 Migration Readiness Check" -ForegroundColor Cyan
    Write-Host "=============================" -ForegroundColor Cyan
    Write-Host "Detailed: $Detailed" -ForegroundColor Yellow
    Write-Host "Fix Issues: $FixIssues" -ForegroundColor Yellow
    Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
    Write-Host ""
}

# Function to check old system
function Test-OldSystem {
    Write-Log "🔍 Checking old system components..." "INFO"
    
    $oldSystemChecks = @(
        @{Name="Automation Directory"; Path=".automation"; Required=$false},
        @{Name="Manager Directory"; Path=".manager"; Required=$false},
        @{Name="Old Scripts"; Path="scripts"; Required=$true}
    )

    $oldSystemStatus = @{
        Found = @()
        Missing = @()
        Issues = @()
    }

    foreach ($check in $oldSystemChecks) {
        if (Test-Path $check.Path) {
            $oldSystemStatus.Found += $check
            Write-Log "✅ Found: $($check.Name)" "SUCCESS"
            
            if ($Detailed) {
                $itemCount = (Get-ChildItem -Path $check.Path -Recurse -File).Count
                Write-Log "   Files: $itemCount" "INFO"
            }
        } else {
            if ($check.Required) {
                $oldSystemStatus.Missing += $check
                $oldSystemStatus.Issues += "Required component missing: $($check.Name)"
                Write-Log "❌ Missing (Required): $($check.Name)" "ERROR"
            } else {
                Write-Log "⚠️ Missing (Optional): $($check.Name)" "WARNING"
            }
        }
    }

    return $oldSystemStatus
}

# Function to check new system
function Test-NewSystem {
    Write-Log "🚀 Checking new system components..." "INFO"
    
    $newSystemChecks = @(
        @{Name="PROM Deploy Script"; Path="scripts\deploy-to-prom.ps1"; Required=$true},
        @{Name="PROD Deploy Script"; Path="scripts\deploy-to-prod.ps1"; Required=$true},
        @{Name="Deployment Manager"; Path="scripts\deployment-manager.ps1"; Required=$true},
        @{Name="Migration Script"; Path="scripts\migrate-to-new-system.ps1"; Required=$true},
        @{Name="Deployment Config"; Path="config\deployment-config.json"; Required=$true},
        @{Name="Workflow Documentation"; Path="docs\deployment\DEV-PROM-PROD-Workflow.md"; Required=$true},
        @{Name="Migration Guide"; Path="docs\migration\Migration-Guide-Old-to-New.md"; Required=$true}
    )

    $newSystemStatus = @{
        Found = @()
        Missing = @()
        Issues = @()
    }

    foreach ($check in $newSystemChecks) {
        if (Test-Path $check.Path) {
            $newSystemStatus.Found += $check
            Write-Log "✅ Found: $($check.Name)" "SUCCESS"
        } else {
            $newSystemStatus.Missing += $check
            if ($check.Required) {
                $newSystemStatus.Issues += "Required new component missing: $($check.Name)"
                Write-Log "❌ Missing (Required): $($check.Name)" "ERROR"
            } else {
                Write-Log "⚠️ Missing (Optional): $($check.Name)" "WARNING"
            }
        }
    }

    return $newSystemStatus
}

# Function to check system requirements
function Test-SystemRequirements {
    Write-Log "⚙️ Checking system requirements..." "INFO"
    
    $requirements = @{
        PowerShell = $PSVersionTable.PSVersion
        OS = [System.Environment]::OSVersion.VersionString
        FreeSpace = (Get-CimInstance -ClassName Win32_LogicalDisk -Filter "DeviceID='F:'").FreeSpace
        SSH = $false
        Paths = @{
            DevPath = Test-Path "F:\ProjectsAI"
            PromPath = Test-Path "G:\OSPanel\home"
            LogPath = Test-Path "F:\ProjectsAI\logs"
        }
    }

    # Check SSH availability
    try {
        $sshTest = Get-Command ssh -ErrorAction Stop
        $requirements.SSH = $true
        Write-Log "✅ SSH available" "SUCCESS"
    } catch {
        Write-Log "⚠️ SSH not available (required for PROD deployment)" "WARNING"
    }

    # Check paths
    foreach ($path in $requirements.Paths.GetEnumerator()) {
        if ($path.Value) {
            Write-Log "✅ Path exists: $($path.Key)" "SUCCESS"
        } else {
            Write-Log "⚠️ Path missing: $($path.Key)" "WARNING"
        }
    }

    return $requirements
}

# Function to check existing projects
function Get-ExistingProjects {
    Write-Log "📋 Analyzing existing projects..." "INFO"
    
    $projects = @()
    
    # Check F:\ProjectsAI for projects
    $devProjects = Get-ChildItem -Path "F:\ProjectsAI" -Directory | Where-Object { 
        $_.Name -ne "ManagerAgentAI" -and $_.Name -notlike "ManagerAgentAI*"
    }
    
    foreach ($project in $devProjects) {
        $projectInfo = @{
            Name = $project.Name
            Path = $project.FullName
            Type = "DEV"
            Files = (Get-ChildItem -Path $project.FullName -Recurse -File).Count
            Size = (Get-ChildItem -Path $project.FullName -Recurse -File | Measure-Object -Property Length -Sum).Sum
        }
        $projects += $projectInfo
        Write-Log "📁 Found project: $($project.Name) ($($projectInfo.Files) files, $([math]::Round($projectInfo.Size / 1MB, 2)) MB)" "INFO"
    }

    return $projects
}

# Function to check SSH connection
function Test-SSHConnection {
    Write-Log "🌐 Testing SSH connection..." "INFO"
    
    try {
        $sshResult = ssh -o ConnectTimeout=10 u0488409@37.140.195.19 "echo 'SSH test successful'"
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ SSH connection successful" "SUCCESS"
            return $true
        } else {
            Write-Log "❌ SSH connection failed" "ERROR"
            return $false
        }
    } catch {
        Write-Log "❌ SSH connection error: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to generate readiness report
function New-ReadinessReport {
    param($OldSystem, $NewSystem, $Requirements, $Projects, $SSHStatus)
    
    $report = @{
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        OverallStatus = "Unknown"
        OldSystem = $OldSystem
        NewSystem = $NewSystem
        Requirements = $Requirements
        Projects = $Projects
        SSHStatus = $SSHStatus
        Recommendations = @()
        Issues = @()
    }

    # Determine overall status
    $criticalIssues = 0
    $criticalIssues += $OldSystem.Issues.Count
    $criticalIssues += $NewSystem.Issues.Count

    if ($criticalIssues -eq 0 -and $SSHStatus) {
        $report.OverallStatus = "Ready"
        $report.Recommendations += "System is ready for migration"
    } elseif ($criticalIssues -eq 0) {
        $report.OverallStatus = "Ready (SSH issues)"
        $report.Recommendations += "System is ready but SSH connection has issues"
    } else {
        $report.OverallStatus = "Not Ready"
        $report.Issues += "Critical issues found that must be resolved"
    }

    # Add specific recommendations
    if ($NewSystem.Missing.Count -gt 0) {
        $report.Recommendations += "Install missing new system components"
    }
    
    if (-not $SSHStatus) {
        $report.Recommendations += "Fix SSH connection to u0488409@37.140.195.19"
    }

    if ($Projects.Count -gt 0) {
        $report.Recommendations += "Review $($Projects.Count) existing projects for migration"
    }

    return $report
}

# Function to display report
function Show-Report {
    param($Report)
    
    Write-Host "`n📊 Migration Readiness Report" -ForegroundColor Cyan
    Write-Host "=============================" -ForegroundColor Cyan
    Write-Host "Overall Status: $($Report.OverallStatus)" -ForegroundColor $(if ($Report.OverallStatus -eq "Ready") { "Green" } else { "Yellow" })
    Write-Host "Timestamp: $($Report.Timestamp)" -ForegroundColor White
    Write-Host ""

    # Old System Status
    Write-Host "🔍 Old System Status:" -ForegroundColor Yellow
    Write-Host "  Found: $($Report.OldSystem.Found.Count) components" -ForegroundColor White
    Write-Host "  Missing: $($Report.OldSystem.Missing.Count) components" -ForegroundColor White
    Write-Host "  Issues: $($Report.OldSystem.Issues.Count)" -ForegroundColor White

    # New System Status
    Write-Host "`n🚀 New System Status:" -ForegroundColor Yellow
    Write-Host "  Found: $($Report.NewSystem.Found.Count) components" -ForegroundColor White
    Write-Host "  Missing: $($Report.NewSystem.Missing.Count) components" -ForegroundColor White
    Write-Host "  Issues: $($Report.NewSystem.Issues.Count)" -ForegroundColor White

    # Requirements
    Write-Host "`n⚙️ System Requirements:" -ForegroundColor Yellow
    Write-Host "  PowerShell: $($Report.Requirements.PowerShell)" -ForegroundColor White
    Write-Host "  OS: $($Report.Requirements.OS)" -ForegroundColor White
    Write-Host "  Free Space: $([math]::Round($Report.Requirements.FreeSpace / 1GB, 2)) GB" -ForegroundColor White
    Write-Host "  SSH: $(if ($Report.SSHStatus) { 'Available' } else { 'Not Available' })" -ForegroundColor White

    # Projects
    Write-Host "`n📋 Existing Projects:" -ForegroundColor Yellow
    Write-Host "  Count: $($Report.Projects.Count)" -ForegroundColor White
    if ($Report.Projects.Count -gt 0) {
        foreach ($project in $Report.Projects) {
            Write-Host "    - $($project.Name) ($($project.Files) files, $([math]::Round($project.Size / 1MB, 2)) MB)" -ForegroundColor White
        }
    }

    # Issues
    if ($Report.Issues.Count -gt 0) {
        Write-Host "`n❌ Issues:" -ForegroundColor Red
        foreach ($issue in $Report.Issues) {
            Write-Host "  - $issue" -ForegroundColor Red
        }
    }

    # Recommendations
    if ($Report.Recommendations.Count -gt 0) {
        Write-Host "`n💡 Recommendations:" -ForegroundColor Green
        foreach ($rec in $Report.Recommendations) {
            Write-Host "  - $rec" -ForegroundColor Green
        }
    }

    # Next Steps
    Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
    if ($Report.OverallStatus -eq "Ready") {
        Write-Host "  1. Run migration: .\scripts\migrate-to-new-system.ps1" -ForegroundColor White
        Write-Host "  2. Test new system: .\scripts\deployment-manager.ps1 -ProjectName 'TestProject' -Action status" -ForegroundColor White
    } else {
        Write-Host "  1. Fix issues listed above" -ForegroundColor White
        Write-Host "  2. Run this check again: .\scripts\check-migration-readiness.ps1" -ForegroundColor White
        Write-Host "  3. Then run migration when ready" -ForegroundColor White
    }
}

# Main execution
try {
    Show-Banner

    # Check old system
    $oldSystem = Test-OldSystem

    # Check new system
    $newSystem = Test-NewSystem

    # Check requirements
    $requirements = Test-SystemRequirements

    # Check existing projects
    $projects = Get-ExistingProjects

    # Check SSH connection
    $sshStatus = Test-SSHConnection

    # Generate report
    $report = New-ReadinessReport -OldSystem $oldSystem -NewSystem $newSystem -Requirements $requirements -Projects $projects -SSHStatus $sshStatus

    # Display report
    Show-Report -Report $report

    # Save report
    $report | ConvertTo-Json -Depth 3 | Out-File -FilePath "$LOG_PATH\migration-readiness-report.json" -Encoding UTF8
    Write-Log "📋 Report saved to: $LOG_PATH\migration-readiness-report.json" "INFO"

    # Exit with appropriate code
    if ($report.OverallStatus -eq "Ready") {
        Write-Log "✅ System is ready for migration" "SUCCESS"
        exit 0
    } else {
        Write-Log "⚠️ System is not ready for migration" "WARNING"
        exit 1
    }

} catch {
    Write-Log "❌ Readiness check failed: $($_.Exception.Message)" "ERROR"
    Write-Host "`n❌ Readiness check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
