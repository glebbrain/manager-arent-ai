# =============================================================================
# Task Migration Script - Universal Project Manager
# =============================================================================
# Автоматический перенос выполненных задач из TODO.md в Completed.md
# Поддерживает как корневые файлы, так и файлы в .manager/control-files/
# =============================================================================

param(
    [string]$ProjectPath = ".",
    [switch]$Verbose = $false,
    [switch]$DryRun = $false
)

# Настройка логирования
$LogFile = Join-Path $ProjectPath "task-migration.log"
$ErrorActionPreference = "Continue"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry -Encoding UTF8
}

function Test-FileExists {
    param([string]$FilePath)
    return Test-Path $FilePath
}

function Get-CompletedTasks {
    param([string]$TodoContent)
    
    $completedTasks = @()
    $lines = $TodoContent -split "`n"
    $inCompletedBlock = $false
    $currentBlock = @()
    
    for ($i = 0; $i -lt $lines.Length; $i++) {
        $line = $lines[$i]
        
        
        # Ищем начало блока выполненных задач
        if ($line -match "^\s*-\s*.*COMPLETED TASKS MOVED TO COMPLETED\.md\*\*") {
            $inCompletedBlock = $true
            $currentBlock = @()
            continue
        }
        
        # Если мы в блоке выполненных задач
        if ($inCompletedBlock) {
            # Проверяем, не закончился ли блок
            if ($line -match "^\s*####\s+|^\s*---|^\s*#\s+") {
                $inCompletedBlock = $false
                if ($currentBlock.Count -gt 0) {
                    $completedTasks += ($currentBlock -join "`n")
                    $currentBlock = @()
                }
                continue
            }
            
            # Добавляем строки в текущий блок
            if ($line -match "^\s{2,}-") {
                $currentBlock += $line.Trim()
            }
        }
        
        # Ищем отдельные выполненные задачи (✅ или [x])
        if ($line -match "^\s*-\s*[✅x]\s+(.+)$" -and -not $inCompletedBlock) {
            $taskText = $matches[1].Trim()
            
            # Собираем многострочные задачи
            $fullTask = $taskText
            $j = $i + 1
            while ($j -lt $lines.Length -and $lines[$j] -match "^\s{2,}-") {
                $fullTask += "`n" + $lines[$j].Trim()
                $j++
            }
            
            $completedTasks += $fullTask
        }
    }
    
    # Обрабатываем последний блок, если он есть
    if ($inCompletedBlock -and $currentBlock.Count -gt 0) {
        $completedTasks += ($currentBlock -join "`n")
    }
    
    return $completedTasks
}

function Remove-CompletedTasks {
    param([string]$TodoContent)
    
    $lines = $TodoContent -split "`n"
    $newLines = @()
    $skipNext = $false
    $inCompletedBlock = $false
    
    for ($i = 0; $i -lt $lines.Length; $i++) {
        $line = $lines[$i]
        
        # Ищем начало блока выполненных задач
        if ($line -match "^\s*-\s*.*COMPLETED TASKS MOVED TO COMPLETED\.md\*\*") {
            $inCompletedBlock = $true
            continue
        }
        
        # Если мы в блоке выполненных задач
        if ($inCompletedBlock) {
            # Проверяем, не закончился ли блок
            if ($line -match "^\s*####\s+|^\s*---|^\s*#\s+") {
                $inCompletedBlock = $false
                # Не добавляем эту строку, так как она может быть частью блока
                continue
            }
            # Пропускаем все строки в блоке выполненных задач
            continue
        }
        
        # Пропускаем отдельные строки с выполненными задачами
        if ($line -match "^\s*-\s*[✅x]\s+" -or $line -match "^\s*-\s*✅\s+") {
            $skipNext = $true
            continue
        }
        
        # Пропускаем подзадачи выполненных задач
        if ($skipNext -and $line -match "^\s{2,}-") {
            continue
        }
        
        # Сбрасываем флаг пропуска для новых задач
        if ($line -match "^\s*-\s*\[[^x]\]") {
            $skipNext = $false
        }
        
        # Сбрасываем флаг для заголовков
        if ($line -match "^\s*#|^\s*$|^\s*---") {
            $skipNext = $false
        }
        
        $newLines += $line
    }
    
    return ($newLines -join "`n")
}

function Add-CompletedTasks {
    param([string]$CompletedContent, [array]$CompletedTasks, [string]$SourceFile)
    
    if ($CompletedTasks.Count -eq 0) {
        return $CompletedContent
    }
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $migrationHeader = @"

## 🚀 **AUTOMATIC TASK MIGRATION** ✅ COMPLETED

### 📅 **Migration Date**: $timestamp
### 📁 **Source**: $SourceFile
### 🎯 **Migrated Tasks**: $($CompletedTasks.Count) completed tasks

#### ✅ **Migrated Completed Tasks**
"@
    
    $migratedTasks = @()
    foreach ($task in $CompletedTasks) {
        $migratedTasks += "- [x] $task"
    }
    
    $migrationContent = $migrationHeader + "`n" + ($migratedTasks -join "`n")
    
    # Добавляем в начало файла после заголовка
    if ($CompletedContent -match "^(# .+?)(\n\n)") {
        return $CompletedContent -replace "^(# .+?)(\n\n)", "`$1`$2$migrationContent`n`n"
    } else {
        return $migrationContent + "`n`n" + $CompletedContent
    }
}

function Process-TodoFile {
    param(
        [string]$TodoPath,
        [string]$CompletedPath,
        [string]$Description
    )
    
    Write-Log "Processing $Description files..." "INFO"
    
    if (-not (Test-FileExists $TodoPath)) {
        Write-Log "TODO file not found: $TodoPath" "WARN"
        return $false
    }
    
    if (-not (Test-FileExists $CompletedPath)) {
        Write-Log "Completed file not found: $CompletedPath" "WARN"
        return $false
    }
    
    try {
        # Читаем содержимое файлов
        $todoContent = Get-Content -Path $TodoPath -Raw -Encoding UTF8
        $completedContent = Get-Content -Path $CompletedPath -Raw -Encoding UTF8
        
        # Находим выполненные задачи
        $completedTasks = Get-CompletedTasks -TodoContent $todoContent
        
        if ($completedTasks.Count -eq 0) {
            Write-Log "No completed tasks found in $TodoPath" "INFO"
            return $true
        }
        
        Write-Log "Found $($completedTasks.Count) completed tasks in $TodoPath" "INFO"
        
        if ($DryRun) {
            Write-Log "DRY RUN: Would migrate $($completedTasks.Count) tasks from $TodoPath to $CompletedPath" "INFO"
            foreach ($task in $completedTasks) {
                Write-Log "  - $task" "INFO"
            }
            return $true
        }
        
        # Создаем резервные копии
        $todoBackup = $TodoPath + ".backup." + (Get-Date -Format "yyyyMMdd-HHmmss")
        $completedBackup = $CompletedPath + ".backup." + (Get-Date -Format "yyyyMMdd-HHmmss")
        
        Copy-Item -Path $TodoPath -Destination $todoBackup
        Copy-Item -Path $CompletedPath -Destination $completedBackup
        
        Write-Log "Created backups: $todoBackup, $completedBackup" "INFO"
        
        # Удаляем выполненные задачи из TODO
        $newTodoContent = Remove-CompletedTasks -TodoContent $todoContent
        
        # Добавляем выполненные задачи в Completed
        $newCompletedContent = Add-CompletedTasks -CompletedContent $completedContent -CompletedTasks $completedTasks -SourceFile $TodoPath
        
        # Сохраняем изменения
        Set-Content -Path $TodoPath -Value $newTodoContent -Encoding UTF8
        Set-Content -Path $CompletedPath -Value $newCompletedContent -Encoding UTF8
        
        Write-Log "Successfully migrated $($completedTasks.Count) tasks from $TodoPath to $CompletedPath" "SUCCESS"
        return $true
        
    } catch {
        Write-Log "Error processing $Description files: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

Write-Log "Starting Task Migration Script" "INFO"
Write-Log "Project Path: $ProjectPath" "INFO"
Write-Log "Dry Run: $DryRun" "INFO"

$success = $true

# Обрабатываем корневые файлы
$rootTodoPath = Join-Path $ProjectPath "TODO.md"
$rootCompletedPath = Join-Path $ProjectPath "COMPLETED.md"

if ((Test-FileExists $rootTodoPath) -and (Test-FileExists $rootCompletedPath)) {
    $result = Process-TodoFile -TodoPath $rootTodoPath -CompletedPath $rootCompletedPath -Description "Root"
    $success = $success -and $result
}

# Обрабатываем файлы в .manager/control-files/
$managerTodoPath = Join-Path $ProjectPath ".manager/control-files/TODO.md"
$managerCompletedPath = Join-Path $ProjectPath ".manager/control-files/COMPLETED.md"

if ((Test-FileExists $managerTodoPath) -and (Test-FileExists $managerCompletedPath)) {
    $result = Process-TodoFile -TodoPath $managerTodoPath -CompletedPath $managerCompletedPath -Description "Manager"
    $success = $success -and $result
}

# Проверяем наличие файлов .manager/TODO.md и .manager/Completed.md (альтернативные пути)
$altManagerTodoPath = Join-Path $ProjectPath ".manager/TODO.md"
$altManagerCompletedPath = Join-Path $ProjectPath ".manager/Completed.md"

if ((Test-FileExists $altManagerTodoPath) -and (Test-FileExists $altManagerCompletedPath)) {
    $result = Process-TodoFile -TodoPath $altManagerTodoPath -CompletedPath $altManagerCompletedPath -Description "Manager (Alternative)"
    $success = $success -and $result
}

if ($success) {
    Write-Log "Task migration completed successfully!" "SUCCESS"
    exit 0
} else {
    Write-Log "Task migration completed with errors. Check log file: $LogFile" "ERROR"
    exit 1
}
