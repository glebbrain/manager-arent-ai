# ⚙️ Конфигурация системы управления проектом v4.8

## 📋 Обзор

Система использует централизованную конфигурацию для всех настроек деплоя, путей и соединений. Все хардкод значения вынесены в конфигурационные файлы.

## 📁 **Файлы конфигурации:**

| Файл | Описание | Расположение |
|------|----------|--------------|
| `deployment-config.json` | **Основная конфигурация деплоя** | Корень проекта |
| `DeploymentConfig.psm1` | **PowerShell модуль** | `.automation\config\` |
| `smart-copy-config.json` | **Конфигурация умного копирования** | `.automation\config\` |
| `ai-features-config.json` | **Конфигурация AI функций** | `.automation\config\` |

---

## ⚙️ **deployment-config.json - Основная конфигурация**

### **Структура конфигурации:**

```json
{
  "environments": {
    "dev": {
      "name": "Development",
      "path": ".",
      "enabled": true
    },
    "prom": {
      "name": "PROM",
      "path": "G:\\OSPanel\\home",
      "enabled": true
    },
    "prod": {
      "name": "PROD",
      "server": "u0488409@37.140.195.19",
      "path": "/var/www/u0488409/data/www",
      "enabled": true
    }
  },
  "deployment": {
    "archivePath": ".\\deploy-archives",
    "backupEnabled": true,
    "excludePatterns": ["node_modules", ".git", "*.log"]
  }
}
```

### **Настройка сред:**

#### **DEV среда (разработка):**
```json
"dev": {
  "name": "Development",
  "description": "Среда разработки",
  "path": ".",
  "enabled": true
}
```

#### **PROM среда (тестирование):**
```json
"prom": {
  "name": "PROM",
  "description": "Промежуточная среда для тестирования",
  "path": "G:\\OSPanel\\home",
  "enabled": true
}
```

#### **PROD среда (продакшн):**
```json
"prod": {
  "name": "PROD",
  "description": "Продакшн среда",
  "server": "u0488409@37.140.195.19",
  "path": "/var/www/u0488409/data/www",
  "enabled": true
}
```

### **Настройка деплоя:**

```json
"deployment": {
  "archivePath": ".\\deploy-archives",
  "backupEnabled": true,
  "backupSuffix": "backup",
  "timestampFormat": "yyyy-MM-dd-HH-mm-ss",
  "maxBackups": 5,
  "compressionEnabled": true,
  "excludePatterns": [
    "node_modules",
    ".git",
    ".vs",
    "bin",
    "obj",
    "dist",
    "build",
    "*.log",
    "*.tmp",
    ".DS_Store",
    "Thumbs.db"
  ]
}
```

### **Настройка SSH:**

```json
"ssh": {
  "timeout": 10,
  "batchMode": true,
  "keyPath": "",
  "knownHosts": ""
}
```

### **Настройка логирования:**

```json
"logging": {
  "enabled": true,
  "level": "INFO",
  "file": "deployment.log",
  "maxSize": "10MB",
  "maxFiles": 5
}
```

---

## 🔧 **DeploymentConfig.psm1 - PowerShell модуль**

### **Основные функции:**

| Функция | Описание | Пример |
|---------|----------|--------|
| `Import-DeploymentConfig` | Загружает конфигурацию | `Import-DeploymentConfig` |
| `Get-EnvironmentPath` | Получает путь среды | `Get-EnvironmentPath -Environment "prom"` |
| `Get-EnvironmentServer` | Получает сервер среды | `Get-EnvironmentServer -Environment "prod"` |
| `Get-ArchivePath` | Получает путь для архивов | `Get-ArchivePath` |
| `Get-ExcludePatterns` | Получает паттерны исключений | `Get-ExcludePatterns` |
| `Test-EnvironmentPath` | Проверяет существование пути | `Test-EnvironmentPath -Environment "prom"` |
| `Test-SSHConnection` | Проверяет SSH соединение | `Test-SSHConnection -Environment "prod"` |

### **Использование в скриптах:**

```powershell
# Импорт модуля
Import-Module -Name ".\automation\config\DeploymentConfig.psm1" -Force

# Получение пути PROM среды
$PROM_PATH = Get-EnvironmentPath -Environment "prom"

# Получение сервера PROD
$Server = Get-EnvironmentServer -Environment "prod"

# Получение пути для архивов
$ArchivePath = Get-ArchivePath

# Проверка SSH соединения
if (Test-SSHConnection -Environment "prod") {
    Write-Host "SSH соединение работает" -ForegroundColor Green
}
```

---

## 🎯 **Преимущества централизованной конфигурации:**

### **✅ Удобство управления:**
- Все настройки в одном месте
- Легко изменить сервер или путь
- Нет необходимости редактировать каждый скрипт

### **✅ Безопасность:**
- Конфиденциальные данные в конфигурации
- Легко исключить из системы контроля версий
- Разные конфигурации для разных сред

### **✅ Гибкость:**
- Переопределение параметров через командную строку
- Разные конфигурации для разных проектов
- Легкое добавление новых сред

### **✅ Масштабируемость:**
- Добавление новых серверов и сред
- Настройка для разных команд
- Централизованное управление

---

## 📝 **Примеры настройки:**

### **1. Изменение сервера PROD:**
```json
"prod": {
  "server": "new-server@192.168.1.100",
  "path": "/var/www/new-project"
}
```

### **2. Добавление новой среды:**
```json
"staging": {
  "name": "STAGING",
  "server": "staging@staging.example.com",
  "path": "/var/www/staging",
  "enabled": true
}
```

### **3. Настройка исключений:**
```json
"excludePatterns": [
  "node_modules",
  ".git",
  "*.log",
  "temp",
  "cache"
]
```

### **4. Настройка SSH:**
```json
"ssh": {
  "timeout": 30,
  "batchMode": true,
  "keyPath": "C:\\Users\\User\\.ssh\\id_rsa",
  "knownHosts": "C:\\Users\\User\\.ssh\\known_hosts"
}
```

---

## 🔧 **Устранение проблем:**

### **Проблема: "Конфигурация не загружается"**
```powershell
# Проверьте путь к файлу
Test-Path ".\deployment-config.json"

# Проверьте синтаксис JSON
Get-Content ".\deployment-config.json" | ConvertFrom-Json
```

### **Проблема: "Среда не найдена"**
```json
// Проверьте правильность имени среды
"environments": {
  "prom": { ... },  // Правильно
  "PROM": { ... }   // Неправильно - регистр важен
}
```

### **Проблема: "SSH соединение не работает"**
```powershell
# Проверьте SSH соединение
Test-SSHConnection -Environment "prod"

# Проверьте настройки SSH
Get-SSHConfig
```

---

## 📞 **Поддержка:**

При возникновении проблем:
1. Проверьте синтаксис JSON в конфигурации
2. Убедитесь, что все пути существуют
3. Проверьте SSH ключи и доступы
4. Используйте функции модуля для диагностики

---

**Централизованная конфигурация упрощает управление системой!** ⚙️✨
