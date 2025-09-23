@echo off
echo 🚀 Запуск быстрого старта системы v4.8...
echo.

REM Проверка наличия PowerShell
powershell -Command "Get-Host" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ОШИБКА: PowerShell не найден
    pause
    exit /b 1
)

REM Запуск упрощенного скрипта
echo 📋 Запуск упрощенного быстрого старта...
powershell -ExecutionPolicy Bypass -File "start-v4.8.ps1"

if %errorlevel% equ 0 (
    echo.
    echo ✅ Быстрый старт завершен успешно!
    echo 📝 Теперь доступны команды: mpo, qai, qas, qam
) else (
    echo.
    echo ❌ Ошибка при быстром старте. Код ошибки: %errorlevel%
    echo 💡 Попробуйте запустить start-v4.8.ps1 вручную
)

echo.
pause
