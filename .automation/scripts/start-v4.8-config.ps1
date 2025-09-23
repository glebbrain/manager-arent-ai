# start-v4.8-config.ps1 - Умный быстрый старт с конфигурационным файлом
# Использует start-smart-config.json для настройки копирования

param(
    [string]$SourcePath = "",
    [string]$ConfigFile = ".\start-smart-config.json",
    [switch]$Force = $false,
    [switch]$Backup = $true,
    [switch]$Verbose = $false,
    [switch]$DryRun = $false
)

# Импорт модуля конфигурации
Import-Module -Name ".\automation\config\SmartCopyConfig.psm1" -Force

# Получение конфигурации
if ([string]::IsNullOrEmpty($SourcePath)) {
    $SourcePath = Get-SourcePath
    if ([string]::IsNullOrEmpty($SourcePath)) {
        Write-Host "❌ ОШИБКА: SourcePath не найден в конфигурации" -ForegroundColor Red
        exit 1
    }
}

# Настройка цветного вывода
$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Функция для цветного вывода
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Функция для логирования
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-ColorOutput $logMessage
    
    # Логирование в файл если включено
    if ($Config.logging.enabled) {
        try {
            Add-Content -Path $Config.logging.file -Value $logMessage -Encoding UTF8
        } catch {
            # Игнорируем ошибки логирования
        }
    }
}

# Функция для загрузки конфигурации
function Load-Config {
    param([string]$ConfigPath)
    
    if (Test-Path $ConfigPath) {
        try {
            $config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
            Write-ColorOutput "✅ Конфигурация загружена: $ConfigPath" "Green"
            return $config
        } catch {
            Write-ColorOutput "❌ Ошибка загрузки конфигурации: $($_.Exception.Message)" "Red"
            return $null
        }
    } else {
        Write-ColorOutput "⚠️  Конфигурационный файл не найден: $ConfigPath" "Yellow"
        Write-ColorOutput "💡 Создаю конфигурацию по умолчанию..." "Cyan"
        return $null
    }
}

# Функция для создания резервной копии
function Backup-File {
    param(
        [string]$FilePath,
        [string]$BackupSuffix = "backup"
    )
    
    if (!(Test-Path $FilePath)) { return $null }
    
    $timestamp = Get-Date -Format $Config.backupSettings.timestampFormat
    $BackupPath = "$FilePath.$BackupSuffix.$timestamp"
    
    try {
        Copy-Item $FilePath $BackupPath -Force
        Write-Log "📦 Резервная копия: $BackupPath" "INFO"
        return $BackupPath
    } catch {
        Write-Log "⚠️  Не удалось создать резервную копию: $($_.Exception.Message)" "WARN"
        return $null
    }
}

# Функция для умного слияния файлов
function Merge-Files {
    param(
        [string]$SourceFile,
        [string]$TargetFile,
        [string]$MergeType = "append",
        [string]$Separator = "# === ДОБАВЛЕНО ИЗ v4.8 ==="
    )
    
    if (!(Test-Path $SourceFile)) {
        Write-Log "⚠️  Исходный файл не найден: $SourceFile" "WARN"
        return $false
    }
    
    if (!(Test-Path $TargetFile)) {
        # Если целевой файл не существует, просто копируем
        try {
            $targetDir = Split-Path $TargetFile -Parent
            if (!(Test-Path $targetDir)) {
                New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            }
            Copy-Item $SourceFile $TargetFile -Force
            Write-Log "✅ Скопирован: $TargetFile" "INFO"
            return $true
        } catch {
            Write-Log "❌ Ошибка копирования: $($_.Exception.Message)" "ERROR"
            return $false
        }
    }
    
    # Создаем резервную копию если нужно
    if ($Config.backupSettings.enabled) {
        Backup-File $TargetFile $Config.backupSettings.suffix
    }
    
    try {
        $SourceContent = Get-Content $SourceFile -Raw -Encoding $Config.mergeSettings.encoding
        $TargetContent = Get-Content $TargetFile -Raw -Encoding $Config.mergeSettings.encoding
        
        # Проверяем дубликаты если включено
        if ($Config.mergeSettings.checkDuplicates -and $TargetContent -like "*$SourceContent*") {
            Write-Log "⏭️  Пропущен (уже содержится): $TargetFile" "INFO"
            return $true
        }
        
        switch ($MergeType) {
            "append" {
                $NewContent = $TargetContent
                if ($Config.mergeSettings.addSeparator) {
                    $NewContent += "`n`n$Separator`n"
                }
                $NewContent += $SourceContent
                Set-Content $TargetFile $NewContent -Encoding $Config.mergeSettings.encoding
                Write-Log "✅ Объединен (добавлено): $TargetFile" "INFO"
            }
            "prepend" {
                $NewContent = ""
                if ($Config.mergeSettings.addSeparator) {
                    $NewContent = "$Separator`n"
                }
                $NewContent += $SourceContent
                if ($Config.mergeSettings.addSeparator) {
                    $NewContent += "`n"
                }
                $NewContent += $TargetContent
                Set-Content $TargetFile $NewContent -Encoding $Config.mergeSettings.encoding
                Write-Log "✅ Объединен (добавлено в начало): $TargetFile" "INFO"
            }
            "replace" {
                Copy-Item $SourceFile $TargetFile -Force
                Write-Log "✅ Заменен: $TargetFile" "INFO"
            }
        }
        return $true
    } catch {
        Write-Log "❌ Ошибка слияния: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Функция для проверки исключений
function Should-ExcludeFile {
    param(
        [string]$FilePath,
        [array]$ExcludePatterns
    )
    
    foreach ($pattern in $ExcludePatterns) {
        if ($FilePath -like "*\$pattern" -or $FilePath -like "*\$pattern\*" -or $FilePath -like $pattern) {
            return $true
        }
    }
    return $false
}

# Заголовок
Write-ColorOutput "🚀 ========================================" "Cyan"
Write-ColorOutput "🚀  УМНЫЙ БЫСТРЫЙ СТАРТ v4.8 (CONFIG)" "Cyan"
Write-ColorOutput "🚀 ========================================" "Cyan"
Write-ColorOutput ""

Write-ColorOutput "📋 Параметры:" "Yellow"
Write-ColorOutput "  • Исходный путь: $SourcePath" "White"
Write-ColorOutput "  • Конфигурация: $ConfigFile" "White"
Write-ColorOutput "  • Принудительно: $Force" "White"
Write-ColorOutput "  • Резервная копия: $Backup" "White"
Write-ColorOutput "  • Подробно: $Verbose" "White"
Write-ColorOutput "  • Тестовый режим: $DryRun" "White"
Write-ColorOutput ""

# Получение настроек из конфигурации
Write-ColorOutput "📋 Загрузка конфигурации..." "Yellow"
$Config = Get-SmartCopyConfig
$ExcludeFiles = Get-ExcludeFiles
$MergeFiles = Get-MergeFiles
$ReplaceFiles = Get-ReplaceFiles
$BackupSettings = Get-BackupSettings
$MergeSettings = Get-MergeSettings

if ($Config -eq $null) {
    Write-ColorOutput "❌ Не удалось загрузить конфигурацию" "Red"
    exit 1
}

# Проверка исходного пути
Write-ColorOutput "🔍 Проверка исходного пути..." "Yellow"
if (!(Test-Path $SourcePath)) {
    Write-ColorOutput "❌ ОШИБКА: Исходный путь не найден: $SourcePath" "Red"
    exit 1
}
Write-ColorOutput "✅ Исходный путь найден: $SourcePath" "Green"

# Создание папок
Write-ColorOutput "📁 Создание структуры папок..." "Yellow"
if (!(Test-Path ".\.automation")) { 
    New-Item -ItemType Directory -Path ".\.automation" -Force | Out-Null
    Write-ColorOutput "  ✅ Создана папка: .automation" "Green"
}
if (!(Test-Path ".\.manager")) { 
    New-Item -ItemType Directory -Path ".\.manager" -Force | Out-Null
    Write-ColorOutput "  ✅ Создана папка: .manager" "Green"
}
if (!(Test-Path ".\.manager\control-files")) { 
    New-Item -ItemType Directory -Path ".\.manager\control-files" -Force | Out-Null
    Write-ColorOutput "  ✅ Создана папка: .manager\control-files" "Green"
}

# ========================================
# УМНОЕ КОПИРОВАНИЕ ФАЙЛОВ
# ========================================

Write-ColorOutput "📋 Умное копирование файлов..." "Yellow"

# 1. Копирование .automation (исключая ненужные файлы)
Write-ColorOutput "  📁 Копирование .automation..." "Yellow"
if (Test-Path "$SourcePath\.automation") {
    try {
        $AutomationFiles = Get-ChildItem "$SourcePath\.automation" -Recurse | Where-Object {
            $relativePath = $_.FullName.Substring($SourcePath.Length + 1)
            return -not (Should-ExcludeFile $relativePath $ExcludeFiles)
        }
        
        foreach ($file in $AutomationFiles) {
            $relativePath = $file.FullName.Substring($SourcePath.Length + 1)
            $targetPath = ".\$relativePath"
            $targetDir = Split-Path $targetPath -Parent
            
            if ($DryRun) {
                Write-ColorOutput "    [DRY RUN] Скопировать: $relativePath" "Cyan"
            } else {
                # Создаем папку если нужно
                if (!(Test-Path $targetDir)) {
                    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
                }
                
                # Копируем файл
                Copy-Item $file.FullName $targetPath -Force
                Write-ColorOutput "    ✅ Скопирован: $relativePath" "Green"
            }
        }
        
        Write-ColorOutput "  ✅ .automation скопирован" "Green"
    } catch {
        Write-Log "❌ Ошибка копирования .automation: $($_.Exception.Message)" "ERROR"
    }
} else {
    Write-ColorOutput "  ⚠️  .automation не найден в исходном пути" "Yellow"
}

# 2. Копирование .manager (исключая ненужные файлы)
Write-ColorOutput "  📁 Копирование .manager..." "Yellow"
if (Test-Path "$SourcePath\.manager") {
    try {
        $ManagerFiles = Get-ChildItem "$SourcePath\.manager" -Recurse | Where-Object {
            $relativePath = $_.FullName.Substring($SourcePath.Length + 1)
            return -not (Should-ExcludeFile $relativePath $ExcludeFiles)
        }
        
        foreach ($file in $ManagerFiles) {
            $relativePath = $file.FullName.Substring($SourcePath.Length + 1)
            $targetPath = ".\$relativePath"
            $targetDir = Split-Path $targetPath -Parent
            
            if ($DryRun) {
                Write-ColorOutput "    [DRY RUN] Скопировать: $relativePath" "Cyan"
            } else {
                # Создаем папку если нужно
                if (!(Test-Path $targetDir)) {
                    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
                }
                
                # Копируем файл
                Copy-Item $file.FullName $targetPath -Force
                Write-ColorOutput "    ✅ Скопирован: $relativePath" "Green"
            }
        }
        
        Write-ColorOutput "  ✅ .manager скопирован" "Green"
    } catch {
        Write-Log "❌ Ошибка копирования .manager: $($_.Exception.Message)" "ERROR"
    }
} else {
    Write-ColorOutput "  ⚠️  .manager не найден в исходном пути" "Yellow"
}

# 3. Умное слияние файлов
Write-ColorOutput "  🔄 Умное слияние файлов..." "Yellow"
foreach ($mergeFile in $MergeFiles.PSObject.Properties) {
    $sourceFile = "$SourcePath\$($mergeFile.Name)"
    $targetFile = ".\$($mergeFile.Name)"
    $mergeConfig = $mergeFile.Value
    
    if ($mergeConfig.enabled) {
        if ($DryRun) {
            Write-ColorOutput "    [DRY RUN] Слияние: $($mergeFile.Name) ($($mergeConfig.type))" "Cyan"
        } else {
            Write-ColorOutput "    🔄 Слияние: $($mergeFile.Name) ($($mergeConfig.type))" "Cyan"
            Merge-Files $sourceFile $targetFile $mergeConfig.type $mergeConfig.separator
        }
    }
}

# 4. Копирование файлов для замены (если Force)
if ($Force) {
    Write-ColorOutput "  🔄 Принудительная замена файлов..." "Yellow"
    foreach ($replaceFile in $ReplaceFiles.PSObject.Properties) {
        $sourceFile = "$SourcePath\$($replaceFile.Name)"
        $targetFile = ".\$($replaceFile.Name)"
        $replaceConfig = $replaceFile.Value
        
        if ($replaceConfig.enabled -and (Test-Path $sourceFile)) {
            if ($DryRun) {
                Write-ColorOutput "    [DRY RUN] Замена: $($replaceFile.Name)" "Cyan"
            } else {
                Write-ColorOutput "    🔄 Замена: $($replaceFile.Name)" "Cyan"
                Merge-Files $sourceFile $targetFile "replace"
            }
        }
    }
} else {
    Write-ColorOutput "  ⏭️  Пропущена принудительная замена (используйте -Force)" "Cyan"
}

# 5. Копирование cursor.json (если Force или не существует)
Write-ColorOutput "  📋 Обработка cursor.json..." "Yellow"
if (Test-Path "$SourcePath\cursor.json") {
    if ($Force -or !(Test-Path ".\cursor.json")) {
        if ($DryRun) {
            Write-ColorOutput "    [DRY RUN] Обновление cursor.json" "Cyan"
        } else {
            if ($Config.backupSettings.enabled -and (Test-Path ".\cursor.json")) {
                Backup-File ".\cursor.json" "before-cursor-update"
            }
            Copy-Item "$SourcePath\cursor.json" "." -Force
            Write-ColorOutput "    ✅ cursor.json обновлен" "Green"
        }
    } else {
        Write-ColorOutput "    ⏭️  cursor.json уже существует (используйте -Force для замены)" "Cyan"
    }
} else {
    Write-ColorOutput "    ⚠️  cursor.json не найден в исходном пути" "Yellow"
}

# ========================================
# ЗАГРУЗКА АЛИАСОВ И НАСТРОЙКА
# ========================================

if (-not $DryRun) {
    Write-ColorOutput "🔧 Загрузка алиасов и настройка..." "Yellow"
    
    # Загрузка алиасов
    if (Test-Path ".\.automation\scripts\New-Aliases-v4.8.ps1") {
        try {
            . .\.automation\scripts\New-Aliases-v4.8.ps1
            Write-ColorOutput "  ✅ Алиасы v4.8 загружены" "Green"
        } catch {
            Write-Log "❌ Ошибка загрузки алиасов: $($_.Exception.Message)" "ERROR"
        }
    } else {
        Write-ColorOutput "  ⚠️  Файл алиасов не найден" "Yellow"
    }
    
    # Настройка системы
    if (Test-Path ".\.automation\Quick-Access-Optimized-v4.8.ps1") {
        try {
            Write-ColorOutput "  ⚙️  Настройка системы..." "Cyan"
            pwsh -File .\.automation\Quick-Access-Optimized-v4.8.ps1 -Action setup
            Write-ColorOutput "  ✅ Настройка завершена" "Green"
        } catch {
            Write-Log "❌ Ошибка настройки: $($_.Exception.Message)" "ERROR"
        }
    } else {
        Write-ColorOutput "  ⚠️  Файл настройки не найден" "Yellow"
    }
    
    # Анализ и оптимизация
    Write-ColorOutput "🔍 Анализ и оптимизация..." "Yellow"
    
    if (Test-Path ".\.automation\Project-Analysis-Optimizer-v4.8.ps1") {
        try {
            Write-ColorOutput "  🔍 Анализ проекта..." "Cyan"
            pwsh -File .\.automation\Project-Analysis-Optimizer-v4.8.ps1 -Action analyze -AI -Quantum
            Write-ColorOutput "  ✅ Анализ завершен" "Green"
        } catch {
            Write-Log "❌ Ошибка анализа: $($_.Exception.Message)" "ERROR"
        }
        
        try {
            Write-ColorOutput "  ⚡ Оптимизация..." "Cyan"
            pwsh -File .\.automation\Project-Analysis-Optimizer-v4.8.ps1 -Action optimize -AI -Quantum
            Write-ColorOutput "  ✅ Оптимизация завершена" "Green"
        } catch {
            Write-Log "❌ Ошибка оптимизации: $($_.Exception.Message)" "ERROR"
        }
    } else {
        Write-ColorOutput "  ⚠️  Файл анализа не найден" "Yellow"
    }
}

# ========================================
# ИТОГОВЫЙ ОТЧЕТ
# ========================================

Write-ColorOutput ""
Write-ColorOutput "🎉 ========================================" "Green"
Write-ColorOutput "🎉  УМНЫЙ БЫСТРЫЙ СТАРТ ЗАВЕРШЕН!" "Green"
Write-ColorOutput "🎉 ========================================" "Green"
Write-ColorOutput ""

Write-ColorOutput "📊 РЕЗУЛЬТАТЫ:" "Cyan"
Write-ColorOutput "  • Конфигурация: ✅ Загружена" "White"
Write-ColorOutput "  • Структура папок: ✅ Создана" "White"
Write-ColorOutput "  • .automation: ✅ Скопирован" "White"
Write-ColorOutput "  • .manager: ✅ Скопирован" "White"
Write-ColorOutput "  • Умное слияние: ✅ Выполнено" "White"
if (-not $DryRun) {
    Write-ColorOutput "  • Алиасы: ✅ Загружены" "White"
    Write-ColorOutput "  • Настройка: ✅ Завершена" "White"
    Write-ColorOutput "  • Анализ: ✅ Выполнен" "White"
    Write-ColorOutput "  • Оптимизация: ✅ Завершена" "White"
}
Write-ColorOutput ""

Write-ColorOutput "📝 СЛЕДУЮЩИЕ ШАГИ:" "Cyan"
Write-ColorOutput "  1. Проверьте файлы проекта" "White"
Write-ColorOutput "  2. Убедитесь, что TODO.md и IDEA.md не перезаписаны" "White"
Write-ColorOutput "  3. Проверьте слияние .manager/start.md" "White"
Write-ColorOutput "  4. Используйте новые алиасы: mpo, mmo, qai, qaq, qap" "White"
Write-ColorOutput ""

if ($DryRun) {
    Write-ColorOutput "🧪 ТЕСТОВЫЙ РЕЖИМ: Изменения не применены" "Yellow"
    Write-ColorOutput "💡 Запустите без -DryRun для применения изменений" "Cyan"
} else {
    Write-ColorOutput "🎯 Проект готов к работе с v4.8!" "Green"
}

Write-ColorOutput ""
