# Simple Development Tools Installation
# Install essential tools for the project

Write-Host "Installing Development Tools" -ForegroundColor Green

# Check if Chocolatey is available
try {
    $null = Get-Command choco -ErrorAction Stop
    Write-Host "Chocolatey found, installing packages..." -ForegroundColor Yellow
    
    # Install packages
    choco install mingw -y
    choco install git -y
    choco install nodejs -y
    choco install python -y
    choco install docker-desktop -y
    
    Write-Host "Packages installed via Chocolatey" -ForegroundColor Green
    
} catch {
    Write-Host "Chocolatey not found, installing manually..." -ForegroundColor Yellow
    
    # Install Chocolatey first
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    
    Write-Host "Chocolatey installed. Please run this script again." -ForegroundColor Cyan
}

# Download FASM manually
Write-Host "Installing FASM..." -ForegroundColor Yellow

try {
    # Create tools directory
    if (!(Test-Path "tools")) { 
        New-Item -ItemType Directory -Path "tools" -Force | Out-Null 
    }
    if (!(Test-Path "temp")) { 
        New-Item -ItemType Directory -Path "temp" -Force | Out-Null 
    }
    
    # Download FASM
    $fasmUrl = "https://flatassembler.net/fasm-1.73.31.zip"
    $fasmZip = "temp/fasm.zip"
    
    Invoke-WebRequest -Uri $fasmUrl -OutFile $fasmZip
    Expand-Archive -Path $fasmZip -DestinationPath "tools/fasm" -Force
    
    # Create FASM wrapper
    $fasmWrapper = '@echo off
"%~dp0tools\fasm\FASM.EXE" %*'
    
    $fasmWrapper | Out-File -FilePath "fasm.bat" -Encoding ASCII
    
    Write-Host "FASM installed successfully" -ForegroundColor Green
    
} catch {
    Write-Host "FASM installation failed" -ForegroundColor Red
}

Write-Host "Installation completed!" -ForegroundColor Green
Write-Host "Please restart your terminal to use the new tools" -ForegroundColor Cyan
