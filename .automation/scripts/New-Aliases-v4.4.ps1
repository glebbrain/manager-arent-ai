# New Aliases v4.4 - Enhanced aliases with performance optimization
# Universal Project Manager v4.4 - Enhanced Performance & Optimization

Write-Host "🚀 Loading Universal Project Manager v4.4 Aliases..." -ForegroundColor Cyan

# Main aliases v4.4
Set-Alias -Name "ia" -Value "Invoke-Automation" -Scope Global
Set-Alias -Name "qa" -Value "Quick-Access" -Scope Global
Set-Alias -Name "qao" -Value "Quick-Access-Optimized" -Scope Global
Set-Alias -Name "umo" -Value "Universal-Manager-Optimized" -Scope Global
Set-Alias -Name "pso" -Value "Project-Scanner-Optimized" -Scope Global
Set-Alias -Name "po" -Value "Performance-Optimizer" -Scope Global

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

# Performance Optimizer aliases
function Performance-Optimizer {
    param([string]$Action = "all", [switch]$Verbose, [switch]$Force, [switch]$Quick)
    $scriptPath = Join-Path $PSScriptRoot "..\Performance-Optimizer-v4.4.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath -Action $Action -Verbose:$Verbose -Force:$Force -Quick:$Quick
    } else {
        Write-Host "❌ Performance-Optimizer script not found" -ForegroundColor Red
    }
}

# Legacy aliases for backward compatibility
Set-Alias -Name "iaq" -Value "Invoke-Automation-Quick" -Scope Global
Set-Alias -Name "iad" -Value "Invoke-Automation-Dev" -Scope Global
Set-Alias -Name "iap" -Value "Invoke-Automation-Prod" -Scope Global
Set-Alias -Name "qasc" -Value "Quick-Access-Scan" -Scope Global
Set-Alias -Name "qad" -Value "Quick-Dev" -Scope Global
Set-Alias -Name "qab" -Value "Quick-Build" -Scope Global
Set-Alias -Name "qat" -Value "Quick-Test" -Scope Global
Set-Alias -Name "qap" -Value "Quick-Prod" -Scope Global
Set-Alias -Name "psc" -Value "Project-Scanner" -Scope Global
Set-Alias -Name "uam" -Value "Universal-Automation-Manager" -Scope Global
Set-Alias -Name "aefm" -Value "AI-Enhanced-Features-Manager" -Scope Global

# Legacy function wrappers
function Invoke-Automation-Quick {
    param([string]$Action = "help", [switch]$Verbose)
    $scriptPath = Join-Path $PSScriptRoot "..\Invoke-Automation.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath -Action $Action -Verbose:$Verbose
    } else {
        Write-Host "❌ Invoke-Automation script not found" -ForegroundColor Red
    }
}

function Invoke-Automation-Dev {
    param([string]$Action = "dev", [switch]$Verbose)
    $scriptPath = Join-Path $PSScriptRoot "..\Invoke-Automation.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath -Action $Action -Verbose:$Verbose
    } else {
        Write-Host "❌ Invoke-Automation script not found" -ForegroundColor Red
    }
}

function Invoke-Automation-Prod {
    param([string]$Action = "prod", [switch]$Verbose)
    $scriptPath = Join-Path $PSScriptRoot "..\Invoke-Automation.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath -Action $Action -Verbose:$Verbose
    } else {
        Write-Host "❌ Invoke-Automation script not found" -ForegroundColor Red
    }
}

function Quick-Access-Scan {
    param([switch]$EnableAI, [switch]$Verbose)
    $scriptPath = Join-Path $PSScriptRoot "..\Quick-Access.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath -Action scan -AI:$EnableAI -Verbose:$Verbose
    } else {
        Write-Host "❌ Quick-Access script not found" -ForegroundColor Red
    }
}

function Quick-Dev {
    param([switch]$Verbose)
    $scriptPath = Join-Path $PSScriptRoot "..\Quick-Access.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath -Action dev -Verbose:$Verbose
    } else {
        Write-Host "❌ Quick-Access script not found" -ForegroundColor Red
    }
}

function Quick-Build {
    param([switch]$Verbose)
    $scriptPath = Join-Path $PSScriptRoot "..\Quick-Access.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath -Action build -Verbose:$Verbose
    } else {
        Write-Host "❌ Quick-Access script not found" -ForegroundColor Red
    }
}

function Quick-Test {
    param([switch]$Verbose)
    $scriptPath = Join-Path $PSScriptRoot "..\Quick-Access.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath -Action test -Verbose:$Verbose
    } else {
        Write-Host "❌ Quick-Access script not found" -ForegroundColor Red
    }
}

function Quick-Prod {
    param([switch]$Verbose)
    $scriptPath = Join-Path $PSScriptRoot "..\Quick-Access.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath -Action prod -Verbose:$Verbose
    } else {
        Write-Host "❌ Quick-Access script not found" -ForegroundColor Red
    }
}

function Project-Scanner {
    param([switch]$EnableAI, [switch]$Verbose)
    $scriptPath = Join-Path $PSScriptRoot "..\Project-Scanner-Simple.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath -EnableAI:$EnableAI -Verbose:$Verbose
    } else {
        Write-Host "❌ Project-Scanner script not found" -ForegroundColor Red
    }
}

function Universal-Automation-Manager {
    param([string]$Action = "help", [switch]$Verbose)
    $scriptPath = Join-Path $PSScriptRoot "..\Universal-Automation-Manager-v3.5.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath -Action $Action -Verbose:$Verbose
    } else {
        Write-Host "❌ Universal-Automation-Manager script not found" -ForegroundColor Red
    }
}

function AI-Enhanced-Features-Manager {
    param([string]$Action = "help", [switch]$Verbose)
    $scriptPath = Join-Path $PSScriptRoot "..\AI-Enhanced-Features-Manager-v3.5.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath -Action $Action -Verbose:$Verbose
    } else {
        Write-Host "❌ AI-Enhanced-Features-Manager script not found" -ForegroundColor Red
    }
}

# Performance monitoring aliases
Set-Alias -Name "qam" -Value "Quick-Access-Monitor" -Scope Global
Set-Alias -Name "qas" -Value "Quick-Access-Status" -Scope Global
Set-Alias -Name "qac" -Value "Quick-Access-Cache" -Scope Global
Set-Alias -Name "qacr" -Value "Quick-Access-Cache-Reset" -Scope Global

# Performance monitoring functions
function Quick-Access-Monitor {
    param([switch]$Verbose)
    $scriptPath = Join-Path $PSScriptRoot "..\Quick-Access-Optimized-v4.3.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath -Action monitor -Performance -Verbose:$Verbose
    } else {
        Write-Host "❌ Quick-Access-Optimized script not found" -ForegroundColor Red
    }
}

function Quick-Access-Status {
    param([switch]$Verbose)
    $scriptPath = Join-Path $PSScriptRoot "..\Quick-Access-Optimized-v4.3.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath -Action status -Verbose:$Verbose
    } else {
        Write-Host "❌ Quick-Access-Optimized script not found" -ForegroundColor Red
    }
}

function Quick-Access-Cache {
    param([switch]$Verbose)
    $scriptPath = Join-Path $PSScriptRoot "..\Quick-Access-Optimized-v4.3.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath -Action cache -Verbose:$Verbose
    } else {
        Write-Host "❌ Quick-Access-Optimized script not found" -ForegroundColor Red
    }
}

function Quick-Access-Cache-Reset {
    param([switch]$Verbose)
    $scriptPath = Join-Path $PSScriptRoot "..\Quick-Access-Optimized-v4.3.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath -Action cache -Reset -Verbose:$Verbose
    } else {
        Write-Host "❌ Quick-Access-Optimized script not found" -ForegroundColor Red
    }
}

# Display loaded aliases
Write-Host "✅ Aliases loaded successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Main Commands (v4.4):" -ForegroundColor Cyan
Write-Host "  qao   - Quick Access Optimized (main)" -ForegroundColor White
Write-Host "  umo   - Universal Manager Optimized" -ForegroundColor White
Write-Host "  pso   - Project Scanner Optimized" -ForegroundColor White
Write-Host "  po    - Performance Optimizer" -ForegroundColor White
Write-Host ""
Write-Host "📊 Performance Commands:" -ForegroundColor Cyan
Write-Host "  qam   - Quick Access Monitor" -ForegroundColor White
Write-Host "  qas   - Quick Access Status" -ForegroundColor White
Write-Host "  qac   - Quick Access Cache" -ForegroundColor White
Write-Host "  qacr  - Quick Access Cache Reset" -ForegroundColor White
Write-Host ""
Write-Host "🔄 Legacy Commands:" -ForegroundColor Cyan
Write-Host "  ia    - Invoke Automation" -ForegroundColor White
Write-Host "  qa    - Quick Access" -ForegroundColor White
Write-Host "  iaq   - Analyze + Quick Profile" -ForegroundColor White
Write-Host "  iad   - Development Workflow" -ForegroundColor White
Write-Host "  iap   - Production Workflow" -ForegroundColor White
Write-Host ""
Write-Host "💡 Usage Examples:" -ForegroundColor Yellow
Write-Host "  qao -Action analyze -Verbose -Parallel -Cache -Performance" -ForegroundColor Gray
Write-Host "  umo -Command list -Category all -Verbose -Parallel" -ForegroundColor Gray
Write-Host "  pso -EnableAI -EnableQuantum -EnableEnterprise -Verbose" -ForegroundColor Gray
Write-Host "  po -Action all -Verbose -Force" -ForegroundColor Gray
Write-Host ""
Write-Host "🎯 Ready for enhanced performance! Use 'qao -Action help' for more options." -ForegroundColor Green
