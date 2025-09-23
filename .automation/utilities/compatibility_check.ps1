# PowerShell Compatibility Check Script
# Tests compatibility across Windows versions and PowerShell editions

param(
    [switch]$Detailed,
    [switch]$FixIssues,
    [string]$TargetVersion = "all"
)

Write-Host "PowerShell Compatibility Check Starting..." -ForegroundColor Green
Write-Host "Testing LearnEnglishBot automation scripts compatibility" -ForegroundColor Cyan

$compatibilityIssues = @()
$compatibilityWarnings = @()
$compatibilitySuccess = @()

# 1. Check PowerShell Version and Edition
Write-Host "`nPowerShell Environment Check..." -ForegroundColor Yellow

$psVersion = $PSVersionTable.PSVersion
$psEdition = $PSVersionTable.PSEdition.ToString()
$psPlatform = $PSVersionTable.Platform
$osVersion = [System.Environment]::OSVersion.Version

Write-Host "PowerShell Version: $psVersion" -ForegroundColor White
Write-Host "PowerShell Edition: $psEdition" -ForegroundColor White
Write-Host "Platform: $psPlatform" -ForegroundColor White
Write-Host "OS Version: $($osVersion.Major).$($osVersion.Minor).$($osVersion.Build)" -ForegroundColor White

# Version compatibility check
if ($psVersion.Major -ge 5) {
    $compatibilitySuccess += "PowerShell 5.0+ detected (Windows PowerShell)"
} elseif ($psVersion.Major -ge 6) {
    $compatibilitySuccess += "PowerShell Core 6.0+ detected (Cross-platform)"
} else {
    $compatibilityIssue = "PowerShell version $psVersion may have compatibility issues"
    $compatibilityIssues += $compatibilityIssue
    Write-Host $compatibilityIssue -ForegroundColor Red
}

# Edition compatibility check
if ($psEdition -eq "Desktop") {
    $compatibilitySuccess += "Windows PowerShell (Desktop) - Full compatibility"
} elseif ($psEdition -eq "Core") {
    $compatibilitySuccess += "PowerShell Core - Cross-platform compatibility"
    $compatibilityWarnings += "Some Windows-specific features may not work in Core"
} else {
    $compatibilityWarnings += "Unknown PowerShell edition: $psEdition"
}

# 2. Check Windows Version Compatibility
Write-Host "`nWindows Version Compatibility..." -ForegroundColor Yellow

$windowsVersion = Get-WmiObject -Class Win32_OperatingSystem | Select-Object Caption, Version
$buildNumber = $windowsVersion.Version.Split('.')[2]

Write-Host "Windows: $($windowsVersion.Caption)" -ForegroundColor White
Write-Host "Build: $buildNumber" -ForegroundColor White

# Windows 10 compatibility (build 10240+)
if ($buildNumber -ge 10240) {
    $compatibilitySuccess += "Windows 10+ detected - Full compatibility"
} elseif ($buildNumber -ge 9600) {
    $compatibilitySuccess += "Windows 8.1 detected - Good compatibility"
    $compatibilityWarnings += "Some newer PowerShell features may not be available"
} elseif ($buildNumber -ge 9200) {
    $compatibilitySuccess += "Windows 8 detected - Limited compatibility"
    $compatibilityWarnings += "PowerShell 5.0+ recommended for full functionality"
} else {
    $compatibilityIssue = "Windows version may have compatibility issues"
    $compatibilityIssues += $compatibilityIssue
    Write-Host $compatibilityIssue -ForegroundColor Red
}

# 3. Check Required PowerShell Modules
Write-Host "`nRequired Module Check..." -ForegroundColor Yellow

$requiredModules = @(
    "Microsoft.PowerShell.Utility",
    "Microsoft.PowerShell.Management",
    "Microsoft.PowerShell.Security"
)

foreach ($module in $requiredModules) {
    if (Get-Module -ListAvailable -Name $module) {
        $compatibilitySuccess += "Module available: $module"
    } else {
        $compatibilityIssue = "Required module missing: $module"
        $compatibilityIssues += $compatibilityIssue
        Write-Host $compatibilityIssue -ForegroundColor Red
    }
}

# 4. Check Execution Policy
Write-Host "`nExecution Policy Check..." -ForegroundColor Yellow

$executionPolicy = Get-ExecutionPolicy
Write-Host "Current Execution Policy: $executionPolicy" -ForegroundColor White

if ($executionPolicy -eq "Restricted") {
    $compatibilityIssue = "Execution Policy is Restricted - Scripts cannot run"
    $compatibilityIssues += $compatibilityIssue
    Write-Host $compatibilityIssue -ForegroundColor Red
    
    if ($FixIssues) {
        Write-Host "Attempting to fix execution policy..." -ForegroundColor Yellow
        try {
            Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
            Write-Host "Execution policy updated to RemoteSigned" -ForegroundColor Green
            $compatibilitySuccess += "Execution policy fixed"
        } catch {
            Write-Host "Failed to update execution policy: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} elseif ($executionPolicy -eq "RemoteSigned" -or $executionPolicy -eq "Unrestricted") {
    $compatibilitySuccess += "Execution policy allows script execution"
} else {
    $compatibilityWarnings += "Execution policy may restrict some scripts: $executionPolicy"
}

# 5. Check File System Access
Write-Host "`nFile System Access Check..." -ForegroundColor Yellow

$testPaths = @(
    ".",
    "cursorfiles",
    ".automation",
    "bot",
    "tests"
)

foreach ($path in $testPaths) {
    if (Test-Path $path) {
        try {
            $testFile = Join-Path $path "test_access.tmp"
            New-Item -Path $testFile -ItemType File -Force | Out-Null
            Remove-Item $testFile -Force
            $compatibilitySuccess += "Write access to: $path"
        } catch {
            $compatibilityWarnings += "Limited access to: $path"
        }
    } else {
        $compatibilityWarnings += "Path not found: $path"
    }
}

# 6. Check .NET Framework Compatibility
Write-Host "`n.NET Framework Check..." -ForegroundColor Yellow

try {
    $dotnetVersion = [System.Reflection.Assembly]::LoadWithPartialName("System.Reflection").ImageRuntimeVersion
    Write-Host ".NET Runtime: $dotnetVersion" -ForegroundColor White
    
    if ($dotnetVersion -match "v4\.0\.30319") {
        $compatibilitySuccess += ".NET Framework 4.0+ detected"
    } else {
        $compatibilityWarnings += ".NET Framework version may affect compatibility: $dotnetVersion"
    }
} catch {
    $compatibilityWarnings += "Unable to determine .NET Framework version"
}

# 7. Test Automation Scripts Compatibility
Write-Host "`nAutomation Scripts Compatibility Test..." -ForegroundColor Yellow

$automationScripts = @(
    "validation\validate_project.ps1",
    "project-management\Start-Project.ps1",
    "testing\run_tests.ps1",
    "utilities\quick_fix.ps1"
)

foreach ($script in $automationScripts) {
    $scriptPath = ".automation\$script"
    if (Test-Path $scriptPath) {
        try {
            # Test script syntax without execution
            $scriptContent = Get-Content $scriptPath -Raw
            $null = [System.Management.Automation.PSParser]::Tokenize($scriptContent, [ref]$null)
            $compatibilitySuccess += "Script syntax valid: $script"
        } catch {
            $compatibilityIssue = "Script syntax error: $script"
            $compatibilityIssues += $compatibilityIssue
            Write-Host $compatibilityIssue -ForegroundColor Red
        }
    } else {
        $compatibilityWarnings += "Script not found: $script"
    }
}

# 8. Generate Compatibility Report
Write-Host "`nCompatibility Report" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Gray

if ($compatibilitySuccess.Count -gt 0) {
    Write-Host "`nCompatible Features:" -ForegroundColor Green
    foreach ($success in $compatibilitySuccess) {
        Write-Host "  $success" -ForegroundColor Green
    }
}

if ($compatibilityWarnings.Count -gt 0) {
    Write-Host "`nCompatibility Warnings:" -ForegroundColor Yellow
    foreach ($warning in $compatibilityWarnings) {
        Write-Host "  $warning" -ForegroundColor Yellow
    }
}

if ($compatibilityIssues.Count -gt 0) {
    Write-Host "`nCompatibility Issues:" -ForegroundColor Red
    foreach ($issue in $compatibilityIssues) {
        Write-Host "  $issue" -ForegroundColor Red
    }
}

# 9. Overall Compatibility Score
$totalChecks = $compatibilitySuccess.Count + $compatibilityWarnings.Count + $compatibilityIssues.Count
$successRate = if ($totalChecks -gt 0) { [math]::Round(($compatibilitySuccess.Count / $totalChecks) * 100, 1) } else { 0 }

Write-Host "`nOverall Compatibility Score: $successRate%" -ForegroundColor Cyan

if ($successRate -ge 90) {
    Write-Host "Excellent compatibility - All automation scripts should work" -ForegroundColor Green
} elseif ($successRate -ge 75) {
    Write-Host "Good compatibility - Most scripts should work with minor adjustments" -ForegroundColor Yellow
} elseif ($successRate -ge 50) {
    Write-Host "Moderate compatibility - Some scripts may need modifications" -ForegroundColor Yellow
} else {
    Write-Host "Poor compatibility - Significant modifications may be required" -ForegroundColor Red
}

# 10. Recommendations
Write-Host "`nRecommendations:" -ForegroundColor Cyan

if ($compatibilityIssues.Count -gt 0) {
    Write-Host "  - Fix critical compatibility issues before running automation scripts" -ForegroundColor White
}

if ($psVersion.Major -lt 5) {
    Write-Host "  - Consider upgrading to PowerShell 5.0+ for better compatibility" -ForegroundColor White
}

if ($psEdition -eq "Core") {
    Write-Host "  - Some Windows-specific features may not work in PowerShell Core" -ForegroundColor White
}

if ($executionPolicy -eq "Restricted") {
    Write-Host "  - Update execution policy to allow script execution" -ForegroundColor White
}

# 11. Quick Fix Commands
Write-Host "`nQuick Fix Commands:" -ForegroundColor Cyan
Write-Host "  - Fix execution policy: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor White
Write-Host "  - Update PowerShell: winget install Microsoft.PowerShell" -ForegroundColor White
Write-Host "  - Check Windows updates: Get-WindowsUpdate" -ForegroundColor White

# Return exit code based on compatibility
if ($compatibilityIssues.Count -gt 0) {
    Write-Host "`nCompatibility check failed - Issues found" -ForegroundColor Red
    exit 1
} elseif ($compatibilityWarnings.Count -gt 0) {
    Write-Host "`nCompatibility check passed with warnings" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "`nCompatibility check passed - All systems compatible" -ForegroundColor Green
    exit 0
}

