# FreeRPA Studio - Health Check Script
# Проверка здоровья системы и всех компонентов

param(
    [switch]$Detailed,
    [switch]$Fix,
    [string]$Output = "console"
)

# Цвета для вывода
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Blue = "Blue"

# Функция логирования
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO",
        [string]$Color = "White"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    if ($Output -eq "file") {
        Add-Content -Path "health-check.log" -Value $logMessage
    } else {
        Write-Host $logMessage -ForegroundColor $Color
    }
}

# Функция проверки сервиса
function Test-ServiceHealth {
    param(
        [string]$ServiceName,
        [string]$Endpoint,
        [int]$Timeout = 30
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Endpoint -TimeoutSec $Timeout -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Log "✅ $ServiceName is healthy" "SUCCESS" $Green
            return $true
        } else {
            Write-Log "❌ $ServiceName returned status $($response.StatusCode)" "ERROR" $Red
            return $false
        }
    } catch {
        Write-Log "❌ $ServiceName is not responding: $($_.Exception.Message)" "ERROR" $Red
        return $false
    }
}

# Функция проверки ресурсов
function Test-SystemResources {
    $cpu = Get-WmiObject -Class Win32_Processor | Measure-Object -Property LoadPercentage -Average
    $memory = Get-WmiObject -Class Win32_OperatingSystem
    $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
    
    $cpuUsage = [math]::Round($cpu.Average, 2)
    $memoryUsage = [math]::Round((($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) / $memory.TotalVisibleMemorySize) * 100, 2)
    $diskUsage = [math]::Round((($disk.Size - $disk.FreeSpace) / $disk.Size) * 100, 2)
    
    Write-Log "📊 System Resources:" "INFO" $Blue
    Write-Log "   CPU Usage: $cpuUsage%" "INFO" $(if ($cpuUsage -gt 80) { $Red } elseif ($cpuUsage -gt 60) { $Yellow } else { $Green })
    Write-Log "   Memory Usage: $memoryUsage%" "INFO" $(if ($memoryUsage -gt 80) { $Red } elseif ($memoryUsage -gt 60) { $Yellow } else { $Green })
    Write-Log "   Disk Usage: $diskUsage%" "INFO" $(if ($diskUsage -gt 80) { $Red } elseif ($diskUsage -gt 60) { $Yellow } else { $Green })
    
    return @{
        CPU = $cpuUsage
        Memory = $memoryUsage
        Disk = $diskUsage
        Healthy = ($cpuUsage -lt 80 -and $memoryUsage -lt 80 -and $diskUsage -lt 80)
    }
}

# Функция проверки процессов
function Test-Processes {
    $processes = @(
        @{ Name = "node"; MinInstances = 1 },
        @{ Name = "dotnet"; MinInstances = 1 },
        @{ Name = "python"; MinInstances = 1 }
    )
    
    $allHealthy = $true
    
    foreach ($process in $processes) {
        $count = (Get-Process -Name $process.Name -ErrorAction SilentlyContinue).Count
        if ($count -ge $process.MinInstances) {
            Write-Log "✅ $($process.Name) processes: $count" "SUCCESS" $Green
        } else {
            Write-Log "❌ $($process.Name) processes: $count (expected: $($process.MinInstances))" "ERROR" $Red
            $allHealthy = $false
        }
    }
    
    return $allHealthy
}

# Функция проверки портов
function Test-Ports {
    $ports = @(3000, 5000, 8080, 9090)
    $allHealthy = $true
    
    foreach ($port in $ports) {
        $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet
        if ($connection) {
            Write-Log "✅ Port $port is open" "SUCCESS" $Green
        } else {
            Write-Log "❌ Port $port is closed" "ERROR" $Red
            $allHealthy = $false
        }
    }
    
    return $allHealthy
}

# Функция проверки файловой системы
function Test-FileSystem {
    $paths = @(
        "packages\extension\out",
        "packages\cli\dist",
        "packages\converters\dist",
        "packages\orchestration\dist",
        "packages\ai-engine\dist"
    )
    
    $allHealthy = $true
    
    foreach ($path in $paths) {
        if (Test-Path $path) {
            Write-Log "✅ Path $path exists" "SUCCESS" $Green
        } else {
            Write-Log "❌ Path $path is missing" "ERROR" $Red
            $allHealthy = $false
        }
    }
    
    return $allHealthy
}

# Функция проверки зависимостей
function Test-Dependencies {
    $dependencies = @(
        @{ Name = "Node.js"; Command = "node --version"; MinVersion = "18.0.0" },
        @{ Name = ".NET"; Command = "dotnet --version"; MinVersion = "8.0.0" },
        @{ Name = "Python"; Command = "python --version"; MinVersion = "3.8.0" },
        @{ Name = "npm"; Command = "npm --version"; MinVersion = "9.0.0" }
    )
    
    $allHealthy = $true
    
    foreach ($dep in $dependencies) {
        try {
            $version = Invoke-Expression $dep.Command 2>$null
            if ($version) {
                Write-Log "✅ $($dep.Name): $version" "SUCCESS" $Green
            } else {
                Write-Log "❌ $($dep.Name) not found" "ERROR" $Red
                $allHealthy = $false
            }
        } catch {
            Write-Log "❌ $($dep.Name) not found: $($_.Exception.Message)" "ERROR" $Red
            $allHealthy = $false
        }
    }
    
    return $allHealthy
}

# Функция проверки конфигурации
function Test-Configuration {
    $configFiles = @(
        "package.json",
        "packages\extension\package.json",
        "packages\cli\package.json",
        "packages\converters\package.json",
        "packages\orchestration\package.json",
        "packages\ai-engine\package.json"
    )
    
    $allHealthy = $true
    
    foreach ($config in $configFiles) {
        if (Test-Path $config) {
            try {
                $content = Get-Content $config -Raw | ConvertFrom-Json
                Write-Log "✅ Configuration $config is valid" "SUCCESS" $Green
            } catch {
                Write-Log "❌ Configuration $config is invalid: $($_.Exception.Message)" "ERROR" $Red
                $allHealthy = $false
            }
        } else {
            Write-Log "❌ Configuration $config is missing" "ERROR" $Red
            $allHealthy = $false
        }
    }
    
    return $allHealthy
}

# Функция автоматического исправления
function Repair-System {
    Write-Log "🔧 Starting automatic repair..." "INFO" $Blue
    
    # Перезапуск сервисов
    Write-Log "🔄 Restarting services..." "INFO" $Blue
    try {
        if (Get-Process -Name "node" -ErrorAction SilentlyContinue) {
            Stop-Process -Name "node" -Force
            Start-Sleep -Seconds 2
        }
        if (Get-Process -Name "dotnet" -ErrorAction SilentlyContinue) {
            Stop-Process -Name "dotnet" -Force
            Start-Sleep -Seconds 2
        }
        Write-Log "✅ Services restarted" "SUCCESS" $Green
    } catch {
        Write-Log "❌ Failed to restart services: $($_.Exception.Message)" "ERROR" $Red
    }
    
    # Очистка временных файлов
    Write-Log "🧹 Cleaning temporary files..." "INFO" $Blue
    try {
        Remove-Item -Path "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item -Path "packages\*\dist" -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item -Path "packages\*\out" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Log "✅ Temporary files cleaned" "SUCCESS" $Green
    } catch {
        Write-Log "❌ Failed to clean temporary files: $($_.Exception.Message)" "ERROR" $Red
    }
    
    # Переустановка зависимостей
    Write-Log "📦 Reinstalling dependencies..." "INFO" $Blue
    try {
        npm install
        Write-Log "✅ Dependencies reinstalled" "SUCCESS" $Green
    } catch {
        Write-Log "❌ Failed to reinstall dependencies: $($_.Exception.Message)" "ERROR" $Red
    }
}

# Основная функция
function Start-HealthCheck {
    Write-Log "🏥 Starting FreeRPA Studio Health Check..." "INFO" $Blue
    Write-Log "===============================================" "INFO" $Blue
    
    $results = @{
        SystemResources = $false
        Processes = $false
        Ports = $false
        FileSystem = $false
        Dependencies = $false
        Configuration = $false
        Overall = $false
    }
    
    # Проверка системных ресурсов
    Write-Log "📊 Checking system resources..." "INFO" $Blue
    $resourceResult = Test-SystemResources
    $results.SystemResources = $resourceResult.Healthy
    
    # Проверка процессов
    Write-Log "🔄 Checking processes..." "INFO" $Blue
    $results.Processes = Test-Processes
    
    # Проверка портов
    Write-Log "🌐 Checking ports..." "INFO" $Blue
    $results.Ports = Test-Ports
    
    # Проверка файловой системы
    Write-Log "📁 Checking file system..." "INFO" $Blue
    $results.FileSystem = Test-FileSystem
    
    # Проверка зависимостей
    Write-Log "📦 Checking dependencies..." "INFO" $Blue
    $results.Dependencies = Test-Dependencies
    
    # Проверка конфигурации
    Write-Log "⚙️ Checking configuration..." "INFO" $Blue
    $results.Configuration = Test-Configuration
    
    # Детальная проверка сервисов
    if ($Detailed) {
        Write-Log "🔍 Detailed service check..." "INFO" $Blue
        $services = @(
            @{ Name = "VS Code Extension"; Endpoint = "http://localhost:3000/health" },
            @{ Name = "gRPC Host (.NET)"; Endpoint = "http://localhost:5000/health" },
            @{ Name = "gRPC Host (Python)"; Endpoint = "http://localhost:8080/health" },
            @{ Name = "AI Engine"; Endpoint = "http://localhost:9090/health" }
        )
        
        foreach ($service in $services) {
            Test-ServiceHealth -ServiceName $service.Name -Endpoint $service.Endpoint
        }
    }
    
    # Определение общего статуса
    $results.Overall = $results.SystemResources -and $results.Processes -and $results.Ports -and $results.FileSystem -and $results.Dependencies -and $results.Configuration
    
    # Вывод результатов
    Write-Log "===============================================" "INFO" $Blue
    Write-Log "📋 Health Check Results:" "INFO" $Blue
    Write-Log "   System Resources: $(if ($results.SystemResources) { '✅' } else { '❌' })" "INFO" $(if ($results.SystemResources) { $Green } else { $Red })
    Write-Log "   Processes: $(if ($results.Processes) { '✅' } else { '❌' })" "INFO" $(if ($results.Processes) { $Green } else { $Red })
    Write-Log "   Ports: $(if ($results.Ports) { '✅' } else { '❌' })" "INFO" $(if ($results.Ports) { $Green } else { $Red })
    Write-Log "   File System: $(if ($results.FileSystem) { '✅' } else { '❌' })" "INFO" $(if ($results.FileSystem) { $Green } else { $Red })
    Write-Log "   Dependencies: $(if ($results.Dependencies) { '✅' } else { '❌' })" "INFO" $(if ($results.Dependencies) { $Green } else { $Red })
    Write-Log "   Configuration: $(if ($results.Configuration) { '✅' } else { '❌' })" "INFO" $(if ($results.Configuration) { $Green } else { $Red })
    Write-Log "   Overall Status: $(if ($results.Overall) { '✅ HEALTHY' } else { '❌ UNHEALTHY' })" "INFO" $(if ($results.Overall) { $Green } else { $Red })
    
    # Автоматическое исправление
    if ($Fix -and -not $results.Overall) {
        Write-Log "🔧 System is unhealthy, attempting automatic repair..." "WARNING" $Yellow
        Repair-System
        
        # Повторная проверка после исправления
        Write-Log "🔄 Re-running health check after repair..." "INFO" $Blue
        Start-Sleep -Seconds 5
        Start-HealthCheck
    }
    
    # Сохранение результатов
    if ($Output -eq "file") {
        $results | ConvertTo-Json | Out-File -FilePath "health-check-results.json" -Encoding UTF8
        Write-Log "📄 Results saved to health-check-results.json" "INFO" $Blue
    }
    
    return $results
}

# Запуск проверки
try {
    $results = Start-HealthCheck
    
    if ($results.Overall) {
        Write-Log "🎉 FreeRPA Studio is healthy and ready to use!" "SUCCESS" $Green
        exit 0
    } else {
        Write-Log "⚠️ FreeRPA Studio has issues that need attention" "WARNING" $Yellow
        exit 1
    }
} catch {
    Write-Log "💥 Health check failed with error: $($_.Exception.Message)" "ERROR" $Red
    exit 2
}
