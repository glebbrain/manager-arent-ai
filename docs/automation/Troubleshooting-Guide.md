# Руководство по устранению неполадок - Universal Project Manager v3.5

## 📋 Обзор

Это руководство поможет решить наиболее распространенные проблемы при работе с Universal Project Manager v3.5 и его компонентами.

## 🚨 Критические проблемы

### Проблема: Скрипты не запускаются

#### Симптомы
- Ошибка "Cannot bind argument to parameter"
- Ошибка "A parameter with the name 'Verbose' was defined multiple times"
- Скрипт завершается с ошибкой

#### Решение
1. **Проверьте версию PowerShell:**
   ```powershell
   $PSVersionTable.PSVersion
   ```
   Требуется PowerShell 5.1+ или PowerShell Core 6+

2. **Проверьте политику выполнения:**
   ```powershell
   Get-ExecutionPolicy
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **Используйте улучшенную версию:**
   ```powershell
   # Вместо Invoke-Automation.ps1 используйте:
   pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action status
   ```

### Проблема: Ошибки доступа к файлам

#### Симптомы
- "Could not find a part of the path"
- "Access denied"
- "File not found"

#### Решение
1. **Создайте недостающие папки:**
   ```powershell
   New-Item -ItemType Directory -Path "docs\reports\latest" -Force
   ```

2. **Проверьте права доступа:**
   ```powershell
   Get-Acl .\.automation\ | Format-List
   ```

3. **Запустите PowerShell от имени администратора** (если необходимо)

## ⚠️ Проблемы производительности

### Проблема: Медленная работа скриптов

#### Симптомы
- Скрипты выполняются очень долго
- Высокое потребление CPU/памяти
- Таймауты

#### Решение
1. **Используйте быстрый режим:**
   ```powershell
   pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action status -Quick
   ```

2. **Ограничьте область анализа:**
   ```powershell
   # Анализ только конкретной папки
   pwsh -File .\.automation\Code-Quality-Checker.ps1 -Action check -Path ".automation"
   ```

3. **Отключите ненужные функции:**
   ```powershell
   # Только базовые функции
   pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action status
   ```

### Проблема: Высокое потребление памяти

#### Симптомы
- Ошибка "Out of memory"
- Медленная работа системы
- Зависание скриптов

#### Решение
1. **Ограничьте количество файлов:**
   ```powershell
   # Анализ по частям
   pwsh -File .\.automation\Code-Quality-Checker.ps1 -Action check -Path "folder1"
   pwsh -File .\.automation\Code-Quality-Checker.ps1 -Action check -Path "folder2"
   ```

2. **Используйте фильтрацию:**
   ```powershell
   # Только PowerShell файлы
   Get-ChildItem -Path "." -Filter "*.ps1" | ForEach-Object { ... }
   ```

## 🔧 Проблемы конфигурации

### Проблема: Неправильные параметры

#### Симптомы
- "Cannot validate argument on parameter 'Action'"
- "The argument does not belong to the set"
- Неожиданное поведение скриптов

#### Решение
1. **Проверьте синтаксис команд:**
   ```powershell
   # Правильно
   pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action status
   
   # Неправильно
   pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action status -Action analyze
   ```

2. **Используйте справку:**
   ```powershell
   Get-Help .\.automation\Invoke-Automation-Enhanced.ps1 -Full
   ```

### Проблема: Конфликты версий

#### Симптомы
- Ошибки совместимости
- Неожиданное поведение
- Проблемы с зависимостями

#### Решение
1. **Проверьте версии компонентов:**
   ```powershell
   # PowerShell
   $PSVersionTable.PSVersion
   
   # .NET
   [System.Environment]::Version
   ```

2. **Обновите компоненты:**
   ```powershell
   # Обновление PowerShell (если возможно)
   winget install Microsoft.PowerShell
   ```

## 🐛 Проблемы отладки

### Проблема: Недостаточно информации для отладки

#### Решение
1. **Включите режим отладки:**
   ```powershell
   pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action analyze -DebugMode
   ```

2. **Проверьте логи:**
   ```powershell
   # Логи сохраняются в консольном выводе
   # Для детального анализа используйте:
   pwsh -File .\.automation\Code-Quality-Checker.ps1 -Action analyze -Path "." -DebugMode
   ```

3. **Используйте PowerShell отладчик:**
   ```powershell
   Set-PSBreakpoint -Script .\.automation\Invoke-Automation-Enhanced.ps1 -Line 50
   ```

### Проблема: Сложно найти источник ошибки

#### Решение
1. **Используйте трассировку:**
   ```powershell
   Set-PSDebug -Trace 1
   pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action status
   Set-PSDebug -Off
   ```

2. **Проверьте стек вызовов:**
   ```powershell
   try {
       pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action status
   }
   catch {
       $_.ScriptStackTrace
   }
   ```

## 🔒 Проблемы безопасности

### Проблема: Блокировка выполнения скриптов

#### Симптомы
- "Execution of scripts is disabled on this system"
- "File cannot be loaded because running scripts is disabled"

#### Решение
1. **Измените политику выполнения:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Разблокируйте файлы:**
   ```powershell
   Unblock-File .\.automation\*.ps1
   ```

3. **Проверьте цифровую подпись:**
   ```powershell
   Get-AuthenticodeSignature .\.automation\Invoke-Automation-Enhanced.ps1
   ```

### Проблема: Проблемы с правами доступа

#### Решение
1. **Запустите от имени администратора:**
   - Щелкните правой кнопкой на PowerShell
   - Выберите "Запуск от имени администратора"

2. **Измените владельца файлов:**
   ```powershell
   takeown /f .\.automation\ /r /d y
   icacls .\.automation\ /grant Everyone:F /t
   ```

## 📊 Проблемы отчетов

### Проблема: Отчеты не генерируются

#### Симптомы
- "Could not find a part of the path"
- Пустые отчеты
- Ошибки при сохранении файлов

#### Решение
1. **Создайте папки для отчетов:**
   ```powershell
   New-Item -ItemType Directory -Path "docs\reports" -Force
   New-Item -ItemType Directory -Path "docs\reports\latest" -Force
   ```

2. **Проверьте права записи:**
   ```powershell
   Test-Path "docs\reports" -PathType Container
   ```

3. **Используйте абсолютные пути:**
   ```powershell
   pwsh -File .\.automation\Code-Quality-Checker.ps1 -Action report -Path "." -OutputFile "C:\temp\report.html"
   ```

### Проблема: Некорректные данные в отчетах

#### Решение
1. **Проверьте входные данные:**
   ```powershell
   # Убедитесь, что файлы существуют
   Get-ChildItem -Path "." -Recurse -File | Measure-Object
   ```

2. **Очистите кэш:**
   ```powershell
   # Удалите временные файлы
   Remove-Item -Path "temp\*" -Recurse -Force -ErrorAction SilentlyContinue
   ```

## 🔄 Проблемы обновления

### Проблема: Конфликты при обновлении

#### Решение
1. **Создайте резервную копию:**
   ```powershell
   pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action backup
   ```

2. **Проверьте версии:**
   ```powershell
   # Проверьте версию скрипта
   Select-String -Path ".\.automation\Invoke-Automation-Enhanced.ps1" -Pattern "Version:"
   ```

3. **Выполните миграцию:**
   ```powershell
   pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action migrate
   ```

## 📞 Получение помощи

### Логи для диагностики
При обращении за помощью предоставьте следующую информацию:

1. **Версия PowerShell:**
   ```powershell
   $PSVersionTable
   ```

2. **Версия скрипта:**
   ```powershell
   Select-String -Path ".\.automation\Invoke-Automation-Enhanced.ps1" -Pattern "Version:"
   ```

3. **Полный вывод ошибки:**
   ```powershell
   pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action status -DebugMode 2>&1 | Tee-Object -FilePath "error-log.txt"
   ```

4. **Информация о системе:**
   ```powershell
   Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, TotalPhysicalMemory
   ```

### Полезные команды для диагностики
```powershell
# Проверка всех компонентов
pwsh -File .\.automation\Invoke-Automation-Enhanced.ps1 -Action status -DebugMode

# Анализ качества кода
pwsh -File .\.automation\Code-Quality-Checker.ps1 -Action check -Path "." -OutputFile "diagnostic-report.json"

# Проверка файловой системы
Get-ChildItem -Path ".\.automation" -Recurse | Measure-Object -Property Length -Sum
```

## 📚 Дополнительные ресурсы

- [PowerShell Documentation](https://docs.microsoft.com/en-us/powershell/)
- [PowerShell Troubleshooting](https://docs.microsoft.com/en-us/powershell/scripting/troubleshooting)
- [Universal Project Manager Documentation](../README.md)

---

**Последнее обновление:** 2025-09-09  
**Версия:** 3.5.0  
**Статус:** Production Ready
