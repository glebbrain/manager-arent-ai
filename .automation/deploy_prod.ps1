# .automation/deploy_prod.ps1
# Скрипт архивирования проекта для продакшн-деплоя

param(
    [string]$ProjectName = "ManagerAgentAI",
    [string]$OutputDir = "dist",
    [string]$Version = "",
    [switch]$WhatIf = $false,
    [switch]$Verbose = $false
)

# Получение версии из git или текущей даты
if ([string]::IsNullOrEmpty($Version)) {
    try {
        $gitVersion = git describe --tags --always 2>$null
        if ($LASTEXITCODE -eq 0) {
            $Version = $gitVersion
        } else {
            $Version = Get-Date -Format "yyyyMMdd-HHmmss"
        }
    }
    catch {
        $Version = Get-Date -Format "yyyyMMdd-HHmmss"
    }
}

Write-Host "📦 Создание архива для продакшн-деплоя..." -ForegroundColor Cyan
Write-Host "  Проект: $ProjectName" -ForegroundColor White
Write-Host "  Версия: $Version" -ForegroundColor White
Write-Host "  Выходная папка: $OutputDir" -ForegroundColor White

# Создание выходной папки
if (!(Test-Path $OutputDir)) {
    Write-Host "📁 Создание папки: $OutputDir" -ForegroundColor Yellow
    if (!$WhatIf) {
        New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    }
}

# Паттерны исключения (соответствуют .deployignore)
$excludePatterns = @(
    ".automation",
    ".manager",
    ".vscode",
    ".idea",
    ".vs",
    ".git",
    "node_modules",
    "__pycache__",
    ".pytest_cache",
    ".venv",
    "venv",
    "env",
    ".env",
    "*.log",
    "*.tmp",
    "*.temp",
    "*.swp",
    "*.swo",
    "*~",
    ".DS_Store",
    "Thumbs.db",
    "desktop.ini",
    "dist",
    "build",
    "bin",
    "obj",
    "out",
    "target",
    "coverage",
    "*.sln",
    "*.suo",
    "*.user",
    "*.sp1",
    "test*.db",
    "*.test",
    "*.spec",
    "tests",
    "__tests__",
    "test",
    "spec",
    ".env.local",
    ".env.development",
    ".env.test",
    "*.local",
    "*.dev",
    "*.debug",
    "logs",
    "reports",
    "*.bak",
    "*.backup",
    "*.old",
    "*.orig",
    "*.rej",
    "*.zip",
    "*.tar",
    "*.tar.gz",
    "*.rar",
    "*.7z"
)

# Функция проверки исключения
function Test-ShouldExclude {
    param([string]$Path)
    
    foreach ($pattern in $excludePatterns) {
        if ($Path -like "*$pattern*") {
            return $true
        }
    }
    return $false
}

# Сбор файлов для архивирования
Write-Host "🔍 Поиск файлов для архивирования..." -ForegroundColor Yellow
$filesToArchive = @()

Get-ChildItem -Path "." -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Substring((Get-Location).Path.Length + 1)
    
    if (!(Test-ShouldExclude $relativePath)) {
        $filesToArchive += $_
        
        if ($Verbose) {
            Write-Host "  ✅ $relativePath" -ForegroundColor Green
        }
    } else {
        if ($Verbose) {
            Write-Host "  ❌ $relativePath" -ForegroundColor Red
        }
    }
}

Write-Host "📊 Найдено файлов для архивирования: $($filesToArchive.Count)" -ForegroundColor Cyan

# Создание временной папки для архивирования
$tempDir = Join-Path $env:TEMP "deploy_$ProjectName"
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}

if (!$WhatIf) {
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    
    # Копирование файлов во временную папку
    Write-Host "📋 Копирование файлов..." -ForegroundColor Yellow
    foreach ($file in $filesToArchive) {
        $relativePath = $file.FullName.Substring((Get-Location).Path.Length + 1)
        $destPath = Join-Path $tempDir $relativePath
        $destDir = Split-Path $destPath -Parent
        
        if (!(Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        Copy-Item -Path $file.FullName -Destination $destPath -Force
    }
    
    # Создание архива
    $archiveName = "${ProjectName}_v${Version}_prod.zip"
    $archivePath = Join-Path $OutputDir $archiveName
    
    Write-Host "🗜️ Создание архива: $archiveName" -ForegroundColor Yellow
    
    try {
        Compress-Archive -Path "$tempDir\*" -DestinationPath $archivePath -Force
        Write-Host "✅ Архив успешно создан: $archivePath" -ForegroundColor Green
        
        # Получение размера архива
        $archiveSize = (Get-Item $archivePath).Length
        $archiveSizeMB = [math]::Round($archiveSize / 1MB, 2)
        Write-Host "📏 Размер архива: $archiveSizeMB MB" -ForegroundColor Cyan
        
        # Создание манифеста
        $manifestPath = Join-Path $OutputDir "${ProjectName}_v${Version}_manifest.txt"
        $manifest = @"
Архив проекта: $ProjectName
Версия: $Version
Дата создания: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Размер архива: $archiveSizeMB MB
Количество файлов: $($filesToArchive.Count)

Исключенные папки:
$(($excludePatterns | ForEach-Object { "  - $_" }) -join "`n")

Включенные файлы:
$(($filesToArchive | ForEach-Object { "  - $($_.FullName.Substring((Get-Location).Path.Length + 1))" }) -join "`n")
"@
        
        $manifest | Out-File -FilePath $manifestPath -Encoding UTF8
        Write-Host "📄 Создан манифест: $manifestPath" -ForegroundColor Green
        
    }
    catch {
        Write-Error "Ошибка при создании архива: $($_.Exception.Message)"
        exit 1
    }
    finally {
        # Очистка временной папки
        if (Test-Path $tempDir) {
            Remove-Item -Path $tempDir -Recurse -Force
        }
    }
} else {
    Write-Host "✅ Режим предварительного просмотра завершен" -ForegroundColor Green
}

Write-Host "`n🎉 Процесс архивирования завершен!" -ForegroundColor Green
Write-Host "📁 Результат сохранен в: $OutputDir" -ForegroundColor Cyan

# Асинхронное уведомление (если настроено)
if (!$WhatIf) {
    Write-Host "`n🚀 Запуск асинхронных задач..." -ForegroundColor Yellow
    
    # Здесь можно добавить асинхронные задачи:
    # - Отправка уведомлений
    # - Загрузка на сервер
    # - Обновление статуса деплоя
    
    Start-Job -ScriptBlock {
        Start-Sleep -Seconds 2
        Write-Host "✅ Асинхронные задачи завершены" -ForegroundColor Green
    } | Out-Null
}
