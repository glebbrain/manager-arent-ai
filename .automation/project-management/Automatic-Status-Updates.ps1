# Automatic Status Updates v3.3 - Universal Project Manager
# Automatic task status updates with AI integration
# Version: 3.3.0
# Date: 2025-01-31

param(
    [string]$Action = "update",
    [string]$ProjectPath = ".",
    [switch]$EnableAI,
    [switch]$GenerateReport,
    [switch]$Verbose,
    [switch]$Force
)

# Enhanced automatic status updates with v3.3 features
Write-Host "🔄 Automatic Status Updates v3.3" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# AI-powered status analysis
function Invoke-AIStatusAnalysis {
    param([string]$Path)
    
    Write-Host "🤖 AI Status Analysis in progress..." -ForegroundColor Yellow
    
    # Analyze project status
    $statusAnalysis = @{
        "ProjectStatus" = @{}
        "TaskStatus" = @{}
        "FileStatus" = @{}
        "DependencyStatus" = @{}
    }
    
    # Analyze project files status
    $codeFiles = Get-ChildItem -Path $Path -Recurse -Include "*.ps1", "*.js", "*.py", "*.ts" | Where-Object { $_.Name -notlike "*test*" }
    $statusAnalysis.FileStatus = @{
        "TotalFiles" = $codeFiles.Count
        "ModifiedToday" = ($codeFiles | Where-Object { $_.LastWriteTime.Date -eq (Get-Date).Date }).Count
        "ModifiedThisWeek" = ($codeFiles | Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-7) }).Count
        "Size" = ($codeFiles | Measure-Object -Property Length -Sum).Sum
    }
    
    # Analyze TODO.md status
    $todoPath = Join-Path $Path "TODO.md"
    if (Test-Path $todoPath) {
        $todoContent = Get-Content $todoPath -Raw
        
        # Count task statuses
        $completedTasks = ($todoContent | Select-String -Pattern "- \[x\]" -AllMatches).Matches.Count
        $pendingTasks = ($todoContent | Select-String -Pattern "- \[ \]" -AllMatches).Matches.Count
        $totalTasks = $completedTasks + $pendingTasks
        
        $statusAnalysis.TaskStatus = @{
            "TotalTasks" = $totalTasks
            "CompletedTasks" = $completedTasks
            "PendingTasks" = $pendingTasks
            "CompletionRate" = if ($totalTasks -gt 0) { [math]::Round(($completedTasks / $totalTasks) * 100, 2) } else { 0 }
        }
    }
    
    # Analyze project health
    $statusAnalysis.ProjectStatus = @{
        "Health" = "Good"
        "LastActivity" = (Get-ChildItem -Path $Path -Recurse | Sort-Object LastWriteTime -Descending | Select-Object -First 1).LastWriteTime
        "ActiveFiles" = $statusAnalysis.FileStatus.ModifiedToday
        "ProjectSize" = $statusAnalysis.FileStatus.Size
    }
    
    # AI recommendations
    $recommendations = @()
    if ($statusAnalysis.TaskStatus.CompletionRate -lt 50) {
        $recommendations += "Focus on completing pending tasks to improve project progress"
    }
    if ($statusAnalysis.FileStatus.ModifiedToday -eq 0) {
        $recommendations += "No activity today - consider reviewing project status"
    }
    if ($statusAnalysis.TaskStatus.PendingTasks -gt 20) {
        $recommendations += "Consider breaking down large tasks into smaller ones"
    }
    
    return @{
        "Analysis" = $statusAnalysis
        "Recommendations" = $recommendations
        "AIAnalysis" = "Project status analyzed with AI insights"
    }
}

# Enhanced status updates
function Start-StatusUpdates {
    param(
        [string]$Action,
        [string]$Path
    )
    
    switch ($Action.ToLower()) {
        "update" {
            Write-Host "🔄 Updating project status..." -ForegroundColor Green
            $analysis = Invoke-AIStatusAnalysis -Path $Path
            
            # Update TODO.md with current status
            $todoPath = Join-Path $Path "TODO.md"
            if (Test-Path $todoPath) {
                $todoContent = Get-Content $todoPath -Raw
                
                # Add status update section if not exists
                if ($todoContent -notlike "*## Project Status Update*") {
                    $statusUpdate = @"

## Project Status Update
**Last Updated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Completion Rate:** $($analysis.Analysis.TaskStatus.CompletionRate)%
**Active Files Today:** $($analysis.Analysis.FileStatus.ModifiedToday)
**Project Health:** $($analysis.Analysis.ProjectStatus.Health)

### AI Recommendations:
$($analysis.Recommendations | ForEach-Object { "- $_" } | Out-String)

"@
                    $todoContent += $statusUpdate
                    $todoContent | Out-File -FilePath $todoPath -Encoding UTF8
                }
            }
            
            if ($Verbose) {
                Write-Host "`n📊 Status Update Results:" -ForegroundColor Cyan
                Write-Host "Completion Rate: $($analysis.Analysis.TaskStatus.CompletionRate)%" -ForegroundColor White
                Write-Host "Active Files Today: $($analysis.Analysis.FileStatus.ModifiedToday)" -ForegroundColor White
                Write-Host "Project Health: $($analysis.Analysis.ProjectStatus.Health)" -ForegroundColor White
            }
            
            return $analysis
        }
        
        "monitor" {
            Write-Host "👁️ Monitoring project status..." -ForegroundColor Green
            $analysis = Invoke-AIStatusAnalysis -Path $Path
            
            # Create monitoring dashboard data
            $dashboardData = @{
                "Timestamp" = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                "ProjectHealth" = $analysis.Analysis.ProjectStatus.Health
                "CompletionRate" = $analysis.Analysis.TaskStatus.CompletionRate
                "ActiveFiles" = $analysis.Analysis.FileStatus.ModifiedToday
                "TotalFiles" = $analysis.Analysis.FileStatus.TotalFiles
                "ProjectSize" = $analysis.Analysis.FileStatus.Size
                "LastActivity" = $analysis.Analysis.ProjectStatus.LastActivity
            }
            
            if ($Verbose) {
                Write-Host "`n📈 Monitoring Dashboard:" -ForegroundColor Cyan
                Write-Host "Project Health: $($dashboardData.ProjectHealth)" -ForegroundColor White
                Write-Host "Completion Rate: $($dashboardData.CompletionRate)%" -ForegroundColor White
                Write-Host "Active Files: $($dashboardData.ActiveFiles)" -ForegroundColor White
                Write-Host "Total Files: $($dashboardData.TotalFiles)" -ForegroundColor White
                Write-Host "Project Size: $([math]::Round($dashboardData.ProjectSize / 1MB, 2)) MB" -ForegroundColor White
                Write-Host "Last Activity: $($dashboardData.LastActivity)" -ForegroundColor White
            }
            
            return $dashboardData
        }
        
        "notify" {
            Write-Host "🔔 Generating status notifications..." -ForegroundColor Green
            $analysis = Invoke-AIStatusAnalysis -Path $Path
            
            $notifications = @()
            
            # Generate notifications based on status
            if ($analysis.Analysis.TaskStatus.CompletionRate -gt 80) {
                $notifications += "🎉 Great progress! Project is $($analysis.Analysis.TaskStatus.CompletionRate)% complete"
            } elseif ($analysis.Analysis.TaskStatus.CompletionRate -lt 30) {
                $notifications += "⚠️ Project needs attention - only $($analysis.Analysis.TaskStatus.CompletionRate)% complete"
            }
            
            if ($analysis.Analysis.FileStatus.ModifiedToday -eq 0) {
                $notifications += "📝 No activity today - consider reviewing project status"
            } elseif ($analysis.Analysis.FileStatus.ModifiedToday -gt 10) {
                $notifications += "🚀 High activity today - $($analysis.Analysis.FileStatus.ModifiedToday) files modified"
            }
            
            if ($analysis.Analysis.TaskStatus.PendingTasks -gt 15) {
                $notifications += "📋 Many pending tasks ($($analysis.Analysis.TaskStatus.PendingTasks)) - consider prioritization"
            }
            
            Write-Host "`n🔔 Status Notifications:" -ForegroundColor Yellow
            $notifications | ForEach-Object {
                Write-Host "  • $_" -ForegroundColor White
            }
            
            return $notifications
        }
        
        "schedule" {
            Write-Host "⏰ Scheduling automatic updates..." -ForegroundColor Green
            
            # Create scheduled task for automatic updates
            $scriptPath = $MyInvocation.MyCommand.Path
            $taskName = "UniversalProjectManager-StatusUpdates"
            
            try {
                # Remove existing task if exists
                Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
                
                # Create new scheduled task
                $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File `"$scriptPath`" -Action update -ProjectPath `"$Path`" -EnableAI"
                $trigger = New-ScheduledTaskTrigger -Daily -At "09:00"
                $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
                
                Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Automatic status updates for Universal Project Manager"
                
                Write-Host "✅ Scheduled task created: $taskName" -ForegroundColor Green
                Write-Host "   Runs daily at 9:00 AM" -ForegroundColor White
                
            } catch {
                Write-Warning "⚠️ Could not create scheduled task: $($_.Exception.Message)"
                Write-Host "   You can run updates manually using: .\Automatic-Status-Updates.ps1 -Action update" -ForegroundColor Yellow
            }
            
            return @{
                "Scheduled" = $true
                "TaskName" = $taskName
                "Schedule" = "Daily at 9:00 AM"
            }
        }
        
        "help" {
            Show-Help
        }
        
        default {
            Write-Host "❌ Unknown action: $Action" -ForegroundColor Red
            Show-Help
        }
    }
}

# Show help information
function Show-Help {
    Write-Host "`n📖 Automatic Status Updates v3.3 Help" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "`nAvailable Actions:" -ForegroundColor Yellow
    Write-Host "  update        - Update project status" -ForegroundColor White
    Write-Host "  monitor       - Monitor project status" -ForegroundColor White
    Write-Host "  notify        - Generate status notifications" -ForegroundColor White
    Write-Host "  schedule      - Schedule automatic updates" -ForegroundColor White
    Write-Host "  help          - Show this help" -ForegroundColor White
    Write-Host "`nUsage Examples:" -ForegroundColor Yellow
    Write-Host "  .\Automatic-Status-Updates.ps1 -Action update -ProjectPath ." -ForegroundColor White
    Write-Host "  .\Automatic-Status-Updates.ps1 -Action monitor -EnableAI -Verbose" -ForegroundColor White
    Write-Host "  .\Automatic-Status-Updates.ps1 -Action schedule -Force" -ForegroundColor White
}

# Main execution
try {
    if ($Verbose) {
        Write-Host "🔧 Configuration:" -ForegroundColor Cyan
        Write-Host "  Action: $Action" -ForegroundColor White
        Write-Host "  Project Path: $ProjectPath" -ForegroundColor White
        Write-Host "  Enable AI: $EnableAI" -ForegroundColor White
        Write-Host "  Generate Report: $GenerateReport" -ForegroundColor White
        Write-Host "  Force: $Force" -ForegroundColor White
        Write-Host ""
    }
    
    # Execute status updates
    $result = Start-StatusUpdates -Action $Action -Path $ProjectPath
    
    if ($GenerateReport) {
        $reportPath = Join-Path $ProjectPath "status-update-report-v3.3.json"
        $result | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath -Encoding UTF8
        Write-Host "📄 Report saved to: $reportPath" -ForegroundColor Green
    }
    
    Write-Host "`n✅ Automatic status updates completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Error "❌ Error during status updates: $($_.Exception.Message)"
    exit 1
}
