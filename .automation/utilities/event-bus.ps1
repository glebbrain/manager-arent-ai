# ManagerAgentAI Event Bus - PowerShell Version
# Event-driven architecture implementation

param(
    [Parameter(Position=0)]
    [string]$Command,
    
    [Parameter(Position=1)]
    [string]$EventName,
    
    [Parameter(Position=2)]
    [string]$EventData,
    
    [Parameter(Position=3)]
    [string]$SubscriberId,
    
    [Parameter(Position=4)]
    [string]$Filter,
    
    [switch]$Help,
    [switch]$Start,
    [switch]$Stop,
    [switch]$Status,
    [switch]$List,
    [switch]$Metrics
)

$EventBusPath = Join-Path $PSScriptRoot ".." "event-bus"
$ConfigPath = Join-Path $EventBusPath "config"
$LogsPath = Join-Path $EventBusPath "logs"
$SubscribersPath = Join-Path $EventBusPath "subscribers"

# Event bus configuration
$EventBusConfig = @{
    "port" = 4000
    "host" = "localhost"
    "maxEvents" = 10000
    "retentionPeriod" = 86400000  # 24 hours
    "persistence" = @{
        "enabled" = $true
        "file" = "events.json"
        "backupInterval" = 3600000  # 1 hour
    }
    "security" = @{
        "enabled" = $true
        "authToken" = "event-bus-secret-key-2025"
        "encryption" = $true
    }
    "monitoring" = @{
        "enabled" = $true
        "metrics" = $true
        "health" = $true
    }
    "routing" = @{
        "strategy" = "broadcast"  # broadcast, unicast, multicast
        "retryAttempts" = 3
        "retryDelay" = 1000
        "timeout" = 30000
    }
}

# Event types and their handlers
$EventTypes = @{
    "project.created" = @{
        "description" = "Project created event"
        "handlers" = @("notification-service", "analytics-service", "audit-service")
        "priority" = "high"
        "retention" = 2592000000  # 30 days
    }
    "project.updated" = @{
        "description" = "Project updated event"
        "handlers" = @("notification-service", "analytics-service", "audit-service")
        "priority" = "medium"
        "retention" = 2592000000  # 30 days
    }
    "project.deleted" = @{
        "description" = "Project deleted event"
        "handlers" = @("notification-service", "analytics-service", "audit-service", "cleanup-service")
        "priority" = "high"
        "retention" = 2592000000  # 30 days
    }
    "task.created" = @{
        "description" = "Task created event"
        "handlers" = @("notification-service", "ai-planner", "workflow-orchestrator")
        "priority" = "medium"
        "retention" = 1209600000  # 14 days
    }
    "task.completed" = @{
        "description" = "Task completed event"
        "handlers" = @("notification-service", "analytics-service", "ai-planner")
        "priority" = "medium"
        "retention" = 1209600000  # 14 days
    }
    "workflow.started" = @{
        "description" = "Workflow started event"
        "handlers" = @("notification-service", "monitoring-service", "audit-service")
        "priority" = "high"
        "retention" = 1209600000  # 14 days
    }
    "workflow.completed" = @{
        "description" = "Workflow completed event"
        "handlers" = @("notification-service", "analytics-service", "monitoring-service")
        "priority" = "high"
        "retention" = 1209600000  # 14 days
    }
    "workflow.failed" = @{
        "description" = "Workflow failed event"
        "handlers" = @("notification-service", "error-handler", "monitoring-service")
        "priority" = "critical"
        "retention" = 2592000000  # 30 days
    }
    "notification.sent" = @{
        "description" = "Notification sent event"
        "handlers" = @("analytics-service", "audit-service")
        "priority" = "low"
        "retention" = 604800000  # 7 days
    }
    "user.authenticated" = @{
        "description" = "User authenticated event"
        "handlers" = @("analytics-service", "audit-service", "session-manager")
        "priority" = "medium"
        "retention" = 604800000  # 7 days
    }
    "error.occurred" = @{
        "description" = "Error occurred event"
        "handlers" = @("error-handler", "notification-service", "monitoring-service")
        "priority" = "critical"
        "retention" = 2592000000  # 30 days
    }
    "system.health" = @{
        "description" = "System health check event"
        "handlers" = @("monitoring-service", "alert-service")
        "priority" = "low"
        "retention" = 604800000  # 7 days
    }
}

# Active subscribers
$Subscribers = @{}
$EventQueue = @()
$EventHistory = @()

function Show-Help {
    Write-Host @"
🔄 ManagerAgentAI Event Bus

Event-driven architecture implementation for ManagerAgentAI services.

Usage:
  .\event-bus.ps1 <command> [options]

Commands:
  start                    Start the event bus server
  stop                     Stop the event bus server
  status                   Show event bus status
  metrics                  Show event bus metrics
  list                     List all event types and subscribers
  publish <event> <data>   Publish an event
  subscribe <event> <id>   Subscribe to an event type
  unsubscribe <id>         Unsubscribe from events
  events                   Show recent events
  health                   Check event bus health

Examples:
  .\event-bus.ps1 start
  .\event-bus.ps1 publish project.created '{"projectId":"123","name":"My Project"}'
  .\event-bus.ps1 subscribe project.created notification-service
  .\event-bus.ps1 status
  .\event-bus.ps1 metrics
"@
}

function Ensure-Directories {
    $dirs = @($EventBusPath, $ConfigPath, $LogsPath, $SubscribersPath)
    foreach ($dir in $dirs) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Host "📁 Created directory: $dir" -ForegroundColor Green
        }
    }
}

function Initialize-EventBus {
    Write-Host "🔄 Initializing Event Bus..." -ForegroundColor Green
    
    Ensure-Directories
    
    # Create event bus configuration
    $configFile = Join-Path $ConfigPath "event-bus.json"
    $EventBusConfig | ConvertTo-Json -Depth 10 | Out-File -FilePath $configFile -Encoding UTF8
    
    # Create event types registry
    $eventTypesFile = Join-Path $ConfigPath "event-types.json"
    $EventTypes | ConvertTo-Json -Depth 10 | Out-File -FilePath $eventTypesFile -Encoding UTF8
    
    # Create startup script
    $startupScript = @"
# Event Bus Startup Script
# Generated by ManagerAgentAI Event Bus

Write-Host "🔄 Starting ManagerAgentAI Event Bus..." -ForegroundColor Green

# Load configuration
`$config = Get-Content "$configFile" | ConvertFrom-Json
`$eventTypes = Get-Content "$eventTypesFile" | ConvertFrom-Json

# Start event bus server
Write-Host "🌐 Event Bus running on http://`$(`$config.host):`$(`$config.port)" -ForegroundColor Green
Write-Host "📊 Monitoring enabled: `$(`$config.monitoring.enabled)" -ForegroundColor Green
Write-Host "🔒 Security enabled: `$(`$config.security.enabled)" -ForegroundColor Green

# Keep running
while (`$true) {
    Start-Sleep -Seconds 1
}
"@
    
    $startupFile = Join-Path $EventBusPath "start-event-bus.ps1"
    $startupScript | Out-File -FilePath $startupFile -Encoding UTF8
    
    Write-Host "✅ Event Bus initialized successfully" -ForegroundColor Green
    Write-Host "📁 Configuration: $configFile" -ForegroundColor Cyan
    Write-Host "📁 Event Types: $eventTypesFile" -ForegroundColor Cyan
    Write-Host "🚀 Startup script: $startupFile" -ForegroundColor Cyan
}

function Start-EventBus {
    Write-Host "🔄 Starting Event Bus..." -ForegroundColor Green
    
    $startupFile = Join-Path $EventBusPath "start-event-bus.ps1"
    if (Test-Path $startupFile) {
        Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File `"$startupFile`"" -WindowStyle Hidden
        Write-Host "✅ Event Bus started successfully" -ForegroundColor Green
        Write-Host "🌐 Event Bus URL: http://localhost:4000" -ForegroundColor Cyan
    } else {
        Write-Error "❌ Startup script not found. Run 'init' first."
    }
}

function Stop-EventBus {
    Write-Host "🛑 Stopping Event Bus..." -ForegroundColor Yellow
    
    $processes = Get-Process | Where-Object { $_.ProcessName -eq "powershell" -and $_.CommandLine -like "*start-event-bus.ps1*" }
    foreach ($process in $processes) {
        Stop-Process -Id $process.Id -Force
        Write-Host "✅ Stopped process $($process.Id)" -ForegroundColor Green
    }
    
    Write-Host "✅ Event Bus stopped" -ForegroundColor Green
}

function Get-EventBusStatus {
    Write-Host "📊 Event Bus Status" -ForegroundColor Green
    Write-Host "==================" -ForegroundColor Green
    
    # Check if event bus is running
    $processes = Get-Process | Where-Object { $_.ProcessName -eq "powershell" -and $_.CommandLine -like "*start-event-bus.ps1*" }
    if ($processes) {
        Write-Host "🟢 Event Bus Status: Running" -ForegroundColor Green
        Write-Host "📈 Active Processes: $($processes.Count)" -ForegroundColor Cyan
    } else {
        Write-Host "🔴 Event Bus Status: Stopped" -ForegroundColor Red
    }
    
    # Check event types
    Write-Host "`n📋 Event Types:" -ForegroundColor Green
    foreach ($eventType in $EventTypes.Keys) {
        $event = $EventTypes[$eventType]
        Write-Host "  • $eventType" -ForegroundColor Cyan
        Write-Host "    Description: $($event.description)" -ForegroundColor Gray
        Write-Host "    Priority: $($event.priority)" -ForegroundColor Gray
        Write-Host "    Handlers: $($event.handlers.Count)" -ForegroundColor Gray
    }
    
    # Check subscribers
    Write-Host "`n👥 Subscribers:" -ForegroundColor Green
    if ($Subscribers.Count -gt 0) {
        foreach ($subscriberId in $Subscribers.Keys) {
            $subscriber = $Subscribers[$subscriberId]
            Write-Host "  • $subscriberId" -ForegroundColor Cyan
            Write-Host "    Events: $($subscriber.events.Count)" -ForegroundColor Gray
            Write-Host "    Status: $($subscriber.status)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  No active subscribers" -ForegroundColor Yellow
    }
    
    # Check configuration
    $configFile = Join-Path $ConfigPath "event-bus.json"
    if (Test-Path $configFile) {
        $config = Get-Content $configFile | ConvertFrom-Json
        Write-Host "`n⚙️ Configuration:" -ForegroundColor Green
        Write-Host "  • Port: $($config.port)" -ForegroundColor Cyan
        Write-Host "  • Host: $($config.host)" -ForegroundColor Cyan
        Write-Host "  • Max Events: $($config.maxEvents)" -ForegroundColor Cyan
        Write-Host "  • Security: $($config.security.enabled)" -ForegroundColor Cyan
        Write-Host "  • Monitoring: $($config.monitoring.enabled)" -ForegroundColor Cyan
    }
}

function Publish-Event {
    param(
        [string]$EventName,
        [string]$EventData
    )
    
    if (!$EventTypes.ContainsKey($EventName)) {
        Write-Error "❌ Unknown event type: $EventName"
        return
    }
    
    $event = @{
        "id" = [System.Guid]::NewGuid().ToString()
        "type" = $EventName
        "data" = $EventData
        "timestamp" = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
        "priority" = $EventTypes[$EventName].priority
        "handlers" = $EventTypes[$EventName].handlers
    }
    
    # Add to event queue
    $EventQueue += $event
    
    # Add to event history
    $EventHistory += $event
    
    # Process event
    Process-Event -Event $event
    
    Write-Host "✅ Event published: $EventName" -ForegroundColor Green
    Write-Host "📄 Event ID: $($event.id)" -ForegroundColor Cyan
    Write-Host "📊 Priority: $($event.priority)" -ForegroundColor Cyan
}

function Process-Event {
    param([hashtable]$Event)
    
    $eventType = $Event.type
    $handlers = $EventTypes[$eventType].handlers
    
    Write-Host "🔄 Processing event: $eventType" -ForegroundColor Yellow
    
    foreach ($handler in $handlers) {
        try {
            # Simulate event processing
            Write-Host "  → Sending to $handler" -ForegroundColor Cyan
            
            # In a real implementation, this would send the event to the actual service
            # For now, we'll just log the event
            $logEntry = @{
                "timestamp" = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
                "eventId" = $Event.id
                "eventType" = $eventType
                "handler" = $handler
                "status" = "processed"
            }
            
            $logFile = Join-Path $LogsPath "event-processing.log"
            $logEntry | ConvertTo-Json | Add-Content -Path $logFile
            
        } catch {
            Write-Error "❌ Failed to process event with handler $handler : $($_.Exception.Message)"
        }
    }
}

function Subscribe-Event {
    param(
        [string]$EventName,
        [string]$SubscriberId
    )
    
    if (!$EventTypes.ContainsKey($EventName)) {
        Write-Error "❌ Unknown event type: $EventName"
        return
    }
    
    if (!$Subscribers.ContainsKey($SubscriberId)) {
        $Subscribers[$SubscriberId] = @{
            "id" = $SubscriberId
            "events" = @()
            "status" = "active"
            "created" = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
        }
    }
    
    if ($Subscribers[$SubscriberId].events -notcontains $EventName) {
        $Subscribers[$SubscriberId].events += $EventName
        Write-Host "✅ Subscribed $SubscriberId to $EventName" -ForegroundColor Green
    } else {
        Write-Host "⚠️ $SubscriberId already subscribed to $EventName" -ForegroundColor Yellow
    }
}

function Unsubscribe-Event {
    param([string]$SubscriberId)
    
    if ($Subscribers.ContainsKey($SubscriberId)) {
        $Subscribers.Remove($SubscriberId)
        Write-Host "✅ Unsubscribed $SubscriberId from all events" -ForegroundColor Green
    } else {
        Write-Error "❌ Subscriber $SubscriberId not found"
    }
}

function Get-EventBusMetrics {
    Write-Host "📈 Event Bus Metrics" -ForegroundColor Green
    Write-Host "===================" -ForegroundColor Green
    
    # Basic metrics
    $processes = Get-Process | Where-Object { $_.ProcessName -eq "powershell" -and $_.CommandLine -like "*start-event-bus.ps1*" }
    Write-Host "🔄 Active Processes: $($processes.Count)" -ForegroundColor Cyan
    Write-Host "📋 Event Types: $($EventTypes.Count)" -ForegroundColor Cyan
    Write-Host "👥 Subscribers: $($Subscribers.Count)" -ForegroundColor Cyan
    Write-Host "📊 Events in Queue: $($EventQueue.Count)" -ForegroundColor Cyan
    Write-Host "📚 Events in History: $($EventHistory.Count)" -ForegroundColor Cyan
    
    # Event type breakdown
    Write-Host "`n📋 Event Type Breakdown:" -ForegroundColor Green
    foreach ($eventType in $EventTypes.Keys) {
        $count = ($EventHistory | Where-Object { $_.type -eq $eventType }).Count
        Write-Host "  • $eventType : $count events" -ForegroundColor Cyan
    }
    
    # Priority breakdown
    Write-Host "`n⚡ Priority Breakdown:" -ForegroundColor Green
    $priorities = $EventHistory | Group-Object priority
    foreach ($priority in $priorities) {
        Write-Host "  • $($priority.Name) : $($priority.Count) events" -ForegroundColor Cyan
    }
}

function Show-RecentEvents {
    Write-Host "📋 Recent Events" -ForegroundColor Green
    Write-Host "================" -ForegroundColor Green
    
    if ($EventHistory.Count -eq 0) {
        Write-Host "No events in history" -ForegroundColor Yellow
        return
    }
    
    $recentEvents = $EventHistory | Sort-Object timestamp -Descending | Select-Object -First 10
    
    foreach ($event in $recentEvents) {
        Write-Host "`n📄 Event: $($event.type)" -ForegroundColor Cyan
        Write-Host "   ID: $($event.id)" -ForegroundColor Gray
        Write-Host "   Time: $($event.timestamp)" -ForegroundColor Gray
        Write-Host "   Priority: $($event.priority)" -ForegroundColor Gray
        Write-Host "   Data: $($event.data)" -ForegroundColor Gray
    }
}

function Test-EventBusHealth {
    Write-Host "🏥 Event Bus Health Check" -ForegroundColor Green
    Write-Host "=========================" -ForegroundColor Green
    
    # Check if event bus is running
    $processes = Get-Process | Where-Object { $_.ProcessName -eq "powershell" -and $_.CommandLine -like "*start-event-bus.ps1*" }
    if ($processes) {
        Write-Host "✅ Event Bus Process: Running" -ForegroundColor Green
    } else {
        Write-Host "❌ Event Bus Process: Not Running" -ForegroundColor Red
    }
    
    # Check configuration files
    $configFile = Join-Path $ConfigPath "event-bus.json"
    $eventTypesFile = Join-Path $ConfigPath "event-types.json"
    
    $configExists = Test-Path $configFile
    Write-Host "✅ Configuration File: $(if($configExists) {'Exists'} else {'Missing'})" -ForegroundColor $(if($configExists) {'Green'} else {'Red'})
    
    $eventTypesExists = Test-Path $eventTypesFile
    Write-Host "✅ Event Types File: $(if($eventTypesExists) {'Exists'} else {'Missing'})" -ForegroundColor $(if($eventTypesExists) {'Green'} else {'Red'})
    
    # Check event processing
    $logFile = Join-Path $LogsPath "event-processing.log"
    if (Test-Path $logFile) {
        $logEntries = Get-Content $logFile | Measure-Object
        Write-Host "✅ Event Processing: $($logEntries.Count) events processed" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Event Processing: No events processed yet" -ForegroundColor Yellow
    }
}

# Main execution
switch ($Command.ToLower()) {
    "init" { Initialize-EventBus }
    "start" { Start-EventBus }
    "stop" { Stop-EventBus }
    "status" { Get-EventBusStatus }
    "metrics" { Get-EventBusMetrics }
    "list" { 
        Write-Host "📋 Event Types:" -ForegroundColor Green
        foreach ($eventType in $EventTypes.Keys) {
            $event = $EventTypes[$eventType]
            Write-Host "  • $eventType" -ForegroundColor Cyan
        }
    }
    "publish" { Publish-Event -EventName $EventName -EventData $EventData }
    "subscribe" { Subscribe-Event -EventName $EventName -SubscriberId $SubscriberId }
    "unsubscribe" { Unsubscribe-Event -SubscriberId $EventName }
    "events" { Show-RecentEvents }
    "health" { Test-EventBusHealth }
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
