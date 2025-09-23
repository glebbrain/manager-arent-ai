# 🔄 DEV->PROM->PROD Workflow Documentation

**Версия:** 1.0  
**Дата:** 2025-01-31  
**Статус:** Production Ready  

## 📋 Обзор

Данный документ описывает принцип работы системы разработки и развертывания проектов с использованием трехэтапного процесса: DEV (разработка) → PROM (локальное тестирование) → PROD (продакшн).

## 🏗️ Архитектура Workflow

### 0. Принцип работы DEV->PROM->PROD

#### 0.1. Разработка в DEV
- **Путь:** `F:\ProjectsAI`
- **Назначение:** Основная среда разработки
- **Функции:**
  - Создание и разработка проектов
  - Тестирование кода
  - Отладка и исправление ошибок
  - Версионирование через Git

#### 0.2. Локальное тестирование в PROM
- **Путь:** `G:\OSPanel\home`
- **Назначение:** Локальная среда тестирования
- **Функции:**
  - Создание отдельной папки для каждого проекта
  - Полное тестирование функциональности
  - Проверка совместимости
  - Подготовка к продакшн развертыванию

#### 0.3. Вывод в PROD
- **Сервер:** `ssh 'u0488409@37.140.195.19'`
- **Путь:** `/var/www/u0488409/data/www`
- **Назначение:** Продакшн среда
- **Функции:**
  - Создание папок по имени проекта
  - Развертывание готовых проектов
  - Мониторинг и поддержка
  - Резервное копирование

## 🚀 Процесс развертывания

### Этап 1: Разработка (DEV)
```powershell
# Рабочая директория
cd F:\ProjectsAI

# Создание нового проекта
.\scripts\create-project.ps1 -ProjectName "MyProject" -Type "nodejs"

# Разработка и тестирование
.\scripts\dev-workflow.ps1 -ProjectName "MyProject"
```

### Этап 2: Локальное тестирование (PROM)
```powershell
# Копирование в PROM среду
.\scripts\deploy-to-prom.ps1 -ProjectName "MyProject" -SourcePath "F:\ProjectsAI\MyProject"

# Тестирование в PROM
.\scripts\test-prom-environment.ps1 -ProjectName "MyProject"
```

### Этап 3: Продакшн развертывание (PROD)
```powershell
# Развертывание на сервер
.\scripts\deploy-to-prod.ps1 -ProjectName "MyProject" -Server "u0488409@37.140.195.19"
```

## 📁 Структура директорий

### DEV Environment (F:\ProjectsAI)
```
F:\ProjectsAI\
├── ManagerAgentAI\          # Основной проект
├── Project1\                # Проект 1
├── Project2\                # Проект 2
└── ...
```

### PROM Environment (G:\OSPanel\home)
```
G:\OSPanel\home\
├── MyProject\               # Папка проекта для тестирования
│   ├── src\
│   ├── tests\
│   └── config\
├── AnotherProject\
└── ...
```

### PROD Environment (37.140.195.19)
```
/var/www/u0488409/data/www/
├── myproject\               # Папка проекта в продакшн
│   ├── public\
│   ├── config\
│   └── logs\
├── anotherproject\
└── ...
```

## 🔧 Конфигурация

### Переменные окружения
```env
# DEV Environment
DEV_PATH=F:\ProjectsAI
DEV_PROJECTS_PATH=F:\ProjectsAI

# PROM Environment  
PROM_PATH=G:\OSPanel\home
PROM_PROJECTS_PATH=G:\OSPanel\home

# PROD Environment
PROD_SERVER=u0488409@37.140.195.19
PROD_PATH=/var/www/u0488409/data/www
PROD_PROJECTS_PATH=/var/www/u0488409/data/www
```

### SSH Конфигурация
```ssh
Host prod-server
    HostName 37.140.195.19
    User u0488409
    Port 22
    IdentityFile ~/.ssh/id_rsa
```

## 📋 Скрипты автоматизации

### 1. Скрипт развертывания в PROM
```powershell
# scripts/deploy-to-prom.ps1
param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectName,
    [Parameter(Mandatory=$true)]
    [string]$SourcePath
)

# Копирование проекта в PROM среду
$PROM_PATH = "G:\OSPanel\home"
$TargetPath = Join-Path $PROM_PATH $ProjectName

# Создание папки проекта
if (-not (Test-Path $TargetPath)) {
    New-Item -ItemType Directory -Path $TargetPath -Force
}

# Копирование файлов
Copy-Item -Path "$SourcePath\*" -Destination $TargetPath -Recurse -Force

Write-Host "✅ Проект $ProjectName успешно развернут в PROM среду" -ForegroundColor Green
```

### 2. Скрипт развертывания в PROD
```powershell
# scripts/deploy-to-prod.ps1
param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectName,
    [Parameter(Mandatory=$true)]
    [string]$Server
)

$PROD_PATH = "/var/www/u0488409/data/www"
$PROM_PATH = "G:\OSPanel\home\$ProjectName"

# Проверка существования PROM версии
if (-not (Test-Path $PROM_PATH)) {
    Write-Error "❌ PROM версия проекта $ProjectName не найдена в $PROM_PATH"
    exit 1
}

# Создание папки на сервере
ssh $Server "mkdir -p $PROD_PATH/$ProjectName"

# Синхронизация файлов
rsync -avz --delete $PROM_PATH/ $Server`:$PROD_PATH/$ProjectName/

Write-Host "✅ Проект $ProjectName успешно развернут в PROD среду" -ForegroundColor Green
```

## 🔍 Мониторинг и логирование

### Логи развертывания
- **DEV:** `F:\ProjectsAI\logs\deployment-dev.log`
- **PROM:** `G:\OSPanel\home\logs\deployment-prom.log`
- **PROD:** `/var/www/u0488409/data/www/logs/deployment-prod.log`

### Мониторинг статуса
```powershell
# Проверка статуса всех сред
.\scripts\check-deployment-status.ps1 -ProjectName "MyProject"
```

## 🛡️ Безопасность

### SSH ключи
- Использование SSH ключей для аутентификации
- Ограничение доступа по IP адресам
- Регулярная ротация ключей

### Резервное копирование
- Автоматическое резервное копирование перед развертыванием
- Хранение резервных копий в отдельной директории
- Восстановление из резервных копий при необходимости

## 📊 Отчетность

### Статистика развертываний
- Количество успешных развертываний
- Время выполнения развертывания
- Ошибки и их исправление
- Использование ресурсов

### Дашборд мониторинга
- Статус всех сред (DEV/PROM/PROD)
- Активные проекты
- Последние развертывания
- Предупреждения и ошибки

## 🚨 Устранение неполадок

### Частые проблемы
1. **SSH соединение не работает**
   - Проверить SSH ключи
   - Проверить доступность сервера
   - Проверить настройки файрвола

2. **Ошибки копирования файлов**
   - Проверить права доступа
   - Проверить свободное место на диске
   - Проверить целостность файлов

3. **Проблемы с правами доступа**
   - Проверить права на папки
   - Проверить владельца файлов
   - Исправить права доступа

## 📚 Дополнительные ресурсы

- [SSH Configuration Guide](SSH-Configuration.md)
- [Deployment Scripts Reference](Deployment-Scripts-Reference.md)
- [Troubleshooting Guide](Troubleshooting-Guide.md)
- [Security Best Practices](Security-Best-Practices.md)

---

**Последнее обновление:** 2025-01-31  
**Версия документа:** 1.0  
**Статус:** Production Ready
