# Linux Service Manager Script for ManagerAgentAI v2.5
# Manages systemd service for ManagerAgentAI on Linux

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
$ScriptName = "Linux-Service-Manager"
$Version = "2.5.0"
$LogFile = "linux-service.log"

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
    Write-ColorOutput "🐧 ManagerAgentAI Linux Service Manager v2.5" -Color Header
    Write-ColorOutput "===========================================" -Color Header
    Write-ColorOutput "Systemd Service Management for Linux" -Color Info
    Write-ColorOutput ""
}

function Test-LinuxEnvironment {
    if (-not $IsLinux) {
        Write-ColorOutput "❌ This script must be run on a Linux system" -Color Error
        Write-Log "Script run on non-Linux system" "ERROR"
        return $false
    }
    
    # Check if systemd is available
    try {
        $systemctlVersion = systemctl --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Systemd is available" "INFO"
            return $true
        } else {
            Write-ColorOutput "❌ Systemd not available" -Color Error
            Write-Log "Systemd not available" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Failed to check systemd availability" -Color Error
        Write-Log "Failed to check systemd: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Install-LinuxService {
    param([string]$ServiceName, [string]$ServiceUser, [string]$InstallPath)
    
    Write-ColorOutput "Installing ManagerAgentAI as systemd service..." -Color Info
    Write-Log "Installing systemd service: $ServiceName" "INFO"
    
    try {
        # Create service user if it doesn't exist
        $userExists = id $ServiceUser 2>$null
        if ($LASTEXITCODE -ne 0) {
            sudo useradd -r -s /bin/false $ServiceUser
            Write-Log "Created service user: $ServiceUser" "INFO"
        } else {
            Write-Log "Service user already exists: $ServiceUser" "INFO"
        }
        
        # Create service directory if it doesn't exist
        if (-not (Test-Path $InstallPath)) {
            sudo mkdir -p $InstallPath
            Write-Log "Created service directory: $InstallPath" "INFO"
        }
        
        # Create service file
        $serviceContent = @"
[Unit]
Description=ManagerAgentAI Universal Automation Platform
After=network.target

[Service]
Type=simple
User=$ServiceUser
Group=$ServiceUser
WorkingDirectory=$InstallPath
ExecStart=/usr/bin/pwsh -File $InstallPath/scripts/start-platform.ps1
ExecReload=/bin/kill -HUP `$MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
"@
        
        $serviceContent | sudo tee "/etc/systemd/system/$ServiceName.service" > $null
        Write-Log "Created systemd service file: /etc/systemd/system/$ServiceName.service" "INFO"
        
        # Set permissions
        sudo chown -R $ServiceUser`:$ServiceUser $InstallPath
        sudo chmod +x $InstallPath/scripts/*.ps1
        Write-Log "Set permissions for service user: $ServiceUser" "INFO"
        
        # Reload systemd and enable service
        sudo systemctl daemon-reload
        sudo systemctl enable $ServiceName
        Write-Log "Enabled systemd service: $ServiceName" "INFO"
        
        Write-ColorOutput "✅ Service installed successfully" -Color Success
        Write-Log "Systemd service installation completed successfully" "INFO"
        
        return $true
    } catch {
        Write-ColorOutput "❌ Failed to install service" -Color Error
        Write-Log "Failed to install systemd service: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Uninstall-LinuxService {
    param([string]$ServiceName, [string]$ServiceUser, [string]$InstallPath)
    
    Write-ColorOutput "Uninstalling ManagerAgentAI systemd service..." -Color Info
    Write-Log "Uninstalling systemd service: $ServiceName" "INFO"
    
    try {
        # Stop and disable service
        sudo systemctl stop $ServiceName 2>$null
        sudo systemctl disable $ServiceName 2>$null
        Write-Log "Stopped and disabled service: $ServiceName" "INFO"
        
        # Remove service file
        if (Test-Path "/etc/systemd/system/$ServiceName.service") {
            sudo rm "/etc/systemd/system/$ServiceName.service"
            Write-Log "Removed service file: /etc/systemd/system/$ServiceName.service" "INFO"
        }
        
        # Reload systemd
        sudo systemctl daemon-reload
        Write-Log "Reloaded systemd daemon" "INFO"
        
        # Remove service user (optional)
        if ($ServiceUser -and (id $ServiceUser 2>$null)) {
            sudo userdel $ServiceUser 2>$null
            Write-Log "Removed service user: $ServiceUser" "INFO"
        }
        
        Write-ColorOutput "✅ Service uninstalled successfully" -Color Success
        Write-Log "Systemd service uninstallation completed successfully" "INFO"
        
        return $true
    } catch {
        Write-ColorOutput "❌ Failed to uninstall service" -Color Error
        Write-Log "Failed to uninstall systemd service: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Start-LinuxService {
    param([string]$ServiceName)
    
    Write-ColorOutput "Starting ManagerAgentAI service..." -Color Info
    Write-Log "Starting service: $ServiceName" "INFO"
    
    try {
        sudo systemctl start $ServiceName
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Service started successfully" -Color Success
            Write-Log "Service started successfully: $ServiceName" "INFO"
            
            # Show status
            Start-Sleep -Seconds 2
            sudo systemctl status $ServiceName --no-pager
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

function Stop-LinuxService {
    param([string]$ServiceName)
    
    Write-ColorOutput "Stopping ManagerAgentAI service..." -Color Info
    Write-Log "Stopping service: $ServiceName" "INFO"
    
    try {
        sudo systemctl stop $ServiceName
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

function Restart-LinuxService {
    param([string]$ServiceName)
    
    Write-ColorOutput "Restarting ManagerAgentAI service..." -Color Info
    Write-Log "Restarting service: $ServiceName" "INFO"
    
    try {
        sudo systemctl restart $ServiceName
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Service restarted successfully" -Color Success
            Write-Log "Service restarted successfully: $ServiceName" "INFO"
            
            # Show status
            Start-Sleep -Seconds 2
            sudo systemctl status $ServiceName --no-pager
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

function Get-LinuxServiceStatus {
    param([string]$ServiceName)
    
    Write-ColorOutput "Checking ManagerAgentAI service status..." -Color Info
    Write-Log "Checking service status: $ServiceName" "INFO"
    
    try {
        $status = sudo systemctl status $ServiceName --no-pager
        Write-ColorOutput $status -Color Info
        
        # Check if service is active
        $isActive = sudo systemctl is-active $ServiceName
        if ($isActive -eq "active") {
            Write-ColorOutput "✅ Service is running" -Color Success
            Write-Log "Service is active: $ServiceName" "INFO"
        } else {
            Write-ColorOutput "❌ Service is not running" -Color Error
            Write-Log "Service is not active: $ServiceName" "WARN"
        }
        
        return $isActive -eq "active"
    } catch {
        Write-ColorOutput "❌ Error checking service status" -Color Error
        Write-Log "Error checking service status: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Enable-LinuxService {
    param([string]$ServiceName)
    
    Write-ColorOutput "Enabling ManagerAgentAI service..." -Color Info
    Write-Log "Enabling service: $ServiceName" "INFO"
    
    try {
        sudo systemctl enable $ServiceName
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Service enabled successfully" -Color Success
            Write-Log "Service enabled successfully: $ServiceName" "INFO"
        } else {
            Write-ColorOutput "❌ Failed to enable service" -Color Error
            Write-Log "Failed to enable service: $ServiceName" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Error enabling service" -Color Error
        Write-Log "Error enabling service: $($_.Exception.Message)" "ERROR"
        return $false
    }
    
    return $true
}

function Disable-LinuxService {
    param([string]$ServiceName)
    
    Write-ColorOutput "Disabling ManagerAgentAI service..." -Color Info
    Write-Log "Disabling service: $ServiceName" "INFO"
    
    try {
        sudo systemctl disable $ServiceName
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Service disabled successfully" -Color Success
            Write-Log "Service disabled successfully: $ServiceName" "INFO"
        } else {
            Write-ColorOutput "❌ Failed to disable service" -Color Error
            Write-Log "Failed to disable service: $ServiceName" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Error disabling service" -Color Error
        Write-Log "Error disabling service: $($_.Exception.Message)" "ERROR"
        return $false
    }
    
    return $true
}

function Show-LinuxServiceLogs {
    param([string]$ServiceName, [int]$Lines = 50)
    
    Write-ColorOutput "Showing ManagerAgentAI service logs..." -Color Info
    Write-Log "Showing service logs: $ServiceName" "INFO"
    
    try {
        Write-ColorOutput "Recent logs (last $Lines lines):" -Color Info
        Write-ColorOutput "================================" -Color Info
        sudo journalctl -u $ServiceName -n $Lines --no-pager
        Write-ColorOutput ""
        Write-ColorOutput "To follow logs in real-time, run:" -Color Info
        Write-ColorOutput "  sudo journalctl -u $ServiceName -f" -Color Info
    } catch {
        Write-ColorOutput "❌ Error showing service logs" -Color Error
        Write-Log "Error showing service logs: $($_.Exception.Message)" "ERROR"
        return $false
    }
    
    return $true
}

function Reload-LinuxService {
    param([string]$ServiceName)
    
    Write-ColorOutput "Reloading ManagerAgentAI service..." -Color Info
    Write-Log "Reloading service: $ServiceName" "INFO"
    
    try {
        sudo systemctl reload $ServiceName
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Service reloaded successfully" -Color Success
            Write-Log "Service reloaded successfully: $ServiceName" "INFO"
        } else {
            Write-ColorOutput "❌ Failed to reload service" -Color Error
            Write-Log "Failed to reload service: $ServiceName" "ERROR"
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
    Write-ColorOutput "Usage: .\linux-service-manager.ps1 -Action <action> [options]" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Actions:" -Color Info
    Write-ColorOutput "  install    - Install systemd service" -Color Info
    Write-ColorOutput "  uninstall  - Uninstall systemd service" -Color Info
    Write-ColorOutput "  start      - Start the service" -Color Info
    Write-ColorOutput "  stop       - Stop the service" -Color Info
    Write-ColorOutput "  restart    - Restart the service" -Color Info
    Write-ColorOutput "  status     - Show service status" -Color Info
    Write-ColorOutput "  enable     - Enable service at boot" -Color Info
    Write-ColorOutput "  disable    - Disable service at boot" -Color Info
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
    Write-ColorOutput "  .\linux-service-manager.ps1 -Action install" -Color Info
    Write-ColorOutput "  .\linux-service-manager.ps1 -Action start" -Color Info
    Write-ColorOutput "  .\linux-service-manager.ps1 -Action status -Verbose" -Color Info
    Write-ColorOutput "  .\linux-service-manager.ps1 -Action logs" -Color Info
}

# Main execution
function Main {
    Show-Header
    
    # Test Linux environment
    if (-not (Test-LinuxEnvironment)) {
        Write-ColorOutput "❌ Linux environment test failed" -Color Error
        exit 1
    }
    
    # Execute requested action
    switch ($Action) {
        "install" {
            if (Install-LinuxService -ServiceName $ServiceName -ServiceUser $ServiceUser -InstallPath $InstallPath) {
                Write-ColorOutput "🎉 Service installation completed successfully!" -Color Success
            } else {
                Write-ColorOutput "❌ Service installation failed" -Color Error
                exit 1
            }
        }
        "uninstall" {
            if (Uninstall-LinuxService -ServiceName $ServiceName -ServiceUser $ServiceUser -InstallPath $InstallPath) {
                Write-ColorOutput "🎉 Service uninstallation completed successfully!" -Color Success
            } else {
                Write-ColorOutput "❌ Service uninstallation failed" -Color Error
                exit 1
            }
        }
        "start" {
            if (Start-LinuxService -ServiceName $ServiceName) {
                Write-ColorOutput "🎉 Service started successfully!" -Color Success
            } else {
                Write-ColorOutput "❌ Service start failed" -Color Error
                exit 1
            }
        }
        "stop" {
            if (Stop-LinuxService -ServiceName $ServiceName) {
                Write-ColorOutput "🎉 Service stopped successfully!" -Color Success
            } else {
                Write-ColorOutput "❌ Service stop failed" -Color Error
                exit 1
            }
        }
        "restart" {
            if (Restart-LinuxService -ServiceName $ServiceName) {
                Write-ColorOutput "🎉 Service restarted successfully!" -Color Success
            } else {
                Write-ColorOutput "❌ Service restart failed" -Color Error
                exit 1
            }
        }
        "status" {
            Get-LinuxServiceStatus -ServiceName $ServiceName
        }
        "enable" {
            if (Enable-LinuxService -ServiceName $ServiceName) {
                Write-ColorOutput "🎉 Service enabled successfully!" -Color Success
            } else {
                Write-ColorOutput "❌ Service enable failed" -Color Error
                exit 1
            }
        }
        "disable" {
            if (Disable-LinuxService -ServiceName $ServiceName) {
                Write-ColorOutput "🎉 Service disabled successfully!" -Color Success
            } else {
                Write-ColorOutput "❌ Service disable failed" -Color Error
                exit 1
            }
        }
        "logs" {
            Show-LinuxServiceLogs -ServiceName $ServiceName
        }
        "reload" {
            if (Reload-LinuxService -ServiceName $ServiceName) {
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
    
    Write-Log "Linux service management action completed: $Action" "INFO"
}

# Run main function
Main
