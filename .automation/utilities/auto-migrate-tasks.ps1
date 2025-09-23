# =============================================================================
# Auto Migrate Tasks Script - Universal Project Manager
# =============================================================================
# Простой скрипт для автоматического запуска миграции задач
# Используется после выполнения задач для автоматической очистки TODO файлов
# =============================================================================

param(
    [string]$ProjectPath = ".",
    [switch]$Verbose = $false
)

# Получаем путь к скрипту миграции
$MigrationScript = Join-Path $ProjectPath "scripts/task-migration.ps1"

# Проверяем существование скрипта миграции
if (-not (Test-Path $MigrationScript)) {
    Write-Error "Migration script not found: $MigrationScript"
    exit 1
}

Write-Host "Starting automatic task migration..." -ForegroundColor Green

try {
    # Запускаем скрипт миграции
    $arguments = @("-ExecutionPolicy", "Bypass", "-File", "`"$MigrationScript`"")
    
    if ($Verbose) {
        $arguments += "-Verbose"
    }
    
    $result = & powershell $arguments
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Task migration completed successfully!" -ForegroundColor Green
        Write-Host "Check your TODO.md and COMPLETED.md files for updates" -ForegroundColor Cyan
    } else {
        Write-Host "Task migration failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} catch {
    Write-Error "Error running task migration: $($_.Exception.Message)"
    exit 1
}

Write-Host "Auto migration process completed!" -ForegroundColor Green
