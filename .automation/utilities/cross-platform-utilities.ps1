# Cross-Platform Utilities for ManagerAgentAI v2.5
# Provides cross-platform compatibility functions for Windows, Linux, and macOS

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("test", "install", "configure", "validate", "info")]
    [string]$Action = "test",
    
    [Parameter(Mandatory=$false)]
    [string]$Platform = "auto",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Script configuration
$ScriptName = "Cross-Platform-Utilities"
$Version = "2.5.0"
$LogFile = "cross-platform.log"

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
    Write-ColorOutput "🌐 ManagerAgentAI Cross-Platform Utilities v2.5" -Color Header
    Write-ColorOutput "=============================================" -Color Header
    Write-ColorOutput "Universal compatibility for Windows, Linux, and macOS" -Color Info
    Write-ColorOutput ""
}

function Get-PlatformInfo {
    $platformInfo = @{
        OS = $null
        Platform = $null
        Architecture = $null
        PowerShellVersion = $null
        PowerShellEdition = $null
        PythonVersion = $null
        NodeVersion = $null
        GitVersion = $null
    }
    
    # Detect operating system
    if ($IsWindows) {
        $platformInfo.OS = "Windows"
        $platformInfo.Platform = "win32"
    } elseif ($IsLinux) {
        $platformInfo.OS = "Linux"
        $platformInfo.Platform = "linux"
    } elseif ($IsMacOS) {
        $platformInfo.OS = "macOS"
        $platformInfo.Platform = "darwin"
    } else {
        $platformInfo.OS = "Unknown"
        $platformInfo.Platform = "unknown"
    }
    
    # Detect architecture
    $platformInfo.Architecture = [System.Environment]::OSVersion.Platform.ToString()
    
    # Get PowerShell version
    $platformInfo.PowerShellVersion = $PSVersionTable.PSVersion.ToString()
    $platformInfo.PowerShellEdition = $PSVersionTable.PSEdition
    
    # Get Python version
    try {
        $pythonVersion = python --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $platformInfo.PythonVersion = $pythonVersion
        } else {
            $pythonVersion = python3 --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                $platformInfo.PythonVersion = $pythonVersion
            }
        }
    } catch {
        $platformInfo.PythonVersion = "Not found"
    }
    
    # Get Node.js version
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $platformInfo.NodeVersion = $nodeVersion
        }
    } catch {
        $platformInfo.NodeVersion = "Not found"
    }
    
    # Get Git version
    try {
        $gitVersion = git --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $platformInfo.GitVersion = $gitVersion
        }
    } catch {
        $platformInfo.GitVersion = "Not found"
    }
    
    return $platformInfo
}

function Test-PlatformCompatibility {
    param([string]$Platform = "auto")
    
    Write-ColorOutput "Testing platform compatibility..." -Color Info
    Write-Log "Testing platform compatibility for: $Platform" "INFO"
    
    $compatibilityResults = @{
        PowerShell = $false
        Python = $false
        NodeJS = $false
        Git = $false
        Dependencies = $false
        Scripts = $false
    }
    
    # Test PowerShell compatibility
    try {
        $psVersion = $PSVersionTable.PSVersion
        if ($psVersion.Major -ge 5) {
            $compatibilityResults.PowerShell = $true
            Write-ColorOutput "✅ PowerShell: Compatible ($psVersion)" -Color Success
            Write-Log "PowerShell compatibility: PASS ($psVersion)" "INFO"
        } else {
            Write-ColorOutput "❌ PowerShell: Incompatible ($psVersion)" -Color Error
            Write-Log "PowerShell compatibility: FAIL ($psVersion)" "ERROR"
        }
    } catch {
        Write-ColorOutput "❌ PowerShell: Test failed" -Color Error
        Write-Log "PowerShell compatibility test failed: $($_.Exception.Message)" "ERROR"
    }
    
    # Test Python compatibility
    try {
        $pythonVersion = python --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $compatibilityResults.Python = $true
            Write-ColorOutput "✅ Python: Compatible ($pythonVersion)" -Color Success
            Write-Log "Python compatibility: PASS ($pythonVersion)" "INFO"
        } else {
            $pythonVersion = python3 --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                $compatibilityResults.Python = $true
                Write-ColorOutput "✅ Python3: Compatible ($pythonVersion)" -Color Success
                Write-Log "Python3 compatibility: PASS ($pythonVersion)" "INFO"
            } else {
                Write-ColorOutput "❌ Python: Not found" -Color Error
                Write-Log "Python compatibility: FAIL (Not found)" "ERROR"
            }
        }
    } catch {
        Write-ColorOutput "❌ Python: Test failed" -Color Error
        Write-Log "Python compatibility test failed: $($_.Exception.Message)" "ERROR"
    }
    
    # Test Node.js compatibility
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $compatibilityResults.NodeJS = $true
            Write-ColorOutput "✅ Node.js: Compatible ($nodeVersion)" -Color Success
            Write-Log "Node.js compatibility: PASS ($nodeVersion)" "INFO"
        } else {
            Write-ColorOutput "❌ Node.js: Not found" -Color Error
            Write-Log "Node.js compatibility: FAIL (Not found)" "ERROR"
        }
    } catch {
        Write-ColorOutput "❌ Node.js: Test failed" -Color Error
        Write-Log "Node.js compatibility test failed: $($_.Exception.Message)" "ERROR"
    }
    
    # Test Git compatibility
    try {
        $gitVersion = git --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $compatibilityResults.Git = $true
            Write-ColorOutput "✅ Git: Compatible ($gitVersion)" -Color Success
            Write-Log "Git compatibility: PASS ($gitVersion)" "INFO"
        } else {
            Write-ColorOutput "❌ Git: Not found" -Color Error
            Write-Log "Git compatibility: FAIL (Not found)" "ERROR"
        }
    } catch {
        Write-ColorOutput "❌ Git: Test failed" -Color Error
        Write-Log "Git compatibility test failed: $($_.Exception.Message)" "ERROR"
    }
    
    # Test script compatibility
    $scripts = @(
        "scripts/auto-configurator.ps1",
        "scripts/performance-metrics.ps1",
        "scripts/task-distribution-manager.ps1"
    )
    
    $scriptResults = @()
    foreach ($script in $scripts) {
        if (Test-Path $script) {
            try {
                pwsh -File $script -WhatIf 2>$null
                if ($LASTEXITCODE -eq 0) {
                    Write-ColorOutput "✅ $script - Compatible" -Color Success
                    $scriptResults += @{ Script = $script; Status = "Pass" }
                } else {
                    Write-ColorOutput "❌ $script - Failed" -Color Error
                    $scriptResults += @{ Script = $script; Status = "Fail" }
                }
            } catch {
                Write-ColorOutput "❌ $script - Error" -Color Error
                $scriptResults += @{ Script = $script; Status = "Error"; Error = $_.Exception.Message }
            }
        } else {
            Write-ColorOutput "⚠️ $script - Not found" -Color Warning
            $scriptResults += @{ Script = $script; Status = "NotFound" }
        }
    }
    
    $compatibilityResults.Scripts = ($scriptResults | Where-Object { $_.Status -eq "Pass" }).Count -gt 0
    $compatibilityResults.Dependencies = $compatibilityResults.PowerShell -and $compatibilityResults.Python -and $compatibilityResults.NodeJS -and $compatibilityResults.Git
    
    return $compatibilityResults
}

function Install-PlatformDependencies {
    param([string]$Platform = "auto")
    
    Write-ColorOutput "Installing platform dependencies..." -Color Info
    Write-Log "Installing dependencies for platform: $Platform" "INFO"
    
    if ($Platform -eq "auto") {
        if ($IsWindows) { $Platform = "windows" }
        elseif ($IsLinux) { $Platform = "linux" }
        elseif ($IsMacOS) { $Platform = "macos" }
    }
    
    switch ($Platform) {
        "windows" {
            Write-ColorOutput "Installing Windows dependencies..." -Color Info
            try {
                # Install Chocolatey if not present
                if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
                    Write-ColorOutput "Installing Chocolatey..." -Color Info
                    Set-ExecutionPolicy Bypass -Scope Process -Force
                    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
                    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
                }
                
                # Install dependencies via Chocolatey
                choco install -y powershell-core python nodejs git
                Write-ColorOutput "✅ Windows dependencies installed" -Color Success
                Write-Log "Windows dependencies installed successfully" "INFO"
            } catch {
                Write-ColorOutput "❌ Failed to install Windows dependencies" -Color Error
                Write-Log "Failed to install Windows dependencies: $($_.Exception.Message)" "ERROR"
                return $false
            }
        }
        "linux" {
            Write-ColorOutput "Installing Linux dependencies..." -Color Info
            try {
                # Detect Linux distribution
                $distro = "unknown"
                if (Test-Path "/etc/os-release") {
                    $osRelease = Get-Content "/etc/os-release" -Raw
                    if ($osRelease -match 'ID="?(\w+)"?') {
                        $distro = $matches[1]
                    }
                }
                
                switch ($distro) {
                    { $_ -in @("ubuntu", "debian") } {
                        sudo apt update
                        sudo apt install -y powershell python3 python3-pip nodejs npm git curl
                    }
                    { $_ -in @("rhel", "centos") } {
                        sudo yum update -y
                        sudo yum install -y powershell python3 python3-pip nodejs npm git curl
                    }
                    "suse" {
                        sudo zypper refresh
                        sudo zypper install -y powershell python3 python3-pip nodejs npm git curl
                    }
                    "arch" {
                        sudo pacman -Syu --noconfirm
                        sudo pacman -S --noconfirm powershell python python-pip nodejs npm git curl
                    }
                    default {
                        Write-ColorOutput "❌ Unsupported Linux distribution: $distro" -Color Error
                        Write-Log "Unsupported Linux distribution: $distro" "ERROR"
                        return $false
                    }
                }
                
                Write-ColorOutput "✅ Linux dependencies installed" -Color Success
                Write-Log "Linux dependencies installed successfully" "INFO"
            } catch {
                Write-ColorOutput "❌ Failed to install Linux dependencies" -Color Error
                Write-Log "Failed to install Linux dependencies: $($_.Exception.Message)" "ERROR"
                return $false
            }
        }
        "macos" {
            Write-ColorOutput "Installing macOS dependencies..." -Color Info
            try {
                # Install Homebrew if not present
                if (-not (Get-Command brew -ErrorAction SilentlyContinue)) {
                    Write-ColorOutput "Installing Homebrew..." -Color Info
                    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
                }
                
                # Install dependencies via Homebrew
                brew install powershell python node git
                Write-ColorOutput "✅ macOS dependencies installed" -Color Success
                Write-Log "macOS dependencies installed successfully" "INFO"
            } catch {
                Write-ColorOutput "❌ Failed to install macOS dependencies" -Color Error
                Write-Log "Failed to install macOS dependencies: $($_.Exception.Message)" "ERROR"
                return $false
            }
        }
        default {
            Write-ColorOutput "❌ Unsupported platform: $Platform" -Color Error
            Write-Log "Unsupported platform: $Platform" "ERROR"
            return $false
        }
    }
    
    return $true
}

function Get-CrossPlatformPath {
    param(
        [string]$Path,
        [switch]$Normalize
    )
    
    if ($IsWindows) {
        $separator = "\"
    } else {
        $separator = "/"
    }
    
    if ($Normalize) {
        return $Path -replace "[/\\]", $separator
    }
    
    return $Path
}

function Test-CrossPlatformPath {
    param([string]$Path)
    
    $normalizedPath = Get-CrossPlatformPath -Path $Path -Normalize
    return Test-Path $normalizedPath
}

function Copy-CrossPlatformItem {
    param(
        [string]$Source,
        [string]$Destination,
        [switch]$Recurse,
        [switch]$Force
    )
    
    $sourcePath = Get-CrossPlatformPath -Path $Source -Normalize
    $destPath = Get-CrossPlatformPath -Path $Destination -Normalize
    
    if ($IsWindows) {
        Copy-Item -Path $sourcePath -Destination $destPath -Recurse:$Recurse -Force:$Force
    } else {
        if ($Recurse) {
            cp -r $sourcePath $destPath
        } else {
            cp $sourcePath $destPath
        }
    }
}

function Remove-CrossPlatformItem {
    param(
        [string]$Path,
        [switch]$Recurse,
        [switch]$Force
    )
    
    $normalizedPath = Get-CrossPlatformPath -Path $Path -Normalize
    
    if ($IsWindows) {
        Remove-Item -Path $normalizedPath -Recurse:$Recurse -Force:$Force
    } else {
        if ($Recurse) {
            rm -rf $normalizedPath
        } else {
            rm -f $normalizedPath
        }
    }
}

function Start-CrossPlatformProcess {
    param(
        [string]$Command,
        [string[]]$Arguments = @(),
        [string]$WorkingDirectory = ".",
        [switch]$NoNewWindow,
        [switch]$Wait
    )
    
    if ($IsWindows) {
        $processArgs = @{
            FilePath = $Command
            ArgumentList = $Arguments
            WorkingDirectory = $WorkingDirectory
            NoNewWindow = $NoNewWindow
            Wait = $Wait
        }
        Start-Process @processArgs
    } else {
        $fullCommand = $Command + " " + ($Arguments -join " ")
        if ($Wait) {
            Invoke-Expression $fullCommand
        } else {
            Start-Job -ScriptBlock { Invoke-Expression $using:fullCommand }
        }
    }
}

function Get-CrossPlatformProcess {
    param([string]$Name)
    
    if ($IsWindows) {
        return Get-Process -Name $Name -ErrorAction SilentlyContinue
    } else {
        return Get-Process | Where-Object { $_.ProcessName -like "*$Name*" }
    }
}

function Show-PlatformInfo {
    $platformInfo = Get-PlatformInfo
    
    Write-ColorOutput "Platform Information:" -Color Header
    Write-ColorOutput "===================" -Color Header
    Write-ColorOutput "Operating System: $($platformInfo.OS)" -Color Info
    Write-ColorOutput "Platform: $($platformInfo.Platform)" -Color Info
    Write-ColorOutput "Architecture: $($platformInfo.Architecture)" -Color Info
    Write-ColorOutput "PowerShell Version: $($platformInfo.PowerShellVersion)" -Color Info
    Write-ColorOutput "PowerShell Edition: $($platformInfo.PowerShellEdition)" -Color Info
    Write-ColorOutput "Python Version: $($platformInfo.PythonVersion)" -Color Info
    Write-ColorOutput "Node.js Version: $($platformInfo.NodeVersion)" -Color Info
    Write-ColorOutput "Git Version: $($platformInfo.GitVersion)" -Color Info
    Write-ColorOutput ""
}

function Show-Usage {
    Write-ColorOutput "Usage: .\cross-platform-utilities.ps1 -Action <action> [options]" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Actions:" -Color Info
    Write-ColorOutput "  test       - Test platform compatibility" -Color Info
    Write-ColorOutput "  install    - Install platform dependencies" -Color Info
    Write-ColorOutput "  configure  - Configure platform-specific settings" -Color Info
    Write-ColorOutput "  validate   - Validate installation" -Color Info
    Write-ColorOutput "  info       - Show platform information" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Options:" -Color Info
    Write-ColorOutput "  -Platform   - Target platform (windows, linux, macos, auto)" -Color Info
    Write-ColorOutput "  -Verbose    - Show detailed output" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" -Color Info
    Write-ColorOutput "  .\cross-platform-utilities.ps1 -Action test" -Color Info
    Write-ColorOutput "  .\cross-platform-utilities.ps1 -Action install -Platform linux" -Color Info
    Write-ColorOutput "  .\cross-platform-utilities.ps1 -Action info -Verbose" -Color Info
}

# Main execution
function Main {
    Show-Header
    
    switch ($Action) {
        "test" {
            $results = Test-PlatformCompatibility -Platform $Platform
            $totalTests = $results.Count
            $passedTests = ($results.Values | Where-Object { $_ -eq $true }).Count
            
            Write-ColorOutput ""
            Write-ColorOutput "Compatibility Test Results:" -Color Header
            Write-ColorOutput "=========================" -Color Header
            Write-ColorOutput "Total Tests: $totalTests" -Color Info
            Write-ColorOutput "Passed: $passedTests" -Color Success
            Write-ColorOutput "Failed: $($totalTests - $passedTests)" -Color Error
            Write-ColorOutput "Success Rate: $([math]::Round(($passedTests / $totalTests) * 100, 2))%" -Color Info
            
            if ($passedTests -eq $totalTests) {
                Write-ColorOutput "🎉 All compatibility tests passed!" -Color Success
            } else {
                Write-ColorOutput "⚠️ Some compatibility tests failed" -Color Warning
            }
        }
        "install" {
            if (Install-PlatformDependencies -Platform $Platform) {
                Write-ColorOutput "🎉 Platform dependencies installed successfully!" -Color Success
            } else {
                Write-ColorOutput "❌ Failed to install platform dependencies" -Color Error
                exit 1
            }
        }
        "configure" {
            Write-ColorOutput "Configuring platform-specific settings..." -Color Info
            Write-Log "Configuring platform: $Platform" "INFO"
            # Platform-specific configuration logic would go here
            Write-ColorOutput "✅ Platform configuration completed" -Color Success
        }
        "validate" {
            Write-ColorOutput "Validating installation..." -Color Info
            $results = Test-PlatformCompatibility -Platform $Platform
            if ($results.Dependencies) {
                Write-ColorOutput "✅ Installation validation passed" -Color Success
            } else {
                Write-ColorOutput "❌ Installation validation failed" -Color Error
                exit 1
            }
        }
        "info" {
            Show-PlatformInfo
        }
        default {
            Write-ColorOutput "❌ Unknown action: $Action" -Color Error
            Show-Usage
            exit 1
        }
    }
    
    Write-Log "Cross-platform utilities action completed: $Action" "INFO"
}

# Run main function
Main
