@echo off
echo 🚀 Полный workflow деплоя DEV->PROM->PROD v4.8...
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
    echo ❌ ОШИБКА: Не указано имя проекта
    echo 💡 Использование: deploy-full.bat ProjectName [SourcePath]
echo 💡 Настройки берутся из deployment-config.json
    echo.
    echo Примеры:
    echo   deploy-full.bat MyProject
    echo   deploy-full.bat MyProject C:\MyProject
    echo.
    echo 🔄 Выполнит полный workflow: DEV -> PROM -> PROD
    pause
    exit /b 1
)

REM Запуск полного workflow
echo 📋 Запуск полного workflow для проекта: %1
if "%2"=="" (
    powershell -ExecutionPolicy Bypass -File ".\.automation\scripts\deploy-full-v4.8.ps1" -ProjectName "%1"
) else (
    powershell -ExecutionPolicy Bypass -File ".\.automation\scripts\deploy-full-v4.8.ps1" -ProjectName "%1" -SourcePath "%2"
)

if %errorlevel% equ 0 (
    echo.
    echo ✅ Полный workflow завершен успешно!
    echo 📝 Проект развернут в PROM и PROD средах
) else (
    echo.
    echo ❌ Ошибка при выполнении workflow. Код ошибки: %errorlevel%
    echo 💡 Проверьте параметры и соединения
)

echo.
pause
