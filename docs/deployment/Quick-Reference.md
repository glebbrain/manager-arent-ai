# 🚀 Quick Reference - DEV->PROM->PROD Deployment

## 📋 Основные команды

### Универсальный менеджер
```powershell
# Полный workflow
.\scripts\deployment-manager.ps1 -ProjectName "MyProject" -Action all

# Отдельные этапы
.\scripts\deployment-manager.ps1 -ProjectName "MyProject" -Action prom
.\scripts\deployment-manager.ps1 -ProjectName "MyProject" -Action prod
.\scripts\deployment-manager.ps1 -ProjectName "MyProject" -Action status
```

### Прямые скрипты
```powershell
# PROM деплой
.\scripts\deploy-to-prom.ps1 -ProjectName "MyProject" -SourcePath "F:\ProjectsAI\MyProject"

# PROD деплой
.\scripts\deploy-to-prod.ps1 -ProjectName "MyProject" -Server "u0488409@37.140.195.19"
```

## 🏗️ Пути сред

| Среда | Путь | Назначение |
|-------|------|------------|
| **DEV** | `F:\ProjectsAI` | Разработка |
| **PROM** | `G:\OSPanel\home` | Локальное тестирование |
| **PROD** | `ssh u0488409@37.140.195.19` | Продакшн |
| **PROD Path** | `/var/www/u0488409/data/www` | Папка проектов на сервере |

## 🔧 Workflow

1. **DEV** → Разработка в `F:\ProjectsAI\{ProjectName}`
2. **PROM** → Тестирование в `G:\OSPanel\home\{ProjectName}`
3. **PROD** → Развертывание на `u0488409@37.140.195.19`

## 📊 Проверка статуса

```powershell
# Статус всех сред
.\scripts\deployment-manager.ps1 -ProjectName "MyProject" -Action status

# SSH тест
ssh u0488409@37.140.195.19 "echo 'Test'"
```

## 🛠️ Параметры

### deployment-manager.ps1
- `-ProjectName` - Имя проекта (обязательно)
- `-Action` - Действие: dev, prom, prod, all, status
- `-SourcePath` - Путь к исходникам (по умолчанию: F:\ProjectsAI)
- `-PROM_PATH` - Путь PROM среды (по умолчанию: G:\OSPanel\home)
- `-PROD_SERVER` - PROD сервер (по умолчанию: u0488409@37.140.195.19)
- `-PROD_PATH` - Путь на PROD сервере (по умолчанию: /var/www/u0488409/data/www)
- `-Force` - Принудительная перезапись
- `-Backup` - Создание резервных копий
- `-DryRun` - Тестовый запуск без изменений

## 📁 Логи

- **PROM:** `F:\ProjectsAI\logs\deployment-prom.log`
- **PROD:** `F:\ProjectsAI\logs\deployment-prod.log`
- **Manager:** `F:\ProjectsAI\logs\deployment-manager.log`
- **Status:** `F:\ProjectsAI\logs\deployment-status-{ProjectName}.json`

## 🚨 Устранение неполадок

### SSH не работает
```powershell
ssh u0488409@37.140.195.19 "echo 'Test'"
```

### PROM деплой не работает
```powershell
Test-Path "G:\OSPanel\home"
mkdir "G:\OSPanel\home" -Force
```

### Проверка логов
```powershell
Get-Content "F:\ProjectsAI\logs\deployment-prom.log" -Tail 20
```

## 📚 Документация

- [Полные инструкции](Deployment-Instructions.md)
- [Workflow документация](DEV-PROM-PROD-Workflow.md)
- [Конфигурация](deployment-config.json)
