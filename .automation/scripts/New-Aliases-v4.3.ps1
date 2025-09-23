# New Aliases v4.3 - Enhanced aliases with performance optimization
# Universal Project Manager v4.3 - Enhanced Performance & Optimization

Write-Host "🚀 Loading Universal Project Manager v4.3 Aliases..." -ForegroundColor Cyan

# Main aliases
Set-Alias -Name "ia" -Value "Invoke-Automation" -Scope Global
Set-Alias -Name "qa" -Value "Quick-Access" -Scope Global
Set-Alias -Name "qao" -Value "Quick-Access-Optimized" -Scope Global
Set-Alias -Name "umo" -Value "Universal-Manager-Optimized" -Scope Global
Set-Alias -Name "pso" -Value "Project-Scanner-Optimized" -Scope Global

# Quick Access Optimized aliases
function Quick-Access-Optimized {
    param([string]$Action = "help", [switch]$Verbose, [switch]$Parallel, [switch]$Cache, [switch]$Performance)
    $scriptPath = Join-Path $PSScriptRoot "..\Quick-Access-Optimized-v4.3.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath -Action $Action -Verbose:$Verbose -Parallel:$Parallel -Cache:$Cache -Performance:$Performance
    } else {
        Write-Host "❌ Quick-Access-Optimized script not found" -ForegroundColor Red
    }
}

# Universal Manager Optimized aliases
function Universal-Manager-Optimized {
    param([string]$Command = "help", [string]$Category = "all", [switch]$Verbose, [switch]$Parallel)
    $scriptPath = Join-Path $PSScriptRoot "..\Universal-Manager-Optimized-v4.2.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath -Command $Command -Category $Category -Verbose:$Verbose -Parallel:$Parallel
    } else {
        Write-Host "❌ Universal-Manager-Optimized script not found" -ForegroundColor Red
    }
}

# Project Scanner Optimized aliases
function Project-Scanner-Optimized {
    param([switch]$EnableAI, [switch]$EnableQuantum, [switch]$EnableEnterprise, [switch]$Verbose)
    $scriptPath = Join-Path $PSScriptRoot "..\Project-Scanner-Optimized-v4.2.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath -EnableAI:$EnableAI -EnableQuantum:$EnableQuantum -EnableEnterprise:$EnableEnterprise -GenerateReport -Verbose:$Verbose
    } else {
        Write-Host "❌ Project-Scanner-Optimized script not found" -ForegroundColor Red
    }
}

# Legacy aliases for backward compatibility
Set-Alias -Name "iaq" -Value "Invoke-Automation-Quick" -Scope Global
Set-Alias -Name "iad" -Value "Invoke-Automation-Dev" -Scope Global
Set-Alias -Name "iap" -Value "Invoke-Automation-Prod" -Scope Global
Set-Alias -Name "qasc" -Value "Quick-Access-Scan" -Scope Global
Set-Alias -Name "qad" -Value "Quick-Access-Dev" -Scope Global
Set-Alias -Name "qap" -Value "Quick-Access-Prod" -Scope Global
Set-Alias -Name "psc" -Value "Project-Scanner" -Scope Global
Set-Alias -Name "uam" -Value "Universal-Automation-Manager" -Scope Global
Set-Alias -Name "aefm" -Value "AI-Enhanced-Features-Manager" -Scope Global

# Quick Access functions
function Invoke-Automation-Quick {
    Quick-Access-Optimized -Action "analyze" -Verbose -Parallel -Cache
}

function Invoke-Automation-Dev {
    Quick-Access-Optimized -Action "analyze" -Verbose -Parallel -Cache
    Quick-Access-Optimized -Action "build" -Verbose -Parallel -Cache
    Quick-Access-Optimized -Action "test" -Verbose -Parallel -Cache
}

function Invoke-Automation-Prod {
    Quick-Access-Optimized -Action "analyze" -Verbose -Parallel -Cache
    Quick-Access-Optimized -Action "build" -Verbose -Parallel -Cache
    Quick-Access-Optimized -Action "test" -Verbose -Parallel -Cache
    Quick-Access-Optimized -Action "deploy" -Verbose -Parallel -Cache
}

function Quick-Access-Scan {
    Project-Scanner-Optimized -EnableAI -EnableQuantum -EnableEnterprise -Verbose
}

function Quick-Access-Dev {
    Quick-Access-Optimized -Action "analyze" -Verbose -Parallel -Cache
    Quick-Access-Optimized -Action "build" -Verbose -Parallel -Cache
}

function Quick-Access-Prod {
    Quick-Access-Optimized -Action "analyze" -Verbose -Parallel -Cache
    Quick-Access-Optimized -Action "build" -Verbose -Parallel -Cache
    Quick-Access-Optimized -Action "test" -Verbose -Parallel -Cache
    Quick-Access-Optimized -Action "deploy" -Verbose -Parallel -Cache
}

# Legacy functions for backward compatibility
function Project-Scanner {
    Project-Scanner-Optimized -EnableAI -EnableQuantum -EnableEnterprise -Verbose
}

function Universal-Automation-Manager {
    param([string]$Action = "help", [switch]$EnableAI, [switch]$EnableQuantum, [switch]$EnableEnterprise)
    $scriptPath = Join-Path $PSScriptRoot "..\Universal-Automation-Manager-v3.5.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath -Action $Action -EnableAI:$EnableAI -EnableQuantum:$EnableQuantum -EnableEnterprise:$EnableEnterprise
    } else {
        Write-Host "❌ Universal-Automation-Manager script not found" -ForegroundColor Red
    }
}

function AI-Enhanced-Features-Manager {
    param([string]$Action = "list", [switch]$EnableMultiModal, [switch]$EnableQuantum, [switch]$EnableEnterprise)
    $scriptPath = Join-Path $PSScriptRoot "..\AI-Enhanced-Features-Manager-v3.5.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath -Action $Action -EnableMultiModal:$EnableMultiModal -EnableQuantum:$EnableQuantum -EnableEnterprise:$EnableEnterprise
    } else {
        Write-Host "❌ AI-Enhanced-Features-Manager script not found" -ForegroundColor Red
    }
}

# Performance monitoring aliases
Set-Alias -Name "qam" -Value "Quick-Access-Monitor" -Scope Global
Set-Alias -Name "qao" -Value "Quick-Access-Optimize" -Scope Global
Set-Alias -Name "qas" -Value "Quick-Access-Status" -Scope Global

function Quick-Access-Monitor {
    Quick-Access-Optimized -Action "monitor" -Performance -Verbose
}

function Quick-Access-Optimize {
    Quick-Access-Optimized -Action "optimize" -Performance -Verbose
}

function Quick-Access-Status {
    Quick-Access-Optimized -Action "status" -Verbose
}

# Cache management aliases
Set-Alias -Name "qac" -Value "Quick-Access-Cache" -Scope Global
Set-Alias -Name "qacr" -Value "Quick-Access-Cache-Reset" -Scope Global

function Quick-Access-Cache {
    Quick-Access-Optimized -Action "cache" -Verbose
}

function Quick-Access-Cache-Reset {
    $cacheDir = $env:TEMP
    $cacheFiles = Get-ChildItem -Path $cacheDir -Filter "automation_cache_*.json" -ErrorAction SilentlyContinue
    $cacheFiles | Remove-Item -Force
    Write-Host "✅ Cache cleared" -ForegroundColor Green
}

# Show loaded aliases
Write-Host "✅ Aliases loaded successfully!" -ForegroundColor Green
Write-Host "" "White"
Write-Host "Available aliases:" "Yellow"
Write-Host "  qao    - Quick Access Optimized (main)" "White"
Write-Host "  umo    - Universal Manager Optimized" "White"
Write-Host "  pso    - Project Scanner Optimized" "White"
Write-Host "  qam    - Quick Access Monitor" "White"
Write-Host "  qao    - Quick Access Optimize" "White"
Write-Host "  qas    - Quick Access Status" "White"
Write-Host "  qac    - Quick Access Cache" "White"
Write-Host "  qacr   - Quick Access Cache Reset" "White"
Write-Host "" "White"
Write-Host "Legacy aliases (backward compatibility):" "Yellow"
Write-Host "  iaq    - Invoke Automation Quick" "White"
Write-Host "  iad    - Invoke Automation Dev" "White"
Write-Host "  iap    - Invoke Automation Prod" "White"
Write-Host "  qasc   - Quick Access Scan" "White"
Write-Host "  qad    - Quick Access Dev" "White"
Write-Host "  qap    - Quick Access Prod" "White"
Write-Host "" "White"
Write-Host "Examples:" "Yellow"
Write-Host "  qao -Action analyze -Verbose -Parallel -Cache" "White"
Write-Host "  qam  # Monitor performance" "White"
Write-Host "  qas  # Show status" "White"
Write-Host "  qacr # Reset cache" "White"
