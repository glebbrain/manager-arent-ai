# Automatic Status Updates Management Script v2.4
# Manages automatic task status updates system

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("update", "get", "bulk", "auto", "history", "rollback", "conflicts", "resolve-conflicts", "analytics", "patterns", "predict", "rules", "create-rule", "status", "monitor", "backup", "restore", "validate", "report")]
    [string]$Action = "status",
    
    [Parameter(Mandatory=$false)]
    [string]$TaskId,
    
    [Parameter(Mandatory=$false)]
    [string]$NewStatus,
    
    [Parameter(Mandatory=$false)]
    [string]$Reason,
    
    [Parameter(Mandatory=$false)]
    [string]$ProjectId,
    
    [Parameter(Mandatory=$false)]
    [string]$InputFile,
    
    [Parameter(Mandatory=$false)]
    [string]$BackupPath,
    
    [Parameter(Mandatory=$false)]
    [string]$UpdateId,
    
    [Parameter(Mandatory=$false)]
    [string]$ResolutionStrategy = "auto",
    
    [Parameter(Mandatory=$false)]
    [string]$StartDate,
    
    [Parameter(Mandatory=$false)]
    [string]$EndDate,
    
    [Parameter(Mandatory=$false)]
    [string]$GroupBy = "day",
    
    [Parameter(Mandatory=$false)]
    [string]$TaskType,
    
    [Parameter(Mandatory=$false)]
    [string]$TimeRange = "30d",
    
    [Parameter(Mandatory=$false)]
    [string]$RuleData,
    
    [Parameter(Mandatory=$false)]
    [int]$Limit = 50,
    
    [Parameter(Mandatory=$false)]
    [int]$Offset = 0,
    
    [Parameter(Mandatory=$false)]
    [switch]$IncludeHistory,
    
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

function Invoke-StatusUpdateAPI {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        $Body = $null
    )
    $uri = "http://localhost:3013$Endpoint"
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
        Write-Log "Error calling Status Updates API: $($_.Exception.Message)" -Level "ERROR"
        exit 1
    }
}

function Update-TaskStatus {
    param(
        [string]$TaskId,
        [string]$NewStatus,
        [string]$Reason,
        [string]$ProjectId
    )
    
    Write-Log "Updating task status: $TaskId -> $NewStatus"
    
    $body = @{
        taskId = $TaskId
        newStatus = $NewStatus
        reason = $Reason
        metadata = @{
            projectId = $ProjectId
            user = "system"
            timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        }
    }
    
    try {
        $result = Invoke-StatusUpdateAPI -Endpoint "/api/status-updates" -Method "POST" -Body $body
        
        if ($result.success) {
            Write-Log "Status updated successfully!" -Level "SUCCESS"
            Write-Host "`n=== Status Update Details ===" -ForegroundColor $Cyan
            Write-Host "Task ID: $($result.result.taskId)"
            Write-Host "Previous Status: $($result.result.previousStatus)"
            Write-Host "New Status: $($result.result.newStatus)"
            Write-Host "Reason: $($result.result.reason)"
            Write-Host "Timestamp: $($result.result.timestamp)"
            
            if ($result.result.conflicts.Count -gt 0) {
                Write-Host "`n=== Conflicts Detected ===" -ForegroundColor $Yellow
                foreach ($conflict in $result.result.conflicts) {
                    Write-Host "[$($conflict.severity.ToUpper())] $($conflict.message)" -ForegroundColor $Yellow
                }
            }
        } else {
            Write-Log "Failed to update status: $($result.error)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error updating status: $_" -Level "ERROR"
    }
}

function Get-TaskStatusUpdates {
    param(
        [string]$TaskId,
        [switch]$IncludeHistory,
        [int]$Limit
    )
    
    Write-Log "Getting status updates for task: $TaskId"
    
    $queryParams = "?includeHistory=$($IncludeHistory.IsPresent)&limit=$Limit"
    $result = Invoke-StatusUpdateAPI -Endpoint "/api/status-updates/$TaskId$queryParams"
    
    if ($result.success) {
        Write-Log "=== Status Updates ===" -Level "INFO"
        Write-Host "Task ID: $TaskId" -ForegroundColor $Cyan
        Write-Host "Total Updates: $($result.statusUpdates.Count)"
        
        foreach ($update in $result.statusUpdates) {
            Write-Host "`n- $($update.previousStatus) -> $($update.newStatus)" -ForegroundColor $White
            Write-Host "  Reason: $($update.reason)" -ForegroundColor $Cyan
            Write-Host "  Timestamp: $($update.timestamp)" -ForegroundColor $Cyan
            Write-Host "  Auto Generated: $($update.autoGenerated)" -ForegroundColor $Cyan
            
            if ($update.conflicts -and $update.conflicts.Count -gt 0) {
                Write-Host "  Conflicts: $($update.conflicts.Count)" -ForegroundColor $Yellow
            }
        }
    }
}

function Invoke-BulkStatusUpdate {
    param(
        [string]$InputFile,
        [string]$ProjectId
    )
    
    Write-Log "Performing bulk status update from file: $InputFile"
    
    if (-not (Test-Path $InputFile)) {
        Write-Log "Input file not found: $InputFile" -Level "ERROR"
        return
    }
    
    try {
        $updates = Get-Content $InputFile | ConvertFrom-Json
        
        $body = @{
            updates = $updates
            options = @{
                validateTransitions = $true
                resolveConflicts = $true
            }
        }
        
        $result = Invoke-StatusUpdateAPI -Endpoint "/api/status-updates/bulk" -Method "POST" -Body $body
        
        if ($result.success) {
            Write-Log "Bulk update completed!" -Level "SUCCESS"
            Write-Host "`n=== Bulk Update Results ===" -ForegroundColor $Cyan
            Write-Host "Total Updates: $($result.results.totalUpdates)"
            Write-Host "Successful: $($result.results.successfulUpdates)"
            Write-Host "Failed: $($result.results.failedUpdates)"
            
            if ($result.results.failedUpdates -gt 0) {
                Write-Host "`n=== Failed Updates ===" -ForegroundColor $Red
                foreach ($failed in $result.results.results | Where-Object { -not $_.success }) {
                    Write-Host "Task $($failed.taskId): $($failed.error)" -ForegroundColor $Red
                }
            }
        } else {
            Write-Log "Failed to perform bulk update: $($result.error)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error performing bulk update: $_" -Level "ERROR"
    }
}

function Invoke-AutoStatusUpdate {
    param(
        [string]$TaskIds,
        [string]$ProjectId
    )
    
    Write-Log "Performing auto status update for tasks: $TaskIds"
    
    $taskIdsList = $TaskIds -split "," | ForEach-Object { $_.Trim() }
    
    $body = @{
        taskIds = $taskIdsList
        projectId = $ProjectId
        options = @{
            useAI = $true
            confidenceThreshold = 0.8
        }
    }
    
    try {
        $result = Invoke-StatusUpdateAPI -Endpoint "/api/status-updates/auto" -Method "POST" -Body $body
        
        if ($result.success) {
            Write-Log "Auto update completed!" -Level "SUCCESS"
            Write-Host "`n=== Auto Update Results ===" -ForegroundColor $Cyan
            Write-Host "Total Tasks: $($result.results.totalTasks)"
            Write-Host "Updated Tasks: $($result.results.updatedTasks)"
            Write-Host "Unchanged Tasks: $($result.results.unchangedTasks)"
            Write-Host "Failed Tasks: $($result.results.failedTasks)"
            
            foreach ($taskResult in $result.results.results) {
                if ($taskResult.success -and $taskResult.statusUpdate) {
                    Write-Host "`nTask $($taskResult.taskId): $($taskResult.statusUpdate.previousStatus) -> $($taskResult.statusUpdate.newStatus)" -ForegroundColor $Green
                    Write-Host "  Reason: $($taskResult.statusUpdate.reason)" -ForegroundColor $Cyan
                } elseif ($taskResult.success) {
                    Write-Host "`nTask $($taskResult.taskId): No change needed" -ForegroundColor $Yellow
                } else {
                    Write-Host "`nTask $($taskResult.taskId): Failed - $($taskResult.error)" -ForegroundColor $Red
                }
            }
        } else {
            Write-Log "Failed to perform auto update: $($result.error)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error performing auto update: $_" -Level "ERROR"
    }
}

function Get-StatusHistory {
    param(
        [string]$TaskId,
        [string]$ProjectId,
        [string]$Status,
        [string]$StartDate,
        [string]$EndDate,
        [int]$Limit,
        [int]$Offset
    )
    
    Write-Log "Getting status history"
    
    $queryParams = @()
    if ($TaskId) { $queryParams += "taskId=$TaskId" }
    if ($ProjectId) { $queryParams += "projectId=$ProjectId" }
    if ($Status) { $queryParams += "status=$Status" }
    if ($StartDate) { $queryParams += "startDate=$StartDate" }
    if ($EndDate) { $queryParams += "endDate=$EndDate" }
    if ($Limit) { $queryParams += "limit=$Limit" }
    if ($Offset) { $queryParams += "offset=$Offset" }
    
    $queryString = if ($queryParams.Count -gt 0) { "?" + ($queryParams -join "&") } else { "" }
    
    try {
        $result = Invoke-StatusUpdateAPI -Endpoint "/api/status-updates/history$queryString"
        
        if ($result.success) {
            Write-Log "=== Status History ===" -Level "INFO"
            Write-Host "Total Records: $($result.history.Count)"
            
            foreach ($record in $result.history) {
                Write-Host "`nTask: $($record.taskId)" -ForegroundColor $Cyan
                Write-Host "Status: $($record.previousStatus) -> $($record.newStatus)" -ForegroundColor $White
                Write-Host "Reason: $($record.reason)" -ForegroundColor $Cyan
                Write-Host "Timestamp: $($record.timestamp)" -ForegroundColor $Cyan
                Write-Host "Auto Generated: $($record.autoGenerated)" -ForegroundColor $Cyan
            }
        }
    }
    catch {
        Write-Log "Error getting status history: $_" -Level "ERROR"
    }
}

function Invoke-StatusRollback {
    param(
        [string]$TaskId,
        [string]$UpdateId,
        [string]$Reason
    )
    
    Write-Log "Rolling back status update: $UpdateId for task: $TaskId"
    
    $body = @{
        taskId = $TaskId
        updateId = $UpdateId
        reason = $Reason
    }
    
    try {
        $result = Invoke-StatusUpdateAPI -Endpoint "/api/status-updates/rollback" -Method "POST" -Body $body
        
        if ($result.success) {
            Write-Log "Status rollback completed!" -Level "SUCCESS"
            Write-Host "`n=== Rollback Details ===" -ForegroundColor $Cyan
            Write-Host "Task ID: $($result.result.rollbackUpdate.taskId)"
            Write-Host "Rolled back to: $($result.result.rollbackUpdate.newStatus)"
            Write-Host "Reason: $($result.result.rollbackUpdate.reason)"
            Write-Host "Timestamp: $($result.result.rollbackUpdate.timestamp)"
        } else {
            Write-Log "Failed to rollback status: $($result.error)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error rolling back status: $_" -Level "ERROR"
    }
}

function Get-StatusConflicts {
    param(
        [string]$TaskId,
        [string]$ProjectId
    )
    
    Write-Log "Getting status conflicts"
    
    $queryParams = @()
    if ($TaskId) { $queryParams += "taskId=$TaskId" }
    if ($ProjectId) { $queryParams += "projectId=$ProjectId" }
    
    $queryString = if ($queryParams.Count -gt 0) { "?" + ($queryParams -join "&") } else { "" }
    
    try {
        $result = Invoke-StatusUpdateAPI -Endpoint "/api/status-updates/conflicts$queryString"
        
        if ($result.success) {
            Write-Log "=== Status Conflicts ===" -Level "INFO"
            Write-Host "Total Conflicts: $($result.conflicts.Count)"
            
            foreach ($conflict in $result.conflicts) {
                $severityColor = if ($conflict.severity -eq "high") { $Red } else { $Yellow }
                Write-Host "`n[$($conflict.severity.ToUpper())] $($conflict.type)" -ForegroundColor $severityColor
                Write-Host "Message: $($conflict.message)" -ForegroundColor $Cyan
                Write-Host "Task ID: $($conflict.taskId)" -ForegroundColor $Cyan
            }
        }
    }
    catch {
        Write-Log "Error getting status conflicts: $_" -Level "ERROR"
    }
}

function Resolve-StatusConflicts {
    param(
        [string]$Conflicts,
        [string]$ResolutionStrategy
    )
    
    Write-Log "Resolving status conflicts with strategy: $ResolutionStrategy"
    
    $conflictsList = $Conflicts -split "," | ForEach-Object { @{ id = $_.Trim() } }
    
    $body = @{
        conflicts = $conflictsList
        resolutionStrategy = $ResolutionStrategy
    }
    
    try {
        $result = Invoke-StatusUpdateAPI -Endpoint "/api/status-updates/resolve-conflicts" -Method "POST" -Body $body
        
        if ($result.success) {
            Write-Log "Conflict resolution completed!" -Level "SUCCESS"
            Write-Host "`n=== Resolution Results ===" -ForegroundColor $Cyan
            Write-Host "Total Conflicts: $($result.results.totalConflicts)"
            Write-Host "Resolved: $($result.results.resolvedConflicts)"
            Write-Host "Failed: $($result.results.failedResolutions)"
        } else {
            Write-Log "Failed to resolve conflicts: $($result.error)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error resolving conflicts: $_" -Level "ERROR"
    }
}

function Get-StatusAnalytics {
    param(
        [string]$ProjectId,
        [string]$StartDate,
        [string]$EndDate,
        [string]$GroupBy
    )
    
    Write-Log "Getting status analytics"
    
    $queryParams = @()
    if ($ProjectId) { $queryParams += "projectId=$ProjectId" }
    if ($StartDate) { $queryParams += "startDate=$StartDate" }
    if ($EndDate) { $queryParams += "endDate=$EndDate" }
    if ($GroupBy) { $queryParams += "groupBy=$GroupBy" }
    
    $queryString = if ($queryParams.Count -gt 0) { "?" + ($queryParams -join "&") } else { "" }
    
    try {
        $result = Invoke-StatusUpdateAPI -Endpoint "/api/status-updates/analytics$queryString"
        
        if ($result.success) {
            Write-Log "=== Status Analytics ===" -Level "INFO"
            Write-Host "Total Updates: $($result.analytics.totalUpdates)" -ForegroundColor $Cyan
            Write-Host "Auto Generated: $($result.analytics.autoGeneratedUpdates)" -ForegroundColor $Cyan
            Write-Host "Manual Updates: $($result.analytics.manualUpdates)" -ForegroundColor $Cyan
            Write-Host "Conflict Rate: $([math]::Round($result.analytics.conflictRate * 100, 2))%" -ForegroundColor $Cyan
            Write-Host "Rollback Rate: $([math]::Round($result.analytics.rollbackRate * 100, 2))%" -ForegroundColor $Cyan
            
            Write-Host "`n=== Status Distribution ===" -ForegroundColor $Cyan
            foreach ($status in $result.analytics.statusDistribution.PSObject.Properties) {
                Write-Host "$($status.Name): $($status.Value)" -ForegroundColor $White
            }
        }
    }
    catch {
        Write-Log "Error getting status analytics: $_" -Level "ERROR"
    }
}

function Get-StatusPatterns {
    param(
        [string]$ProjectId,
        [string]$TaskType,
        [string]$TimeRange
    )
    
    Write-Log "Analyzing status patterns"
    
    $queryParams = @()
    if ($ProjectId) { $queryParams += "projectId=$ProjectId" }
    if ($TaskType) { $queryParams += "taskType=$TaskType" }
    if ($TimeRange) { $queryParams += "timeRange=$TimeRange" }
    
    $queryString = if ($queryParams.Count -gt 0) { "?" + ($queryParams -join "&") } else { "" }
    
    try {
        $result = Invoke-StatusUpdateAPI -Endpoint "/api/status-updates/patterns$queryString"
        
        if ($result.success) {
            Write-Log "=== Status Patterns ===" -Level "INFO"
            Write-Host "Project ID: $($result.patterns.projectId)" -ForegroundColor $Cyan
            Write-Host "Task Type: $($result.patterns.taskType)" -ForegroundColor $Cyan
            Write-Host "Time Range: $($result.patterns.timeRange)" -ForegroundColor $Cyan
            
            if ($result.patterns.insights.Count -gt 0) {
                Write-Host "`n=== Insights ===" -ForegroundColor $Cyan
                foreach ($insight in $result.patterns.insights) {
                    $severityColor = if ($insight.severity -eq "warning") { $Red } else { $Yellow }
                    Write-Host "[$($insight.severity.ToUpper())] $($insight.message)" -ForegroundColor $severityColor
                }
            }
            
            if ($result.patterns.recommendations.Count -gt 0) {
                Write-Host "`n=== Recommendations ===" -ForegroundColor $Cyan
                foreach ($rec in $result.patterns.recommendations) {
                    $priorityColor = if ($rec.priority -eq "high") { $Red } else { $Yellow }
                    Write-Host "[$($rec.priority.ToUpper())] $($rec.action)" -ForegroundColor $priorityColor
                }
            }
        }
    }
    catch {
        Write-Log "Error analyzing status patterns: $_" -Level "ERROR"
    }
}

function Predict-NextStatus {
    param(
        [string]$TaskId,
        [string]$CurrentStatus,
        [string]$ProjectId
    )
    
    Write-Log "Predicting next status for task: $TaskId"
    
    $body = @{
        taskId = $TaskId
        currentStatus = $CurrentStatus
        context = @{
            projectId = $ProjectId
            timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        }
    }
    
    try {
        $result = Invoke-StatusUpdateAPI -Endpoint "/api/status-updates/predict" -Method "POST" -Body $body
        
        if ($result.success) {
            Write-Log "=== Status Prediction ===" -Level "INFO"
            Write-Host "Task ID: $($result.prediction.taskId)" -ForegroundColor $Cyan
            Write-Host "Current Status: $($result.prediction.currentStatus)" -ForegroundColor $Cyan
            Write-Host "Predicted Status: $($result.prediction.predictedStatus)" -ForegroundColor $Green
            Write-Host "Confidence: $([math]::Round($result.prediction.confidence * 100, 1))%" -ForegroundColor $Cyan
            Write-Host "Reasoning: $($result.prediction.reasoning)" -ForegroundColor $Cyan
        } else {
            Write-Log "Failed to predict next status: $($result.error)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error predicting next status: $_" -Level "ERROR"
    }
}

function Get-StatusRules {
    param(
        [string]$ProjectId,
        [string]$Status
    )
    
    Write-Log "Getting status rules"
    
    $queryParams = @()
    if ($ProjectId) { $queryParams += "projectId=$ProjectId" }
    if ($Status) { $queryParams += "status=$Status" }
    
    $queryString = if ($queryParams.Count -gt 0) { "?" + ($queryParams -join "&") } else { "" }
    
    try {
        $result = Invoke-StatusUpdateAPI -Endpoint "/api/status-updates/rules$queryString"
        
        if ($result.success) {
            Write-Log "=== Status Rules ===" -Level "INFO"
            Write-Host "Total Rules: $($result.rules.Count)"
            
            foreach ($rule in $result.rules) {
                Write-Host "`nRule: $($rule.name)" -ForegroundColor $Cyan
                Write-Host "Description: $($rule.description)" -ForegroundColor $White
                Write-Host "Status: $($rule.status)" -ForegroundColor $Cyan
                Write-Host "Priority: $($rule.priority)" -ForegroundColor $Cyan
                Write-Host "Active: $($rule.isActive)" -ForegroundColor $Cyan
            }
        }
    }
    catch {
        Write-Log "Error getting status rules: $_" -Level "ERROR"
    }
}

function New-StatusRule {
    param(
        [string]$RuleData
    )
    
    Write-Log "Creating new status rule"
    
    $rule = if ($RuleData) {
        $RuleData | ConvertFrom-Json
    } else {
        @{
            name = "Custom Rule"
            description = "Custom status update rule"
            status = "in_progress"
            conditions = @{
                priority = "high"
                complexity = "medium"
            }
            action = "complete"
            priority = "medium"
        }
    }
    
    $body = @{
        rule = $rule
    }
    
    try {
        $result = Invoke-StatusUpdateAPI -Endpoint "/api/status-updates/rules" -Method "POST" -Body $body
        
        if ($result.success) {
            Write-Log "Status rule created successfully!" -Level "SUCCESS"
            Write-Host "`n=== Rule Details ===" -ForegroundColor $Cyan
            Write-Host "Rule ID: $($result.rule.id)" -ForegroundColor $Cyan
            Write-Host "Name: $($result.rule.name)" -ForegroundColor $Cyan
            Write-Host "Description: $($result.rule.description)" -ForegroundColor $Cyan
            Write-Host "Status: $($result.rule.status)" -ForegroundColor $Cyan
            Write-Host "Priority: $($result.rule.priority)" -ForegroundColor $Cyan
            Write-Host "Created: $($result.rule.createdAt)" -ForegroundColor $Cyan
        } else {
            Write-Log "Failed to create status rule: $($result.error)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error creating status rule: $_" -Level "ERROR"
    }
}

function Get-SystemStatus {
    Write-Log "Getting status update system status..."
    try {
        $status = Invoke-StatusUpdateAPI -Endpoint "/api/system/status"
        
        if ($status.success) {
            Write-Log "=== System Status ===" -Level "INFO"
            Write-Host "Running: $($status.status.isRunning)" -ForegroundColor $(if ($status.status.isRunning) { $Green } else { $Red })
            Write-Host "Last Update: $($status.status.lastUpdate)"
            Write-Host "Total Updates: $($status.status.totalUpdates)"
            Write-Host "Active Tasks: $($status.status.activeTasks)"
            Write-Host "Pending Updates: $($status.status.pendingUpdates)"
            Write-Host "Conflicts: $($status.status.conflicts)"
            Write-Host "Uptime: $($status.status.uptime) seconds"
        }
    }
    catch {
        Write-Log "Error getting system status: $_" -Level "ERROR"
    }
}

function Show-Help {
    Write-Log "Automatic Status Updates v2.4 - Available Commands:" -Level "INFO"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  update              - Update task status"
    Write-Host "  get                 - Get status updates for a task"
    Write-Host "  bulk                - Perform bulk status updates"
    Write-Host "  auto                - Perform auto status updates"
    Write-Host "  history             - Get status history"
    Write-Host "  rollback            - Rollback a status update"
    Write-Host "  conflicts           - Get status conflicts"
    Write-Host "  resolve-conflicts   - Resolve status conflicts"
    Write-Host "  analytics           - Get status analytics"
    Write-Host "  patterns            - Analyze status patterns"
    Write-Host "  predict             - Predict next status"
    Write-Host "  rules               - Get status rules"
    Write-Host "  create-rule         - Create new status rule"
    Write-Host "  status              - Show system status"
    Write-Host "  monitor             - Monitor status system"
    Write-Host "  backup              - Backup status configuration"
    Write-Host "  restore             - Restore from backup"
    Write-Host "  validate            - Validate status configuration"
    Write-Host "  report              - Generate status report"
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "  -TaskId             - Task ID for operations"
    Write-Host "  -NewStatus          - New status for update"
    Write-Host "  -Reason             - Reason for status change"
    Write-Host "  -ProjectId          - Project ID for operations"
    Write-Host "  -InputFile          - JSON file with input data"
    Write-Host "  -BackupPath         - Path to backup file for restore"
    Write-Host "  -UpdateId           - Update ID for rollback"
    Write-Host "  -ResolutionStrategy - Strategy for conflict resolution"
    Write-Host "  -StartDate          - Start date for history/analytics"
    Write-Host "  -EndDate            - End date for history/analytics"
    Write-Host "  -GroupBy            - Grouping for analytics (day, week, month)"
    Write-Host "  -TaskType           - Task type for pattern analysis"
    Write-Host "  -TimeRange          - Time range for analysis (30d, 90d, 1y)"
    Write-Host "  -RuleData           - JSON data for rule creation"
    Write-Host "  -Limit              - Limit for results"
    Write-Host "  -Offset             - Offset for pagination"
    Write-Host "  -IncludeHistory     - Include historical data"
    Write-Host "  -Force              - Force operation"
    Write-Host "  -Verbose            - Enable verbose logging"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\automatic-status-updates-manager.ps1 -Action update -TaskId task_1 -NewStatus completed -Reason 'Task finished'"
    Write-Host "  .\automatic-status-updates-manager.ps1 -Action get -TaskId task_1 -IncludeHistory"
    Write-Host "  .\automatic-status-updates-manager.ps1 -Action bulk -InputFile updates.json"
    Write-Host "  .\automatic-status-updates-manager.ps1 -Action auto -TaskIds task_1,task_2,task_3 -ProjectId proj_123"
    Write-Host "  .\automatic-status-updates-manager.ps1 -Action history -ProjectId proj_123 -StartDate 2024-01-01 -EndDate 2024-01-31"
    Write-Host "  .\automatic-status-updates-manager.ps1 -Action rollback -TaskId task_1 -UpdateId update_123 -Reason 'Incorrect update'"
    Write-Host "  .\automatic-status-updates-manager.ps1 -Action conflicts -ProjectId proj_123"
    Write-Host "  .\automatic-status-updates-manager.ps1 -Action resolve-conflicts -Conflicts conflict_1,conflict_2 -ResolutionStrategy auto"
    Write-Host "  .\automatic-status-updates-manager.ps1 -Action analytics -ProjectId proj_123 -GroupBy day"
    Write-Host "  .\automatic-status-updates-manager.ps1 -Action patterns -ProjectId proj_123 -TaskType development"
    Write-Host "  .\automatic-status-updates-manager.ps1 -Action predict -TaskId task_1 -CurrentStatus in_progress"
    Write-Host "  .\automatic-status-updates-manager.ps1 -Action rules -ProjectId proj_123"
    Write-Host "  .\automatic-status-updates-manager.ps1 -Action create-rule -RuleData rule.json"
    Write-Host "  .\automatic-status-updates-manager.ps1 -Action status"
    Write-Host "  .\automatic-status-updates-manager.ps1 -Action monitor"
    Write-Host "  .\automatic-status-updates-manager.ps1 -Action backup"
    Write-Host "  .\automatic-status-updates-manager.ps1 -Action restore -BackupPath backup.json"
    Write-Host "  .\automatic-status-updates-manager.ps1 -Action report"
}

# Main logic
switch ($Action) {
    "update" {
        if (-not $TaskId -or -not $NewStatus) {
            Write-Log "TaskId and NewStatus are required for updating status." -Level "ERROR"
            exit 1
        }
        Update-TaskStatus -TaskId $TaskId -NewStatus $NewStatus -Reason $Reason -ProjectId $ProjectId
    }
    "get" {
        if (-not $TaskId) {
            Write-Log "TaskId is required for getting status updates." -Level "ERROR"
            exit 1
        }
        Get-TaskStatusUpdates -TaskId $TaskId -IncludeHistory:$IncludeHistory -Limit $Limit
    }
    "bulk" {
        if (-not $InputFile) {
            Write-Log "InputFile is required for bulk updates." -Level "ERROR"
            exit 1
        }
        Invoke-BulkStatusUpdate -InputFile $InputFile -ProjectId $ProjectId
    }
    "auto" {
        if (-not $TaskIds) {
            Write-Log "TaskIds are required for auto updates." -Level "ERROR"
            exit 1
        }
        Invoke-AutoStatusUpdate -TaskIds $TaskIds -ProjectId $ProjectId
    }
    "history" {
        Get-StatusHistory -TaskId $TaskId -ProjectId $ProjectId -Status $Status -StartDate $StartDate -EndDate $EndDate -Limit $Limit -Offset $Offset
    }
    "rollback" {
        if (-not $TaskId -or -not $UpdateId) {
            Write-Log "TaskId and UpdateId are required for rollback." -Level "ERROR"
            exit 1
        }
        Invoke-StatusRollback -TaskId $TaskId -UpdateId $UpdateId -Reason $Reason
    }
    "conflicts" {
        Get-StatusConflicts -TaskId $TaskId -ProjectId $ProjectId
    }
    "resolve-conflicts" {
        if (-not $Conflicts) {
            Write-Log "Conflicts are required for resolution." -Level "ERROR"
            exit 1
        }
        Resolve-StatusConflicts -Conflicts $Conflicts -ResolutionStrategy $ResolutionStrategy
    }
    "analytics" {
        Get-StatusAnalytics -ProjectId $ProjectId -StartDate $StartDate -EndDate $EndDate -GroupBy $GroupBy
    }
    "patterns" {
        Get-StatusPatterns -ProjectId $ProjectId -TaskType $TaskType -TimeRange $TimeRange
    }
    "predict" {
        if (-not $TaskId -or -not $CurrentStatus) {
            Write-Log "TaskId and CurrentStatus are required for prediction." -Level "ERROR"
            exit 1
        }
        Predict-NextStatus -TaskId $TaskId -CurrentStatus $CurrentStatus -ProjectId $ProjectId
    }
    "rules" {
        Get-StatusRules -ProjectId $ProjectId -Status $Status
    }
    "create-rule" {
        New-StatusRule -RuleData $RuleData
    }
    "status" {
        Get-SystemStatus
    }
    "monitor" {
        Write-Log "Monitoring status update system..." -Level "INFO"
        # Add monitoring logic here
    }
    "backup" {
        Write-Log "Backing up status update configuration..." -Level "INFO"
        # Add backup logic here
    }
    "restore" {
        if (-not $BackupPath) {
            Write-Log "BackupPath is required for restore." -Level "ERROR"
            exit 1
        }
        Write-Log "Restoring status update configuration from $BackupPath..." -Level "INFO"
        # Add restore logic here
    }
    "validate" {
        Write-Log "Validating status update configuration..." -Level "INFO"
        # Add validation logic here
    }
    "report" {
        Write-Log "Generating status update report..." -Level "INFO"
        # Add report generation logic here
    }
    default {
        Show-Help
    }
}
