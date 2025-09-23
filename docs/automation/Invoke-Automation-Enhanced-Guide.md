# Invoke-Automation-Enhanced v3.5 - Руководство пользователя

## 📋 Обзор

`Invoke-Automation-Enhanced.ps1` - это улучшенная версия универсального диспетчера автоматизации с расширенными возможностями логирования, обработки ошибок и мониторинга производительности.

## 🚀 Основные возможности

### ✨ Новые функции
- **Улучшенное логирование** с временными метками и цветовой индикацией
- **Расширенная обработка ошибок** с детальной диагностикой
- **Мониторинг производительности** с измерением времени выполнения
- **Режим отладки** для детального анализа работы скриптов
- **Улучшенная обработка параметров** с валидацией

### 🔧 Поддерживаемые действия
- `setup` - Первоначальная настройка проекта
- `analyze` - Анализ проекта и генерация отчетов
- `build` - Сборка проекта
- `test` - Тестирование проекта
- `deploy` - Развертывание проекта
- `monitor` - Мониторинг системы
- `optimize` - Оптимизация производительности
- `uiux` - UI/UX разработка
- `status` - Статус системы
- `migrate` - Миграция данных
- `backup` - Резервное копирование
- `restore` - Восстановление из резервной копии
- `clean` - Очистка временных файлов
- `scan` - Сканирование проекта

## 📖 Примеры использования

### Базовое использование
```powershell
# Проверка статуса системы
pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action status

# Анализ проекта с AI функциями
pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action analyze -AI -Advanced

# Сборка проекта
pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action build -AI -Quantum -Enterprise
```

### Расширенное использование
```powershell
# Анализ с режимом отладки
pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action analyze -AI -Advanced -DebugMode

# Быстрый профиль (build -> test -> status)
pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action status -Quick

# UI/UX разработка с полным набором функций
pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action uiux -UIUX -AI -Advanced
```

### Управление AI модулями v4.0
```powershell
# Запуск всех AI модулей
pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action analyze -AI -Quantum -Edge -Blockchain -VRAR

# Тестирование с мониторингом производительности
pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action test -AI -Advanced -DebugMode
```

## 🔧 Параметры

### Основные параметры
- `-Action` - Действие для выполнения (обязательный)
- `-AI` - Включить AI функции
- `-Quantum` - Включить квантовые вычисления
- `-Enterprise` - Включить корпоративные функции
- `-UIUX` - Включить UI/UX функции
- `-Advanced` - Включить расширенные функции
- `-Blockchain` - Включить блокчейн функции
- `-VRAR` - Включить VR/AR функции
- `-Edge` - Включить edge computing

### Дополнительные параметры
- `-Quick` - Быстрый профиль выполнения
- `-DebugMode` - Режим отладки с детальным логированием

## 📊 Логирование

### Уровни логирования
- **INFO** - Информационные сообщения (голубой)
- **WARN** - Предупреждения (желтый)
- **ERROR** - Ошибки (красный)
- **SUCCESS** - Успешные операции (зеленый)

### Пример вывода
```
[2025-09-09 14:53:05] [INFO] Starting Universal Automation Manager Enhanced v3.5
[2025-09-09 14:53:05] [INFO] Action: status
[2025-09-09 14:53:06] [SUCCESS] .automation\Universal-Automation-Manager-v3.5.ps1 finished successfully in 0,01s
[2025-09-09 14:53:06] [SUCCESS] Universal Automation Manager Enhanced completed successfully
```

## 🚨 Обработка ошибок

### Типы ошибок
1. **Синтаксические ошибки** - Проблемы с PowerShell синтаксисом
2. **Ошибки выполнения** - Проблемы во время выполнения скриптов
3. **Ошибки файловой системы** - Проблемы с доступом к файлам
4. **Ошибки параметров** - Некорректные параметры

### Диагностика
- Автоматическое логирование всех ошибок
- Детальная информация о месте возникновения ошибки
- Рекомендации по исправлению
- Режим отладки для детального анализа

## ⚡ Производительность

### Мониторинг
- Измерение времени выполнения каждого скрипта
- Статистика использования ресурсов
- Рекомендации по оптимизации

### Оптимизация
- Параллельное выполнение независимых задач
- Кэширование результатов
- Оптимизация загрузки модулей

## 🔍 Отладка

### Режим отладки
```powershell
# Включение режима отладки
pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action analyze -DebugMode
```

### Информация для отладки
- Детальный стек вызовов
- Состояние переменных
- Время выполнения каждого шага
- Информация о загруженных модулях

## 📝 Примеры сценариев

### Сценарий 1: Ежедневная разработка
```powershell
# Утренняя проверка
pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action status

# Анализ изменений
pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action analyze -AI -Advanced

# Сборка и тестирование
pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action build -AI -Advanced
pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action test -AI -Advanced
```

### Сценарий 2: Развертывание в продакшн
```powershell
# Создание резервной копии
pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action backup

# Сборка релизной версии
pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action build -AI -Quantum -Enterprise -Advanced

# Развертывание
pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action deploy -AI -Quantum -Enterprise -Advanced

# Мониторинг
pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action monitor -AI -Advanced
```

### Сценарий 3: Отладка проблем
```powershell
# Анализ с детальным логированием
pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action analyze -AI -Advanced -DebugMode

# Проверка производительности
pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action optimize -AI -Advanced -DebugMode
```

## 🛠️ Устранение неполадок

### Частые проблемы

#### Проблема: Скрипт не запускается
**Решение:**
1. Проверьте версию PowerShell: `$PSVersionTable.PSVersion`
2. Убедитесь, что файл существует: `Test-Path .\.automation\Invoke-Automation-Enhanced.ps1`
3. Проверьте права выполнения: `Get-ExecutionPolicy`

#### Проблема: Ошибки параметров
**Решение:**
1. Используйте `-DebugMode` для детальной информации
2. Проверьте синтаксис команд
3. Убедитесь в корректности путей к файлам

#### Проблема: Медленная работа
**Решение:**
1. Используйте `-Quick` для быстрого выполнения
2. Отключите ненужные функции
3. Проверьте доступность ресурсов системы

## 📚 Дополнительные ресурсы

- [Основная документация](../README.md)
- [Code Quality Checker Guide](Code-Quality-Checker-Guide.md)
- [AI Modules v4.0 Guide](AI-Modules-v4.0-Guide.md)
- [Troubleshooting Guide](Troubleshooting-Guide.md)

## 🔄 Обновления

### Версия 3.5.0 (2025-09-09)
- Добавлено улучшенное логирование
- Реализована расширенная обработка ошибок
- Добавлен мониторинг производительности
- Улучшена обработка параметров

---

**Последнее обновление:** 2025-09-09  
**Версия:** 3.5.0  
**Статус:** Production Ready
