# 🚀 Инструкции по использованию системы DEV->PROM->PROD

**Версия:** 1.0  
**Дата:** 2025-01-31  
**Статус:** Production Ready  

## 📋 Обзор

Данный документ содержит подробные инструкции по использованию системы развертывания проектов DEV->PROM->PROD.

## 🔧 Принцип работы

### 0. Текущий принцип работы (DEV->PROM->PROD):

#### 0.1. Разработка в DEV:
- **Путь:** `F:\ProjectsAI`
- **Назначение:** Основная среда разработки
- **Функции:**
  - Создание и разработка проектов
  - Тестирование кода
  - Отладка и исправление ошибок
  - Версионирование через Git

#### 0.2. Локальное тестирование в PROM:
- **Путь:** `G:\OSPanel\home`
- **Назначение:** Локальная среда тестирования
- **Функции:**
  - Создание отдельной папки для каждого проекта
  - Полное тестирование функциональности
  - Проверка совместимости
  - Подготовка к продакшн развертыванию

#### 0.3. Вывод в PROD:
- **Сервер:** `ssh 'u0488409@37.140.195.19'`
- **Путь:** `/var/www/u0488409/data/www`
- **Назначение:** Продакшн среда
- **Функции:**
  - Создание папок по имени проекта
  - Развертывание готовых проектов
  - Мониторинг и поддержка
  - Резервное копирование

## 🚀 Команды для работы

### 1. Универсальный менеджер деплоя

```powershell
# Полный workflow: DEV -> PROM -> PROD
.\scripts\deployment-manager.ps1 -ProjectName "MyProject" -Action all

# Отдельные этапы
.\scripts\deployment-manager.ps1 -ProjectName "MyProject" -Action prom    # DEV -> PROM
.\scripts\deployment-manager.ps1 -ProjectName "MyProject" -Action prod    # PROM -> PROD
.\scripts\deployment-manager.ps1 -ProjectName "MyProject" -Action status  # Проверка статуса
```

### 2. Прямые скрипты деплоя

```powershell
# Деплой в PROM среду
.\scripts\deploy-to-prom.ps1 -ProjectName "MyProject" -SourcePath "F:\ProjectsAI\MyProject"

# Деплой в PROD среду
.\scripts\deploy-to-prod.ps1 -ProjectName "MyProject" -Server "u0488409@37.140.195.19"
```

### 3. Проверка статуса

```powershell
# Проверка статуса всех сред
.\scripts\deployment-manager.ps1 -ProjectName "MyProject" -Action status

# Проверка SSH соединения
ssh u0488409@37.140.195.19 "echo 'Connection test'"
```

## 📁 Структура директорий

### DEV Environment (F:\ProjectsAI)
```
F:\ProjectsAI\
├── ManagerAgentAI\          # Основной проект
├── MyProject\               # Ваш проект
│   ├── src\
│   ├── tests\
│   ├── config\
│   └── package.json
└── ...
```

### PROM Environment (G:\OSPanel\home)
```
G:\OSPanel\home\
├── MyProject\               # Папка проекта для тестирования
│   ├── src\
│   ├── tests\
│   ├── config\
│   ├── package.json
│   ├── prom-config.json
│   └── DEPLOYMENT-INFO.md
└── ...
```

### PROD Environment (37.140.195.19)
```
/var/www/u0488409/data/www/
├── myproject\               # Папка проекта в продакшн
│   ├── src\
│   ├── tests\
│   ├── config\
│   ├── package.json
│   ├── prod-config.json
│   └── PROD-DEPLOYMENT-INFO.md
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

## 📋 Примеры использования

### Пример 1: Создание нового проекта

```powershell
# 1. Создать проект в DEV
mkdir "F:\ProjectsAI\MyNewProject"
cd "F:\ProjectsAI\MyNewProject"

# 2. Разработать проект
# ... разработка ...

# 3. Деплой в PROM для тестирования
.\scripts\deploy-to-prom.ps1 -ProjectName "MyNewProject" -SourcePath "F:\ProjectsAI\MyNewProject"

# 4. Тестирование в PROM
cd "G:\OSPanel\home\MyNewProject"
# ... тестирование ...

# 5. Деплой в PROD
.\scripts\deploy-to-prod.ps1 -ProjectName "MyNewProject" -Server "u0488409@37.140.195.19"
```

### Пример 2: Обновление существующего проекта

```powershell
# 1. Обновить код в DEV
# ... изменения в F:\ProjectsAI\MyProject ...

# 2. Деплой в PROM
.\scripts\deploy-to-prom.ps1 -ProjectName "MyProject" -SourcePath "F:\ProjectsAI\MyProject" -Force

# 3. Тестирование
# ... тестирование в G:\OSPanel\home\MyProject ...

# 4. Деплой в PROD
.\scripts\deploy-to-prod.ps1 -ProjectName "MyProject" -Server "u0488409@37.140.195.19"
```

### Пример 3: Проверка статуса

```powershell
# Проверить статус всех сред
.\scripts\deployment-manager.ps1 -ProjectName "MyProject" -Action status

# Результат покажет:
# - DEV: существует ли проект в F:\ProjectsAI\MyProject
# - PROM: существует ли проект в G:\OSPanel\home\MyProject
# - PROD: существует ли проект на сервере
```

## 🛠️ Устранение неполадок

### Проблема: SSH соединение не работает
```powershell
# Проверить соединение
ssh u0488409@37.140.195.19 "echo 'Test'"

# Если не работает, проверить:
# 1. SSH ключи
# 2. Доступность сервера
# 3. Настройки файрвола
```

### Проблема: Ошибки копирования файлов
```powershell
# Проверить права доступа
# Проверить свободное место на диске
# Проверить целостность файлов
```

### Проблема: PROM деплой не работает
```powershell
# Проверить существование PROM директории
Test-Path "G:\OSPanel\home"

# Создать если не существует
mkdir "G:\OSPanel\home" -Force
```

## 📊 Мониторинг и логирование

### Логи развертывания
- **DEV:** `F:\ProjectsAI\logs\deployment-dev.log`
- **PROM:** `F:\ProjectsAI\logs\deployment-prom.log`
- **PROD:** `F:\ProjectsAI\logs\deployment-prod.log`
- **Manager:** `F:\ProjectsAI\logs\deployment-manager.log`

### Статус файлы
- **Status:** `F:\ProjectsAI\logs\deployment-status-{ProjectName}.json`

### Проверка логов
```powershell
# Просмотр последних логов
Get-Content "F:\ProjectsAI\logs\deployment-prom.log" -Tail 20
Get-Content "F:\ProjectsAI\logs\deployment-prod.log" -Tail 20
```

## 🔒 Безопасность

### SSH ключи
- Использование SSH ключей для аутентификации
- Ограничение доступа по IP адресам
- Регулярная ротация ключей

### Резервное копирование
- Автоматическое резервное копирование перед развертыванием
- Хранение резервных копий в отдельной директории
- Восстановление из резервных копий при необходимости

## 📚 Дополнительные ресурсы

- [DEV-PROM-PROD Workflow](DEV-PROM-PROD-Workflow.md)
- [Deployment Configuration](deployment-config.json)
- [Troubleshooting Guide](Troubleshooting-Guide.md)
- [Security Best Practices](Security-Best-Practices.md)

---

**Последнее обновление:** 2025-01-31  
**Версия документа:** 1.0  
**Статус:** Production Ready
