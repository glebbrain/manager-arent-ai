@echo off
echo 🚀 Запуск миграции проекта до v4.8...
echo.

REM Проверка наличия PowerShell
powershell -Command "Get-Host" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ОШИБКА: PowerShell не найден
    pause
    exit /b 1
)

REM Запуск полной миграции
echo 📋 Запуск полной миграции...
    powershell -ExecutionPolicy Bypass -File ".\.automation\scripts\migrate-to-v4.8.ps1"

if %errorlevel% equ 0 (
    echo.
    echo ✅ Миграция завершена успешно!
    echo 📝 Следующие шаги:
    echo   1. Запустите PowerShell
    echo   2. Выполните: . .\.automation\scripts\New-Aliases-v4.8.ps1
    echo   3. Проверьте: mpo -Action test
) else (
    echo.
    echo ❌ Ошибка при миграции. Код ошибки: %errorlevel%
    echo 💡 Попробуйте запустить migrate-to-v4.8.ps1 вручную
)

echo.
pause
