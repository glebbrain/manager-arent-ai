# 🧠 Умное копирование для start-v4.8

## 📋 Обзор

Система умного копирования предотвращает поломку существующих проектов при обновлении до v4.8, используя интеллектуальное слияние файлов и исключения.

## 🎯 **Проблема, которую решает:**

- ❌ **Перезапись TODO.md** - теряются текущие задачи
- ❌ **Перезапись IDEA.md** - теряются идеи разработки  
- ❌ **Перезапись .manager/start.md** - теряется прогресс проекта
- ❌ **Перезапись конфигураций** - ломается настройка проекта

## ✅ **Решение:**

- ✅ **Умное слияние** - добавляет новое содержимое в конец файлов
- ✅ **Исключения** - не копирует критичные файлы проекта
- ✅ **Резервные копии** - создает бэкапы перед изменениями
- ✅ **Конфигурация** - настраиваемые правила копирования

---

## 🚀 **Быстрый старт**

### **1. Простой запуск:**
```cmd
# Через batch-файл
.\.automation\scripts\start-smart.bat

# Или через PowerShell
.\.automation\scripts\start-v4.8-config.ps1
```

### **2. С параметрами:**
```cmd
# С указанием исходного пути
.\.automation\scripts\start-smart.bat F:\ProjectsAI\ManagerAgentAI

# С принудительной заменой
.\.automation\scripts\start-smart.bat F:\ProjectsAI\ManagerAgentAI -Force

# Тестовый режим (без изменений)
.\.automation\scripts\start-smart.bat F:\ProjectsAI\ManagerAgentAI -DryRun
```

### **3. Через PowerShell:**
```powershell
# Базовый запуск
.\.automation\scripts\start-v4.8-config.ps1 -SourcePath "F:\ProjectsAI\ManagerAgentAI"

# С принудительной заменой
.\.automation\scripts\start-v4.8-config.ps1 -SourcePath "F:\ProjectsAI\ManagerAgentAI" -Force

# Тестовый режим
.\.automation\scripts\start-v4.8-config.ps1 -SourcePath "F:\ProjectsAI\ManagerAgentAI" -DryRun

# Подробный вывод
.\.automation\scripts\start-v4.8-config.ps1 -SourcePath "F:\ProjectsAI\ManagerAgentAI" -Verbose
```

---

## ⚙️ **Конфигурация**

### **Файл конфигурации: `start-smart-config.json`**

**💡 Все настройки теперь в централизованной конфигурации!**

```json
{
  "source": {
    "defaultPath": "${workspaceFolder}"
  },
  "excludeFiles": [
    "TODO.md",
    "IDEA.md", 
    "COMPLETED.md",
    "ERRORS.md",
    "README.md",
    "package.json",
    "node_modules",
    ".git"
  ],
  "mergeFiles": {
    ".manager/start.md": {
      "type": "append",
      "separator": "# === ДОБАВЛЕНО ИЗ v4.8 ===",
      "enabled": true
    }
  },
  "replaceFiles": {
    "cursor.json": {
      "backup": true,
      "enabled": true
    }
  },
  "backupSettings": {
    "enabled": true,
    "suffix": "backup"
  }
}
```

### **Настройка исключений:**

Добавьте файлы в `excludeFiles` для исключения из копирования:
```json
"excludeFiles": [
  "TODO.md",           // Не копировать
  "IDEA.md",           // Не копировать
  "my-config.json",    // Не копировать
  "*.log"              // Не копировать логи
]
```

### **Настройка слияния:**

Настройте правила слияния в `mergeFiles`:
```json
"mergeFiles": {
  ".manager/start.md": {
    "type": "append",                    // Добавить в конец
    "separator": "# === ДОБАВЛЕНО ==="  // Разделитель
  },
  ".manager/control-files/TODO.md": {
    "type": "prepend",                   // Добавить в начало
    "separator": "# === НОВЫЕ ЗАДАЧИ ==="
  }
}
```

### **Настройка замены:**

Настройте файлы для замены в `replaceFiles`:
```json
"replaceFiles": {
  "cursor.json": {
    "backup": true,     // Создать резервную копию
    "description": "Конфигурация Cursor IDE"
  }
}
```

---

## 📊 **Типы слияния**

| Тип | Описание | Пример |
|-----|----------|--------|
| `append` | Добавить в конец файла | Новое содержимое в конец |
| `prepend` | Добавить в начало файла | Новое содержимое в начало |
| `replace` | Заменить файл полностью | Полная замена |

---

## 🔧 **Параметры скриптов**

### **start-v4.8-config.ps1:**
```powershell
.\start-v4.8-config.ps1 -SourcePath "F:\ProjectsAI\ManagerAgentAI" -ConfigFile ".\smart-copy-config.json" -Force -Backup -Verbose -DryRun
```

**Параметры:**
- `-SourcePath` - Исходный путь (по умолчанию: "F:\ProjectsAI\ManagerAgentAI")
- `-ConfigFile` - Файл конфигурации (по умолчанию: ".\smart-copy-config.json")
- `-Force` - Принудительная замена файлов
- `-Backup` - Создание резервных копий (по умолчанию: true)
- `-Verbose` - Подробный вывод
- `-DryRun` - Тестовый режим (без изменений)

### **start-v4.8-smart.ps1:**
```powershell
.\start-v4.8-smart.ps1 -SourcePath "F:\ProjectsAI\ManagerAgentAI" -Force -Backup -Verbose
```

**Параметры:**
- `-SourcePath` - Исходный путь (по умолчанию: "F:\ProjectsAI\ManagerAgentAI")
- `-Force` - Принудительная замена файлов
- `-Backup` - Создание резервных копий (по умолчанию: true)
- `-Verbose` - Подробный вывод

---

## 📁 **Структура файлов**

```
project/
├── start-v4.8-config.ps1      # Основной скрипт с конфигурацией
├── start-v4.8-smart.ps1       # Упрощенный скрипт
├── start-smart.bat            # Batch-файл для Windows
├── smart-copy-config.json     # Конфигурация копирования
└── SMART-COPY-README.md       # Документация
```

---

## 🎯 **Примеры использования**

### **1. Безопасное обновление:**
```cmd
# Тестовый режим - посмотреть что будет изменено
start-smart.bat F:\ProjectsAI\ManagerAgentAI -DryRun

# Применить изменения
start-smart.bat F:\ProjectsAI\ManagerAgentAI
```

### **2. Принудительное обновление:**
```cmd
# Заменить все файлы, включая конфигурации
start-smart.bat F:\ProjectsAI\ManagerAgentAI -Force
```

### **3. Обновление с резервными копиями:**
```cmd
# Создать резервные копии всех изменяемых файлов
start-smart.bat F:\ProjectsAI\ManagerAgentAI -Backup
```

---

## ⚠️ **Важные замечания**

### **1. Файлы, которые НЕ копируются:**
- `TODO.md` - ваши текущие задачи
- `IDEA.md` - ваши идеи разработки
- `COMPLETED.md` - завершенные задачи
- `ERRORS.md` - ошибки проекта
- `README.md` - документация проекта
- `package.json` - зависимости проекта
- `node_modules` - установленные пакеты
- `.git` - история версий

### **2. Файлы, которые слияются:**
- `.manager/start.md` - добавляется в конец
- `.manager/control-files/*.md` - добавляется в конец

### **3. Файлы, которые заменяются (с -Force):**
- `cursor.json` - конфигурация IDE
- `.automation/scripts/*.ps1` - скрипты автоматизации

### **4. Резервные копии:**
- Создаются с timestamp
- Сохраняются рядом с оригинальными файлами
- Формат: `filename.backup.YYYY-MM-DD-HH-mm-ss`

---

## 🔧 **Устранение проблем**

### **Проблема: "Конфигурация не загружается"**
```json
// Проверьте синтаксис JSON в smart-copy-config.json
{
  "excludeFiles": ["TODO.md"],
  "mergeFiles": {
    ".manager/start.md": {
      "type": "append"
    }
  }
}
```

### **Проблема: "Файл не исключается"**
```json
// Добавьте паттерн в excludeFiles
"excludeFiles": [
  "TODO.md",
  "my-file.txt",
  "*.log"
]
```

### **Проблема: "Слияние не работает"**
```json
// Проверьте настройки mergeFiles
"mergeFiles": {
  ".manager/start.md": {
    "type": "append",
    "separator": "# === ДОБАВЛЕНО ИЗ v4.8 ==="
  }
}
```

---

## 📞 **Поддержка**

При возникновении проблем:
1. Используйте `-DryRun` для проверки изменений
2. Проверьте конфигурацию в `smart-copy-config.json`
3. Используйте `-Verbose` для подробного вывода
4. Проверьте резервные копии

---

**Умное копирование защищает ваш проект от поломки!** 🧠✨
