# Development Tools Installation Script
# Created: 2025-09-01
# Purpose: Install all necessary tools for Vector DB + ASM Knowledge Base project

param(
    [Parameter(Mandatory=$false)]
    [switch]$Force,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipChocolatey
)

Write-Host "🔧 Installing Development Tools for Vector DB + ASM Knowledge Base" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# Function to check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Function to install Chocolatey
function Install-Chocolatey {
    if ($SkipChocolatey) {
        Write-Host "Skipping Chocolatey installation as requested" -ForegroundColor Yellow
        return $false
    }
    
    try {
        $chocoPath = Get-Command choco -ErrorAction SilentlyContinue
        if ($chocoPath) {
            Write-Host "✅ Chocolatey already installed" -ForegroundColor Green
            return $true
        }
        
        Write-Host "📦 Installing Chocolatey package manager..." -ForegroundColor Yellow
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Write-Host "✅ Chocolatey installed successfully" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Failed to install Chocolatey: $_" -ForegroundColor Red
        return $false
    }
}

# Function to install a package via Chocolatey
function Install-ChocoPackage {
    param([string]$PackageName, [string]$DisplayName)
    
    try {
        Write-Host "📦 Installing $DisplayName..." -ForegroundColor Yellow
        $result = & choco install $PackageName -y
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $DisplayName installed successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️ $DisplayName installation completed with warnings" -ForegroundColor Yellow
            return $true
        }
    } catch {
        Write-Host "❌ Failed to install $DisplayName: $_" -ForegroundColor Red
        return $false
    }
}

# Function to install tools manually
function Install-ManualTools {
    Write-Host "📥 Manual installation options:" -ForegroundColor Cyan
    Write-Host "1. MinGW-w64 (GCC for Windows): https://www.mingw-w64.org/downloads/"
    Write-Host "2. FASM: https://flatassembler.net/download.php"
    Write-Host "3. QEMU: https://www.qemu.org/download/#windows"
    Write-Host "4. Git: https://git-scm.com/download/win"
    Write-Host "5. Docker Desktop: https://www.docker.com/products/docker-desktop/"
    Write-Host ""
    Write-Host "Please install these tools manually and ensure they are in your PATH" -ForegroundColor Yellow
}

# Main installation process
try {
    # Check administrator privileges
    if (!(Test-Administrator)) {
        Write-Host "⚠️ This script should be run as Administrator for best results" -ForegroundColor Yellow
        Write-Host "Some installations may fail without administrator privileges" -ForegroundColor Yellow
        
        if (!$Force) {
            $response = Read-Host "Continue anyway? (y/N)"
            if ($response -ne "y" -and $response -ne "Y") {
                Write-Host "Installation cancelled" -ForegroundColor Red
                exit 1
            }
        }
    }
    
    # Install Chocolatey
    $chocoInstalled = Install-Chocolatey
    
    if ($chocoInstalled) {
        # Define packages to install
        $packages = @(
            @{ Name = "mingw"; Display = "MinGW-w64 (GCC Compiler)" },
            @{ Name = "git"; Display = "Git Version Control" },
            @{ Name = "docker-desktop"; Display = "Docker Desktop" },
            @{ Name = "qemu"; Display = "QEMU Emulator" },
            @{ Name = "nodejs"; Display = "Node.js (if not already installed)" },
            @{ Name = "python"; Display = "Python (for additional tools)" },
            @{ Name = "vscode"; Display = "Visual Studio Code (recommended)" }
        )
        
        $successCount = 0
        $totalPackages = $packages.Count
        
        foreach ($package in $packages) {
            if (Install-ChocoPackage -PackageName $package.Name -DisplayName $package.Display) {
                $successCount++
            }
        }
        
        Write-Host "`n📊 Installation Summary:" -ForegroundColor Magenta
        Write-Host "Successful: $successCount/$totalPackages packages" -ForegroundColor Green
        
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
    } else {
        Write-Host "Chocolatey not available, providing manual installation instructions" -ForegroundColor Yellow
        Install-ManualTools
    }
    
    # Download and install FASM manually (since it's not in Chocolatey)
    Write-Host "`n🔧 Installing FASM Assembler..." -ForegroundColor Yellow
    try {
        $fasmUrl = "https://flatassembler.net/fasm-1.73.31.zip"
        $fasmZip = "temp/fasm.zip"
        $fasmDir = "tools/fasm"
        
        # Create directories
        if (!(Test-Path "temp")) { New-Item -ItemType Directory -Path "temp" -Force | Out-Null }
        if (!(Test-Path "tools")) { New-Item -ItemType Directory -Path "tools" -Force | Out-Null }
        
        # Download FASM
        Write-Host "Downloading FASM..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri $fasmUrl -OutFile $fasmZip
        
        # Extract FASM
        Write-Host "Extracting FASM..." -ForegroundColor Yellow
        Expand-Archive -Path $fasmZip -DestinationPath $fasmDir -Force
        
        # Add FASM to project PATH (create batch file)
        $fasmBat = @"
@echo off
"%~dp0tools\fasm\FASM.EXE" %*
"@
        $fasmBat | Out-File -FilePath "fasm.bat" -Encoding ASCII
        
        Write-Host "✅ FASM installed to tools/fasm/" -ForegroundColor Green
        Write-Host "   Use './fasm.bat' to run FASM from project directory" -ForegroundColor Cyan
        
    } catch {
        Write-Host "⚠️ FASM installation failed: $_" -ForegroundColor Yellow
        Write-Host "Please download FASM manually from https://flatassembler.net/" -ForegroundColor Yellow
    }
    
    # Verify installations
    Write-Host "`n🔍 Verifying installations..." -ForegroundColor Cyan
    
    $verifications = @(
        @{ Command = "gcc --version"; Name = "GCC Compiler" },
        @{ Command = "git --version"; Name = "Git" },
        @{ Command = "node --version"; Name = "Node.js" },
        @{ Command = "python --version"; Name = "Python" },
        @{ Command = "docker --version"; Name = "Docker" },
        @{ Command = "qemu-system-x86_64 --version"; Name = "QEMU" }
    )
    
    foreach ($verification in $verifications) {
        try {
            $result = Invoke-Expression $verification.Command 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ $($verification.Name) is working" -ForegroundColor Green
            } else {
                Write-Host "⚠️ $($verification.Name) may not be working properly" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "❌ $($verification.Name) not found in PATH" -ForegroundColor Red
        }
    }
    
    # Check FASM
    if (Test-Path "fasm.bat") {
        try {
            $fasmResult = & "./fasm.bat" 2>$null
            Write-Host "✅ FASM is available via ./fasm.bat" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ FASM batch file created but may not work properly" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n🎉 Development tools installation completed!" -ForegroundColor Green
    Write-Host "You may need to restart your terminal or IDE to use the new tools" -ForegroundColor Cyan
    
    # Create environment setup script
    $envScript = @"
# Environment Setup for Vector DB + ASM Knowledge Base
# Add this to your PowerShell profile or run before development

# Add project tools to PATH
`$projectRoot = Split-Path -Parent `$MyInvocation.MyCommand.Path
`$env:PATH += ";`$projectRoot\tools\fasm"

# Set project-specific environment variables
`$env:VECTOR_DB_ASM_ROOT = `$projectRoot
`$env:FASM_INCLUDE = "`$projectRoot\tools\fasm\INCLUDE"

Write-Host "Environment configured for Vector DB + ASM Knowledge Base" -ForegroundColor Green
"@
    
    $envScript | Out-File -FilePath "setup_environment.ps1" -Encoding UTF8
    Write-Host "📝 Environment setup script created: setup_environment.ps1" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Installation script error: $_" -ForegroundColor Red
    exit 1
}
