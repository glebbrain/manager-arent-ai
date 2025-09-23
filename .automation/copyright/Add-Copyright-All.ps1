#Requires -Version 5.1

<#
.SYNOPSIS
    Массовое добавление копирайта ко всем файлам проекта.

.DESCRIPTION
    Удобный скрипт для добавления копирайта ко всем файлам в проекте.
    Автоматически определяет типы файлов и обрабатывает их рекурсивно.

.PARAMETER ProjectPath
    Путь к корню проекта (по умолчанию: текущая директория).

.PARAMETER Author
    Имя автора (по умолчанию: GlebBrain).

.PARAMETER ExcludeDirs
    Директории для исключения из обработки.

.PARAMETER WhatIf
    Показать какие файлы будут обработаны без внесения изменений.

.EXAMPLE
    .\Add-Copyright-All.ps1
    Добавляет копирайт ко всем файлам в текущем проекте.

.EXAMPLE
    .\Add-Copyright-All.ps1 -ProjectPath "C:\MyProject" -Author "GlebBrain"
    Добавляет копирайт ко всем файлам в указанном проекте.
#>

param(
    [Parameter()]
    [string]$ProjectPath = ".",
    
    [Parameter()]
    [string]$Author = "GlebBrain",
    
    [Parameter()]
    [string[]]$ExcludeDirs = @("node_modules", ".git", ".vs", "bin", "obj", "packages", ".nuget", "dist", "build", ".automation"),
    
    [Parameter()]
    [switch]$WhatIf
)

# Импортируем основной скрипт
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$mainScript = Join-Path $scriptPath "Add-Copyright.ps1"

if (-not (Test-Path $mainScript)) {
    Write-Error "Не найден основной скрипт: $mainScript"
    exit 1
}

Write-Host "=== Массовое добавление копирайта ===" -ForegroundColor Cyan
Write-Host "Проект: $ProjectPath" -ForegroundColor Gray
Write-Host "Автор: $Author" -ForegroundColor Gray
Write-Host "Исключаемые директории: $($ExcludeDirs -join ', ')" -ForegroundColor Gray
Write-Host ""

# Определяем типы файлов для обработки
$fileTypes = @(".js", ".ps1", ".ts", ".html", ".css", ".json", ".md", ".yaml", ".yml", ".py", ".cs", ".cpp", ".c", ".h", ".hpp")

# Создаем временный список файлов для обработки
$tempFileList = [System.IO.Path]::GetTempFileName()

try {
    # Собираем все файлы, исключая указанные директории
    $allFiles = @()
    
    foreach ($fileType in $fileTypes) {
        $files = Get-ChildItem -Path $ProjectPath -Filter "*$fileType" -Recurse -File | Where-Object {
            $shouldExclude = $false
            foreach ($excludeDir in $ExcludeDirs) {
                if ($_.FullName -like "*\$excludeDir\*" -or $_.FullName -like "*\$excludeDir") {
                    $shouldExclude = $true
                    break
                }
            }
            return -not $shouldExclude
        }
        $allFiles += $files
    }
    
    if ($allFiles.Count -eq 0) {
        Write-Warning "Не найдено файлов для обработки."
        exit 0
    }
    
    Write-Host "Найдено файлов для обработки: $($allFiles.Count)" -ForegroundColor Yellow
    Write-Host ""
    
    if ($WhatIf) {
        Write-Host "Список файлов для обработки:" -ForegroundColor Yellow
        foreach ($file in $allFiles) {
            Write-Host "  - $($file.FullName)" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "Для выполнения обработки запустите скрипт без параметра -WhatIf" -ForegroundColor Cyan
        exit 0
    }
    
    # Обрабатываем каждый файл
    $processedCount = 0
    $skippedCount = 0
    
    foreach ($file in $allFiles) {
        Write-Host "Обработка: $($file.Name)" -ForegroundColor Gray
        
        # Вызываем основной скрипт для каждого файла
        $result = & $mainScript -Path $file.FullName -Author $Author -FileTypes @($file.Extension)
        
        if ($LASTEXITCODE -eq 0) {
            $processedCount++
        } else {
            $skippedCount++
        }
    }
    
    Write-Host ""
    Write-Host "=== Итоговый результат ===" -ForegroundColor Cyan
    Write-Host "Обработано файлов: $processedCount" -ForegroundColor Green
    Write-Host "Пропущено файлов: $skippedCount" -ForegroundColor Yellow
    
} finally {
    # Удаляем временный файл
    if (Test-Path $tempFileList) {
        Remove-Item $tempFileList -Force
    }
}
