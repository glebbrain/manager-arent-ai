Write-Host "🤖 LearnEnglishBot Live Dashboard" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

while ($true) {
  Clear-Host
  Write-Host "🤖 LearnEnglishBot Live Dashboard" -ForegroundColor Green
  Write-Host "================================" -ForegroundColor Green

  # Bot process status (simple: shows any python running main.py)
  $bot = Get-Process -Name python -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '*python.exe' }
  $botRunning = $false
  if ($bot) {
    $botRunning = $true
    Write-Host "✅ Bot process detected" -ForegroundColor Green
  } else {
    Write-Host "❌ Bot not running" -ForegroundColor Red
  }

  # Memory usage (aggregate)
  if ($botRunning) {
    $memMB = [math]::Round(($bot | Measure-Object WorkingSet -Sum).Sum / 1MB, 1)
    Write-Host ("💾 Memory Usage: {0} MB" -f $memMB) -ForegroundColor Cyan
  }

  # Recent error count from logs
  $logDir = Join-Path (Get-Location) 'logs'
  if (Test-Path $logDir) {
    $recent = Get-ChildItem "$logDir/*.log" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($recent) {
      $errorCount = (Get-Content $recent.FullName | Select-String 'ERROR').Count
      Write-Host ("📊 Recent Errors: {0}" -f $errorCount) -ForegroundColor Yellow
    }
  }

  Write-Host "\nPress Ctrl+C to exit..." -ForegroundColor Gray
  Start-Sleep -Seconds 10
}

param(
    [int]$RefreshInterval = 10,
    [switch]$Minimal,
    [switch]$Detailed
)

Write-Host "🤖 AIMentorBot Live Dashboard" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

function Get-BotStatus {
    """Get current bot status"""
    $botProcess = Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object {
        $_.MainWindowTitle -like "*python*" -or $_.ProcessName -eq "python"
    }
    
    if ($botProcess) {
        $memoryMB = [math]::Round($botProcess.WorkingSet / 1MB, 1)
        return @{
            Running = $true
            PID = $botProcess.Id
            MemoryMB = $memoryMB
            StartTime = $botProcess.StartTime
            CPUTime = $botProcess.TotalProcessorTime
        }
    } else {
        return @{
            Running = $false
            PID = $null
            MemoryMB = 0
            StartTime = $null
            CPUTime = $null
        }
    }
}

function Get-LogStats {
    """Get log statistics"""
    if (Test-Path "logs") {
        $logFiles = Get-ChildItem "logs\*.log" | Sort-Object LastWriteTime -Descending
        if ($logFiles) {
            $latestLog = $logFiles[0]
            $logContent = Get-Content $latestLog.FullName -ErrorAction SilentlyContinue
            
            return @{
                LatestLogFile = $latestLog.Name
                TotalLines = $logContent.Count
                ErrorCount = ($logContent | Select-String "ERROR" -AllMatches).Count
                WarningCount = ($logContent | Select-String "WARNING" -AllMatches).Count
                LastModified = $latestLog.LastWriteTime
            }
        }
    }
    
    return @{
        LatestLogFile = "No logs found"
        TotalLines = 0
        ErrorCount = 0
        WarningCount = 0
        LastModified = $null
    }
}

function Get-ProjectHealth {
    """Get overall project health"""
    $health = @{
        Score = 0
        Issues = @()
        Status = "Unknown"
    }
    
    # Check critical files
    $criticalFiles = @("main.py", "bot/ai_client.py", "requirements.txt", ".env")
    $missingFiles = 0
    
    foreach ($file in $criticalFiles) {
        if (!(Test-Path $file)) {
            $missingFiles++
            $health.Issues += "Missing: $file"
        }
    }
    
    # Check environment
    if (Test-Path ".env") {
        $envContent = Get-Content ".env" -Raw -ErrorAction SilentlyContinue
        if ($envContent -and $envContent -match "TELEGRAM_TOKEN=(?!your_)") {
            $health.Score += 25
        } else {
            $health.Issues += "Telegram token not configured"
        }
        
        if ($envContent -and $envContent -match "OPENAI_API_KEY=(?!your_)") {
            $health.Score += 25
        } else {
            $health.Issues += "OpenAI API key not configured"
        }
    } else {
        $health.Issues += "Environment file missing"
    }
    
    # Check Python environment
    try {
        $pythonVersion = & python --version 2>&1
        if ($pythonVersion -match "Python 3\.[8-9]|Python 3\.1[0-9]") {
            $health.Score += 25
        } else {
            $health.Issues += "Python version incompatible"
        }
    } catch {
        $health.Issues += "Python not accessible"
    }
    
    # Check virtual environment
    if (Test-Path "venv") {
        $health.Score += 25
    } else {
        $health.Issues += "Virtual environment not found"
    }
    
    # Determine status
    if ($health.Score -ge 90) { $health.Status = "🟢 Excellent" }
    elseif ($health.Score -ge 70) { $health.Status = "🟡 Good" }
    elseif ($health.Score -ge 50) { $health.Status = "🟠 Fair" }
    else { $health.Status = "🔴 Poor" }
    
    return $health
}

function Show-Dashboard {
    """Display the dashboard"""
    Clear-Host
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "🤖 AIMentorBot Live Dashboard - $timestamp" -ForegroundColor Green
    Write-Host "======================================================" -ForegroundColor Green
    
    # Bot Status
    $botStatus = Get-BotStatus
    Write-Host "`n🚀 Bot Status:" -ForegroundColor Cyan
    if ($botStatus.Running) {
        Write-Host "  ✅ Status: Running (PID: $($botStatus.PID))" -ForegroundColor Green
        Write-Host "  💾 Memory: $($botStatus.MemoryMB) MB" -ForegroundColor White
        if ($botStatus.StartTime) {
            $uptime = (Get-Date) - $botStatus.StartTime
            Write-Host "  ⏱️  Uptime: $($uptime.Days)d $($uptime.Hours)h $($uptime.Minutes)m" -ForegroundColor White
        }
    } else {
        Write-Host "  ❌ Status: Not Running" -ForegroundColor Red
        Write-Host "  💡 Start with: python main.py" -ForegroundColor Yellow
    }
    
    # Project Health
    $health = Get-ProjectHealth
    Write-Host "`n🏥 Project Health:" -ForegroundColor Cyan
    Write-Host "  📊 Score: $($health.Score)/100 - $($health.Status)" -ForegroundColor White
    
    if ($health.Issues.Count -gt 0 -and !$Minimal) {
        Write-Host "  ⚠️  Issues:" -ForegroundColor Yellow
        $health.Issues | ForEach-Object { Write-Host "    - $_" -ForegroundColor Gray }
    }
    
    # Log Statistics
    $logStats = Get-LogStats
    Write-Host "`n📋 Log Statistics:" -ForegroundColor Cyan
    Write-Host "  📄 Latest: $($logStats.LatestLogFile)" -ForegroundColor White
    if ($logStats.ErrorCount -gt 0) {
        Write-Host "  🚨 Errors: $($logStats.ErrorCount)" -ForegroundColor Red
    } else {
        Write-Host "  ✅ Errors: 0" -ForegroundColor Green
    }
    if ($logStats.WarningCount -gt 0) {
        Write-Host "  ⚠️  Warnings: $($logStats.WarningCount)" -ForegroundColor Yellow
    }
    
    # System Resources
    if ($Detailed) {
        Write-Host "`n💻 System Resources:" -ForegroundColor Cyan
        $cpu = Get-Counter "\Processor(_Total)\% Processor Time" -SampleInterval 1 -MaxSamples 1
        $cpuUsage = [math]::Round($cpu.CounterSamples[0].CookedValue, 1)
        Write-Host "  🖥️  CPU Usage: $cpuUsage%" -ForegroundColor White
        
        $memory = Get-Counter "\Memory\Available MBytes" -SampleInterval 1 -MaxSamples 1
        $availableMemoryMB = [math]::Round($memory.CounterSamples[0].CookedValue, 0)
        Write-Host "  💾 Available Memory: $availableMemoryMB MB" -ForegroundColor White
        
        # Disk space
        $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DriveType=3" | Where-Object { $_.DeviceID -eq "C:" }
        if ($disk) {
            $freeSpaceGB = [math]::Round($disk.FreeSpace / 1GB, 1)
            Write-Host "  💽 Free Disk Space: $freeSpaceGB GB" -ForegroundColor White
        }
    }
    
    # Quick Actions
    Write-Host "`n⚡ Quick Actions:" -ForegroundColor Cyan
    Write-Host "  F1 - Start Bot (python main.py)" -ForegroundColor White
    Write-Host "  F2 - Run Tests" -ForegroundColor White
    Write-Host "  F3 - Check Project Status" -ForegroundColor White
    Write-Host "  F4 - Quick Fix Issues" -ForegroundColor White
    Write-Host "  F5 - Refresh Dashboard" -ForegroundColor White
    Write-Host "  Ctrl+C - Exit Dashboard" -ForegroundColor White
    
    # Recent Tasks (if TODO.md exists)
    if (Test-Path "cursorfiles/TODO.md" -and !$Minimal) {
        $todoContent = Get-Content "cursorfiles/TODO.md" -Raw -ErrorAction SilentlyContinue
        if ($todoContent) {
            $criticalTasks = ($todoContent | Select-String "🔴.*\[ \]" -AllMatches).Matches.Count
            $highTasks = ($todoContent | Select-String "🟠.*\[ \]" -AllMatches).Matches.Count
            
            Write-Host "`n📋 Active Tasks:" -ForegroundColor Cyan
            if ($criticalTasks -gt 0) {
                Write-Host "  🔴 Critical: $criticalTasks" -ForegroundColor Red
            }
            if ($highTasks -gt 0) {
                Write-Host "  🟠 High: $highTasks" -ForegroundColor Yellow
            }
        }
    }
    
    Write-Host "`n⏰ Next refresh in $RefreshInterval seconds..." -ForegroundColor Gray
}

# Main dashboard loop
try {
    while ($true) {
        Show-Dashboard
        
        # Check for key presses (non-blocking)
        if ($Host.UI.RawUI.KeyAvailable) {
            $key = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyUp")
            
            switch ($key.VirtualKeyCode) {
                112 { # F1 - Start Bot
                    Write-Host "`nStarting bot..." -ForegroundColor Yellow
                    Start-Process "python" -ArgumentList "main.py" -NoNewWindow
                    Start-Sleep 2
                }
                113 { # F2 - Run Tests
                    Write-Host "`nRunning tests..." -ForegroundColor Yellow
                    & .\.automation\testing\run_tests.ps1
                    Write-Host "Press any key to continue..." -ForegroundColor Gray
                    $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
                }
                114 { # F3 - Check Status
                    Write-Host "`nChecking project status..." -ForegroundColor Yellow
                    & .\.automation\project-management\Check-ProjectStatus.ps1
                    Write-Host "Press any key to continue..." -ForegroundColor Gray
                    $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
                }
                115 { # F4 - Quick Fix
                    Write-Host "`nRunning quick fixes..." -ForegroundColor Yellow
                    & .\.automation\utilities\quick_fix.ps1 -All
                    Write-Host "Press any key to continue..." -ForegroundColor Gray
                    $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
                }
                116 { # F5 - Refresh
                    continue
                }
            }
        }
        
        Start-Sleep $RefreshInterval
    }
} catch {
    Write-Host "`n⚠️ Dashboard interrupted" -ForegroundColor Yellow
} finally {
    Write-Host "`n👋 Dashboard closed" -ForegroundColor Green
}
