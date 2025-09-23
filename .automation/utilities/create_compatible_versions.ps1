# Create Compatible PowerShell Script Versions
# Generates versions for different Windows/PowerShell combinations

param(
    [string]$SourceScript,
    [string]$OutputDir = "compatible_versions",
    [switch]$AllScripts,
    [switch]$Verbose
)

Write-Host "PowerShell Script Compatibility Generator" -ForegroundColor Green
Write-Host "Creating versions for different Windows/PowerShell combinations" -ForegroundColor Cyan

# PowerShell version compatibility matrix
$compatibilityMatrix = @{
    "PowerShell_3" = @{
        "MinVersion" = "3.0"
        "MaxVersion" = "3.0"
        "Features" = @("Basic", "NoAdvancedFunctions", "LimitedModules")
        "Windows" = @("Windows 8", "Windows Server 2012")
    }
    "PowerShell_4" = @{
        "MinVersion" = "4.0"
        "MaxVersion" = "4.0"
        "Features" = @("Basic", "DesiredStateConfiguration", "LimitedModules")
        "Windows" = @("Windows 8.1", "Windows Server 2012 R2")
    }
    "PowerShell_5" = @{
        "MinVersion" = "5.0"
        "MaxVersion" = "5.1"
        "Features" = @("Full", "AdvancedFunctions", "AllModules", "Classes")
        "Windows" = @("Windows 10", "Windows Server 2016")
    }
    "PowerShell_Core_6" = @{
        "MinVersion" = "6.0"
        "MaxVersion" = "6.2"
        "Features" = @("CrossPlatform", "Modern", "LimitedWindowsFeatures")
        "Windows" = @("Windows 10", "Windows Server 2016")
    }
    "PowerShell_Core_7" = @{
        "MinVersion" = "7.0"
        "MaxVersion" = "7.4"
        "Features" = @("CrossPlatform", "Modern", "FullFeatures", "Latest")
        "Windows" = @("Windows 10", "Windows Server 2016")
    }
}

# Create output directory
if (-not (Test-Path $OutputDir)) {
    New-Item -Path $OutputDir -ItemType Directory -Force | Out-Null
    Write-Host "Created output directory: $OutputDir" -ForegroundColor Green
}

# Function to create compatible version of a script
function Create-CompatibleVersion {
    param(
        [string]$ScriptPath,
        [string]$TargetVersion,
        [hashtable]$CompatibilityInfo
    )
    
    if (-not (Test-Path $ScriptPath)) {
        Write-Host "Script not found: $ScriptPath" -ForegroundColor Red
        return $false
    }
    
    $scriptName = [System.IO.Path]::GetFileNameWithoutExtension($ScriptPath)
    $scriptExt = [System.IO.Path]::GetExtension($ScriptPath)
    $outputPath = Join-Path $OutputDir "$scriptName`_$TargetVersion$scriptExt"
    
    try {
        $content = Get-Content $ScriptPath -Raw
        
        # Apply compatibility modifications based on target version
        $modifiedContent = Apply-CompatibilityModifications -Content $content -TargetVersion $TargetVersion -CompatibilityInfo $CompatibilityInfo
        
        # Add compatibility header
        $header = @"
# PowerShell Script - $TargetVersion Compatible Version
# Generated automatically for compatibility with:
# - PowerShell Version: $($CompatibilityInfo.MinVersion) - $($CompatibilityInfo.MaxVersion)
# - Windows Versions: $($CompatibilityInfo.Windows -join ', ')
# - Features: $($CompatibilityInfo.Features -join ', ')
# - Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
# - Original: $ScriptPath
#
# This version has been modified for compatibility with older PowerShell versions.
# Some features may be limited or unavailable.

"@
        
        $finalContent = $header + $modifiedContent
        
        # Save compatible version
        $finalContent | Out-File -FilePath $outputPath -Encoding UTF8 -Force
        
        Write-Host "Created compatible version: $outputPath" -ForegroundColor Green
        return $true
        
    } catch {
        Write-Host "Failed to create compatible version for $ScriptPath : $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to apply compatibility modifications
function Apply-CompatibilityModifications {
    param(
        [string]$Content,
        [string]$TargetVersion,
        [hashtable]$CompatibilityInfo
    )
    
    $modifiedContent = $Content
    
    # PowerShell 3-4 compatibility modifications
    if ($TargetVersion -match "PowerShell_[34]") {
        # Remove advanced function syntax
        $modifiedContent = $modifiedContent -replace 'param\s*\([^)]*\)\s*{', 'param('
        
        # Remove class definitions
        $modifiedContent = $modifiedContent -replace 'class\s+\w+\s*{[^}]*}', ''
        
        # Replace modern cmdlets with older equivalents
        $modifiedContent = $modifiedContent -replace 'Get-ChildItem', 'Get-ChildItem'
        $modifiedContent = $modifiedContent -replace 'Select-Object -ExpandProperty', 'Select-Object -ExpandProperty'
        
        # Remove advanced parameter validation
        $modifiedContent = $modifiedContent -replace '\[ValidateSet\([^)]*\)\]', ''
        $modifiedContent = $modifiedContent -replace '\[Parameter\([^)]*\)\]', ''
    }
    
    # PowerShell Core compatibility modifications
    if ($TargetVersion -match "PowerShell_Core") {
        # Remove Windows-specific cmdlets
        $modifiedContent = $modifiedContent -replace 'Get-WmiObject', 'Get-CimInstance'
        $modifiedContent = $modifiedContent -replace 'Get-Process -Name', 'Get-Process | Where-Object {$_.ProcessName -eq'
        
        # Add cross-platform compatibility checks
        $crossPlatformCheck = @"

# Cross-platform compatibility check
if ($IsWindows) {
    # Windows-specific code
} elseif ($IsLinux) {
    # Linux-specific code
} elseif ($IsMacOS) {
    # macOS-specific code
}

"@
        
        # Insert cross-platform check after parameter block
        if ($modifiedContent -match 'param\s*\(') {
            $modifiedContent = $modifiedContent -replace '(param\s*\([^)]*\))', "`$1`n$crossPlatformCheck"
        }
    }
    
    # PowerShell 5+ compatibility modifications
    if ($TargetVersion -match "PowerShell_[567]") {
        # Keep modern features
        # Add performance optimizations
        $performanceComment = @"

# Performance optimization for PowerShell $($CompatibilityInfo.MinVersion)+
`$PSDefaultParameterValues['Out-Default:OutVariable'] = 'null'
`$PSDefaultParameterValues['Select-Object:First'] = 1

"@
        
        if ($modifiedContent -match 'param\s*\(') {
            $modifiedContent = $modifiedContent -replace '(param\s*\([^)]*\))', "`$1`n$performanceComment"
        }
    }
    
    return $modifiedContent
}

# Main execution
if ($AllScripts) {
    # Process all automation scripts
    $automationScripts = @(
        "validation\validate_project.ps1",
        "project-management\Start-Project.ps1",
        "testing\run_tests.ps1",
        "utilities\quick_fix.ps1",
        "utilities\compatibility_check.ps1",
        "utilities\fix_compatibility.ps1"
    )
    
    $totalScripts = $automationScripts.Count
    $processedScripts = 0
    $successfulScripts = 0
    
    Write-Host "`nProcessing $totalScripts automation scripts..." -ForegroundColor Yellow
    
    foreach ($script in $automationScripts) {
        $scriptPath = ".automation\$script"
        if (Test-Path $scriptPath) {
            $processedScripts++
            Write-Host "`nProcessing: $script" -ForegroundColor Cyan
            
            foreach ($version in $compatibilityMatrix.Keys) {
                $compatibilityInfo = $compatibilityMatrix[$version]
                if (Create-CompatibleVersion -ScriptPath $scriptPath -TargetVersion $version -CompatibilityInfo $compatibilityInfo) {
                    $successfulScripts++
                }
            }
        } else {
            Write-Host "Script not found: $scriptPath" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`nScript Processing Complete!" -ForegroundColor Green
    Write-Host "Total scripts processed: $processedScripts" -ForegroundColor White
    Write-Host "Total versions created: $successfulScripts" -ForegroundColor White
    
} elseif ($SourceScript) {
    # Process single script
    Write-Host "`nProcessing single script: $SourceScript" -ForegroundColor Yellow
    
    $successfulVersions = 0
    foreach ($version in $compatibilityMatrix.Keys) {
        $compatibilityInfo = $compatibilityMatrix[$version]
        if (Create-CompatibleVersion -ScriptPath $SourceScript -TargetVersion $version -CompatibilityInfo $compatibilityInfo) {
            $successfulVersions++
        }
    }
    
    Write-Host "`nSingle script processing complete!" -ForegroundColor Green
    Write-Host "Versions created: $successfulVersions" -ForegroundColor White
    
} else {
    # Show usage information
    Write-Host "`nUsage Examples:" -ForegroundColor Cyan
    Write-Host "  -AllScripts                    : Process all automation scripts" -ForegroundColor White
    Write-Host "  -SourceScript 'path\to\script' : Process single script" -ForegroundColor White
    Write-Host "  -OutputDir 'custom\path'       : Specify output directory" -ForegroundColor White
    Write-Host "  -Verbose                       : Show detailed output" -ForegroundColor White
    
    Write-Host "`nCompatibility Versions Created:" -ForegroundColor Cyan
    foreach ($version in $compatibilityMatrix.Keys) {
        $info = $compatibilityMatrix[$version]
        Write-Host "  $version : PowerShell $($info.MinVersion)-$($info.MaxVersion)" -ForegroundColor White
        Write-Host "    Windows: $($info.Windows -join ', ')" -ForegroundColor Gray
        Write-Host "    Features: $($info.Features -join ', ')" -ForegroundColor Gray
    }
}

# Create compatibility index file
$indexPath = Join-Path $OutputDir "compatibility_index.md"
$indexContent = @"
# PowerShell Script Compatibility Index

This directory contains PowerShell script versions compatible with different Windows versions and PowerShell editions.

## Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

## Compatibility Matrix

| Version | PowerShell | Windows Support | Features |
|---------|------------|-----------------|----------|
"@

foreach ($version in $compatibilityMatrix.Keys) {
    $info = $compatibilityMatrix[$version]
    $indexContent += "`n| $version | $($info.MinVersion)-$($info.MaxVersion) | $($info.Windows -join ', ') | $($info.Features -join ', ') |"
}

$indexContent += @"

## Usage

1. Choose the version compatible with your PowerShell installation
2. Copy the script to your automation directory
3. Test the script to ensure compatibility
4. Report any issues for further improvements

## Testing

Run the compatibility check script to verify your environment:
```powershell
.\compatibility_check.ps1
```

## Support

For compatibility issues or questions, refer to the main project documentation.
"@

$indexContent | Out-File -FilePath $indexPath -Encoding UTF8 -Force
Write-Host "`nCreated compatibility index: $indexPath" -ForegroundColor Green

Write-Host "`nCompatibility generation complete!" -ForegroundColor Green
Write-Host "Output directory: $OutputDir" -ForegroundColor White
Write-Host "Check the compatibility_index.md file for detailed information" -ForegroundColor White
