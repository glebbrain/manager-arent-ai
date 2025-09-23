# migrate-to-v4.8.ps1 - Автоматическая миграция проекта до v4.8
# Запускать из корня целевого проекта
param(
    [string]$SourcePath = "F:\ProjectsAI\ManagerAgentAI",
    [string]$TargetPath = ".",
    [switch]$Force = $false,
    [switch]$Backup = $true,
    [switch]$Verbose = $false
)

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

# Функция для проверки существования файла
function Test-FileExists {
    param([string]$Path)
    if (Test-Path $Path) {
        Write-ColorOutput "  ✅ Найден: $(Split-Path $Path -Leaf)" "Green"
        return $true
    } else {
        Write-ColorOutput "  ⚠️  Не найден: $(Split-Path $Path -Leaf)" "Yellow"
        return $false
    }
}

# Функция для безопасного копирования
function Copy-Safe {
    param(
        [string]$Source,
        [string]$Destination,
        [string]$Description
    )
    try {
        if (Test-Path $Source) {
            Copy-Item $Source $Destination -Recurse -Force
            Write-ColorOutput "  ✅ Скопирован: $Description" "Green"
            return $true
        } else {
            Write-ColorOutput "  ⚠️  Пропущен: $Description (файл не найден)" "Yellow"
            return $false
        }
    } catch {
        Write-ColorOutput "  ❌ Ошибка при копировании $Description : $($_.Exception.Message)" "Red"
        return $false
    }
}

# Заголовок
Write-ColorOutput "🚀 ========================================" "Cyan"
Write-ColorOutput "🚀  МИГРАЦИЯ ПРОЕКТА ДО v4.8" "Cyan"
Write-ColorOutput "🚀 ========================================" "Cyan"
Write-ColorOutput ""

# Проверка исходного пути
Write-ColorOutput "🔍 Проверка исходного пути..." "Yellow"
if (!(Test-Path $SourcePath)) {
    Write-ColorOutput "❌ ОШИБКА: Исходный путь не найден: $SourcePath" "Red"
    Write-ColorOutput "💡 Укажите правильный путь через параметр -SourcePath" "Cyan"
    exit 1
}
Write-ColorOutput "✅ Исходный путь найден: $SourcePath" "Green"

# Проверка целевого пути
Write-ColorOutput "🔍 Проверка целевого пути..." "Yellow"
if (!(Test-Path $TargetPath)) {
    Write-ColorOutput "❌ ОШИБКА: Целевой путь не найден: $TargetPath" "Red"
    exit 1
}
Write-ColorOutput "✅ Целевой путь найден: $TargetPath" "Green"

# Создание резервной копии
if ($Backup) {
    Write-ColorOutput "📦 Создание резервной копии..." "Yellow"
    $BackupPath = ".\backup-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss')"
    try {
        Copy-Item -Path "." -Destination $BackupPath -Recurse -Exclude @("backup-*", ".git", "node_modules", "dist", "build") -Force
        Write-ColorOutput "✅ Резервная копия создана: $BackupPath" "Green"
    } catch {
        Write-ColorOutput "⚠️  Предупреждение: Не удалось создать резервную копию: $($_.Exception.Message)" "Yellow"
    }
    Write-ColorOutput ""
}

# Создание структуры папок
Write-ColorOutput "📁 Создание структуры папок..." "Yellow"
$Folders = @(
    ".\.automation",
    ".\.manager", 
    ".\.manager\control-files",
    ".\.manager\Completed",
    ".\.manager\prompts",
    ".\.manager\scripts",
    ".\.manager\utils"
)

foreach ($folder in $Folders) {
    if (!(Test-Path $folder)) {
        try {
            New-Item -ItemType Directory -Path $folder -Force | Out-Null
            Write-ColorOutput "  ✅ Создана папка: $folder" "Green"
        } catch {
            Write-ColorOutput "  ❌ Ошибка создания папки $folder : $($_.Exception.Message)" "Red"
        }
    } else {
        Write-ColorOutput "  ℹ️  Папка уже существует: $folder" "Cyan"
    }
}
Write-ColorOutput ""

# Копирование основных скриптов .automation
Write-ColorOutput "📋 Копирование основных скриптов .automation..." "Yellow"
$AutomationFiles = @(
    @{File="Quick-Access-Optimized-v4.8.ps1"; Desc="Quick Access Optimized v4.8"},
    @{File="Universal-Project-Manager-Optimized-v4.8.ps1"; Desc="Universal Project Manager v4.8"},
    @{File="Performance-Optimizer-v4.8.ps1"; Desc="Performance Optimizer v4.8"},
    @{File="Maximum-Performance-Optimizer-v4.8.ps1"; Desc="Maximum Performance Optimizer v4.8"},
    @{File="Project-Analysis-Optimizer-v4.8.ps1"; Desc="Project Analysis Optimizer v4.8"},
    @{File="Next-Generation-Technologies-v4.8.ps1"; Desc="Next Generation Technologies v4.8"},
    @{File="AI-Modules-Manager-v4.0.ps1"; Desc="AI Modules Manager v4.0"},
    @{File="AI-Enhanced-Features-Manager-v3.5.ps1"; Desc="AI Enhanced Features Manager v3.5"},
    @{File="Invoke-Automation.ps1"; Desc="Invoke Automation"},
    @{File="Universal-Automation-Manager-v3.5.ps1"; Desc="Universal Automation Manager v3.5"}
)

$CopiedFiles = 0
foreach ($fileInfo in $AutomationFiles) {
    $sourceFile = "$SourcePath\.automation\$($fileInfo.File)"
    $destFile = ".\.automation\$($fileInfo.File)"
    
    if (Test-FileExists $sourceFile) {
        if (Copy-Safe $sourceFile $destFile $fileInfo.Desc) {
            $CopiedFiles++
        }
    }
}
Write-ColorOutput "📊 Скопировано файлов .automation: $CopiedFiles из $($AutomationFiles.Count)" "Cyan"
Write-ColorOutput ""

# Копирование папок .automation
Write-ColorOutput "📁 Копирование папок .automation..." "Yellow"
$AutomationFolders = @(
    @{Folder="ai"; Desc="AI модули"},
    @{Folder="quantum"; Desc="Quantum Computing модули"},
    @{Folder="blockchain"; Desc="Blockchain модули"},
    @{Folder="edge"; Desc="Edge Computing модули"},
    @{Folder="vr"; Desc="VR/AR модули"},
    @{Folder="scripts"; Desc="Скрипты и алиасы"},
    @{Folder="config"; Desc="Конфигурационные файлы"},
    @{Folder="templates"; Desc="Шаблоны"},
    @{Folder="testing"; Desc="Тестовые модули"},
    @{Folder="monitoring"; Desc="Мониторинг"}
)

$CopiedFolders = 0
foreach ($folderInfo in $AutomationFolders) {
    $sourceFolder = "$SourcePath\.automation\$($folderInfo.Folder)"
    $destFolder = ".\.automation\$($folderInfo.Folder)"
    
    if (Test-Path $sourceFolder) {
        if (Copy-Safe $sourceFolder $destFolder $folderInfo.Desc) {
            $CopiedFolders++
        }
    } else {
        Write-ColorOutput "  ℹ️  Папка не найдена: $($folderInfo.Folder)" "Cyan"
    }
}
Write-ColorOutput "📊 Скопировано папок .automation: $CopiedFolders из $($AutomationFolders.Count)" "Cyan"
Write-ColorOutput ""

# Копирование основных файлов .manager
Write-ColorOutput "📋 Копирование основных файлов .manager..." "Yellow"
$ManagerFiles = @(
    @{File="start.md"; Desc="Основной файл запуска"},
    @{File="Maximum-Manager-Optimizer-v4.8.ps1"; Desc="Maximum Manager Optimizer v4.8"},
    @{File="Universal-Project-Manager-Optimized-v4.8.ps1"; Desc="Universal Project Manager v4.8"},
    @{File="Quick-Start-Optimized-v4.8.ps1"; Desc="Quick Start Optimized v4.8"},
    @{File="README.md"; Desc="README менеджера"},
    @{File="dev.md"; Desc="Developer Guide"}
)

$CopiedManagerFiles = 0
foreach ($fileInfo in $ManagerFiles) {
    $sourceFile = "$SourcePath\.manager\$($fileInfo.File)"
    $destFile = ".\.manager\$($fileInfo.File)"
    
    if (Test-FileExists $sourceFile) {
        if (Copy-Safe $sourceFile $destFile $fileInfo.Desc) {
            $CopiedManagerFiles++
        }
    }
}
Write-ColorOutput "📊 Скопировано файлов .manager: $CopiedManagerFiles из $($ManagerFiles.Count)" "Cyan"
Write-ColorOutput ""

# Копирование control-files
Write-ColorOutput "📋 Копирование control-files..." "Yellow"
$ControlFiles = @(
    @{File="INSTRUCTIONS-v4.4.md"; Desc="Инструкции v4.4"},
    @{File="QUICK-COMMANDS-v4.4.md"; Desc="Быстрые команды v4.4"},
    @{File="REQUIREMENTS-v4.2.md"; Desc="Требования v4.2"},
    @{File="AUTOMATION-GUIDE-v4.1.md"; Desc="Руководство по автоматизации v4.1"},
    @{File="IDEA.md"; Desc="Идеи проекта"},
    @{File="TODO.md"; Desc="Задачи проекта"},
    @{File="COMPLETED.md"; Desc="Выполненные задачи"},
    @{File="ERRORS.md"; Desc="Ошибки и решения"},
    @{File="ARCHITECTURE-v3.6.md"; Desc="Архитектура v3.6"},
    @{File="NEXT-GENERATION-TECHNOLOGIES-GUIDE-v4.8.md"; Desc="Next Generation Technologies Guide v4.8"}
)

$CopiedControlFiles = 0
foreach ($fileInfo in $ControlFiles) {
    $sourceFile = "$SourcePath\.manager\control-files\$($fileInfo.File)"
    $destFile = ".\.manager\control-files\$($fileInfo.File)"
    
    if (Test-FileExists $sourceFile) {
        if (Copy-Safe $sourceFile $destFile $fileInfo.Desc) {
            $CopiedControlFiles++
        }
    }
}
Write-ColorOutput "📊 Скопировано control-files: $CopiedControlFiles из $($ControlFiles.Count)" "Cyan"
Write-ColorOutput ""

# Копирование папок .manager
Write-ColorOutput "📁 Копирование папок .manager..." "Yellow"
$ManagerFolders = @(
    @{Folder="prompts"; Desc="Промпты для AI"},
    @{Folder="scripts"; Desc="Скрипты менеджера"},
    @{Folder="utils"; Desc="Утилиты"},
    @{Folder="reports"; Desc="Отчеты"},
    @{Folder="design"; Desc="Дизайн документы"}
)

$CopiedManagerFolders = 0
foreach ($folderInfo in $ManagerFolders) {
    $sourceFolder = "$SourcePath\.manager\$($folderInfo.Folder)"
    $destFolder = ".\.manager\$($folderInfo.Folder)"
    
    if (Test-Path $sourceFolder) {
        if (Copy-Safe $sourceFolder $destFolder $folderInfo.Desc) {
            $CopiedManagerFolders++
        }
    } else {
        Write-ColorOutput "  ℹ️  Папка не найдена: $($folderInfo.Folder)" "Cyan"
    }
}
Write-ColorOutput "📊 Скопировано папок .manager: $CopiedManagerFolders из $($ManagerFolders.Count)" "Cyan"
Write-ColorOutput ""

# Копирование cursor.json
Write-ColorOutput "📋 Копирование cursor.json..." "Yellow"
$CursorSource = "$SourcePath\cursor.json"
$CursorDest = ".\cursor.json"

if (Test-FileExists $CursorSource) {
    if (Copy-Safe $CursorSource $CursorDest "Cursor Configuration v6.8") {
        Write-ColorOutput "✅ cursor.json успешно скопирован" "Green"
    }
} else {
    Write-ColorOutput "⚠️  cursor.json не найден в исходном проекте" "Yellow"
}
Write-ColorOutput ""

# Создание README.md для миграции
Write-ColorOutput "📝 Создание README для миграции..." "Yellow"
$ReadmeContent = @"
# 🚀 Проект обновлен до v4.8

## ✅ Миграция завершена успешно

**Дата миграции:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
**Исходный проект:** $SourcePath
**Версия:** v4.8.0

## 🎯 Следующие шаги

1. **Загрузите алиасы:**
   ```powershell
   . .\.automation\scripts\New-Aliases-v4.8.ps1
   ```

2. **Проверьте систему:**
   ```powershell
   mpo -Action test
   mmo -Action test
   qai -Action test
   ```

3. **Оптимизируйте производительность:**
   ```powershell
   mpo -Action optimize -AI -Quantum -Verbose
   ```

## 📊 Статистика миграции

- **Файлы .automation:** $CopiedFiles из $($AutomationFiles.Count)
- **Папки .automation:** $CopiedFolders из $($AutomationFolders.Count)
- **Файлы .manager:** $CopiedManagerFiles из $($ManagerFiles.Count)
- **Control-files:** $CopiedControlFiles из $($ControlFiles.Count)
- **Папки .manager:** $CopiedManagerFolders из $($ManagerFolders.Count)

## 🔧 Доступные команды v4.8

- `mpo` - Maximum Performance Optimizer v4.8
- `mmo` - Maximum Manager Optimizer v4.8
- `qai` - Quick Access AI v4.8
- `qaq` - Quick Access Quantum v4.8
- `qap` - Quick Access Performance v4.8
- `qao` - Quick Access Optimized v4.8
- `umo` - Universal Manager Optimized v4.8

## 📞 Поддержка

При возникновении проблем обратитесь к документации в `.manager\control-files\` или запустите:
```powershell
pwsh -File .\.automation\Maximum-Performance-Optimizer-v4.8.ps1 -Action help
```
"@

try {
    $ReadmeContent | Out-File -FilePath ".\MIGRATION-README.md" -Encoding UTF8
    Write-ColorOutput "✅ Создан MIGRATION-README.md" "Green"
} catch {
    Write-ColorOutput "⚠️  Не удалось создать MIGRATION-README.md: $($_.Exception.Message)" "Yellow"
}
Write-ColorOutput ""

# Финальный отчет
Write-ColorOutput "🎉 ========================================" "Green"
Write-ColorOutput "🎉  МИГРАЦИЯ ЗАВЕРШЕНА УСПЕШНО!" "Green"
Write-ColorOutput "🎉 ========================================" "Green"
Write-ColorOutput ""
Write-ColorOutput "📊 ИТОГОВАЯ СТАТИСТИКА:" "Cyan"
Write-ColorOutput "  • Файлы .automation: $CopiedFiles из $($AutomationFiles.Count)" "White"
Write-ColorOutput "  • Папки .automation: $CopiedFolders из $($AutomationFolders.Count)" "White"
Write-ColorOutput "  • Файлы .manager: $CopiedManagerFiles из $($ManagerFiles.Count)" "White"
Write-ColorOutput "  • Control-files: $CopiedControlFiles из $($ControlFiles.Count)" "White"
Write-ColorOutput "  • Папки .manager: $CopiedManagerFolders из $($ManagerFolders.Count)" "White"
Write-ColorOutput ""

Write-ColorOutput "📝 СЛЕДУЮЩИЕ ШАГИ:" "Cyan"
Write-ColorOutput "  1. Запустите: . .\.automation\scripts\New-Aliases-v4.8.ps1" "White"
Write-ColorOutput "  2. Проверьте: mpo -Action test" "White"
Write-ColorOutput "  3. Оптимизируйте: mpo -Action optimize -AI -Quantum" "White"
Write-ColorOutput "  4. Прочитайте: .\MIGRATION-README.md" "White"
Write-ColorOutput ""

Write-ColorOutput "🚀 Проект готов к работе с v4.8!" "Green"
Write-ColorOutput ""

# Проверка критических файлов
Write-ColorOutput "🔍 Проверка критических файлов..." "Yellow"
$CriticalFiles = @(
    ".\.automation\Maximum-Performance-Optimizer-v4.8.ps1",
    ".\.manager\start.md",
    ".\.manager\control-files\INSTRUCTIONS-v4.4.md",
    ".\cursor.json"
)

$AllCriticalFilesExist = $true
foreach ($file in $CriticalFiles) {
    if (Test-Path $file) {
        Write-ColorOutput "  ✅ $file" "Green"
    } else {
        Write-ColorOutput "  ❌ $file" "Red"
        $AllCriticalFilesExist = $false
    }
}

if ($AllCriticalFilesExist) {
    Write-ColorOutput "✅ Все критические файлы на месте!" "Green"
} else {
    Write-ColorOutput "⚠️  Некоторые критические файлы отсутствуют. Проверьте исходный проект." "Yellow"
}

Write-ColorOutput ""
Write-ColorOutput "🎯 Миграция завершена! Удачной работы с v4.8!" "Cyan"
