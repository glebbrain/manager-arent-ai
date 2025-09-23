<#!
.SYNOPSIS
  Enhanced unified dispatcher for .automation scripts with improved error handling and logging.

.DESCRIPTION
  Wraps core v3.5 scripts with consistent flags, sensible defaults, and enhanced error handling.
  Provides a single entry point for setup, analyze, build, test, deploy, monitor, optimize, uiux, status, migrate, backup, restore, and scan.

.EXAMPLE
  pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action analyze -AI

.NOTES
  Non-interactive by default. Designed for Windows PowerShell 7+.
  Enhanced with better error handling, logging, and performance monitoring.
#>

[CmdletBinding(PositionalBinding = $false)]
param(
    [ValidateSet("setup","analyze","build","test","deploy","monitor","optimize","uiux","status","migrate","backup","restore","clean","scan")]
    [string]$Action = "status",

    [switch]$AI,
    [switch]$Quantum,
    [switch]$Enterprise,
    [switch]$UIUX,
    [switch]$Advanced,
    [switch]$Blockchain,
    [switch]$VRAR,
    [switch]$Edge,

    [switch]$Quick,
    [switch]$DebugMode
)

# Enhanced error handling and logging
$ErrorActionPreference = 'Stop'
$PSStyle.OutputRendering = 'Host'

# Logging functions
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    switch ($Level) {
        "ERROR" { Write-Host $logMessage -ForegroundColor Red }
        "WARN"  { Write-Host $logMessage -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logMessage -ForegroundColor Green }
        "INFO"  { Write-Host $logMessage -ForegroundColor Cyan }
        default { Write-Host $logMessage }
    }
}

function Write-Info { param([string]$Message) Write-Log $Message "INFO" }
function Write-Err { param([string]$Message) Write-Log $Message "ERROR" }
function Write-Warn { param([string]$Message) Write-Log $Message "WARN" }
function Write-Ok { param([string]$Message) Write-Log $Message "SUCCESS" }

# Enhanced repository root resolution
function Resolve-RepoRoot {
    try {
        if ($MyInvocation.MyCommand.Path) {
            $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
            $repoRoot = Resolve-Path (Join-Path $scriptPath '..') -ErrorAction Stop
        } else {
            $repoRoot = Get-Location
        }
        return $repoRoot
    }
    catch {
        Write-Warn "Could not resolve repository root, using current location"
        return Get-Location
    }
}

# Enhanced path joining with error handling
function Join-PathSafe([string]$base, [string]$child) {
    try {
        return (Resolve-Path (Join-Path $base $child) -ErrorAction Stop).Path
    }
    catch {
        Write-Warn "Could not resolve path: $base\$child"
        return Join-Path $base $child
    }
}

# Enhanced core flags generation
function Get-CoreFlags {
    $flags = @()
    if ($AI.IsPresent) { $flags += '-EnableAI' } else { $flags += '-EnableAI' }
    if ($Quantum.IsPresent) { $flags += '-EnableQuantum' }
    if ($Enterprise.IsPresent) { $flags += '-EnableEnterprise' }
    if ($UIUX.IsPresent) { $flags += '-EnableUIUX' }
    if ($Advanced.IsPresent) { $flags += '-EnableAdvanced' }
    if ($Blockchain.IsPresent) { $flags += '-EnableBlockchain' }
    if ($VRAR.IsPresent) { $flags += '-EnableVRAR' }
    if ($Edge.IsPresent) { $flags += '-EnableEdge' }
    return $flags
}

# Enhanced script execution with better error handling
function Invoke-CoreScript {
    param(
        [string]$ScriptRelativePath,
        [array]$AdditionalArgs = @()
    )
    
    try {
        $repoRoot = Resolve-RepoRoot
        $scriptFull = Join-PathSafe $repoRoot $ScriptRelativePath
        
        if (-not (Test-Path $scriptFull)) {
            throw "Script not found: $ScriptRelativePath"
        }
        
        $args = @()
        if ($null -ne $AdditionalArgs -and $AdditionalArgs.Count -gt 0) { $args += $AdditionalArgs }
        $args += (Get-CoreFlags)
        
        if ($DebugMode) { 
            Write-Info "Executing: $ScriptRelativePath $($args -join ' ')" 
        }
        
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        & $scriptFull @args
        $exitCode = $LASTEXITCODE
        $sw.Stop()
        
        if ($exitCode -eq 0 -or $exitCode -eq $null) {
            Write-Ok ("$ScriptRelativePath finished successfully in {0:N2}s" -f $sw.Elapsed.TotalSeconds)
            return 0
        } else {
            Write-Err ("$ScriptRelativePath failed with exit code $exitCode in {0:N2}s" -f $sw.Elapsed.TotalSeconds)
            return $exitCode
        }
    }
    catch {
        Write-Err "Failed to execute $ScriptRelativePath`: $($_.Exception.Message)"
        if ($DebugMode) { 
            Write-Err ($_.ScriptStackTrace) 
        }
        return 1
    }
}

# Enhanced quick profile execution
function Invoke-QuickProfile {
    Write-Info "Running quick profile: build -> test -> status"
    $buildResult = Invoke-CoreScript ".automation\Universal-Automation-Manager-v3.5.ps1" @("-Action", "build")
    if ($buildResult -eq 0) {
        $testResult = Invoke-CoreScript ".automation\Universal-Automation-Manager-v3.5.ps1" @("-Action", "test")
        if ($testResult -eq 0) {
            Invoke-CoreScript ".automation\Universal-Automation-Manager-v3.5.ps1" @("-Action", "status")
        }
    }
}

# Main execution with enhanced error handling
try {
    Write-Info "Starting Universal Automation Manager Enhanced v3.5"
    Write-Info "Action: $Action"
    
    if ($DebugMode) {
        Write-Info "Debug mode enabled"
        Write-Info "Flags: $(Get-CoreFlags -join ' ')"
    }

    switch ($Action) {
        "setup" { 
            $result = Invoke-CoreScript ".automation\Universal-Automation-Manager-v3.5.ps1" @("setup")
        }
        "analyze" { 
            $result = Invoke-CoreScript ".automation\Project-Scanner-Enhanced-v3.5.ps1" @("analyze")
        }
        "build" { 
            $result = Invoke-CoreScript ".automation\Universal-Automation-Manager-v3.5.ps1" @("build")
        }
        "test" { 
            $result = Invoke-CoreScript ".automation\Universal-Automation-Manager-v3.5.ps1" @("test")
        }
        "deploy" { 
            $result = Invoke-CoreScript ".automation\Universal-Automation-Manager-v3.5.ps1" @("deploy")
        }
        "monitor" { 
            $result = Invoke-CoreScript ".automation\Universal-Automation-Manager-v3.5.ps1" @("monitor")
        }
        "optimize" { 
            $result = Invoke-CoreScript ".automation\Universal-Automation-Manager-v3.5.ps1" @("optimize")
        }
        "uiux" { 
            $result = Invoke-CoreScript ".automation\AI-Enhanced-Features-Manager-v3.5.ps1" @("uiux")
        }
        "status" { 
            $result = Invoke-CoreScript ".automation\Universal-Automation-Manager-v3.5.ps1" @("status")
        }
        "migrate" { 
            $result = Invoke-CoreScript ".automation\Universal-Automation-Manager-v3.5.ps1" @("migrate")
        }
        "backup" { 
            $result = Invoke-CoreScript ".automation\Universal-Automation-Manager-v3.5.ps1" @("backup")
        }
        "restore" { 
            $result = Invoke-CoreScript ".automation\Universal-Automation-Manager-v3.5.ps1" @("restore")
        }
        "clean" { 
            $result = Invoke-CoreScript ".automation\Universal-Automation-Manager-v3.5.ps1" @("clean")
        }
        "scan" { 
            $result = Invoke-CoreScript ".automation\Project-Scanner-Enhanced-v3.5.ps1" @("scan")
        }
        default { 
            Write-Warn "Unknown action: $Action"
            $result = 1
        }
    }

    if ($Quick) { 
        Invoke-QuickProfile 
    }
    
    if ($result -eq 0) {
        Write-Ok "Universal Automation Manager Enhanced completed successfully"
    } else {
        Write-Err "Universal Automation Manager Enhanced completed with errors"
        exit $result
    }
}
catch {
    Write-Err "Fatal error: $($_.Exception.Message)"
    if ($DebugMode) { 
        Write-Err ($_.ScriptStackTrace) 
    }
    exit 1
}
