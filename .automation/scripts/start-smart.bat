@echo off
echo 🚀 Умный быстрый старт системы v4.8...
echo.

REM Проверка наличия PowerShell
powershell -Command "Get-Host" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ОШИБКА: PowerShell не найден
    pause
    exit /b 1
)

REM Проверка параметров
if "%1"=="" (
    echo ❌ ОШИБКА: Не указан исходный путь
    echo 💡 Использование: start-smart.bat [SourcePath] [Options]
echo 💡 Настройки берутся из start-smart-config.json
    echo.
    echo Примеры:
    echo   start-smart.bat
    echo   start-smart.bat F:\ProjectsAI\ManagerAgentAI
    echo   start-smart.bat F:\ProjectsAI\ManagerAgentAI -Force
    echo   start-smart.bat F:\ProjectsAI\ManagerAgentAI -DryRun
    echo.
    echo Опции:
    echo   -Force     Принудительная замена файлов
    echo   -Backup    Создание резервных копий (по умолчанию)
    echo   -Verbose   Подробный вывод
    echo   -DryRun    Тестовый режим (без изменений)
    pause
    exit /b 1
)

REM Запуск умного быстрого старта
echo 📋 Запуск умного быстрого старта...
if "%1"=="" (
    powershell -ExecutionPolicy Bypass -File ".\.automation\scripts\start-v4.8-config.ps1"
) else (
    powershell -ExecutionPolicy Bypass -File ".\.automation\scripts\start-v4.8-config.ps1" -SourcePath "%1" %2 %3 %4 %5
)

if %errorlevel% equ 0 (
    echo.
    echo ✅ Умный быстрый старт завершен успешно!
    echo 📝 Проект готов к работе с v4.8
) else (
    echo.
    echo ❌ Ошибка при выполнении. Код ошибки: %errorlevel%
    echo 💡 Проверьте параметры и попробуйте снова
)

echo.
pause
