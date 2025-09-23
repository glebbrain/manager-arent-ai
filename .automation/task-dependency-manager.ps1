# Task Dependency Management Script v2.4
# Manages automatic task dependency management system

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("add", "get", "update", "remove", "analyze", "optimize", "conflicts", "circular", "impact", "critical-path", "visualization", "status", "analytics", "monitor", "backup", "restore", "validate", "report")]
    [string]$Action = "status",
    
    [Parameter(Mandatory=$false)]
    [string]$TaskId,
    
    [Parameter(Mandatory=$false)]
    [string]$Dependencies,
    
    [Parameter(Mandatory=$false)]
    [string]$ProjectId,
    
    [Parameter(Mandatory=$false)]
    [string]$InputFile,
    
    [Parameter(Mandatory=$false)]
    [string]$BackupPath,
    
    [Parameter(Mandatory=$false)]
    [string]$AnalysisType = "comprehensive",
    
    [Parameter(Mandatory=$false)]
    [string]$OptimizationType = "comprehensive",
    
    [Parameter(Mandatory=$false)]
    [string]$ChangeType,
    
    [Parameter(Mandatory=$false)]
    [string]$Format = "json",
    
    [Parameter(Mandatory=$false)]
    [switch]$IncludeTransitive,
    
    [Parameter(Mandatory=$false)]
    [switch]$IncludeConflicts,
    
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

function Invoke-DependencyAPI {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        $Body = $null
    )
    $uri = "http://localhost:3012$Endpoint"
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
        Write-Log "Error calling Dependency Management API: $($_.Exception.Message)" -Level "ERROR"
        exit 1
    }
}

function Add-Dependencies {
    param(
        [string]$TaskId,
        [string]$Dependencies,
        [string]$ProjectId
    )
    
    Write-Log "Adding dependencies for task: $TaskId"
    
    $dependenciesList = @()
    if ($Dependencies) {
        $dependenciesList = $Dependencies -split "," | ForEach-Object { 
            @{
                taskId = $_.Trim()
                type = "depends_on"
                strength = 1
            }
        }
    }
    
    $body = @{
        taskId = $TaskId
        dependencies = $dependenciesList
        projectId = $ProjectId
        options = @{
            autoResolveConflicts = $true
            detectCircularDependencies = $true
        }
    }
    
    try {
        $result = Invoke-DependencyAPI -Endpoint "/api/dependencies" -Method "POST" -Body $body
        
        if ($result.success) {
            Write-Log "Dependencies added successfully!" -Level "SUCCESS"
            Write-Host "`n=== Dependency Details ===" -ForegroundColor $Cyan
            Write-Host "Task ID: $($result.result.taskId)"
            Write-Host "Total Dependencies: $($result.result.totalDependencies)"
            Write-Host "New Dependencies: $($result.result.newDependencies.Count)"
            
            if ($result.result.conflicts.Count -gt 0) {
                Write-Host "`n=== Conflicts Detected ===" -ForegroundColor $Yellow
                foreach ($conflict in $result.result.conflicts) {
                    Write-Host "[$($conflict.severity.ToUpper())] $($conflict.description)" -ForegroundColor $Yellow
                }
            }
            
            if ($result.result.circularDependencies.Count -gt 0) {
                Write-Host "`n=== Circular Dependencies ===" -ForegroundColor $Red
                foreach ($circular in $result.result.circularDependencies) {
                    Write-Host "Cycle: $($circular.cycle -join ' -> ')" -ForegroundColor $Red
                }
            }
        } else {
            Write-Log "Failed to add dependencies: $($result.error)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error adding dependencies: $_" -Level "ERROR"
    }
}

function Get-Dependencies {
    param(
        [string]$TaskId,
        [switch]$IncludeTransitive,
        [switch]$IncludeConflicts
    )
    
    Write-Log "Getting dependencies for task: $TaskId"
    
    $queryParams = "?includeTransitive=$($IncludeTransitive.IsPresent)&includeConflicts=$($IncludeConflicts.IsPresent)"
    $result = Invoke-DependencyAPI -Endpoint "/api/dependencies/$TaskId$queryParams"
    
    if ($result.success) {
        Write-Log "=== Dependencies ===" -Level "INFO"
        Write-Host "Task ID: $TaskId" -ForegroundColor $Cyan
        Write-Host "Total Dependencies: $($result.dependencies.Count)"
        
        foreach ($dep in $result.dependencies) {
            Write-Host "`n- $($dep.taskId)" -ForegroundColor $White
            Write-Host "  Type: $($dep.type)" -ForegroundColor $Cyan
            Write-Host "  Strength: $($dep.strength)" -ForegroundColor $Cyan
            Write-Host "  Created: $($dep.createdAt)" -ForegroundColor $Cyan
            
            if ($dep.conflicts) {
                Write-Host "  Conflicts: $($dep.conflicts.Count)" -ForegroundColor $Yellow
            }
        }
    }
}

function Update-Dependencies {
    param(
        [string]$TaskId,
        [string]$Dependencies
    )
    
    Write-Log "Updating dependencies for task: $TaskId"
    
    $dependenciesList = @()
    if ($Dependencies) {
        $dependenciesList = $Dependencies -split "," | ForEach-Object { 
            @{
                taskId = $_.Trim()
                type = "depends_on"
                strength = 1
            }
        }
    }
    
    $body = @{
        dependencies = $dependenciesList
        options = @{
            autoResolveConflicts = $true
            detectCircularDependencies = $true
        }
    }
    
    try {
        $result = Invoke-DependencyAPI -Endpoint "/api/dependencies/$TaskId" -Method "PUT" -Body $body
        
        if ($result.success) {
            Write-Log "Dependencies updated successfully!" -Level "SUCCESS"
            Write-Host "`n=== Update Results ===" -ForegroundColor $Cyan
            Write-Host "Task ID: $($result.result.taskId)"
            Write-Host "Total Dependencies: $($result.result.totalDependencies)"
            Write-Host "Changes: $($result.changes.added.Count) added, $($result.changes.removed.Count) removed, $($result.changes.modified.Count) modified"
        } else {
            Write-Log "Failed to update dependencies: $($result.error)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error updating dependencies: $_" -Level "ERROR"
    }
}

function Remove-Dependencies {
    param(
        [string]$TaskId,
        [string]$DependencyIds
    )
    
    Write-Log "Removing dependencies for task: $TaskId"
    
    $dependencyIdsList = @()
    if ($DependencyIds) {
        $dependencyIdsList = $DependencyIds -split "," | ForEach-Object { $_.Trim() }
    }
    
    $body = @{
        dependencyIds = $dependencyIdsList
    }
    
    try {
        $result = Invoke-DependencyAPI -Endpoint "/api/dependencies/$TaskId" -Method "DELETE" -Body $body
        
        if ($result.success) {
            Write-Log "Dependencies removed successfully!" -Level "SUCCESS"
            Write-Host "`n=== Removal Results ===" -ForegroundColor $Cyan
            Write-Host "Task ID: $($result.result.taskId)"
            Write-Host "Removed Dependencies: $($result.result.removedDependencies.Count)"
            Write-Host "Remaining Dependencies: $($result.result.remainingDependencies.Count)"
        } else {
            Write-Log "Failed to remove dependencies: $($result.error)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error removing dependencies: $_" -Level "ERROR"
    }
}

function Analyze-Dependencies {
    param(
        [string]$TaskIds,
        [string]$ProjectId,
        [string]$AnalysisType
    )
    
    Write-Log "Analyzing dependencies for tasks: $TaskIds"
    
    $taskIdsList = $TaskIds -split "," | ForEach-Object { $_.Trim() }
    
    $body = @{
        taskIds = $taskIdsList
        projectId = $ProjectId
        analysisType = $AnalysisType
    }
    
    try {
        $result = Invoke-DependencyAPI -Endpoint "/api/dependencies/analyze" -Method "POST" -Body $body
        
        if ($result.success) {
            Write-Log "Dependency analysis completed!" -Level "SUCCESS"
            Write-Host "`n=== Analysis Results ===" -ForegroundColor $Cyan
            Write-Host "Analysis Type: $($result.analysis.analysisType)"
            Write-Host "Total Tasks: $($result.analysis.taskIds.Count)"
            Write-Host "Conflicts: $($result.analysis.conflicts.Count)"
            Write-Host "Circular Dependencies: $($result.analysis.circularDependencies.Count)"
            Write-Host "Critical Paths: $($result.analysis.criticalPaths.Count)"
            
            if ($result.analysis.recommendations.Count -gt 0) {
                Write-Host "`n=== Recommendations ===" -ForegroundColor $Cyan
                foreach ($rec in $result.analysis.recommendations) {
                    $priorityColor = if ($rec.priority -eq "high") { $Red } else { $Yellow }
                    Write-Host "[$($rec.priority.ToUpper())] $($rec.message)" -ForegroundColor $priorityColor
                    Write-Host "  Action: $($rec.action)" -ForegroundColor $Cyan
                }
            }
        } else {
            Write-Log "Failed to analyze dependencies: $($result.error)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error analyzing dependencies: $_" -Level "ERROR"
    }
}

function Optimize-Dependencies {
    param(
        [string]$TaskIds,
        [string]$ProjectId,
        [string]$OptimizationType
    )
    
    Write-Log "Optimizing dependencies for tasks: $TaskIds"
    
    $taskIdsList = $TaskIds -split "," | ForEach-Object { $_.Trim() }
    
    $body = @{
        taskIds = $taskIdsList
        projectId = $ProjectId
        optimizationType = $OptimizationType
    }
    
    try {
        $result = Invoke-DependencyAPI -Endpoint "/api/dependencies/optimize" -Method "POST" -Body $body
        
        if ($result.success) {
            Write-Log "Dependency optimization completed!" -Level "SUCCESS"
            Write-Host "`n=== Optimization Results ===" -ForegroundColor $Cyan
            Write-Host "Optimization Type: $($result.optimization.optimizationType)"
            Write-Host "Total Tasks: $($result.optimization.taskIds.Count)"
            Write-Host "Improvements: $($result.optimization.improvements.Count)"
            Write-Host "Remaining Conflicts: $($result.optimization.conflicts.Count)"
            Write-Host "Remaining Circular Dependencies: $($result.optimization.circularDependencies.Count)"
        } else {
            Write-Log "Failed to optimize dependencies: $($result.error)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error optimizing dependencies: $_" -Level "ERROR"
    }
}

function Get-Conflicts {
    param(
        [string]$TaskIds,
        [string]$ProjectId
    )
    
    Write-Log "Detecting conflicts for tasks: $TaskIds"
    
    $taskIdsList = $TaskIds -split "," | ForEach-Object { $_.Trim() }
    
    $body = @{
        taskIds = $taskIdsList
        projectId = $ProjectId
    }
    
    try {
        $result = Invoke-DependencyAPI -Endpoint "/api/dependencies/conflicts" -Method "POST" -Body $body
        
        if ($result.success) {
            Write-Log "=== Conflict Detection Results ===" -Level "INFO"
            Write-Host "Total Conflicts: $($result.conflicts.Count)"
            
            foreach ($conflict in $result.conflicts) {
                $severityColor = if ($conflict.severity -eq "high") { $Red } else { $Yellow }
                Write-Host "`n[$($conflict.severity.ToUpper())] $($conflict.type)" -ForegroundColor $severityColor
                Write-Host "Description: $($conflict.description)" -ForegroundColor $Cyan
                Write-Host "Tasks: $($conflict.taskIds -join ', ')" -ForegroundColor $Cyan
                Write-Host "Created: $($conflict.createdAt)" -ForegroundColor $Cyan
            }
        } else {
            Write-Log "Failed to detect conflicts: $($result.error)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error detecting conflicts: $_" -Level "ERROR"
    }
}

function Get-CircularDependencies {
    param(
        [string]$TaskIds,
        [string]$ProjectId
    )
    
    Write-Log "Detecting circular dependencies for tasks: $TaskIds"
    
    $taskIdsList = $TaskIds -split "," | ForEach-Object { $_.Trim() }
    
    $body = @{
        taskIds = $taskIdsList
        projectId = $ProjectId
    }
    
    try {
        $result = Invoke-DependencyAPI -Endpoint "/api/dependencies/circular" -Method "POST" -Body $body
        
        if ($result.success) {
            Write-Log "=== Circular Dependency Detection Results ===" -Level "INFO"
            Write-Host "Total Circular Dependencies: $($result.circularDependencies.Count)"
            
            foreach ($circular in $result.circularDependencies) {
                Write-Host "`nCycle: $($circular.cycle -join ' -> ')" -ForegroundColor $Red
                Write-Host "Severity: $($circular.severity)" -ForegroundColor $Red
                Write-Host "Type: $($circular.type)" -ForegroundColor $Cyan
            }
        } else {
            Write-Log "Failed to detect circular dependencies: $($result.error)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error detecting circular dependencies: $_" -Level "ERROR"
    }
}

function Get-ImpactAnalysis {
    param(
        [string]$TaskId,
        [string]$ChangeType
    )
    
    Write-Log "Analyzing impact for task: $TaskId, change: $ChangeType"
    
    $body = @{
        taskId = $TaskId
        changeType = $ChangeType
    }
    
    try {
        $result = Invoke-DependencyAPI -Endpoint "/api/dependencies/impact" -Method "POST" -Body $body
        
        if ($result.success) {
            Write-Log "=== Impact Analysis Results ===" -Level "INFO"
            Write-Host "Task ID: $($result.impact.taskId)" -ForegroundColor $Cyan
            Write-Host "Change Type: $($result.impact.changeType)" -ForegroundColor $Cyan
            Write-Host "Impact Level: $($result.impact.impactLevel)" -ForegroundColor $(if ($result.impact.impactLevel -eq "critical") { $Red } else { $Yellow })
            Write-Host "Affected Tasks: $($result.impact.affectedTasks.Count)" -ForegroundColor $Cyan
            Write-Host "Estimated Delay: $($result.impact.estimatedDelay) hours" -ForegroundColor $Cyan
            
            if ($result.impact.riskFactors.Count -gt 0) {
                Write-Host "`n=== Risk Factors ===" -ForegroundColor $Cyan
                foreach ($risk in $result.impact.riskFactors) {
                    $severityColor = if ($risk.severity -eq "high" -or $risk.severity -eq "critical") { $Red } else { $Yellow }
                    Write-Host "[$($risk.severity.ToUpper())] $($risk.description)" -ForegroundColor $severityColor
                }
            }
            
            if ($result.impact.recommendations.Count -gt 0) {
                Write-Host "`n=== Recommendations ===" -ForegroundColor $Cyan
                foreach ($rec in $result.impact.recommendations) {
                    $priorityColor = if ($rec.priority -eq "high") { $Red } else { $Yellow }
                    Write-Host "[$($rec.priority.ToUpper())] $($rec.message)" -ForegroundColor $priorityColor
                    Write-Host "  Action: $($rec.action)" -ForegroundColor $Cyan
                }
            }
        } else {
            Write-Log "Failed to analyze impact: $($result.error)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error analyzing impact: $_" -Level "ERROR"
    }
}

function Get-CriticalPath {
    param(
        [string]$ProjectId,
        [string]$TaskIds
    )
    
    Write-Log "Getting critical path for project: $ProjectId"
    
    $queryParams = "?projectId=$ProjectId"
    if ($TaskIds) {
        $queryParams += "&taskIds=$TaskIds"
    }
    
    try {
        $result = Invoke-DependencyAPI -Endpoint "/api/critical-path$queryParams"
        
        if ($result.success) {
            Write-Log "=== Critical Path Analysis ===" -Level "INFO"
            Write-Host "Critical Path: $($result.criticalPath -join ' -> ')" -ForegroundColor $Cyan
            Write-Host "Path Length: $($result.criticalPath.Count) tasks" -ForegroundColor $Cyan
        } else {
            Write-Log "Failed to get critical path: $($result.error)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error getting critical path: $_" -Level "ERROR"
    }
}

function Get-Visualization {
    param(
        [string]$ProjectId,
        [string]$TaskIds,
        [string]$Format
    )
    
    Write-Log "Generating dependency visualization"
    
    $queryParams = "?projectId=$ProjectId&format=$Format"
    if ($TaskIds) {
        $queryParams += "&taskIds=$TaskIds"
    }
    
    try {
        $result = Invoke-DependencyAPI -Endpoint "/api/dependencies/visualization$queryParams"
        
        if ($result.success) {
            Write-Log "=== Dependency Visualization ===" -Level "INFO"
            Write-Host "Format: $($result.visualization.format)" -ForegroundColor $Cyan
            Write-Host "Total Tasks: $($result.visualization.nodes.Count)" -ForegroundColor $Cyan
            Write-Host "Total Dependencies: $($result.visualization.dependencies.Count)" -ForegroundColor $Cyan
            Write-Host "Generated: $($result.visualization.metadata.generatedAt)" -ForegroundColor $Cyan
        } else {
            Write-Log "Failed to generate visualization: $($result.error)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error generating visualization: $_" -Level "ERROR"
    }
}

function Get-SystemStatus {
    Write-Log "Getting dependency management system status..."
    try {
        $status = Invoke-DependencyAPI -Endpoint "/api/system/status"
        
        if ($status.success) {
            Write-Log "=== System Status ===" -Level "INFO"
            Write-Host "Running: $($status.status.isRunning)" -ForegroundColor $(if ($status.status.isRunning) { $Green } else { $Red })
            Write-Host "Last Update: $($status.status.lastUpdate)"
            Write-Host "Total Dependencies: $($status.status.totalDependencies)"
            Write-Host "Active Tasks: $($status.status.activeTasks)"
            Write-Host "Critical Paths: $($status.status.criticalPaths)"
            Write-Host "Conflicts: $($status.status.conflicts)"
            Write-Host "Uptime: $($status.status.uptime) seconds"
        }
    }
    catch {
        Write-Log "Error getting system status: $_" -Level "ERROR"
    }
}

function Get-Analytics {
    Write-Log "Getting dependency management analytics..."
    try {
        $analytics = Invoke-DependencyAPI -Endpoint "/api/analytics"
        
        if ($analytics.success) {
            Write-Log "=== Dependency Management Analytics ===" -Level "INFO"
            Write-Host "Total Dependencies: $($analytics.analytics.totalDependencies)" -ForegroundColor $Cyan
            Write-Host "Active Tasks: $($analytics.analytics.activeTasks)" -ForegroundColor $Cyan
            Write-Host "Critical Paths: $($analytics.analytics.criticalPaths)" -ForegroundColor $Cyan
            Write-Host "Conflicts: $($analytics.analytics.conflicts)" -ForegroundColor $Cyan
            Write-Host "Dependency Complexity: $([math]::Round($analytics.analytics.dependencyComplexity, 2))" -ForegroundColor $Cyan
            Write-Host "Conflict Rate: $([math]::Round($analytics.analytics.conflictRate * 100, 2))%" -ForegroundColor $Cyan
            Write-Host "Circular Dependency Rate: $([math]::Round($analytics.analytics.circularDependencyRate * 100, 2))%" -ForegroundColor $Cyan
            Write-Host "Average Critical Path Length: $([math]::Round($analytics.analytics.criticalPathLength, 2))" -ForegroundColor $Cyan
            
            if ($analytics.analytics.recommendations.Count -gt 0) {
                Write-Host "`n=== Recommendations ===" -ForegroundColor $Cyan
                foreach ($rec in $analytics.analytics.recommendations) {
                    Write-Host "- $($rec.message)" -ForegroundColor $Yellow
                }
            }
        }
    }
    catch {
        Write-Log "Error getting analytics: $_" -Level "ERROR"
    }
}

function Show-Help {
    Write-Log "Task Dependency Management v2.4 - Available Commands:" -Level "INFO"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  add              - Add dependencies for a task"
    Write-Host "  get              - Get dependencies for a task"
    Write-Host "  update           - Update dependencies for a task"
    Write-Host "  remove           - Remove dependencies for a task"
    Write-Host "  analyze          - Analyze dependencies for multiple tasks"
    Write-Host "  optimize         - Optimize dependencies for multiple tasks"
    Write-Host "  conflicts        - Detect conflicts in dependencies"
    Write-Host "  circular         - Detect circular dependencies"
    Write-Host "  impact           - Analyze impact of changes"
    Write-Host "  critical-path    - Get critical path analysis"
    Write-Host "  visualization    - Generate dependency visualization"
    Write-Host "  status           - Show system status"
    Write-Host "  analytics        - Show dependency analytics"
    Write-Host "  monitor          - Monitor dependency system"
    Write-Host "  backup           - Backup dependency configuration"
    Write-Host "  restore          - Restore from backup"
    Write-Host "  validate         - Validate dependency configuration"
    Write-Host "  report           - Generate dependency report"
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "  -TaskId          - Task ID for dependency operations"
    Write-Host "  -Dependencies    - Comma-separated list of dependency task IDs"
    Write-Host "  -ProjectId       - Project ID for operations"
    Write-Host "  -InputFile       - JSON file with input data"
    Write-Host "  -BackupPath      - Path to backup file for restore"
    Write-Host "  -AnalysisType    - Type of analysis (comprehensive, conflicts, circular)"
    Write-Host "  -OptimizationType - Type of optimization (comprehensive, conflicts, circular)"
    Write-Host "  -ChangeType      - Type of change for impact analysis"
    Write-Host "  -Format          - Output format (json, csv, xml)"
    Write-Host "  -IncludeTransitive - Include transitive dependencies"
    Write-Host "  -IncludeConflicts - Include conflict information"
    Write-Host "  -Force           - Force operation"
    Write-Host "  -Verbose         - Enable verbose logging"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\task-dependency-manager.ps1 -Action add -TaskId task_1 -Dependencies task_2,task_3 -ProjectId proj_123"
    Write-Host "  .\task-dependency-manager.ps1 -Action get -TaskId task_1 -IncludeTransitive"
    Write-Host "  .\task-dependency-manager.ps1 -Action analyze -TaskIds task_1,task_2,task_3 -ProjectId proj_123"
    Write-Host "  .\task-dependency-manager.ps1 -Action conflicts -TaskIds task_1,task_2,task_3"
    Write-Host "  .\task-dependency-manager.ps1 -Action impact -TaskId task_1 -ChangeType dependency_update"
    Write-Host "  .\task-dependency-manager.ps1 -Action critical-path -ProjectId proj_123"
    Write-Host "  .\task-dependency-manager.ps1 -Action visualization -ProjectId proj_123 -Format json"
    Write-Host "  .\task-dependency-manager.ps1 -Action analytics"
    Write-Host "  .\task-dependency-manager.ps1 -Action monitor"
    Write-Host "  .\task-dependency-manager.ps1 -Action backup"
    Write-Host "  .\task-dependency-manager.ps1 -Action restore -BackupPath backup.json"
    Write-Host "  .\task-dependency-manager.ps1 -Action report"
}

# Main logic
switch ($Action) {
    "add" {
        if (-not $TaskId -or -not $Dependencies) {
            Write-Log "TaskId and Dependencies are required for adding dependencies." -Level "ERROR"
            exit 1
        }
        Add-Dependencies -TaskId $TaskId -Dependencies $Dependencies -ProjectId $ProjectId
    }
    "get" {
        if (-not $TaskId) {
            Write-Log "TaskId is required for getting dependencies." -Level "ERROR"
            exit 1
        }
        Get-Dependencies -TaskId $TaskId -IncludeTransitive:$IncludeTransitive -IncludeConflicts:$IncludeConflicts
    }
    "update" {
        if (-not $TaskId) {
            Write-Log "TaskId is required for updating dependencies." -Level "ERROR"
            exit 1
        }
        Update-Dependencies -TaskId $TaskId -Dependencies $Dependencies
    }
    "remove" {
        if (-not $TaskId) {
            Write-Log "TaskId is required for removing dependencies." -Level "ERROR"
            exit 1
        }
        Remove-Dependencies -TaskId $TaskId -DependencyIds $Dependencies
    }
    "analyze" {
        if (-not $TaskIds) {
            Write-Log "TaskIds are required for analysis." -Level "ERROR"
            exit 1
        }
        Analyze-Dependencies -TaskIds $TaskIds -ProjectId $ProjectId -AnalysisType $AnalysisType
    }
    "optimize" {
        if (-not $TaskIds) {
            Write-Log "TaskIds are required for optimization." -Level "ERROR"
            exit 1
        }
        Optimize-Dependencies -TaskIds $TaskIds -ProjectId $ProjectId -OptimizationType $OptimizationType
    }
    "conflicts" {
        if (-not $TaskIds) {
            Write-Log "TaskIds are required for conflict detection." -Level "ERROR"
            exit 1
        }
        Get-Conflicts -TaskIds $TaskIds -ProjectId $ProjectId
    }
    "circular" {
        if (-not $TaskIds) {
            Write-Log "TaskIds are required for circular dependency detection." -Level "ERROR"
            exit 1
        }
        Get-CircularDependencies -TaskIds $TaskIds -ProjectId $ProjectId
    }
    "impact" {
        if (-not $TaskId -or -not $ChangeType) {
            Write-Log "TaskId and ChangeType are required for impact analysis." -Level "ERROR"
            exit 1
        }
        Get-ImpactAnalysis -TaskId $TaskId -ChangeType $ChangeType
    }
    "critical-path" {
        Get-CriticalPath -ProjectId $ProjectId -TaskIds $TaskIds
    }
    "visualization" {
        Get-Visualization -ProjectId $ProjectId -TaskIds $TaskIds -Format $Format
    }
    "status" {
        Get-SystemStatus
    }
    "analytics" {
        Get-Analytics
    }
    "monitor" {
        Write-Log "Monitoring dependency management system..." -Level "INFO"
        # Add monitoring logic here
    }
    "backup" {
        Write-Log "Backing up dependency management configuration..." -Level "INFO"
        # Add backup logic here
    }
    "restore" {
        if (-not $BackupPath) {
            Write-Log "BackupPath is required for restore." -Level "ERROR"
            exit 1
        }
        Write-Log "Restoring dependency management configuration from $BackupPath..." -Level "INFO"
        # Add restore logic here
    }
    "validate" {
        Write-Log "Validating dependency management configuration..." -Level "INFO"
        # Add validation logic here
    }
    "report" {
        Write-Log "Generating dependency management report..." -Level "INFO"
        # Add report generation logic here
    }
    default {
        Show-Help
    }
}
