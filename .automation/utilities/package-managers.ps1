# Package Managers Integration Script for ManagerAgentAI v2.5
# Chocolatey, Homebrew, APT integration for all platforms

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "chocolatey", "homebrew", "apt", "yum", "dnf", "pacman", "zypper")]
    [string]$PackageManager = "all",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "install", "uninstall", "update", "list", "search", "info")]
    [string]$Action = "all",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose,
    
    [Parameter(Mandatory=$false)]
    [string]$ConfigPath = "packages",
    
    [Parameter(Mandatory=$false)]
    [string]$Version = "2.5.0"
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Script configuration
$ScriptName = "Package-Managers"
$Version = "2.5.0"
$LogFile = "package-managers.log"

# Colors for output
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    if ($Verbose -or $Level -eq "ERROR") {
        Write-ColorOutput $logEntry -Color $Level.ToLower()
    }
    Add-Content -Path $LogFile -Value $logEntry -ErrorAction SilentlyContinue
}

function Show-Header {
    Write-ColorOutput "📦 ManagerAgentAI Package Managers v2.5" -Color Header
    Write-ColorOutput "=====================================" -Color Header
    Write-ColorOutput "Chocolatey, Homebrew, APT integration" -Color Info
    Write-ColorOutput ""
}

function Get-PlatformInfo {
    $platformInfo = @{
        OS = $null
        Platform = $null
        PackageManager = $null
        Architecture = $null
    }
    
    # Detect operating system
    if ($IsWindows) {
        $platformInfo.OS = "Windows"
        $platformInfo.Platform = "win32"
        $platformInfo.PackageManager = "chocolatey"
    } elseif ($IsLinux) {
        $platformInfo.OS = "Linux"
        $platformInfo.Platform = "linux"
        $platformInfo.PackageManager = "apt"
    } elseif ($IsMacOS) {
        $platformInfo.OS = "macOS"
        $platformInfo.Platform = "darwin"
        $platformInfo.PackageManager = "homebrew"
    } else {
        $platformInfo.OS = "Unknown"
        $platformInfo.Platform = "unknown"
        $platformInfo.PackageManager = "unknown"
    }
    
    # Detect architecture
    $platformInfo.Architecture = [System.Environment]::OSVersion.Platform.ToString()
    
    return $platformInfo
}

function Test-PackageManager {
    param([string]$PackageManager)
    
    Write-ColorOutput "Testing $PackageManager..." -Color Info
    Write-Log "Testing package manager: $PackageManager" "INFO"
    
    $testResults = @{
        PackageManager = $PackageManager
        Available = $false
        Version = $null
        Error = $null
    }
    
    try {
        switch ($PackageManager) {
            "chocolatey" {
                $chocoVersion = choco --version 2>$null
                if ($LASTEXITCODE -eq 0) {
                    $testResults.Available = $true
                    $testResults.Version = $chocoVersion
                    Write-ColorOutput "✅ Chocolatey: $chocoVersion" -Color Success
                    Write-Log "Chocolatey test: PASS ($chocoVersion)" "INFO"
                } else {
                    $testResults.Error = "Chocolatey not found"
                    Write-ColorOutput "❌ Chocolatey: Not found" -Color Error
                    Write-Log "Chocolatey test: FAIL (Not found)" "ERROR"
                }
            }
            "homebrew" {
                $brewVersion = brew --version 2>$null
                if ($LASTEXITCODE -eq 0) {
                    $testResults.Available = $true
                    $testResults.Version = $brewVersion
                    Write-ColorOutput "✅ Homebrew: $brewVersion" -Color Success
                    Write-Log "Homebrew test: PASS ($brewVersion)" "INFO"
                } else {
                    $testResults.Error = "Homebrew not found"
                    Write-ColorOutput "❌ Homebrew: Not found" -Color Error
                    Write-Log "Homebrew test: FAIL (Not found)" "ERROR"
                }
            }
            "apt" {
                $aptVersion = apt --version 2>$null
                if ($LASTEXITCODE -eq 0) {
                    $testResults.Available = $true
                    $testResults.Version = $aptVersion
                    Write-ColorOutput "✅ APT: $aptVersion" -Color Success
                    Write-Log "APT test: PASS ($aptVersion)" "INFO"
                } else {
                    $testResults.Error = "APT not found"
                    Write-ColorOutput "❌ APT: Not found" -Color Error
                    Write-Log "APT test: FAIL (Not found)" "ERROR"
                }
            }
            "yum" {
                $yumVersion = yum --version 2>$null
                if ($LASTEXITCODE -eq 0) {
                    $testResults.Available = $true
                    $testResults.Version = $yumVersion
                    Write-ColorOutput "✅ YUM: $yumVersion" -Color Success
                    Write-Log "YUM test: PASS ($yumVersion)" "INFO"
                } else {
                    $testResults.Error = "YUM not found"
                    Write-ColorOutput "❌ YUM: Not found" -Color Error
                    Write-Log "YUM test: FAIL (Not found)" "ERROR"
                }
            }
            "dnf" {
                $dnfVersion = dnf --version 2>$null
                if ($LASTEXITCODE -eq 0) {
                    $testResults.Available = $true
                    $testResults.Version = $dnfVersion
                    Write-ColorOutput "✅ DNF: $dnfVersion" -Color Success
                    Write-Log "DNF test: PASS ($dnfVersion)" "INFO"
                } else {
                    $testResults.Error = "DNF not found"
                    Write-ColorOutput "❌ DNF: Not found" -Color Error
                    Write-Log "DNF test: FAIL (Not found)" "ERROR"
                }
            }
            "pacman" {
                $pacmanVersion = pacman --version 2>$null
                if ($LASTEXITCODE -eq 0) {
                    $testResults.Available = $true
                    $testResults.Version = $pacmanVersion
                    Write-ColorOutput "✅ Pacman: $pacmanVersion" -Color Success
                    Write-Log "Pacman test: PASS ($pacmanVersion)" "INFO"
                } else {
                    $testResults.Error = "Pacman not found"
                    Write-ColorOutput "❌ Pacman: Not found" -Color Error
                    Write-Log "Pacman test: FAIL (Not found)" "ERROR"
                }
            }
            "zypper" {
                $zypperVersion = zypper --version 2>$null
                if ($LASTEXITCODE -eq 0) {
                    $testResults.Available = $true
                    $testResults.Version = $zypperVersion
                    Write-ColorOutput "✅ Zypper: $zypperVersion" -Color Success
                    Write-Log "Zypper test: PASS ($zypperVersion)" "INFO"
                } else {
                    $testResults.Error = "Zypper not found"
                    Write-ColorOutput "❌ Zypper: Not found" -Color Error
                    Write-Log "Zypper test: FAIL (Not found)" "ERROR"
                }
            }
        }
    } catch {
        $testResults.Error = $_.Exception.Message
        Write-ColorOutput "❌ $PackageManager test failed: $($_.Exception.Message)" -Color Error
        Write-Log "$PackageManager test failed: $($_.Exception.Message)" "ERROR"
    }
    
    return $testResults
}

function Create-PackageManifests {
    Write-ColorOutput "Creating package manifests..." -Color Info
    Write-Log "Creating package manifests" "INFO"
    
    $manifestResults = @()
    
    try {
        # Create configuration directory
        if (-not (Test-Path $ConfigPath)) {
            New-Item -ItemType Directory -Path $ConfigPath -Force
            Write-ColorOutput "✅ Configuration directory created: $ConfigPath" -Color Success
            Write-Log "Configuration directory created: $ConfigPath" "INFO"
        }
        
        # Chocolatey package manifest
        $chocolateyManifest = @"
<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://schemas.microsoft.com/packaging/2015/06/nuspec.xsd">
  <metadata>
    <id>manageragent</id>
    <version>$Version</version>
    <title>ManagerAgentAI</title>
    <authors>ManagerAgentAI Team</authors>
    <owners>ManagerAgentAI Team</owners>
    <description>Universal Automation Platform for Project Management and AI-Powered Optimization</description>
    <summary>Universal Automation Platform for Project Management and AI-Powered Optimization</summary>
    <projectUrl>https://github.com/manageragent/manageragent</projectUrl>
    <packageSourceUrl>https://github.com/manageragent/manageragent</packageSourceUrl>
    <tags>automation project-management ai optimization universal</tags>
    <licenseUrl>https://github.com/manageragent/manageragent/blob/main/LICENSE</licenseUrl>
    <requireLicenseAcceptance>false</requireLicenseAcceptance>
    <dependencies>
      <dependency id="powershell-core" version="7.0.0" />
      <dependency id="nodejs" version="16.0.0" />
      <dependency id="git" version="2.30.0" />
    </dependencies>
  </metadata>
  <files>
    <file src="**/*" target="tools" />
  </files>
</package>
"@
        
        $chocolateyFile = Join-Path $ConfigPath "manageragent.nuspec"
        $chocolateyManifest | Out-File -FilePath $chocolateyFile -Encoding UTF8
        $manifestResults += @{ PackageManager = "Chocolatey"; File = $chocolateyFile; Status = "Created" }
        Write-ColorOutput "✅ Chocolatey manifest created: $chocolateyFile" -Color Success
        Write-Log "Chocolatey manifest created: $chocolateyFile" "INFO"
        
        # Homebrew formula
        $homebrewFormula = @"
class Manageragent < Formula
  desc "Universal Automation Platform for Project Management and AI-Powered Optimization"
  homepage "https://github.com/manageragent/manageragent"
  url "https://github.com/manageragent/manageragent/archive/v$Version.tar.gz"
  sha256 "placeholder"
  license "MIT"
  
  depends_on "node"
  depends_on "git"
  
  def install
    system "npm", "install"
    bin.install "scripts/start-platform.ps1"
    bin.install "scripts/auto-configurator.ps1"
    bin.install "scripts/performance-metrics.ps1"
  end
  
  test do
    system "#{bin}/start-platform.ps1", "--version"
  end
end
"@
        
        $homebrewFile = Join-Path $ConfigPath "manageragent.rb"
        $homebrewFormula | Out-File -FilePath $homebrewFile -Encoding UTF8
        $manifestResults += @{ PackageManager = "Homebrew"; File = $homebrewFile; Status = "Created" }
        Write-ColorOutput "✅ Homebrew formula created: $homebrewFile" -Color Success
        Write-Log "Homebrew formula created: $homebrewFile" "INFO"
        
        # APT package manifest
        $aptManifest = @"
Package: manageragent
Version: $Version
Section: utils
Priority: optional
Architecture: all
Depends: nodejs (>= 16.0.0), git (>= 2.30.0), powershell (>= 7.0.0)
Maintainer: ManagerAgentAI Team <team@manageragent.ai>
Description: Universal Automation Platform for Project Management and AI-Powered Optimization
 Universal Automation Platform for Project Management and AI-Powered Optimization.
 This package provides comprehensive project management, automation, and AI-powered
 optimization capabilities across various project types.
 .
 Features:
  - Universal project detection and analysis
  - AI-powered task management and optimization
  - Cross-platform compatibility (Windows, Linux, macOS)
  - Automated workflow orchestration
  - Performance monitoring and analytics
  - Integration with popular development tools
"@
        
        $aptFile = Join-Path $ConfigPath "manageragent.control"
        $aptManifest | Out-File -FilePath $aptFile -Encoding UTF8
        $manifestResults += @{ PackageManager = "APT"; File = $aptFile; Status = "Created" }
        Write-ColorOutput "✅ APT manifest created: $aptFile" -Color Success
        Write-Log "APT manifest created: $aptFile" "INFO"
        
        # YUM/DNF package manifest
        $yumManifest = @"
Name: manageragent
Version: $Version
Release: 1%{?dist}
Summary: Universal Automation Platform for Project Management and AI-Powered Optimization
License: MIT
URL: https://github.com/manageragent/manageragent
Source0: https://github.com/manageragent/manageragent/archive/v%{version}.tar.gz
BuildArch: noarch
Requires: nodejs >= 16.0.0, git >= 2.30.0, powershell >= 7.0.0

%description
Universal Automation Platform for Project Management and AI-Powered Optimization.
This package provides comprehensive project management, automation, and AI-powered
optimization capabilities across various project types.

Features:
- Universal project detection and analysis
- AI-powered task management and optimization
- Cross-platform compatibility (Windows, Linux, macOS)
- Automated workflow orchestration
- Performance monitoring and analytics
- Integration with popular development tools

%prep
%setup -q

%build
# No build step required

%install
mkdir -p %{buildroot}%{_bindir}
mkdir -p %{buildroot}%{_datadir}/manageragent
cp -r * %{buildroot}%{_datadir}/manageragent/
ln -s %{_datadir}/manageragent/scripts/start-platform.ps1 %{buildroot}%{_bindir}/manageragent

%files
%{_bindir}/manageragent
%{_datadir}/manageragent

%changelog
* $(Get-Date -Format 'ddd MMM dd yyyy') ManagerAgentAI Team <team@manageragent.ai> - $Version-1
- Initial package release
"@
        
        $yumFile = Join-Path $ConfigPath "manageragent.spec"
        $yumManifest | Out-File -FilePath $yumFile -Encoding UTF8
        $manifestResults += @{ PackageManager = "YUM/DNF"; File = $yumFile; Status = "Created" }
        Write-ColorOutput "✅ YUM/DNF manifest created: $yumFile" -Color Success
        Write-Log "YUM/DNF manifest created: $yumFile" "INFO"
        
        # Pacman package manifest
        $pacmanManifest = @"
# Maintainer: ManagerAgentAI Team <team@manageragent.ai>
pkgname=manageragent
pkgver=$Version
pkgrel=1
pkgdesc="Universal Automation Platform for Project Management and AI-Powered Optimization"
arch=('any')
url="https://github.com/manageragent/manageragent"
license=('MIT')
depends=('nodejs>=16.0.0' 'git>=2.30.0' 'powershell>=7.0.0')
makedepends=('npm')
source=("https://github.com/manageragent/manageragent/archive/v$pkgver.tar.gz")
sha256sums=('placeholder')

package() {
  cd "$pkgname-$pkgver"
  npm install
  install -Dm755 scripts/start-platform.ps1 "$pkgdir/usr/bin/manageragent"
  install -Dm755 scripts/auto-configurator.ps1 "$pkgdir/usr/bin/manageragent-config"
  install -Dm755 scripts/performance-metrics.ps1 "$pkgdir/usr/bin/manageragent-metrics"
  cp -r . "$pkgdir/usr/share/manageragent/"
}
"@
        
        $pacmanFile = Join-Path $ConfigPath "PKGBUILD"
        $pacmanManifest | Out-File -FilePath $pacmanFile -Encoding UTF8
        $manifestResults += @{ PackageManager = "Pacman"; File = $pacmanFile; Status = "Created" }
        Write-ColorOutput "✅ Pacman manifest created: $pacmanFile" -Color Success
        Write-Log "Pacman manifest created: $pacmanFile" "INFO"
        
        # Zypper package manifest
        $zypperManifest = @"
Name: manageragent
Version: $Version
Release: 1
Summary: Universal Automation Platform for Project Management and AI-Powered Optimization
License: MIT
Group: Development/Tools
URL: https://github.com/manageragent/manageragent
Source: https://github.com/manageragent/manageragent/archive/v%{version}.tar.gz
BuildArch: noarch
Requires: nodejs >= 16.0.0, git >= 2.30.0, powershell >= 7.0.0

%description
Universal Automation Platform for Project Management and AI-Powered Optimization.
This package provides comprehensive project management, automation, and AI-powered
optimization capabilities across various project types.

Features:
- Universal project detection and analysis
- AI-powered task management and optimization
- Cross-platform compatibility (Windows, Linux, macOS)
- Automated workflow orchestration
- Performance monitoring and analytics
- Integration with popular development tools

%prep
%setup -q

%build
# No build step required

%install
mkdir -p %{buildroot}%{_bindir}
mkdir -p %{buildroot}%{_datadir}/manageragent
cp -r * %{buildroot}%{_datadir}/manageragent/
ln -s %{_datadir}/manageragent/scripts/start-platform.ps1 %{buildroot}%{_bindir}/manageragent

%files
%{_bindir}/manageragent
%{_datadir}/manageragent

%changelog
* $(Get-Date -Format 'ddd MMM dd yyyy') ManagerAgentAI Team <team@manageragent.ai> - $Version-1
- Initial package release
"@
        
        $zypperFile = Join-Path $ConfigPath "manageragent.spec"
        $zypperManifest | Out-File -FilePath $zypperFile -Encoding UTF8
        $manifestResults += @{ PackageManager = "Zypper"; File = $zypperFile; Status = "Created" }
        Write-ColorOutput "✅ Zypper manifest created: $zypperFile" -Color Success
        Write-Log "Zypper manifest created: $zypperFile" "INFO"
        
    } catch {
        Write-ColorOutput "❌ Failed to create package manifests" -Color Error
        Write-Log "Failed to create package manifests: $($_.Exception.Message)" "ERROR"
    }
    
    return $manifestResults
}

function Install-Package {
    param([string]$PackageManager)
    
    Write-ColorOutput "Installing package via $PackageManager..." -Color Info
    Write-Log "Installing package via: $PackageManager" "INFO"
    
    $installResults = @()
    
    try {
        switch ($PackageManager) {
            "chocolatey" {
                $installCommand = "choco install manageragent -y"
                $installOutput = Invoke-Expression $installCommand 2>&1
                $installExitCode = $LASTEXITCODE
                
                if ($installExitCode -eq 0) {
                    $installResults += @{ PackageManager = "Chocolatey"; Status = "Success"; Output = $installOutput }
                    Write-ColorOutput "✅ Package installed via Chocolatey" -Color Success
                    Write-Log "Package installed via Chocolatey: SUCCESS" "INFO"
                } else {
                    $installResults += @{ PackageManager = "Chocolatey"; Status = "Failed"; Output = $installOutput }
                    Write-ColorOutput "❌ Failed to install via Chocolatey" -Color Error
                    Write-Log "Failed to install via Chocolatey: $installOutput" "ERROR"
                }
            }
            "homebrew" {
                $installCommand = "brew install manageragent"
                $installOutput = Invoke-Expression $installCommand 2>&1
                $installExitCode = $LASTEXITCODE
                
                if ($installExitCode -eq 0) {
                    $installResults += @{ PackageManager = "Homebrew"; Status = "Success"; Output = $installOutput }
                    Write-ColorOutput "✅ Package installed via Homebrew" -Color Success
                    Write-Log "Package installed via Homebrew: SUCCESS" "INFO"
                } else {
                    $installResults += @{ PackageManager = "Homebrew"; Status = "Failed"; Output = $installOutput }
                    Write-ColorOutput "❌ Failed to install via Homebrew" -Color Error
                    Write-Log "Failed to install via Homebrew: $installOutput" "ERROR"
                }
            }
            "apt" {
                $installCommand = "sudo apt install manageragent -y"
                $installOutput = Invoke-Expression $installCommand 2>&1
                $installExitCode = $LASTEXITCODE
                
                if ($installExitCode -eq 0) {
                    $installResults += @{ PackageManager = "APT"; Status = "Success"; Output = $installOutput }
                    Write-ColorOutput "✅ Package installed via APT" -Color Success
                    Write-Log "Package installed via APT: SUCCESS" "INFO"
                } else {
                    $installResults += @{ PackageManager = "APT"; Status = "Failed"; Output = $installOutput }
                    Write-ColorOutput "❌ Failed to install via APT" -Color Error
                    Write-Log "Failed to install via APT: $installOutput" "ERROR"
                }
            }
            "yum" {
                $installCommand = "sudo yum install manageragent -y"
                $installOutput = Invoke-Expression $installCommand 2>&1
                $installExitCode = $LASTEXITCODE
                
                if ($installExitCode -eq 0) {
                    $installResults += @{ PackageManager = "YUM"; Status = "Success"; Output = $installOutput }
                    Write-ColorOutput "✅ Package installed via YUM" -Color Success
                    Write-Log "Package installed via YUM: SUCCESS" "INFO"
                } else {
                    $installResults += @{ PackageManager = "YUM"; Status = "Failed"; Output = $installOutput }
                    Write-ColorOutput "❌ Failed to install via YUM" -Color Error
                    Write-Log "Failed to install via YUM: $installOutput" "ERROR"
                }
            }
            "dnf" {
                $installCommand = "sudo dnf install manageragent -y"
                $installOutput = Invoke-Expression $installCommand 2>&1
                $installExitCode = $LASTEXITCODE
                
                if ($installExitCode -eq 0) {
                    $installResults += @{ PackageManager = "DNF"; Status = "Success"; Output = $installOutput }
                    Write-ColorOutput "✅ Package installed via DNF" -Color Success
                    Write-Log "Package installed via DNF: SUCCESS" "INFO"
                } else {
                    $installResults += @{ PackageManager = "DNF"; Status = "Failed"; Output = $installOutput }
                    Write-ColorOutput "❌ Failed to install via DNF" -Color Error
                    Write-Log "Failed to install via DNF: $installOutput" "ERROR"
                }
            }
            "pacman" {
                $installCommand = "sudo pacman -S manageragent --noconfirm"
                $installOutput = Invoke-Expression $installCommand 2>&1
                $installExitCode = $LASTEXITCODE
                
                if ($installExitCode -eq 0) {
                    $installResults += @{ PackageManager = "Pacman"; Status = "Success"; Output = $installOutput }
                    Write-ColorOutput "✅ Package installed via Pacman" -Color Success
                    Write-Log "Package installed via Pacman: SUCCESS" "INFO"
                } else {
                    $installResults += @{ PackageManager = "Pacman"; Status = "Failed"; Output = $installOutput }
                    Write-ColorOutput "❌ Failed to install via Pacman" -Color Error
                    Write-Log "Failed to install via Pacman: $installOutput" "ERROR"
                }
            }
            "zypper" {
                $installCommand = "sudo zypper install manageragent -y"
                $installOutput = Invoke-Expression $installCommand 2>&1
                $installExitCode = $LASTEXITCODE
                
                if ($installExitCode -eq 0) {
                    $installResults += @{ PackageManager = "Zypper"; Status = "Success"; Output = $installOutput }
                    Write-ColorOutput "✅ Package installed via Zypper" -Color Success
                    Write-Log "Package installed via Zypper: SUCCESS" "INFO"
                } else {
                    $installResults += @{ PackageManager = "Zypper"; Status = "Failed"; Output = $installOutput }
                    Write-ColorOutput "❌ Failed to install via Zypper" -Color Error
                    Write-Log "Failed to install via Zypper: $installOutput" "ERROR"
                }
            }
        }
    } catch {
        $installResults += @{ PackageManager = $PackageManager; Status = "Error"; Error = $_.Exception.Message }
        Write-ColorOutput "❌ Package installation error via $PackageManager: $($_.Exception.Message)" -Color Error
        Write-Log "Package installation error via $PackageManager: $($_.Exception.Message)" "ERROR"
    }
    
    return $installResults
}

function Show-Usage {
    Write-ColorOutput "Usage: .\package-managers.ps1 -PackageManager <manager> [options]" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Package Managers:" -Color Info
    Write-ColorOutput "  all        - All available package managers" -Color Info
    Write-ColorOutput "  chocolatey - Chocolatey (Windows)" -Color Info
    Write-ColorOutput "  homebrew   - Homebrew (macOS)" -Color Info
    Write-ColorOutput "  apt        - APT (Debian/Ubuntu)" -Color Info
    Write-ColorOutput "  yum        - YUM (RHEL/CentOS)" -Color Info
    Write-ColorOutput "  dnf        - DNF (Fedora)" -Color Info
    Write-ColorOutput "  pacman     - Pacman (Arch Linux)" -Color Info
    Write-ColorOutput "  zypper     - Zypper (openSUSE)" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Actions:" -Color Info
    Write-ColorOutput "  all        - All actions" -Color Info
    Write-ColorOutput "  install    - Install package" -Color Info
    Write-ColorOutput "  uninstall  - Uninstall package" -Color Info
    Write-ColorOutput "  update     - Update package" -Color Info
    Write-ColorOutput "  list       - List packages" -Color Info
    Write-ColorOutput "  search     - Search packages" -Color Info
    Write-ColorOutput "  info       - Package information" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Options:" -Color Info
    Write-ColorOutput "  -Verbose     - Show detailed output" -Color Info
    Write-ColorOutput "  -ConfigPath  - Path for configuration files" -Color Info
    Write-ColorOutput "  -Version     - Package version" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" -Color Info
    Write-ColorOutput "  .\package-managers.ps1 -PackageManager all" -Color Info
    Write-ColorOutput "  .\package-managers.ps1 -PackageManager chocolatey -Action install" -Color Info
    Write-ColorOutput "  .\package-managers.ps1 -PackageManager homebrew -Action update" -Color Info
    Write-ColorOutput "  .\package-managers.ps1 -PackageManager apt -Action list" -Color Info
}

# Main execution
function Main {
    Show-Header
    
    # Get platform information
    $platformInfo = Get-PlatformInfo
    Write-ColorOutput "Platform: $($platformInfo.OS) ($($platformInfo.Platform))" -Color Info
    Write-Log "Platform: $($platformInfo.OS) ($($platformInfo.Platform))" "INFO"
    
    # Test package managers
    $packageManagers = @("chocolatey", "homebrew", "apt", "yum", "dnf", "pacman", "zypper")
    $testResults = @()
    
    foreach ($pm in $packageManagers) {
        if ($PackageManager -eq "all" -or $PackageManager -eq $pm) {
            $testResult = Test-PackageManager -PackageManager $pm
            $testResults += $testResult
        }
    }
    
    # Show available package managers
    $availableManagers = $testResults | Where-Object { $_.Available -eq $true }
    $unavailableManagers = $testResults | Where-Object { $_.Available -eq $false }
    
    Write-ColorOutput ""
    Write-ColorOutput "Available Package Managers:" -Color Header
    Write-ColorOutput "===========================" -Color Header
    
    foreach ($manager in $availableManagers) {
        Write-ColorOutput "✅ $($manager.PackageManager): $($manager.Version)" -Color Success
    }
    
    if ($unavailableManagers.Count -gt 0) {
        Write-ColorOutput ""
        Write-ColorOutput "Unavailable Package Managers:" -Color Header
        Write-ColorOutput "=============================" -Color Header
        
        foreach ($manager in $unavailableManagers) {
            Write-ColorOutput "❌ $($manager.PackageManager): $($manager.Error)" -Color Error
        }
    }
    
    # Create package manifests
    if ($Action -eq "all" -or $Action -eq "install") {
        Write-ColorOutput ""
        Write-ColorOutput "Creating package manifests..." -Color Info
        Write-Log "Creating package manifests" "INFO"
        
        $manifestResults = Create-PackageManifests
        
        $successfulManifests = ($manifestResults | Where-Object { $_.Status -eq "Created" }).Count
        $totalManifests = $manifestResults.Count
        Write-ColorOutput "Manifests: $successfulManifests/$totalManifests created" -Color $(if ($successfulManifests -eq $totalManifests) { "Success" } else { "Warning" })
    }
    
    # Install packages
    if ($Action -eq "all" -or $Action -eq "install") {
        Write-ColorOutput ""
        Write-ColorOutput "Installing packages..." -Color Info
        Write-Log "Installing packages" "INFO"
        
        $installResults = @()
        foreach ($manager in $availableManagers) {
            $installResult = Install-Package -PackageManager $manager.PackageManager
            $installResults += $installResult
        }
        
        $successfulInstalls = ($installResults | Where-Object { $_.Status -eq "Success" }).Count
        $totalInstalls = $installResults.Count
        Write-ColorOutput "Installs: $successfulInstalls/$totalInstalls successful" -Color $(if ($successfulInstalls -eq $totalInstalls) { "Success" } else { "Warning" })
    }
    
    Write-Log "Package managers integration completed for manager: $PackageManager" "INFO"
}

# Run main function
Main
