# Автоматическая простановка копирайта

Этот набор скриптов позволяет автоматически добавлять копирайт-комментарии в начало файлов различных типов.

## Возможности

- ✅ Автоматическое получение имени пользователя из системы
- ✅ Извлечение даты создания и последнего изменения из свойств файла
- ✅ Поддержка множества типов файлов (JS, TS, PowerShell, HTML, CSS, JSON, MD, YAML, Python, C#, C++, и др.)
- ✅ Рекурсивная обработка директорий
- ✅ Исключение директорий (node_modules, .git, и др.)
- ✅ Предварительный просмотр изменений (WhatIf)
- ✅ Проверка на существующий копирайт

## Файлы

- `Add-Copyright.ps1` - Основной скрипт для добавления копирайта
- `Add-Copyright-All.ps1` - Скрипт для массовой обработки всего проекта
- `README.md` - Данная документация

## Использование

### Добавление копирайта к одному файлу

```powershell
.\Add-Copyright.ps1 -Path ".\scripts\my-script.ps1"
```

### Добавление копирайта к файлам определенного типа

```powershell
.\Add-Copyright.ps1 -Path ".\scripts\" -FileTypes @(".js", ".ts") -Recursive
```

### Массовое добавление копирайта ко всему проекту

```powershell
.\Add-Copyright-All.ps1
```

### Предварительный просмотр изменений

```powershell
.\Add-Copyright-All.ps1 -WhatIf
```

## Параметры

### Add-Copyright.ps1

- `Path` (обязательный) - Путь к файлу или директории
- `FileTypes` - Массив расширений файлов (по умолчанию: .js, .ps1, .ts, .html, .css, .json, .md, .yaml, .yml, .py, .cs, .cpp, .c, .h, .hpp)
- `Author` - Имя автора (по умолчанию: имя текущего пользователя)
- `Recursive` - Обрабатывать файлы рекурсивно
- `WhatIf` - Показать какие файлы будут обработаны

### Add-Copyright-All.ps1

- `ProjectPath` - Путь к корню проекта (по умолчанию: текущая директория)
- `Author` - Имя автора (по умолчанию: GlebBrain)
- `ExcludeDirs` - Директории для исключения
- `WhatIf` - Предварительный просмотр

## Форматы копирайта

Скрипт автоматически определяет формат комментария в зависимости от типа файла:

### JavaScript/TypeScript/HTML/CSS/JSON/YAML
```javascript
/**
 * @fileoverview filename.js
 * @author GlebBrain
 * @created 05.09.2025
 * @lastmodified 05.09.2025
 * @copyright (c) 2025 GlebBrain. All rights reserved.
 */
```

### PowerShell
```powershell
#Requires -Version 5.1

<#
.SYNOPSIS
    filename.ps1

.DESCRIPTION
    Автор: GlebBrain
    Создан: 05.09.2025
    Последнее изменение: 05.09.2025
    Copyright (c) 2025 GlebBrain. All rights reserved.
#>
```

### Python
```python
"""
filename.py

Author: GlebBrain
Created: 05.09.2025
Last Modified: 05.09.2025
Copyright (c) 2025 GlebBrain. All rights reserved.
"""
```

### C#/C++/C
```csharp
/*
 * filename.cs
 * 
 * Author: GlebBrain
 * Created: 05.09.2025
 * Last Modified: 05.09.2025
 * Copyright (c) 2025 GlebBrain. All rights reserved.
 */
```

### Markdown
```html
<!--
filename.md

Author: GlebBrain
Created: 05.09.2025
Last Modified: 05.09.2025
Copyright (c) 2025 GlebBrain. All rights reserved.
-->
```

## Примеры использования

### Обработка только PowerShell файлов в проекте

```powershell
.\Add-Copyright.ps1 -Path ".\" -FileTypes @(".ps1") -Recursive
```

### Обработка с указанием автора

```powershell
.\Add-Copyright.ps1 -Path ".\scripts\" -Author "GlebBrain" -Recursive
```

### Исключение определенных директорий

```powershell
.\Add-Copyright-All.ps1 -ExcludeDirs @("node_modules", ".git", "temp", "build")
```

## Безопасность

- Скрипт проверяет наличие существующего копирайта и пропускает файлы, которые уже содержат информацию об авторе
- Используется кодировка UTF-8 для корректного отображения символов
- Создается резервная копия перед изменением (опционально)

## Требования

- PowerShell 5.1 или выше
- Права на чтение и запись файлов в целевых директориях
