# File Manager PowerShell Scripts

Набор PowerShell скриптов для создания папок и файлов с полной обработкой ошибок и валидацией.

## Файлы

- `file-manager.ps1` - Основной скрипт с полным функционалом
- `create.ps1` - Упрощенная обертка для быстрого создания файлов и папок
- `batch-create.ps1` - Массовое создание файлов и папок из конфигурационного файла
- `example-config.json` - Пример конфигурационного файла для batch-create.ps1
- `coding-rules.md` - Правила кодирования и стандарты языка
- `auto-english-rules.ps1` - Автоматические правила для английского языка
- `language-checker.ps1` - Проверка соответствия правилам языка
- `apply-english-rules.ps1` - Применение правил к существующим файлам
- `README.md` - Документация по использованию

## Быстрый старт

### Создание папки
```powershell
# Простой способ
.\create.ps1 -Type dir -Path "C:\Temp" -Name "NewFolder"

# С рекурсивным созданием
.\create.ps1 -Type dir -Path "C:\Temp" -Name "NewFolder\SubFolder" -Recursive
```

### Создание файла
```powershell
# Простой способ
.\create.ps1 -Type file -Path "C:\Temp" -Name "test.txt" -Content "Hello World"

# С принудительным созданием (перезаписать существующий)
.\create.ps1 -Type file -Path "C:\Temp" -Name "test.txt" -Content "New Content" -Force
```

### Массовое создание из конфигурации
```powershell
# Создание структуры проекта из JSON конфигурации
.\batch-create.ps1 -ConfigFile "example-config.json" -BasePath "C:\MyProject"

# Режим предварительного просмотра (без создания файлов)
.\batch-create.ps1 -ConfigFile "example-config.json" -BasePath "C:\MyProject" -DryRun
```

## Правила языка

### Английский язык по умолчанию
Все скрипты автоматически используют английский язык для:
- Комментариев в коде
- Сообщений об ошибках
- Логов и уведомлений
- Имен переменных и функций
- Документации

### Проверка соответствия правилам
```powershell
# Проверка всех файлов на соответствие правилам языка
.\language-checker.ps1 -Path "C:\MyProject"

# Проверка с автоматическим исправлением
.\language-checker.ps1 -Path "C:\MyProject" -Fix

# Применение правил к существующим файлам
.\apply-english-rules.ps1 -Path "C:\MyProject" -Backup

# Режим предварительного просмотра
.\apply-english-rules.ps1 -Path "C:\MyProject" -DryRun
```

## Полное использование file-manager.ps1

### Создание директории
```powershell
.\file-manager.ps1 -Action create-dir -Path "C:\Temp" -Name "NewFolder"
.\file-manager.ps1 -Action create-dir -Path "C:\Temp" -Name "NewFolder\SubFolder" -Recursive
```

### Создание файла
```powershell
.\file-manager.ps1 -Action create-file -Path "C:\Temp" -Name "test.txt" -Content "Hello World"
.\file-manager.ps1 -Action create-file -Path "C:\Temp" -Name "config.json" -Content '{"key": "value"}' -Encoding UTF8
```

### Удаление файла или папки
```powershell
.\file-manager.ps1 -Action remove -Path "C:\Temp\test.txt"
.\file-manager.ps1 -Action remove -Path "C:\Temp\NewFolder" -Recursive
```

### Получение информации
```powershell
.\file-manager.ps1 -Action info -Path "C:\Temp\test.txt"
.\file-manager.ps1 -Action info -Path "C:\Temp\NewFolder"
```

### Справка
```powershell
.\file-manager.ps1 -Action help
```

## Параметры

### file-manager.ps1

| Параметр | Описание | Обязательный | По умолчанию |
|----------|----------|--------------|--------------|
| `-Action` | Действие (create-dir, create-file, remove, info, help) | Нет | help |
| `-Path` | Путь к родительской директории | Да* | - |
| `-Name` | Имя файла или директории | Да* | - |
| `-Content` | Содержимое файла | Нет | "" |
| `-Type` | Тип элемента (file/directory) | Нет | file |
| `-Recursive` | Рекурсивное создание/удаление | Нет | false |
| `-Force` | Принудительное выполнение | Нет | false |
| `-Encoding` | Кодировка файла | Нет | UTF8 |

*Обязательные для определенных действий

### create.ps1

| Параметр | Описание | Обязательный | По умолчанию |
|----------|----------|--------------|--------------|
| `-Type` | Тип (dir, directory, folder, file) | Да | - |
| `-Path` | Путь к родительской директории | Да | - |
| `-Name` | Имя файла или директории | Нет | "" |
| `-Content` | Содержимое файла | Нет | "" |
| `-Recursive` | Рекурсивное создание | Нет | false |
| `-Force` | Принудительное выполнение | Нет | false |

## Особенности

### Обработка ошибок
- Полная валидация всех входных параметров
- Проверка существования путей
- Обработка недопустимых символов в именах файлов/папок
- Логирование всех операций

### Безопасность
- Проверка длины путей (максимум 260 символов)
- Валидация символов в путях и именах файлов
- Безопасное удаление с подтверждением

### Логирование
- Все операции записываются в `file-manager.log`
- Цветной вывод в консоль
- Различные уровни логирования (Info, Warning, Error, Success)

## Примеры использования

### Создание структуры проекта
```powershell
# Создаем основную папку проекта
.\create.ps1 -Type dir -Path "C:\Projects" -Name "MyProject"

# Создаем подпапки
.\create.ps1 -Type dir -Path "C:\Projects\MyProject" -Name "src"
.\create.ps1 -Type dir -Path "C:\Projects\MyProject" -Name "docs"
.\create.ps1 -Type dir -Path "C:\Projects\MyProject" -Name "tests"

# Создаем файлы
.\create.ps1 -Type file -Path "C:\Projects\MyProject" -Name "README.md" -Content "# My Project"
.\create.ps1 -Type file -Path "C:\Projects\MyProject\src" -Name "main.py" -Content "print('Hello World')"
```

### Создание конфигурационных файлов
```powershell
# JSON конфигурация
$jsonConfig = @{
    "database" = @{
        "host" = "localhost"
        "port" = 5432
    }
    "api" = @{
        "version" = "1.0"
        "timeout" = 30
    }
} | ConvertTo-Json -Depth 3

.\create.ps1 -Type file -Path "C:\Config" -Name "app.json" -Content $jsonConfig

# XML конфигурация
$xmlContent = @"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <appSettings>
        <add key="ConnectionString" value="Server=localhost;Database=MyDB;" />
    </appSettings>
</configuration>
"@

.\create.ps1 -Type file -Path "C:\Config" -Name "app.config" -Content $xmlContent
```

## Требования

- PowerShell 5.0 или выше
- Windows 7/Server 2008 R2 или выше
- Права на запись в целевые директории

## Устранение неполадок

### Ошибка "Execution Policy"
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Ошибка "Path too long"
- Убедитесь, что полный путь не превышает 260 символов
- Используйте более короткие имена папок

### Ошибка "Access denied"
- Запустите PowerShell от имени администратора
- Проверьте права доступа к целевой директории

## Логи

Все операции записываются в файл `file-manager.log` в той же директории, где находится скрипт. Лог содержит:
- Временные метки
- Уровни логирования
- Детальные сообщения об операциях
- Информацию об ошибках
