# 🧠 Конфигурация умного копирования v4.8

## 📋 Обзор

Система умного копирования использует централизованную конфигурацию для всех настроек копирования, слияния файлов и исключений.

## 📁 **Файлы конфигурации:**

| Файл | Описание | Расположение |
|------|----------|--------------|
| `start-smart-config.json` | **Основная конфигурация** | Корень проекта |
| `SmartCopyConfig.psm1` | **PowerShell модуль** | `.automation\config\` |

---

## ⚙️ **start-smart-config.json - Основная конфигурация**

### **Структура конфигурации:**

```json
{
  "source": {
    "defaultPath": "${workspaceFolder}"
  },
  "excludeFiles": [...],
  "mergeFiles": {...},
  "replaceFiles": {...},
  "backupSettings": {...},
  "mergeSettings": {...}
}
```

### **Настройка исходного пути:**

```json
"source": {
  "defaultPath": "${workspaceFolder}",
  "description": "Путь к исходному проекту ManagerAgentAI"
}
```

### **Настройка исключений:**

```json
"excludeFiles": [
  "TODO.md",
  "IDEA.md",
  "COMPLETED.md",
  "ERRORS.md",
  "README.md",
  "package.json",
  "node_modules",
  ".git",
  "*.log",
  "*.tmp"
]
```

### **Настройка слияния файлов:**

```json
"mergeFiles": {
  ".manager/start.md": {
    "type": "append",
    "description": "Добавляет содержимое в конец файла",
    "separator": "# === ДОБАВЛЕНО ИЗ v4.8 ===",
    "enabled": true
  },
  ".manager/control-files/TODO.md": {
    "type": "append",
    "description": "Добавляет задачи в конец файла",
    "separator": "# === ДОБАВЛЕНО ИЗ v4.8 ===",
    "enabled": true
  }
}
```

### **Настройка замены файлов:**

```json
"replaceFiles": {
  "cursor.json": {
    "description": "Заменяет конфигурацию Cursor IDE",
    "backup": true,
    "enabled": true
  },
  ".automation/scripts/New-Aliases-v4.8.ps1": {
    "description": "Заменяет скрипт алиасов",
    "backup": false,
    "enabled": true
  }
}
```

### **Настройки резервного копирования:**

```json
"backupSettings": {
  "enabled": true,
  "suffix": "backup",
  "timestampFormat": "yyyy-MM-dd-HH-mm-ss",
  "maxBackups": 5,
  "description": "Настройки резервного копирования"
}
```

### **Настройки слияния:**

```json
"mergeSettings": {
  "checkDuplicates": true,
  "addSeparator": true,
  "separator": "# === ДОБАВЛЕНО ИЗ v4.8 ===",
  "encoding": "UTF8",
  "description": "Настройки слияния файлов"
}
```

### **Настройки логирования:**

```json
"logging": {
  "enabled": true,
  "level": "INFO",
  "file": "smart-copy.log",
  "maxSize": "10MB",
  "maxFiles": 5,
  "description": "Настройки логирования"
}
```

---

## 🔧 **SmartCopyConfig.psm1 - PowerShell модуль**

### **Основные функции:**

| Функция | Описание | Пример |
|---------|----------|--------|
| `Import-SmartCopyConfig` | Загружает конфигурацию | `Import-SmartCopyConfig` |
| `Get-SourcePath` | Получает исходный путь | `Get-SourcePath` |
| `Get-ExcludeFiles` | Получает список исключений | `Get-ExcludeFiles` |
| `Get-MergeFiles` | Получает настройки слияния | `Get-MergeFiles` |
| `Get-ReplaceFiles` | Получает настройки замены | `Get-ReplaceFiles` |
| `Should-ExcludeFile` | Проверяет исключение файла | `Should-ExcludeFile "TODO.md"` |
| `Get-MergeFileConfig` | Получает конфиг слияния файла | `Get-MergeFileConfig ".manager/start.md"` |

### **Использование в скриптах:**

```powershell
# Импорт модуля
Import-Module -Name ".\automation\config\SmartCopyConfig.psm1" -Force

# Получение исходного пути
$SourcePath = Get-SourcePath

# Получение списка исключений
$ExcludeFiles = Get-ExcludeFiles

# Проверка исключения файла
if (Should-ExcludeFile "TODO.md" $ExcludeFiles) {
    Write-Host "Файл исключен" -ForegroundColor Yellow
}

# Получение конфигурации слияния
$mergeConfig = Get-MergeFileConfig ".manager/start.md"
if ($mergeConfig.enabled) {
    # Выполнить слияние
}
```

---

## 🎯 **Типы слияния файлов**

| Тип | Описание | Пример |
|-----|----------|--------|
| `append` | Добавить в конец файла | Новое содержимое в конец |
| `prepend` | Добавить в начало файла | Новое содержимое в начало |
| `replace` | Заменить файл полностью | Полная замена |

### **Примеры настройки:**

#### **Добавление в конец:**
```json
".manager/start.md": {
  "type": "append",
  "separator": "# === ДОБАВЛЕНО ИЗ v4.8 ===",
  "enabled": true
}
```

#### **Добавление в начало:**
```json
".manager/control-files/README.md": {
  "type": "prepend",
  "separator": "# === НОВАЯ ВЕРСИЯ v4.8 ===",
  "enabled": true
}
```

#### **Полная замена:**
```json
"cursor.json": {
  "type": "replace",
  "backup": true,
  "enabled": true
}
```

---

## ⚙️ **Настройка функций v4.8**

```json
"features": {
  "ai": true,
  "quantum": true,
  "blockchain": true,
  "edge": true,
  "vr": true,
  "ar": true,
  "5g": true,
  "iot": true
}
```

### **Проверка включенных функций:**

```powershell
# Проверка AI функций
if (Get-FeatureEnabled "ai") {
    Write-Host "AI функции включены" -ForegroundColor Green
}

# Проверка Quantum функций
if (Get-FeatureEnabled "quantum") {
    Write-Host "Quantum функции включены" -ForegroundColor Green
}
```

---

## 🔧 **Настройка производительности**

```json
"performance": {
  "parallelCopy": 3,
  "chunkSize": "1MB",
  "retryAttempts": 3,
  "retryDelay": 5
}
```

### **Использование настроек производительности:**

```powershell
$perfSettings = Get-PerformanceSettings
$parallelCount = $perfSettings.parallelCopy
$chunkSize = $perfSettings.chunkSize
```

---

## 🔒 **Настройки безопасности**

```json
"security": {
  "verifyChecksums": true,
  "encryptBackups": false,
  "signFiles": false
}
```

### **Проверка настроек безопасности:**

```powershell
$securitySettings = Get-SecuritySettings
if ($securitySettings.verifyChecksums) {
    # Проверить контрольные суммы
}
```

---

## 📝 **Примеры настройки**

### **1. Изменение исходного пути:**
```json
"source": {
  "defaultPath": "C:\\MyProjects\\ManagerAgentAI"
}
```

### **2. Добавление новых исключений:**
```json
"excludeFiles": [
  "TODO.md",
  "IDEA.md",
  "my-custom-file.txt",
  "*.temp"
]
```

### **3. Настройка нового слияния:**
```json
"mergeFiles": {
  ".manager/custom-file.md": {
    "type": "append",
    "separator": "# === ОБНОВЛЕНО ===",
    "enabled": true
  }
}
```

### **4. Отключение функции:**
```json
"features": {
  "ai": true,
  "quantum": false,
  "blockchain": false
}
```

---

## 🔧 **Устранение проблем**

### **Проблема: "Конфигурация не загружается"**
```powershell
# Проверьте путь к файлу
Test-Path ".\start-smart-config.json"

# Проверьте синтаксис JSON
Get-Content ".\start-smart-config.json" | ConvertFrom-Json
```

### **Проблема: "Файл не исключается"**
```json
// Проверьте паттерн в excludeFiles
"excludeFiles": [
  "TODO.md",        // Правильно
  "*.md",           // Исключит все .md файлы
  "**/temp/**"      // Исключит папки temp
]
```

### **Проблема: "Слияние не работает"**
```json
// Проверьте настройки mergeFiles
"mergeFiles": {
  ".manager/start.md": {
    "type": "append",
    "enabled": true,  // Должно быть true
    "separator": "# === ДОБАВЛЕНО ==="
  }
}
```

---

## 📞 **Поддержка**

При возникновении проблем:
1. Проверьте синтаксис JSON в конфигурации
2. Убедитесь, что все пути существуют
3. Проверьте настройки enabled для функций
4. Используйте функции модуля для диагностики

---

**Централизованная конфигурация упрощает управление умным копированием!** 🧠✨
