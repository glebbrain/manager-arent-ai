# Smart Notifications Manager Script v2.4
# Manages the AI-powered contextual notification system

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("send", "batch-send", "test", "status", "analytics", "channels", "templates", "rules", "monitor", "backup", "restore", "validate", "simulate", "report", "train", "evaluate", "optimize")]
    [string]$Action = "status",
    
    [Parameter(Mandatory=$false)]
    [string]$Event,
    
    [Parameter(Mandatory=$false)]
    [string]$Recipients,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("low", "medium", "high", "critical")]
    [string]$Priority = "medium",
    
    [Parameter(Mandatory=$false)]
    [string]$Channels = "email",
    
    [Parameter(Mandatory=$false)]
    [string]$InputFile,
    
    [Parameter(Mandatory=$false)]
    [string]$BackupPath,
    
    [Parameter(Mandatory=$false)]
    [string]$TemplateId,
    
    [Parameter(Mandatory=$false)]
    [string]$RuleId,
    
    [Parameter(Mandatory=$false)]
    [int]$Limit = 50,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Color definitions
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Cyan = "Cyan"
$White = "White"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] [$Level] $Message"
}

function Invoke-NotificationAPI {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        $Body = $null
    )
    $uri = "http://localhost:3010$Endpoint"
    $headers = @{}
    $headers.Add("Content-Type", "application/json")

    try {
        if ($Body) {
            $jsonBody = $Body | ConvertTo-Json -Depth 100
            Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -Body $jsonBody
        } else {
            Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers
        }
    }
    catch {
        Write-Log "Error calling Notification API: $($_.Exception.Message)" -Level "ERROR"
        exit 1
    }
}

function Send-Notification {
    param(
        [string]$Event,
        [string]$Recipients,
        [string]$Priority = "medium",
        [string]$Channels = "email"
    )
    
    Write-Log "Sending notification for event: $Event"
    
    $context = @{
        event = $Event
        timestamp = Get-Date
        source = "smart-notifications-manager"
        priority = $Priority
    }
    
    $recipientsList = @()
    if ($Recipients) {
        $recipientsList = $Recipients -split "," | ForEach-Object { @{ id = $_.Trim(); type = "user" } }
    }
    
    $channelsList = $Channels -split ","
    
    $body = @{
        event = $Event
        context = $context
        recipients = $recipientsList
        priority = $Priority
        channels = $channelsList
    }
    
    try {
        $result = Invoke-NotificationAPI -Endpoint "/api/notify" -Method "POST" -Body $body
        
        if ($result.success) {
            Write-Log "Notification sent successfully!" -Level "SUCCESS"
            Write-Host "`n=== Notification Details ===" -ForegroundColor $Cyan
            Write-Host "Event: $($result.notification.event)"
            Write-Host "Priority: $($result.notification.priority)"
            Write-Host "Channels: $($result.notification.channels -join ', ')"
            Write-Host "Status: $($result.notification.status)"
            Write-Host "ID: $($result.notification.id)"
        } else {
            Write-Log "Failed to send notification: $($result.error)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error sending notification: $_" -Level "ERROR"
    }
}

function Send-BatchNotifications {
    param([string]$InputFile)
    
    if (-not $InputFile -or -not (Test-Path $InputFile)) {
        Write-Log "Input file not found: $InputFile" -Level "ERROR"
        exit 1
    }
    
    Write-Log "Sending batch notifications from file: $InputFile"
    
    try {
        $inputData = Get-Content $InputFile | ConvertFrom-Json
        $body = @{
            notifications = $inputData.notifications
        }
        
        $result = Invoke-NotificationAPI -Endpoint "/api/batch-notify" -Method "POST" -Body $body
        
        if ($result.success) {
            Write-Log "Batch notifications sent successfully!" -Level "SUCCESS"
            Write-Host "`n=== Batch Results ===" -ForegroundColor $Cyan
            Write-Host "Total: $($result.results.total)"
            Write-Host "Successful: $($result.results.successful)"
            Write-Host "Failed: $($result.results.failed)"
            Write-Host "Success Rate: $([math]::Round($result.results.successful / $result.results.total * 100, 2))%"
        } else {
            Write-Log "Failed to send batch notifications: $($result.error)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error sending batch notifications: $_" -Level "ERROR"
    }
}

function Test-NotificationSystem {
    Write-Log "Testing notification system..."
    try {
        # Test health endpoint
        $health = Invoke-NotificationAPI -Endpoint "/health"
        if ($health.status -eq "healthy") {
            Write-Log "✅ Health check passed" -Level "SUCCESS"
        } else {
            Write-Log "❌ Health check failed" -Level "ERROR"
            return $false
        }
        
        # Test notification endpoint
        $testBody = @{
            event = "test_notification"
            context = @{
                message = "Test notification from manager script"
                timestamp = Get-Date
            }
            recipients = @(@{ id = "test_user"; type = "user" })
            priority = "medium"
            channels = @("email")
        }
        
        $result = Invoke-NotificationAPI -Endpoint "/api/notify" -Method "POST" -Body $testBody
        if ($result.success) {
            Write-Log "✅ Notification endpoint working" -Level "SUCCESS"
        } else {
            Write-Log "❌ Notification endpoint failed" -Level "ERROR"
            return $false
        }
        
        # Test analytics endpoint
        $analytics = Invoke-NotificationAPI -Endpoint "/api/analytics"
        if ($analytics.success) {
            Write-Log "✅ Analytics endpoint working" -Level "SUCCESS"
        } else {
            Write-Log "❌ Analytics endpoint failed" -Level "ERROR"
            return $false
        }
        
        Write-Log "All tests passed successfully!" -Level "SUCCESS"
        return $true
    }
    catch {
        Write-Log "Error testing notification system: $_" -Level "ERROR"
        return $false
    }
}

function Get-SystemStatus {
    Write-Log "Getting system status..."
    try {
        $status = Invoke-NotificationAPI -Endpoint "/api/system/status"
        
        if ($status.success) {
            Write-Log "=== System Status ===" -Level "INFO"
            Write-Host "Running: $($status.status.isRunning)" -ForegroundColor $(if ($status.status.isRunning) { $Green } else { $Red })
            Write-Host "Last Update: $($status.status.lastUpdate)"
            Write-Host "Queue Length: $($status.status.queueLength)"
            Write-Host "Active Channels: $($status.status.activeChannels)"
            Write-Host "Uptime: $($status.status.uptime) seconds"
        }
    }
    catch {
        Write-Log "Error getting system status: $_" -Level "ERROR"
    }
}

function Get-Analytics {
    Write-Log "Getting notification analytics..."
    try {
        $analytics = Invoke-NotificationAPI -Endpoint "/api/analytics"
        
        if ($analytics.success) {
            Write-Log "=== Notification Analytics ===" -Level "INFO"
            
            # Overall metrics
            Write-Host "`n=== Overall Metrics ===" -ForegroundColor $Cyan
            Write-Host "Total Notifications: $($analytics.analytics.total)"
            Write-Host "Recent (24h): $($analytics.analytics.recent)"
            Write-Host "Weekly: $($analytics.analytics.weekly)"
            Write-Host "Success Rate: $([math]::Round($analytics.analytics.successRate * 100, 2))%"
            Write-Host "Average Delivery Time: $([math]::Round($analytics.analytics.averageDeliveryTime / 1000, 2)) seconds"
            
            # By priority
            if ($analytics.analytics.byPriority) {
                Write-Host "`n=== By Priority ===" -ForegroundColor $Cyan
                foreach ($priority in $analytics.analytics.byPriority.PSObject.Properties) {
                    Write-Host "$($priority.Name): $($priority.Value)"
                }
            }
            
            # By channel
            if ($analytics.analytics.byChannel) {
                Write-Host "`n=== By Channel ===" -ForegroundColor $Cyan
                foreach ($channel in $analytics.analytics.byChannel.PSObject.Properties) {
                    Write-Host "$($channel.Name): $($channel.Value)"
                }
            }
            
            # Context analysis
            if ($analytics.analytics.contextAnalysis) {
                Write-Host "`n=== Context Analysis ===" -ForegroundColor $Cyan
                Write-Host "Enabled: $($analytics.analytics.contextAnalysis.enabled)"
                Write-Host "Total Analyzed: $($analytics.analytics.contextAnalysis.totalAnalyzed)"
                Write-Host "Accuracy: $([math]::Round($analytics.analytics.contextAnalysis.accuracy * 100, 2))%"
            }
            
            # Intelligent routing
            if ($analytics.analytics.intelligentRouting) {
                Write-Host "`n=== Intelligent Routing ===" -ForegroundColor $Cyan
                Write-Host "Enabled: $($analytics.analytics.intelligentRouting.enabled)"
                Write-Host "Total Routed: $($analytics.analytics.intelligentRouting.totalRouted)"
                Write-Host "Efficiency: $([math]::Round($analytics.analytics.intelligentRouting.efficiency * 100, 2))%"
            }
        }
    }
    catch {
        Write-Log "Error getting analytics: $_" -Level "ERROR"
    }
}

function Get-Channels {
    Write-Log "Getting available channels..."
    try {
        $channels = Invoke-NotificationAPI -Endpoint "/api/channels"
        
        if ($channels.success) {
            Write-Log "=== Available Channels ===" -Level "INFO"
            foreach ($channel in $channels.channels) {
                $status = if ($channel.enabled) { "enabled" } else { "disabled" }
                $color = if ($channel.enabled) { $Green } else { $Red }
                Write-Host "$($channel.name): $($channel.displayName) ($status)" -ForegroundColor $color
            }
        }
    }
    catch {
        Write-Log "Error getting channels: $_" -Level "ERROR"
    }
}

function Test-Channel {
    param([string]$ChannelName)
    
    Write-Log "Testing channel: $ChannelName"
    try {
        $testData = @{
            message = "Test message from manager script"
            timestamp = Get-Date
        }
        
        $result = Invoke-NotificationAPI -Endpoint "/api/channels/$ChannelName/test" -Method "POST" -Body $testData
        
        if ($result.success) {
            Write-Log "✅ Channel test successful" -Level "SUCCESS"
            Write-Host "Result: $($result.result.message)"
        } else {
            Write-Log "❌ Channel test failed" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error testing channel: $_" -Level "ERROR"
    }
}

function Get-Templates {
    Write-Log "Getting notification templates..."
    try {
        $templates = Invoke-NotificationAPI -Endpoint "/api/templates"
        
        if ($templates.success) {
            Write-Log "=== Notification Templates ===" -Level "INFO"
            foreach ($template in $templates.templates) {
                Write-Host "`n$($template.name) ($($template.id))" -ForegroundColor $Cyan
                Write-Host "  Subject: $($template.subject)"
                Write-Host "  Channels: $($template.channels -join ', ')"
                Write-Host "  Priority: $($template.priority)"
            }
        }
    }
    catch {
        Write-Log "Error getting templates: $_" -Level "ERROR"
    }
}

function Create-Template {
    param([string]$TemplateId, [string]$InputFile)
    
    if (-not $InputFile -or -not (Test-Path $InputFile)) {
        Write-Log "Input file not found: $InputFile" -Level "ERROR"
        exit 1
    }
    
    Write-Log "Creating template from file: $InputFile"
    try {
        $templateData = Get-Content $InputFile | ConvertFrom-Json
        $body = @{
            template = $templateData
        }
        
        $result = Invoke-NotificationAPI -Endpoint "/api/templates" -Method "POST" -Body $body
        
        if ($result.success) {
            Write-Log "Template created successfully!" -Level "SUCCESS"
            Write-Host "Template ID: $($result.template.id)"
            Write-Host "Name: $($result.template.name)"
        } else {
            Write-Log "Failed to create template: $($result.error)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error creating template: $_" -Level "ERROR"
    }
}

function Get-Rules {
    Write-Log "Getting notification rules..."
    try {
        $rules = Invoke-NotificationAPI -Endpoint "/api/rules"
        
        if ($rules.success) {
            Write-Log "=== Notification Rules ===" -Level "INFO"
            foreach ($rule in $rules.rules) {
                Write-Host "`n$($rule.name) ($($rule.id))" -ForegroundColor $Cyan
                Write-Host "  Event: $($rule.event)"
                Write-Host "  Priority: $($rule.actions.priority)"
                Write-Host "  Channels: $($rule.actions.channels -join ', ')"
            }
        }
    }
    catch {
        Write-Log "Error getting rules: $_" -Level "ERROR"
    }
}

function Create-Rule {
    param([string]$RuleId, [string]$InputFile)
    
    if (-not $InputFile -or -not (Test-Path $InputFile)) {
        Write-Log "Input file not found: $InputFile" -Level "ERROR"
        exit 1
    }
    
    Write-Log "Creating rule from file: $InputFile"
    try {
        $ruleData = Get-Content $InputFile | ConvertFrom-Json
        $body = @{
            rule = $ruleData
        }
        
        $result = Invoke-NotificationAPI -Endpoint "/api/rules" -Method "POST" -Body $body
        
        if ($result.success) {
            Write-Log "Rule created successfully!" -Level "SUCCESS"
            Write-Host "Rule ID: $($result.rule.id)"
            Write-Host "Name: $($result.rule.name)"
        } else {
            Write-Log "Failed to create rule: $($result.error)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error creating rule: $_" -Level "ERROR"
    }
}

function Monitor-NotificationSystem {
    Write-Log "Starting notification system monitoring..."
    try {
        $monitoringData = @{
            startTime = Get-Date
            checks = @()
            alerts = @()
        }
        
        # Check system health
        $health = Invoke-NotificationAPI -Endpoint "/health"
        $monitoringData.checks += @{
            timestamp = Get-Date
            check = "Health"
            status = if ($health.status -eq "healthy") { "OK" } else { "FAIL" }
            details = $health
        }
        
        # Check system status
        $status = Invoke-NotificationAPI -Endpoint "/api/system/status"
        if ($status.success) {
            $monitoringData.checks += @{
                timestamp = Get-Date
                check = "System Status"
                status = if ($status.status.isRunning) { "OK" } else { "WARNING" }
                details = "Running: $($status.status.isRunning), Queue: $($status.status.queueLength)"
            }
            
            if ($status.status.queueLength -gt 100) {
                $monitoringData.alerts += @{
                    timestamp = Get-Date
                    type = "High Queue"
                    severity = "MEDIUM"
                    message = "Notification queue is high: $($status.status.queueLength)"
                }
            }
        }
        
        # Check analytics
        $analytics = Invoke-NotificationAPI -Endpoint "/api/analytics"
        if ($analytics.success) {
            $successRate = $analytics.analytics.successRate
            $monitoringData.checks += @{
                timestamp = Get-Date
                check = "Success Rate"
                status = if ($successRate -gt 0.8) { "OK" } else { "WARNING" }
                details = "Success Rate: $([math]::Round($successRate * 100, 2))%"
            }
            
            if ($successRate -lt 0.5) {
                $monitoringData.alerts += @{
                    timestamp = Get-Date
                    type = "Low Success Rate"
                    severity = "HIGH"
                    message = "Notification success rate is low: $([math]::Round($successRate * 100, 2))%"
                }
            }
        }
        
        # Display monitoring results
        Write-Log "=== Monitoring Results ===" -Level "INFO"
        foreach ($check in $monitoringData.checks) {
            $statusColor = if ($check.status -eq "OK") { $Green } else { $Yellow }
            Write-Host "$($check.check): $($check.status)" -ForegroundColor $statusColor
            Write-Host "  $($check.details)" -ForegroundColor $Cyan
        }
        
        if ($monitoringData.alerts.Count -gt 0) {
            Write-Log "=== Alerts ===" -Level "WARNING"
            foreach ($alert in $monitoringData.alerts) {
                Write-Host "[$($alert.severity)] $($alert.message)" -ForegroundColor $Red
            }
        }
        
        return $monitoringData
    }
    catch {
        Write-Log "Error monitoring notification system: $_" -Level "ERROR"
        return $null
    }
}

function Backup-NotificationConfig {
    Write-Log "Backing up notification configuration..."
    try {
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $backupPath = "smart-notifications/backups/notification-backup-$timestamp.json"
        
        # Create backup directory if it doesn't exist
        $backupDir = Split-Path $backupPath -Parent
        if (-not (Test-Path $backupDir)) {
            New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        }
        
        # Get current configuration
        $config = @{
            timestamp = Get-Date
            analytics = (Invoke-NotificationAPI -Endpoint "/api/analytics").analytics
            systemStatus = (Invoke-NotificationAPI -Endpoint "/api/system/status").status
            templates = (Invoke-NotificationAPI -Endpoint "/api/templates").templates
            rules = (Invoke-NotificationAPI -Endpoint "/api/rules").rules
            channels = (Invoke-NotificationAPI -Endpoint "/api/channels").channels
        }
        
        # Save backup
        $config | ConvertTo-Json -Depth 10 | Out-File -FilePath $backupPath -Encoding UTF8
        
        Write-Log "Backup saved to: $backupPath" -Level "SUCCESS"
        Write-Log "Backup size: $([math]::Round((Get-Item $backupPath).Length / 1KB, 2)) KB" -Level "INFO"
        
        return $backupPath
    }
    catch {
        Write-Log "Error backing up notification configuration: $_" -Level "ERROR"
        return $null
    }
}

function Restore-NotificationConfig {
    param([string]$BackupPath)
    
    if (-not $BackupPath) {
        Write-Log "Backup path is required for restore" -Level "ERROR"
        return $false
    }
    
    if (-not (Test-Path $BackupPath)) {
        Write-Log "Backup file not found: $BackupPath" -Level "ERROR"
        return $false
    }
    
    Write-Log "Restoring notification configuration from $BackupPath..."
    try {
        $backupContent = Get-Content $BackupPath -Raw
        $backupData = $backupContent | ConvertFrom-Json
        
        # Restore templates if available
        if ($backupData.templates) {
            foreach ($template in $backupData.templates) {
                $body = @{ template = $template }
                Invoke-NotificationAPI -Endpoint "/api/templates" -Method "POST" -Body $body | Out-Null
            }
            Write-Log "Restored templates" -Level "SUCCESS"
        }
        
        # Restore rules if available
        if ($backupData.rules) {
            foreach ($rule in $backupData.rules) {
                $body = @{ rule = $rule }
                Invoke-NotificationAPI -Endpoint "/api/rules" -Method "POST" -Body $body | Out-Null
            }
            Write-Log "Restored rules" -Level "SUCCESS"
        }
        
        Write-Log "Notification configuration restored successfully!" -Level "SUCCESS"
        return $true
    }
    catch {
        Write-Log "Error restoring notification configuration: $_" -Level "ERROR"
        return $false
    }
}

function Validate-NotificationConfig {
    Write-Log "Validating notification configuration..."
    try {
        $validationResults = @{
            isValid = $true
            issues = @()
            warnings = @()
        }
        
        # Check system health
        $health = Invoke-NotificationAPI -Endpoint "/health"
        if ($health.status -ne "healthy") {
            $validationResults.issues += "System is not healthy"
            $validationResults.isValid = $false
        }
        
        # Check success rate
        $analytics = Invoke-NotificationAPI -Endpoint "/api/analytics"
        if ($analytics.success) {
            $successRate = $analytics.analytics.successRate
            if ($successRate -lt 0.5) {
                $validationResults.warnings += "Low success rate: $([math]::Round($successRate * 100, 2))%"
            }
        }
        
        # Check channels
        $channels = Invoke-NotificationAPI -Endpoint "/api/channels"
        if ($channels.success) {
            $enabledChannels = $channels.channels | Where-Object { $_.enabled }
            if ($enabledChannels.Count -eq 0) {
                $validationResults.warnings += "No channels are enabled"
            }
        }
        
        # Display validation results
        Write-Log "=== Validation Results ===" -Level "INFO"
        if ($validationResults.isValid) {
            Write-Log "✅ Configuration is valid" -Level "SUCCESS"
        } else {
            Write-Log "❌ Configuration has issues" -Level "ERROR"
        }
        
        if ($validationResults.issues.Count -gt 0) {
            Write-Log "Issues:" -Level "ERROR"
            foreach ($issue in $validationResults.issues) {
                Write-Host "  - $issue" -ForegroundColor $Red
            }
        }
        
        if ($validationResults.warnings.Count -gt 0) {
            Write-Log "Warnings:" -Level "WARNING"
            foreach ($warning in $validationResults.warnings) {
                Write-Host "  - $warning" -ForegroundColor $Yellow
            }
        }
        
        return $validationResults
    }
    catch {
        Write-Log "Error validating notification configuration: $_" -Level "ERROR"
        return @{ isValid = $false; issues = @("Validation failed: $_") }
    }
}

function Simulate-Notifications {
    Write-Log "Simulating notifications..."
    try {
        # Create test notifications
        $testNotifications = @(
            @{
                event = "task_completed"
                context = @{
                    taskTitle = "Test Task 1"
                    developerName = "Test Developer"
                    completedAt = Get-Date
                    duration = "2 hours"
                    qualityScore = 8.5
                }
                recipients = @(@{ id = "test_user_1"; type = "user" })
                priority = "medium"
                channels = @("email")
            },
            @{
                event = "deadline_approaching"
                context = @{
                    taskTitle = "Test Task 2"
                    developerName = "Test Developer"
                    deadline = (Get-Date).AddDays(1)
                    timeRemaining = "24 hours"
                    progress = 75
                }
                recipients = @(@{ id = "test_user_2"; type = "user" })
                priority = "high"
                channels = @("email", "push")
            }
        )
        
        $body = @{
            notifications = $testNotifications
        }
        
        $result = Invoke-NotificationAPI -Endpoint "/api/batch-notify" -Method "POST" -Body $body
        
        if ($result.success) {
            Write-Log "Simulation completed successfully!" -Level "SUCCESS"
            Write-Host "`n=== Simulation Results ===" -Level "INFO"
            Write-Host "Total Notifications: $($result.results.total)"
            Write-Host "Successful: $($result.results.successful)"
            Write-Host "Failed: $($result.results.failed)"
            Write-Host "Success Rate: $([math]::Round($result.results.successful / $result.results.total * 100, 2))%"
        } else {
            Write-Log "Simulation failed: $($result.error)" -Level "ERROR"
        }
        
        return $result.success
    }
    catch {
        Write-Log "Error simulating notifications: $_" -Level "ERROR"
        return $false
    }
}

function Generate-NotificationReport {
    Write-Log "Generating notification report..."
    try {
        $report = @{
            timestamp = Get-Date
            systemStatus = (Invoke-NotificationAPI -Endpoint "/api/system/status").status
            analytics = (Invoke-NotificationAPI -Endpoint "/api/analytics").analytics
            templates = (Invoke-NotificationAPI -Endpoint "/api/templates").templates
            rules = (Invoke-NotificationAPI -Endpoint "/api/rules").rules
            channels = (Invoke-NotificationAPI -Endpoint "/api/channels").channels
        }
        
        # Save report
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $reportPath = "smart-notifications/reports/notification-report-$timestamp.json"
        
        # Create reports directory if it doesn't exist
        $reportDir = Split-Path $reportPath -Parent
        if (-not (Test-Path $reportDir)) {
            New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
        }
        
        $report | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath -Encoding UTF8
        
        Write-Log "Report generated: $reportPath" -Level "SUCCESS"
        Write-Log "Report size: $([math]::Round((Get-Item $reportPath).Length / 1KB, 2)) KB" -Level "INFO"
        
        return $reportPath
    }
    catch {
        Write-Log "Error generating notification report: $_" -Level "ERROR"
        return $null
    }
}

function Show-Help {
    Write-Log "Smart Notifications Manager v2.4 - Available Commands:" -Level "INFO"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  send              - Send a single notification"
    Write-Host "  batch-send        - Send batch notifications from file"
    Write-Host "  test              - Test notification system"
    Write-Host "  status            - Show system status"
    Write-Host "  analytics         - Show notification analytics"
    Write-Host "  channels          - Show available channels"
    Write-Host "  templates         - Show notification templates"
    Write-Host "  rules             - Show notification rules"
    Write-Host "  monitor           - Monitor notification system"
    Write-Host "  backup            - Backup notification configuration"
    Write-Host "  restore           - Restore from backup"
    Write-Host "  validate          - Validate notification configuration"
    Write-Host "  simulate          - Simulate notifications with test data"
    Write-Host "  report            - Generate notification report"
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "  -Event            - Event type for notification"
    Write-Host "  -Recipients       - Comma-separated list of recipients"
    Write-Host "  -Priority         - Notification priority (low, medium, high, critical)"
    Write-Host "  -Channels         - Comma-separated list of channels"
    Write-Host "  -InputFile        - JSON file with input data"
    Write-Host "  -BackupPath       - Path to backup file for restore"
    Write-Host "  -TemplateId       - Template ID for operations"
    Write-Host "  -RuleId           - Rule ID for operations"
    Write-Host "  -Limit            - Limit for results (default: 50)"
    Write-Host "  -Force            - Force operation"
    Write-Host "  -Verbose          - Enable verbose logging"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\smart-notifications-manager.ps1 -Action send -Event 'task_completed' -Recipients 'user1,user2' -Priority high"
    Write-Host "  .\smart-notifications-manager.ps1 -Action batch-send -InputFile notifications.json"
    Write-Host "  .\smart-notifications-manager.ps1 -Action test"
    Write-Host "  .\smart-notifications-manager.ps1 -Action analytics"
    Write-Host "  .\smart-notifications-manager.ps1 -Action monitor"
    Write-Host "  .\smart-notifications-manager.ps1 -Action backup"
    Write-Host "  .\smart-notifications-manager.ps1 -Action restore -BackupPath smart-notifications/backups/backup.json"
    Write-Host "  .\smart-notifications-manager.ps1 -Action simulate"
    Write-Host "  .\smart-notifications-manager.ps1 -Action report"
}

# Main logic
switch ($Action) {
    "send" {
        if (-not $Event) {
            Write-Log "Event is required for sending notification." -Level "ERROR"
            exit 1
        }
        Send-Notification -Event $Event -Recipients $Recipients -Priority $Priority -Channels $Channels
    }
    "batch-send" {
        if (-not $InputFile) {
            Write-Log "InputFile is required for batch sending." -Level "ERROR"
            exit 1
        }
        Send-BatchNotifications -InputFile $InputFile
    }
    "test" {
        Test-NotificationSystem
    }
    "status" {
        Get-SystemStatus
    }
    "analytics" {
        Get-Analytics
    }
    "channels" {
        Get-Channels
    }
    "templates" {
        Get-Templates
    }
    "rules" {
        Get-Rules
    }
    "monitor" {
        Monitor-NotificationSystem
    }
    "backup" {
        Backup-NotificationConfig
    }
    "restore" {
        Restore-NotificationConfig -BackupPath $BackupPath
    }
    "validate" {
        Validate-NotificationConfig
    }
    "simulate" {
        Simulate-Notifications
    }
    "report" {
        Generate-NotificationReport
    }
    default {
        Show-Help
    }
}
