# quick-migrate-v4.8.ps1 - Быстрая миграция проекта до v4.8
# Упрощенная версия для быстрого копирования
param(
    [string]$SourcePath = "F:\ProjectsAI\ManagerAgentAI",
    [switch]$Force = $false
)

Write-Host "🚀 Быстрая миграция до v4.8..." -ForegroundColor Green

# Проверка исходного пути
if (!(Test-Path $SourcePath)) {
    Write-Host "❌ Исходный путь не найден: $SourcePath" -ForegroundColor Red
    exit 1
}

# Создание папок
Write-Host "📁 Создание папок..." -ForegroundColor Yellow
@(".\.automation", ".\.manager", ".\.manager\control-files", ".\.manager\Completed") | ForEach-Object {
    if (!(Test-Path $_)) { New-Item -ItemType Directory -Path $_ -Force | Out-Null }
}

# Копирование .automation
Write-Host "📋 Копирование .automation..." -ForegroundColor Yellow
if (Test-Path "$SourcePath\.automation") {
    Copy-Item "$SourcePath\.automation\*" ".\.automation\" -Recurse -Force
    Write-Host "✅ .automation скопирован" -ForegroundColor Green
}

# Копирование .manager
Write-Host "📋 Копирование .manager..." -ForegroundColor Yellow
if (Test-Path "$SourcePath\.manager") {
    Copy-Item "$SourcePath\.manager\*" ".\.manager\" -Recurse -Force
    Write-Host "✅ .manager скопирован" -ForegroundColor Green
}

# Копирование cursor.json
Write-Host "📋 Копирование cursor.json..." -ForegroundColor Yellow
if (Test-Path "$SourcePath\cursor.json") {
    Copy-Item "$SourcePath\cursor.json" "." -Force
    Write-Host "✅ cursor.json скопирован" -ForegroundColor Green
}

Write-Host "🎉 Быстрая миграция завершена!" -ForegroundColor Green
Write-Host "📝 Следующие шаги:" -ForegroundColor Cyan
Write-Host "  1. . .\.automation\scripts\New-Aliases-v4.8.ps1" -ForegroundColor White
Write-Host "  2. mpo -Action test" -ForegroundColor White
