# ⚡ Быстрая миграция: Старая система → DEV->PROM->PROD

## 🚀 Автоматическая миграция (Рекомендуется)

### 1. Запустить автоматический скрипт миграции
```powershell
# Полная миграция с резервной копией
.\scripts\migrate-to-new-system.ps1

# Тестовый запуск (без изменений)
.\scripts\migrate-to-new-system.ps1 -DryRun

# Принудительная миграция (перезаписать существующие файлы)
.\scripts\migrate-to-new-system.ps1 -Force
```

### 2. Проверить результат
```powershell
# Проверить статус новой системы
.\scripts\deployment-manager.ps1 -ProjectName "TestProject" -Action status

# Проверить архив старой системы
Get-ChildItem ".legacy" -Recurse
```

## 🔧 Ручная миграция

### Шаг 1: Создать резервную копию
```powershell
$backupDate = Get-Date -Format "yyyyMMdd-HHmmss"
Copy-Item -Path "." -Destination "F:\ProjectsAI\ManagerAgentAI-Backup-$backupDate" -Recurse
```

### Шаг 2: Архивировать старую систему
```powershell
# Создать папку архива
mkdir ".legacy"

# Переместить старые папки
Move-Item ".automation" ".legacy\automation" -Force
Move-Item ".manager" ".legacy\manager" -Force
```

### Шаг 3: Проверить новую систему
```powershell
# Проверить наличие новых скриптов
Test-Path "scripts\deployment-manager.ps1"
Test-Path "scripts\deploy-to-prom.ps1"
Test-Path "scripts\deploy-to-prod.ps1"
```

### Шаг 4: Мигрировать проекты
```powershell
# Найти существующие проекты
$projects = Get-ChildItem "F:\ProjectsAI" -Directory | Where-Object { $_.Name -ne "ManagerAgentAI" }

# Для каждого проекта
foreach ($project in $projects) {
    Write-Host "Migrating: $($project.Name)"
    # Проекты уже в правильном месте (F:\ProjectsAI)
}
```

## 📋 Что изменилось

### ❌ Старая система
```
ManagerAgentAI/
├── .automation/          # → .legacy/automation/
├── .manager/             # → .legacy/manager/
└── scripts/              # Остались
```

### ✅ Новая система
```
ManagerAgentAI/
├── .legacy/              # Архив старой системы
├── scripts/              # Новые скрипты деплоя
│   ├── deploy-to-prom.ps1
│   ├── deploy-to-prod.ps1
│   └── deployment-manager.ps1
├── config/               # Конфигурация
└── docs/deployment/      # Документация
```

## 🔄 Новый workflow

### Вместо старого:
```powershell
# Старый способ (больше не работает)
.\automation\some-script.ps1
.\manager\some-manager.ps1
```

### Используйте новый:
```powershell
# Новый способ
.\scripts\deployment-manager.ps1 -ProjectName "MyProject" -Action all
.\scripts\deploy-to-prom.ps1 -ProjectName "MyProject" -SourcePath "F:\ProjectsAI\MyProject"
.\scripts\deploy-to-prod.ps1 -ProjectName "MyProject" -Server "u0488409@37.140.195.19"
```

## 🚨 Важные замечания

### ✅ Что сохранилось
- Все ваши проекты в `F:\ProjectsAI\`
- Все данные из старой системы в `.legacy/`
- Резервная копия создана автоматически

### ⚠️ Что изменилось
- Скрипты управления проектом
- Структура папок
- Команды для деплоя

### 🔄 Как вернуться к старой системе
```powershell
# Восстановить из архива
Move-Item ".legacy\automation" ".automation" -Force
Move-Item ".legacy\manager" ".manager" -Force
```

## 📚 Дополнительная информация

- **Полное руководство:** [Migration-Guide-Old-to-New.md](Migration-Guide-Old-to-New.md)
- **Новая система:** [DEV-PROM-PROD-Workflow.md](../deployment/DEV-PROM-PROD-Workflow.md)
- **Инструкции:** [Deployment-Instructions.md](../deployment/Deployment-Instructions.md)

---

**Время миграции:** ~5 минут  
**Сложность:** Простая (автоматическая)  
**Риск:** Минимальный (с резервной копией)
