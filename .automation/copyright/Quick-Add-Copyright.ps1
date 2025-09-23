#Requires -Version 5.1

<#
.SYNOPSIS
    Быстрое добавление копирайта к файлам проекта.

.DESCRIPTION
    Упрощенный скрипт для быстрого добавления копирайта.
    Использует настройки по умолчанию для проекта ManagerAgentAI.
#>

param(
    [Parameter()]
    [string]$Author = "GlebBrain",
    
    [Parameter()]
    [switch]$WhatIf
)

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$mainScript = Join-Path $scriptPath "Add-Copyright-All.ps1"

Write-Host "=== Быстрое добавление копирайта ===" -ForegroundColor Cyan
Write-Host "Автор: $Author" -ForegroundColor Gray
Write-Host ""

if ($WhatIf) {
    & $mainScript -Author $Author -WhatIf
} else {
    $confirmation = Read-Host "Добавить копирайт ко всем файлам проекта? (y/N)"
    if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
        & $mainScript -Author $Author
    } else {
        Write-Host "Операция отменена." -ForegroundColor Yellow
    }
}
