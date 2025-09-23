# PowerShell скрипт для получения текущей даты и времени
# Использование: .\get-datetime.ps1 [format]
# Форматы: short, long, iso, filename, timestamp

param(
    [string]$Format = "short"
)

# Получаем текущую дату и время
$now = Get-Date

switch ($Format.ToLower()) {
    "short" {
        # Короткий формат: 13-09-2025
        Write-Output $now.ToString("dd-MM-yyyy")
    }
    "long" {
        # Длинный формат: 13 сентября 2025
        $months = @("января", "февраля", "марта", "апреля", "мая", "июня",
                   "июля", "августа", "сентября", "октября", "ноября", "декабря")
        $monthName = $months[$now.Month - 1]
        Write-Output "$($now.Day) $monthName $($now.Year)"
    }
    "iso" {
        # ISO формат: 2025-09-13
        Write-Output $now.ToString("yyyy-MM-dd")
    }
    "filename" {
        # Для имен файлов: 2025-09-13_14-30-25
        Write-Output $now.ToString("yyyy-MM-dd_HH-mm-ss")
    }
    "timestamp" {
        # Unix timestamp
        Write-Output $([int64](([datetime]::UtcNow)-(get-date "1/1/1970")).TotalSeconds)
    }
    "datetime" {
        # Полная дата и время: 13-09-2025 14:30:25
        Write-Output $now.ToString("dd-MM-yyyy HH:mm:ss")
    }
    "time" {
        # Только время: 14:30:25
        Write-Output $now.ToString("HH:mm:ss")
    }
    "year" {
        # Только год: 2025
        Write-Output $now.Year
    }
    "month" {
        # Только месяц: 09
        Write-Output $now.ToString("MM")
    }
    "day" {
        # Только день: 13
        Write-Output $now.ToString("dd")
    }
    "weekday" {
        # День недели: понедельник
        $weekdays = @("воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота")
        Write-Output $weekdays[$now.DayOfWeek.value__]
    }
    default {
        # По умолчанию - короткий формат
        Write-Output $now.ToString("dd-MM-yyyy")
    }
}

# Дополнительные переменные для удобства
$env:CURRENT_DATE = $now.ToString("dd-MM-yyyy")
$env:CURRENT_DATE_ISO = $now.ToString("yyyy-MM-dd")
$env:CURRENT_DATETIME = $now.ToString("dd-MM-yyyy HH:mm:ss")
$env:CURRENT_TIMESTAMP = $now.ToString("yyyy-MM-dd_HH-mm-ss")
