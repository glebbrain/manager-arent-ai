# 🔧 Predictive Maintenance Manager v2.8.0
# PowerShell script for managing the Predictive Maintenance service.
# Version: 2.8.0
# Last Updated: 2025-02-01

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "status", # Possible actions: status, start, stop, restart, deploy, get-config, start-monitoring, stop-monitoring, get-metrics, get-alerts, get-health, get-predictions, schedule-maintenance, get-maintenance, get-analytics
    
    [Parameter(Mandatory=$false)]
    [string]$Type = "preventive", # Maintenance type for scheduling
    
    [Parameter(Mandatory=$false)]
    [string]$Priority = "medium", # Maintenance priority
    
    [Parameter(Mandatory=$false)]
    [string]$Description = "Routine system maintenance", # Maintenance description
    
    [Parameter(Mandatory=$false)]
    [string]$AlertType, # Alert type filter (warning, critical)
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceUrl = "http://localhost:3028",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host "🔧 Predictive Maintenance Manager v2.8.0" -ForegroundColor Cyan
Write-Host "📅 Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

function Invoke-HttpRequest {
    param(
        [string]$Uri,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        $Body = $null
    )
    
    $params = @{
        Uri = $Uri
        Method = $Method
        Headers = $Headers
        ContentType = "application/json"
    }
    
    if ($Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 10)
    }
    
    try {
        $response = Invoke-RestMethod @params
        return $response
    } catch {
        Write-Error "HTTP Request failed: $($_.Exception.Message)"
        return $null
    }
}

function Get-ServiceStatus {
    Write-Host "Checking service status at $ServiceUrl/health..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/health"
    if ($response) {
        Write-Host "Service Status: $($response.status)" -ForegroundColor Green
        Write-Host "Version: $($response.version)" -ForegroundColor Green
        Write-Host "Features: $($response.features.Count) enabled" -ForegroundColor Green
        Write-Host "Monitoring: $($response.monitoring)" -ForegroundColor Green
        Write-Host "Metrics: $($response.metrics)" -ForegroundColor Green
        Write-Host "Alerts: $($response.alerts)" -ForegroundColor Green
        Write-Host "Predictions: $($response.predictions)" -ForegroundColor Green
        Write-Host "Maintenance: $($response.maintenance)" -ForegroundColor Green
    } else {
        Write-Host "Service is not reachable or returned an error." -ForegroundColor Red
    }
}

function Get-ServiceConfig {
    Write-Host "Retrieving Predictive Maintenance configuration from $ServiceUrl/api/config..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/config"
    if ($response) {
        Write-Host "Configuration:" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 5 | Write-Host
    } else {
        Write-Host "Failed to retrieve service config." -ForegroundColor Red
    }
}

function Start-Monitoring {
    Write-Host "Starting system monitoring..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/monitoring/start" -Method "POST"
    if ($response) {
        Write-Host "Monitoring Status: $($response.success)" -ForegroundColor Green
        Write-Host "Message: $($response.message)" -ForegroundColor Green
        Write-Host "Timestamp: $($response.timestamp)" -ForegroundColor Green
    } else {
        Write-Host "Failed to start monitoring." -ForegroundColor Red
    }
}

function Stop-Monitoring {
    Write-Host "Stopping system monitoring..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/monitoring/stop" -Method "POST"
    if ($response) {
        Write-Host "Monitoring Status: $($response.success)" -ForegroundColor Green
        Write-Host "Message: $($response.message)" -ForegroundColor Green
        Write-Host "Timestamp: $($response.timestamp)" -ForegroundColor Green
    } else {
        Write-Host "Failed to stop monitoring." -ForegroundColor Red
    }
}

function Get-SystemMetrics {
    Write-Host "Retrieving system metrics..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/metrics?limit=5"
    if ($response) {
        Write-Host "System Metrics (Latest $($response.metrics.Count) of $($response.total)):" -ForegroundColor Green
        $response.metrics | ForEach-Object {
            Write-Host "  Timestamp: $($_.timestamp)" -ForegroundColor White
            Write-Host "  CPU Usage: $($_.cpu.usage)%" -ForegroundColor White
            Write-Host "  Memory Usage: $($_.memory.usage)%" -ForegroundColor White
            Write-Host "  Disk Usage: $([math]::Round(($_.disk | Measure-Object -Property usage -Average).Average, 2))%" -ForegroundColor White
            Write-Host "  Processes: $($_.processes.running)/$($_.processes.total)" -ForegroundColor White
            Write-Host "  Uptime: $([math]::Round($_.uptime / 3600, 2)) hours" -ForegroundColor White
            Write-Host "  ---" -ForegroundColor Gray
        }
    } else {
        Write-Host "Failed to retrieve system metrics." -ForegroundColor Red
    }
}

function Get-SystemAlerts {
    Write-Host "Retrieving system alerts..." -ForegroundColor Yellow
    $uri = "$ServiceUrl/api/alerts"
    if ($AlertType) {
        $uri += "?type=$AlertType"
    }
    
    $response = Invoke-HttpRequest -Uri $uri
    if ($response) {
        Write-Host "System Alerts (Total: $($response.total)):" -ForegroundColor Green
        $response.alerts | ForEach-Object {
            $color = if ($_.type -eq "critical") { "Red" } else { "Yellow" }
            Write-Host "  ID: $($_.id)" -ForegroundColor White
            Write-Host "  Type: $($_.type)" -ForegroundColor $color
            Write-Host "  Metric: $($_.metric)" -ForegroundColor White
            Write-Host "  Value: $($_.value)%" -ForegroundColor White
            Write-Host "  Threshold: $($_.threshold)%" -ForegroundColor White
            Write-Host "  Message: $($_.message)" -ForegroundColor White
            Write-Host "  Timestamp: $($_.timestamp)" -ForegroundColor White
            Write-Host "  ---" -ForegroundColor Gray
        }
    } else {
        Write-Host "Failed to retrieve system alerts." -ForegroundColor Red
    }
}

function Get-SystemHealth {
    Write-Host "Retrieving system health status..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/health"
    if ($response) {
        if ($response.health) {
            $health = $response.health
            $color = switch ($health.status) {
                "excellent" { "Green" }
                "good" { "Green" }
                "fair" { "Yellow" }
                "poor" { "Red" }
                "critical" { "Red" }
                default { "White" }
            }
            
            Write-Host "Current Health Status:" -ForegroundColor Green
            Write-Host "  Score: $($health.score)/100" -ForegroundColor $color
            Write-Host "  Status: $($health.status)" -ForegroundColor $color
            Write-Host "  Timestamp: $($health.timestamp)" -ForegroundColor White
            
            if ($health.trends) {
                Write-Host "  Trends:" -ForegroundColor Cyan
                Write-Host "    CPU: $($health.trends.cpu)" -ForegroundColor White
                Write-Host "    Memory: $($health.trends.memory)" -ForegroundColor White
                Write-Host "    Disk: $($health.trends.disk)" -ForegroundColor White
            }
            
            if ($health.recommendations -and $health.recommendations.Count -gt 0) {
                Write-Host "  Recommendations:" -ForegroundColor Magenta
                $health.recommendations | ForEach-Object {
                    Write-Host "    - $($_.action) ($($_.priority) priority)" -ForegroundColor Yellow
                    Write-Host "      $($_.description)" -ForegroundColor Gray
                }
            }
        } else {
            Write-Host "No health data available." -ForegroundColor Yellow
        }
    } else {
        Write-Host "Failed to retrieve system health." -ForegroundColor Red
    }
}

function Get-Predictions {
    Write-Host "Retrieving predictive analysis..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/predictions"
    if ($response) {
        Write-Host "Predictive Analysis (Total: $($response.total)):" -ForegroundColor Green
        if ($response.predictions.Count -gt 0) {
            $latest = $response.predictions[0]
            Write-Host "  Latest Predictions (Confidence: $($latest.confidence)):" -ForegroundColor Cyan
            $latest.predictions | ForEach-Object {
                Write-Host "    $($_.metric): $($_.current)% -> $([math]::Round($_.predicted, 2))% ($($_.trend))" -ForegroundColor White
            }
            Write-Host "  Timeframe: $($latest.timeframe)" -ForegroundColor White
            Write-Host "  Timestamp: $($latest.timestamp)" -ForegroundColor White
        } else {
            Write-Host "  No predictions available yet." -ForegroundColor Yellow
        }
    } else {
        Write-Host "Failed to retrieve predictions." -ForegroundColor Red
    }
}

function Schedule-Maintenance {
    param(
        [string]$MaintenanceType,
        [string]$MaintenancePriority,
        [string]$MaintenanceDescription
    )
    Write-Host "Scheduling maintenance..." -ForegroundColor Yellow
    Write-Host "Type: $MaintenanceType" -ForegroundColor Yellow
    Write-Host "Priority: $MaintenancePriority" -ForegroundColor Yellow
    Write-Host "Description: $MaintenanceDescription" -ForegroundColor Yellow
    
    $body = @{
        type = $MaintenanceType
        priority = $MaintenancePriority
        description = $MaintenanceDescription
    }
    
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/maintenance/schedule" -Method "POST" -Body $body
    if ($response) {
        Write-Host "Maintenance Scheduling Result:" -ForegroundColor Green
        Write-Host "Success: $($response.success)" -ForegroundColor Green
        Write-Host "Maintenance ID: $($response.maintenance.id)" -ForegroundColor Green
        Write-Host "Type: $($response.maintenance.type)" -ForegroundColor Green
        Write-Host "Priority: $($response.maintenance.priority)" -ForegroundColor Green
        Write-Host "Status: $($response.maintenance.status)" -ForegroundColor Green
        Write-Host "Scheduled Time: $($response.maintenance.scheduledTime)" -ForegroundColor Green
        Write-Host "Estimated Duration: $($response.maintenance.estimatedDuration)" -ForegroundColor Green
        Write-Host "Assigned To: $($response.maintenance.assignedTo)" -ForegroundColor Green
    } else {
        Write-Host "Failed to schedule maintenance." -ForegroundColor Red
    }
}

function Get-MaintenanceSchedule {
    Write-Host "Retrieving maintenance schedule..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/maintenance"
    if ($response) {
        Write-Host "Maintenance Schedule (Total: $($response.total)):" -ForegroundColor Green
        $response.maintenance | ForEach-Object {
            Write-Host "  ID: $($_.id)" -ForegroundColor White
            Write-Host "  Type: $($_.type)" -ForegroundColor White
            Write-Host "  Priority: $($_.priority)" -ForegroundColor White
            Write-Host "  Status: $($_.status)" -ForegroundColor White
            Write-Host "  Description: $($_.description)" -ForegroundColor White
            Write-Host "  Scheduled: $($_.scheduledTime)" -ForegroundColor White
            Write-Host "  Duration: $($_.estimatedDuration)" -ForegroundColor White
            Write-Host "  Assigned To: $($_.assignedTo)" -ForegroundColor White
            Write-Host "  ---" -ForegroundColor Gray
        }
    } else {
        Write-Host "Failed to retrieve maintenance schedule." -ForegroundColor Red
    }
}

function Get-Analytics {
    Write-Host "Retrieving system analytics..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/analytics"
    if ($response) {
        Write-Host "System Analytics:" -ForegroundColor Green
        Write-Host "  Total Metrics: $($response.analytics.totalMetrics)" -ForegroundColor White
        Write-Host "  Total Alerts: $($response.analytics.totalAlerts)" -ForegroundColor White
        Write-Host "  Total Predictions: $($response.analytics.totalPredictions)" -ForegroundColor White
        Write-Host "  Total Maintenance: $($response.analytics.totalMaintenance)" -ForegroundColor White
        Write-Host "  Average Health Score: $([math]::Round($response.analytics.averageHealthScore, 2))" -ForegroundColor White
        Write-Host "  System Uptime: $($response.analytics.systemUptime)%" -ForegroundColor White
        Write-Host "  Critical Alerts: $($response.analytics.criticalAlerts)" -ForegroundColor White
        Write-Host "  Resolved Alerts: $($response.analytics.resolvedAlerts)" -ForegroundColor White
        Write-Host "  Maintenance Efficiency: $($response.analytics.maintenanceEfficiency)%" -ForegroundColor White
    } else {
        Write-Host "Failed to retrieve analytics." -ForegroundColor Red
    }
}

switch ($Action) {
    "status" {
        Get-ServiceStatus
    }
    "start" {
        Write-Host "Starting Predictive Maintenance service (manual action required for actual process start)..." -ForegroundColor Yellow
        Write-Host "Please navigate to 'predictive-maintenance' directory and run 'npm start' or 'npm run dev'." -ForegroundColor DarkYellow
    }
    "stop" {
        Write-Host "Stopping Predictive Maintenance service (manual action required for actual process stop)..." -ForegroundColor Yellow
        Write-Host "Please manually stop the running Node.js process." -ForegroundColor DarkYellow
    }
    "restart" {
        Write-Host "Restarting Predictive Maintenance service (manual action required)..." -ForegroundColor Yellow
        Write-Host "Please manually stop and then start the running Node.js process." -ForegroundColor DarkYellow
    }
    "deploy" {
        Write-Host "Deployment of Predictive Maintenance service (placeholder - implement actual deployment logic)..." -ForegroundColor Yellow
        Write-Host "This would typically involve Docker/Kubernetes deployment scripts." -ForegroundColor DarkYellow
    }
    "get-config" {
        Get-ServiceConfig
    }
    "start-monitoring" {
        Start-Monitoring
    }
    "stop-monitoring" {
        Stop-Monitoring
    }
    "get-metrics" {
        Get-SystemMetrics
    }
    "get-alerts" {
        Get-SystemAlerts
    }
    "get-health" {
        Get-SystemHealth
    }
    "get-predictions" {
        Get-Predictions
    }
    "schedule-maintenance" {
        Schedule-Maintenance -MaintenanceType $Type -MaintenancePriority $Priority -MaintenanceDescription $Description
    }
    "get-maintenance" {
        Get-MaintenanceSchedule
    }
    "get-analytics" {
        Get-Analytics
    }
    default {
        Write-Host "Invalid action specified. Supported actions: status, start, stop, restart, deploy, get-config, start-monitoring, stop-monitoring, get-metrics, get-alerts, get-health, get-predictions, schedule-maintenance, get-maintenance, get-analytics." -ForegroundColor Red
    }
}

Write-Host "🔧 Predictive Maintenance Manager finished." -ForegroundColor Cyan
