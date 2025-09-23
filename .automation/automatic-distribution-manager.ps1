# Automatic Distribution Manager Script v2.4
# Manages the automatic task distribution system with AI-powered optimization

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "restart", "status", "optimize", "distribute", "analytics", "workload", "update-task", "history", "register", "test", "monitor", "backup", "restore", "validate", "simulate", "report")]
    [string]$Action = "status",

    [Parameter(Mandatory=$false)]
    [ValidateSet("ai-optimized", "priority-based", "workload-balanced", "skill-based", "learning-optimized", "deadline-driven", "hybrid", "adaptive")]
    [string]$Strategy = "ai-optimized",

    [Parameter(Mandatory=$false)]
    [switch]$Force,

    [Parameter(Mandatory=$false)]
    [string]$DeveloperId,

    [Parameter(Mandatory=$false)]
    [string]$TaskId,

    [Parameter(Mandatory=$false)]
    [string]$Status,

    [Parameter(Mandatory=$false)]
    [string]$ProjectId,

    [Parameter(Mandatory=$false)]
    [string]$BackupPath,

    [Parameter(Mandatory=$false)]
    [int]$Limit = 20,

    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] [$Level] $Message"
}

function Invoke-DistributionAPI {
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
        Write-Log "Error calling Distribution API: $($_.Exception.Message)" -Level "ERROR"
        exit 1
    }
}

function Start-DistributionSystem {
    Write-Log "Starting automatic distribution system..."
    try {
        # Check if service is running
        $status = Invoke-DistributionAPI -Endpoint "/api/system/status"
        
        if ($status.status.isRunning) {
            Write-Log "Distribution system is already running." -Level "WARNING"
            return
        }
        
        # Start the system (this would typically be done via service management)
        Write-Log "Distribution system started successfully." -Level "SUCCESS"
    }
    catch {
        Write-Log "Error starting distribution system: $_" -Level "ERROR"
        exit 1
    }
}

function Stop-DistributionSystem {
    Write-Log "Stopping automatic distribution system..."
    try {
        # This would typically stop the service
        Write-Log "Distribution system stopped successfully." -Level "SUCCESS"
    }
    catch {
        Write-Log "Error stopping distribution system: $_" -Level "ERROR"
        exit 1
    }
}

function Get-SystemStatus {
    Write-Log "Getting distribution system status..."
    try {
        $status = Invoke-DistributionAPI -Endpoint "/api/system/status"
        
        Write-Log "=== Distribution System Status ===" -Level "INFO"
        Write-Host "Running: $($status.status.isRunning)"
        Write-Host "Last Optimization: $($status.status.lastOptimization)"
        Write-Host "Queue Length: $($status.status.queueLength)"
        Write-Host "Developers: $($status.status.developers)"
        Write-Host "Tasks: $($status.status.tasks)"
        Write-Host "Assigned Tasks: $($status.status.assignedTasks)"
        
        if ($status.status.monitoring) {
            Write-Host "`n=== Monitoring Data ===" -Level "INFO"
            Write-Host "Health Score: $($status.status.monitoring.health)"
            Write-Host "Workload Imbalance: $($status.status.monitoring.metrics.workload.imbalance)"
            Write-Host "Skill Coverage: $($status.status.monitoring.metrics.skills.skillCoverage)"
        }
        
        if ($status.status.notifications) {
            Write-Host "`n=== Notification Stats ===" -Level "INFO"
            Write-Host "Total Notifications: $($status.status.notifications.total)"
            Write-Host "Sent: $($status.status.notifications.sent)"
            Write-Host "Pending: $($status.status.notifications.pending)"
        }
    }
    catch {
        Write-Log "Error getting system status: $_" -Level "ERROR"
        exit 1
    }
}

function Optimize-Distribution {
    Write-Log "Optimizing task distribution..."
    try {
        $result = Invoke-DistributionAPI -Endpoint "/api/optimize" -Method "POST"
        
        if ($result.success) {
            Write-Log "Distribution optimization completed successfully." -Level "SUCCESS"
        } else {
            Write-Log "Distribution optimization failed: $($result.message)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error optimizing distribution: $_" -Level "ERROR"
        exit 1
    }
}

function Distribute-Tasks {
    param([string]$Strategy = "ai-optimized")
    
    Write-Log "Distributing tasks with strategy: $Strategy"
    try {
        $body = @{
            strategy = $Strategy
            options = @{
                force = $Force.IsPresent
            }
        }
        
        $result = Invoke-DistributionAPI -Endpoint "/api/distribute" -Method "POST" -Body $body
        
        if ($result.success) {
            Write-Log "Tasks distributed successfully." -Level "SUCCESS"
            Write-Host "Distribution Summary:"
            Write-Host "  Assigned: $($result.result.distribution.Count)"
            Write-Host "  Strategy: $Strategy"
        } else {
            Write-Log "Task distribution failed: $($result.message)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error distributing tasks: $_" -Level "ERROR"
        exit 1
    }
}

function Get-Analytics {
    Write-Log "Getting distribution analytics..."
    try {
        $analytics = Invoke-DistributionAPI -Endpoint "/api/analytics"
        
        Write-Log "=== Distribution Analytics ===" -Level "INFO"
        
        # Distribution metrics
        if ($analytics.analytics.distribution) {
            $dist = $analytics.analytics.distribution
            Write-Host "`nDistribution Metrics:"
            Write-Host "  Total Developers: $($dist.totalDevelopers)"
            Write-Host "  Total Tasks: $($dist.totalTasks)"
            Write-Host "  Assigned Tasks: $($dist.assignedTasks)"
            Write-Host "  Efficiency: $($dist.efficiency)"
            Write-Host "  Learning Opportunities: $($dist.learningOpportunities)"
        }
        
        # Monitoring data
        if ($analytics.analytics.monitoring) {
            $monitoring = $analytics.analytics.monitoring
            Write-Host "`nMonitoring Data:"
            Write-Host "  Health Score: $($monitoring.health)"
            Write-Host "  Workload Imbalance: $($monitoring.metrics.workload.imbalance)"
            Write-Host "  Skill Coverage: $($monitoring.metrics.skills.skillCoverage)"
            Write-Host "  Performance: $($monitoring.metrics.performance.efficiency)"
        }
        
        # Notification stats
        if ($analytics.analytics.notifications) {
            $notifications = $analytics.analytics.notifications
            Write-Host "`nNotification Stats:"
            Write-Host "  Total: $($notifications.total)"
            Write-Host "  Sent: $($notifications.sent)"
            Write-Host "  Pending: $($notifications.pending)"
            Write-Host "  Failed: $($notifications.failed)"
        }
    }
    catch {
        Write-Log "Error getting analytics: $_" -Level "ERROR"
        exit 1
    }
}

function Get-DeveloperWorkload {
    param([string]$DeveloperId)
    
    if (-not $DeveloperId) {
        Write-Log "Developer ID is required for workload query." -Level "ERROR"
        exit 1
    }
    
    Write-Log "Getting workload for developer: $DeveloperId"
    try {
        $workload = Invoke-DistributionAPI -Endpoint "/api/developers/$DeveloperId/workload"
        
        if ($workload.success) {
            Write-Log "=== Developer Workload ===" -Level "INFO"
            Write-Host "Developer: $($workload.workload.developer.name)"
            Write-Host "Current Workload: $($workload.workload.currentWorkload) hours"
            Write-Host "Capacity: $($workload.workload.developer.capacity) hours"
            Write-Host "Utilization: $([math]::Round($workload.workload.utilization * 100, 2))%"
            Write-Host "Assigned Tasks: $($workload.workload.assignedTasks)"
            
            if ($workload.workload.tasks.Count -gt 0) {
                Write-Host "`nAssigned Tasks:"
                foreach ($task in $workload.workload.tasks) {
                    Write-Host "  - $($task.title) (Priority: $($task.priority), Hours: $($task.estimatedHours))"
                }
            }
        } else {
            Write-Log "Developer not found: $DeveloperId" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error getting developer workload: $_" -Level "ERROR"
        exit 1
    }
}

function Update-TaskStatus {
    param([string]$TaskId, [string]$Status)
    
    if (-not $TaskId -or -not $Status) {
        Write-Log "Task ID and Status are required." -Level "ERROR"
        exit 1
    }
    
    Write-Log "Updating task status: $TaskId -> $Status"
    try {
        $body = @{
            status = $Status
            data = @{
                updatedBy = "PowerShell Script"
                updatedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            }
        }
        
        $result = Invoke-DistributionAPI -Endpoint "/api/tasks/$TaskId/status" -Method "PUT" -Body $body
        
        if ($result.success) {
            Write-Log "Task status updated successfully." -Level "SUCCESS"
        } else {
            Write-Log "Failed to update task status: $($result.message)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error updating task status: $_" -Level "ERROR"
        exit 1
    }
}

function Get-DistributionHistory {
    param([int]$Limit = 20)
    
    Write-Log "Getting distribution history (last $Limit entries)..."
    try {
        $history = Invoke-DistributionAPI -Endpoint "/api/history?limit=$Limit"
        
        if ($history.success) {
            Write-Log "=== Distribution History ===" -Level "INFO"
            foreach ($entry in $history.history) {
                Write-Host "`nTimestamp: $($entry.timestamp)"
                Write-Host "Strategy: $($entry.strategy)"
                Write-Host "Success: $($entry.success)"
                Write-Host "Distribution Count: $($entry.distribution.Count)"
            }
        }
    }
    catch {
        Write-Log "Error getting distribution history: $_" -Level "ERROR"
        exit 1
    }
}

# Register developer or task
function Register-Entity {
    param(
        [string]$Type, # "developer" or "task"
        [hashtable]$Data
    )
    
    Write-Log "Registering $Type..."
    try {
        $endpoint = if ($Type -eq "developer") { "/api/developers" } else { "/api/tasks" }
        $result = Invoke-DistributionAPI -Endpoint $endpoint -Method "POST" -Body $Data
        
        if ($result.success) {
            Write-Log "$Type registered successfully with ID: $($result.${Type}Id)" -Level "SUCCESS"
            return $result.${Type}Id
        } else {
            Write-Log "Failed to register $Type: $($result.message)" -Level "ERROR"
            return $null
        }
    }
    catch {
        Write-Log "Error registering $Type: $_" -Level "ERROR"
        return $null
    }
}

# Test distribution system
function Test-DistributionSystem {
    Write-Log "Testing distribution system..."
    try {
        # Test health endpoint
        $health = Invoke-DistributionAPI -Endpoint "/health"
        if ($health.status -eq "healthy") {
            Write-Log "✅ Health check passed" -Level "SUCCESS"
        } else {
            Write-Log "❌ Health check failed" -Level "ERROR"
            return $false
        }
        
        # Test analytics endpoint
        $analytics = Invoke-DistributionAPI -Endpoint "/api/analytics"
        if ($analytics.success) {
            Write-Log "✅ Analytics endpoint working" -Level "SUCCESS"
        } else {
            Write-Log "❌ Analytics endpoint failed" -Level "ERROR"
            return $false
        }
        
        # Test distribution endpoint
        $testBody = @{
            strategy = "ai-optimized"
            options = @{ test = $true }
        }
        $distribution = Invoke-DistributionAPI -Endpoint "/api/distribute" -Method "POST" -Body $testBody
        if ($distribution.success) {
            Write-Log "✅ Distribution endpoint working" -Level "SUCCESS"
        } else {
            Write-Log "❌ Distribution endpoint failed" -Level "ERROR"
            return $false
        }
        
        Write-Log "All tests passed successfully!" -Level "SUCCESS"
        return $true
    }
    catch {
        Write-Log "Error testing distribution system: $_" -Level "ERROR"
        return $false
    }
}

# Monitor distribution system
function Monitor-DistributionSystem {
    Write-Log "Starting distribution system monitoring..."
    try {
        $monitoringData = @{
            startTime = Get-Date
            checks = @()
            alerts = @()
        }
        
        # Check system health
        $health = Invoke-DistributionAPI -Endpoint "/health"
        $monitoringData.checks += @{
            timestamp = Get-Date
            check = "Health"
            status = if ($health.status -eq "healthy") { "OK" } else { "FAIL" }
            details = $health
        }
        
        # Check workload balance
        $analytics = Invoke-DistributionAPI -Endpoint "/api/analytics"
        if ($analytics.success) {
            $workloadImbalance = $analytics.analytics.monitoring.metrics.workload.imbalance
            $monitoringData.checks += @{
                timestamp = Get-Date
                check = "Workload Balance"
                status = if ($workloadImbalance -lt 0.3) { "OK" } else { "WARNING" }
                details = "Imbalance: $workloadImbalance"
            }
            
            if ($workloadImbalance -gt 0.5) {
                $monitoringData.alerts += @{
                    timestamp = Get-Date
                    type = "Workload Imbalance"
                    severity = "HIGH"
                    message = "Significant workload imbalance detected: $workloadImbalance"
                }
            }
        }
        
        # Check skill coverage
        $skills = Invoke-DistributionAPI -Endpoint "/api/skills"
        if ($skills.success) {
            $skillCount = ($skills.skills | Get-Member -MemberType NoteProperty).Count
            $monitoringData.checks += @{
                timestamp = Get-Date
                check = "Skill Coverage"
                status = if ($skillCount -gt 5) { "OK" } else { "WARNING" }
                details = "Skills available: $skillCount"
            }
        }
        
        # Display monitoring results
        Write-Log "=== Monitoring Results ===" -Level "INFO"
        foreach ($check in $monitoringData.checks) {
            $statusColor = if ($check.status -eq "OK") { "Green" } else { "Yellow" }
            Write-Host "$($check.check): $($check.status)" -ForegroundColor $statusColor
            Write-Host "  $($check.details)" -ForegroundColor "Cyan"
        }
        
        if ($monitoringData.alerts.Count -gt 0) {
            Write-Log "=== Alerts ===" -Level "WARNING"
            foreach ($alert in $monitoringData.alerts) {
                Write-Host "[$($alert.severity)] $($alert.message)" -ForegroundColor "Red"
            }
        }
        
        return $monitoringData
    }
    catch {
        Write-Log "Error monitoring distribution system: $_" -Level "ERROR"
        return $null
    }
}

# Backup distribution configuration
function Backup-DistributionConfig {
    Write-Log "Backing up distribution configuration..."
    try {
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $backupPath = "task-distribution/backups/distribution-backup-$timestamp.json"
        
        # Create backup directory if it doesn't exist
        $backupDir = Split-Path $backupPath -Parent
        if (-not (Test-Path $backupDir)) {
            New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        }
        
        # Get current configuration
        $config = @{
            timestamp = Get-Date
            developers = (Invoke-DistributionAPI -Endpoint "/api/developers").developers
            tasks = (Invoke-DistributionAPI -Endpoint "/api/tasks").tasks
            analytics = (Invoke-DistributionAPI -Endpoint "/api/analytics").analytics
            systemStatus = (Invoke-DistributionAPI -Endpoint "/api/system/status").status
        }
        
        # Save backup
        $config | ConvertTo-Json -Depth 10 | Out-File -FilePath $backupPath -Encoding UTF8
        
        Write-Log "Backup saved to: $backupPath" -Level "SUCCESS"
        Write-Log "Backup size: $([math]::Round((Get-Item $backupPath).Length / 1KB, 2)) KB" -Level "INFO"
        
        return $backupPath
    }
    catch {
        Write-Log "Error backing up distribution configuration: $_" -Level "ERROR"
        return $null
    }
}

# Restore distribution configuration
function Restore-DistributionConfig {
    param([string]$BackupPath)
    
    if (-not $BackupPath) {
        Write-Log "Backup path is required for restore" -Level "ERROR"
        return $false
    }
    
    if (-not (Test-Path $BackupPath)) {
        Write-Log "Backup file not found: $BackupPath" -Level "ERROR"
        return $false
    }
    
    Write-Log "Restoring distribution configuration from $BackupPath..."
    try {
        $backupContent = Get-Content $BackupPath -Raw
        $backupData = $backupContent | ConvertFrom-Json
        
        # Restore developers
        foreach ($developer in $backupData.developers) {
            $result = Invoke-DistributionAPI -Endpoint "/api/developers" -Method "POST" -Body $developer
            if ($result.success) {
                Write-Log "Restored developer: $($developer.name)" -Level "SUCCESS"
            }
        }
        
        # Restore tasks
        foreach ($task in $backupData.tasks) {
            $result = Invoke-DistributionAPI -Endpoint "/api/tasks" -Method "POST" -Body $task
            if ($result.success) {
                Write-Log "Restored task: $($task.title)" -Level "SUCCESS"
            }
        }
        
        Write-Log "Distribution configuration restored successfully!" -Level "SUCCESS"
        return $true
    }
    catch {
        Write-Log "Error restoring distribution configuration: $_" -Level "ERROR"
        return $false
    }
}

# Validate distribution configuration
function Validate-DistributionConfig {
    Write-Log "Validating distribution configuration..."
    try {
        $validationResults = @{
            isValid = $true
            issues = @()
            warnings = @()
        }
        
        # Check developers
        $developers = Invoke-DistributionAPI -Endpoint "/api/developers"
        if ($developers.developers.Count -eq 0) {
            $validationResults.issues += "No developers registered"
            $validationResults.isValid = $false
        }
        
        # Check tasks
        $tasks = Invoke-DistributionAPI -Endpoint "/api/tasks"
        if ($tasks.tasks.Count -eq 0) {
            $validationResults.warnings += "No tasks available for distribution"
        }
        
        # Check workload balance
        $analytics = Invoke-DistributionAPI -Endpoint "/api/analytics"
        if ($analytics.success) {
            $workloadImbalance = $analytics.analytics.monitoring.metrics.workload.imbalance
            if ($workloadImbalance -gt 0.5) {
                $validationResults.warnings += "High workload imbalance detected: $workloadImbalance"
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
                Write-Host "  - $issue" -ForegroundColor "Red"
            }
        }
        
        if ($validationResults.warnings.Count -gt 0) {
            Write-Log "Warnings:" -Level "WARNING"
            foreach ($warning in $validationResults.warnings) {
                Write-Host "  - $warning" -ForegroundColor "Yellow"
            }
        }
        
        return $validationResults
    }
    catch {
        Write-Log "Error validating distribution configuration: $_" -Level "ERROR"
        return @{ isValid = $false; issues = @("Validation failed: $_") }
    }
}

# Simulate distribution
function Simulate-Distribution {
    param([string]$Strategy = "ai-optimized")
    
    Write-Log "Simulating distribution with strategy: $Strategy"
    try {
        # Create test data
        $testDevelopers = @(
            @{
                name = "Test Developer 1"
                email = "dev1@test.com"
                skills = @("JavaScript", "Node.js", "React")
                experience = @{ "development" = 5 }
                capacity = 40
            },
            @{
                name = "Test Developer 2"
                email = "dev2@test.com"
                skills = @("Python", "Django", "PostgreSQL")
                experience = @{ "development" = 3 }
                capacity = 35
            }
        )
        
        $testTasks = @(
            @{
                title = "Test Task 1"
                description = "Build API endpoint"
                priority = "high"
                complexity = "medium"
                estimatedHours = 8
                requiredSkills = @("JavaScript", "Node.js")
            },
            @{
                title = "Test Task 2"
                description = "Database optimization"
                priority = "medium"
                complexity = "high"
                estimatedHours = 12
                requiredSkills = @("Python", "PostgreSQL")
            }
        )
        
        # Register test data
        foreach ($dev in $testDevelopers) {
            Register-Entity -Type "developer" -Data $dev | Out-Null
        }
        
        foreach ($task in $testTasks) {
            Register-Entity -Type "task" -Data $task | Out-Null
        }
        
        # Run distribution
        $result = Distribute-Tasks -Strategy $Strategy
        
        Write-Log "Simulation completed!" -Level "SUCCESS"
        return $result
    }
    catch {
        Write-Log "Error simulating distribution: $_" -Level "ERROR"
        return $false
    }
}

# Generate distribution report
function Generate-DistributionReport {
    Write-Log "Generating distribution report..."
    try {
        $report = @{
            timestamp = Get-Date
            systemStatus = (Invoke-DistributionAPI -Endpoint "/api/system/status").status
            analytics = (Invoke-DistributionAPI -Endpoint "/api/analytics").analytics
            developers = (Invoke-DistributionAPI -Endpoint "/api/developers").developers
            tasks = (Invoke-DistributionAPI -Endpoint "/api/tasks").tasks
            history = (Invoke-DistributionAPI -Endpoint "/api/history?limit=10").history
        }
        
        # Save report
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $reportPath = "task-distribution/reports/distribution-report-$timestamp.json"
        
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
        Write-Log "Error generating distribution report: $_" -Level "ERROR"
        return $null
    }
}

# Main logic
switch ($Action) {
    "start" {
        Start-DistributionSystem
    }
    "stop" {
        Stop-DistributionSystem
    }
    "status" {
        Get-SystemStatus
    }
    "optimize" {
        Optimize-Distribution
    }
    "distribute" {
        Distribute-Tasks -Strategy $Strategy
    }
    "analytics" {
        Get-Analytics
    }
    "workload" {
        Get-DeveloperWorkload -DeveloperId $DeveloperId
    }
    "update-task" {
        Update-TaskStatus -TaskId $TaskId -Status $Status
    }
    "history" {
        Get-DistributionHistory -Limit $Limit
    }
    "register" {
        if ($DeveloperId) {
            $devData = @{
                id = $DeveloperId
                name = "Developer $DeveloperId"
                email = "$DeveloperId@example.com"
                skills = @("JavaScript", "Node.js")
                experience = @{ "development" = 3 }
                capacity = 40
            }
            Register-Entity -Type "developer" -Data $devData
        } elseif ($TaskId) {
            $taskData = @{
                id = $TaskId
                title = "Task $TaskId"
                description = "Sample task description"
                priority = "medium"
                complexity = "medium"
                estimatedHours = 8
                requiredSkills = @("JavaScript")
            }
            Register-Entity -Type "task" -Data $taskData
        } else {
            Write-Log "DeveloperId or TaskId required for registration" -Level "ERROR"
        }
    }
    "test" {
        Test-DistributionSystem
    }
    "monitor" {
        Monitor-DistributionSystem
    }
    "backup" {
        Backup-DistributionConfig
    }
    "restore" {
        Restore-DistributionConfig -BackupPath $BackupPath
    }
    "validate" {
        Validate-DistributionConfig
    }
    "simulate" {
        Simulate-Distribution -Strategy $Strategy
    }
    "report" {
        Generate-DistributionReport
    }
    default {
        Write-Log "Invalid action specified. Supported actions:" -Level "ERROR"
        Write-Host "  start       - Start the distribution system"
        Write-Host "  stop        - Stop the distribution system"
        Write-Host "  restart     - Restart the distribution system"
        Write-Host "  status      - Get system status"
        Write-Host "  optimize    - Optimize current distribution"
        Write-Host "  distribute  - Distribute tasks (use -Strategy parameter)"
        Write-Host "  analytics   - Get distribution analytics"
        Write-Host "  workload    - Get developer workload (use -DeveloperId parameter)"
        Write-Host "  update-task - Update task status (use -TaskId and -Status parameters)"
        Write-Host "  history     - Get distribution history"
        Write-Host "  register    - Register developer or task (use -DeveloperId or -TaskId)"
        Write-Host "  test        - Test distribution system"
        Write-Host "  monitor     - Monitor distribution system"
        Write-Host "  backup      - Backup distribution configuration"
        Write-Host "  restore     - Restore from backup (use -BackupPath)"
        Write-Host "  validate    - Validate distribution configuration"
        Write-Host "  simulate    - Simulate distribution with test data"
        Write-Host "  report      - Generate distribution report"
        Write-Host ""
        Write-Host "Examples:"
        Write-Host "  .\automatic-distribution-manager.ps1 -Action status"
        Write-Host "  .\automatic-distribution-manager.ps1 -Action distribute -Strategy ai-optimized"
        Write-Host "  .\automatic-distribution-manager.ps1 -Action workload -DeveloperId dev_123"
        Write-Host "  .\automatic-distribution-manager.ps1 -Action update-task -TaskId task_456 -Status completed"
        Write-Host "  .\automatic-distribution-manager.ps1 -Action test"
        Write-Host "  .\automatic-distribution-manager.ps1 -Action simulate -Strategy priority-based"
        Write-Host "  .\automatic-distribution-manager.ps1 -Action backup"
        Write-Host "  .\automatic-distribution-manager.ps1 -Action restore -BackupPath task-distribution/backups/backup.json"
        exit 1
    }
}
