# ManagerAgentAI Smart Notification System - PowerShell Version
# Contextual notifications about important events

param(
    [Parameter(Position=0)]
    [string]$Command,
    
    [Parameter(Position=1)]
    [string]$Category,
    
    [Parameter(Position=2)]
    [string]$Type,
    
    [Parameter(Position=3)]
    [string]$Data,
    
    [Parameter(Position=4)]
    [string]$Period,
    
    [Parameter(Position=5)]
    [string]$Filters,
    
    [Parameter(Position=6)]
    [string]$Days,
    
    [Parameter(Position=7)]
    [string]$Format,
    
    [switch]$Help
)

$NotificationsPath = Join-Path $PSScriptRoot ".." "notifications"
$ConfigPath = Join-Path $PSScriptRoot ".." "configs"

function Show-Help {
    Write-Host @"
🔔 ManagerAgentAI Smart Notification System

Usage:
  .\smart-notifications.ps1 <command> [options]

Commands:
  send <category> <type> <data>    Send a notification
  test <category> <type> <data>    Test a notification
  stats [period]                   Show notification statistics
  history [filters]                Show notification history
  rules                            Show notification rules
  channels                         Show available channels
  cleanup [days]                   Cleanup old notifications
  export [format]                  Export notifications

Examples:
  .\smart-notifications.ps1 send project created '{"projectName":"My App"}'
  .\smart-notifications.ps1 test task overdue '{"taskTitle":"Fix bug","dueDate":"2023-01-01"}'
  .\smart-notifications.ps1 stats 24h
  .\smart-notifications.ps1 history '{"category":"project"}'
  .\smart-notifications.ps1 cleanup 30
  .\smart-notifications.ps1 export csv
"@
}

function Ensure-Directories {
    $dirs = @($NotificationsPath, $ConfigPath)
    $dirs | ForEach-Object {
        if (-not (Test-Path $_)) {
            New-Item -ItemType Directory -Path $_ -Force | Out-Null
        }
    }
}

function Get-NotificationRules {
    return @{
        project = @{
            created = @{
                priority = 'info'
                channels = @('console', 'log')
                message = 'New project created: {{projectName}}'
                conditions = @('always')
            }
            updated = @{
                priority = 'info'
                channels = @('console', 'log')
                message = 'Project updated: {{projectName}} - {{changes}}'
                conditions = @('always')
            }
            completed = @{
                priority = 'success'
                channels = @('console', 'log', 'email')
                message = 'Project completed successfully: {{projectName}}'
                conditions = @('always')
            }
            failed = @{
                priority = 'error'
                channels = @('console', 'log', 'email', 'slack')
                message = 'Project failed: {{projectName}} - {{error}}'
                conditions = @('always')
            }
        }
        task = @{
            created = @{
                priority = 'info'
                channels = @('console', 'log')
                message = 'New task created: {{taskTitle}}'
                conditions = @('always')
            }
            assigned = @{
                priority = 'info'
                channels = @('console', 'log', 'email')
                message = 'Task assigned to {{assignee}}: {{taskTitle}}'
                conditions = @('always')
            }
            due_soon = @{
                priority = 'warning'
                channels = @('console', 'log', 'email', 'slack')
                message = 'Task due soon: {{taskTitle}} (due {{dueDate}})'
                conditions = @('due_in_days <= 3')
            }
            overdue = @{
                priority = 'error'
                channels = @('console', 'log', 'email', 'slack')
                message = 'Task overdue: {{taskTitle}} (was due {{dueDate}})'
                conditions = @('due_date < now')
            }
            completed = @{
                priority = 'success'
                channels = @('console', 'log')
                message = 'Task completed: {{taskTitle}}'
                conditions = @('always')
            }
        }
        workflow = @{
            started = @{
                priority = 'info'
                channels = @('console', 'log')
                message = 'Workflow started: {{workflowName}}'
                conditions = @('always')
            }
            completed = @{
                priority = 'success'
                channels = @('console', 'log')
                message = 'Workflow completed: {{workflowName}}'
                conditions = @('always')
            }
            failed = @{
                priority = 'error'
                channels = @('console', 'log', 'email', 'slack')
                message = 'Workflow failed: {{workflowName}} - {{error}}'
                conditions = @('always')
            }
            step_failed = @{
                priority = 'warning'
                channels = @('console', 'log')
                message = 'Workflow step failed: {{stepName}} in {{workflowName}}'
                conditions = @('always')
            }
        }
        system = @{
            error = @{
                priority = 'error'
                channels = @('console', 'log', 'email', 'slack')
                message = 'System error: {{error}}'
                conditions = @('always')
            }
            warning = @{
                priority = 'warning'
                channels = @('console', 'log')
                message = 'System warning: {{warning}}'
                conditions = @('always')
            }
            info = @{
                priority = 'info'
                channels = @('console', 'log')
                message = 'System info: {{info}}'
                conditions = @('always')
            }
            maintenance = @{
                priority = 'info'
                channels = @('console', 'log', 'email')
                message = 'Maintenance scheduled: {{maintenance}}'
                conditions = @('always')
            }
        }
        quality = @{
            check_failed = @{
                priority = 'warning'
                channels = @('console', 'log')
                message = 'Quality check failed: {{checkType}} - {{issues}}'
                conditions = @('always')
            }
            check_passed = @{
                priority = 'success'
                channels = @('console', 'log')
                message = 'Quality check passed: {{checkType}}'
                conditions = @('always')
            }
            score_low = @{
                priority = 'warning'
                channels = @('console', 'log', 'email')
                message = 'Low quality score: {{score}}/100 - {{projectName}}'
                conditions = @('score < 60')
            }
            score_improved = @{
                priority = 'success'
                channels = @('console', 'log')
                message = 'Quality score improved: {{score}}/100 - {{projectName}}'
                conditions = @('score > previous_score')
            }
        }
    }
}

function Get-NotificationChannels {
    return @{
        console = @{
            name = 'Console'
            enabled = $true
            send = { param($notification) Send-ToConsole -Notification $notification }
        }
        log = @{
            name = 'Log File'
            enabled = $true
            send = { param($notification) Send-ToLog -Notification $notification }
        }
        email = @{
            name = 'Email'
            enabled = $false
            send = { param($notification) Send-ToEmail -Notification $notification }
        }
        slack = @{
            name = 'Slack'
            enabled = $false
            send = { param($notification) Send-ToSlack -Notification $notification }
        }
        webhook = @{
            name = 'Webhook'
            enabled = $false
            send = { param($notification) Send-ToWebhook -Notification $notification }
        }
        database = @{
            name = 'Database'
            enabled = $true
            send = { param($notification) Send-ToDatabase -Notification $notification }
        }
    }
}

function Send-Notification {
    param(
        [string]$Type,
        [string]$Category,
        [object]$Data,
        [hashtable]$Options = @{}
    )
    
    $rules = Get-NotificationRules
    $channels = Get-NotificationChannels
    
    $rule = $rules[$Category][$Type]
    if (-not $rule) {
        throw "No rule found for $Category.$Type"
    }
    
    $notification = @{
        id = [System.Guid]::NewGuid().ToString()
        type = $Type
        category = $Category
        priority = $rule.priority
        message = Expand-Template -Template $rule.message -Data $Data
        data = $Data
        channels = $rule.channels
        conditions = $rule.conditions
        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        status = 'pending'
        attempts = 0
        maxAttempts = 3
        options = $Options
    }
    
    # Check if notification should be sent
    if (Test-ShouldSendNotification -Notification $notification) {
        # Send to appropriate channels
        Send-ToChannels -Notification $notification -Channels $channels
        
        # Store in history
        Add-NotificationToHistory -Notification $notification
    }
    
    return $notification
}

function Test-ShouldSendNotification {
    param([object]$Notification)
    
    # Check conditions
    foreach ($condition in $Notification.conditions) {
        if (-not (Test-Condition -Condition $condition -Data $Notification.data)) {
            return $false
        }
    }
    
    # Check rate limiting
    if (-not (Test-RateLimit -Notification $Notification)) {
        return $false
    }
    
    return $true
}

function Test-Condition {
    param(
        [string]$Condition,
        [object]$Data
    )
    
    switch ($Condition) {
        'always' { return $true }
        'due_in_days <= 3' {
            if ($Data.dueDate) {
                $daysUntilDue = Get-DaysUntilDue -DueDate $Data.dueDate
                return $daysUntilDue -le 3
            }
            return $false
        }
        'due_date < now' {
            if ($Data.dueDate) {
                return [DateTime]::Parse($Data.dueDate) -lt (Get-Date)
            }
            return $false
        }
        'score < 60' { return $Data.score -lt 60 }
        'score > previous_score' { return $Data.score -gt ($Data.previousScore ?? 0) }
        default { return $true }
    }
}

function Test-RateLimit {
    param([object]$Notification)
    
    $now = Get-Date
    $oneHourAgo = $now.AddHours(-1)
    
    # Count notifications of same type in last hour
    $history = Get-NotificationHistory
    $recentNotifications = $history | Where-Object {
        $_.category -eq $Notification.category -and
        $_.type -eq $Notification.type -and
        [DateTime]::Parse($_.timestamp) -gt $oneHourAgo
    }
    
    # Rate limit: max 10 notifications per hour per type
    return $recentNotifications.Count -lt 10
}

function Send-ToChannels {
    param(
        [object]$Notification,
        [hashtable]$Channels
    )
    
    foreach ($channelName in $Notification.channels) {
        $channel = $Channels[$channelName]
        if ($channel -and $channel.enabled) {
            try {
                & $channel.send $Notification
                $Notification.status = 'delivered'
            } catch {
                Write-Error "Failed to send notification via $channelName : $($_.Exception.Message)"
                $Notification.status = 'failed'
                $Notification.attempts++
            }
        }
    }
}

function Send-ToConsole {
    param([object]$Notification)
    
    $colors = @{
        error = 'Red'
        warning = 'Yellow'
        info = 'Cyan'
        success = 'Green'
    }
    
    $color = $colors[$Notification.priority] ?? 'White'
    Write-Host "[$($Notification.priority.ToUpper())] $($Notification.message)" -ForegroundColor $color
    
    if ($Notification.data -and $Notification.data.PSObject.Properties.Count -gt 0) {
        Write-Host "  Data: $($Notification.data | ConvertTo-Json -Compress)"
    }
}

function Send-ToLog {
    param([object]$Notification)
    
    $logEntry = @{
        timestamp = $Notification.timestamp
        level = $Notification.priority
        category = $Notification.category
        type = $Notification.type
        message = $Notification.message
        data = $Notification.data
    }
    
    $logFile = Join-Path $NotificationsPath "notifications.log"
    $logLine = $logEntry | ConvertTo-Json -Compress
    Add-Content -Path $logFile -Value $logLine
}

function Send-ToEmail {
    param([object]$Notification)
    
    Write-Host "[EMAIL] Would send: $($Notification.message)"
}

function Send-ToSlack {
    param([object]$Notification)
    
    Write-Host "[SLACK] Would send: $($Notification.message)"
}

function Send-ToWebhook {
    param([object]$Notification)
    
    Write-Host "[WEBHOOK] Would send: $($Notification.message)"
}

function Send-ToDatabase {
    param([object]$Notification)
    
    $dbFile = Join-Path $NotificationsPath "notifications.json"
    $notifications = @()
    
    if (Test-Path $dbFile) {
        $notifications = Get-Content $dbFile | ConvertFrom-Json
    }
    
    $notifications += $Notification
    $notifications | ConvertTo-Json -Depth 10 | Set-Content $dbFile
}

function Add-NotificationToHistory {
    param([object]$Notification)
    
    $historyFile = Join-Path $NotificationsPath "history.json"
    $history = @()
    
    if (Test-Path $historyFile) {
        $history = Get-Content $historyFile | ConvertFrom-Json
    }
    
    $history += $Notification
    $history | ConvertTo-Json -Depth 10 | Set-Content $historyFile
}

function Get-NotificationHistory {
    param([hashtable]$Filters = @{})
    
    $historyFile = Join-Path $NotificationsPath "history.json"
    if (-not (Test-Path $historyFile)) {
        return @()
    }
    
    $history = Get-Content $historyFile | ConvertFrom-Json
    
    if ($Filters.category) {
        $history = $history | Where-Object { $_.category -eq $Filters.category }
    }
    
    if ($Filters.type) {
        $history = $history | Where-Object { $_.type -eq $Filters.type }
    }
    
    if ($Filters.priority) {
        $history = $history | Where-Object { $_.priority -eq $Filters.priority }
    }
    
    if ($Filters.startDate) {
        $history = $history | Where-Object { [DateTime]::Parse($_.timestamp) -ge [DateTime]::Parse($Filters.startDate) }
    }
    
    if ($Filters.endDate) {
        $history = $history | Where-Object { [DateTime]::Parse($_.timestamp) -le [DateTime]::Parse($Filters.endDate) }
    }
    
    return $history | Sort-Object timestamp -Descending
}

function Get-NotificationStats {
    param([string]$Period = '24h')
    
    $now = Get-Date
    $startDate = switch ($Period) {
        '1h' { $now.AddHours(-1) }
        '24h' { $now.AddDays(-1) }
        '7d' { $now.AddDays(-7) }
        '30d' { $now.AddDays(-30) }
        default { [DateTime]::MinValue }
    }
    
    $history = Get-NotificationHistory
    $recentNotifications = $history | Where-Object {
        [DateTime]::Parse($_.timestamp) -ge $startDate
    }
    
    $stats = @{
        total = $recentNotifications.Count
        byPriority = @{}
        byCategory = @{}
        byType = @{}
        byChannel = @{}
        successRate = 0
        failureRate = 0
    }
    
    $recentNotifications | ForEach-Object {
        # Count by priority
        if (-not $stats.byPriority[$_.priority]) {
            $stats.byPriority[$_.priority] = 0
        }
        $stats.byPriority[$_.priority]++
        
        # Count by category
        if (-not $stats.byCategory[$_.category]) {
            $stats.byCategory[$_.category] = 0
        }
        $stats.byCategory[$_.category]++
        
        # Count by type
        if (-not $stats.byType[$_.type]) {
            $stats.byType[$_.type] = 0
        }
        $stats.byType[$_.type]++
        
        # Count by channel
        $_.channels | ForEach-Object {
            if (-not $stats.byChannel[$_]) {
                $stats.byChannel[$_] = 0
            }
            $stats.byChannel[$_]++
        }
    }
    
    # Calculate success/failure rates
    $successful = ($recentNotifications | Where-Object { $_.status -eq 'delivered' }).Count
    $failed = ($recentNotifications | Where-Object { $_.status -eq 'failed' }).Count
    
    if ($recentNotifications.Count -gt 0) {
        $stats.successRate = [Math]::Round(($successful / $recentNotifications.Count) * 100)
        $stats.failureRate = [Math]::Round(($failed / $recentNotifications.Count) * 100)
    }
    
    return $stats
}

function Expand-Template {
    param(
        [string]$Template,
        [object]$Data
    )
    
    $result = $Template
    $Data.PSObject.Properties | ForEach-Object {
        $result = $result -replace "\{\{$($_.Name)\}\}", $_.Value
    }
    return $result
}

function Get-DaysUntilDue {
    param([string]$DueDate)
    
    $due = [DateTime]::Parse($DueDate)
    $now = Get-Date
    $diffTime = $due - $now
    return [Math]::Ceiling($diffTime.TotalDays)
}

function Test-Notification {
    param(
        [string]$Category,
        [string]$Type,
        [object]$Data
    )
    
    Write-Host "`n🧪 Testing notification: $Category.$Type"
    Write-Host "Data: $($Data | ConvertTo-Json -Depth 3)"
    
    $notification = Send-Notification -Type $Type -Category $Category -Data $Data
    Write-Host "Result: $($notification | ConvertTo-Json -Depth 3)"
    
    return $notification
}

function Remove-OldNotifications {
    param([int]$DaysToKeep = 30)
    
    $cutoffDate = (Get-Date).AddDays(-$DaysToKeep)
    $historyFile = Join-Path $NotificationsPath "history.json"
    
    if (Test-Path $historyFile) {
        $history = Get-Content $historyFile | ConvertFrom-Json
        $filteredHistory = $history | Where-Object {
            [DateTime]::Parse($_.timestamp) -gt $cutoffDate
        }
        $filteredHistory | ConvertTo-Json -Depth 10 | Set-Content $historyFile
    }
}

function Export-Notifications {
    param([string]$Format = 'json')
    
    $rules = Get-NotificationRules
    $channels = Get-NotificationChannels
    $history = Get-NotificationHistory
    
    $data = @{
        rules = $rules
        channels = $channels
        history = $history
    }
    
    if ($Format -eq 'json') {
        return $data | ConvertTo-Json -Depth 10
    } elseif ($Format -eq 'csv') {
        return Convert-NotificationsToCSV -History $history
    }
    
    throw "Unsupported format: $Format"
}

function Convert-NotificationsToCSV {
    param([array]$History)
    
    $csv = "Timestamp,Category,Type,Priority,Message,Status`n"
    $History | ForEach-Object {
        $csv += "`"$($_.timestamp)`",`"$($_.category)`",`"$($_.type)`",`"$($_.priority)`",`"$($_.message)`",`"$($_.status)`"`n"
    }
    return $csv
}

# Main execution
Ensure-Directories

if ($Help -or $Command -eq "help" -or $Command -eq "--help" -or $Command -eq "-h") {
    Show-Help
} elseif ($Command -eq "send") {
    if (-not $Category -or -not $Type -or -not $Data) {
        Write-Error "❌ Category, type, and data are required"
        exit 1
    }
    $data = $Data | ConvertFrom-Json
    $notification = Send-Notification -Type $Type -Category $Category -Data $data
    Write-Host "✅ Notification sent: $($notification.id)"
} elseif ($Command -eq "test") {
    if (-not $Category -or -not $Type -or -not $Data) {
        Write-Error "❌ Category, type, and data are required"
        exit 1
    }
    $data = $Data | ConvertFrom-Json
    Test-Notification -Category $Category -Type $Type -Data $data
} elseif ($Command -eq "stats") {
    $period = $Period ?? '24h'
    $stats = Get-NotificationStats -Period $period
    Write-Host "`n📊 Notification Statistics ($period):"
    Write-Host "Total: $($stats.total)"
    Write-Host "Success Rate: $($stats.successRate)%"
    Write-Host "Failure Rate: $($stats.failureRate)%"
    Write-Host "`nBy Priority:"
    $stats.byPriority.GetEnumerator() | ForEach-Object {
        Write-Host "  $($_.Key): $($_.Value)"
    }
} elseif ($Command -eq "history") {
    $filters = if ($Filters) { $Filters | ConvertFrom-Json } else { @{} }
    $history = Get-NotificationHistory -Filters $filters
    Write-Host "`n📋 Notification History ($($history.Count) notifications):"
    $history | Select-Object -First 10 | ForEach-Object {
        Write-Host "$($_.timestamp) [$($_.priority)] $($_.message)"
    }
} elseif ($Command -eq "rules") {
    $rules = Get-NotificationRules
    Write-Host "`n📋 Notification Rules:"
    $rules.GetEnumerator() | ForEach-Object {
        Write-Host "`n$($_.Key):"
        $_.Value.GetEnumerator() | ForEach-Object {
            Write-Host "  $($_.Key): $($_.Value.message)"
        }
    }
} elseif ($Command -eq "channels") {
    $channels = Get-NotificationChannels
    Write-Host "`n📡 Available Channels:"
    $channels.GetEnumerator() | ForEach-Object {
        $enabled = if ($_.Value.enabled) { "enabled" } else { "disabled" }
        Write-Host "  $($_.Key): $($_.Value.name) ($enabled)"
    }
} elseif ($Command -eq "cleanup") {
    $days = if ($Days) { [int]$Days } else { 30 }
    Remove-OldNotifications -DaysToKeep $days
    Write-Host "✅ Cleaned up notifications older than $days days"
} elseif ($Command -eq "export") {
    $format = $Format ?? 'json'
    $exported = Export-Notifications -Format $format
    Write-Host $exported
} else {
    Write-Error "❌ Unknown command: $Command"
    Write-Host "Use -Help for available commands"
    exit 1
}
