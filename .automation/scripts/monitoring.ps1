# FreeRPA Studio - Monitoring Script
# Мониторинг производительности и состояния системы

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "status", "report", "alerts")]
    [string]$Action,
    
    [int]$Interval = 30,
    [string]$LogPath = "monitoring.log",
    [switch]$RealTime,
    [string]$OutputFormat = "console"
)

# Цвета для вывода
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Blue = "Blue"

# Глобальные переменные
$script:MonitoringActive = $false
$script:MonitoringData = @()
$script:StartTime = $null

# Функция логирования
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO",
        [string]$Color = "White"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    if ($OutputFormat -eq "file") {
        Add-Content -Path $LogPath -Value $logMessage
    } else {
        Write-Host $logMessage -ForegroundColor $Color
    }
}

# Функция сбора метрик системы
function Get-SystemMetrics {
    $metrics = @{}
    
    try {
        # CPU
        $cpu = Get-WmiObject -Class Win32_Processor | Measure-Object -Property LoadPercentage -Average
        $metrics.CPU = [math]::Round($cpu.Average, 2)
        
        # Память
        $memory = Get-WmiObject -Class Win32_OperatingSystem
        $metrics.MemoryTotal = [math]::Round($memory.TotalVisibleMemorySize / 1MB, 2)
        $metrics.MemoryFree = [math]::Round($memory.FreePhysicalMemory / 1MB, 2)
        $metrics.MemoryUsed = $metrics.MemoryTotal - $metrics.MemoryFree
        $metrics.MemoryPercent = [math]::Round(($metrics.MemoryUsed / $metrics.MemoryTotal) * 100, 2)
        
        # Диск
        $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
        $metrics.DiskTotal = [math]::Round($disk.Size / 1GB, 2)
        $metrics.DiskFree = [math]::Round($disk.FreeSpace / 1GB, 2)
        $metrics.DiskUsed = $metrics.DiskTotal - $metrics.DiskFree
        $metrics.DiskPercent = [math]::Round(($metrics.DiskUsed / $metrics.DiskTotal) * 100, 2)
        
        # Сеть
        $network = Get-WmiObject -Class Win32_PerfRawData_Tcpip_NetworkInterface | Where-Object { $_.Name -notlike "*Loopback*" }
        $metrics.NetworkBytesReceived = ($network | Measure-Object -Property BytesReceivedPerSec -Sum).Sum
        $metrics.NetworkBytesSent = ($network | Measure-Object -Property BytesSentPerSec -Sum).Sum
        
        # Процессы
        $processes = Get-Process | Where-Object { $_.ProcessName -in @("node", "dotnet", "python") }
        $metrics.ProcessCount = $processes.Count
        $metrics.ProcessMemory = ($processes | Measure-Object -Property WorkingSet -Sum).Sum / 1MB
        
        # Время работы системы
        $uptime = (Get-Date) - (Get-CimInstance -ClassName Win32_OperatingSystem).LastBootUpTime
        $metrics.Uptime = $uptime.TotalHours
        
        $metrics.Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        
    } catch {
        Write-Log "❌ Failed to collect system metrics: $($_.Exception.Message)" "ERROR" $Red
    }
    
    return $metrics
}

# Функция сбора метрик приложения
function Get-ApplicationMetrics {
    $metrics = @{}
    
    try {
        # Проверка портов
        $ports = @(3000, 5000, 8080, 9090)
        $metrics.Ports = @{}
        
        foreach ($port in $ports) {
            $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet
            $metrics.Ports[$port] = $connection
        }
        
        # Проверка сервисов
        $services = @(
            @{ Name = "VS Code Extension"; Port = 3000 },
            @{ Name = "gRPC Host (.NET)"; Port = 5000 },
            @{ Name = "gRPC Host (Python)"; Port = 8080 },
            @{ Name = "AI Engine"; Port = 9090 }
        )
        
        $metrics.Services = @{}
        foreach ($service in $services) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)/health" -TimeoutSec 5 -UseBasicParsing
                $metrics.Services[$service.Name] = $response.StatusCode -eq 200
            } catch {
                $metrics.Services[$service.Name] = $false
            }
        }
        
        # Размер логов
        $logFiles = Get-ChildItem -Path "." -Include "*.log" -Recurse
        $metrics.LogSize = ($logFiles | Measure-Object -Property Length -Sum).Sum / 1MB
        
        # Количество файлов проекта
        $projectFiles = Get-ChildItem -Path "packages" -Recurse -Include "*.ts", "*.js", "*.cs", "*.py"
        $metrics.ProjectFiles = $projectFiles.Count
        
        $metrics.Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        
    } catch {
        Write-Log "❌ Failed to collect application metrics: $($_.Exception.Message)" "ERROR" $Red
    }
    
    return $metrics
}

# Функция проверки алертов
function Test-Alerts {
    param([hashtable]$Metrics)
    
    $alerts = @()
    
    # CPU алерты
    if ($Metrics.CPU -gt 80) {
        $alerts += @{
            Type = "CPU"
            Level = "WARNING"
            Message = "High CPU usage: $($Metrics.CPU)%"
            Value = $Metrics.CPU
            Threshold = 80
        }
    }
    
    if ($Metrics.CPU -gt 95) {
        $alerts += @{
            Type = "CPU"
            Level = "CRITICAL"
            Message = "Critical CPU usage: $($Metrics.CPU)%"
            Value = $Metrics.CPU
            Threshold = 95
        }
    }
    
    # Память алерты
    if ($Metrics.MemoryPercent -gt 80) {
        $alerts += @{
            Type = "MEMORY"
            Level = "WARNING"
            Message = "High memory usage: $($Metrics.MemoryPercent)%"
            Value = $Metrics.MemoryPercent
            Threshold = 80
        }
    }
    
    if ($Metrics.MemoryPercent -gt 95) {
        $alerts += @{
            Type = "MEMORY"
            Level = "CRITICAL"
            Message = "Critical memory usage: $($Metrics.MemoryPercent)%"
            Value = $Metrics.MemoryPercent
            Threshold = 95
        }
    }
    
    # Диск алерты
    if ($Metrics.DiskPercent -gt 80) {
        $alerts += @{
            Type = "DISK"
            Level = "WARNING"
            Message = "High disk usage: $($Metrics.DiskPercent)%"
            Value = $Metrics.DiskPercent
            Threshold = 80
        }
    }
    
    if ($Metrics.DiskPercent -gt 95) {
        $alerts += @{
            Type = "DISK"
            Level = "CRITICAL"
            Message = "Critical disk usage: $($Metrics.DiskPercent)%"
            Value = $Metrics.DiskPercent
            Threshold = 95
        }
    }
    
    # Сервисы алерты
    foreach ($service in $Metrics.Services.GetEnumerator()) {
        if (-not $service.Value) {
            $alerts += @{
                Type = "SERVICE"
                Level = "CRITICAL"
                Message = "Service $($service.Key) is not responding"
                Value = $service.Value
                Threshold = $true
            }
        }
    }
    
    return $alerts
}

# Функция отображения метрик
function Show-Metrics {
    param(
        [hashtable]$SystemMetrics,
        [hashtable]$AppMetrics,
        [array]$Alerts
    )
    
    Clear-Host
    Write-Log "📊 FreeRPA Studio Monitoring Dashboard" "INFO" $Blue
    Write-Log "===============================================" "INFO" $Blue
    Write-Log "Timestamp: $($SystemMetrics.Timestamp)" "INFO" $Blue
    Write-Log "Uptime: $([math]::Round($SystemMetrics.Uptime, 2)) hours" "INFO" $Blue
    Write-Log "" "INFO" $Blue
    
    # Системные метрики
    Write-Log "🖥️ System Metrics:" "INFO" $Blue
    Write-Log "   CPU Usage: $($SystemMetrics.CPU)%" "INFO" $(if ($SystemMetrics.CPU -gt 80) { $Red } elseif ($SystemMetrics.CPU -gt 60) { $Yellow } else { $Green })
    Write-Log "   Memory: $($SystemMetrics.MemoryUsed)GB / $($SystemMetrics.MemoryTotal)GB ($($SystemMetrics.MemoryPercent)%)" "INFO" $(if ($SystemMetrics.MemoryPercent -gt 80) { $Red } elseif ($SystemMetrics.MemoryPercent -gt 60) { $Yellow } else { $Green })
    Write-Log "   Disk: $($SystemMetrics.DiskUsed)GB / $($SystemMetrics.DiskTotal)GB ($($SystemMetrics.DiskPercent)%)" "INFO" $(if ($SystemMetrics.DiskPercent -gt 80) { $Red } elseif ($SystemMetrics.DiskPercent -gt 60) { $Yellow } else { $Green })
    Write-Log "   Network: ↓$([math]::Round($SystemMetrics.NetworkBytesReceived/1KB, 2))KB/s ↑$([math]::Round($SystemMetrics.NetworkBytesSent/1KB, 2))KB/s" "INFO" $Blue
    Write-Log "" "INFO" $Blue
    
    # Метрики приложения
    Write-Log "🚀 Application Metrics:" "INFO" $Blue
    Write-Log "   Processes: $($SystemMetrics.ProcessCount) (Memory: $([math]::Round($SystemMetrics.ProcessMemory, 2))MB)" "INFO" $Blue
    Write-Log "   Project Files: $($AppMetrics.ProjectFiles)" "INFO" $Blue
    Write-Log "   Log Size: $([math]::Round($AppMetrics.LogSize, 2))MB" "INFO" $Blue
    Write-Log "" "INFO" $Blue
    
    # Порты
    Write-Log "🌐 Ports:" "INFO" $Blue
    foreach ($port in $AppMetrics.Ports.GetEnumerator()) {
        $status = if ($port.Value) { "✅ Open" } else { "❌ Closed" }
        $color = if ($port.Value) { $Green } else { $Red }
        Write-Log "   Port $($port.Key): $status" "INFO" $color
    }
    Write-Log "" "INFO" $Blue
    
    # Сервисы
    Write-Log "🔧 Services:" "INFO" $Blue
    foreach ($service in $AppMetrics.Services.GetEnumerator()) {
        $status = if ($service.Value) { "✅ Running" } else { "❌ Down" }
        $color = if ($service.Value) { $Green } else { $Red }
        Write-Log "   $($service.Key): $status" "INFO" $color
    }
    Write-Log "" "INFO" $Blue
    
    # Алерты
    if ($Alerts.Count -gt 0) {
        Write-Log "🚨 Alerts:" "INFO" $Red
        foreach ($alert in $Alerts) {
            $color = if ($alert.Level -eq "CRITICAL") { $Red } else { $Yellow }
            Write-Log "   [$($alert.Level)] $($alert.Message)" "INFO" $color
        }
        Write-Log "" "INFO" $Blue
    } else {
        Write-Log "✅ No alerts" "INFO" $Green
        Write-Log "" "INFO" $Blue
    }
    
    Write-Log "===============================================" "INFO" $Blue
    Write-Log "Press Ctrl+C to stop monitoring" "INFO" $Blue
}

# Функция сохранения метрик
function Save-Metrics {
    param(
        [hashtable]$SystemMetrics,
        [hashtable]$AppMetrics,
        [array]$Alerts
    )
    
    $data = @{
        Timestamp = $SystemMetrics.Timestamp
        System = $SystemMetrics
        Application = $AppMetrics
        Alerts = $Alerts
    }
    
    $script:MonitoringData += $data
    
    # Сохранение в файл
    $data | ConvertTo-Json | Add-Content -Path "monitoring-data.json"
}

# Функция генерации отчета
function New-MonitoringReport {
    param([string]$OutputPath = "monitoring-report.html")
    
    if ($script:MonitoringData.Count -eq 0) {
        Write-Log "❌ No monitoring data available" "ERROR" $Red
        return
    }
    
    Write-Log "📊 Generating monitoring report..." "INFO" $Blue
    
    $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>FreeRPA Studio Monitoring Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .metric { margin: 10px 0; padding: 10px; border-left: 4px solid #007acc; }
        .alert { margin: 10px 0; padding: 10px; border-left: 4px solid #ff6b6b; background-color: #ffe0e0; }
        .success { border-left-color: #51cf66; background-color: #e0ffe0; }
        .warning { border-left-color: #ffd43b; background-color: #fff9e0; }
        .critical { border-left-color: #ff6b6b; background-color: #ffe0e0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>FreeRPA Studio Monitoring Report</h1>
        <p>Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")</p>
        <p>Data Points: $($script:MonitoringData.Count)</p>
    </div>
"@
    
    # Статистика
    $avgCpu = ($script:MonitoringData | Measure-Object -Property "System.CPU" -Average).Average
    $avgMemory = ($script:MonitoringData | Measure-Object -Property "System.MemoryPercent" -Average).Average
    $avgDisk = ($script:MonitoringData | Measure-Object -Property "System.DiskPercent" -Average).Average
    
    $html += @"
    <h2>📊 Summary Statistics</h2>
    <div class="metric">
        <strong>Average CPU Usage:</strong> $([math]::Round($avgCpu, 2))%
    </div>
    <div class="metric">
        <strong>Average Memory Usage:</strong> $([math]::Round($avgMemory, 2))%
    </div>
    <div class="metric">
        <strong>Average Disk Usage:</strong> $([math]::Round($avgDisk, 2))%
    </div>
"@
    
    # Алерты
    $allAlerts = $script:MonitoringData | ForEach-Object { $_.Alerts } | Where-Object { $_ }
    if ($allAlerts.Count -gt 0) {
        $html += "<h2>🚨 Alerts</h2>"
        foreach ($alert in $allAlerts) {
            $class = $alert.Level.ToLower()
            $html += "<div class='alert $class'><strong>[$($alert.Level)]</strong> $($alert.Message)</div>"
        }
    }
    
    # График метрик
    $html += @"
    <h2>📈 Metrics Timeline</h2>
    <table>
        <tr>
            <th>Timestamp</th>
            <th>CPU %</th>
            <th>Memory %</th>
            <th>Disk %</th>
            <th>Processes</th>
        </tr>
"@
    
    foreach ($data in $script:MonitoringData) {
        $html += @"
        <tr>
            <td>$($data.Timestamp)</td>
            <td>$($data.System.CPU)</td>
            <td>$($data.System.MemoryPercent)</td>
            <td>$($data.System.DiskPercent)</td>
            <td>$($data.System.ProcessCount)</td>
        </tr>
"@
    }
    
    $html += @"
    </table>
</body>
</html>
"@
    
    $html | Out-File -FilePath $OutputPath -Encoding UTF8
    Write-Log "✅ Monitoring report generated: $OutputPath" "SUCCESS" $Green
}

# Функция запуска мониторинга
function Start-Monitoring {
    Write-Log "🚀 Starting FreeRPA Studio monitoring..." "INFO" $Blue
    Write-Log "Interval: $Interval seconds" "INFO" $Blue
    Write-Log "Real-time: $RealTime" "INFO" $Blue
    Write-Log "===============================================" "INFO" $Blue
    
    $script:MonitoringActive = $true
    $script:StartTime = Get-Date
    $script:MonitoringData = @()
    
    try {
        while ($script:MonitoringActive) {
            $systemMetrics = Get-SystemMetrics
            $appMetrics = Get-ApplicationMetrics
            $alerts = Test-Alerts -Metrics $systemMetrics
            
            Save-Metrics -SystemMetrics $systemMetrics -AppMetrics $appMetrics -Alerts $alerts
            
            if ($RealTime) {
                Show-Metrics -SystemMetrics $systemMetrics -AppMetrics $appMetrics -Alerts $alerts
            } else {
                Write-Log "📊 Metrics collected at $($systemMetrics.Timestamp)" "INFO" $Blue
                if ($alerts.Count -gt 0) {
                    foreach ($alert in $alerts) {
                        $color = if ($alert.Level -eq "CRITICAL") { $Red } else { $Yellow }
                        Write-Log "🚨 [$($alert.Level)] $($alert.Message)" "ALERT" $color
                    }
                }
            }
            
            Start-Sleep -Seconds $Interval
        }
    } catch {
        Write-Log "❌ Monitoring failed: $($_.Exception.Message)" "ERROR" $Red
    } finally {
        $script:MonitoringActive = $false
        Write-Log "🛑 Monitoring stopped" "INFO" $Blue
    }
}

# Функция остановки мониторинга
function Stop-Monitoring {
    Write-Log "🛑 Stopping monitoring..." "INFO" $Blue
    $script:MonitoringActive = $false
}

# Функция показа статуса
function Show-Status {
    if ($script:MonitoringActive) {
        $duration = (Get-Date) - $script:StartTime
        Write-Log "✅ Monitoring is active" "SUCCESS" $Green
        Write-Log "Duration: $([math]::Round($duration.TotalMinutes, 2)) minutes" "INFO" $Blue
        Write-Log "Data points: $($script:MonitoringData.Count)" "INFO" $Blue
    } else {
        Write-Log "❌ Monitoring is not active" "ERROR" $Red
    }
}

# Обработка Ctrl+C
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    if ($script:MonitoringActive) {
        Stop-Monitoring
    }
}

# Основная логика
switch ($Action) {
    "start" {
        Start-Monitoring
    }
    "stop" {
        Stop-Monitoring
    }
    "status" {
        Show-Status
    }
    "report" {
        New-MonitoringReport
    }
    "alerts" {
        $systemMetrics = Get-SystemMetrics
        $alerts = Test-Alerts -Metrics $systemMetrics
        if ($alerts.Count -gt 0) {
            foreach ($alert in $alerts) {
                $color = if ($alert.Level -eq "CRITICAL") { $Red } else { $Yellow }
                Write-Log "🚨 [$($alert.Level)] $($alert.Message)" "ALERT" $color
            }
        } else {
            Write-Log "✅ No active alerts" "SUCCESS" $Green
        }
    }
}

# Очистка при выходе
$null = Unregister-Event -SourceIdentifier PowerShell.Exiting
