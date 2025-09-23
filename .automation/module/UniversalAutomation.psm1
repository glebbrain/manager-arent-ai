<#
 .SYNOPSIS
  Universal Automation Toolkit module exposing universal project scripts as cmdlets.
  Supports multiple project types: Node.js, Python, C++, .NET, Java, Go, Rust, PHP

 .DESCRIPTION
  This module provides PowerShell cmdlets for managing projects of any type.
  It includes functions for validation, testing, project management, and debugging.
  
  Key Features:
  - Universal project type detection
  - Cross-platform project validation
  - Comprehensive testing automation
  - Project management and issue resolution
  - Performance and integration testing
  - Log analysis and error tracking

 .NOTES
  Import via: Import-Module (Join-Path $PSScriptRoot 'UniversalAutomation.psd1') -Force
  Status: MISSION ACCOMPLISHED - All Systems Operational
  Platform: Universal Project Management Platform
  Last Updated: 2025-01-31
#>

$ErrorActionPreference = 'Stop'

# Function to execute tool scripts
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

# Universal Project Detection
function Get-ProjectType {
    [CmdletBinding()]
    param(
        [string]$ProjectPath = ".",
        [switch]$Json,
        [switch]$Quiet
    )
    $args = @()
    if ($ProjectPath -ne ".") { $args += @('-ProjectPath', $ProjectPath) }
    if ($Json) { $args += '-Json' }
    if ($Quiet) { $args += '-Quiet' }
    return (Invoke-ToolScript -RelativePath 'utilities/detect-project-type.ps1' -Arguments $args)
}

# Universal Build
function Invoke-UniversalBuild {
    [CmdletBinding()]
    param(
        [string]$ProjectType = "auto",
        [string]$ProjectPath = ".",
        [string]$BuildType = "Release",
        [string]$Platform = "x64",
        [switch]$Clean,
        [switch]$Test,
        [switch]$Package,
        [switch]$Verbose,
        [switch]$Quiet,
        [string]$OutputDir = "",
        [switch]$Parallel
    )
    $args = @()
    if ($ProjectType -ne "auto") { $args += @('-ProjectType', $ProjectType) }
    if ($ProjectPath -ne ".") { $args += @('-ProjectPath', $ProjectPath) }
    if ($BuildType -ne "Release") { $args += @('-BuildType', $BuildType) }
    if ($Platform -ne "x64") { $args += @('-Platform', $Platform) }
    if ($Clean) { $args += '-Clean' }
    if ($Test) { $args += '-Test' }
    if ($Package) { $args += '-Package' }
    if ($Verbose) { $args += '-Verbose' }
    if ($Quiet) { $args += '-Quiet' }
    if ($OutputDir) { $args += @('-OutputDir', $OutputDir) }
    if ($Parallel) { $args += '-Parallel' }
    return (Invoke-ToolScript -RelativePath 'build/universal_build.ps1' -Arguments $args)
}

# Universal Status Check
function Invoke-UniversalStatusCheck {
    [CmdletBinding()]
    param(
        [string]$ProjectType = "auto",
        [string]$ProjectPath = ".",
        [switch]$Detailed,
        [switch]$Health,
        [switch]$Performance,
        [switch]$Security,
        [switch]$All,
        [switch]$Json,
        [string]$OutputFile = "",
        [switch]$Quiet
    )
    $args = @()
    if ($ProjectType -ne "auto") { $args += @('-ProjectType', $ProjectType) }
    if ($ProjectPath -ne ".") { $args += @('-ProjectPath', $ProjectPath) }
    if ($Detailed) { $args += '-Detailed' }
    if ($Health) { $args += '-Health' }
    if ($Performance) { $args += '-Performance' }
    if ($Security) { $args += '-Security' }
    if ($All) { $args += '-All' }
    if ($Json) { $args += '-Json' }
    if ($OutputFile) { $args += @('-OutputFile', $OutputFile) }
    if ($Quiet) { $args += '-Quiet' }
    return (Invoke-ToolScript -RelativePath 'project-management/universal-status-check.ps1' -Arguments $args)
}

# Universal Setup
function Invoke-UniversalSetup {
    [CmdletBinding()]
    param(
        [string]$ProjectType = "auto",
        [string]$ProjectPath = ".",
        [switch]$Enterprise,
        [switch]$Production,
        [switch]$Development,
        [string]$Environment = "development",
        [switch]$Quiet,
        [switch]$Force
    )
    $args = @()
    if ($ProjectType -ne "auto") { $args += @('-ProjectType', $ProjectType) }
    if ($ProjectPath -ne ".") { $args += @('-ProjectPath', $ProjectPath) }
    if ($Enterprise) { $args += '-Enterprise' }
    if ($Production) { $args += '-Production' }
    if ($Development) { $args += '-Development' }
    if ($Environment -ne "development") { $args += @('-Environment', $Environment) }
    if ($Quiet) { $args += '-Quiet' }
    if ($Force) { $args += '-Force' }
    return (Invoke-ToolScript -RelativePath 'installation/universal_setup.ps1' -Arguments $args)
}

# Universal Tests
function Invoke-UniversalTests {
    [CmdletBinding()]
    param(
        [string]$ProjectType = "auto",
        [string]$ProjectPath = ".",
        [switch]$All,
        [switch]$Unit,
        [switch]$Integration,
        [switch]$E2E,
        [switch]$Visual,
        [switch]$Performance,
        [switch]$Mobile,
        [switch]$Security,
        [switch]$Load,
        [switch]$Coverage,
        [switch]$CI,
        [string]$OutputFormat = "console",
        [string]$TestPattern = "*",
        [switch]$Quiet
    )
    $args = @()
    if ($ProjectType -ne "auto") { $args += @('-ProjectType', $ProjectType) }
    if ($ProjectPath -ne ".") { $args += @('-ProjectPath', $ProjectPath) }
    if ($All) { $args += '-All' }
    if ($Unit) { $args += '-Unit' }
    if ($Integration) { $args += '-Integration' }
    if ($E2E) { $args += '-E2E' }
    if ($Visual) { $args += '-Visual' }
    if ($Performance) { $args += '-Performance' }
    if ($Mobile) { $args += '-Mobile' }
    if ($Security) { $args += '-Security' }
    if ($Load) { $args += '-Load' }
    if ($Coverage) { $args += '-Coverage' }
    if ($CI) { $args += '-CI' }
    if ($OutputFormat -ne "console") { $args += @('-OutputFormat', $OutputFormat) }
    if ($TestPattern -ne "*") { $args += @('-TestPattern', $TestPattern) }
    if ($Quiet) { $args += '-Quiet' }
    return (Invoke-ToolScript -RelativePath 'testing/universal_tests.ps1' -Arguments $args)
}

# Universal Validation
function Invoke-UniversalValidation {
    [CmdletBinding()]
    param(
        [string]$ProjectType = "auto",
        [string]$ProjectPath = ".",
        [switch]$Security,
        [switch]$Performance,
        [switch]$Compliance,
        [switch]$All,
        [switch]$Detailed,
        [string]$OutputFormat = "console",
        [switch]$Quiet
    )
    $args = @()
    if ($ProjectType -ne "auto") { $args += @('-ProjectType', $ProjectType) }
    if ($ProjectPath -ne ".") { $args += @('-ProjectPath', $ProjectPath) }
    if ($Security) { $args += '-Security' }
    if ($Performance) { $args += '-Performance' }
    if ($Compliance) { $args += '-Compliance' }
    if ($All) { $args += '-All' }
    if ($Detailed) { $args += '-Detailed' }
    if ($OutputFormat -ne "console") { $args += @('-OutputFormat', $OutputFormat) }
    if ($Quiet) { $args += '-Quiet' }
    return (Invoke-ToolScript -RelativePath 'validation/universal_validation.ps1' -Arguments $args)
}

# Legacy compatibility functions
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

# Debugging functions
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

# Project management functions
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

# Export all functions
Export-ModuleMember -Function `
    Get-ProjectType, `
    Invoke-UniversalBuild, `
    Invoke-UniversalStatusCheck, `
    Invoke-UniversalSetup, `
    Invoke-UniversalTests, `
    Invoke-UniversalValidation, `
    Invoke-ValidateProject, `
    Invoke-RunTests, `
    New-MissingFiles, `
    Invoke-FixProjectIssues, `
    Invoke-LogAnalyzer, `
    Invoke-ErrorTracker, `
    Invoke-EmergencyTriage, `
    Invoke-ProjectConsistencyCheck, `
    Invoke-DistributeCommands, `
    Invoke-PerformanceTest, `
    Invoke-IntegrationTest
