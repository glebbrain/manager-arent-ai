# PowerShell Compatibility Fix Script
# Automatically fixes common compatibility issues

param(
    [switch]$Force,
    [switch]$Verbose,
    [string]$TargetVersion = "all"
)

Write-Host "PowerShell Compatibility Fix Script" -ForegroundColor Green
Write-Host "Automatically fixing LearnEnglishBot automation compatibility issues" -ForegroundColor Cyan

$fixesApplied = @()
$fixesFailed = @()
$fixesSkipped = @()

# 1. Fix Execution Policy
Write-Host "`nFixing Execution Policy..." -ForegroundColor Yellow

$currentPolicy = Get-ExecutionPolicy
if ($currentPolicy -eq "Restricted") {
    try {
        Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
        Write-Host "Execution policy updated to RemoteSigned" -ForegroundColor Green
        $fixesApplied += "Execution policy: Restricted -> RemoteSigned"
    } catch {
        Write-Host "Failed to update execution policy: $($_.Exception.Message)" -ForegroundColor Red
        $fixesFailed += "Execution policy update failed"
    }
} elseif ($currentPolicy -eq "Bypass") {
    if ($Force) {
        try {
            Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
            Write-Host "Execution policy updated from Bypass to RemoteSigned" -ForegroundColor Green
            $fixesApplied += "Execution policy: Bypass -> RemoteSigned"
        } catch {
            Write-Host "Failed to update execution policy: $($_.Exception.Message)" -ForegroundColor Red
            $fixesFailed += "Execution policy update failed"
        }
    } else {
        Write-Host "Execution policy is Bypass (skipping - use -Force to override)" -ForegroundColor Yellow
        $fixesSkipped += "Execution policy: Bypass (use -Force to change)"
    }
} else {
    Write-Host "Execution policy is already compatible: $currentPolicy" -ForegroundColor Green
    $fixesSkipped += "Execution policy: Already compatible"
}

# 2. Install Required PowerShell Modules
Write-Host "`nInstalling Required PowerShell Modules..." -ForegroundColor Yellow

$requiredModules = @(
    "Microsoft.PowerShell.Utility",
    "Microsoft.PowerShell.Management",
    "Microsoft.PowerShell.Security"
)

foreach ($module in $requiredModules) {
    if (-not (Get-Module -ListAvailable -Name $module)) {
        try {
            Install-Module -Name $module -Force -AllowClobber
            Write-Host "Module installed: $module" -ForegroundColor Green
            $fixesApplied += "Module installed: $module"
        } catch {
            Write-Host "Failed to install module $module : $($_.Exception.Message)" -ForegroundColor Red
            $fixesFailed += "Module installation failed: $module"
        }
    } else {
        Write-Host "Module already available: $module" -ForegroundColor Green
        $fixesSkipped += "Module already available: $module"
    }
}

# 3. Fix File System Permissions
Write-Host "`nChecking File System Permissions..." -ForegroundColor Yellow

$criticalPaths = @(
    ".",
    "cursorfiles",
    ".automation",
    "bot",
    "tests"
)

foreach ($path in $criticalPaths) {
    if (Test-Path $path) {
        try {
            # Test write access
            $testFile = Join-Path $path "test_access.tmp"
            New-Item -Path $testFile -ItemType File -Force | Out-Null
            Remove-Item $testFile -Force
            
            # Check if we can create subdirectories
            $testDir = Join-Path $path "test_dir.tmp"
            New-Item -Path $testDir -ItemType Directory -Force | Out-Null
            Remove-Item $testDir -Force -Recurse
            
            Write-Host "Full access to: $path" -ForegroundColor Green
            $fixesSkipped += "File access: $path (already working)"
        } catch {
            Write-Host "Limited access to: $path - attempting to fix..." -ForegroundColor Yellow
            try {
                # Try to take ownership and grant permissions
                $acl = Get-Acl $path
                $currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
                $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule($currentUser, "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
                $acl.SetAccessRule($accessRule)
                Set-Acl -Path $path -AclObject $acl
                
                Write-Host "Permissions fixed for: $path" -ForegroundColor Green
                $fixesApplied += "File permissions fixed: $path"
            } catch {
                Write-Host "Failed to fix permissions for: $path" -ForegroundColor Red
                $fixesFailed += "Permission fix failed: $path"
            }
        }
    } else {
        Write-Host "Path not found: $path" -ForegroundColor Yellow
        $fixesSkipped += "Path not found: $path"
    }
}

# 4. Fix PowerShell Profile Issues
Write-Host "`nChecking PowerShell Profile..." -ForegroundColor Yellow

$profilePath = $PROFILE.CurrentUserAllHosts
if (-not (Test-Path $profilePath)) {
    try {
        New-Item -Path $profilePath -ItemType File -Force | Out-Null
        Write-Host "PowerShell profile created: $profilePath" -ForegroundColor Green
        $fixesApplied += "PowerShell profile created"
    } catch {
        Write-Host "Failed to create PowerShell profile: $($_.Exception.Message)" -ForegroundColor Red
        $fixesFailed += "Profile creation failed"
    }
} else {
    Write-Host "PowerShell profile already exists" -ForegroundColor Green
    $fixesSkipped += "PowerShell profile already exists"
}

# 5. Fix .NET Framework Issues
Write-Host "`nChecking .NET Framework..." -ForegroundColor Yellow

try {
    $dotnetVersion = [System.Reflection.Assembly]::LoadWithPartialName("System.Reflection").ImageRuntimeVersion
    Write-Host ".NET Runtime: $dotnetVersion" -ForegroundColor White
    
    if ($dotnetVersion -match "v4\.0\.30319") {
        Write-Host ".NET Framework 4.0+ detected - compatible" -ForegroundColor Green
        $fixesSkipped += ".NET Framework: Already compatible"
    } else {
        Write-Host ".NET Framework version may need update" -ForegroundColor Yellow
        $fixesSkipped += ".NET Framework: Version check needed"
    }
} catch {
    Write-Host "Unable to determine .NET Framework version" -ForegroundColor Yellow
    $fixesSkipped += ".NET Framework: Version check failed"
}

# 6. Fix Script Encoding Issues
Write-Host "`nChecking Script Encoding..." -ForegroundColor Yellow

$automationScripts = @(
    "validation\validate_project.ps1",
    "project-management\Start-Project.ps1",
    "testing\run_tests.ps1",
    "utilities\quick_fix.ps1",
    "utilities\compatibility_check.ps1"
)

foreach ($script in $automationScripts) {
    $scriptPath = ".automation\$script"
    if (Test-Path $scriptPath) {
        try {
            # Check if script has BOM or encoding issues
            $content = Get-Content $scriptPath -Raw
            $encoding = [System.Text.Encoding]::UTF8
            
            # Re-save with proper encoding
            $content | Out-File -FilePath $scriptPath -Encoding UTF8 -Force
            
            Write-Host "Script encoding fixed: $script" -ForegroundColor Green
            $fixesApplied += "Script encoding fixed: $script"
        } catch {
            Write-Host "Failed to fix script encoding: $script" -ForegroundColor Red
            $fixesFailed += "Script encoding fix failed: $script"
        }
    } else {
        Write-Host "Script not found: $script" -ForegroundColor Yellow
        $fixesSkipped += "Script not found: $script"
    }
}

# 7. Generate Fix Report
Write-Host "`nCompatibility Fix Report" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Gray

if ($fixesApplied.Count -gt 0) {
    Write-Host "`nApplied Fixes:" -ForegroundColor Green
    foreach ($fix in $fixesApplied) {
        Write-Host "  $fix" -ForegroundColor Green
    }
}

if ($fixesSkipped.Count -gt 0) {
    Write-Host "`nSkipped Fixes:" -ForegroundColor Yellow
    foreach ($fix in $fixesSkipped) {
        Write-Host "  $fix" -ForegroundColor Yellow
    }
}

if ($fixesFailed.Count -gt 0) {
    Write-Host "`nFailed Fixes:" -ForegroundColor Red
    foreach ($fix in $fixesFailed) {
        Write-Host "  $fix" -ForegroundColor Red
    }
}

# 8. Overall Status
$totalFixes = $fixesApplied.Count + $fixesFailed.Count + $fixesSkipped.Count
$successRate = if ($totalFixes -gt 0) { [math]::Round(($fixesApplied.Count / $totalFixes) * 100, 1) } else { 0 }

Write-Host "`nOverall Fix Success Rate: $successRate%" -ForegroundColor Cyan

if ($successRate -ge 90) {
    Write-Host "Excellent - Most compatibility issues resolved" -ForegroundColor Green
} elseif ($successRate -ge 75) {
    Write-Host "Good - Most compatibility issues resolved" -ForegroundColor Yellow
} elseif ($successRate -ge 50) {
    Write-Host "Moderate - Some compatibility issues resolved" -ForegroundColor Yellow
} else {
    Write-Host "Poor - Many compatibility issues remain" -ForegroundColor Red
}

# 9. Recommendations
Write-Host "`nRecommendations:" -ForegroundColor Cyan

if ($fixesFailed.Count -gt 0) {
    Write-Host "  - Review failed fixes and resolve manually" -ForegroundColor White
}

if ($currentPolicy -eq "Bypass" -and -not $Force) {
    Write-Host "  - Consider using -Force to change execution policy from Bypass" -ForegroundColor White
}

Write-Host "  - Run compatibility_check.ps1 to verify all issues resolved" -ForegroundColor White
Write-Host "  - Test automation scripts to ensure they work correctly" -ForegroundColor White

# Return exit code based on fix results
if ($fixesFailed.Count -gt 0) {
    Write-Host "`nCompatibility fix completed with some failures" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "`nCompatibility fix completed successfully" -ForegroundColor Green
    exit 0
}
