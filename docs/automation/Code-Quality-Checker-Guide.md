# Code Quality Checker v3.5 - Руководство пользователя

## 📋 Обзор

`Code-Quality-Checker.ps1` - это комплексный инструмент для анализа качества кода, который проверяет синтаксис, безопасность, производительность и соответствие лучшим практикам в PowerShell, JavaScript, TypeScript, Python, C# и Java файлах.

## 🚀 Основные возможности

### ✨ Функции анализа
- **Синтаксическая проверка** - Валидация синтаксиса кода
- **Анализ безопасности** - Поиск уязвимостей и проблем безопасности
- **Проверка производительности** - Выявление узких мест производительности
- **Анализ лучших практик** - Проверка соответствия стандартам кодирования
- **Метрики кода** - Подсчет строк, символов, слов, размера файлов

### 📊 Типы отчетов
- **JSON отчет** - Структурированные данные для автоматической обработки
- **HTML отчет** - Визуальный отчет с детальной информацией
- **Консольный вывод** - Краткая сводка в реальном времени

## 🔧 Поддерживаемые действия

### `check` - Базовая проверка
Выполняет полный анализ качества кода и сохраняет результаты в JSON файл.

```powershell
# Базовая проверка текущей папки
pwsh -File .\.automation\Code-Quality-Checker.ps1 -Action check

# Проверка конкретной папки
pwsh -File .\.automation\Code-Quality-Checker.ps1 -Action check -Path ".automation"

# Проверка с настройками
pwsh -File .\.automation\Code-Quality-Checker.ps1 -Action check -Path "." -Recursive -IncludeTests -SecurityCheck -PerformanceCheck -BestPractices -OutputFile "my-report.json"
```

### `analyze` - Детальный анализ
Выполняет анализ с выводом детальной информации о проблемах в консоль.

```powershell
# Детальный анализ
pwsh -File .\.automation\Code-Quality-Checker.ps1 -Action analyze -Path ".automation"

# Анализ с включением тестов
pwsh -File .\.automation\Code-Quality-Checker.ps1 -Action analyze -Path "." -IncludeTests
```

### `report` - HTML отчет
Генерирует HTML отчет с визуализацией результатов анализа.

```powershell
# Генерация HTML отчета
pwsh -File .\.automation\Code-Quality-Checker.ps1 -Action report -Path ".automation"

# HTML отчет с настройками
pwsh -File .\.automation\Code-Quality-Checker.ps1 -Action report -Path "." -Recursive -IncludeTests
```

### `fix` - Автоматическое исправление
Автоматически исправляет некоторые типы проблем (в разработке).

```powershell
# Автоматическое исправление
pwsh -File .\.automation\Code-Quality-Checker.ps1 -Action fix -Path ".automation"
```

## 📖 Параметры

### Основные параметры
- `-Action` - Действие для выполнения (обязательный)
- `-Path` - Путь к анализируемой папке (по умолчанию: ".")
- `-Recursive` - Рекурсивный поиск в подпапках (по умолчанию: $true)
- `-IncludeTests` - Включить тестовые файлы (по умолчанию: $false)
- `-OutputFile` - Имя выходного JSON файла (по умолчанию: "code-quality-report.json")

### Параметры проверок
- `-SecurityCheck` - Включить проверки безопасности (по умолчанию: $true)
- `-PerformanceCheck` - Включить проверки производительности (по умолчанию: $true)
- `-BestPractices` - Включить проверки лучших практик (по умолчанию: $true)

## 🔍 Типы проверок

### 🔒 Проверки безопасности
- **Hardcoded passwords** - Жестко заданные пароли
- **SQL injection risk** - Риски SQL инъекций
- **Command injection risk** - Риски инъекций команд
- **Unsafe file operations** - Небезопасные операции с файлами
- **Unsafe web requests** - Небезопасные веб-запросы

### ⚡ Проверки производительности
- **Large file processing** - Обработка больших файлов
- **Inefficient loops** - Неэффективные циклы
- **Memory intensive operations** - Операции, интенсивно использующие память
- **Unnecessary string operations** - Необходимые строковые операции

### 📋 Проверки лучших практик
- **Missing error handling** - Отсутствие обработки ошибок
- **Missing parameter validation** - Отсутствие валидации параметров
- **Missing documentation** - Отсутствие документации
- **Hardcoded values** - Жестко заданные значения
- **Missing logging** - Отсутствие логирования

## 📊 Метрики качества

### Оценка качества
Оценка качества рассчитывается по формуле:
```
Quality Score = 100 - (SyntaxErrors × 20) - (SecurityIssues × 10) - (PerformanceIssues × 5) - (BestPracticeIssues × 2)
```

### Уровни качества
- **90-100** - Отличное качество
- **80-89** - Хорошее качество
- **70-79** - Удовлетворительное качество
- **60-69** - Требует улучшения
- **0-59** - Критическое качество

## 📝 Примеры использования

### Пример 1: Ежедневная проверка качества
```powershell
# Быстрая проверка изменений
pwsh -File .\.automation\Code-Quality-Checker.ps1 -Action check -Path "." -OutputFile "daily-quality.json"

# Просмотр результатов
Get-Content "daily-quality.json" | ConvertFrom-Json | Select-Object -ExpandProperty Summary
```

### Пример 2: Детальный анализ проблем
```powershell
# Анализ с выводом проблем в консоль
pwsh -File .\.automation\Code-Quality-Checker.ps1 -Action analyze -Path ".automation" -SecurityCheck -PerformanceCheck
```

### Пример 3: Генерация отчета для команды
```powershell
# HTML отчет для презентации
pwsh -File .\.automation\Code-Quality-Checker.ps1 -Action report -Path "." -Recursive -IncludeTests
```

### Пример 4: Проверка перед коммитом
```powershell
# Проверка только измененных файлов
pwsh -File .\.automation\Code-Quality-Checker.ps1 -Action check -Path "src" -Recursive:$false -OutputFile "pre-commit-quality.json"
```

## 📊 Интерпретация результатов

### JSON отчет
```json
{
  "TotalFiles": 289,
  "ProcessedFiles": 289,
  "SyntaxErrors": 0,
  "SecurityIssues": 132,
  "PerformanceIssues": 359,
  "BestPracticeIssues": 738,
  "Summary": {
    "TotalIssues": 1229,
    "QualityScore": 0
  },
  "FileDetails": [...]
}
```

### HTML отчет
HTML отчет содержит:
- Общую статистику проекта
- Детальную информацию по каждому файлу
- Цветовую индикацию проблем
- Рекомендации по улучшению

## 🛠️ Настройка проверок

### Создание пользовательских правил
Вы можете расширить функциональность, добавив собственные правила проверки:

```powershell
# Добавление пользовательского правила в Test-SecurityIssues
$customPatterns = @{
    "Custom security rule" = "your-regex-pattern"
}
```

### Исключение файлов
Для исключения файлов из анализа используйте параметр `-IncludeTests:$false` или модифицируйте логику фильтрации.

## 🔧 Интеграция с CI/CD

### GitHub Actions
```yaml
- name: Code Quality Check
  run: |
    pwsh -File .\.automation\Code-Quality-Checker.ps1 -Action check -Path "." -OutputFile "quality-report.json"
    
- name: Upload Quality Report
  uses: actions/upload-artifact@v2
  with:
    name: quality-report
    path: quality-report.json
```

### Azure DevOps
```yaml
- task: PowerShell@2
  displayName: 'Code Quality Check'
  inputs:
    targetType: 'filePath'
    filePath: '.\.automation\Code-Quality-Checker.ps1'
    arguments: '-Action check -Path "." -OutputFile "quality-report.json"'
```

## 🚨 Устранение неполадок

### Частые проблемы

#### Проблема: Ошибка "Cannot bind argument to parameter"
**Решение:**
1. Проверьте синтаксис регулярных выражений
2. Убедитесь в корректности параметров
3. Используйте экранирование специальных символов

#### Проблема: Медленная работа
**Решение:**
1. Ограничьте область поиска параметром `-Path`
2. Отключите ненужные проверки
3. Исключите большие файлы из анализа

#### Проблема: Ложные срабатывания
**Решение:**
1. Настройте регулярные выражения под ваш стиль кода
2. Добавьте исключения для специфических случаев
3. Используйте более точные паттерны

## 📚 Дополнительные ресурсы

- [PowerShell Best Practices](https://docs.microsoft.com/en-us/powershell/scripting/dev-cross-plat/writing-portable-modules)
- [Security Guidelines](https://docs.microsoft.com/en-us/powershell/scripting/learn/ps101/09-functions)
- [Performance Optimization](https://docs.microsoft.com/en-us/powershell/scripting/dev-cross-plat/performance)

## 🔄 Обновления

### Версия 3.5.0 (2025-09-09)
- Добавлена поддержка JavaScript и TypeScript
- Реализованы проверки безопасности
- Добавлены проверки производительности
- Создан HTML отчет
- Улучшена система метрик качества

---

**Последнее обновление:** 2025-09-09  
**Версия:** 3.5.0  
**Статус:** Production Ready
