# PowerShell скрипт для переименования папок в projectsManagerFiles
# Убирает точку в начале названий папок внутри каждой подпапки

param(
    [string]$BasePath = "projectsManagerFiles",
    [switch]$WhatIf = $false,
    [switch]$Verbose = $false
)

# Функция для логирования
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage
    
    if ($Level -eq "ERROR") {
        Write-Host $logMessage -ForegroundColor Red
    } elseif ($Level -eq "WARNING") {
        Write-Host $logMessage -ForegroundColor Yellow
    } elseif ($Level -eq "SUCCESS") {
        Write-Host $logMessage -ForegroundColor Green
    }
}

# Функция для безопасного переименования папки
function Rename-FolderSafely {
    param(
        [string]$OldPath,
        [string]$NewName
    )
    
    $parentPath = Split-Path $OldPath -Parent
    $newPath = Join-Path $parentPath $NewName
    
    # Проверяем, существует ли папка с новым именем
    if (Test-Path $newPath) {
        Write-Log "Папка '$NewName' уже существует в '$parentPath'. Пропускаем переименование '$OldPath'" "WARNING"
        return $false
    }
    
    try {
        if ($WhatIf) {
            Write-Log "WHATIF: Переименовать '$OldPath' -> '$newPath'" "INFO"
            return $true
        } else {
            Rename-Item -Path $OldPath -NewName $NewName -Force
            Write-Log "Успешно переименовано: '$OldPath' -> '$newPath'" "SUCCESS"
            return $true
        }
    }
    catch {
        Write-Log "Ошибка при переименовании '$OldPath': $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Основная функция
function Start-FolderRename {
    Write-Log "Начинаем переименование папок в '$BasePath'"
    Write-Log "Режим: $(if ($WhatIf) { 'ТЕСТОВЫЙ (WhatIf)' } else { 'РЕАЛЬНЫЙ' })"
    Write-Log "Подробный вывод: $(if ($Verbose) { 'ВКЛЮЧЕН' } else { 'ВЫКЛЮЧЕН' })"
    Write-Log "=" * 60
    
    # Проверяем существование базовой папки
    if (-not (Test-Path $BasePath)) {
        Write-Log "Папка '$BasePath' не найдена!" "ERROR"
        return
    }
    
    $totalRenamed = 0
    $totalSkipped = 0
    $totalErrors = 0
    
    # Получаем все подпапки в projectsManagerFiles
    $projectFolders = Get-ChildItem -Path $BasePath -Directory
    
    foreach ($projectFolder in $projectFolders) {
        Write-Log "Обрабатываем проект: $($projectFolder.Name)"
        
        # Ищем папки с точкой в начале внутри каждого проекта (включая вложенные)
        $dotFolders = Get-ChildItem -Path $projectFolder.FullName -Recurse -Directory | Where-Object { $_.Name -match '^\.' }
        
        if ($dotFolders.Count -eq 0) {
            Write-Log "  Папки с точкой в начале не найдены" "INFO"
            continue
        }
        
        Write-Log "  Найдено папок с точкой: $($dotFolders.Count)"
        
        foreach ($dotFolder in $dotFolders) {
            $oldName = $dotFolder.Name
            $newName = $oldName -replace '^\.', ''  # Убираем точку в начале
            
            if ($Verbose) {
                Write-Log "    Обрабатываем: '$oldName' -> '$newName'"
            }
            
            $result = Rename-FolderSafely -OldPath $dotFolder.FullName -NewName $newName
            
            if ($result) {
                $totalRenamed++
            } elseif ($WhatIf) {
                $totalRenamed++  # В режиме WhatIf считаем как успешное
            } else {
                $totalSkipped++
            }
        }
    }
    
    Write-Log "=" * 60
    Write-Log "РЕЗУЛЬТАТЫ ПЕРЕИМЕНОВАНИЯ:"
    Write-Log "  Успешно переименовано: $totalRenamed"
    Write-Log "  Пропущено: $totalSkipped"
    Write-Log "  Ошибок: $totalErrors"
    
    if ($WhatIf) {
        Write-Log "ВНИМАНИЕ: Это был тестовый запуск! Для реального переименования запустите скрипт без параметра -WhatIf" "WARNING"
    } else {
        Write-Log "Переименование завершено!" "SUCCESS"
    }
}

# Обработка параметров командной строки
if ($args -contains "-h" -or $args -contains "--help") {
    Write-Host @"
Использование: .\rename-folders-remove-dot.ps1 [параметры]

Параметры:
  -BasePath <путь>    Базовый путь для поиска папок (по умолчанию: projectsManagerFiles)
  -WhatIf            Тестовый режим - показывает что будет переименовано без реальных изменений
  -Verbose           Подробный вывод процесса
  -h, --help         Показать эту справку

Примеры:
  .\rename-folders-remove-dot.ps1                    # Реальное переименование
  .\rename-folders-remove-dot.ps1 -WhatIf            # Тестовый режим
  .\rename-folders-remove-dot.ps1 -Verbose           # С подробным выводом
  .\rename-folders-remove-dot.ps1 -BasePath "test"   # Другой базовый путь

"@
    exit 0
}

# Запуск основной функции
try {
    Start-FolderRename
}
catch {
    Write-Log "Критическая ошибка: $($_.Exception.Message)" "ERROR"
    exit 1
}
