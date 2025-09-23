# 🔄 Руководство по миграции: Старая система → DEV->PROM->PROD

**Версия:** 1.0  
**Дата:** 2025-01-31  
**Статус:** Production Ready  

## 📋 Обзор

Данное руководство поможет вам перейти со старой системы управления проектом (используя `.manager`, `.automation` и т.п.) на новую систему DEV->PROM->PROD развертывания.

## 🔍 Анализ старой системы

### Старая структура
```
ManagerAgentAI/
├── .automation/               # Старая система автоматизации
│   ├── ai-analysis/           # AI-анализ
│   ├── testing/               # Тестирование
│   ├── build/                 # Сборка
│   ├── deployment/            # Развертывание
│   └── utilities/             # Утилиты
├── .manager/                  # Старая система управления
│   ├── control-files/         # Файлы управления
│   ├── prompts/               # Промпты
│   ├── reports/               # Отчеты
│   └── scripts/               # Скрипты
└── scripts/                   # Основные скрипты
```

### Новая структура
```
ManagerAgentAI/
├── scripts/                   # Новые скрипты деплоя
│   ├── deploy-to-prom.ps1     # Деплой в PROM
│   ├── deploy-to-prod.ps1     # Деплой в PROD
│   └── deployment-manager.ps1 # Универсальный менеджер
├── config/                    # Конфигурация
│   └── deployment-config.json # Конфигурация деплоя
├── docs/deployment/           # Документация деплоя
└── .legacy/                   # Архив старой системы
```

## 🚀 Пошаговая миграция

### Этап 1: Подготовка к миграции

#### 1.1. Создание резервной копии
```powershell
# Создать резервную копию текущего состояния
$backupDate = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = "F:\ProjectsAI\ManagerAgentAI-Backup-$backupDate"

# Копировать весь проект
Copy-Item -Path "F:\ProjectsAI\ManagerAgentAI" -Destination $backupPath -Recurse

Write-Host "✅ Резервная копия создана: $backupPath" -ForegroundColor Green
```

#### 1.2. Анализ существующих проектов
```powershell
# Найти все проекты в старой системе
$oldProjects = @()
$oldProjects += Get-ChildItem -Path ".automation" -Directory | Select-Object Name
$oldProjects += Get-ChildItem -Path ".manager" -Directory | Select-Object Name

Write-Host "📋 Найдено проектов в старой системе: $($oldProjects.Count)" -ForegroundColor Yellow
$oldProjects | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor White }
```

### Этап 2: Создание архива старой системы

#### 2.1. Создание папки .legacy
```powershell
# Создать папку для архива
New-Item -ItemType Directory -Path ".legacy" -Force

# Переместить старые папки в архив
Move-Item -Path ".automation" -Destination ".legacy\automation" -Force
Move-Item -Path ".manager" -Destination ".legacy\manager" -Force

Write-Host "✅ Старая система перемещена в .legacy" -ForegroundColor Green
```

#### 2.2. Создание индекса архива
```powershell
# Создать индекс архивированных компонентов
$legacyIndex = @{
    migrationDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    originalStructure = @{
        automation = ".legacy\automation"
        manager = ".legacy\manager"
    }
    newStructure = @{
        scripts = "scripts\"
        config = "config\"
        docs = "docs\deployment\"
    }
    migrationNotes = "Migrated from old .automation/.manager system to new DEV->PROM->PROD system"
}

$legacyIndex | ConvertTo-Json -Depth 3 | Out-File -FilePath ".legacy\migration-index.json" -Encoding UTF8
```

### Этап 3: Настройка новой системы

#### 3.1. Проверка новой системы
```powershell
# Проверить наличие новых скриптов
$newScripts = @(
    "scripts\deploy-to-prom.ps1",
    "scripts\deploy-to-prod.ps1", 
    "scripts\deployment-manager.ps1"
)

foreach ($script in $newScripts) {
    if (Test-Path $script) {
        Write-Host "✅ $script - найден" -ForegroundColor Green
    } else {
        Write-Host "❌ $script - не найден" -ForegroundColor Red
    }
}
```

#### 3.2. Настройка путей
```powershell
# Создать необходимые папки
$newPaths = @(
    "F:\ProjectsAI\logs",
    "G:\OSPanel\home",
    "config"
)

foreach ($path in $newPaths) {
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
        Write-Host "📁 Создана папка: $path" -ForegroundColor Yellow
    }
}
```

### Этап 4: Миграция проектов

#### 4.1. Создание скрипта миграции
```powershell
# Создать скрипт миграции проектов
$migrationScript = @'
# Project Migration Script
param(
    [string]$ProjectName,
    [string]$SourcePath,
    [string]$TargetPath = "F:\ProjectsAI"
)

Write-Host "🔄 Мигрируем проект: $ProjectName" -ForegroundColor Cyan

# Создать папку проекта в новой структуре
$projectPath = Join-Path $TargetPath $ProjectName
if (-not (Test-Path $projectPath)) {
    New-Item -ItemType Directory -Path $projectPath -Force | Out-Null
}

# Копировать файлы проекта
if (Test-Path $SourcePath) {
    Copy-Item -Path "$SourcePath\*" -Destination $projectPath -Recurse -Force
    Write-Host "✅ Проект $ProjectName мигрирован в $projectPath" -ForegroundColor Green
} else {
    Write-Host "❌ Исходный путь не найден: $SourcePath" -ForegroundColor Red
}
'@

$migrationScript | Out-File -FilePath "scripts\migrate-project.ps1" -Encoding UTF8
```

#### 4.2. Миграция существующих проектов
```powershell
# Мигрировать проекты из старой системы
$projectsToMigrate = @(
    @{Name="TestProject"; Source="TestProject"},
    @{Name="LegacyProject1"; Source=".legacy\automation\project1"},
    @{Name="LegacyProject2"; Source=".legacy\manager\project2"}
)

foreach ($project in $projectsToMigrate) {
    if (Test-Path $project.Source) {
        .\scripts\migrate-project.ps1 -ProjectName $project.Name -SourcePath $project.Source
    }
}
```

### Этап 5: Обновление конфигурации

#### 5.1. Обновление cursor.json
```powershell
# Обновить cursor.json с новыми путями
$cursorConfig = Get-Content "cursor.json" | ConvertFrom-Json

# Добавить новые пути
$cursorConfig.include += "scripts/**"
$cursorConfig.include += "config/**"
$cursorConfig.include += "docs/deployment/**"

# Обновить AI инструкции
$cursorConfig.ai_instructions += "Use new DEV->PROM->PROD deployment system"
$cursorConfig.ai_instructions += "Legacy .automation/.manager system moved to .legacy/"

$cursorConfig | ConvertTo-Json -Depth 3 | Out-File -FilePath "cursor.json" -Encoding UTF8
```

#### 5.2. Обновление README.md
```powershell
# Добавить секцию миграции в README.md
$migrationSection = @'

## 🔄 Миграция со старой системы

### Переход с .automation/.manager на DEV->PROM->PROD

Старая система управления проектом (используя `.automation`, `.manager`) была заменена на новую систему DEV->PROM->PROD развертывания.

#### Архив старой системы
- Старые компоненты перемещены в `.legacy/`
- `.legacy/automation/` - архив старой системы автоматизации
- `.legacy/manager/` - архив старой системы управления

#### Новая система
- Используйте `scripts/deployment-manager.ps1` для управления деплоем
- Следуйте принципу DEV->PROM->PROD
- См. документацию в `docs/deployment/`

'@

# Добавить секцию в README.md
Add-Content -Path "README.md" -Value $migrationSection
```

### Этап 6: Тестирование новой системы

#### 6.1. Тест мигрированных проектов
```powershell
# Протестировать мигрированные проекты
$migratedProjects = Get-ChildItem -Path "F:\ProjectsAI" -Directory | Where-Object { $_.Name -ne "ManagerAgentAI" }

foreach ($project in $migratedProjects) {
    Write-Host "🧪 Тестируем проект: $($project.Name)" -ForegroundColor Cyan
    
    # Проверить статус
    .\scripts\deployment-manager.ps1 -ProjectName $project.Name -Action status
    
    # Деплой в PROM
    .\scripts\deploy-to-prom.ps1 -ProjectName $project.Name -SourcePath $project.FullName
}
```

#### 6.2. Валидация системы
```powershell
# Проверить все компоненты новой системы
$validationChecks = @(
    @{Name="PROM Script"; Path="scripts\deploy-to-prom.ps1"},
    @{Name="PROD Script"; Path="scripts\deploy-to-prod.ps1"},
    @{Name="Manager Script"; Path="scripts\deployment-manager.ps1"},
    @{Name="Config"; Path="config\deployment-config.json"},
    @{Name="Documentation"; Path="docs\deployment\DEV-PROM-PROD-Workflow.md"}
)

foreach ($check in $validationChecks) {
    if (Test-Path $check.Path) {
        Write-Host "✅ $($check.Name) - OK" -ForegroundColor Green
    } else {
        Write-Host "❌ $($check.Name) - Missing" -ForegroundColor Red
    }
}
```

## 📋 Чек-лист миграции

### ✅ Подготовка
- [ ] Создана резервная копия проекта
- [ ] Проанализированы существующие проекты
- [ ] Создан план миграции

### ✅ Архивация старой системы
- [ ] Создана папка `.legacy/`
- [ ] Перемещены `.automation/` и `.manager/` в архив
- [ ] Создан индекс архива

### ✅ Настройка новой системы
- [ ] Проверены новые скрипты деплоя
- [ ] Созданы необходимые папки
- [ ] Настроены пути

### ✅ Миграция проектов
- [ ] Создан скрипт миграции
- [ ] Мигрированы существующие проекты
- [ ] Проверена целостность данных

### ✅ Обновление конфигурации
- [ ] Обновлен `cursor.json`
- [ ] Обновлен `README.md`
- [ ] Настроены новые пути

### ✅ Тестирование
- [ ] Протестированы мигрированные проекты
- [ ] Проверена работа новой системы
- [ ] Валидированы все компоненты

## 🚨 Важные замечания

### Сохранение данных
- Все данные из старой системы сохранены в `.legacy/`
- Резервная копия создана перед миграцией
- Можно вернуться к старой системе при необходимости

### Обратная совместимость
- Старые скрипты остаются в `.legacy/`
- Можно использовать их при необходимости
- Постепенный переход на новую систему

### Поддержка
- Документация по миграции в `docs/migration/`
- Инструкции по использованию новой системы
- Возможность консультации по миграции

## 📚 Дополнительные ресурсы

- [DEV-PROM-PROD Workflow](../deployment/DEV-PROM-PROD-Workflow.md)
- [Deployment Instructions](../deployment/Deployment-Instructions.md)
- [Quick Reference](../deployment/Quick-Reference.md)
- [Legacy System Archive](../legacy/migration-index.json)

---

**Последнее обновление:** 2025-01-31  
**Версия документа:** 1.0  
**Статус:** Production Ready
