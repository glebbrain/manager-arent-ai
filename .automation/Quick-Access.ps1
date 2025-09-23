# Quick Access Script v3.5
# Fast access to commonly used automation commands

param(
    [ValidateSet("help", "status", "scan", "build", "test", "dev", "prod", "setup", "clean", "backup")]
    [string]$Command = "help",
    
    [switch]$AI,
    [switch]$Quantum,
    [switch]$Enterprise,
    [switch]$UIUX,
    [switch]$Advanced,
    [switch]$Verbose
)

$ErrorActionPreference = 'Stop'
$PSStyle.OutputRendering = 'Host'

function Write-Header {
    Write-Host "🚀 Quick Access v3.5" -ForegroundColor Cyan
    Write-Host "Fast automation commands for Universal Project Manager" -ForegroundColor Gray
    Write-Host "=" * 50 -ForegroundColor Cyan
}

function Show-Help {
    Write-Host "`n📋 Available Commands:" -ForegroundColor Yellow
    Write-Host "  status     - Show project status" -ForegroundColor Green
    Write-Host "  scan       - Quick project scan" -ForegroundColor Green
    Write-Host "  build      - Build project" -ForegroundColor Green
    Write-Host "  test       - Run tests" -ForegroundColor Green
    Write-Host "  dev        - Development workflow" -ForegroundColor Green
    Write-Host "  prod       - Production workflow" -ForegroundColor Green
    Write-Host "  setup      - Setup project" -ForegroundColor Green
    Write-Host "  clean      - Clean project" -ForegroundColor Green
    Write-Host "  backup     - Backup project" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔧 Available Flags:" -ForegroundColor Yellow
    Write-Host "  -AI         - Enable AI features" -ForegroundColor Cyan
    Write-Host "  -Quantum    - Enable Quantum features" -ForegroundColor Magenta
    Write-Host "  -Enterprise - Enable Enterprise features" -ForegroundColor Blue
    Write-Host "  -UIUX       - Enable UI/UX features" -ForegroundColor Yellow
    Write-Host "  -Advanced   - Enable Advanced features" -ForegroundColor Red
    Write-Host "  -Verbose    - Verbose output" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 Examples:" -ForegroundColor Yellow
    Write-Host "  .\Quick-Access.ps1 -Command scan -AI -Verbose" -ForegroundColor Gray
    Write-Host "  .\Quick-Access.ps1 -Command dev -AI -Quantum" -ForegroundColor Gray
    Write-Host "  .\Quick-Access.ps1 -Command prod -Enterprise -Advanced" -ForegroundColor Gray
}

function Get-Flags {
    $flags = @()
    if ($AI) { $flags += '-AI' }
    if ($Quantum) { $flags += '-Quantum' }
    if ($Enterprise) { $flags += '-Enterprise' }
    if ($UIUX) { $flags += '-UIUX' }
    if ($Advanced) { $flags += '-Advanced' }
    if ($Verbose) { $flags += '-Verbose' }
    return $flags
}

function Invoke-QuickCommand {
    param([string]$Action, [string[]]$AdditionalFlags = @())
    
    $flags = Get-Flags
    $allFlags = $flags + $AdditionalFlags
    
    Write-Host "`n🎯 Executing: $Action" -ForegroundColor Cyan
    if ($Verbose) {
        Write-Host "Flags: $($allFlags -join ' ')" -ForegroundColor Gray
    }
    
    & ".\Invoke-Automation.ps1" -Action $Action @allFlags
}

try {
    Write-Header
    
    switch ($Command) {
        "help" {
            Show-Help
        }
        "status" {
            Invoke-QuickCommand "status"
        }
        "scan" {
            Invoke-QuickCommand "scan" @("-GenerateReport")
        }
        "build" {
            Invoke-QuickCommand "build"
        }
        "test" {
            Invoke-QuickCommand "test"
        }
        "dev" {
            Invoke-QuickCommand "dev"
        }
        "prod" {
            Invoke-QuickCommand "prod"
        }
        "setup" {
            Invoke-QuickCommand "setup"
        }
        "clean" {
            Invoke-QuickCommand "clean"
        }
        "backup" {
            Invoke-QuickCommand "backup"
        }
        default {
            Write-Host "❌ Unknown command: $Command" -ForegroundColor Red
            Show-Help
        }
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($Verbose) {
        Write-Host "Stack Trace: $($_.ScriptStackTrace)" -ForegroundColor Gray
    }
    exit 1
}
