# start-v4.8.ps1 - Упрощенный быстрый старт системы v4.8
# Минимальная версия для быстрого запуска

param(
    [string]$SourcePath = "F:\ProjectsAI\ManagerAgentAI",
    [switch]$Force = $false
)

Write-Host "🚀 Быстрый старт системы v4.8..." -ForegroundColor Green

# 1. Копирование
Write-Host "📁 Копирование файлов..." -ForegroundColor Yellow
if (!(Test-Path ".\.automation")) { New-Item -ItemType Directory -Path ".\.automation" -Force | Out-Null }
if (!(Test-Path ".\.manager")) { New-Item -ItemType Directory -Path ".\.manager" -Force | Out-Null }

if (Test-Path "$SourcePath\.automation") {
    Copy-Item "$SourcePath\.automation\*" ".\.automation\" -Recurse -Force
    Write-Host "  ✅ .automation скопирован" -ForegroundColor Green
}

if (Test-Path "$SourcePath\.manager") {
    Copy-Item "$SourcePath\.manager\*" ".\.manager\" -Recurse -Force
    Write-Host "  ✅ .manager скопирован" -ForegroundColor Green
}

if (Test-Path "$SourcePath\cursor.json") {
    Copy-Item "$SourcePath\cursor.json" "." -Force
    Write-Host "  ✅ cursor.json скопирован" -ForegroundColor Green
}

# 2. Загрузка алиасов
Write-Host "🔧 Загрузка алиасов..." -ForegroundColor Yellow
if (Test-Path ".\.automation\scripts\New-Aliases-v4.8.ps1") {
    . .\.automation\scripts\New-Aliases-v4.8.ps1
    Write-Host "  ✅ Алиасы загружены" -ForegroundColor Green
}

# 3. Настройка
Write-Host "⚙️  Настройка системы..." -ForegroundColor Yellow
if (Test-Path ".\.automation\Quick-Access-Optimized-v4.8.ps1") {
    pwsh -File .\.automation\Quick-Access-Optimized-v4.8.ps1 -Action setup
    Write-Host "  ✅ Настройка завершена" -ForegroundColor Green
}

# 4. Анализ
Write-Host "🔍 Анализ проекта..." -ForegroundColor Yellow
if (Test-Path ".\.automation\Project-Analysis-Optimizer-v4.8.ps1") {
    pwsh -File .\.automation\Project-Analysis-Optimizer-v4.8.ps1 -Action analyze -AI -Quantum
    Write-Host "  ✅ Анализ завершен" -ForegroundColor Green
}

# 5. Оптимизация
Write-Host "⚡ Оптимизация системы..." -ForegroundColor Yellow
if (Test-Path ".\.automation\Maximum-Performance-Optimizer-v4.8.ps1") {
    pwsh -File .\.automation\Maximum-Performance-Optimizer-v4.8.ps1 -Action optimize -AI -Quantum
    Write-Host "  ✅ Оптимизация завершена" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Система v4.8 готова к работе!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Быстрые команды:" -ForegroundColor Cyan
Write-Host "  • mpo - Максимальная оптимизация" -ForegroundColor White
Write-Host "  • qai - AI-анализ проекта" -ForegroundColor White
Write-Host "  • qas - Статус системы" -ForegroundColor White
Write-Host "  • qam - Мониторинг" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Удачной работы!" -ForegroundColor Cyan
