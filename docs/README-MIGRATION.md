# 🚀 Набор для миграции проекта до v4.8

## 📋 Обзор

Этот набор файлов позволяет автоматически мигрировать любой проект до версии v4.8 с максимальной производительностью, AI-интеграцией и поддержкой современных технологий.

## 📁 Файлы в наборе

| Файл | Описание | Использование |
|------|----------|---------------|
| `.automation\scripts\migrate-to-v4.8.ps1` | **Полная миграция** (РЕКОМЕНДУЕТСЯ) | Детальная миграция с проверками и резервными копиями |
| `.automation\scripts\quick-migrate-v4.8.ps1` | **Быстрая миграция** | Упрощенная миграция для быстрого копирования |
| `.automation\scripts\migrate.bat` | **Windows Batch** | Запуск миграции через batch-файл |
| `MIGRATION-INSTRUCTIONS.md` | **Подробные инструкции** | Полное руководство по использованию |
| `.project-migration-upgrade.md` | **Техническая документация** | Детальная техническая документация |

## 🚀 Быстрый старт

### Вариант 1: Через Batch-файл (Windows)
```cmd
# Просто запустите
.\.automation\scripts\migrate.bat
```

### Вариант 2: Через PowerShell
```powershell
# Полная миграция
.\.automation\scripts\migrate-to-v4.8.ps1

# Или быстрая миграция
.\.automation\scripts\quick-migrate-v4.8.ps1
```

### Вариант 3: С кастомным путем
```powershell
# Укажите свой путь к ManagerAgentAI
.\.automation\scripts\migrate-to-v4.8.ps1 -SourcePath "C:\MyProjects\ManagerAgentAI"
```

## 📊 Что копируется

### Из `.automation/`:
- ✅ **Основные скрипты v4.8**: Quick-Access, Performance-Optimizer, Maximum-Performance-Optimizer
- ✅ **AI-модули**: AI-Enhanced-Features, AI-Modules-Manager
- ✅ **Новые технологии**: Quantum Computing, Blockchain, Edge Computing, VR/AR
- ✅ **Скрипты и алиасы**: New-Aliases-v4.8.ps1
- ✅ **Конфигурация**: automation-config-v4.8.json
- ✅ **Папки модулей**: ai/, quantum/, blockchain/, edge/, vr/, scripts/

### Из `.manager/`:
- ✅ **Основные файлы**: start.md, Maximum-Manager-Optimizer-v4.8.ps1
- ✅ **Control-files**: INSTRUCTIONS, QUICK-COMMANDS, REQUIREMENTS, TODO, COMPLETED
- ✅ **Промпты и утилиты**: prompts/, scripts/, utils/
- ✅ **Документация**: README.md, dev.md

### Дополнительно:
- ✅ **cursor.json**: Конфигурация Cursor v6.8
- ✅ **MIGRATION-README.md**: Отчет о миграции

## 🎯 Новые возможности v4.8

### AI & Quantum Computing
```powershell
qai    # AI-анализ проекта с передовыми моделями
qaq    # Quantum-оптимизация для сложных задач
qap    # Полная оптимизация производительности с AI
```

### Maximum Performance
```powershell
mpo    # Maximum Performance Optimizer v4.8
mmo    # Maximum Manager Optimizer v4.8
```

### Основные команды
```powershell
qao    # Quick Access Optimized v4.8
umo    # Universal Manager Optimized v4.8
pso    # Project Scanner Optimized v4.8
po     # Performance Optimizer v4.8
```

### Мониторинг
```powershell
qam    # Quick Access Monitor v4.8
qas    # Quick Access Status v4.8
qac    # Quick Access Cache v4.8
qacr   # Quick Access Cache Reset v4.8
```

## 📝 Пошаговая инструкция

### Шаг 1: Подготовка
1. Скопируйте все файлы миграции в корень вашего проекта
2. Убедитесь, что исходный проект ManagerAgentAI доступен
3. Проверьте права доступа к папкам

### Шаг 2: Запуск миграции
```powershell
# Выберите один из вариантов:
.\migrate.bat                    # Через batch-файл
.\migrate-to-v4.8.ps1           # Полная миграция
.\quick-migrate-v4.8.ps1        # Быстрая миграция
```

### Шаг 3: Активация
```powershell
# Загрузите алиасы v4.8
. .\.automation\scripts\New-Aliases-v4.8.ps1

# Проверьте систему
mpo -Action test
mmo -Action test
qai -Action test

# Оптимизируйте производительность
mpo -Action optimize -AI -Quantum -Verbose
```

### Шаг 4: Проверка
```powershell
# Проверьте структуру
Test-Path ".\.automation"
Test-Path ".\.manager"
Test-Path ".\.manager\control-files"

# Проверьте ключевые файлы
Test-Path ".\.automation\Maximum-Performance-Optimizer-v4.8.ps1"
Test-Path ".\.manager\start.md"
Test-Path ".\cursor.json"

# Проверьте алиасы
Get-Alias mpo, mmo, qai, qaq, qap
```

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

## 📞 Поддержка

При возникновении проблем:
1. Проверьте файл `MIGRATION-README.md` в корне проекта
2. Обратитесь к документации в `.manager\control-files\`
3. Запустите справку: `pwsh -File .\.automation\Maximum-Performance-Optimizer-v4.8.ps1 -Action help`

## 🎉 Результат

После успешной миграции ваш проект будет иметь:
- ✅ Полную поддержку v4.8 с максимальной производительностью
- ✅ AI и Quantum Computing интеграцию
- ✅ Поддержку Blockchain, Edge Computing, VR/AR
- ✅ Новые алиасы и команды
- ✅ Оптимизированную структуру папок
- ✅ Обновленную конфигурацию Cursor

---

**Удачной миграции и работы с v4.8!** 🚀
