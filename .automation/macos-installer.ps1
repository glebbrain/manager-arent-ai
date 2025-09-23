# macOS Installer Script for ManagerAgentAI v2.5
# Provides native macOS installation and setup

param(
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
$ScriptName = "macOS-Installer"
$Version = "2.5.0"
$LogFile = "macos-install.log"

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
    Write-ColorOutput "🍎 ManagerAgentAI macOS Installer v2.5" -Color Header
    Write-ColorOutput "=====================================" -Color Header
    Write-ColorOutput "Universal Automation Platform for macOS" -Color Info
    Write-ColorOutput ""
}

function Test-macOSEnvironment {
    Write-Log "Testing macOS environment compatibility..." "INFO"
    
    # Check if running on macOS
    if (-not $IsMacOS) {
        Write-Log "This script must be run on a macOS system" "ERROR"
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
    
    # Test Homebrew
    try {
        $brewVersion = brew --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Homebrew: Available" -Color Success
            Write-Log "Homebrew is available" "INFO"
        } else {
            Write-ColorOutput "⚠️ Homebrew not found (will be installed)" -Color Warning
            Write-Log "Homebrew not found" "WARN"
        }
    } catch {
        Write-ColorOutput "⚠️ Homebrew test failed (will be installed)" -Color Warning
        Write-Log "Homebrew test failed: $($_.Exception.Message)" "WARN"
    }
    
    return $true
}

function Install-macOSDependencies {
    Write-ColorOutput "Installing macOS dependencies..." -Color Info
    Write-Log "Installing macOS dependencies" "INFO"
    
    try {
        # Install Homebrew if not present
        if (-not (Get-Command brew -ErrorAction SilentlyContinue)) {
            Write-ColorOutput "Installing Homebrew..." -Color Info
            Write-Log "Installing Homebrew" "INFO"
            
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            
            # Add Homebrew to PATH for current session
            $env:PATH = "/opt/homebrew/bin:$env:PATH"
            Write-Log "Homebrew installed and added to PATH" "INFO"
        }
        
        # Install dependencies via Homebrew
        Write-ColorOutput "Installing dependencies via Homebrew..." -Color Info
        Write-Log "Installing dependencies via Homebrew" "INFO"
        
        brew install powershell python node git
        Write-ColorOutput "✅ macOS dependencies installed" -Color Success
        Write-Log "macOS dependencies installed successfully" "INFO"
        
        return $true
    } catch {
        Write-ColorOutput "❌ Failed to install macOS dependencies" -Color Error
        Write-Log "Failed to install macOS dependencies: $($_.Exception.Message)" "ERROR"
        return $false
    }
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
        sudo dscl . -create /Users/$ServiceUser
        sudo dscl . -create /Users/$ServiceUser UserShell /bin/false
        sudo dscl . -create /Users/$ServiceUser RealName "ManagerAgentAI Service"
        sudo dscl . -create /Users/$ServiceUser UniqueID 200
        sudo dscl . -create /Users/$ServiceUser PrimaryGroupID 20
        Write-Log "Created service user: $ServiceUser" "INFO"
        
        # Set permissions
        sudo chown -R $ServiceUser`:staff $InstallPath
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

function Install-LaunchAgent {
    param([string]$ServiceName, [string]$ServiceUser, [string]$InstallPath)
    
    Write-ColorOutput "Installing LaunchAgent..." -Color Info
    Write-Log "Installing LaunchAgent: $ServiceName" "INFO"
    
    try {
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
        
        # Load the LaunchAgent
        launchctl load $plistPath
        Write-Log "Loaded LaunchAgent: $ServiceName" "INFO"
        
        Write-ColorOutput "✅ LaunchAgent installed successfully" -Color Success
        Write-Log "LaunchAgent installation completed successfully" "INFO"
        
        return $true
    } catch {
        Write-ColorOutput "❌ Failed to install LaunchAgent" -Color Error
        Write-Log "Failed to install LaunchAgent: $($_.Exception.Message)" "ERROR"
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
    Write-ColorOutput "  Start:   launchctl start com.manageragentai.$ServiceName" -Color Info
    Write-ColorOutput "  Stop:    launchctl stop com.manageragentai.$ServiceName" -Color Info
    Write-ColorOutput "  Status:  launchctl list | grep manageragentai" -Color Info
    Write-ColorOutput "  Restart: launchctl unload ~/Library/LaunchAgents/com.manageragentai.$ServiceName.plist && launchctl load ~/Library/LaunchAgents/com.manageragentai.$ServiceName.plist" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Manual Start:" -Color Info
    Write-ColorOutput "  pwsh -File $InstallPath/scripts/start-platform.ps1" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Logs:" -Color Info
    Write-ColorOutput "  tail -f $InstallPath/logs/launchagent.log" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Accessibility Permissions:" -Color Info
    Write-ColorOutput "  Go to System Preferences > Security & Privacy > Privacy > Accessibility" -Color Info
    Write-ColorOutput "  Add Terminal or your terminal app to the list of allowed applications" -Color Info
    Write-ColorOutput ""
}

# Main execution
function Main {
    Show-Header
    
    # Test macOS environment
    if (-not (Test-macOSEnvironment)) {
        Write-ColorOutput "❌ macOS environment test failed" -Color Error
        exit 1
    }
    
    # Install dependencies if requested
    if ($InstallDependencies) {
        if (-not (Install-macOSDependencies)) {
            Write-ColorOutput "❌ Failed to install dependencies" -Color Error
            exit 1
        }
    }
    
    # Install ManagerAgentAI
    if (-not (Install-ManagerAgentAI -InstallPath $InstallPath -ServiceUser $ServiceUser)) {
        Write-ColorOutput "❌ Failed to install ManagerAgentAI" -Color Error
        exit 1
    }
    
    # Install LaunchAgent if requested
    if ($CreateService) {
        if (-not (Install-LaunchAgent -ServiceName "manageragentai" -ServiceUser $ServiceUser -InstallPath $InstallPath)) {
            Write-ColorOutput "❌ Failed to install LaunchAgent" -Color Error
            exit 1
        }
    }
    
    # Show installation summary
    Show-InstallationSummary -InstallPath $InstallPath -ServiceName "manageragentai"
    
    Write-Log "macOS installation completed successfully" "INFO"
}

# Run main function
Main
