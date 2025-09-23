<#!
.SYNOPSIS
  AI Modules Manager v4.0 - Управление новыми AI модулями v4.0

.DESCRIPTION
  Управляет новыми AI модулями v4.0:
  - Next-Generation AI Models v4.0
  - Quantum Computing v4.0
  - Edge Computing v4.0
  - Blockchain & Web3 v4.0
  - VR/AR Support v4.0

.PARAMETER Action
  Действие для выполнения: list, start, stop, restart, status, install, update, test

.PARAMETER Module
  Модуль для управления: ai-models, quantum, edge, blockchain, vr-ar, all

.PARAMETER Port
  Порт для запуска модуля (по умолчанию: 3000-3004)

.EXAMPLE
  .\AI-Modules-Manager-v4.0.ps1 -Action list
  .\AI-Modules-Manager-v4.0.ps1 -Action start -Module ai-models
  .\AI-Modules-Manager-v4.0.ps1 -Action start -Module all
  .\AI-Modules-Manager-v4.0.ps1 -Action status -Module all

.NOTES
  Версия: 4.0.0
  Дата: 2025-01-31
  Статус: Production Ready
#>

[CmdletBinding(PositionalBinding = $false)]
param(
    [ValidateSet("list", "start", "stop", "restart", "status", "install", "update", "test", "logs", "health")]
    [string]$Action = "list",

    [ValidateSet("ai-models", "quantum", "edge", "blockchain", "vr-ar", "all")]
    [string]$Module = "all",

    [int]$Port = 0,

    [switch]$VerboseMode
)

$ErrorActionPreference = 'Stop'
$PSStyle.OutputRendering = 'Host'

# Конфигурация модулей
$Modules = @{
    "ai-models" = @{
        Name = "Next-Generation AI Models v4.0"
        Path = "project-types/ai-modules"
        Port = 3000
        Dependencies = @("express", "body-parser", "cors", "helmet", "morgan")
    }
    "quantum" = @{
        Name = "Quantum Computing v4.0"
        Path = "project-types/ai-modules"
        Port = 3001
        Dependencies = @("express", "body-parser", "cors", "helmet", "morgan")
    }
    "edge" = @{
        Name = "Edge Computing v4.0"
        Path = "project-types/ai-modules"
        Port = 3002
        Dependencies = @("express", "body-parser", "cors", "helmet", "morgan")
    }
    "blockchain" = @{
        Name = "Blockchain & Web3 v4.0"
        Path = "project-types/ai-modules"
        Port = 3003
        Dependencies = @("express", "body-parser", "cors", "helmet", "morgan", "web3", "ethers", "multer", "ws", "uuid")
    }
    "vr-ar" = @{
        Name = "VR/AR Support v4.0"
        Path = "project-types/ai-modules"
        Port = 3004
        Dependencies = @("express", "body-parser", "cors", "helmet", "morgan", "socket.io", "three", "aframe", "webxr-polyfill", "multer", "ws", "uuid")
    }
}

function Write-Info([string]$message) { Write-Host "[AI-MODULES] $message" -ForegroundColor Cyan }
function Write-Ok([string]$message) { Write-Host "[OK] $message" -ForegroundColor Green }
function Write-Warn([string]$message) { Write-Host "[WARN] $message" -ForegroundColor Yellow }
function Write-Err([string]$message) { Write-Host "[ERR] $message" -ForegroundColor Red }

function Get-RepoRoot {
    $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
    return Resolve-Path (Join-Path $scriptPath '..')
}

function Test-ModuleExists([string]$modulePath) {
    $repoRoot = Get-RepoRoot
    $fullPath = Join-Path $repoRoot $modulePath
    return Test-Path $fullPath
}

function Get-ModuleStatus([string]$moduleKey) {
    $module = $Modules[$moduleKey]
    $repoRoot = Get-RepoRoot
    $modulePath = Join-Path $repoRoot $module.Path
    
    if (!(Test-Path $modulePath)) {
        return @{ Status = "Not Found"; Port = $module.Port; ProcessId = $null }
    }
    
    # Проверяем, запущен ли процесс на порту
    try {
        $process = Get-NetTCPConnection -LocalPort $module.Port -ErrorAction SilentlyContinue
        if ($process) {
            return @{ Status = "Running"; Port = $module.Port; ProcessId = $process.OwningProcess }
        }
    }
    catch {
        # Порт свободен
    }
    
    return @{ Status = "Stopped"; Port = $module.Port; ProcessId = $null }
}

function Start-Module([string]$moduleKey) {
    $module = $Modules[$moduleKey]
    $repoRoot = Get-RepoRoot
    $modulePath = Join-Path $repoRoot $module.Path
    
    if (!(Test-Path $modulePath)) {
        Write-Err "Module path not found: $modulePath"
        return $false
    }
    
    $packageJsonPath = Join-Path $modulePath "package.json"
    if (!(Test-Path $packageJsonPath)) {
        Write-Err "package.json not found in: $modulePath"
        return $false
    }
    
    Write-Info "Starting $($module.Name)..."
    
    try {
        # Устанавливаем зависимости если нужно
        $nodeModulesPath = Join-Path $modulePath "node_modules"
        if (!(Test-Path $nodeModulesPath)) {
            Write-Info "Installing dependencies for $($module.Name)..."
            Set-Location $modulePath
            npm install
            Set-Location $repoRoot
        }
        
        # Запускаем модуль
        Set-Location $modulePath
        $process = Start-Process -FilePath "node" -ArgumentList "server.js" -PassThru -WindowStyle Hidden
        Set-Location $repoRoot
        
        Start-Sleep -Seconds 2
        
        # Проверяем статус
        $status = Get-ModuleStatus $moduleKey
        if ($status.Status -eq "Running") {
            Write-Ok "$($module.Name) started successfully on port $($module.Port)"
            return $true
        } else {
            Write-Err "Failed to start $($module.Name)"
            return $false
        }
    }
    catch {
        Write-Err "Error starting $($module.Name): $($_.Exception.Message)"
        return $false
    }
}

function Stop-Module([string]$moduleKey) {
    $module = $Modules[$moduleKey]
    $status = Get-ModuleStatus $moduleKey
    
    if ($status.Status -eq "Running" -and $status.ProcessId) {
        Write-Info "Stopping $($module.Name)..."
        try {
            Stop-Process -Id $status.ProcessId -Force
            Start-Sleep -Seconds 1
            Write-Ok "$($module.Name) stopped successfully"
            return $true
        }
        catch {
            Write-Err "Error stopping $($module.Name): $($_.Exception.Message)"
            return $false
        }
    } else {
        Write-Warn "$($module.Name) is not running"
        return $true
    }
}

function Restart-Module([string]$moduleKey) {
    Write-Info "Restarting $($Modules[$moduleKey].Name)..."
    Stop-Module $moduleKey
    Start-Sleep -Seconds 2
    Start-Module $moduleKey
}

function Test-Module([string]$moduleKey) {
    $module = $Modules[$moduleKey]
    $status = Get-ModuleStatus $moduleKey
    
    if ($status.Status -eq "Running") {
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:$($module.Port)/api/health" -Method Get -TimeoutSec 5
            Write-Ok "$($module.Name) health check passed"
            return $true
        }
        catch {
            Write-Err "$($module.Name) health check failed: $($_.Exception.Message)"
            return $false
        }
    } else {
        Write-Warn "$($module.Name) is not running"
        return $false
    }
}

function Get-ModuleLogs([string]$moduleKey) {
    $module = $Modules[$moduleKey]
    $repoRoot = Get-RepoRoot
    $logsPath = Join-Path $repoRoot "$($module.Path)/logs"
    
    if (Test-Path $logsPath) {
        $logFiles = Get-ChildItem $logsPath -Filter "*.log" | Sort-Object LastWriteTime -Descending
        if ($logFiles) {
            Write-Info "Latest logs for $($module.Name):"
            Get-Content $logFiles[0].FullName -Tail 20
        } else {
            Write-Warn "No log files found for $($module.Name)"
        }
    } else {
        Write-Warn "Logs directory not found for $($module.Name)"
    }
}

function Install-ModuleDependencies([string]$moduleKey) {
    $module = $Modules[$moduleKey]
    $repoRoot = Get-RepoRoot
    $modulePath = Join-Path $repoRoot $module.Path
    
    if (!(Test-Path $modulePath)) {
        Write-Err "Module path not found: $modulePath"
        return $false
    }
    
    Write-Info "Installing dependencies for $($module.Name)..."
    
    try {
        Set-Location $modulePath
        npm install
        Set-Location $repoRoot
        Write-Ok "Dependencies installed successfully for $($module.Name)"
        return $true
    }
    catch {
        Write-Err "Error installing dependencies for $($module.Name): $($_.Exception.Message)"
        Set-Location $repoRoot
        return $false
    }
}

# Основная логика
try {
    $repoRoot = Get-RepoRoot
    
    switch ($Action) {
        "list" {
            Write-Info "AI Modules v4.0 Status:"
            Write-Host ""
            foreach ($moduleKey in $Modules.Keys) {
                $module = $Modules[$moduleKey]
                $status = Get-ModuleStatus $moduleKey
                $statusColor = if ($status.Status -eq "Running") { "Green" } else { "Red" }
                Write-Host "  $($module.Name)" -ForegroundColor White
                Write-Host "    Status: $($status.Status)" -ForegroundColor $statusColor
                Write-Host "    Port: $($status.Port)" -ForegroundColor Yellow
                Write-Host "    Path: $($module.Path)" -ForegroundColor Gray
                Write-Host ""
            }
        }
        
        "start" {
            if ($Module -eq "all") {
                foreach ($moduleKey in $Modules.Keys) {
                    Start-Module $moduleKey
                }
            } else {
                Start-Module $Module
            }
        }
        
        "stop" {
            if ($Module -eq "all") {
                foreach ($moduleKey in $Modules.Keys) {
                    Stop-Module $moduleKey
                }
            } else {
                Stop-Module $Module
            }
        }
        
        "restart" {
            if ($Module -eq "all") {
                foreach ($moduleKey in $Modules.Keys) {
                    Restart-Module $moduleKey
                }
            } else {
                Restart-Module $Module
            }
        }
        
        "status" {
            if ($Module -eq "all") {
                foreach ($moduleKey in $Modules.Keys) {
                    $module = $Modules[$moduleKey]
                    $status = Get-ModuleStatus $moduleKey
                    Write-Host "$($module.Name): $($status.Status) (Port: $($status.Port))" -ForegroundColor $(if ($status.Status -eq "Running") { "Green" } else { "Red" })
                }
            } else {
                $module = $Modules[$Module]
                $status = Get-ModuleStatus $Module
                Write-Host "$($module.Name): $($status.Status) (Port: $($status.Port))" -ForegroundColor $(if ($status.Status -eq "Running") { "Green" } else { "Red" })
            }
        }
        
        "install" {
            if ($Module -eq "all") {
                foreach ($moduleKey in $Modules.Keys) {
                    Install-ModuleDependencies $moduleKey
                }
            } else {
                Install-ModuleDependencies $Module
            }
        }
        
        "test" {
            if ($Module -eq "all") {
                foreach ($moduleKey in $Modules.Keys) {
                    Test-Module $moduleKey
                }
            } else {
                Test-Module $Module
            }
        }
        
        "logs" {
            if ($Module -eq "all") {
                foreach ($moduleKey in $Modules.Keys) {
                    Get-ModuleLogs $moduleKey
                }
            } else {
                Get-ModuleLogs $Module
            }
        }
        
        "health" {
            if ($Module -eq "all") {
                foreach ($moduleKey in $Modules.Keys) {
                    Test-Module $moduleKey
                }
            } else {
                Test-Module $Module
            }
        }
        
        default {
            Write-Err "Unknown action: $Action"
            exit 1
        }
    }
}
catch {
    Write-Err $_.Exception.Message
    if ($VerboseMode) { Write-Err ($_.ScriptStackTrace) }
    exit 1
}
