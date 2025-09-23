# Linux Installer Script for ManagerAgentAI v2.5
# Provides native Linux installation and setup

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("ubuntu", "debian", "rhel", "centos", "suse", "arch", "auto")]
    [string]$Distribution = "auto",
    
    [Parameter(Mandatory=$false)]
    [switch]$InstallDependencies = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$CreateService = $false,
    
    [Parameter(Mandatory=$false)]
    [string]$InstallPath = "/opt/manageragentai",
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceUser = "manageragentai",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Script configuration
$ScriptName = "Linux-Installer"
$Version = "2.5.0"
$LogFile = "linux-install.log"

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
    Write-ColorOutput "🐧 ManagerAgentAI Linux Installer v2.5" -Color Header
    Write-ColorOutput "=======================================" -Color Header
    Write-ColorOutput "Universal Automation Platform for Linux" -Color Info
    Write-ColorOutput ""
}

function Test-LinuxEnvironment {
    Write-Log "Testing Linux environment compatibility..." "INFO"
    
    # Check if running on Linux
    if (-not $IsLinux) {
        Write-Log "This script must be run on a Linux system" "ERROR"
        return $false
    }
    
    # Test PowerShell Core
    try {
        $psVersion = pwsh --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ PowerShell Core: $psVersion" -Color Success
            Write-Log "PowerShell Core version: $psVersion" "INFO"
        } else {
            Write-ColorOutput "❌ PowerShell Core not found" -Color Error
            Write-Log "PowerShell Core not found" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ PowerShell Core test failed" -Color Error
        Write-Log "PowerShell Core test failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
    
    # Test Python
    try {
        $pythonVersion = python3 --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Python: $pythonVersion" -Color Success
            Write-Log "Python version: $pythonVersion" "INFO"
        } else {
            Write-ColorOutput "❌ Python3 not found" -Color Error
            Write-Log "Python3 not found" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Python test failed" -Color Error
        Write-Log "Python test failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
    
    # Test Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Node.js: $nodeVersion" -Color Success
            Write-Log "Node.js version: $nodeVersion" "INFO"
        } else {
            Write-ColorOutput "❌ Node.js not found" -Color Error
            Write-Log "Node.js not found" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Node.js test failed" -Color Error
        Write-Log "Node.js test failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
    
    return $true
}

function Get-LinuxDistribution {
    if ($Distribution -eq "auto") {
        try {
            if (Test-Path "/etc/os-release") {
                $osRelease = Get-Content "/etc/os-release" -Raw
                if ($osRelease -match 'ID="?(\w+)"?') {
                    $Distribution = $matches[1]
                } elseif ($osRelease -match 'ID_LIKE="?(\w+)"?') {
                    $Distribution = $matches[1]
                }
            } elseif (Test-Path "/etc/redhat-release") {
                $Distribution = "rhel"
            } elseif (Test-Path "/etc/debian_version") {
                $Distribution = "debian"
            } else {
                $Distribution = "unknown"
            }
        } catch {
            Write-Log "Failed to detect Linux distribution: $($_.Exception.Message)" "WARN"
            $Distribution = "unknown"
        }
    }
    
    Write-Log "Detected Linux distribution: $Distribution" "INFO"
    return $Distribution
}

function Install-LinuxDependencies {
    param([string]$Distro)
    
    Write-ColorOutput "Installing dependencies for $Distro..." -Color Info
    Write-Log "Installing dependencies for distribution: $Distro" "INFO"
    
    switch ($Distro) {
        { $_ -in @("ubuntu", "debian") } {
            Write-ColorOutput "Using APT package manager..." -Color Info
            try {
                sudo apt update
                sudo apt install -y powershell python3 python3-pip nodejs npm git curl build-essential libssl-dev libffi-dev python3-dev
                Write-ColorOutput "✅ Dependencies installed successfully" -Color Success
                Write-Log "APT dependencies installed successfully" "INFO"
            } catch {
                Write-ColorOutput "❌ Failed to install dependencies" -Color Error
                Write-Log "Failed to install APT dependencies: $($_.Exception.Message)" "ERROR"
                return $false
            }
        }
        { $_ -in @("rhel", "centos") } {
            Write-ColorOutput "Using YUM package manager..." -Color Info
            try {
                sudo yum update -y
                sudo yum install -y powershell python3 python3-pip nodejs npm git curl gcc gcc-c++ make openssl-devel libffi-devel python3-devel
                Write-ColorOutput "✅ Dependencies installed successfully" -Color Success
                Write-Log "YUM dependencies installed successfully" "INFO"
            } catch {
                Write-ColorOutput "❌ Failed to install dependencies" -Color Error
                Write-Log "Failed to install YUM dependencies: $($_.Exception.Message)" "ERROR"
                return $false
            }
        }
        "suse" {
            Write-ColorOutput "Using Zypper package manager..." -Color Info
            try {
                sudo zypper refresh
                sudo zypper install -y powershell python3 python3-pip nodejs npm git curl gcc gcc-c++ make libopenssl-devel libffi-devel python3-devel
                Write-ColorOutput "✅ Dependencies installed successfully" -Color Success
                Write-Log "Zypper dependencies installed successfully" "INFO"
            } catch {
                Write-ColorOutput "❌ Failed to install dependencies" -Color Error
                Write-Log "Failed to install Zypper dependencies: $($_.Exception.Message)" "ERROR"
                return $false
            }
        }
        "arch" {
            Write-ColorOutput "Using Pacman package manager..." -Color Info
            try {
                sudo pacman -Syu --noconfirm
                sudo pacman -S --noconfirm powershell python python-pip nodejs npm git curl base-devel openssl libffi
                Write-ColorOutput "✅ Dependencies installed successfully" -Color Success
                Write-Log "Pacman dependencies installed successfully" "INFO"
            } catch {
                Write-ColorOutput "❌ Failed to install dependencies" -Color Error
                Write-Log "Failed to install Pacman dependencies: $($_.Exception.Message)" "ERROR"
                return $false
            }
        }
        default {
            Write-ColorOutput "❌ Unsupported Linux distribution: $Distro" -Color Error
            Write-Log "Unsupported Linux distribution: $Distro" "ERROR"
            return $false
        }
    }
    
    return $true
}

function Install-ManagerAgentAI {
    param([string]$InstallPath, [string]$ServiceUser)
    
    Write-ColorOutput "Installing ManagerAgentAI to $InstallPath..." -Color Info
    Write-Log "Installing ManagerAgentAI to: $InstallPath" "INFO"
    
    try {
        # Create installation directory
        sudo mkdir -p $InstallPath
        Write-Log "Created installation directory: $InstallPath" "INFO"
        
        # Copy application files
        $currentDir = Get-Location
        sudo cp -r "$currentDir/*" $InstallPath/
        Write-Log "Copied application files to: $InstallPath" "INFO"
        
        # Create service user
        sudo useradd -r -s /bin/false $ServiceUser 2>$null
        Write-Log "Created service user: $ServiceUser" "INFO"
        
        # Set permissions
        sudo chown -R $ServiceUser`:$ServiceUser $InstallPath
        sudo chmod +x $InstallPath/scripts/*.ps1
        Write-Log "Set permissions for service user: $ServiceUser" "INFO"
        
        Write-ColorOutput "✅ ManagerAgentAI installed successfully" -Color Success
        Write-Log "ManagerAgentAI installation completed successfully" "INFO"
        
        return $true
    } catch {
        Write-ColorOutput "❌ Failed to install ManagerAgentAI" -Color Error
        Write-Log "Failed to install ManagerAgentAI: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Install-SystemdService {
    param([string]$ServiceName, [string]$ServiceUser, [string]$InstallPath)
    
    Write-ColorOutput "Installing systemd service..." -Color Info
    Write-Log "Installing systemd service: $ServiceName" "INFO"
    
    try {
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

[Install]
WantedBy=multi-user.target
"@
        
        $serviceContent | sudo tee "/etc/systemd/system/$ServiceName.service" > $null
        Write-Log "Created systemd service file: /etc/systemd/system/$ServiceName.service" "INFO"
        
        # Reload systemd and enable service
        sudo systemctl daemon-reload
        sudo systemctl enable $ServiceName
        Write-Log "Enabled systemd service: $ServiceName" "INFO"
        
        Write-ColorOutput "✅ Systemd service installed successfully" -Color Success
        Write-Log "Systemd service installation completed successfully" "INFO"
        
        return $true
    } catch {
        Write-ColorOutput "❌ Failed to install systemd service" -Color Error
        Write-Log "Failed to install systemd service: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Show-InstallationSummary {
    param([string]$InstallPath, [string]$ServiceName)
    
    Write-ColorOutput ""
    Write-ColorOutput "🎉 Installation Complete!" -Color Success
    Write-ColorOutput "========================" -Color Success
    Write-ColorOutput ""
    Write-ColorOutput "ManagerAgentAI has been successfully installed to: $InstallPath" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Service Management Commands:" -Color Info
    Write-ColorOutput "  Start:   sudo systemctl start $ServiceName" -Color Info
    Write-ColorOutput "  Stop:    sudo systemctl stop $ServiceName" -Color Info
    Write-ColorOutput "  Status:  sudo systemctl status $ServiceName" -Color Info
    Write-ColorOutput "  Restart: sudo systemctl restart $ServiceName" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Manual Start:" -Color Info
    Write-ColorOutput "  pwsh -File $InstallPath/scripts/start-platform.ps1" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Logs:" -Color Info
    Write-ColorOutput "  journalctl -u $ServiceName -f" -Color Info
    Write-ColorOutput ""
}

# Main execution
function Main {
    Show-Header
    
    # Test Linux environment
    if (-not (Test-LinuxEnvironment)) {
        Write-ColorOutput "❌ Linux environment test failed" -Color Error
        exit 1
    }
    
    # Detect Linux distribution
    $distro = Get-LinuxDistribution
    if ($distro -eq "unknown") {
        Write-ColorOutput "❌ Unable to detect Linux distribution" -Color Error
        exit 1
    }
    
    # Install dependencies if requested
    if ($InstallDependencies) {
        if (-not (Install-LinuxDependencies -Distro $distro)) {
            Write-ColorOutput "❌ Failed to install dependencies" -Color Error
            exit 1
        }
    }
    
    # Install ManagerAgentAI
    if (-not (Install-ManagerAgentAI -InstallPath $InstallPath -ServiceUser $ServiceUser)) {
        Write-ColorOutput "❌ Failed to install ManagerAgentAI" -Color Error
        exit 1
    }
    
    # Install systemd service if requested
    if ($CreateService) {
        if (-not (Install-SystemdService -ServiceName "manageragentai" -ServiceUser $ServiceUser -InstallPath $InstallPath)) {
            Write-ColorOutput "❌ Failed to install systemd service" -Color Error
            exit 1
        }
    }
    
    # Show installation summary
    Show-InstallationSummary -InstallPath $InstallPath -ServiceName "manageragentai"
    
    Write-Log "Linux installation completed successfully" "INFO"
}

# Run main function
Main
