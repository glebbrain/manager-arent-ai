# macOS Service Manager Script for ManagerAgentAI v2.5
# Manages LaunchAgent service for ManagerAgentAI on macOS

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("install", "uninstall", "start", "stop", "restart", "status", "enable", "disable", "logs", "reload")]
    [string]$Action,
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceName = "manageragentai",
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceUser = "manageragentai",
    
    [Parameter(Mandatory=$false)]
    [string]$InstallPath = "/opt/manageragentai",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Script configuration
$ScriptName = "macOS-Service-Manager"
$Version = "2.5.0"
$LogFile = "macos-service.log"

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
    Write-ColorOutput "🍎 ManagerAgentAI macOS Service Manager v2.5" -Color Header
    Write-ColorOutput "===========================================" -Color Header
    Write-ColorOutput "LaunchAgent Service Management for macOS" -Color Info
    Write-ColorOutput ""
}

function Test-macOSEnvironment {
    if (-not $IsMacOS) {
        Write-ColorOutput "❌ This script must be run on a macOS system" -Color Error
        Write-Log "Script run on non-macOS system" "ERROR"
        return $false
    }
    
    # Check if launchctl is available
    try {
        $launchctlVersion = launchctl version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Launchctl is available" "INFO"
            return $true
        } else {
            Write-ColorOutput "❌ Launchctl not available" -Color Error
            Write-Log "Launchctl not available" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Failed to check launchctl availability" -Color Error
        Write-Log "Failed to check launchctl: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Install-macOSService {
    param([string]$ServiceName, [string]$ServiceUser, [string]$InstallPath)
    
    Write-ColorOutput "Installing ManagerAgentAI as LaunchAgent..." -Color Info
    Write-Log "Installing LaunchAgent: $ServiceName" "INFO"
    
    try {
        # Create service user if it doesn't exist
        $userExists = dscl . -read /Users/$ServiceUser 2>$null
        if ($LASTEXITCODE -ne 0) {
            sudo dscl . -create /Users/$ServiceUser
            sudo dscl . -create /Users/$ServiceUser UserShell /bin/false
            sudo dscl . -create /Users/$ServiceUser RealName "ManagerAgentAI Service"
            sudo dscl . -create /Users/$ServiceUser UniqueID 200
            sudo dscl . -create /Users/$ServiceUser PrimaryGroupID 20
            Write-Log "Created service user: $ServiceUser" "INFO"
        } else {
            Write-Log "Service user already exists: $ServiceUser" "INFO"
        }
        
        # Create service directory if it doesn't exist
        if (-not (Test-Path $InstallPath)) {
            sudo mkdir -p $InstallPath
            Write-Log "Created service directory: $InstallPath" "INFO"
        }
        
        # Create LaunchAgent directory
        $launchAgentDir = "$env:HOME/Library/LaunchAgents"
        if (-not (Test-Path $launchAgentDir)) {
            New-Item -ItemType Directory -Path $launchAgentDir -Force
            Write-Log "Created LaunchAgents directory: $launchAgentDir" "INFO"
        }
        
        # Create plist file
        $plistContent = @"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.manageragentai.$ServiceName</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/pwsh</string>
        <string>-File</string>
        <string>$InstallPath/scripts/start-platform.ps1</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$InstallPath/logs/launchagent.log</string>
    <key>StandardErrorPath</key>
    <string>$InstallPath/logs/launchagent.error.log</string>
    <key>WorkingDirectory</key>
    <string>$InstallPath</string>
    <key>UserName</key>
    <string>$ServiceUser</string>
</dict>
</plist>
"@
        
        $plistPath = "$launchAgentDir/com.manageragentai.$ServiceName.plist"
        $plistContent | Out-File -FilePath $plistPath -Encoding UTF8
        Write-Log "Created LaunchAgent plist: $plistPath" "INFO"
        
        # Set permissions
        sudo chown -R $ServiceUser`:staff $InstallPath
        sudo chmod +x $InstallPath/scripts/*.ps1
        Write-Log "Set permissions for service user: $ServiceUser" "INFO"
        
        # Load the LaunchAgent
        launchctl load $plistPath
        Write-Log "Loaded LaunchAgent: $ServiceName" "INFO"
        
        Write-ColorOutput "✅ Service installed successfully" -Color Success
        Write-Log "LaunchAgent installation completed successfully" "INFO"
        
        return $true
    } catch {
        Write-ColorOutput "❌ Failed to install service" -Color Error
        Write-Log "Failed to install LaunchAgent: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Uninstall-macOSService {
    param([string]$ServiceName, [string]$ServiceUser, [string]$InstallPath)
    
    Write-ColorOutput "Uninstalling ManagerAgentAI LaunchAgent..." -Color Info
    Write-Log "Uninstalling LaunchAgent: $ServiceName" "INFO"
    
    try {
        # Stop and unload service
        $plistPath = "$env:HOME/Library/LaunchAgents/com.manageragentai.$ServiceName.plist"
        if (Test-Path $plistPath) {
            launchctl unload $plistPath 2>$null
            Remove-Item $plistPath -Force
            Write-Log "Unloaded and removed LaunchAgent plist: $plistPath" "INFO"
        }
        
        # Remove service user (optional)
        if ($ServiceUser -and (dscl . -read /Users/$ServiceUser 2>$null)) {
            sudo dscl . -delete /Users/$ServiceUser 2>$null
            Write-Log "Removed service user: $ServiceUser" "INFO"
        }
        
        Write-ColorOutput "✅ Service uninstalled successfully" -Color Success
        Write-Log "LaunchAgent uninstallation completed successfully" "INFO"
        
        return $true
    } catch {
        Write-ColorOutput "❌ Failed to uninstall service" -Color Error
        Write-Log "Failed to uninstall LaunchAgent: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Start-macOSService {
    param([string]$ServiceName)
    
    Write-ColorOutput "Starting ManagerAgentAI service..." -Color Info
    Write-Log "Starting service: $ServiceName" "INFO"
    
    try {
        launchctl start "com.manageragentai.$ServiceName"
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Service started successfully" -Color Success
            Write-Log "Service started successfully: $ServiceName" "INFO"
            
            # Show status
            Start-Sleep -Seconds 2
            Get-macOSServiceStatus -ServiceName $ServiceName
        } else {
            Write-ColorOutput "❌ Failed to start service" -Color Error
            Write-Log "Failed to start service: $ServiceName" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Error starting service" -Color Error
        Write-Log "Error starting service: $($_.Exception.Message)" "ERROR"
        return $false
    }
    
    return $true
}

function Stop-macOSService {
    param([string]$ServiceName)
    
    Write-ColorOutput "Stopping ManagerAgentAI service..." -Color Info
    Write-Log "Stopping service: $ServiceName" "INFO"
    
    try {
        launchctl stop "com.manageragentai.$ServiceName"
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Service stopped successfully" -Color Success
            Write-Log "Service stopped successfully: $ServiceName" "INFO"
        } else {
            Write-ColorOutput "❌ Failed to stop service" -Color Error
            Write-Log "Failed to stop service: $ServiceName" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Error stopping service" -Color Error
        Write-Log "Error stopping service: $($_.Exception.Message)" "ERROR"
        return $false
    }
    
    return $true
}

function Restart-macOSService {
    param([string]$ServiceName)
    
    Write-ColorOutput "Restarting ManagerAgentAI service..." -Color Info
    Write-Log "Restarting service: $ServiceName" "INFO"
    
    try {
        # Stop service
        launchctl stop "com.manageragentai.$ServiceName"
        Start-Sleep -Seconds 2
        
        # Start service
        launchctl start "com.manageragentai.$ServiceName"
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Service restarted successfully" -Color Success
            Write-Log "Service restarted successfully: $ServiceName" "INFO"
            
            # Show status
            Start-Sleep -Seconds 2
            Get-macOSServiceStatus -ServiceName $ServiceName
        } else {
            Write-ColorOutput "❌ Failed to restart service" -Color Error
            Write-Log "Failed to restart service: $ServiceName" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Error restarting service" -Color Error
        Write-Log "Error restarting service: $($_.Exception.Message)" "ERROR"
        return $false
    }
    
    return $true
}

function Get-macOSServiceStatus {
    param([string]$ServiceName)
    
    Write-ColorOutput "Checking ManagerAgentAI service status..." -Color Info
    Write-Log "Checking service status: $ServiceName" "INFO"
    
    try {
        $status = launchctl list | Select-String "manageragentai"
        if ($status) {
            Write-ColorOutput "Service Status:" -Color Info
            Write-ColorOutput $status -Color Info
            Write-ColorOutput "✅ Service is running" -Color Success
            Write-Log "Service is active: $ServiceName" "INFO"
            return $true
        } else {
            Write-ColorOutput "❌ Service is not running" -Color Error
            Write-Log "Service is not active: $ServiceName" "WARN"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Error checking service status" -Color Error
        Write-Log "Error checking service status: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Enable-macOSService {
    param([string]$ServiceName)
    
    Write-ColorOutput "Enabling ManagerAgentAI service..." -Color Info
    Write-Log "Enabling service: $ServiceName" "INFO"
    
    try {
        $plistPath = "$env:HOME/Library/LaunchAgents/com.manageragentai.$ServiceName.plist"
        if (Test-Path $plistPath) {
            launchctl load $plistPath
            Write-ColorOutput "✅ Service enabled successfully" -Color Success
            Write-Log "Service enabled successfully: $ServiceName" "INFO"
        } else {
            Write-ColorOutput "❌ Service plist not found" -Color Error
            Write-Log "Service plist not found: $plistPath" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Error enabling service" -Color Error
        Write-Log "Error enabling service: $($_.Exception.Message)" "ERROR"
        return $false
    }
    
    return $true
}

function Disable-macOSService {
    param([string]$ServiceName)
    
    Write-ColorOutput "Disabling ManagerAgentAI service..." -Color Info
    Write-Log "Disabling service: $ServiceName" "INFO"
    
    try {
        $plistPath = "$env:HOME/Library/LaunchAgents/com.manageragentai.$ServiceName.plist"
        if (Test-Path $plistPath) {
            launchctl unload $plistPath
            Write-ColorOutput "✅ Service disabled successfully" -Color Success
            Write-Log "Service disabled successfully: $ServiceName" "INFO"
        } else {
            Write-ColorOutput "❌ Service plist not found" -Color Error
            Write-Log "Service plist not found: $plistPath" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Error disabling service" -Color Error
        Write-Log "Error disabling service: $($_.Exception.Message)" "ERROR"
        return $false
    }
    
    return $true
}

function Show-macOSServiceLogs {
    param([string]$ServiceName, [int]$Lines = 50)
    
    Write-ColorOutput "Showing ManagerAgentAI service logs..." -Color Info
    Write-Log "Showing service logs: $ServiceName" "INFO"
    
    try {
        $logPath = "$InstallPath/logs/launchagent.log"
        if (Test-Path $logPath) {
            Write-ColorOutput "Recent logs (last $Lines lines):" -Color Info
            Write-ColorOutput "================================" -Color Info
            Get-Content $logPath -Tail $Lines
            Write-ColorOutput ""
            Write-ColorOutput "To follow logs in real-time, run:" -Color Info
            Write-ColorOutput "  tail -f $logPath" -Color Info
        } else {
            Write-ColorOutput "❌ Log file not found: $logPath" -Color Error
            Write-Log "Log file not found: $logPath" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Error showing service logs" -Color Error
        Write-Log "Error showing service logs: $($_.Exception.Message)" "ERROR"
        return $false
    }
    
    return $true
}

function Reload-macOSService {
    param([string]$ServiceName)
    
    Write-ColorOutput "Reloading ManagerAgentAI service..." -Color Info
    Write-Log "Reloading service: $ServiceName" "INFO"
    
    try {
        $plistPath = "$env:HOME/Library/LaunchAgents/com.manageragentai.$ServiceName.plist"
        if (Test-Path $plistPath) {
            launchctl unload $plistPath
            Start-Sleep -Seconds 1
            launchctl load $plistPath
            Write-ColorOutput "✅ Service reloaded successfully" -Color Success
            Write-Log "Service reloaded successfully: $ServiceName" "INFO"
        } else {
            Write-ColorOutput "❌ Service plist not found" -Color Error
            Write-Log "Service plist not found: $plistPath" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Error reloading service" -Color Error
        Write-Log "Error reloading service: $($_.Exception.Message)" "ERROR"
        return $false
    }
    
    return $true
}

function Show-Usage {
    Write-ColorOutput "Usage: .\macos-service-manager.ps1 -Action <action> [options]" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Actions:" -Color Info
    Write-ColorOutput "  install    - Install LaunchAgent service" -Color Info
    Write-ColorOutput "  uninstall  - Uninstall LaunchAgent service" -Color Info
    Write-ColorOutput "  start      - Start the service" -Color Info
    Write-ColorOutput "  stop       - Stop the service" -Color Info
    Write-ColorOutput "  restart    - Restart the service" -Color Info
    Write-ColorOutput "  status     - Show service status" -Color Info
    Write-ColorOutput "  enable     - Enable service at login" -Color Info
    Write-ColorOutput "  disable    - Disable service at login" -Color Info
    Write-ColorOutput "  logs       - Show service logs" -Color Info
    Write-ColorOutput "  reload     - Reload service configuration" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Options:" -Color Info
    Write-ColorOutput "  -ServiceName   - Service name (default: manageragentai)" -Color Info
    Write-ColorOutput "  -ServiceUser   - Service user (default: manageragentai)" -Color Info
    Write-ColorOutput "  -InstallPath   - Installation path (default: /opt/manageragentai)" -Color Info
    Write-ColorOutput "  -Verbose       - Show detailed output" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" -Color Info
    Write-ColorOutput "  .\macos-service-manager.ps1 -Action install" -Color Info
    Write-ColorOutput "  .\macos-service-manager.ps1 -Action start" -Color Info
    Write-ColorOutput "  .\macos-service-manager.ps1 -Action status -Verbose" -Color Info
    Write-ColorOutput "  .\macos-service-manager.ps1 -Action logs" -Color Info
}

# Main execution
function Main {
    Show-Header
    
    # Test macOS environment
    if (-not (Test-macOSEnvironment)) {
        Write-ColorOutput "❌ macOS environment test failed" -Color Error
        exit 1
    }
    
    # Execute requested action
    switch ($Action) {
        "install" {
            if (Install-macOSService -ServiceName $ServiceName -ServiceUser $ServiceUser -InstallPath $InstallPath) {
                Write-ColorOutput "🎉 Service installation completed successfully!" -Color Success
            } else {
                Write-ColorOutput "❌ Service installation failed" -Color Error
                exit 1
            }
        }
        "uninstall" {
            if (Uninstall-macOSService -ServiceName $ServiceName -ServiceUser $ServiceUser -InstallPath $InstallPath) {
                Write-ColorOutput "🎉 Service uninstallation completed successfully!" -Color Success
            } else {
                Write-ColorOutput "❌ Service uninstallation failed" -Color Error
                exit 1
            }
        }
        "start" {
            if (Start-macOSService -ServiceName $ServiceName) {
                Write-ColorOutput "🎉 Service started successfully!" -Color Success
            } else {
                Write-ColorOutput "❌ Service start failed" -Color Error
                exit 1
            }
        }
        "stop" {
            if (Stop-macOSService -ServiceName $ServiceName) {
                Write-ColorOutput "🎉 Service stopped successfully!" -Color Success
            } else {
                Write-ColorOutput "❌ Service stop failed" -Color Error
                exit 1
            }
        }
        "restart" {
            if (Restart-macOSService -ServiceName $ServiceName) {
                Write-ColorOutput "🎉 Service restarted successfully!" -Color Success
            } else {
                Write-ColorOutput "❌ Service restart failed" -Color Error
                exit 1
            }
        }
        "status" {
            Get-macOSServiceStatus -ServiceName $ServiceName
        }
        "enable" {
            if (Enable-macOSService -ServiceName $ServiceName) {
                Write-ColorOutput "🎉 Service enabled successfully!" -Color Success
            } else {
                Write-ColorOutput "❌ Service enable failed" -Color Error
                exit 1
            }
        }
        "disable" {
            if (Disable-macOSService -ServiceName $ServiceName) {
                Write-ColorOutput "🎉 Service disabled successfully!" -Color Success
            } else {
                Write-ColorOutput "❌ Service disable failed" -Color Error
                exit 1
            }
        }
        "logs" {
            Show-macOSServiceLogs -ServiceName $ServiceName
        }
        "reload" {
            if (Reload-macOSService -ServiceName $ServiceName) {
                Write-ColorOutput "🎉 Service reloaded successfully!" -Color Success
            } else {
                Write-ColorOutput "❌ Service reload failed" -Color Error
                exit 1
            }
        }
        default {
            Write-ColorOutput "❌ Unknown action: $Action" -Color Error
            Show-Usage
            exit 1
        }
    }
    
    Write-Log "macOS service management action completed: $Action" "INFO"
}

# Run main function
Main
