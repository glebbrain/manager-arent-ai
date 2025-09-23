# Sprint Planning Manager Script v2.4
# Manages the AI-powered automatic sprint planning system

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("plan", "optimize", "simulate", "status", "analytics", "velocity", "capacity", "templates", "monitor", "backup", "restore", "validate", "report", "train", "evaluate", "optimize-models")]
    [string]$Action = "status",
    
    [Parameter(Mandatory=$false)]
    [string]$ProjectId,
    
    [Parameter(Mandatory=$false)]
    [string]$TeamId,
    
    [Parameter(Mandatory=$false)]
    [int]$SprintNumber,
    
    [Parameter(Mandatory=$false)]
    [string]$StartDate,
    
    [Parameter(Mandatory=$false)]
    [string]$EndDate,
    
    [Parameter(Mandatory=$false)]
    [string]$Goals,
    
    [Parameter(Mandatory=$false)]
    [string]$InputFile,
    
    [Parameter(Mandatory=$false)]
    [string]$BackupPath,
    
    [Parameter(Mandatory=$false)]
    [string]$TemplateId,
    
    [Parameter(Mandatory=$false)]
    [int]$SprintCount = 1,
    
    [Parameter(Mandatory=$false)]
    [string]$SimulationType = "monte_carlo",
    
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

function Invoke-SprintPlanningAPI {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        $Body = $null
    )
    $uri = "http://localhost:3011$Endpoint"
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
        Write-Log "Error calling Sprint Planning API: $($_.Exception.Message)" -Level "ERROR"
        exit 1
    }
}

function Plan-Sprint {
    param(
        [string]$ProjectId,
        [string]$TeamId,
        [int]$SprintNumber,
        [string]$StartDate,
        [string]$EndDate,
        [string]$Goals
    )
    
    Write-Log "Planning sprint for project: $ProjectId, team: $TeamId"
    
    $goalsList = @()
    if ($Goals) {
        $goalsList = $Goals -split "," | ForEach-Object { $_.Trim() }
    }
    
    $body = @{
        projectId = $ProjectId
        teamId = $TeamId
        sprintNumber = $SprintNumber
        startDate = $StartDate
        endDate = $EndDate
        goals = $goalsList
        constraints = @{}
        options = @{
            aiOptimization = $true
            includeCeremonies = $true
            riskAssessment = $true
        }
    }
    
    try {
        $result = Invoke-SprintPlanningAPI -Endpoint "/api/plan-sprint" -Method "POST" -Body $body
        
        if ($result.success) {
            Write-Log "Sprint planned successfully!" -Level "SUCCESS"
            Write-Host "`n=== Sprint Plan Details ===" -ForegroundColor $Cyan
            Write-Host "Sprint ID: $($result.sprintPlan.id)"
            Write-Host "Project: $($result.sprintPlan.projectId)"
            Write-Host "Team: $($result.sprintPlan.teamId)"
            Write-Host "Sprint Number: $($result.sprintPlan.sprintNumber)"
            Write-Host "Duration: $($result.sprintPlan.duration) days"
            Write-Host "Capacity: $($result.sprintPlan.capacity.bufferedCapacity) hours"
            Write-Host "Velocity: $($result.sprintPlan.velocity.estimated) story points"
            Write-Host "Tasks: $($result.sprintPlan.tasks.Count)"
            Write-Host "Confidence: $([math]::Round($result.sprintPlan.confidence * 100, 2))%"
            Write-Host "AI Optimized: $($result.sprintPlan.metadata.aiOptimized)"
            
            if ($result.sprintPlan.aiInsights) {
                Write-Host "`n=== AI Insights ===" -ForegroundColor $Cyan
                foreach ($insight in $result.sprintPlan.aiInsights) {
                    $severityColor = if ($insight.severity -eq "high") { $Red } else { $Yellow }
                    Write-Host "[$($insight.severity.ToUpper())] $($insight.message)" -ForegroundColor $severityColor
                    Write-Host "  Recommendation: $($insight.recommendation)" -ForegroundColor $Cyan
                }
            }
        } else {
            Write-Log "Failed to plan sprint: $($result.error)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error planning sprint: $_" -Level "ERROR"
    }
}

function Optimize-Sprint {
    param(
        [string]$SprintPlanId,
        [string]$OptimizationType = "comprehensive"
    )
    
    Write-Log "Optimizing sprint plan: $SprintPlanId"
    
    $body = @{
        sprintPlanId = $SprintPlanId
        optimizationType = $OptimizationType
    }
    
    try {
        $result = Invoke-SprintPlanningAPI -Endpoint "/api/optimize-sprint" -Method "POST" -Body $body
        
        if ($result.success) {
            Write-Log "Sprint optimized successfully!" -Level "SUCCESS"
            Write-Host "`n=== Optimization Results ===" -ForegroundColor $Cyan
            Write-Host "Optimization Type: $($result.optimizedPlan.metadata.optimizationType)"
            Write-Host "Improvement: $([math]::Round($result.optimizedPlan.metadata.improvement * 100, 2))%"
            Write-Host "AI Optimized: $($result.optimizedPlan.metadata.aiOptimized)"
            Write-Host "Optimization Score: $([math]::Round($result.optimizedPlan.metadata.optimizationScore * 100, 2))%"
        } else {
            Write-Log "Failed to optimize sprint: $($result.error)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error optimizing sprint: $_" -Level "ERROR"
    }
}

function Simulate-Sprints {
    param(
        [string]$ProjectId,
        [string]$TeamId,
        [int]$SprintCount,
        [string]$SimulationType
    )
    
    Write-Log "Simulating $SprintCount sprints for project: $ProjectId, team: $TeamId"
    
    $body = @{
        projectId = $ProjectId
        teamId = $TeamId
        sprintCount = $SprintCount
        simulationType = $SimulationType
        options = @{
            includeRisks = $true
            includeDependencies = $true
            monteCarloIterations = 1000
        }
    }
    
    try {
        $result = Invoke-SprintPlanningAPI -Endpoint "/api/simulate" -Method "POST" -Body $body
        
        if ($result.success) {
            Write-Log "Simulation completed successfully!" -Level "SUCCESS"
            Write-Host "`n=== Simulation Results ===" -ForegroundColor $Cyan
            Write-Host "Total Sprints: $($result.simulation.summary.totalSprints)"
            Write-Host "Average Velocity: $([math]::Round($result.simulation.summary.averageVelocity, 2))"
            Write-Host "Average Capacity: $([math]::Round($result.simulation.summary.averageCapacity, 2))"
            Write-Host "Success Probability: $([math]::Round($result.simulation.summary.successProbability * 100, 2))%"
            
            if ($result.simulation.summary.riskFactors) {
                Write-Host "`n=== Risk Factors ===" -ForegroundColor $Cyan
                foreach ($risk in $result.simulation.summary.riskFactors) {
                    Write-Host "- $risk" -ForegroundColor $Yellow
                }
            }
        } else {
            Write-Log "Failed to simulate sprints: $($result.error)" -Level "ERROR"
        }
    }
    catch {
        Write-Log "Error simulating sprints: $_" -Level "ERROR"
    }
}

function Get-SystemStatus {
    Write-Log "Getting sprint planning system status..."
    try {
        $status = Invoke-SprintPlanningAPI -Endpoint "/api/system/status"
        
        if ($status.success) {
            Write-Log "=== System Status ===" -Level "INFO"
            Write-Host "Running: $($status.status.isRunning)" -ForegroundColor $(if ($status.status.isRunning) { $Green } else { $Red })
            Write-Host "Last Update: $($status.status.lastUpdate)"
            Write-Host "Active Sprints: $($status.status.activeSprints)"
            Write-Host "Planned Sprints: $($status.status.plannedSprints)"
            Write-Host "Uptime: $($status.status.uptime) seconds"
        }
    }
    catch {
        Write-Log "Error getting system status: $_" -Level "ERROR"
    }
}

function Get-Analytics {
    Write-Log "Getting sprint planning analytics..."
    try {
        $analytics = Invoke-SprintPlanningAPI -Endpoint "/api/analytics"
        
        if ($analytics.success) {
            Write-Log "=== Sprint Planning Analytics ===" -Level "INFO"
            
            # Overall metrics
            Write-Host "`n=== Overall Metrics ===" -ForegroundColor $Cyan
            Write-Host "Total Sprints: $($analytics.analytics.totalSprints)"
            Write-Host "Recent Sprints (30d): $($analytics.analytics.recentSprints)"
            Write-Host "Active Sprints: $($analytics.analytics.activeSprints)"
            Write-Host "Completed Sprints: $($analytics.analytics.completedSprints)"
            Write-Host "Planned Sprints: $($analytics.analytics.plannedSprints)"
            Write-Host "Average Velocity: $([math]::Round($analytics.analytics.averageVelocity, 2))"
            Write-Host "Average Capacity: $([math]::Round($analytics.analytics.averageCapacity, 2))"
            Write-Host "Success Rate: $([math]::Round($analytics.analytics.successRate * 100, 2))%"
            Write-Host "Planning Accuracy: $([math]::Round($analytics.analytics.planningAccuracy * 100, 2))%"
            
            # AI Optimization metrics
            if ($analytics.analytics.aiOptimization) {
                Write-Host "`n=== AI Optimization ===" -ForegroundColor $Cyan
                Write-Host "Enabled: $($analytics.analytics.aiOptimization.enabled)"
                Write-Host "Optimized Sprints: $($analytics.analytics.aiOptimization.optimizedSprints)"
                Write-Host "Average Improvement: $([math]::Round($analytics.analytics.aiOptimization.averageImprovement * 100, 2))%"
            }
            
            # Team Performance
            if ($analytics.analytics.teamPerformance) {
                Write-Host "`n=== Team Performance ===" -ForegroundColor $Cyan
                foreach ($team in $analytics.analytics.teamPerformance.PSObject.Properties) {
                    Write-Host "Team $($team.Name):"
                    Write-Host "  Completion Rate: $([math]::Round($team.Value.completionRate * 100, 2))%"
                    Write-Host "  Average Velocity: $([math]::Round($team.Value.averageVelocity, 2))"
                    Write-Host "  Average Capacity: $([math]::Round($team.Value.averageCapacity, 2))"
                    Write-Host "  Efficiency: $([math]::Round($team.Value.efficiency * 100, 2))%"
                }
            }
        }
    }
    catch {
        Write-Log "Error getting analytics: $_" -Level "ERROR"
    }
}

function Get-Velocity {
    param(
        [string]$TeamId,
        [string]$ProjectId,
        [int]$SprintCount = 5
    )
    
    Write-Log "Getting velocity for team: $TeamId, project: $ProjectId"
    try {
        $queryParams = "?teamId=$TeamId&projectId=$ProjectId&sprintCount=$SprintCount"
        $velocity = Invoke-SprintPlanningAPI -Endpoint "/api/velocity$queryParams"
        
        if ($velocity.success) {
            Write-Log "=== Velocity Analysis ===" -Level "INFO"
            Write-Host "Team: $($velocity.velocity.teamId)"
            Write-Host "Project: $($velocity.velocity.projectId)"
            Write-Host "Average Velocity: $([math]::Round($velocity.velocity.average, 2))"
            Write-Host "Median Velocity: $([math]::Round($velocity.velocity.median, 2))"
            Write-Host "Trend Velocity: $([math]::Round($velocity.velocity.trend, 2))"
            Write-Host "Weighted Velocity: $([math]::Round($velocity.velocity.weighted, 2))"
            Write-Host "Predicted Velocity: $([math]::Round($velocity.velocity.predicted, 2))"
            Write-Host "Confidence: $([math]::Round($velocity.velocity.confidence * 100, 2))%"
            Write-Host "Data Points: $($velocity.velocity.dataPoints)"
            Write-Host "Outliers: $($velocity.velocity.outliers)"
            Write-Host "Trend Direction: $($velocity.velocity.trendDirection)"
            Write-Host "Stability: $([math]::Round($velocity.velocity.stability * 100, 2))%"
            
            if ($velocity.velocity.recommendations) {
                Write-Host "`n=== Recommendations ===" -ForegroundColor $Cyan
                foreach ($rec in $velocity.velocity.recommendations) {
                    $priorityColor = if ($rec.priority -eq "high") { $Red } else { $Yellow }
                    Write-Host "[$($rec.priority.ToUpper())] $($rec.message)" -ForegroundColor $priorityColor
                    Write-Host "  Suggestion: $($rec.suggestion)" -ForegroundColor $Cyan
                }
            }
        }
    }
    catch {
        Write-Log "Error getting velocity: $_" -Level "ERROR"
    }
}

function Get-Capacity {
    param(
        [string]$TeamId,
        [string]$StartDate,
        [string]$EndDate
    )
    
    Write-Log "Getting capacity for team: $TeamId"
    try {
        $queryParams = "?teamId=$TeamId&startDate=$StartDate&endDate=$EndDate"
        $capacity = Invoke-SprintPlanningAPI -Endpoint "/api/capacity$queryParams"
        
        if ($capacity.success) {
            Write-Log "=== Capacity Analysis ===" -Level "INFO"
            Write-Host "Team: $($capacity.capacity.teamId)"
            Write-Host "Sprint Duration: $($capacity.capacity.sprintDuration) days"
            Write-Host "Working Days: $($capacity.capacity.workingDays)"
            Write-Host "Total Capacity: $([math]::Round($capacity.capacity.totalCapacity, 2)) hours"
            Write-Host "Buffered Capacity: $([math]::Round($capacity.capacity.bufferedCapacity, 2)) hours"
            Write-Host "Capacity Utilization: $([math]::Round($capacity.capacity.capacityUtilization.effectiveUtilization * 100, 2))%"
            Write-Host "Team Members: $($capacity.capacity.teamMembers.Count)"
            
            Write-Host "`n=== Team Members ===" -ForegroundColor $Cyan
            foreach ($member in $capacity.capacity.teamMembers) {
                Write-Host "$($member.name) ($($member.role)):"
                Write-Host "  Final Capacity: $([math]::Round($member.finalCapacity, 2)) hours"
                Write-Host "  Availability: $([math]::Round($member.availability * 100, 2))%"
                Write-Host "  Efficiency: $([math]::Round($member.efficiency * 100, 2))%"
                Write-Host "  Part-time: $($member.partTime)"
            }
            
            if ($capacity.capacity.capacityRisks) {
                Write-Host "`n=== Capacity Risks ===" -ForegroundColor $Cyan
                foreach ($risk in $capacity.capacity.capacityRisks) {
                    $severityColor = if ($risk.severity -eq "high") { $Red } else { $Yellow }
                    Write-Host "[$($risk.severity.ToUpper())] $($risk.message)" -ForegroundColor $severityColor
                    Write-Host "  Impact: $($risk.impact)" -ForegroundColor $Cyan
                    Write-Host "  Mitigation: $($risk.mitigation)" -ForegroundColor $Cyan
                }
            }
            
            if ($capacity.capacity.recommendations) {
                Write-Host "`n=== Recommendations ===" -ForegroundColor $Cyan
                foreach ($rec in $capacity.capacity.recommendations) {
                    $priorityColor = if ($rec.priority -eq "high") { $Red } else { $Yellow }
                    Write-Host "[$($rec.priority.ToUpper())] $($rec.message)" -ForegroundColor $priorityColor
                    Write-Host "  Action: $($rec.action)" -ForegroundColor $Cyan
                }
            }
        }
    }
    catch {
        Write-Log "Error getting capacity: $_" -Level "ERROR"
    }
}

function Get-Templates {
    Write-Log "Getting sprint planning templates..."
    try {
        $templates = Invoke-SprintPlanningAPI -Endpoint "/api/templates"
        
        if ($templates.success) {
            Write-Log "=== Sprint Planning Templates ===" -Level "INFO"
            foreach ($template in $templates.templates) {
                Write-Host "`n$($template.name) ($($template.id))" -ForegroundColor $Cyan
                Write-Host "  Duration: $($template.duration) days"
                Write-Host "  Working Days/Week: $($template.workingDaysPerWeek)"
                Write-Host "  Working Hours/Day: $($template.workingHoursPerDay)"
                Write-Host "  Capacity Buffer: $([math]::Round($template.capacityBuffer * 100, 2))%"
                Write-Host "  Goals: $($template.goals -join ', ')"
                Write-Host "  Ceremonies: $($template.ceremonies.Count)"
            }
        }
    }
    catch {
        Write-Log "Error getting templates: $_" -Level "ERROR"
    }
}

function Create-Template {
    param([string]$InputFile)
    
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
        
        $result = Invoke-SprintPlanningAPI -Endpoint "/api/templates" -Method "POST" -Body $body
        
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

function Monitor-SprintPlanningSystem {
    Write-Log "Starting sprint planning system monitoring..."
    try {
        $monitoringData = @{
            startTime = Get-Date
            checks = @()
            alerts = @()
        }
        
        # Check system health
        $health = Invoke-SprintPlanningAPI -Endpoint "/health"
        $monitoringData.checks += @{
            timestamp = Get-Date
            check = "Health"
            status = if ($health.status -eq "healthy") { "OK" } else { "FAIL" }
            details = $health
        }
        
        # Check system status
        $status = Invoke-SprintPlanningAPI -Endpoint "/api/system/status"
        if ($status.success) {
            $monitoringData.checks += @{
                timestamp = Get-Date
                check = "System Status"
                status = if ($status.status.isRunning) { "OK" } else { "WARNING" }
                details = "Running: $($status.status.isRunning), Active: $($status.status.activeSprints)"
            }
        }
        
        # Check analytics
        $analytics = Invoke-SprintPlanningAPI -Endpoint "/api/analytics"
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
                    message = "Sprint success rate is low: $([math]::Round($successRate * 100, 2))%"
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
        Write-Log "Error monitoring sprint planning system: $_" -Level "ERROR"
        return $null
    }
}

function Backup-SprintPlanningConfig {
    Write-Log "Backing up sprint planning configuration..."
    try {
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $backupPath = "sprint-planning/backups/sprint-planning-backup-$timestamp.json"
        
        # Create backup directory if it doesn't exist
        $backupDir = Split-Path $backupPath -Parent
        if (-not (Test-Path $backupDir)) {
            New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        }
        
        # Get current configuration
        $config = @{
            timestamp = Get-Date
            analytics = (Invoke-SprintPlanningAPI -Endpoint "/api/analytics").analytics
            systemStatus = (Invoke-SprintPlanningAPI -Endpoint "/api/system/status").status
            templates = (Invoke-SprintPlanningAPI -Endpoint "/api/templates").templates
        }
        
        # Save backup
        $config | ConvertTo-Json -Depth 10 | Out-File -FilePath $backupPath -Encoding UTF8
        
        Write-Log "Backup saved to: $backupPath" -Level "SUCCESS"
        Write-Log "Backup size: $([math]::Round((Get-Item $backupPath).Length / 1KB, 2)) KB" -Level "INFO"
        
        return $backupPath
    }
    catch {
        Write-Log "Error backing up sprint planning configuration: $_" -Level "ERROR"
        return $null
    }
}

function Restore-SprintPlanningConfig {
    param([string]$BackupPath)
    
    if (-not $BackupPath) {
        Write-Log "Backup path is required for restore" -Level "ERROR"
        return $false
    }
    
    if (-not (Test-Path $BackupPath)) {
        Write-Log "Backup file not found: $BackupPath" -Level "ERROR"
        return $false
    }
    
    Write-Log "Restoring sprint planning configuration from $BackupPath..."
    try {
        $backupContent = Get-Content $BackupPath -Raw
        $backupData = $backupContent | ConvertFrom-Json
        
        # Restore templates if available
        if ($backupData.templates) {
            foreach ($template in $backupData.templates) {
                $body = @{ template = $template }
                Invoke-SprintPlanningAPI -Endpoint "/api/templates" -Method "POST" -Body $body | Out-Null
            }
            Write-Log "Restored templates" -Level "SUCCESS"
        }
        
        Write-Log "Sprint planning configuration restored successfully!" -Level "SUCCESS"
        return $true
    }
    catch {
        Write-Log "Error restoring sprint planning configuration: $_" -Level "ERROR"
        return $false
    }
}

function Validate-SprintPlanningConfig {
    Write-Log "Validating sprint planning configuration..."
    try {
        $validationResults = @{
            isValid = $true
            issues = @()
            warnings = @()
        }
        
        # Check system health
        $health = Invoke-SprintPlanningAPI -Endpoint "/health"
        if ($health.status -ne "healthy") {
            $validationResults.issues += "System is not healthy"
            $validationResults.isValid = $false
        }
        
        # Check success rate
        $analytics = Invoke-SprintPlanningAPI -Endpoint "/api/analytics"
        if ($analytics.success) {
            $successRate = $analytics.analytics.successRate
            if ($successRate -lt 0.5) {
                $validationResults.warnings += "Low success rate: $([math]::Round($successRate * 100, 2))%"
            }
        }
        
        # Check templates
        $templates = Invoke-SprintPlanningAPI -Endpoint "/api/templates"
        if ($templates.success) {
            if ($templates.templates.Count -eq 0) {
                $validationResults.warnings += "No sprint planning templates available"
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
        Write-Log "Error validating sprint planning configuration: $_" -Level "ERROR"
        return @{ isValid = $false; issues = @("Validation failed: $_") }
    }
}

function Generate-SprintPlanningReport {
    Write-Log "Generating sprint planning report..."
    try {
        $report = @{
            timestamp = Get-Date
            systemStatus = (Invoke-SprintPlanningAPI -Endpoint "/api/system/status").status
            analytics = (Invoke-SprintPlanningAPI -Endpoint "/api/analytics").analytics
            templates = (Invoke-SprintPlanningAPI -Endpoint "/api/templates").templates
        }
        
        # Save report
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $reportPath = "sprint-planning/reports/sprint-planning-report-$timestamp.json"
        
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
        Write-Log "Error generating sprint planning report: $_" -Level "ERROR"
        return $null
    }
}

function Show-Help {
    Write-Log "Sprint Planning Manager v2.4 - Available Commands:" -Level "INFO"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  plan              - Plan a new sprint"
    Write-Host "  optimize          - Optimize existing sprint plan"
    Write-Host "  simulate          - Simulate multiple sprints"
    Write-Host "  status            - Show system status"
    Write-Host "  analytics         - Show sprint planning analytics"
    Write-Host "  velocity          - Show team velocity analysis"
    Write-Host "  capacity          - Show team capacity analysis"
    Write-Host "  templates         - Show sprint planning templates"
    Write-Host "  monitor           - Monitor sprint planning system"
    Write-Host "  backup            - Backup sprint planning configuration"
    Write-Host "  restore           - Restore from backup"
    Write-Host "  validate          - Validate sprint planning configuration"
    Write-Host "  report            - Generate sprint planning report"
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "  -ProjectId        - Project ID for sprint planning"
    Write-Host "  -TeamId           - Team ID for sprint planning"
    Write-Host "  -SprintNumber     - Sprint number"
    Write-Host "  -StartDate        - Sprint start date (YYYY-MM-DD)"
    Write-Host "  -EndDate          - Sprint end date (YYYY-MM-DD)"
    Write-Host "  -Goals            - Comma-separated sprint goals"
    Write-Host "  -InputFile        - JSON file with input data"
    Write-Host "  -BackupPath       - Path to backup file for restore"
    Write-Host "  -TemplateId       - Template ID for operations"
    Write-Host "  -SprintCount      - Number of sprints for simulation"
    Write-Host "  -SimulationType   - Type of simulation (monte_carlo, deterministic)"
    Write-Host "  -Limit            - Limit for results (default: 50)"
    Write-Host "  -Force            - Force operation"
    Write-Host "  -Verbose          - Enable verbose logging"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\sprint-planning-manager.ps1 -Action plan -ProjectId proj_123 -TeamId team_456 -SprintNumber 1 -StartDate 2024-01-01 -EndDate 2024-01-14"
    Write-Host "  .\sprint-planning-manager.ps1 -Action optimize -SprintPlanId sprint_123 -OptimizationType comprehensive"
    Write-Host "  .\sprint-planning-manager.ps1 -Action simulate -ProjectId proj_123 -TeamId team_456 -SprintCount 5"
    Write-Host "  .\sprint-planning-manager.ps1 -Action analytics"
    Write-Host "  .\sprint-planning-manager.ps1 -Action velocity -TeamId team_456 -ProjectId proj_123"
    Write-Host "  .\sprint-planning-manager.ps1 -Action capacity -TeamId team_456 -StartDate 2024-01-01 -EndDate 2024-01-14"
    Write-Host "  .\sprint-planning-manager.ps1 -Action monitor"
    Write-Host "  .\sprint-planning-manager.ps1 -Action backup"
    Write-Host "  .\sprint-planning-manager.ps1 -Action restore -BackupPath sprint-planning/backups/backup.json"
    Write-Host "  .\sprint-planning-manager.ps1 -Action report"
}

# Main logic
switch ($Action) {
    "plan" {
        if (-not $ProjectId -or -not $TeamId -or -not $StartDate -or -not $EndDate) {
            Write-Log "ProjectId, TeamId, StartDate, and EndDate are required for planning." -Level "ERROR"
            exit 1
        }
        Plan-Sprint -ProjectId $ProjectId -TeamId $TeamId -SprintNumber $SprintNumber -StartDate $StartDate -EndDate $EndDate -Goals $Goals
    }
    "optimize" {
        if (-not $SprintPlanId) {
            Write-Log "SprintPlanId is required for optimization." -Level "ERROR"
            exit 1
        }
        Optimize-Sprint -SprintPlanId $SprintPlanId
    }
    "simulate" {
        if (-not $ProjectId -or -not $TeamId) {
            Write-Log "ProjectId and TeamId are required for simulation." -Level "ERROR"
            exit 1
        }
        Simulate-Sprints -ProjectId $ProjectId -TeamId $TeamId -SprintCount $SprintCount -SimulationType $SimulationType
    }
    "status" {
        Get-SystemStatus
    }
    "analytics" {
        Get-Analytics
    }
    "velocity" {
        if (-not $TeamId) {
            Write-Log "TeamId is required for velocity analysis." -Level "ERROR"
            exit 1
        }
        Get-Velocity -TeamId $TeamId -ProjectId $ProjectId -SprintCount 5
    }
    "capacity" {
        if (-not $TeamId -or -not $StartDate -or -not $EndDate) {
            Write-Log "TeamId, StartDate, and EndDate are required for capacity analysis." -Level "ERROR"
            exit 1
        }
        Get-Capacity -TeamId $TeamId -StartDate $StartDate -EndDate $EndDate
    }
    "templates" {
        Get-Templates
    }
    "monitor" {
        Monitor-SprintPlanningSystem
    }
    "backup" {
        Backup-SprintPlanningConfig
    }
    "restore" {
        Restore-SprintPlanningConfig -BackupPath $BackupPath
    }
    "validate" {
        Validate-SprintPlanningConfig
    }
    "report" {
        Generate-SprintPlanningReport
    }
    default {
        Show-Help
    }
}
