# deploy-full-v4.8.ps1 - Полный workflow деплоя DEV->PROM->PROD v4.8
# Выполняет все этапы: DEV -> PROM -> PROD с архивированием

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectName,
    [string]$SourcePath = ".",
    [string]$PROM_PATH = "",
    [string]$Server = "",
    [string]$PROD_PATH = "",
    [string]$ArchivePath = "",
    [switch]$Force = $false,
    [switch]$Backup = $true,
    [switch]$Verbose = $false,
    [switch]$Clean = $false,
    [switch]$SkipPROM = $false,
    [switch]$SkipPROD = $false,
    [switch]$TestOnly = $false
)

# Импорт модуля конфигурации
Import-Module -Name ".\automation\config\DeploymentConfig.psm1" -Force

# Получение конфигурации
if ([string]::IsNullOrEmpty($PROM_PATH)) {
    $PROM_PATH = Get-EnvironmentPath -Environment "prom"
}

if ([string]::IsNullOrEmpty($Server)) {
    $Server = Get-EnvironmentServer -Environment "prod"
}

if ([string]::IsNullOrEmpty($PROD_PATH)) {
    $PROD_PATH = Get-EnvironmentPath -Environment "prod"
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
Write-ColorOutput "🚀  ПОЛНЫЙ WORKFLOW ДЕПЛОЯ v4.8" "Cyan"
Write-ColorOutput "🚀  DEV -> PROM -> PROD" "Cyan"
Write-ColorOutput "🚀 ========================================" "Cyan"
Write-ColorOutput ""

Write-ColorOutput "📋 Параметры:" "Yellow"
Write-ColorOutput "  • Проект: $ProjectName" "White"
Write-ColorOutput "  • Исходный путь: $SourcePath" "White"
Write-ColorOutput "  • PROM путь: $PROM_PATH" "White"
Write-ColorOutput "  • Сервер: $Server" "White"
Write-ColorOutput "  • PROD путь: $PROD_PATH" "White"
Write-ColorOutput "  • Архив: $ArchivePath" "White"
Write-ColorOutput "  • Принудительно: $Force" "White"
Write-ColorOutput "  • Резервная копия: $Backup" "White"
Write-ColorOutput "  • Пропустить PROM: $SkipPROM" "White"
Write-ColorOutput "  • Пропустить PROD: $SkipPROD" "White"
Write-ColorOutput "  • Только тест: $TestOnly" "White"
Write-ColorOutput ""

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

# ========================================
# ЭТАП 1: ДЕПЛОЙ В PROM
# ========================================

if (-not $SkipPROM) {
    Write-ColorOutput ""
    Write-ColorOutput "📁 ЭТАП 1: ДЕПЛОЙ В PROM СРЕДУ" "Yellow"
    Write-ColorOutput "=================================" "Yellow"
    
    try {
        # Вызов скрипта деплоя в PROM
        $PROMArgs = @(
            "-ProjectName", $ProjectName,
            "-SourcePath", $SourcePath,
            "-PROM_PATH", $PROM_PATH,
            "-ArchivePath", $ArchivePath
        )
        
        if ($Force) { $PROMArgs += "-Force" }
        if ($Backup) { $PROMArgs += "-Backup" }
        if ($Verbose) { $PROMArgs += "-Verbose" }
        if ($Clean) { $PROMArgs += "-Clean" }
        
        Write-ColorOutput "🚀 Запуск деплоя в PROM..." "Yellow"
        & ".\deploy-prom-v4.8.ps1" @PROMArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ ЭТАП 1 ЗАВЕРШЕН: Деплой в PROM" "Green"
        } else {
            Write-ColorOutput "❌ ОШИБКА: Деплой в PROM не удался (код: $LASTEXITCODE)" "Red"
            exit 1
        }
    } catch {
        Write-ColorOutput "❌ ОШИБКА: Ошибка деплоя в PROM: $($_.Exception.Message)" "Red"
        exit 1
    }
} else {
    Write-ColorOutput "⏭️  ЭТАП 1 ПРОПУЩЕН: Деплой в PROM" "Cyan"
}

# ========================================
# ЭТАП 2: ДЕПЛОЙ В PROD
# ========================================

if (-not $SkipPROD) {
    Write-ColorOutput ""
    Write-ColorOutput "🚀 ЭТАП 2: ДЕПЛОЙ В PROD СРЕДУ" "Yellow"
    Write-ColorOutput "=================================" "Yellow"
    
    try {
        # Вызов скрипта деплоя в PROD
        $PRODArgs = @(
            "-ProjectName", $ProjectName,
            "-PROM_PATH", $PROM_PATH,
            "-Server", $Server,
            "-PROD_PATH", $PROD_PATH,
            "-ArchivePath", $ArchivePath
        )
        
        if ($Force) { $PRODArgs += "-Force" }
        if ($Backup) { $PRODArgs += "-Backup" }
        if ($Verbose) { $PRODArgs += "-Verbose" }
        if ($Clean) { $PRODArgs += "-Clean" }
        if ($TestOnly) { $PRODArgs += "-TestOnly" }
        
        Write-ColorOutput "🚀 Запуск деплоя в PROD..." "Yellow"
        & ".\deploy-prod-v4.8.ps1" @PRODArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ ЭТАП 2 ЗАВЕРШЕН: Деплой в PROD" "Green"
        } else {
            Write-ColorOutput "❌ ОШИБКА: Деплой в PROD не удался (код: $LASTEXITCODE)" "Red"
            exit 1
        }
    } catch {
        Write-ColorOutput "❌ ОШИБКА: Ошибка деплоя в PROD: $($_.Exception.Message)" "Red"
        exit 1
    }
} else {
    Write-ColorOutput "⏭️  ЭТАП 2 ПРОПУЩЕН: Деплой в PROD" "Cyan"
}

# ========================================
# ФИНАЛЬНАЯ ПРОВЕРКА
# ========================================

Write-ColorOutput ""
Write-ColorOutput "🔍 ФИНАЛЬНАЯ ПРОВЕРКА РАЗВЕРТЫВАНИЯ" "Yellow"
Write-ColorOutput "=====================================" "Yellow"

# Проверка PROM (если не пропущен)
if (-not $SkipPROM) {
    Write-ColorOutput "🔍 Проверка PROM развертывания..." "Yellow"
    $PROMProjectPath = Join-Path $PROM_PATH $ProjectName
    if (Test-Path $PROMProjectPath) {
        $PROMFiles = Get-ChildItem -Path $PROMProjectPath -Recurse -File | Measure-Object | Select-Object -ExpandProperty Count
        Write-ColorOutput "  ✅ PROM: $PROMFiles файлов в $PROMProjectPath" "Green"
    } else {
        Write-ColorOutput "  ❌ PROM: Папка не найдена" "Red"
    }
}

# Проверка PROD (если не пропущен)
if (-not $SkipPROD) {
    Write-ColorOutput "🔍 Проверка PROD развертывания..." "Yellow"
    try {
        $PRODCheck = ssh $Server "ls -la $PROD_PATH/$ProjectName | head -5" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "  ✅ PROD: Развертывание успешно" "Green"
            Write-ColorOutput "  📋 Содержимое PROD папки:" "Cyan"
            Write-ColorOutput $PRODCheck "White"
        } else {
            Write-ColorOutput "  ❌ PROD: Ошибка проверки" "Red"
        }
    } catch {
        Write-ColorOutput "  ⚠️  PROD: Не удалось проверить (ошибка SSH)" "Yellow"
    }
}

# ========================================
# СОЗДАНИЕ ОТЧЕТА
# ========================================

Write-ColorOutput "📝 Создание итогового отчета..." "Yellow"
$ReportContent = @"
# 🚀 Итоговый отчет о полном деплое v4.8

**Дата:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
**Проект:** $ProjectName
**Исходный путь:** $SourcePath

## 📊 Результаты

### PROM среда
- **Статус:** $(if(-not $SkipPROM){'✅ Развернуто'}else{'⏭️ Пропущено'})
- **Путь:** $PROM_PATH\$ProjectName
- **Файлов:** $(if(-not $SkipPROM -and (Test-Path (Join-Path $PROM_PATH $ProjectName))){(Get-ChildItem -Path (Join-Path $PROM_PATH $ProjectName) -Recurse -File | Measure-Object).Count}else{'N/A'})

### PROD среда
- **Статус:** $(if(-not $SkipPROD){'✅ Развернуто'}else{'⏭️ Пропущено'})
- **Сервер:** $Server
- **Путь:** $PROD_PATH/$ProjectName

## 🎯 Следующие шаги

1. **Проверьте PROM развертывание** (если не пропущено)
2. **Протестируйте функциональность** в PROM среде
3. **Проверьте PROD развертывание** (если не пропущено)
4. **Протестируйте функциональность** в PROD среде
5. **Настройте мониторинг** и алерты

## 📁 Архивы

- **Папка архивов:** $ArchivePath
- **PROM архив:** $(if(-not $SkipPROM){'Создан'}else{'Не создан'})
- **PROD архив:** $(if(-not $SkipPROD){'Создан'}else{'Не создан'})
"@

try {
    $ReportFile = Join-Path $ArchivePath "deploy-full-report-$ProjectName-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').md"
    $ReportContent | Out-File -FilePath $ReportFile -Encoding UTF8
    Write-ColorOutput "  ✅ Итоговый отчет создан: $ReportFile" "Green"
} catch {
    Write-ColorOutput "  ⚠️  Предупреждение: Не удалось создать итоговый отчет: $($_.Exception.Message)" "Yellow"
}

# ========================================
# ИТОГОВЫЙ ОТЧЕТ
# ========================================

Write-ColorOutput ""
Write-ColorOutput "🎉 ========================================" "Green"
Write-ColorOutput "🎉  ПОЛНЫЙ WORKFLOW ЗАВЕРШЕН УСПЕШНО!" "Green"
Write-ColorOutput "🎉 ========================================" "Green"
Write-ColorOutput ""

Write-ColorOutput "📊 РЕЗУЛЬТАТЫ:" "Cyan"
Write-ColorOutput "  • Проект: $ProjectName" "White"
Write-ColorOutput "  • PROM: $(if(-not $SkipPROM){'✅ Развернуто'}else{'⏭️ Пропущено'})" "White"
Write-ColorOutput "  • PROD: $(if(-not $SkipPROD){'✅ Развернуто'}else{'⏭️ Пропущено'})" "White"
Write-ColorOutput "  • Архивы: $ArchivePath" "White"
Write-ColorOutput ""

Write-ColorOutput "📝 СЛЕДУЮЩИЕ ШАГИ:" "Cyan"
Write-ColorOutput "  1. Проверьте развертывание в браузере" "White"
Write-ColorOutput "  2. Протестируйте функциональность" "White"
Write-ColorOutput "  3. Настройте мониторинг и алерты" "White"
Write-ColorOutput "  4. Проверьте логи и производительность" "White"
Write-ColorOutput ""

Write-ColorOutput "🎯 Проект готов к работе в $(if(-not $SkipPROD){'PROD'}else{'PROM'}) среде!" "Green"
Write-ColorOutput ""
