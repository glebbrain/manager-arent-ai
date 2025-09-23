# ManagerAgentAI API Gateway - PowerShell Version
# Centralized API gateway for all services

param(
    [Parameter(Position=0)]
    [string]$Command,
    
    [Parameter(Position=1)]
    [string]$ServiceName,
    
    [Parameter(Position=2)]
    [string]$Endpoint,
    
    [Parameter(Position=3)]
    [string]$Data,
    
    [Parameter(Position=4)]
    [string]$Method = "GET",
    
    [switch]$Help,
    [switch]$Start,
    [switch]$Stop,
    [switch]$Status,
    [switch]$List,
    [switch]$Health,
    [switch]$Metrics
)

$GatewayPath = Join-Path $PSScriptRoot ".." "api-gateway"
$ConfigPath = Join-Path $GatewayPath "config"
$LogsPath = Join-Path $GatewayPath "logs"
$ServicesPath = Join-Path $GatewayPath "services"

# Service registry
$Services = @{
    "project-manager" = @{
        "name" = "Project Manager"
        "endpoint" = "http://localhost:3001"
        "health" = "/health"
        "routes" = @(
            @{ "path" = "/api/projects"; "methods" = @("GET", "POST") },
            @{ "path" = "/api/projects/*"; "methods" = @("GET", "PUT", "DELETE") },
            @{ "path" = "/api/templates"; "methods" = @("GET") },
            @{ "path" = "/api/scan"; "methods" = @("POST") }
        )
        "script" = "project-manager.ps1"
    }
    "ai-planner" = @{
        "name" = "AI Planner"
        "endpoint" = "http://localhost:3002"
        "health" = "/health"
        "routes" = @(
            @{ "path" = "/api/tasks"; "methods" = @("GET", "POST", "PUT", "DELETE") },
            @{ "path" = "/api/plans"; "methods" = @("GET", "POST", "PUT", "DELETE") },
            @{ "path" = "/api/prioritize"; "methods" = @("POST") },
            @{ "path" = "/api/recommend"; "methods" = @("POST") }
        )
        "script" = "ai-planner.ps1"
    }
    "workflow-orchestrator" = @{
        "name" = "Workflow Orchestrator"
        "endpoint" = "http://localhost:3003"
        "health" = "/health"
        "routes" = @(
            @{ "path" = "/api/workflows"; "methods" = @("GET", "POST", "PUT", "DELETE") },
            @{ "path" = "/api/workflows/*/execute"; "methods" = @("POST") },
            @{ "path" = "/api/workflows/*/status"; "methods" = @("GET") }
        )
        "script" = "workflow-orchestrator.ps1"
    }
    "smart-notifications" = @{
        "name" = "Smart Notifications"
        "endpoint" = "http://localhost:3004"
        "health" = "/health"
        "routes" = @(
            @{ "path" = "/api/notifications"; "methods" = @("GET", "POST", "PUT", "DELETE") },
            @{ "path" = "/api/notifications/*/send"; "methods" = @("POST") },
            @{ "path" = "/api/notifications/*/status"; "methods" = @("GET") }
        )
        "script" = "smart-notifications.ps1"
    }
    "template-generator" = @{
        "name" = "Template Generator"
        "endpoint" = "http://localhost:3005"
        "health" = "/health"
        "routes" = @(
            @{ "path" = "/api/templates"; "methods" = @("GET", "POST") },
            @{ "path" = "/api/templates/*/generate"; "methods" = @("POST") },
            @{ "path" = "/api/templates/*/validate"; "methods" = @("POST") }
        )
        "script" = "template-generator.ps1"
    }
    "consistency-manager" = @{
        "name" = "Consistency Manager"
        "endpoint" = "http://localhost:3006"
        "health" = "/health"
        "routes" = @(
            @{ "path" = "/api/consistency/validate"; "methods" = @("POST") },
            @{ "path" = "/api/consistency/fix"; "methods" = @("POST") },
            @{ "path" = "/api/consistency/status"; "methods" = @("GET") }
        )
        "script" = "consistency-manager.ps1"
    }
}

# Gateway configuration
$GatewayConfig = @{
    "port" = 3000
    "host" = "localhost"
    "timeout" = 30000
    "retries" = 3
    "rateLimit" = @{
        "enabled" = $true
        "requests" = 1000
        "window" = 3600000  # 1 hour
    }
    "cors" = @{
        "enabled" = $true
        "origins" = @("*")
        "methods" = @("GET", "POST", "PUT", "DELETE", "OPTIONS")
        "headers" = @("Content-Type", "Authorization", "X-Requested-With")
    }
    "auth" = @{
        "enabled" = $true
        "type" = "jwt"
        "secret" = "manager-agent-ai-secret-key"
        "expiresIn" = "24h"
    }
    "logging" = @{
        "enabled" = $true
        "level" = "info"
        "file" = "api-gateway.log"
    }
    "monitoring" = @{
        "enabled" = $true
        "metrics" = $true
        "health" = $true
    }
}

function Show-Help {
    Write-Host @"
🚀 ManagerAgentAI API Gateway

Centralized API gateway for all ManagerAgentAI services.

Usage:
  .\api-gateway.ps1 <command> [options]

Commands:
  start                    Start the API gateway server
  stop                     Stop the API gateway server
  status                   Show gateway and services status
  health                   Check health of all services
  metrics                  Show gateway metrics
  list                     List all registered services
  route <service> <endpoint> [method] [data]  Route request to service
  register <service> <config>  Register new service
  unregister <service>     Unregister service
  config                   Show gateway configuration
  logs                     Show gateway logs

Examples:
  .\api-gateway.ps1 start
  .\api-gateway.ps1 status
  .\api-gateway.ps1 health
  .\api-gateway.ps1 route project-manager /api/projects GET
  .\api-gateway.ps1 route ai-planner /api/tasks POST '{"title":"New task"}'
  .\api-gateway.ps1 metrics
"@
}

function Ensure-Directories {
    $dirs = @($GatewayPath, $ConfigPath, $LogsPath, $ServicesPath)
    foreach ($dir in $dirs) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Host "📁 Created directory: $dir" -ForegroundColor Green
        }
    }
}

function Initialize-Gateway {
    Write-Host "🚀 Initializing API Gateway..." -ForegroundColor Green
    
    Ensure-Directories
    
    # Create gateway configuration
    $configFile = Join-Path $ConfigPath "gateway.json"
    $GatewayConfig | ConvertTo-Json -Depth 10 | Out-File -FilePath $configFile -Encoding UTF8
    
    # Create services registry
    $servicesFile = Join-Path $ConfigPath "services.json"
    $Services | ConvertTo-Json -Depth 10 | Out-File -FilePath $servicesFile -Encoding UTF8
    
    # Create startup script
    $startupScript = @"
# API Gateway Startup Script
# Generated by ManagerAgentAI API Gateway

Write-Host "🚀 Starting ManagerAgentAI API Gateway..." -ForegroundColor Green

# Load configuration
`$config = Get-Content "$configFile" | ConvertFrom-Json
`$services = Get-Content "$servicesFile" | ConvertFrom-Json

# Start gateway server
Write-Host "🌐 Gateway running on http://`$(`$config.host):`$(`$config.port)" -ForegroundColor Green
Write-Host "📊 Monitoring enabled: `$(`$config.monitoring.enabled)" -ForegroundColor Green
Write-Host "🔒 Authentication enabled: `$(`$config.auth.enabled)" -ForegroundColor Green

# Keep running
while (`$true) {
    Start-Sleep -Seconds 1
}
"@
    
    $startupFile = Join-Path $GatewayPath "start-gateway.ps1"
    $startupScript | Out-File -FilePath $startupFile -Encoding UTF8
    
    Write-Host "✅ API Gateway initialized successfully" -ForegroundColor Green
    Write-Host "📁 Configuration: $configFile" -ForegroundColor Cyan
    Write-Host "📁 Services: $servicesFile" -ForegroundColor Cyan
    Write-Host "🚀 Startup script: $startupFile" -ForegroundColor Cyan
}

function Start-Gateway {
    Write-Host "🚀 Starting API Gateway..." -ForegroundColor Green
    
    $startupFile = Join-Path $GatewayPath "start-gateway.ps1"
    if (Test-Path $startupFile) {
        Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File `"$startupFile`"" -WindowStyle Hidden
        Write-Host "✅ API Gateway started successfully" -ForegroundColor Green
        Write-Host "🌐 Gateway URL: http://localhost:3000" -ForegroundColor Cyan
    } else {
        Write-Error "❌ Startup script not found. Run 'init' first."
    }
}

function Stop-Gateway {
    Write-Host "🛑 Stopping API Gateway..." -ForegroundColor Yellow
    
    $processes = Get-Process | Where-Object { $_.ProcessName -eq "powershell" -and $_.CommandLine -like "*start-gateway.ps1*" }
    foreach ($process in $processes) {
        Stop-Process -Id $process.Id -Force
        Write-Host "✅ Stopped process $($process.Id)" -ForegroundColor Green
    }
    
    Write-Host "✅ API Gateway stopped" -ForegroundColor Green
}

function Get-GatewayStatus {
    Write-Host "📊 API Gateway Status" -ForegroundColor Green
    Write-Host "====================" -ForegroundColor Green
    
    # Check if gateway is running
    $processes = Get-Process | Where-Object { $_.ProcessName -eq "powershell" -and $_.CommandLine -like "*start-gateway.ps1*" }
    if ($processes) {
        Write-Host "🟢 Gateway Status: Running" -ForegroundColor Green
        Write-Host "📈 Active Processes: $($processes.Count)" -ForegroundColor Cyan
    } else {
        Write-Host "🔴 Gateway Status: Stopped" -ForegroundColor Red
    }
    
    # Check services
    Write-Host "`n🔌 Registered Services:" -ForegroundColor Green
    foreach ($serviceName in $Services.Keys) {
        $service = $Services[$serviceName]
        Write-Host "  • $($service.name) ($serviceName)" -ForegroundColor Cyan
        Write-Host "    Endpoint: $($service.endpoint)" -ForegroundColor Gray
        Write-Host "    Routes: $($service.routes.Count)" -ForegroundColor Gray
    }
    
    # Check configuration
    $configFile = Join-Path $ConfigPath "gateway.json"
    if (Test-Path $configFile) {
        $config = Get-Content $configFile | ConvertFrom-Json
        Write-Host "`n⚙️ Configuration:" -ForegroundColor Green
        Write-Host "  • Port: $($config.port)" -ForegroundColor Cyan
        Write-Host "  • Host: $($config.host)" -ForegroundColor Cyan
        Write-Host "  • Auth: $($config.auth.enabled)" -ForegroundColor Cyan
        Write-Host "  • Monitoring: $($config.monitoring.enabled)" -ForegroundColor Cyan
    }
}

function Test-ServiceHealth {
    Write-Host "🏥 Service Health Check" -ForegroundColor Green
    Write-Host "======================" -ForegroundColor Green
    
    foreach ($serviceName in $Services.Keys) {
        $service = $Services[$serviceName]
        Write-Host "`n🔍 Checking $($service.name)..." -ForegroundColor Yellow
        
        try {
            $response = Invoke-WebRequest -Uri "$($service.endpoint)$($service.health)" -Method GET -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Host "  ✅ Status: Healthy" -ForegroundColor Green
            } else {
                Write-Host "  ⚠️ Status: Unhealthy (HTTP $($response.StatusCode))" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "  ❌ Status: Unreachable" -ForegroundColor Red
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

function Get-GatewayMetrics {
    Write-Host "📈 API Gateway Metrics" -ForegroundColor Green
    Write-Host "=====================" -ForegroundColor Green
    
    # Basic metrics
    $processes = Get-Process | Where-Object { $_.ProcessName -eq "powershell" -and $_.CommandLine -like "*start-gateway.ps1*" }
    Write-Host "🔄 Active Processes: $($processes.Count)" -ForegroundColor Cyan
    Write-Host "🔌 Registered Services: $($Services.Count)" -ForegroundColor Cyan
    
    # Memory usage
    $totalMemory = 0
    foreach ($process in $processes) {
        $totalMemory += $process.WorkingSet64
    }
    Write-Host "💾 Memory Usage: $([math]::Round($totalMemory / 1MB, 2)) MB" -ForegroundColor Cyan
    
    # Configuration metrics
    $configFile = Join-Path $ConfigPath "gateway.json"
    if (Test-Path $configFile) {
        $config = Get-Content $configFile | ConvertFrom-Json
        Write-Host "⚙️ Rate Limit: $($config.rateLimit.requests) requests/$($config.rateLimit.window)ms" -ForegroundColor Cyan
        Write-Host "🔒 Auth Enabled: $($config.auth.enabled)" -ForegroundColor Cyan
        Write-Host "📊 Monitoring: $($config.monitoring.enabled)" -ForegroundColor Cyan
    }
}

function Invoke-ServiceRoute {
    param(
        [string]$ServiceName,
        [string]$Endpoint,
        [string]$Method = "GET",
        [string]$Data = ""
    )
    
    if (!$Services.ContainsKey($ServiceName)) {
        Write-Error "❌ Service '$ServiceName' not found. Available services: $($Services.Keys -join ', ')"
        return
    }
    
    $service = $Services[$ServiceName]
    $url = "$($service.endpoint)$Endpoint"
    
    Write-Host "🔄 Routing request to $($service.name)..." -ForegroundColor Yellow
    Write-Host "📍 URL: $url" -ForegroundColor Cyan
    Write-Host "🔧 Method: $Method" -ForegroundColor Cyan
    
    try {
        $params = @{
            Uri = $url
            Method = $Method
            TimeoutSec = 30
        }
        
        if ($Data) {
            $params.Body = $Data
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        Write-Host "✅ Response received (HTTP $($response.StatusCode))" -ForegroundColor Green
        Write-Host "📄 Response body:" -ForegroundColor Cyan
        Write-Host $response.Content
    } catch {
        Write-Error "❌ Request failed: $($_.Exception.Message)"
    }
}

function Register-Service {
    param(
        [string]$ServiceName,
        [string]$Config
    )
    
    try {
        $serviceConfig = $Config | ConvertFrom-Json
        $Services[$ServiceName] = $serviceConfig
        
        # Update services registry
        $servicesFile = Join-Path $ConfigPath "services.json"
        $Services | ConvertTo-Json -Depth 10 | Out-File -FilePath $servicesFile -Encoding UTF8
        
        Write-Host "✅ Service '$ServiceName' registered successfully" -ForegroundColor Green
    } catch {
        Write-Error "❌ Failed to register service: $($_.Exception.Message)"
    }
}

function Unregister-Service {
    param([string]$ServiceName)
    
    if ($Services.ContainsKey($ServiceName)) {
        $Services.Remove($ServiceName)
        
        # Update services registry
        $servicesFile = Join-Path $ConfigPath "services.json"
        $Services | ConvertTo-Json -Depth 10 | Out-File -FilePath $servicesFile -Encoding UTF8
        
        Write-Host "✅ Service '$ServiceName' unregistered successfully" -ForegroundColor Green
    } else {
        Write-Error "❌ Service '$ServiceName' not found"
    }
}

function Show-GatewayConfig {
    $configFile = Join-Path $ConfigPath "gateway.json"
    if (Test-Path $configFile) {
        $config = Get-Content $configFile | ConvertFrom-Json
        Write-Host "⚙️ API Gateway Configuration" -ForegroundColor Green
        Write-Host "=============================" -ForegroundColor Green
        $config | ConvertTo-Json -Depth 10
    } else {
        Write-Error "❌ Configuration file not found. Run 'init' first."
    }
}

function Show-GatewayLogs {
    $logFile = Join-Path $LogsPath "api-gateway.log"
    if (Test-Path $logFile) {
        Write-Host "📋 API Gateway Logs" -ForegroundColor Green
        Write-Host "===================" -ForegroundColor Green
        Get-Content $logFile -Tail 50
    } else {
        Write-Host "📋 No logs found" -ForegroundColor Yellow
    }
}

# Main execution
switch ($Command.ToLower()) {
    "init" { Initialize-Gateway }
    "start" { Start-Gateway }
    "stop" { Stop-Gateway }
    "status" { Get-GatewayStatus }
    "health" { Test-ServiceHealth }
    "metrics" { Get-GatewayMetrics }
    "list" { 
        Write-Host "🔌 Registered Services:" -ForegroundColor Green
        foreach ($serviceName in $Services.Keys) {
            $service = $Services[$serviceName]
            Write-Host "  • $($service.name) ($serviceName)" -ForegroundColor Cyan
        }
    }
    "route" { Invoke-ServiceRoute -ServiceName $ServiceName -Endpoint $Endpoint -Method $Method -Data $Data }
    "register" { Register-Service -ServiceName $ServiceName -Config $Data }
    "unregister" { Unregister-Service -ServiceName $ServiceName }
    "config" { Show-GatewayConfig }
    "logs" { Show-GatewayLogs }
    "help" { Show-Help }
    default { 
        if ($Help) {
            Show-Help
        } else {
            Write-Host "❌ Unknown command: $Command" -ForegroundColor Red
            Write-Host "Use -Help to see available commands" -ForegroundColor Yellow
        }
    }
}
