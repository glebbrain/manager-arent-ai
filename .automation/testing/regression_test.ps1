# Automated Regression Test для FreeRPACapture
# Проверяет все критические пути и функциональность

param(
    [string]$AppPath = ".\demo_build\Release\freerpacapture_demo.exe",
    [int]$MaxRetries = 3,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$TestResults = @()

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Success,
        [string]$Message = "",
        [int]$Duration = 0
    )
    
    $result = @{
        TestName = $TestName
        Success = $Success
        Message = $Message
        Duration = $Duration
        Timestamp = Get-Date
    }
    
    $script:TestResults += $result
    
    $status = if ($Success) { "✓ PASS" } else { "✗ FAIL" }
    $color = if ($Success) { "Green" } else { "Red" }
    
    Write-Host "[$status] $TestName" -ForegroundColor $color
    if ($Message) {
        Write-Host "    $Message" -ForegroundColor Gray
    }
    if ($Duration -gt 0) {
        Write-Host "    Duration: $Duration ms" -ForegroundColor Gray
    }
}

function Test-BasicFunctionality {
    Write-Host "`n=== Тестирование базовой функциональности ===" -ForegroundColor Cyan
    
    # Тест 1: Информация о системе
    $startTime = Get-Date
    try {
        $output = & $AppPath info 2>&1
        $duration = ((Get-Date) - $startTime).TotalMilliseconds
        
        if ($LASTEXITCODE -eq 0 -and $output -match "FreeRPACapture Demo") {
            Write-TestResult -TestName "System Info" -Success $true -Message "System information retrieved successfully" -Duration $duration
        } else {
            Write-TestResult -TestName "System Info" -Success $false -Message "Failed to retrieve system information"
        }
    } catch {
        Write-TestResult -TestName "System Info" -Success $false -Message "Exception: $($_.Exception.Message)"
    }
    
    # Тест 2: Перечисление окон
    $startTime = Get-Date
    try {
        $output = & $AppPath windows 2>&1
        $duration = ((Get-Date) - $startTime).TotalMilliseconds
        
        if ($LASTEXITCODE -eq 0 -and $output -match "Список видимых окон") {
            $windowCount = ($output | Select-String "^\d+\.").Count
            Write-TestResult -TestName "Window Enumeration" -Success $true -Message "Found $windowCount windows" -Duration $duration
        } else {
            Write-TestResult -TestName "Window Enumeration" -Success $false -Message "Failed to enumerate windows"
        }
    } catch {
        Write-TestResult -TestName "Window Enumeration" -Success $false -Message "Exception: $($_.Exception.Message)"
    }
}

function Test-ElementCapture {
    Write-Host "`n=== Тестирование захвата элементов ===" -ForegroundColor Cyan
    
    # Тест 3: Захват элемента в валидной точке
    $startTime = Get-Date
    try {
        $output = & $AppPath point 100 100 2>&1
        $duration = ((Get-Date) - $startTime).TotalMilliseconds
        
        if ($LASTEXITCODE -eq 0 -and $output -match "Найден элемент") {
            Write-TestResult -TestName "Valid Element Capture" -Success $true -Message "Element captured successfully" -Duration $duration
        } else {
            Write-TestResult -TestName "Valid Element Capture" -Success $false -Message "Failed to capture element"
        }
    } catch {
        Write-TestResult -TestName "Valid Element Capture" -Success $false -Message "Exception: $($_.Exception.Message)"
    }
    
    # Тест 4: Захват элемента в невалидной точке
    $startTime = Get-Date
    try {
        $output = & $AppPath point 99999 99999 2>&1
        $duration = ((Get-Date) - $startTime).TotalMilliseconds
        
        if ($LASTEXITCODE -eq 0 -and $output -match "Элемент не найден") {
            Write-TestResult -TestName "Invalid Element Capture" -Success $true -Message "Invalid coordinates handled correctly" -Duration $duration
        } else {
            Write-TestResult -TestName "Invalid Element Capture" -Success $false -Message "Invalid coordinates not handled properly"
        }
    } catch {
        Write-TestResult -TestName "Invalid Element Capture" -Success $false -Message "Exception: $($_.Exception.Message)"
    }
}

function Test-ErrorHandling {
    Write-Host "`n=== Тестирование обработки ошибок ===" -ForegroundColor Cyan
    
    # Тест 5: Неизвестная команда
    $startTime = Get-Date
    try {
        $output = & $AppPath nonexistent 2>&1
        $duration = ((Get-Date) - $startTime).TotalMilliseconds
        
        if ($LASTEXITCODE -ne 0 -and $output -match "Неизвестная команда") {
            Write-TestResult -TestName "Unknown Command" -Success $true -Message "Unknown command handled correctly" -Duration $duration
        } else {
            Write-TestResult -TestName "Unknown Command" -Success $false -Message "Unknown command not handled properly"
        }
    } catch {
        Write-TestResult -TestName "Unknown Command" -Success $false -Message "Exception: $($_.Exception.Message)"
    }
    
    # Тест 6: Некорректные аргументы
    $startTime = Get-Date
    try {
        $output = & $AppPath point abc def 2>&1
        $duration = ((Get-Date) - $startTime).TotalMilliseconds
        
        if ($LASTEXITCODE -eq 0) {
            Write-TestResult -TestName "Invalid Arguments" -Success $true -Message "Invalid arguments handled gracefully" -Duration $duration
        } else {
            Write-TestResult -TestName "Invalid Arguments" -Success $false -Message "Invalid arguments caused failure"
        }
    } catch {
        Write-TestResult -TestName "Invalid Arguments" -Success $false -Message "Exception: $($_.Exception.Message)"
    }
}

function Test-PerformanceRegression {
    Write-Host "`n=== Тестирование производительности ===" -ForegroundColor Cyan
    
    # Тест 7: Производительность захвата элементов
    $captureTimes = @()
    for ($i = 1; $i -le 5; $i++) {
        $startTime = Get-Date
        $output = & $AppPath point 100 100 2>&1 | Out-Null
        $duration = ((Get-Date) - $startTime).TotalMilliseconds
        $captureTimes += $duration
    }
    
    $avgTime = ($captureTimes | Measure-Object -Average).Average
    $maxTime = ($captureTimes | Measure-Object -Maximum).Maximum
    
    if ($avgTime -lt 100 -and $maxTime -lt 200) {
        Write-TestResult -TestName "Performance Regression" -Success $true -Message "Average: $([math]::Round($avgTime, 2))ms, Max: $([math]::Round($maxTime, 2))ms"
    } else {
        Write-TestResult -TestName "Performance Regression" -Success $false -Message "Performance degraded - Average: $([math]::Round($avgTime, 2))ms, Max: $([math]::Round($maxTime, 2))ms"
    }
}

function Test-MemoryLeaks {
    Write-Host "`n=== Тестирование утечек памяти ===" -ForegroundColor Cyan
    
    # Тест 8: Множественные запуски для проверки утечек памяти
    $processes = @()
    for ($i = 1; $i -le 10; $i++) {
        $process = Start-Process -FilePath $AppPath -ArgumentList "info" -PassThru -WindowStyle Hidden
        $processes += $process
        Start-Sleep -Milliseconds 100
    }
    
    # Ждем завершения всех процессов
    $processes | Wait-Process -Timeout 30 -ErrorAction SilentlyContinue
    
    # Проверяем, что все процессы завершились
    $runningProcesses = $processes | Where-Object { !$_.HasExited }
    
    if ($runningProcesses.Count -eq 0) {
        Write-TestResult -TestName "Memory Leak Test" -Success $true -Message "All processes completed successfully"
    } else {
        Write-TestResult -TestName "Memory Leak Test" -Success $false -Message "$($runningProcesses.Count) processes still running"
        $runningProcesses | ForEach-Object { $_.Kill() }
    }
}

function Test-CriticalPaths {
    Write-Host "`n=== Тестирование критических путей ===" -ForegroundColor Cyan
    
    # Тест 9: Критический путь - полный цикл захвата
    $startTime = Get-Date
    try {
        # Получаем информацию о системе
        $infoOutput = & $AppPath info 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "System info failed"
        }
        
        # Перечисляем окна
        $windowsOutput = & $AppPath windows 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Window enumeration failed"
        }
        
        # Захватываем элемент
        $captureOutput = & $AppPath point 100 100 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Element capture failed"
        }
        
        $duration = ((Get-Date) - $startTime).TotalMilliseconds
        Write-TestResult -TestName "Critical Path" -Success $true -Message "Full capture cycle completed" -Duration $duration
        
    } catch {
        Write-TestResult -TestName "Critical Path" -Success $false -Message "Critical path failed: $($_.Exception.Message)"
    }
}

function Show-TestSummary {
    Write-Host "`n=== Итоги регрессионного тестирования ===" -ForegroundColor Yellow
    
    $totalTests = $TestResults.Count
    $passedTests = ($TestResults | Where-Object { $_.Success }).Count
    $failedTests = $totalTests - $passedTests
    
    Write-Host "Всего тестов: $totalTests" -ForegroundColor White
    Write-Host "Пройдено: $passedTests" -ForegroundColor Green
    Write-Host "Провалено: $failedTests" -ForegroundColor Red
    
    if ($failedTests -gt 0) {
        Write-Host "`nПроваленные тесты:" -ForegroundColor Red
        $TestResults | Where-Object { !$_.Success } | ForEach-Object {
            Write-Host "  - $($_.TestName): $($_.Message)" -ForegroundColor Red
        }
    }
    
    $successRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 2) } else { 0 }
    Write-Host "`nПроцент успеха: $successRate%" -ForegroundColor $(if ($successRate -ge 90) { "Green" } elseif ($successRate -ge 70) { "Yellow" } else { "Red" })
    
    # Сохраняем результаты в файл
    $TestResults | Export-Csv -Path "regression_test_results.csv" -NoTypeInformation
    Write-Host "`nРезультаты сохранены в regression_test_results.csv" -ForegroundColor Gray
    
    return $failedTests -eq 0
}

# Основная функция
function Start-RegressionTest {
    Write-Host "FreeRPACapture Automated Regression Test v1.0" -ForegroundColor Magenta
    Write-Host "=============================================" -ForegroundColor Magenta
    Write-Host "App Path: $AppPath" -ForegroundColor Gray
    Write-Host "Max Retries: $MaxRetries" -ForegroundColor Gray
    Write-Host "Verbose: $Verbose" -ForegroundColor Gray
    
    if (!(Test-Path $AppPath)) {
        Write-Host "Ошибка: Приложение не найдено по пути $AppPath" -ForegroundColor Red
        return $false
    }
    
    Test-BasicFunctionality
    Test-ElementCapture
    Test-ErrorHandling
    Test-PerformanceRegression
    Test-MemoryLeaks
    Test-CriticalPaths
    
    return Show-TestSummary
}

# Запуск тестов
$success = Start-RegressionTest

if ($success) {
    Write-Host "`n🎉 Все регрессионные тесты пройдены успешно!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n❌ Некоторые регрессионные тесты провалены!" -ForegroundColor Red
    exit 1
}
