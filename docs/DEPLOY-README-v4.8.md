# 🚀 Руководство по деплою v4.8

## 📋 Обзор

Система деплоя v4.8 поддерживает полный workflow **DEV → PROM → PROD** с архивированием проектов в tar формате.

## ⚙️ **Конфигурация**

Все настройки деплоя хранятся в файле `deployment-config.json` в корне проекта:

- **Серверы и пути** - настройки для DEV, PROM, PROD сред
- **SSH соединения** - параметры подключения к удаленным серверам
- **Архивирование** - настройки создания и сжатия архивов
- **Исключения** - файлы и папки, которые не нужно копировать
- **Логирование** - настройки ведения логов

### **Основные настройки:**
```json
{
  "environments": {
    "prom": {
      "path": "G:\\OSPanel\\home"
    },
    "prod": {
      "server": "u0488409@37.140.195.19",
      "path": "/var/www/u0488409/data/www"
    }
  }
}
```

## 🎯 **Доступные скрипты деплоя:**

| Скрипт | Описание | Использование |
|--------|----------|---------------|
| `deploy-prom-v4.8.ps1` | **Деплой в PROM** | Деплой из DEV в PROM среду |
| `deploy-prod-v4.8.ps1` | **Деплой в PROD** | Деплой из PROM в PROD среду |
| `deploy-full-v4.8.ps1` | **Полный workflow** | DEV → PROM → PROD одной командой |
| `deploy-prom.bat` | **Windows Batch PROM** | Простой запуск деплоя в PROM |
| `deploy-prod.bat` | **Windows Batch PROD** | Простой запуск деплоя в PROD |
| `deploy-full.bat` | **Windows Batch Full** | Простой запуск полного workflow |

---

## 🚀 **Быстрый старт**

### **1. Деплой в PROM среду:**
```cmd
# Через batch-файл (Windows)
.\.automation\scripts\deploy-prom.bat MyProject

# Или через PowerShell
.\.automation\scripts\deploy-prom-v4.8.ps1 -ProjectName "MyProject" -SourcePath "."
```

### **2. Деплой в PROD среду:**
```cmd
# Через batch-файл (Windows)
.\.automation\scripts\deploy-prod.bat MyProject

# Или через PowerShell
.\.automation\scripts\deploy-prod-v4.8.ps1 -ProjectName "MyProject"
```

### **3. Полный workflow (РЕКОМЕНДУЕТСЯ):**
```cmd
# Через batch-файл (Windows)
.\.automation\scripts\deploy-full.bat MyProject

# Или через PowerShell
.\.automation\scripts\deploy-full-v4.8.ps1 -ProjectName "MyProject" -SourcePath "."
```

---

## 📁 **Что происходит при деплое:**

### **PROM деплой:**
1. **📦 Архивирование** - Создает tar архив проекта
2. **🗜️ Сжатие** - Сжимает архив gzip
3. **📤 Копирование** - Копирует архив в PROM среду
4. **📦 Извлечение** - Извлекает архив в `G:\OSPanel\home\{ProjectName}`
5. **✅ Проверка** - Проверяет развертывание

### **PROD деплой:**
1. **📦 Архивирование** - Создает tar архив из PROM проекта
2. **🗜️ Сжатие** - Сжимает архив gzip
3. **📤 Копирование** - Копирует архив на сервер через SCP
4. **📦 Извлечение** - Извлекает архив на сервере
5. **🔐 Права доступа** - Устанавливает права доступа
6. **✅ Проверка** - Проверяет развертывание

---

## ⚙️ **Параметры скриптов**

### **deploy-prom-v4.8.ps1:**
```powershell
.\deploy-prom-v4.8.ps1 -ProjectName "MyProject" -SourcePath "." -Force -Backup -Verbose -Clean
```

**Параметры:**
- `-ProjectName` - Имя проекта (обязательно)
- `-SourcePath` - Исходный путь (по умолчанию: ".")
- `-PROM_PATH` - Путь PROM среды (по умолчанию: из конфигурации)
- `-ArchivePath` - Путь для архивов (по умолчанию: из конфигурации)
- `-Force` - Принудительная перезапись
- `-Backup` - Создание резервной копии
- `-Verbose` - Подробный вывод
- `-Clean` - Очистка старых архивов

**💡 Все пути берутся из `deployment-config.json` если не указаны явно!**

### **deploy-prod-v4.8.ps1:**
```powershell
.\deploy-prod-v4.8.ps1 -ProjectName "MyProject" -Force -Backup -Verbose -Clean -TestOnly
```

**Параметры:**
- `-ProjectName` - Имя проекта (обязательно)
- `-PROM_PATH` - Путь PROM среды (по умолчанию: из конфигурации)
- `-Server` - SSH сервер (по умолчанию: из конфигурации)
- `-PROD_PATH` - Путь PROD среды (по умолчанию: из конфигурации)
- `-ArchivePath` - Путь для архивов (по умолчанию: из конфигурации)
- `-Force` - Принудительная перезапись
- `-Backup` - Создание резервной копии
- `-Verbose` - Подробный вывод
- `-Clean` - Очистка старых архивов
- `-TestOnly` - Только тест SSH соединения

**💡 Все пути и серверы берутся из `deployment-config.json` если не указаны явно!**

### **deploy-full-v4.8.ps1:**
```powershell
.\deploy-full-v4.8.ps1 -ProjectName "MyProject" -SourcePath "." -Force -Backup -Verbose -Clean -SkipPROM -SkipPROD -TestOnly
```

**Дополнительные параметры:**
- `-SkipPROM` - Пропустить деплой в PROM
- `-SkipPROD` - Пропустить деплой в PROD

**💡 Все пути и серверы берутся из `deployment-config.json` если не указаны явно!**

---

## 🔧 **Требования**

### **Системные требования:**
- Windows 10+ (для tar архивации)
- PowerShell 5.1+
- SSH клиент (OpenSSH)
- gzip (для сжатия архивов)

### **Сетевые требования:**
- Доступ к PROM среде (`G:\OSPanel\home`)
- SSH доступ к PROD серверу
- SCP для копирования файлов

### **Права доступа:**
- Права на запись в PROM среду
- SSH ключи для доступа к серверу
- Права на запись в PROD папку

---

## 📊 **Примеры использования**

### **1. Простой деплой:**
```powershell
# Деплой в PROM
.\.automation\scripts\deploy-prom-v4.8.ps1 -ProjectName "MyWebApp"

# Деплой в PROD
.\.automation\scripts\deploy-prod-v4.8.ps1 -ProjectName "MyWebApp"
```

### **2. Деплой с параметрами:**
```powershell
# Деплой в PROM с принудительной перезаписью
.\.automation\scripts\deploy-prom-v4.8.ps1 -ProjectName "MyWebApp" -SourcePath "C:\MyProject" -Force -Verbose

# Деплой в PROD с тестом соединения
.\.automation\scripts\deploy-prod-v4.8.ps1 -ProjectName "MyWebApp" -TestOnly
```

### **3. Полный workflow:**
```powershell
# Полный деплой DEV -> PROM -> PROD
.\.automation\scripts\deploy-full-v4.8.ps1 -ProjectName "MyWebApp" -SourcePath "C:\MyProject" -Verbose

# Только PROM деплой
.\.automation\scripts\deploy-full-v4.8.ps1 -ProjectName "MyWebApp" -SkipPROD

# Только PROD деплой
.\.automation\scripts\deploy-full-v4.8.ps1 -ProjectName "MyWebApp" -SkipPROM
```

---

## 📁 **Структура архивов**

### **PROM архивы:**
```
.\deploy-archives\
├── MyProject-2025-01-31-14-30-15.tar.gz
├── MyProject-2025-01-31-15-45-22.tar.gz
└── deploy-prom-report-MyProject-2025-01-31-14-30-15.md
```

### **PROD архивы:**
```
.\deploy-archives\
├── MyProject-prod-2025-01-31-14-35-10.tar.gz
├── MyProject-prod-2025-01-31-15-50-18.tar.gz
└── deploy-prod-report-MyProject-2025-01-31-14-35-10.md
```

---

## ⚠️ **Важные замечания**

### **1. Порядок деплоя:**
- Сначала деплой в PROM, затем в PROD
- PROD деплой требует существующий PROM деплой
- Используйте `-Force` для перезаписи существующих деплоев

### **2. SSH соединение:**
- Убедитесь, что SSH ключи настроены
- Проверьте доступ к серверу: `ssh u0488409@37.140.195.19`
- Используйте `-TestOnly` для проверки соединения

### **3. Архивы:**
- Архивы создаются автоматически
- Используйте `-Clean` для очистки старых архивов
- Архивы сохраняются в `.\deploy-archives\`

### **4. Резервные копии:**
- Включены по умолчанию (`-Backup`)
- Создаются с timestamp
- Сохраняются рядом с целевыми папками

---

## 🔧 **Устранение проблем**

### **Проблема: "PROM путь не найден"**
```powershell
# Проверьте, что OSPanel установлен и запущен
Test-Path "G:\OSPanel\home"
```

### **Проблема: "SSH соединение не удалось"**
```powershell
# Проверьте SSH соединение
ssh u0488409@37.140.195.19 "echo 'Test'"

# Проверьте SSH ключи
ssh-add -l
```

### **Проблема: "tar не найден"**
```powershell
# Проверьте версию PowerShell
$PSVersionTable.PSVersion

# Обновите до PowerShell 5.1+
```

### **Проблема: "gzip не найден"**
```powershell
# Установите gzip или используйте без сжатия
# Архивы будут созданы без сжатия
```

---

## 📞 **Поддержка**

При возникновении проблем:
1. Проверьте логи в `.\deploy-archives\`
2. Используйте `-Verbose` для подробного вывода
3. Проверьте SSH соединение с `-TestOnly`
4. Обратитесь к отчетам деплоя

---

**Система деплоя v4.8 готова к использованию!** 🚀
