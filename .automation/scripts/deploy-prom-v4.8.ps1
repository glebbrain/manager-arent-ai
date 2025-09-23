# deploy-prom-v4.8.ps1 - Деплой проекта в PROM среду v4.8
# Создает архив tar и развертывает в PROM среду

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectName,
    [string]$SourcePath = ".",
    [string]$PROM_PATH = "",
    [string]$ArchivePath = "",
    [switch]$Force = $false,
    [switch]$Backup = $true,
    [switch]$Verbose = $false,
    [switch]$Clean = $false
)

# Импорт модуля конфигурации
Import-Module -Name ".\automation\config\DeploymentConfig.psm1" -Force

# Получение конфигурации
if ([string]::IsNullOrEmpty($PROM_PATH)) {
    $PROM_PATH = Get-EnvironmentPath -Environment "prom"
    if ([string]::IsNullOrEmpty($PROM_PATH)) {
        Write-Host "❌ ОШИБКА: PROM_PATH не найден в конфигурации" -ForegroundColor Red
        exit 1
    }
}

if ([string]::IsNullOrEmpty($ArchivePath)) {
    $ArchivePath = Get-ArchivePath
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
}

# Заголовок
Write-ColorOutput "🚀 ========================================" "Cyan"
Write-ColorOutput "🚀  ДЕПЛОЙ В PROM СРЕДУ v4.8" "Cyan"
Write-ColorOutput "🚀 ========================================" "Cyan"
Write-ColorOutput ""

Write-ColorOutput "📋 Параметры:" "Yellow"
Write-ColorOutput "  • Проект: $ProjectName" "White"
Write-ColorOutput "  • Исходный путь: $SourcePath" "White"
Write-ColorOutput "  • PROM путь: $PROM_PATH" "White"
Write-ColorOutput "  • Архив: $ArchivePath" "White"
Write-ColorOutput "  • Принудительно: $Force" "White"
Write-ColorOutput "  • Резервная копия: $Backup" "White"
Write-ColorOutput "  • Очистка: $Clean" "White"
Write-ColorOutput ""

# Проверка исходного пути
Write-ColorOutput "🔍 Проверка исходного пути..." "Yellow"
if (!(Test-Path $SourcePath)) {
    Write-ColorOutput "❌ ОШИБКА: Исходный путь не найден: $SourcePath" "Red"
    exit 1
}
Write-ColorOutput "✅ Исходный путь найден: $SourcePath" "Green"

# Проверка PROM пути
Write-ColorOutput "🔍 Проверка PROM пути..." "Yellow"
if (!(Test-Path $PROM_PATH)) {
    Write-ColorOutput "❌ ОШИБКА: PROM путь не найден: $PROM_PATH" "Red"
    Write-ColorOutput "💡 Убедитесь, что OSPanel установлен и запущен" "Cyan"
    exit 1
}
Write-ColorOutput "✅ PROM путь найден: $PROM_PATH" "Green"

# Создание папки для архивов
Write-ColorOutput "📁 Создание папки для архивов..." "Yellow"
if (!(Test-Path $ArchivePath)) {
    try {
        New-Item -ItemType Directory -Path $ArchivePath -Force | Out-Null
        Write-ColorOutput "✅ Папка архивов создана: $ArchivePath" "Green"
    } catch {
        Write-ColorOutput "❌ Ошибка создания папки архивов: $($_.Exception.Message)" "Red"
        exit 1
    }
} else {
    Write-ColorOutput "✅ Папка архивов уже существует: $ArchivePath" "Green"
}

# Определение целевого пути
$TargetPath = Join-Path $PROM_PATH $ProjectName
Write-ColorOutput "🎯 Целевой путь: $TargetPath" "Cyan"

# Проверка существующего деплоя
if ((Test-Path $TargetPath) -and -not $Force) {
    Write-ColorOutput "⚠️  Целевой путь уже существует: $TargetPath" "Yellow"
    Write-ColorOutput "💡 Используйте -Force для перезаписи" "Cyan"
    exit 1
}

# Создание резервной копии (если нужно)
if ($Backup -and (Test-Path $TargetPath)) {
    Write-ColorOutput "📦 Создание резервной копии..." "Yellow"
    $BackupPath = "$TargetPath.backup.$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss')"
    try {
        Copy-Item -Path $TargetPath -Destination $BackupPath -Recurse -Force
        Write-ColorOutput "✅ Резервная копия создана: $BackupPath" "Green"
    } catch {
        Write-ColorOutput "⚠️  Предупреждение: Не удалось создать резервную копию: $($_.Exception.Message)" "Yellow"
    }
}

# Создание архива tar
Write-ColorOutput "📦 Создание архива tar..." "Yellow"
$ArchiveFile = Join-Path $ArchivePath "$ProjectName-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').tar"
$ArchiveFileGz = "$ArchiveFile.gz"

try {
    # Создание tar архива
    Write-ColorOutput "  📋 Архивирование проекта..." "Yellow"
    
    # Используем PowerShell для создания tar (Windows 10+)
    if ($PSVersionTable.PSVersion.Major -ge 5) {
        # Создаем временный список файлов для архивации
        $TempFileList = Join-Path $env:TEMP "tar-files-$ProjectName.txt"
        
        # Исключаем ненужные папки и файлы
        $ExcludePatterns = @(
            "node_modules",
            ".git",
            ".vs",
            "bin",
            "obj",
            "dist",
            "build",
            "*.log",
            "*.tmp",
            ".DS_Store",
            "Thumbs.db"
        )
        
        # Создаем список файлов для архивации
        Get-ChildItem -Path $SourcePath -Recurse | Where-Object {
            $item = $_
            $shouldExclude = $false
            foreach ($pattern in $ExcludePatterns) {
                if ($item.Name -like $pattern -or $item.FullName -like "*\$pattern\*") {
                    $shouldExclude = $true
                    break
                }
            }
            return -not $shouldExclude
        } | ForEach-Object { $_.FullName } | Out-File -FilePath $TempFileList -Encoding UTF8
        
        # Создаем tar архив
        tar -cf $ArchiveFile -T $TempFileList
        
        # Удаляем временный файл
        Remove-Item $TempFileList -Force -ErrorAction SilentlyContinue
        
        Write-ColorOutput "  ✅ Tar архив создан: $ArchiveFile" "Green"
    } else {
        Write-ColorOutput "  ⚠️  PowerShell версии 5+ требуется для создания tar архивов" "Yellow"
        Write-ColorOutput "  📋 Используем простое копирование..." "Yellow"
        
        # Простое копирование без архивации
        if (Test-Path $TargetPath) {
            Remove-Item $TargetPath -Recurse -Force
        }
        Copy-Item -Path $SourcePath -Destination $TargetPath -Recurse -Force
        Write-ColorOutput "  ✅ Проект скопирован в PROM: $TargetPath" "Green"
        Write-ColorOutput "✅ ДЕПЛОЙ В PROM ЗАВЕРШЕН" "Green"
        exit 0
    }
    
    # Сжатие архива
    Write-ColorOutput "  📦 Сжатие архива..." "Yellow"
    try {
        # Используем gzip для сжатия
        gzip $ArchiveFile
        $ArchiveFile = $ArchiveFileGz
        Write-ColorOutput "  ✅ Архив сжат: $ArchiveFile" "Green"
    } catch {
        Write-ColorOutput "  ⚠️  gzip не найден, используем несжатый архив" "Yellow"
    }
    
} catch {
    Write-ColorOutput "❌ Ошибка создания архива: $($_.Exception.Message)" "Red"
    exit 1
}

# Проверка размера архива
if (Test-Path $ArchiveFile) {
    $ArchiveSize = (Get-Item $ArchiveFile).Length
    $ArchiveSizeMB = [math]::Round($ArchiveSize / 1MB, 2)
    Write-ColorOutput "📊 Размер архива: $ArchiveSizeMB MB" "Cyan"
} else {
    Write-ColorOutput "❌ ОШИБКА: Архив не создан" "Red"
    exit 1
}

# Развертывание в PROM
Write-ColorOutput "🚀 Развертывание в PROM среду..." "Yellow"

# Удаление существующего деплоя
if (Test-Path $TargetPath) {
    Write-ColorOutput "  🗑️  Удаление существующего деплоя..." "Yellow"
    try {
        Remove-Item $TargetPath -Recurse -Force
        Write-ColorOutput "  ✅ Существующий деплой удален" "Green"
    } catch {
        Write-ColorOutput "  ❌ Ошибка удаления существующего деплоя: $($_.Exception.Message)" "Red"
        exit 1
    }
}

# Создание целевой папки
Write-ColorOutput "  📁 Создание целевой папки..." "Yellow"
try {
    New-Item -ItemType Directory -Path $TargetPath -Force | Out-Null
    Write-ColorOutput "  ✅ Целевая папка создана: $TargetPath" "Green"
} catch {
    Write-ColorOutput "  ❌ Ошибка создания целевой папки: $($_.Exception.Message)" "Red"
    exit 1
}

# Извлечение архива
Write-ColorOutput "  📦 Извлечение архива..." "Yellow"
try {
    # Определяем, сжат ли архив
    if ($ArchiveFile.EndsWith('.gz')) {
        # Сначала распаковываем gzip
        $UncompressedArchive = $ArchiveFile -replace '\.gz$', ''
        gunzip -c $ArchiveFile > $UncompressedArchive
        tar -xf $UncompressedArchive -C $TargetPath
        Remove-Item $UncompressedArchive -Force -ErrorAction SilentlyContinue
    } else {
        # Обычный tar
        tar -xf $ArchiveFile -C $TargetPath
    }
    Write-ColorOutput "  ✅ Архив извлечен в: $TargetPath" "Green"
} catch {
    Write-ColorOutput "  ❌ Ошибка извлечения архива: $($_.Exception.Message)" "Red"
    Write-ColorOutput "  📋 Используем простое копирование..." "Yellow"
    
    # Fallback: простое копирование
    Copy-Item -Path $SourcePath -Destination $TargetPath -Recurse -Force
    Write-ColorOutput "  ✅ Проект скопирован в PROM: $TargetPath" "Green"
}

# Проверка развертывания
Write-ColorOutput "🔍 Проверка развертывания..." "Yellow"
$DeployedFiles = Get-ChildItem -Path $TargetPath -Recurse -File | Measure-Object | Select-Object -ExpandProperty Count
Write-ColorOutput "📊 Развернуто файлов: $DeployedFiles" "Cyan"

# Очистка старых архивов (если нужно)
if ($Clean) {
    Write-ColorOutput "🧹 Очистка старых архивов..." "Yellow"
    try {
        $OldArchives = Get-ChildItem -Path $ArchivePath -Filter "$ProjectName-*.tar*" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 5
        foreach ($oldArchive in $OldArchives) {
            Remove-Item $oldArchive.FullName -Force
            Write-ColorOutput "  🗑️  Удален старый архив: $($oldArchive.Name)" "Yellow"
        }
        Write-ColorOutput "  ✅ Очистка завершена" "Green"
    } catch {
        Write-ColorOutput "  ⚠️  Предупреждение: Не удалось очистить старые архивы: $($_.Exception.Message)" "Yellow"
    }
}

# Создание отчета о деплое
Write-ColorOutput "📝 Создание отчета о деплое..." "Yellow"
$ReportContent = @"
# 🚀 Отчет о деплое в PROM среду

**Дата:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
**Проект:** $ProjectName
**Исходный путь:** $SourcePath
**PROM путь:** $TargetPath
**Архив:** $ArchiveFile

## 📊 Результаты

- **Статус:** ✅ Успешно
- **Развернуто файлов:** $DeployedFiles
- **Размер архива:** $ArchiveSizeMB MB
- **Резервная копия:** $(if($Backup){'✅ Создана'}else{'❌ Не создана'})

## 🎯 Следующие шаги

1. Проверьте развертывание в браузере
2. Протестируйте функциональность
3. При успешном тестировании - деплой в PROD

## 📁 Файлы

- **PROM путь:** $TargetPath
- **Архив:** $ArchiveFile
"@

try {
    $ReportFile = Join-Path $ArchivePath "deploy-prom-report-$ProjectName-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').md"
    $ReportContent | Out-File -FilePath $ReportFile -Encoding UTF8
    Write-ColorOutput "  ✅ Отчет создан: $ReportFile" "Green"
} catch {
    Write-ColorOutput "  ⚠️  Предупреждение: Не удалось создать отчет: $($_.Exception.Message)" "Yellow"
}

# Финальный отчет
Write-ColorOutput ""
Write-ColorOutput "🎉 ========================================" "Green"
Write-ColorOutput "🎉  ДЕПЛОЙ В PROM ЗАВЕРШЕН УСПЕШНО!" "Green"
Write-ColorOutput "🎉 ========================================" "Green"
Write-ColorOutput ""

Write-ColorOutput "📊 РЕЗУЛЬТАТЫ:" "Cyan"
Write-ColorOutput "  • Проект: $ProjectName" "White"
Write-ColorOutput "  • PROM путь: $TargetPath" "White"
Write-ColorOutput "  • Развернуто файлов: $DeployedFiles" "White"
Write-ColorOutput "  • Размер архива: $ArchiveSizeMB MB" "White"
Write-ColorOutput "  • Архив: $ArchiveFile" "White"
Write-ColorOutput ""

Write-ColorOutput "📝 СЛЕДУЮЩИЕ ШАГИ:" "Cyan"
Write-ColorOutput "  1. Проверьте развертывание в браузере" "White"
Write-ColorOutput "  2. Протестируйте функциональность" "White"
Write-ColorOutput "  3. При успешном тестировании - деплой в PROD:" "White"
Write-ColorOutput "     .\deploy-prod-v4.8.ps1 -ProjectName `"$ProjectName`"" "White"
Write-ColorOutput ""

Write-ColorOutput "🎯 Проект готов к тестированию в PROM среде!" "Green"
Write-ColorOutput ""
