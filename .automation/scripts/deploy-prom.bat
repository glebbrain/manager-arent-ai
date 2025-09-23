@echo off
echo 🚀 Деплой в PROM среду v4.8...
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
    echo 💡 Использование: deploy-prom.bat ProjectName [SourcePath]
echo 💡 Настройки берутся из deployment-config.json
    echo.
    echo Примеры:
    echo   deploy-prom.bat MyProject
    echo   deploy-prom.bat MyProject C:\MyProject
    pause
    exit /b 1
)

REM Запуск деплоя в PROM
echo 📋 Запуск деплоя в PROM для проекта: %1
if "%2"=="" (
    powershell -ExecutionPolicy Bypass -File ".\.automation\scripts\deploy-prom-v4.8.ps1" -ProjectName "%1"
) else (
    powershell -ExecutionPolicy Bypass -File ".\.automation\scripts\deploy-prom-v4.8.ps1" -ProjectName "%1" -SourcePath "%2"
)

if %errorlevel% equ 0 (
    echo.
    echo ✅ Деплой в PROM завершен успешно!
    echo 📝 Следующий шаг: deploy-prod.bat %1
) else (
    echo.
    echo ❌ Ошибка при деплое в PROM. Код ошибки: %errorlevel%
    echo 💡 Проверьте параметры и попробуйте снова
)

echo.
pause
