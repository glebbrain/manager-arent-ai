# 🚀 Инструкции по миграции проекта до v4.8

## 📋 Обзор

Этот набор скриптов позволяет автоматически мигрировать любой проект до версии v4.8 с максимальной производительностью, AI-интеграцией и поддержкой современных технологий.

## 🎯 Доступные скрипты

### 1. `migrate-to-v4.8.ps1` - Полная миграция (РЕКОМЕНДУЕТСЯ)

**Особенности:**
- ✅ Детальная проверка всех файлов
- ✅ Автоматическое создание резервных копий
- ✅ Цветной вывод с прогрессом
- ✅ Статистика копирования
- ✅ Проверка критических файлов
- ✅ Создание README для миграции

**Использование:**
```powershell
# Базовая миграция
.\.automation\scripts\migrate-to-v4.8.ps1

# Миграция с кастомным путем
.\.automation\scripts\migrate-to-v4.8.ps1 -SourcePath "C:\MyProjects\ManagerAgentAI"

# Миграция без резервной копии
.\.automation\scripts\migrate-to-v4.8.ps1 -Backup:$false

# Подробный вывод
.\.automation\scripts\migrate-to-v4.8.ps1 -Verbose
```

### 2. `quick-migrate-v4.8.ps1` - Быстрая миграция

**Особенности:**
- ⚡ Быстрое копирование без детальных проверок
- 📁 Минимальная структура папок
- 🎯 Только основные файлы

**Использование:**
```powershell
# Быстрая миграция
.\.automation\scripts\quick-migrate-v4.8.ps1

# С кастомным путем
.\.automation\scripts\quick-migrate-v4.8.ps1 -SourcePath "C:\MyProjects\ManagerAgentAI"
```

## 📁 Что копируется

### Из `.automation/`:
- ✅ Основные скрипты v4.8 (Quick-Access, Performance-Optimizer, etc.)
- ✅ AI-модули и Quantum Computing функции
- ✅ Blockchain, Edge Computing, VR/AR модули
- ✅ Скрипты и алиасы
- ✅ Конфигурационные файлы
- ✅ Шаблоны и тесты

### Из `.manager/`:
- ✅ `start.md` - основной файл запуска
- ✅ `Maximum-Manager-Optimizer-v4.8.ps1`
- ✅ `control-files/` - все управляющие файлы
- ✅ `prompts/` - AI промпты
- ✅ `scripts/` - скрипты менеджера
- ✅ `utils/` - утилиты

### Дополнительно:
- ✅ `cursor.json` - конфигурация Cursor v6.8
- ✅ `MIGRATION-README.md` - отчет о миграции

## 🚀 Пошаговая инструкция

### Шаг 1: Подготовка
```powershell
# 1. Перейдите в корень вашего проекта
cd "C:\MyProject"

# 2. Убедитесь, что у вас есть права на запись
# 3. Проверьте, что исходный проект ManagerAgentAI доступен
Test-Path "F:\ProjectsAI\ManagerAgentAI"
```

### Шаг 2: Запуск миграции
```powershell
# Полная миграция (рекомендуется)
.\migrate-to-v4.8.ps1

# Или быстрая миграция
.\quick-migrate-v4.8.ps1
```

### Шаг 3: Активация новых возможностей
```powershell
# Загрузка алиасов v4.8
. .\.automation\scripts\New-Aliases-v4.8.ps1

# Проверка системы
mpo -Action test
mmo -Action test
qai -Action test

# Оптимизация производительности
mpo -Action optimize -AI -Quantum -Verbose
```

### Шаг 4: Проверка
```powershell
# Проверка структуры
Test-Path ".\.automation"
Test-Path ".\.manager"
Test-Path ".\.manager\control-files"

# Проверка ключевых файлов
Test-Path ".\.automation\Maximum-Performance-Optimizer-v4.8.ps1"
Test-Path ".\.manager\start.md"
Test-Path ".\cursor.json"

# Проверка алиасов
Get-Alias mpo, mmo, qai, qaq, qap
```

## 🔧 Параметры скриптов

### migrate-to-v4.8.ps1
- `-SourcePath` - путь к исходному проекту ManagerAgentAI (по умолчанию: "F:\ProjectsAI\ManagerAgentAI")
- `-TargetPath` - путь к целевому проекту (по умолчанию: ".")
- `-Force` - принудительное выполнение
- `-Backup` - создание резервной копии (по умолчанию: true)
- `-Verbose` - подробный вывод

### quick-migrate-v4.8.ps1
- `-SourcePath` - путь к исходному проекту ManagerAgentAI
- `-Force` - принудительное выполнение

## ⚠️ Важные замечания

### 1. Резервное копирование
- Полная миграция автоматически создает резервную копию
- Резервная копия сохраняется в папку `backup-YYYY-MM-DD-HH-mm-ss`
- Проверьте резервную копию перед удалением старых файлов

### 2. Права доступа
- Убедитесь, что у вас есть права на чтение исходных файлов
- Убедитесь, что у вас есть права на запись в целевую папку
- При необходимости запустите PowerShell от имени администратора

### 3. Зависимости
- Убедитесь, что установлены все необходимые модули PowerShell
- Проверьте версии .NET Framework и PowerShell
- Установите дополнительные зависимости для AI и Quantum Computing

### 4. Тестирование
- После миграции обязательно протестируйте все функции
- Проверьте работу алиасов и скриптов
- Убедитесь, что все пути корректны

## 🔧 Устранение проблем

### Проблема: "Файл не найден"
```powershell
# Проверьте существование исходных файлов
Test-Path "F:\ProjectsAI\ManagerAgentAI\.automation\Maximum-Performance-Optimizer-v4.8.ps1"
Test-Path "F:\ProjectsAI\ManagerAgentAI\.manager\start.md"

# Если файлы отсутствуют, обновите исходный проект
```

### Проблема: "Нет прав доступа"
```powershell
# Запустите PowerShell от имени администратора
# Или измените права доступа к папкам
```

### Проблема: "Алиасы не работают"
```powershell
# Перезагрузите алиасы
. .\.automation\scripts\New-Aliases-v4.8.ps1

# Проверьте ExecutionPolicy
Get-ExecutionPolicy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Проблема: "Скрипты не выполняются"
```powershell
# Проверьте ExecutionPolicy
Get-ExecutionPolicy

# Установите разрешение на выполнение
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Или выполните скрипт с обходом политики
PowerShell -ExecutionPolicy Bypass -File .\migrate-to-v4.8.ps1
```

## 📊 Новые возможности v4.8

### AI & Quantum Computing
- `qai` - AI-анализ проекта с передовыми моделями
- `qaq` - Quantum-оптимизация для сложных задач
- `qap` - Полная оптимизация производительности с AI

### Maximum Performance
- `mpo` - Maximum Performance Optimizer v4.8
- `mmo` - Maximum Manager Optimizer v4.8

### Основные команды
- `qao` - Quick Access Optimized v4.8
- `umo` - Universal Manager Optimized v4.8
- `pso` - Project Scanner Optimized v4.8
- `po` - Performance Optimizer v4.8

### Мониторинг
- `qam` - Quick Access Monitor v4.8
- `qas` - Quick Access Status v4.8
- `qac` - Quick Access Cache v4.8
- `qacr` - Quick Access Cache Reset v4.8

## 📞 Поддержка

При возникновении проблем:
1. Проверьте файл `MIGRATION-README.md` в корне проекта
2. Обратитесь к документации в `.manager\control-files\`
3. Запустите справку: `pwsh -File .\.automation\Maximum-Performance-Optimizer-v4.8.ps1 -Action help`

---

**Удачной миграции и работы с v4.8!** 🚀
