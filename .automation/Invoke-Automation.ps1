<#!
.SYNOPSIS
  Unified dispatcher for .automation scripts to speed up common workflows.

.DESCRIPTION
  Wraps core v3.5 scripts with consistent flags and sensible defaults.
  Provides a single entry point for setup, analyze, build, test, deploy,
  monitor, optimize, uiux, status, migrate, backup, restore, and scan.

.EXAMPLE
  pwsh -File .\.automation\Invoke-Automation.ps1 -Action analyze -AI

.NOTES
  Non-interactive by default. Designed for Windows PowerShell 7+.
#>

[CmdletBinding(PositionalBinding = $false)]
param(
    [ValidateSet("setup","analyze","build","test","deploy","monitor","optimize","uiux","status","migrate","backup","restore","clean","scan","fastsetup","dev","prod")]
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

$ErrorActionPreference = 'Stop'
$PSStyle.OutputRendering = 'Host'

function Resolve-RepoRoot {
    if ($MyInvocation.MyCommand.Path) {
        $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
        $repoRoot = Resolve-Path (Join-Path $scriptPath '..')
    } else {
        $repoRoot = Get-Location
    }
    return $repoRoot
}

function Join-PathSafe([string]$base, [string]$child) {
    return (Resolve-Path (Join-Path $base $child)).Path
}

function Write-Info([string]$message) { Write-Host "[AUTO] $message" -ForegroundColor Cyan }
function Write-Ok([string]$message) { Write-Host "[OK]  $message" -ForegroundColor Green }
function Write-Warn([string]$message) { Write-Host "[WARN] $message" -ForegroundColor Yellow }
function Write-Err([string]$message) { Write-Host "[ERR] $message" -ForegroundColor Red }

function Get-CoreFlags {
    $flags = @()
    # AI is enabled by default for better automation
    $flags += '-EnableAI'
    if ($Quantum.IsPresent) { $flags += '-EnableQuantum' }
    if ($Enterprise.IsPresent) { $flags += '-EnableEnterprise' }
    if ($UIUX.IsPresent) { $flags += '-EnableUIUX' }
    if ($Advanced.IsPresent) { $flags += '-EnableAdvanced' }
    if ($Blockchain.IsPresent) { $flags += '-EnableBlockchain' }
    if ($VRAR.IsPresent) { $flags += '-EnableVRAR' }
    if ($Edge.IsPresent) { $flags += '-EnableEdge' }
    return $flags
}

function Invoke-CoreScript {
    param(
        [Parameter(Mandatory=$true)][string]$ScriptRelativePath,
        [string[]]$AdditionalArgs
    )
    $root = Resolve-RepoRoot
    $scriptFull = Join-Path $root ".automation/$ScriptRelativePath"
    if (!(Test-Path $scriptFull)) {
        throw "Script not found: $ScriptRelativePath"
    }
    $args = @()
    $args += (Get-CoreFlags)
    if ($null -ne $AdditionalArgs -and $AdditionalArgs.Count -gt 0) { $args += $AdditionalArgs }
    if ($DebugMode) { Write-Info "Executing: $ScriptRelativePath $($args -join ' ')" }
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    & $scriptFull @args
    $sw.Stop()
    Write-Ok ("$ScriptRelativePath finished in {0:N2}s" -f $sw.Elapsed.TotalSeconds)
}

function Invoke-UAManager([string]$subAction) {
    $extra = @('-Action', $subAction)
    Invoke-CoreScript -ScriptRelativePath 'Universal-Automation-Manager-v3.5.ps1' -AdditionalArgs $extra
}

function Invoke-QuickProfile {
    Write-Info 'Quick profile: analyze -> build -> test -> status'
    Invoke-UAManager 'analyze'
    Invoke-UAManager 'build'
    Invoke-UAManager 'test'
    Invoke-UAManager 'status'
}

function Invoke-FastSetup {
    Write-Info 'Fast setup: scan -> setup -> analyze'
    Invoke-CoreScript -ScriptRelativePath 'Project-Scanner-Enhanced-v3.5.ps1' -AdditionalArgs @('-GenerateReport')
    Invoke-UAManager 'setup'
    Invoke-UAManager 'analyze'
}

function Invoke-DevWorkflow {
    Write-Info 'Dev workflow: analyze -> build -> test -> monitor'
    Invoke-UAManager 'analyze'
    Invoke-UAManager 'build'
    Invoke-UAManager 'test'
    Invoke-UAManager 'monitor'
}

function Invoke-ProdWorkflow {
    Write-Info 'Production workflow: analyze -> build -> test -> deploy -> monitor'
    Invoke-UAManager 'analyze'
    Invoke-UAManager 'build'
    Invoke-UAManager 'test'
    Invoke-UAManager 'deploy'
    Invoke-UAManager 'monitor'
}

try {
    switch ($Action) {
        'setup'     { Invoke-UAManager 'setup' }
        'analyze'   { Invoke-UAManager 'analyze' }
        'build'     { Invoke-UAManager 'build' }
        'test'      { Invoke-UAManager 'test' }
        'deploy'    { Invoke-UAManager 'deploy' }
        'monitor'   { Invoke-UAManager 'monitor' }
        'optimize'  { Invoke-UAManager 'optimize' }
        'uiux'      { Invoke-UAManager 'uiux' }
        'status'    { Invoke-UAManager 'status' }
        'migrate'   { Invoke-UAManager 'migrate' }
        'backup'    { Invoke-UAManager 'backup' }
        'restore'   { Invoke-UAManager 'restore' }
        'clean'     { Invoke-UAManager 'clean' }
        'scan'      { Invoke-CoreScript -ScriptRelativePath 'Project-Scanner-Enhanced-v3.5.ps1' -AdditionalArgs @('-GenerateReport') }
        'fastsetup' { Invoke-FastSetup }
        'dev'       { Invoke-DevWorkflow }
        'prod'      { Invoke-ProdWorkflow }
        default     { Invoke-UAManager 'status' }
    }

    if ($Quick) { Invoke-QuickProfile }
}
catch {
    Write-Err $_.Exception.Message
    if ($DebugMode) { Write-Err ($_.ScriptStackTrace) }
    exit 1
}


