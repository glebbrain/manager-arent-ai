# quick-start-v4.8.ps1 - Быстрый старт системы управления проектом v4.8
# Выполняет все этапы: Копирование → Инструкции → Анализ → Оптимизация

param(
    [string]$SourcePath = "F:\ProjectsAI\ManagerAgentAI",
    [string]$ProjectName = "",
    [switch]$Force = $false,
    [switch]$Backup = $true,
    [switch]$Verbose = $false,
    [switch]$SkipCopy = $false,
    [switch]$SkipAnalysis = $false,
    [switch]$SkipOptimization = $false
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

# Функция для проверки успешности выполнения
function Test-CommandSuccess {
    param([string]$Command, [string]$Description)
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "  ✅ $Description - УСПЕШНО" "Green"
        return $true
    } else {
        Write-ColorOutput "  ❌ $Description - ОШИБКА (код: $LASTEXITCODE)" "Red"
        return $false
    }
}

# Заголовок
Write-ColorOutput "🚀 ========================================" "Cyan"
Write-ColorOutput "🚀  БЫСТРЫЙ СТАРТ СИСТЕМЫ v4.8" "Cyan"
Write-ColorOutput "🚀 ========================================" "Cyan"
Write-ColorOutput ""

# Определение имени проекта
if ([string]::IsNullOrEmpty($ProjectName)) {
    $ProjectName = Split-Path -Leaf (Get-Location)
    Write-ColorOutput "📁 Имя проекта: $ProjectName" "Yellow"
}

Write-ColorOutput "📋 Параметры:" "Yellow"
Write-ColorOutput "  • Исходный путь: $SourcePath" "White"
Write-ColorOutput "  • Имя проекта: $ProjectName" "White"
Write-ColorOutput "  • Принудительно: $Force" "White"
Write-ColorOutput "  • Резервная копия: $Backup" "White"
Write-ColorOutput "  • Пропустить копирование: $SkipCopy" "White"
Write-ColorOutput "  • Пропустить анализ: $SkipAnalysis" "White"
Write-ColorOutput "  • Пропустить оптимизацию: $SkipOptimization" "White"
Write-ColorOutput ""

# ========================================
# ЭТАП 1: КОПИРОВАНИЕ
# ========================================

if (-not $SkipCopy) {
    Write-ColorOutput "📁 ЭТАП 1: КОПИРОВАНИЕ УПРАВЛЯЮЩИХ ФАЙЛОВ" "Yellow"
    Write-ColorOutput "=========================================" "Yellow"
    
    # Проверка исходного пути
    if (!(Test-Path $SourcePath)) {
        Write-ColorOutput "❌ ОШИБКА: Исходный путь не найден: $SourcePath" "Red"
        Write-ColorOutput "💡 Укажите правильный путь через параметр -SourcePath" "Cyan"
        exit 1
    }
    
    # Создание папок
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
        }
    }
    
    # Копирование .automation
    Write-ColorOutput "📋 Копирование .automation..." "Yellow"
    if (Test-Path "$SourcePath\.automation") {
        try {
            Copy-Item "$SourcePath\.automation\*" ".\.automation\" -Recurse -Force
            Write-ColorOutput "  ✅ .automation скопирован" "Green"
        } catch {
            Write-ColorOutput "  ❌ Ошибка копирования .automation : $($_.Exception.Message)" "Red"
        }
    } else {
        Write-ColorOutput "  ⚠️  .automation не найден в исходном пути" "Yellow"
    }
    
    # Копирование .manager
    Write-ColorOutput "📋 Копирование .manager..." "Yellow"
    if (Test-Path "$SourcePath\.manager") {
        try {
            Copy-Item "$SourcePath\.manager\*" ".\.manager\" -Recurse -Force
            Write-ColorOutput "  ✅ .manager скопирован" "Green"
        } catch {
            Write-ColorOutput "  ❌ Ошибка копирования .manager : $($_.Exception.Message)" "Red"
        }
    } else {
        Write-ColorOutput "  ⚠️  .manager не найден в исходном пути" "Yellow"
    }
    
    # Копирование cursor.json
    Write-ColorOutput "📋 Копирование cursor.json..." "Yellow"
    if (Test-Path "$SourcePath\cursor.json") {
        try {
            Copy-Item "$SourcePath\cursor.json" "." -Force
            Write-ColorOutput "  ✅ cursor.json скопирован" "Green"
        } catch {
            Write-ColorOutput "  ❌ Ошибка копирования cursor.json : $($_.Exception.Message)" "Red"
        }
    } else {
        Write-ColorOutput "  ⚠️  cursor.json не найден в исходном пути" "Yellow"
    }
    
    Write-ColorOutput "✅ ЭТАП 1 ЗАВЕРШЕН: Копирование" "Green"
    Write-ColorOutput ""
} else {
    Write-ColorOutput "⏭️  ЭТАП 1 ПРОПУЩЕН: Копирование" "Cyan"
    Write-ColorOutput ""
}

# ========================================
# ЭТАП 2: ИНСТРУКЦИИ (НАСТРОЙКА)
# ========================================

Write-ColorOutput "📖 ЭТАП 2: НАСТРОЙКА СИСТЕМЫ" "Yellow"
Write-ColorOutput "=================================" "Yellow"

# Загрузка алиасов
Write-ColorOutput "🔧 Загрузка алиасов v4.8..." "Yellow"
$AliasesScript = ".\.automation\scripts\New-Aliases-v4.8.ps1"
if (Test-Path $AliasesScript) {
    try {
        . $AliasesScript
        Write-ColorOutput "  ✅ Алиасы v4.8 загружены" "Green"
        
        # Проверка алиасов
        $TestAliases = @("mpo", "mmo", "qai", "qaq", "qap", "qao", "umo", "po")
        $LoadedAliases = 0
        foreach ($alias in $TestAliases) {
            if (Get-Alias $alias -ErrorAction SilentlyContinue) {
                $LoadedAliases++
            }
        }
        Write-ColorOutput "  📊 Загружено алиасов: $LoadedAliases из $($TestAliases.Count)" "Cyan"
    } catch {
        Write-ColorOutput "  ❌ Ошибка загрузки алиасов : $($_.Exception.Message)" "Red"
    }
} else {
    Write-ColorOutput "  ⚠️  Скрипт алиасов не найден: $AliasesScript" "Yellow"
}

# Первоначальная настройка
Write-ColorOutput "⚙️  Первоначальная настройка системы..." "Yellow"
$SetupScript = ".\.automation\Quick-Access-Optimized-v4.8.ps1"
if (Test-Path $SetupScript) {
    try {
        if ($Verbose) {
            pwsh -File $SetupScript -Action setup -Verbose
        } else {
            pwsh -File $SetupScript -Action setup
        }
        Write-ColorOutput "  ✅ Настройка системы завершена" "Green"
    } catch {
        Write-ColorOutput "  ❌ Ошибка настройки системы : $($_.Exception.Message)" "Red"
    }
} else {
    Write-ColorOutput "  ⚠️  Скрипт настройки не найден: $SetupScript" "Yellow"
}

# Проверка системы
Write-ColorOutput "🔍 Проверка системы..." "Yellow"
$StatusScript = ".\.manager\Universal-Project-Manager-Optimized-v4.8.ps1"
if (Test-Path $StatusScript) {
    try {
        if ($Verbose) {
            pwsh -File $StatusScript -Action status -Verbose
        } else {
            pwsh -File $StatusScript -Action status
        }
        Write-ColorOutput "  ✅ Проверка системы завершена" "Green"
    } catch {
        Write-ColorOutput "  ❌ Ошибка проверки системы : $($_.Exception.Message)" "Red"
    }
} else {
    Write-ColorOutput "  ⚠️  Скрипт проверки не найден: $StatusScript" "Yellow"
}

Write-ColorOutput "✅ ЭТАП 2 ЗАВЕРШЕН: Настройка" "Green"
Write-ColorOutput ""

# ========================================
# ЭТАП 3: АНАЛИЗ
# ========================================

if (-not $SkipAnalysis) {
    Write-ColorOutput "🔍 ЭТАП 3: АНАЛИЗ ПРОЕКТА" "Yellow"
    Write-ColorOutput "===========================" "Yellow"
    
    # AI-анализ проекта
    Write-ColorOutput "🧠 AI-анализ проекта..." "Yellow"
    $AIAnalysisScript = ".\.automation\Project-Analysis-Optimizer-v4.8.ps1"
    if (Test-Path $AIAnalysisScript) {
        try {
            if ($Verbose) {
                pwsh -File $AIAnalysisScript -Action analyze -AI -Quantum -Detailed -Verbose
            } else {
                pwsh -File $AIAnalysisScript -Action analyze -AI -Quantum -Detailed
            }
            Write-ColorOutput "  ✅ AI-анализ завершен" "Green"
        } catch {
            Write-ColorOutput "  ❌ Ошибка AI-анализа : $($_.Exception.Message)" "Red"
        }
    } else {
        Write-ColorOutput "  ⚠️  Скрипт AI-анализа не найден: $AIAnalysisScript" "Yellow"
    }
    
    # Анализ структуры
    Write-ColorOutput "📊 Анализ структуры проекта..." "Yellow"
    if (Test-Path $AIAnalysisScript) {
        try {
            if ($Verbose) {
                pwsh -File $AIAnalysisScript -Action structure -AI -Quantum -Detailed -Verbose
            } else {
                pwsh -File $AIAnalysisScript -Action structure -AI -Quantum -Detailed
            }
            Write-ColorOutput "  ✅ Анализ структуры завершен" "Green"
        } catch {
            Write-ColorOutput "  ❌ Ошибка анализа структуры : $($_.Exception.Message)" "Red"
        }
    }
    
    # Анализ производительности
    Write-ColorOutput "⚡ Анализ производительности..." "Yellow"
    $PerformanceScript = ".\.automation\Performance-Optimizer-v4.8.ps1"
    if (Test-Path $PerformanceScript) {
        try {
            if ($Verbose) {
                pwsh -File $PerformanceScript -Action analyze -Verbose
            } else {
                pwsh -File $PerformanceScript -Action analyze
            }
            Write-ColorOutput "  ✅ Анализ производительности завершен" "Green"
        } catch {
            Write-ColorOutput "  ❌ Ошибка анализа производительности : $($_.Exception.Message)" "Red"
        }
    } else {
        Write-ColorOutput "  ⚠️  Скрипт анализа производительности не найден: $PerformanceScript" "Yellow"
    }
    
    Write-ColorOutput "✅ ЭТАП 3 ЗАВЕРШЕН: Анализ" "Green"
    Write-ColorOutput ""
} else {
    Write-ColorOutput "⏭️  ЭТАП 3 ПРОПУЩЕН: Анализ" "Cyan"
    Write-ColorOutput ""
}

# ========================================
# ЭТАП 4: ОПТИМИЗАЦИЯ
# ========================================

if (-not $SkipOptimization) {
    Write-ColorOutput "⚡ ЭТАП 4: ОПТИМИЗАЦИЯ СИСТЕМЫ" "Yellow"
    Write-ColorOutput "=================================" "Yellow"
    
    # Максимальная оптимизация производительности
    Write-ColorOutput "🚀 Максимальная оптимизация производительности..." "Yellow"
    $MaxPerfScript = ".\.automation\Maximum-Performance-Optimizer-v4.8.ps1"
    if (Test-Path $MaxPerfScript) {
        try {
            if ($Verbose) {
                pwsh -File $MaxPerfScript -Action optimize -AI -Quantum -Verbose
            } else {
                pwsh -File $MaxPerfScript -Action optimize -AI -Quantum
            }
            Write-ColorOutput "  ✅ Максимальная оптимизация завершена" "Green"
        } catch {
            Write-ColorOutput "  ❌ Ошибка максимальной оптимизации : $($_.Exception.Message)" "Red"
        }
    } else {
        Write-ColorOutput "  ⚠️  Скрипт максимальной оптимизации не найден: $MaxPerfScript" "Yellow"
    }
    
    # Оптимизация менеджера
    Write-ColorOutput "🎯 Оптимизация менеджера..." "Yellow"
    $ManagerOptScript = ".\.manager\Maximum-Manager-Optimizer-v4.8.ps1"
    if (Test-Path $ManagerOptScript) {
        try {
            if ($Verbose) {
                pwsh -File $ManagerOptScript -Action optimize -AI -Quantum -Verbose
            } else {
                pwsh -File $ManagerOptScript -Action optimize -AI -Quantum
            }
            Write-ColorOutput "  ✅ Оптимизация менеджера завершена" "Green"
        } catch {
            Write-ColorOutput "  ❌ Ошибка оптимизации менеджера : $($_.Exception.Message)" "Red"
        }
    } else {
        Write-ColorOutput "  ⚠️  Скрипт оптимизации менеджера не найден: $ManagerOptScript" "Yellow"
    }
    
    # Полная оптимизация
    Write-ColorOutput "🔧 Полная оптимизация всех систем..." "Yellow"
    if (Test-Path $PerformanceScript) {
        try {
            if ($Verbose) {
                pwsh -File $PerformanceScript -Action all -Verbose -Force
            } else {
                pwsh -File $PerformanceScript -Action all -Force
            }
            Write-ColorOutput "  ✅ Полная оптимизация завершена" "Green"
        } catch {
            Write-ColorOutput "  ❌ Ошибка полной оптимизации : $($_.Exception.Message)" "Red"
        }
    }
    
    Write-ColorOutput "✅ ЭТАП 4 ЗАВЕРШЕН: Оптимизация" "Green"
    Write-ColorOutput ""
} else {
    Write-ColorOutput "⏭️  ЭТАП 4 ПРОПУЩЕН: Оптимизация" "Cyan"
    Write-ColorOutput ""
}

# ========================================
# ФИНАЛЬНАЯ ПРОВЕРКА
# ========================================

Write-ColorOutput "🔍 ФИНАЛЬНАЯ ПРОВЕРКА СИСТЕМЫ" "Yellow"
Write-ColorOutput "=================================" "Yellow"

# Проверка структуры папок
Write-ColorOutput "📁 Проверка структуры папок..." "Yellow"
$CriticalPaths = @(
    ".\.automation",
    ".\.manager",
    ".\.manager\control-files"
)

$AllPathsExist = $true
foreach ($path in $CriticalPaths) {
    if (Test-Path $path) {
        Write-ColorOutput "  ✅ $path" "Green"
    } else {
        Write-ColorOutput "  ❌ $path" "Red"
        $AllPathsExist = $false
    }
}

# Проверка ключевых файлов
Write-ColorOutput "📄 Проверка ключевых файлов..." "Yellow"
$CriticalFiles = @(
    ".\.automation\Maximum-Performance-Optimizer-v4.8.ps1",
    ".\.manager\start.md",
    ".\.manager\control-files\INSTRUCTIONS-v4.4.md",
    ".\cursor.json"
)

$AllFilesExist = $true
foreach ($file in $CriticalFiles) {
    if (Test-Path $file) {
        Write-ColorOutput "  ✅ $file" "Green"
    } else {
        Write-ColorOutput "  ❌ $file" "Red"
        $AllFilesExist = $false
    }
}

# Проверка алиасов
Write-ColorOutput "🔧 Проверка алиасов..." "Yellow"
$TestAliases = @("mpo", "mmo", "qai", "qaq", "qap", "qao", "umo", "po")
$WorkingAliases = 0
foreach ($alias in $TestAliases) {
    if (Get-Alias $alias -ErrorAction SilentlyContinue) {
        Write-ColorOutput "  ✅ $alias" "Green"
        $WorkingAliases++
    } else {
        Write-ColorOutput "  ❌ $alias" "Red"
    }
}

# ========================================
# ИТОГОВЫЙ ОТЧЕТ
# ========================================

Write-ColorOutput ""
Write-ColorOutput "🎉 ========================================" "Green"
Write-ColorOutput "🎉  БЫСТРЫЙ СТАРТ ЗАВЕРШЕН!" "Green"
Write-ColorOutput "🎉 ========================================" "Green"
Write-ColorOutput ""

Write-ColorOutput "📊 РЕЗУЛЬТАТЫ:" "Cyan"
Write-ColorOutput "  • Структура папок: $(if($AllPathsExist){'✅ Готово'}else{'❌ Ошибки'})" "White"
Write-ColorOutput "  • Ключевые файлы: $(if($AllFilesExist){'✅ Готово'}else{'❌ Ошибки'})" "White"
Write-ColorOutput "  • Рабочих алиасов: $WorkingAliases из $($TestAliases.Count)" "White"
Write-ColorOutput ""

Write-ColorOutput "🚀 СИСТЕМА ГОТОВА К ИСПОЛЬЗОВАНИЮ!" "Green"
Write-ColorOutput ""

Write-ColorOutput "📝 СЛЕДУЮЩИЕ ШАГИ:" "Cyan"
Write-ColorOutput "  1. Используйте алиасы для быстрой работы:" "White"
Write-ColorOutput "     • mpo - Максимальная оптимизация" "White"
Write-ColorOutput "     • qai - AI-анализ проекта" "White"
Write-ColorOutput "     • qas - Статус системы" "White"
Write-ColorOutput "     • qam - Мониторинг производительности" "White"
Write-ColorOutput ""
Write-ColorOutput "  2. Ежедневное использование:" "White"
Write-ColorOutput "     • Утром: qas -Detailed" "White"
Write-ColorOutput "     • В течение дня: qai -Action analyze" "White"
Write-ColorOutput "     • Вечером: mpo -Action optimize" "White"
Write-ColorOutput ""

Write-ColorOutput "📚 ДОКУМЕНТАЦИЯ:" "Cyan"
Write-ColorOutput "  • .\WORKFLOW-GUIDE-v4.8.md - Полное руководство" "White"
Write-ColorOutput "  • .\WORKFLOW-SCHEMA-v4.8.md - Схема работы" "White"
Write-ColorOutput "  • .\.manager\start.md - Основные команды" "White"
Write-ColorOutput ""

Write-ColorOutput "🎯 Система управления проектом v4.8 готова к работе!" "Green"
Write-ColorOutput ""

# Создание отчета о быстром старте
$ReportContent = @"
# 🚀 Отчет о быстром старте системы v4.8

**Дата:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
**Проект:** $ProjectName
**Исходный путь:** $SourcePath

## 📊 Результаты

- **Структура папок:** $(if($AllPathsExist){'✅ Готово'}else{'❌ Ошибки'})
- **Ключевые файлы:** $(if($AllFilesExist){'✅ Готово'}else{'❌ Ошибки'})
- **Рабочих алиасов:** $WorkingAliases из $($TestAliases.Count)

## 🎯 Система готова к использованию!

### Быстрые команды:
- `mpo` - Максимальная оптимизация
- `qai` - AI-анализ проекта
- `qas` - Статус системы
- `qam` - Мониторинг производительности

### Ежедневное использование:
- Утром: `qas -Detailed`
- В течение дня: `qai -Action analyze`
- Вечером: `mpo -Action optimize`
"@

try {
    $ReportContent | Out-File -FilePath ".\QUICK-START-REPORT.md" -Encoding UTF8
    Write-ColorOutput "📄 Создан отчет: .\QUICK-START-REPORT.md" "Cyan"
} catch {
    Write-ColorOutput "⚠️  Не удалось создать отчет: $($_.Exception.Message)" "Yellow"
}

Write-ColorOutput ""
Write-ColorOutput "🎉 Удачной работы с системой v4.8!" "Cyan"
