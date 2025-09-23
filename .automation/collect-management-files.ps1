# Скрипт для сбора управляющих файлов из всех проектов
# Автор: ManagerAgentAI
# Дата: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

param(
    [string]$SourcePath = "F:\ProjectsAI",
    [string]$DestinationPath = "F:\ProjectsAI\ManagerAgentAI\projectsManagerFiles",
    [switch]$Verbose = $false
)

# Функция для логирования
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage
    
    # Записываем в лог файл (создаем папку если не существует)
    try {
        if (-not (Test-Path $DestinationPath)) {
            New-Item -ItemType Directory -Path $DestinationPath -Force | Out-Null
        }
        $logFile = Join-Path $DestinationPath "collection-log.txt"
        Add-Content -Path $logFile -Value $logMessage
    }
    catch {
        # Если не можем записать в лог файл, просто выводим в консоль
        Write-Host "Не удалось записать в лог файл: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Функция для безопасного копирования
function Copy-ManagementFiles {
    param(
        [string]$SourceProjectPath,
        [string]$ProjectName,
        [string]$TargetProjectPath
    )
    
    $filesToCopy = @(
        ".automation",
        ".cursor", 
        ".manager",
        ".vscode",
        "cursor.json"
    )
    
    $copiedCount = 0
    $skippedCount = 0
    
    foreach ($item in $filesToCopy) {
        $sourceItemPath = Join-Path $SourceProjectPath $item
        
        if (Test-Path $sourceItemPath) {
            $targetItemPath = Join-Path $TargetProjectPath $item
            
            try {
                # Создаем целевую папку если не существует
                if (-not (Test-Path $TargetProjectPath)) {
                    New-Item -ItemType Directory -Path $TargetProjectPath -Force | Out-Null
                }
                
                # Копируем файл или папку
                if (Test-Path $sourceItemPath -PathType Container) {
                    # Это папка
                    Copy-Item -Path $sourceItemPath -Destination $targetItemPath -Recurse -Force
                    Write-Log "Скопирована папка`: $item из проекта $ProjectName" "SUCCESS"
                } else {
                    # Это файл
                    Copy-Item -Path $sourceItemPath -Destination $targetItemPath -Force
                    Write-Log "Скопирован файл`: $item из проекта $ProjectName" "SUCCESS"
                }
                $copiedCount++
            }
            catch {
                Write-Log "Ошибка при копировании $item из проекта $ProjectName`: $($_.Exception.Message)" "ERROR"
                $skippedCount++
            }
        } else {
            if ($Verbose) {
                Write-Log "Файл/папка $item не найден в проекте $ProjectName" "WARNING"
            }
            $skippedCount++
        }
    }
    
    return @{
        Copied = $copiedCount
        Skipped = $skippedCount
    }
}

# Основная функция
function Start-CollectionProcess {
    Write-Log "Начинаем сбор управляющих файлов из проектов" "INFO"
    Write-Log "Исходная папка`: $SourcePath" "INFO"
    Write-Log "Целевая папка`: $DestinationPath" "INFO"
    
    # Проверяем существование исходной папки
    if (-not (Test-Path $SourcePath)) {
        Write-Log "Исходная папка $SourcePath не найдена!" "ERROR"
        return
    }
    
    # Создаем целевую папку если не существует
    if (-not (Test-Path $DestinationPath)) {
        try {
            New-Item -ItemType Directory -Path $DestinationPath -Force | Out-Null
            Write-Log "Создана целевая папка`: $DestinationPath" "INFO"
        }
        catch {
            Write-Log "Ошибка при создании целевой папки`: $($_.Exception.Message)" "ERROR"
            return
        }
    }
    
    # Получаем все подпапки в исходной директории
    $projects = Get-ChildItem -Path $SourcePath -Directory | Where-Object { 
        $_.Name -ne "ManagerAgentAI" -and $_.Name -ne "projectsManagerFiles" 
    }
    
    Write-Log "Найдено проектов для обработки`: $($projects.Count)" "INFO"
    
    $totalStats = @{
        ProcessedProjects = 0
        TotalFilesCopied = 0
        TotalFilesSkipped = 0
        Errors = 0
    }
    
    # Обрабатываем каждый проект
    foreach ($project in $projects) {
        $projectName = $project.Name
        $projectPath = $project.FullName
        $targetProjectPath = Join-Path $DestinationPath $projectName
        
        Write-Log "Обрабатываем проект`: $projectName" "INFO"
        
        try {
            $stats = Copy-ManagementFiles -SourceProjectPath $projectPath -ProjectName $projectName -TargetProjectPath $targetProjectPath
            $totalStats.ProcessedProjects++
            $totalStats.TotalFilesCopied += $stats.Copied
            $totalStats.TotalFilesSkipped += $stats.Skipped
            
            Write-Log "Проект $projectName обработан. Скопировано`: $($stats.Copied), Пропущено`: $($stats.Skipped)" "SUCCESS"
        }
        catch {
            Write-Log "Ошибка при обработке проекта $projectName`: $($_.Exception.Message)" "ERROR"
            $totalStats.Errors++
        }
    }
    
    # Выводим итоговую статистику
    Write-Log "=== ИТОГОВАЯ СТАТИСТИКА ===" "INFO"
    Write-Log "Обработано проектов`: $($totalStats.ProcessedProjects)" "INFO"
    Write-Log "Всего файлов/папок скопировано`: $($totalStats.TotalFilesCopied)" "INFO"
    Write-Log "Всего файлов/папок пропущено`: $($totalStats.TotalFilesSkipped)" "INFO"
    Write-Log "Ошибок`: $($totalStats.Errors)" "INFO"
    Write-Log "Сбор управляющих файлов завершен!" "SUCCESS"
}

# Запускаем процесс сбора
try {
    Start-CollectionProcess
}
catch {
    Write-Log "Критическая ошибка`: $($_.Exception.Message)" "ERROR"
    exit 1
}

Write-Host "`nНажмите любую клавишу для выхода..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
