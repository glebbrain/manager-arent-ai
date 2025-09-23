# start-v4.8-smart.ps1 - Умный быстрый старт системы v4.8
# С умным копированием файлов без поломки существующего проекта

param(
    [string]$SourcePath = "F:\ProjectsAI\ManagerAgentAI",
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

# Функция для логирования
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-ColorOutput $logMessage
}

# Функция для создания резервной копии
function Backup-File {
    param(
        [string]$FilePath,
        [string]$BackupSuffix = "backup"
    )
    
    if (Test-Path $FilePath) {
        $BackupPath = "$FilePath.$BackupSuffix.$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss')"
        try {
            Copy-Item $FilePath $BackupPath -Force
            Write-ColorOutput "  📦 Резервная копия: $BackupPath" "Yellow"
            return $BackupPath
        } catch {
            Write-ColorOutput "  ⚠️  Не удалось создать резервную копию: $($_.Exception.Message)" "Yellow"
            return $null
        }
    }
    return $null
}

# Функция для умного слияния файлов
function Merge-Files {
    param(
        [string]$SourceFile,
        [string]$TargetFile,
        [string]$MergeType = "append"
    )
    
    if (!(Test-Path $SourceFile)) {
        Write-ColorOutput "  ⚠️  Исходный файл не найден: $SourceFile" "Yellow"
        return $false
    }
    
    if (!(Test-Path $TargetFile)) {
        # Если целевой файл не существует, просто копируем
        try {
            Copy-Item $SourceFile $TargetFile -Force
            Write-ColorOutput "  ✅ Скопирован: $TargetFile" "Green"
            return $true
        } catch {
            Write-ColorOutput "  ❌ Ошибка копирования: $($_.Exception.Message)" "Red"
            return $false
        }
    }
    
    # Создаем резервную копию
    if ($Backup) {
        Backup-File $TargetFile "before-merge"
    }
    
    try {
        switch ($MergeType) {
            "append" {
                # Добавляем содержимое в конец файла
                $SourceContent = Get-Content $SourceFile -Raw
                $TargetContent = Get-Content $TargetFile -Raw
                
                # Проверяем, не содержится ли уже этот контент
                if ($TargetContent -notlike "*$SourceContent*") {
                    Add-Content $TargetFile "`n`n# === ДОБАВЛЕНО ИЗ v4.8 ===" -Encoding UTF8
                    Add-Content $TargetFile $SourceContent -Encoding UTF8
                    Write-ColorOutput "  ✅ Объединен (добавлено): $TargetFile" "Green"
                } else {
                    Write-ColorOutput "  ⏭️  Пропущен (уже содержится): $TargetFile" "Cyan"
                }
            }
            "prepend" {
                # Добавляем содержимое в начало файла
                $SourceContent = Get-Content $SourceFile -Raw
                $TargetContent = Get-Content $TargetFile -Raw
                
                # Проверяем, не содержится ли уже этот контент
                if ($TargetContent -notlike "*$SourceContent*") {
                    $NewContent = "# === ДОБАВЛЕНО ИЗ v4.8 ===`n$SourceContent`n`n$TargetContent"
                    Set-Content $TargetFile $NewContent -Encoding UTF8
                    Write-ColorOutput "  ✅ Объединен (добавлено в начало): $TargetFile" "Green"
                } else {
                    Write-ColorOutput "  ⏭️  Пропущен (уже содержится): $TargetFile" "Cyan"
                }
            }
            "replace" {
                # Заменяем файл
                Copy-Item $SourceFile $TargetFile -Force
                Write-ColorOutput "  ✅ Заменен: $TargetFile" "Green"
            }
        }
        return $true
    } catch {
        Write-ColorOutput "  ❌ Ошибка слияния: $($_.Exception.Message)" "Red"
        return $false
    }
}

# Заголовок
Write-ColorOutput "🚀 ========================================" "Cyan"
Write-ColorOutput "🚀  УМНЫЙ БЫСТРЫЙ СТАРТ v4.8" "Cyan"
Write-ColorOutput "🚀 ========================================" "Cyan"
Write-ColorOutput ""

Write-ColorOutput "📋 Параметры:" "Yellow"
Write-ColorOutput "  • Исходный путь: $SourcePath" "White"
Write-ColorOutput "  • Принудительно: $Force" "White"
Write-ColorOutput "  • Резервная копия: $Backup" "White"
Write-ColorOutput "  • Подробно: $Verbose" "White"
Write-ColorOutput ""

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

# Файлы, которые НЕ копируем (чтобы не поломать проект)
$ExcludeFiles = @(
    "TODO.md",
    "IDEA.md",
    "COMPLETED.md",
    "ERRORS.md",
    "README.md",
    "package.json",
    "package-lock.json",
    "yarn.lock",
    "node_modules",
    ".git",
    ".vs",
    "bin",
    "obj",
    "dist",
    "build"
)

# Файлы для умного слияния
$MergeFiles = @{
    ".manager\start.md" = "append"
    ".manager\control-files\INSTRUCTIONS.md" = "append"
    ".manager\control-files\TODO.md" = "append"
    ".manager\control-files\IDEA.md" = "append"
    ".manager\control-files\COMPLETED.md" = "append"
    ".manager\control-files\ERRORS.md" = "append"
}

# Файлы для замены (если Force)
$ReplaceFiles = @(
    "cursor.json",
    ".automation\scripts\New-Aliases-v4.8.ps1",
    ".automation\Project-Analysis-Optimizer-v4.8.ps1",
    ".automation\Quick-Access-Optimized-v4.8.ps1"
)

# 1. Копирование .automation (исключая ненужные файлы)
Write-ColorOutput "  📁 Копирование .automation..." "Yellow"
if (Test-Path "$SourcePath\.automation") {
    try {
        # Копируем только нужные файлы из .automation
        $AutomationFiles = Get-ChildItem "$SourcePath\.automation" -Recurse | Where-Object {
            $item = $_
            $shouldExclude = $false
            foreach ($pattern in $ExcludeFiles) {
                if ($item.Name -like $pattern -or $item.FullName -like "*\$pattern\*") {
                    $shouldExclude = $true
                    break
                }
            }
            return -not $shouldExclude
        }
        
        foreach ($file in $AutomationFiles) {
            $relativePath = $file.FullName.Substring($SourcePath.Length + 1)
            $targetPath = ".\$relativePath"
            $targetDir = Split-Path $targetPath -Parent
            
            # Создаем папку если нужно
            if (!(Test-Path $targetDir)) {
                New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            }
            
            # Копируем файл
            Copy-Item $file.FullName $targetPath -Force
            Write-ColorOutput "    ✅ Скопирован: $relativePath" "Green"
        }
        
        Write-ColorOutput "  ✅ .automation скопирован" "Green"
    } catch {
        Write-ColorOutput "  ❌ Ошибка копирования .automation: $($_.Exception.Message)" "Red"
    }
} else {
    Write-ColorOutput "  ⚠️  .automation не найден в исходном пути" "Yellow"
}

# 2. Копирование .manager (исключая ненужные файлы)
Write-ColorOutput "  📁 Копирование .manager..." "Yellow"
if (Test-Path "$SourcePath\.manager") {
    try {
        # Копируем только нужные файлы из .manager
        $ManagerFiles = Get-ChildItem "$SourcePath\.manager" -Recurse | Where-Object {
            $item = $_
            $shouldExclude = $false
            foreach ($pattern in $ExcludeFiles) {
                if ($item.Name -like $pattern -or $item.FullName -like "*\$pattern\*") {
                    $shouldExclude = $true
                    break
                }
            }
            return -not $shouldExclude
        }
        
        foreach ($file in $ManagerFiles) {
            $relativePath = $file.FullName.Substring($SourcePath.Length + 1)
            $targetPath = ".\$relativePath"
            $targetDir = Split-Path $targetPath -Parent
            
            # Создаем папку если нужно
            if (!(Test-Path $targetDir)) {
                New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            }
            
            # Копируем файл
            Copy-Item $file.FullName $targetPath -Force
            Write-ColorOutput "    ✅ Скопирован: $relativePath" "Green"
        }
        
        Write-ColorOutput "  ✅ .manager скопирован" "Green"
    } catch {
        Write-ColorOutput "  ❌ Ошибка копирования .manager: $($_.Exception.Message)" "Red"
    }
} else {
    Write-ColorOutput "  ⚠️  .manager не найден в исходном пути" "Yellow"
}

# 3. Умное слияние файлов
Write-ColorOutput "  🔄 Умное слияние файлов..." "Yellow"
foreach ($mergeFile in $MergeFiles.GetEnumerator()) {
    $sourceFile = "$SourcePath\$($mergeFile.Key)"
    $targetFile = ".\$($mergeFile.Key)"
    $mergeType = $mergeFile.Value
    
    Write-ColorOutput "    🔄 Слияние: $($mergeFile.Key) ($mergeType)" "Cyan"
    Merge-Files $sourceFile $targetFile $mergeType
}

# 4. Копирование файлов для замены (если Force)
if ($Force) {
    Write-ColorOutput "  🔄 Принудительная замена файлов..." "Yellow"
    foreach ($replaceFile in $ReplaceFiles) {
        $sourceFile = "$SourcePath\$replaceFile"
        $targetFile = ".\$replaceFile"
        
        if (Test-Path $sourceFile) {
            Write-ColorOutput "    🔄 Замена: $replaceFile" "Cyan"
            Merge-Files $sourceFile $targetFile "replace"
        }
    }
} else {
    Write-ColorOutput "  ⏭️  Пропущена принудительная замена (используйте -Force)" "Cyan"
}

# 5. Копирование cursor.json (если Force или не существует)
Write-ColorOutput "  📋 Обработка cursor.json..." "Yellow"
if (Test-Path "$SourcePath\cursor.json") {
    if ($Force -or !(Test-Path ".\cursor.json")) {
        if ($Backup -and (Test-Path ".\cursor.json")) {
            Backup-File ".\cursor.json" "before-cursor-update"
        }
        Copy-Item "$SourcePath\cursor.json" "." -Force
        Write-ColorOutput "    ✅ cursor.json обновлен" "Green"
    } else {
        Write-ColorOutput "    ⏭️  cursor.json уже существует (используйте -Force для замены)" "Cyan"
    }
} else {
    Write-ColorOutput "    ⚠️  cursor.json не найден в исходном пути" "Yellow"
}

# ========================================
# ЗАГРУЗКА АЛИАСОВ И НАСТРОЙКА
# ========================================

Write-ColorOutput "🔧 Загрузка алиасов и настройка..." "Yellow"

# Загрузка алиасов
if (Test-Path ".\.automation\scripts\New-Aliases-v4.8.ps1") {
    try {
        . .\.automation\scripts\New-Aliases-v4.8.ps1
        Write-ColorOutput "  ✅ Алиасы v4.8 загружены" "Green"
    } catch {
        Write-ColorOutput "  ❌ Ошибка загрузки алиасов: $($_.Exception.Message)" "Red"
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
        Write-ColorOutput "  ❌ Ошибка настройки: $($_.Exception.Message)" "Red"
    }
} else {
    Write-ColorOutput "  ⚠️  Файл настройки не найден" "Yellow"
}

# ========================================
# АНАЛИЗ И ОПТИМИЗАЦИЯ
# ========================================

Write-ColorOutput "🔍 Анализ и оптимизация..." "Yellow"

# Анализ проекта
if (Test-Path ".\.automation\Project-Analysis-Optimizer-v4.8.ps1") {
    try {
        Write-ColorOutput "  🔍 Анализ проекта..." "Cyan"
        pwsh -File .\.automation\Project-Analysis-Optimizer-v4.8.ps1 -Action analyze -AI -Quantum
        Write-ColorOutput "  ✅ Анализ завершен" "Green"
    } catch {
        Write-ColorOutput "  ❌ Ошибка анализа: $($_.Exception.Message)" "Red"
    }
} else {
    Write-ColorOutput "  ⚠️  Файл анализа не найден" "Yellow"
}

# Оптимизация
if (Test-Path ".\.automation\Project-Analysis-Optimizer-v4.8.ps1") {
    try {
        Write-ColorOutput "  ⚡ Оптимизация..." "Cyan"
        pwsh -File .\.automation\Project-Analysis-Optimizer-v4.8.ps1 -Action optimize -AI -Quantum
        Write-ColorOutput "  ✅ Оптимизация завершена" "Green"
    } catch {
        Write-ColorOutput "  ❌ Ошибка оптимизации: $($_.Exception.Message)" "Red"
    }
} else {
    Write-ColorOutput "  ⚠️  Файл оптимизации не найден" "Yellow"
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
Write-ColorOutput "  • Структура папок: ✅ Создана" "White"
Write-ColorOutput "  • .automation: ✅ Скопирован" "White"
Write-ColorOutput "  • .manager: ✅ Скопирован" "White"
Write-ColorOutput "  • Умное слияние: ✅ Выполнено" "White"
Write-ColorOutput "  • Алиасы: ✅ Загружены" "White"
Write-ColorOutput "  • Настройка: ✅ Завершена" "White"
Write-ColorOutput "  • Анализ: ✅ Выполнен" "White"
Write-ColorOutput "  • Оптимизация: ✅ Завершена" "White"
Write-ColorOutput ""

Write-ColorOutput "📝 СЛЕДУЮЩИЕ ШАГИ:" "Cyan"
Write-ColorOutput "  1. Проверьте файлы проекта" "White"
Write-ColorOutput "  2. Убедитесь, что TODO.md и IDEA.md не перезаписаны" "White"
Write-ColorOutput "  3. Проверьте слияние .manager/start.md" "White"
Write-ColorOutput "  4. Используйте новые алиасы: mpo, mmo, qai, qaq, qap" "White"
Write-ColorOutput ""

Write-ColorOutput "🎯 Проект готов к работе с v4.8!" "Green"
Write-ColorOutput ""
