#Requires -Version 5.1

<#
.SYNOPSIS
    Добавляет копирайт в начало файлов с информацией об авторе, дате создания и последних изменениях.

.DESCRIPTION
    Скрипт автоматически добавляет копирайт-комментарий в начало файлов различных типов.
    Получает имя пользователя из системы, дату создания и последнего изменения из свойств файла.

.PARAMETER Path
    Путь к файлу или директории для обработки.

.PARAMETER FileTypes
    Массив расширений файлов для обработки (по умолчанию: .js, .ps1, .ts, .html, .css, .json, .md, .yaml, .yml).

.PARAMETER Author
    Имя автора (по умолчанию берется из переменной окружения USERNAME).

.PARAMETER Recursive
    Обрабатывать файлы рекурсивно в поддиректориях.

.PARAMETER WhatIf
    Показать какие файлы будут обработаны без внесения изменений.

.EXAMPLE
    .\Add-Copyright.ps1 -Path ".\scripts\*.ps1"
    Добавляет копирайт ко всем PowerShell файлам в папке scripts.

.EXAMPLE
    .\Add-Copyright.ps1 -Path ".\" -Recursive -FileTypes @(".js", ".ts")
    Добавляет копирайт ко всем JS и TS файлам в проекте рекурсивно.

.EXAMPLE
    .\Add-Copyright.ps1 -Path ".\README.md" -Author "GlebBrain"
    Добавляет копирайт к конкретному файлу с указанным автором.
#>

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Path,
    
    [Parameter()]
    [string[]]$FileTypes = @(".js", ".ps1", ".ts", ".html", ".css", ".json", ".md", ".yaml", ".yml", ".py", ".cs", ".cpp", ".c", ".h", ".hpp"),
    
    [Parameter()]
    [string]$Author = $env:USERNAME,
    
    [Parameter()]
    [switch]$Recursive,
    
    [Parameter()]
    [switch]$WhatIf
)

# Функция для получения комментария копирайта в зависимости от типа файла
function Get-CopyrightComment {
    param(
        [string]$FilePath,
        [string]$Author,
        [datetime]$CreatedDate,
        [datetime]$ModifiedDate
    )
    
    $extension = [System.IO.Path]::GetExtension($FilePath).ToLower()
    $fileName = [System.IO.Path]::GetFileName($FilePath)
    
    $createdStr = $CreatedDate.ToString("dd.MM.yyyy")
    $modifiedStr = $ModifiedDate.ToString("dd.MM.yyyy")
    
    switch ($extension) {
        { $_ -in @(".js", ".ts", ".html", ".css", ".json", ".yaml", ".yml") } {
            return @"
/**
 * @fileoverview $fileName
 * @author $Author
 * @created $createdStr
 * @lastmodified $modifiedStr
 * @copyright (c) $($CreatedDate.Year) $Author. All rights reserved.
 */
"@
        }
        { $_ -in @(".ps1", ".psm1", ".psd1") } {
            return @"
#Requires -Version 5.1

<#
.SYNOPSIS
    $fileName

.DESCRIPTION
    Автор: $Author
    Создан: $createdStr
    Последнее изменение: $modifiedStr
    Copyright (c) $($CreatedDate.Year) $Author. All rights reserved.
#>
"@
        }
        { $_ -in @(".py") } {
            return @"
"""
$fileName

Author: $Author
Created: $createdStr
Last Modified: $modifiedStr
Copyright (c) $($CreatedDate.Year) $Author. All rights reserved.
"""
"@
        }
        { $_ -in @(".cs", ".cpp", ".c", ".h", ".hpp") } {
            return @"
/*
 * $fileName
 * 
 * Author: $Author
 * Created: $createdStr
 * Last Modified: $modifiedStr
 * Copyright (c) $($CreatedDate.Year) $Author. All rights reserved.
 */
"@
        }
        { $_ -in @(".md") } {
            return @"
<!--
$fileName

Author: $Author
Created: $createdStr
Last Modified: $modifiedStr
Copyright (c) $($CreatedDate.Year) $Author. All rights reserved.
-->
"@
        }
        default {
            return @"
# $fileName
# Author: $Author
# Created: $createdStr
# Last Modified: $modifiedStr
# Copyright (c) $($CreatedDate.Year) $Author. All rights reserved.
"@
        }
    }
}

# Функция для проверки, есть ли уже копирайт в файле
function Test-HasCopyright {
    param([string]$Content)
    
    $copyrightPatterns = @(
        "@author",
        "Author:",
        "Copyright",
        "@copyright",
        "Created:",
        "@created",
        "Last Modified:",
        "@lastmodified"
    )
    
    foreach ($pattern in $copyrightPatterns) {
        if ($Content -match [regex]::Escape($pattern)) {
            return $true
        }
    }
    return $false
}

# Функция для добавления копирайта к файлу
function Add-CopyrightToFile {
    param(
        [string]$FilePath,
        [string]$Author
    )
    
    try {
        # Получаем информацию о файле
        $fileInfo = Get-Item $FilePath
        $createdDate = $fileInfo.CreationTime
        $modifiedDate = $fileInfo.LastWriteTime
        
        # Читаем содержимое файла
        $content = Get-Content $FilePath -Raw -Encoding UTF8
        
        # Проверяем, есть ли уже копирайт
        if (Test-HasCopyright $content) {
            Write-Warning "Файл '$FilePath' уже содержит информацию о копирайте. Пропускаем."
            return $false
        }
        
        # Получаем комментарий копирайта
        $copyrightComment = Get-CopyrightComment -FilePath $FilePath -Author $Author -CreatedDate $createdDate -ModifiedDate $modifiedDate
        
        # Добавляем копирайт в начало файла
        $newContent = $copyrightComment + "`n`n" + $content
        
        if ($WhatIf) {
            Write-Host "Что если: Добавить копирайт к файлу '$FilePath'" -ForegroundColor Yellow
            return $true
        }
        
        # Сохраняем файл с новой кодировкой
        $newContent | Out-File -FilePath $FilePath -Encoding UTF8 -NoNewline
        
        Write-Host "✓ Добавлен копирайт к файлу: $FilePath" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Error "Ошибка при обработке файла '$FilePath': $($_.Exception.Message)"
        return $false
    }
}

# Основная логика
function Main {
    Write-Host "=== Добавление копирайта к файлам ===" -ForegroundColor Cyan
    Write-Host "Автор: $Author" -ForegroundColor Gray
    Write-Host "Путь: $Path" -ForegroundColor Gray
    Write-Host "Типы файлов: $($FileTypes -join ', ')" -ForegroundColor Gray
    Write-Host "Рекурсивно: $Recursive" -ForegroundColor Gray
    Write-Host ""

    # Определяем, является ли путь файлом или директорией
    if (Test-Path $Path -PathType Leaf) {
        # Обрабатываем один файл
        $fileExtension = [System.IO.Path]::GetExtension($Path).ToLower()
        if ($FileTypes -contains $fileExtension) {
            Add-CopyrightToFile -FilePath $Path -Author $Author
        } else {
            Write-Warning "Тип файла '$fileExtension' не включен в список обрабатываемых типов."
        }
    } else {
        # Обрабатываем директорию
        $processedCount = 0
        $skippedCount = 0
        
        foreach ($fileType in $FileTypes) {
            $pattern = if ($Recursive) { "**\*$fileType" } else { "*$fileType" }
            $files = Get-ChildItem -Path $Path -Filter $pattern -Recurse:$Recursive -File | Where-Object { $_.Extension -eq $fileType }
            
            foreach ($file in $files) {
                if (Add-CopyrightToFile -FilePath $file.FullName -Author $Author) {
                    $processedCount++
                } else {
                    $skippedCount++
                }
            }
        }
        
        Write-Host ""
        Write-Host "=== Результат ===" -ForegroundColor Cyan
        Write-Host "Обработано файлов: $processedCount" -ForegroundColor Green
        Write-Host "Пропущено файлов: $skippedCount" -ForegroundColor Yellow
    }
}

# Запуск основной функции
Main
