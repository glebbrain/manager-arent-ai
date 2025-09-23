# .automation/cleanup.ps1
# Скрипт очистки структуры проекта перед деплоем

param(
    [switch]$WhatIf = $false,
    [switch]$Verbose = $false
)

Write-Host "🧹 Запуск очистки структуры проекта..." -ForegroundColor Cyan

# Создание необходимых папок
$folders = @(
    "tests",
    ".manager/Completed", 
    "yml",
    "config",
    "setup",
    "test"
)

foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        Write-Host "📁 Создание папки: $folder" -ForegroundColor Yellow
        if (!$WhatIf) {
            New-Item -ItemType Directory -Path $folder -Force | Out-Null
        }
    }
}

# Функция для перемещения файлов
function Move-Files {
    param(
        [string]$Pattern,
        [string]$Destination,
        [string]$Description
    )
    
    $files = Get-ChildItem -Path "." -Filter $Pattern -Recurse -File | Where-Object { $_.DirectoryName -notlike "*$Destination*" }
    
    if ($files.Count -gt 0) {
        Write-Host "📦 $Description ($($files.Count) файлов)" -ForegroundColor Green
        
        foreach ($file in $files) {
            $destPath = Join-Path $Destination $file.Name
            
            if ($Verbose) {
                Write-Host "  $($file.FullName) → $destPath" -ForegroundColor Gray
            }
            
            if (!$WhatIf) {
                try {
                    Move-Item -Path $file.FullName -Destination $destPath -Force
                }
                catch {
                    Write-Warning "Не удалось переместить $($file.Name): $($_.Exception.Message)"
                }
            }
        }
    }
}

# 1. Перемещение тестовых Python файлов
Move-Files -Pattern "test_*.py" -Destination "tests" -Description "Перемещение тестовых Python файлов"

# 2. Перемещение MD файлов (кроме исключений)
$excludeMd = @("STATUS.md", "TODO.md", "IDEA.md", "README.md", "readme.md", "Readme.md")
$mdFiles = Get-ChildItem -Path "." -Filter "*.md" -Recurse -File | Where-Object { 
    $_.Name -notin $excludeMd -and $_.DirectoryName -notlike "*\.manager\Completed*" 
}

if ($mdFiles.Count -gt 0) {
    Write-Host "📄 Перемещение MD файлов ($($mdFiles.Count) файлов)" -ForegroundColor Green
    
    foreach ($file in $mdFiles) {
        $destPath = Join-Path ".manager/Completed" $file.Name
        
        if ($Verbose) {
            Write-Host "  $($file.FullName) → $destPath" -ForegroundColor Gray
        }
        
        if (!$WhatIf) {
            try {
                Move-Item -Path $file.FullName -Destination $destPath -Force
            }
            catch {
                Write-Warning "Не удалось переместить $($file.Name): $($_.Exception.Message)"
            }
        }
    }
}

# 3. Перемещение YAML файлов
Move-Files -Pattern "*.yml" -Destination "yml" -Description "Перемещение YAML файлов"

# 4. Перемещение конфигурационных JSON файлов
Move-Files -Pattern "*config*.json" -Destination "config" -Description "Перемещение конфигурационных JSON файлов"

# 5. Перемещение setup файлов
Move-Files -Pattern "setup*.py" -Destination "setup" -Description "Перемещение setup Python файлов"

# 6. Перемещение тестовых баз данных
Move-Files -Pattern "test*.db" -Destination "test" -Description "Перемещение тестовых баз данных"

# 7. Перемещение run файлов
Move-Files -Pattern "run*.py" -Destination "run" -Description "Перемещение run Python файлов"

# Очистка пустых папок
Write-Host "🗑️ Очистка пустых папок..." -ForegroundColor Yellow
$emptyFolders = Get-ChildItem -Path "." -Directory -Recurse | Where-Object { 
    (Get-ChildItem $_.FullName -Force | Measure-Object).Count -eq 0 -and 
    $_.Name -notin @(".git", ".vscode", ".idea", "node_modules", "__pycache__", ".pytest_cache")
}

foreach ($folder in $emptyFolders) {
    if ($Verbose) {
        Write-Host "  Удаление пустой папки: $($folder.FullName)" -ForegroundColor Gray
    }
    
    if (!$WhatIf) {
        try {
            Remove-Item -Path $folder.FullName -Force
        }
        catch {
            Write-Warning "Не удалось удалить папку $($folder.Name): $($_.Exception.Message)"
        }
    }
}

if ($WhatIf) {
    Write-Host "✅ Режим предварительного просмотра завершен" -ForegroundColor Green
} else {
    Write-Host "✅ Очистка структуры проекта завершена!" -ForegroundColor Green
}

Write-Host "📊 Статистика:" -ForegroundColor Cyan
Write-Host "  - Папки созданы: $($folders.Count)" -ForegroundColor White
Write-Host "  - MD файлов перемещено: $($mdFiles.Count)" -ForegroundColor White
Write-Host "  - Пустых папок удалено: $($emptyFolders.Count)" -ForegroundColor White
