# Task Migration Scripts - Universal Project Manager

## Описание

Набор PowerShell скриптов для автоматического переноса выполненных задач из TODO.md файлов в COMPLETED.md файлы.

## Скрипты

### 1. `task-migration.ps1` - Основной скрипт миграции

**Функции:**
- Автоматически находит выполненные задачи в TODO.md файлах
- Переносит их в соответствующие COMPLETED.md файлы
- Удаляет выполненные задачи из TODO.md
- Создает резервные копии перед изменениями
- Поддерживает как корневые файлы, так и файлы в .manager/control-files/

**Использование:**
```powershell
# Базовый запуск
powershell -ExecutionPolicy Bypass -File "scripts/task-migration.ps1"

# С подробным выводом
powershell -ExecutionPolicy Bypass -File "scripts/task-migration.ps1" -Verbose

# Тестовый запуск (без изменений)
powershell -ExecutionPolicy Bypass -File "scripts/task-migration.ps1" -DryRun

# Указать путь к проекту
powershell -ExecutionPolicy Bypass -File "scripts/task-migration.ps1" -ProjectPath "C:\MyProject"
```

### 2. `auto-migrate-tasks.ps1` - Автоматический запуск

**Функции:**
- Простой интерфейс для запуска миграции
- Автоматически находит и запускает основной скрипт
- Удобные сообщения о статусе выполнения

**Использование:**
```powershell
# Базовый запуск
powershell -ExecutionPolicy Bypass -File "scripts/auto-migrate-tasks.ps1"

# С подробным выводом
powershell -ExecutionPolicy Bypass -File "scripts/auto-migrate-tasks.ps1" -Verbose
```

## Поддерживаемые форматы задач

Скрипт автоматически распознает следующие форматы выполненных задач:

### 1. Блоки выполненных задач
```markdown
- ✅ **COMPLETED TASKS MOVED TO COMPLETED.md**
  - Task 1: Description
  - Task 2: Description
  - Task 3: Description
```

### 2. Отдельные выполненные задачи
```markdown
- ✅ Task description
- [x] Task description
```

## Обрабатываемые файлы

Скрипт автоматически обрабатывает следующие пары файлов:

1. **Корневые файлы:**
   - `TODO.md` → `COMPLETED.md`

2. **Файлы менеджера:**
   - `.manager/control-files/TODO.md` → `.manager/control-files/COMPLETED.md`
   - `.manager/TODO.md` → `.manager/Completed.md`

## Безопасность

- **Резервные копии:** Перед любыми изменениями создаются резервные копии с временными метками
- **Dry Run:** Режим тестирования позволяет проверить, что будет сделано, без внесения изменений
- **Логирование:** Все операции записываются в файл `task-migration.log`

## Примеры использования

### После выполнения задач
```powershell
# Выполнили задачи, теперь очищаем TODO
powershell -ExecutionPolicy Bypass -File "scripts/auto-migrate-tasks.ps1"
```

### Периодическая очистка
```powershell
# Добавить в планировщик задач Windows для автоматического запуска
powershell -ExecutionPolicy Bypass -File "C:\Path\To\Project\scripts\auto-migrate-tasks.ps1"
```

### Проверка перед миграцией
```powershell
# Сначала проверим, что будет сделано
powershell -ExecutionPolicy Bypass -File "scripts/task-migration.ps1" -DryRun -Verbose

# Если все правильно, запускаем реальную миграцию
powershell -ExecutionPolicy Bypass -File "scripts/task-migration.ps1" -Verbose
```

## Логи

Все операции записываются в файл `task-migration.log` в корне проекта. Лог содержит:
- Время выполнения операций
- Найденные выполненные задачи
- Созданные резервные копии
- Результаты миграции

## Устранение неполадок

### Скрипт не находит выполненные задачи
- Проверьте формат задач в TODO.md
- Убедитесь, что задачи помечены символом ✅ или [x]
- Используйте параметр `-Verbose` для отладочной информации

### Ошибки кодировки
- Убедитесь, что файлы сохранены в UTF-8
- Проверьте, что символы ✅ отображаются корректно

### Проблемы с правами доступа
- Запустите PowerShell от имени администратора
- Проверьте права на запись в папку проекта

## Интеграция с другими скриптами

Скрипт можно интегрировать в другие процессы разработки:

```powershell
# В конце рабочего дня
Write-Host "Migrating completed tasks..."
powershell -ExecutionPolicy Bypass -File "scripts/auto-migrate-tasks.ps1"

# После выполнения конкретной задачи
if ($TaskCompleted) {
    powershell -ExecutionPolicy Bypass -File "scripts/auto-migrate-tasks.ps1"
}
```

## Требования

- PowerShell 5.1 или выше
- Права на чтение/запись файлов проекта
- ExecutionPolicy разрешающий выполнение скриптов
