<#
 .SYNOPSIS
  FreeRPA Orchestrator automation toolkit module exposing project scripts as cmdlets.
  Enterprise RPA management platform automation functions.

 .DESCRIPTION
  This module provides PowerShell cmdlets for managing the FreeRPA Orchestrator project.
  It includes functions for validation, testing, project management, and debugging.
  
  Key Features:
  - Project validation and consistency checking
  - Comprehensive testing automation
  - Project management and issue resolution
  - Performance and integration testing
  - Log analysis and error tracking

 .NOTES
  Import via: Import-Module (Join-Path $PSScriptRoot 'AutomationToolkit.psd1') -Force
  Status: MISSION ACCOMPLISHED - All Systems Operational v3.0
  Platform: Universal Project Manager - Advanced AI & Enterprise Integration v3.0
  Last Updated: 2025-01-31
#>

$ErrorActionPreference = 'Stop'

function Invoke-ToolScript {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)][string]$RelativePath,
        [Parameter()][string[]]$Arguments
    )
    $scriptPath = Resolve-Path (Join-Path $PSScriptRoot (Join-Path '..' $RelativePath))
    & pwsh -NoProfile -File $scriptPath @Arguments
    return $LASTEXITCODE
}

function Invoke-ValidateProject {
    [CmdletBinding()]
    param(
        [switch]$AutoCreate,
        [switch]$Quiet,
        [string]$JsonOut
    )
    $args = @()
    if ($AutoCreate) { $args += '-AutoCreate' }
    if ($Quiet) { $args += '-Quiet' }
    if ($JsonOut) { $args += @('-JsonOut', $JsonOut) }
    return (Invoke-ToolScript -RelativePath 'validation/validate_project.ps1' -Arguments $args)
}

function Invoke-RunTests {
    [CmdletBinding()]
    param(
        [switch]$Coverage,
        [switch]$Quiet,
        [string]$JsonOut
    )
    $args = @()
    if ($Coverage) { $args += '-Coverage' }
    if ($Quiet) { $args += '-Quiet' }
    if ($JsonOut) { $args += @('-JsonOut', $JsonOut) }
    return (Invoke-ToolScript -RelativePath 'testing/run_tests.ps1' -Arguments $args)
}

function New-MissingFiles {
    [CmdletBinding()]
    param([switch]$DryRun)
    $args = @()
    if ($DryRun) { $args += '-DryRun' }
    return (Invoke-ToolScript -RelativePath 'project-management/create_missing_files.ps1' -Arguments $args)
}

function Invoke-FixProjectIssues {
    [CmdletBinding()]
    param([switch]$DryRun)
    $args = @()
    if ($DryRun) { $args += '-DryRun' }
    return (Invoke-ToolScript -RelativePath 'project-management/fix_project_issues.ps1' -Arguments $args)
}

Export-ModuleMember -Function `
    Invoke-ValidateProject, `
    Invoke-RunTests, `
    New-MissingFiles, `
    Invoke-FixProjectIssues

function Invoke-LogAnalyzer {
    [CmdletBinding()]
    param([switch]$Summary,[string]$JsonOut,[switch]$Quiet)
    $args = @()
    if ($Summary) { $args += '-Summary' }
    if ($Quiet) { $args += '-Quiet' }
    if ($JsonOut) { $args += @('-JsonOut', $JsonOut) }
    return (Invoke-ToolScript -RelativePath 'debugging/log_analyzer.ps1' -Arguments $args)
}

function Invoke-ErrorTracker {
    [CmdletBinding()]
    param([switch]$Summary,[string]$JsonOut,[switch]$Quiet)
    $args = @()
    if ($Summary) { $args += '-Summary' }
    if ($Quiet) { $args += '-Quiet' }
    if ($JsonOut) { $args += @('-JsonOut', $JsonOut) }
    return (Invoke-ToolScript -RelativePath 'debugging/error_tracker.ps1' -Arguments $args)
}

function Invoke-EmergencyTriage {
    [CmdletBinding()]
    param([switch]$Quiet)
    $args = @()
    if ($Quiet) { $args += '-Quiet' }
    return (Invoke-ToolScript -RelativePath 'project-management/Emergency-Triage.ps1' -Arguments $args)
}

Export-ModuleMember -Function `
    Invoke-LogAnalyzer, `
    Invoke-ErrorTracker, `
    Invoke-EmergencyTriage

function Invoke-ProjectConsistencyCheck {
    [CmdletBinding()]
    param([switch]$Quiet,[string]$JsonOut)
    $args = @()
    if ($Quiet) { $args += '-Quiet' }
    if ($JsonOut) { $args += @('-JsonOut', $JsonOut) }
    return (Invoke-ToolScript -RelativePath 'project-management/project_consistency_check.ps1' -Arguments $args)
}

function Invoke-DistributeCommands {
    [CmdletBinding()]
    param([string]$Source = '.manager/success_terminal_command.md',[switch]$Quiet)
    $args = @()
    if ($Source) { $args += @('-Source', $Source) }
    if ($Quiet) { $args += '-Quiet' }
    return (Invoke-ToolScript -RelativePath 'utilities/distribute_commands.ps1' -Arguments $args)
}

function Invoke-PerformanceTest {
    [CmdletBinding()]
    param([int]$Iterations = 1000,[switch]$Quiet,[string]$JsonOut)
    $args = @()
    if ($Iterations) { $args += @('-Iterations', $Iterations) }
    if ($Quiet) { $args += '-Quiet' }
    if ($JsonOut) { $args += @('-JsonOut', $JsonOut) }
    return (Invoke-ToolScript -RelativePath 'testing/performance_test.ps1' -Arguments $args)
}

function Invoke-IntegrationTest {
    [CmdletBinding()]
    param([switch]$Quiet,[string]$JsonOut)
    $args = @()
    if ($Quiet) { $args += '-Quiet' }
    if ($JsonOut) { $args += @('-JsonOut', $JsonOut) }
    return (Invoke-ToolScript -RelativePath 'testing/integration_test.ps1' -Arguments $args)
}

Export-ModuleMember -Function `
    Invoke-ProjectConsistencyCheck, `
    Invoke-DistributeCommands, `
    Invoke-PerformanceTest, `
    Invoke-IntegrationTest
