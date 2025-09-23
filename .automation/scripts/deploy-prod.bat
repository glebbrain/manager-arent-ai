@echo off
echo 🚀 Деплой в PROD среду v4.8...
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
    echo 💡 Использование: deploy-prod.bat ProjectName
echo 💡 Настройки берутся из deployment-config.json
    echo.
    echo Примеры:
    echo   deploy-prod.bat MyProject
    echo.
    echo ⚠️  Убедитесь, что проект уже развернут в PROM среде
    pause
    exit /b 1
)

REM Запуск деплоя в PROD
echo 📋 Запуск деплоя в PROD для проекта: %1
    powershell -ExecutionPolicy Bypass -File ".\.automation\scripts\deploy-prod-v4.8.ps1" -ProjectName "%1"

if %errorlevel% equ 0 (
    echo.
    echo ✅ Деплой в PROD завершен успешно!
    echo 📝 Проект готов к работе в продакшн среде
) else (
    echo.
    echo ❌ Ошибка при деплое в PROD. Код ошибки: %errorlevel%
    echo 💡 Проверьте SSH соединение и параметры
)

echo.
pause
