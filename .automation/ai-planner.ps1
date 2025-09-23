# ManagerAgentAI AI Planner - PowerShell Version
# AI planning of tasks based on priorities

param(
    [Parameter(Position=0)]
    [string]$Command,
    
    [Parameter(Position=1)]
    [string]$Data,
    
    [Parameter(Position=2)]
    [string]$Format,
    
    [Parameter(Position=3)]
    [string]$Updates,
    
    [switch]$Help
)

$TasksPath = Join-Path $PSScriptRoot ".." "tasks"
$PlansPath = Join-Path $PSScriptRoot ".." "plans"

function Show-Help {
    Write-Host @"
🤖 ManagerAgentAI AI Planner

Usage:
  .\ai-planner.ps1 <command> [options]

Commands:
  create-task <data>           Create a new task
  create-plan <data>           Create a new project plan
  prioritize <criteria>        Prioritize tasks based on criteria
  recommend <project>          Generate recommendations for project
  export <plan-id> [format]    Export plan in specified format
  list [type]                  List tasks or plans
  update <id> <updates>        Update task or plan

Examples:
  .\ai-planner.ps1 create-task '{"title":"Setup environment","priority":"high"}'
  .\ai-planner.ps1 create-plan '{"name":"My Project","type":"web"}'
  .\ai-planner.ps1 prioritize '{"category":"development"}'
  .\ai-planner.ps1 recommend '{"type":"web","complexity":"medium"}'
  .\ai-planner.ps1 export plan123 markdown
  .\ai-planner.ps1 list tasks
"@
}

function Ensure-Directories {
    $dirs = @($TasksPath, $PlansPath)
    $dirs | ForEach-Object {
        if (-not (Test-Path $_)) {
            New-Item -ItemType Directory -Path $_ -Force | Out-Null
        }
    }
}

function Get-Priorities {
    return @{
        critical = @{ weight = 10; color = 'red'; description = 'Critical - Must be done immediately' }
        high = @{ weight = 8; color = 'orange'; description = 'High - Should be done soon' }
        medium = @{ weight = 5; color = 'yellow'; description = 'Medium - Important but not urgent' }
        low = @{ weight = 2; color = 'green'; description = 'Low - Nice to have' }
        optional = @{ weight = 1; color = 'gray'; description = 'Optional - Can be done later' }
    }
}

function Get-Dependencies {
    return @{
        'setup-environment' = @('install-dependencies', 'configure-tools')
        'run-tests' = @('setup-environment', 'write-tests')
        'deploy' = @('run-tests', 'build-application')
        'documentation' = @('implement-features', 'write-tests')
        'code-review' = @('implement-features', 'write-tests')
        'performance-optimization' = @('implement-features', 'run-tests')
        'security-audit' = @('implement-features', 'run-tests')
        'user-testing' = @('implement-features', 'deploy')
        'monitoring-setup' = @('deploy', 'performance-optimization')
        'backup-strategy' = @('deploy', 'monitoring-setup')
    }
}

function New-Task {
    param([object]$TaskData)
    
    $task = @{
        id = New-Guid
        title = $TaskData.title
        description = $TaskData.description ?? ''
        priority = $TaskData.priority ?? 'medium'
        category = $TaskData.category ?? 'general'
        estimatedHours = $TaskData.estimatedHours ?? 1
        complexity = $TaskData.complexity ?? 'medium'
        dependencies = $TaskData.dependencies ?? @()
        tags = $TaskData.tags ?? @()
        assignee = $TaskData.assignee ?? $null
        status = 'pending'
        createdAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        updatedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        dueDate = $TaskData.dueDate ?? $null
        actualHours = 0
        progress = 0
        notes = @()
    }
    
    Save-Task -Task $task
    return $task
}

function Update-Task {
    param(
        [string]$TaskId,
        [object]$Updates
    )
    
    $task = Get-Task -TaskId $TaskId
    if (-not $task) {
        throw "Task $TaskId not found"
    }
    
    $updatedTask = $task.PSObject.Copy()
    $Updates.PSObject.Properties | ForEach-Object {
        $updatedTask[$_.Name] = $_.Value
    }
    $updatedTask.updatedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    
    Save-Task -Task $updatedTask
    return $updatedTask
}

function Get-Task {
    param([string]$TaskId)
    
    $taskFile = Join-Path $TasksPath "$TaskId.json"
    if (Test-Path $taskFile) {
        return Get-Content $taskFile | ConvertFrom-Json
    }
    return $null
}

function Get-AllTasks {
    $tasks = @()
    $files = Get-ChildItem $TasksPath -Filter "*.json"
    
    $files | ForEach-Object {
        $task = Get-Content $_.FullName | ConvertFrom-Json
        $tasks += $task
    }
    
    return $tasks
}

function Save-Task {
    param([object]$Task)
    
    $taskFile = Join-Path $TasksPath "$($Task.id).json"
    $Task | ConvertTo-Json -Depth 10 | Set-Content $taskFile
}

function Remove-Task {
    param([string]$TaskId)
    
    $taskFile = Join-Path $TasksPath "$TaskId.json"
    if (Test-Path $taskFile) {
        Remove-Item $taskFile
        return $true
    }
    return $false
}

function New-ProjectPlan {
    param(
        [object]$ProjectData,
        [hashtable]$Options = @{}
    )
    
    $plan = @{
        id = New-Guid
        projectName = $ProjectData.name
        projectType = $ProjectData.type
        description = $ProjectData.description ?? ''
        createdAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        updatedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        status = 'draft'
        phases = @()
        timeline = @{
            startDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            endDate = $null
            totalDuration = 0
        }
        resources = @{
            team = $ProjectData.team ?? @()
            budget = $ProjectData.budget ?? 0
            tools = $ProjectData.tools ?? @()
        }
        risks = @()
        assumptions = @()
    }
    
    # Generate phases based on project type
    $plan.phases = Get-ProjectPhases -ProjectData $ProjectData -Options $Options
    
    # Calculate timeline
    $plan.timeline = Get-ProjectTimeline -Phases $plan.phases
    
    # Identify risks
    $plan.risks = Get-ProjectRisks -ProjectData $ProjectData -Plan $plan
    
    # Generate assumptions
    $plan.assumptions = Get-ProjectAssumptions -ProjectData $ProjectData -Plan $plan
    
    Save-Plan -Plan $plan
    return $plan
}

function Get-ProjectPhases {
    param(
        [object]$ProjectData,
        [hashtable]$Options
    )
    
    $phases = @()
    $projectType = $ProjectData.type ?? 'web'
    
    # Common phases for all project types
    $commonPhases = @(
        @{
            name = 'Planning & Setup'
            description = 'Project planning, environment setup, and initial configuration'
            tasks = @('project-analysis', 'requirements-gathering', 'architecture-design', 'environment-setup', 'tool-configuration')
            duration = 3
            priority = 'high'
        },
        @{
            name = 'Development'
            description = 'Core development and implementation'
            tasks = @('core-implementation', 'feature-development', 'integration', 'testing')
            duration = 14
            priority = 'high'
        },
        @{
            name = 'Testing & Quality'
            description = 'Comprehensive testing and quality assurance'
            tasks = @('unit-testing', 'integration-testing', 'user-testing', 'performance-testing', 'security-testing')
            duration = 7
            priority = 'high'
        },
        @{
            name = 'Deployment & Launch'
            description = 'Deployment, launch, and initial monitoring'
            tasks = @('deployment-preparation', 'production-deployment', 'monitoring-setup', 'launch-verification')
            duration = 3
            priority = 'critical'
        }
    )
    
    # Add type-specific phases
    $typeSpecificPhases = Get-TypeSpecificPhases -ProjectType $projectType
    
    $phases += $commonPhases
    $phases += $typeSpecificPhases
    
    # Add optional phases based on options
    if ($Options.includeDocumentation) {
        $phases += @{
            name = 'Documentation'
            description = 'Create comprehensive documentation'
            tasks = @('api-documentation', 'user-guide', 'technical-docs')
            duration = 2
            priority = 'medium'
        }
    }
    
    if ($Options.includeMaintenance) {
        $phases += @{
            name = 'Maintenance & Support'
            description = 'Ongoing maintenance and support'
            tasks = @('bug-fixes', 'feature-updates', 'performance-optimization')
            duration = 30
            priority = 'low'
        }
    }
    
    return $phases
}

function Get-TypeSpecificPhases {
    param([string]$ProjectType)
    
    $typePhases = @{
        'web' = @(
            @{
                name = 'Frontend Development'
                description = 'User interface and user experience development'
                tasks = @('ui-design', 'frontend-implementation', 'responsive-design')
                duration = 10
                priority = 'high'
            },
            @{
                name = 'Backend Development'
                description = 'Server-side logic and API development'
                tasks = @('api-development', 'database-design', 'authentication')
                duration = 8
                priority = 'high'
            }
        )
        'mobile' = @(
            @{
                name = 'Mobile Development'
                description = 'Native or cross-platform mobile app development'
                tasks = @('mobile-ui', 'platform-integration', 'device-testing')
                duration = 12
                priority = 'high'
            },
            @{
                name = 'App Store Preparation'
                description = 'Prepare app for app store submission'
                tasks = @('app-store-optimization', 'screenshots', 'metadata')
                duration = 2
                priority = 'medium'
            }
        )
        'ai-ml' = @(
            @{
                name = 'Data Preparation'
                description = 'Data collection, cleaning, and preprocessing'
                tasks = @('data-collection', 'data-cleaning', 'feature-engineering')
                duration = 7
                priority = 'high'
            },
            @{
                name = 'Model Development'
                description = 'Machine learning model development and training'
                tasks = @('model-design', 'training', 'validation', 'optimization')
                duration = 10
                priority = 'high'
            },
            @{
                name = 'Model Deployment'
                description = 'Deploy model to production environment'
                tasks = @('model-serving', 'api-integration', 'monitoring')
                duration = 5
                priority = 'high'
            }
        )
        'api' = @(
            @{
                name = 'API Development'
                description = 'RESTful API development and documentation'
                tasks = @('endpoint-development', 'authentication', 'rate-limiting')
                duration = 8
                priority = 'high'
            },
            @{
                name = 'API Testing'
                description = 'Comprehensive API testing and validation'
                tasks = @('unit-tests', 'integration-tests', 'load-tests')
                duration = 4
                priority = 'high'
            }
        )
        'library' = @(
            @{
                name = 'Core Development'
                description = 'Core library functionality development'
                tasks = @('core-implementation', 'api-design', 'type-definitions')
                duration = 6
                priority = 'high'
            },
            @{
                name = 'Package Preparation'
                description = 'Prepare package for distribution'
                tasks = @('build-configuration', 'documentation', 'examples')
                duration = 3
                priority = 'medium'
            }
        )
    }
    
    return $typePhases[$ProjectType] ?? @()
}

function Get-ProjectTimeline {
    param([array]$Phases)
    
    $startDate = Get-Date
    $currentDate = Get-Date
    $timeline = @{
        startDate = $startDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        endDate = $null
        totalDuration = 0
        phases = @()
    }
    
    $Phases | ForEach-Object {
        $phaseStart = $currentDate
        $phaseEnd = $currentDate.AddDays($_.duration)
        
        $timeline.phases += @{
            name = $_.name
            startDate = $phaseStart.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            endDate = $phaseEnd.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            duration = $_.duration
        }
        
        $currentDate = $phaseEnd
        $timeline.totalDuration += $_.duration
    }
    
    $timeline.endDate = $currentDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    return $timeline
}

function Get-ProjectRisks {
    param(
        [object]$ProjectData,
        [object]$Plan
    )
    
    $risks = @()
    
    # Technical risks
    if ($ProjectData.complexity -eq 'high') {
        $risks += @{
            type = 'technical'
            severity = 'high'
            description = 'High complexity may lead to technical challenges'
            mitigation = 'Break down complex tasks into smaller, manageable pieces'
            probability = 0.7
        }
    }
    
    # Resource risks
    if ($Plan.resources.team.Count -lt 2) {
        $risks += @{
            type = 'resource'
            severity = 'medium'
            description = 'Limited team size may impact delivery timeline'
            mitigation = 'Consider additional resources or adjust timeline'
            probability = 0.6
        }
    }
    
    # Timeline risks
    if ($Plan.timeline.totalDuration -gt 30) {
        $risks += @{
            type = 'timeline'
            severity = 'medium'
            description = 'Long project duration increases risk of scope creep'
            mitigation = 'Implement regular milestone reviews and scope control'
            probability = 0.5
        }
    }
    
    return $risks
}

function Get-ProjectAssumptions {
    param(
        [object]$ProjectData,
        [object]$Plan
    )
    
    $assumptions = @(
        'Team members have the necessary skills and availability',
        'Required tools and technologies are available',
        'Stakeholder requirements are stable and well-defined',
        'External dependencies will be available as expected',
        'No major changes in project scope during development'
    )
    
    # Add project-specific assumptions
    if ($ProjectData.type -eq 'ai-ml') {
        $assumptions += 'Data quality is sufficient for model training'
        $assumptions += 'Computational resources are available for training'
    }
    
    if ($ProjectData.type -eq 'mobile') {
        $assumptions += 'Target devices and platforms are clearly defined'
        $assumptions += 'App store approval process will be smooth'
    }
    
    return $assumptions
}

function Get-TaskPriority {
    param(
        [array]$Tasks,
        [hashtable]$Criteria = @{}
    )
    
    $prioritizedTasks = $Tasks | ForEach-Object {
        $score = Get-TaskScore -Task $_ -Criteria $Criteria
        return @{
            task = $_
            priorityScore = $score
            calculatedPriority = Get-PriorityFromScore -Score $score
        }
    }
    
    return $prioritizedTasks | Sort-Object priorityScore -Descending
}

function Get-TaskScore {
    param(
        [object]$Task,
        [hashtable]$Criteria
    )
    
    $score = 0
    $priorities = Get-Priorities
    
    # Priority weight
    $priorityWeight = $priorities[$Task.priority].weight ?? 5
    $score += $priorityWeight * 10
    
    # Due date urgency
    if ($Task.dueDate) {
        $daysUntilDue = Get-DaysUntilDue -DueDate $Task.dueDate
        if ($daysUntilDue -lt 0) {
            $score += 50  # Overdue tasks get high priority
        } elseif ($daysUntilDue -lt 3) {
            $score += 30  # Due soon
        } elseif ($daysUntilDue -lt 7) {
            $score += 15  # Due this week
        }
    }
    
    # Complexity factor
    $complexityWeights = @{ low = 1; medium = 2; high = 3 }
    $score += $complexityWeights[$Task.complexity] ?? 2
    
    # Dependencies factor
    if ($Task.dependencies -and $Task.dependencies.Count -gt 0) {
        $completedDependencies = Get-CompletedDependencies -DependencyIds $Task.dependencies
        $dependencyRatio = $completedDependencies / $Task.dependencies.Count
        $score += $dependencyRatio * 20  # Higher score for tasks with completed dependencies
    }
    
    # Progress factor
    if ($Task.progress -gt 0) {
        $score += $Task.progress * 5  # Slight boost for tasks in progress
    }
    
    # Custom criteria
    if ($Criteria.category -and $Task.category -eq $Criteria.category) {
        $score += 10
    }
    
    if ($Criteria.assignee -and $Task.assignee -eq $Criteria.assignee) {
        $score += 5
    }
    
    return [Math]::Round($score)
}

function Get-PriorityFromScore {
    param([int]$Score)
    
    if ($Score -ge 80) { return 'critical' }
    if ($Score -ge 60) { return 'high' }
    if ($Score -ge 40) { return 'medium' }
    if ($Score -ge 20) { return 'low' }
    return 'optional'
}

function Get-DaysUntilDue {
    param([string]$DueDate)
    
    $due = [DateTime]::Parse($DueDate)
    $now = Get-Date
    $diffTime = $due - $now
    return [Math]::Ceiling($diffTime.TotalDays)
}

function Get-CompletedDependencies {
    param([array]$DependencyIds)
    
    $completed = 0
    $DependencyIds | ForEach-Object {
        $task = Get-Task -TaskId $_
        if ($task -and $task.status -eq 'completed') {
            $completed++
        }
    }
    return $completed
}

function Get-Recommendations {
    param(
        [object]$ProjectData,
        [array]$CurrentTasks = @()
    )
    
    $recommendations = @()
    
    # Analyze project type and suggest tasks
    $suggestedTasks = Get-SuggestedTasksForProjectType -ProjectType $ProjectData.type
    $recommendations += @{
        type = 'tasks'
        priority = 'high'
        title = 'Suggested Tasks for Project Type'
        description = "Based on $($ProjectData.type) project, consider these tasks:"
        items = $suggestedTasks
    }
    
    # Analyze current tasks and suggest improvements
    $taskRecommendations = Get-CurrentTaskRecommendations -Tasks $CurrentTasks
    if ($taskRecommendations.Count -gt 0) {
        $recommendations += @{
            type = 'improvements'
            priority = 'medium'
            title = 'Task Improvements'
            description = 'Suggestions to improve your current tasks:'
            items = $taskRecommendations
        }
    }
    
    return $recommendations
}

function Get-SuggestedTasksForProjectType {
    param([string]$ProjectType)
    
    $taskSuggestions = @{
        'web' = @(
            'Set up development environment',
            'Create responsive design system',
            'Implement user authentication',
            'Set up API endpoints',
            'Configure database',
            'Implement testing framework',
            'Set up CI/CD pipeline',
            'Configure monitoring and logging'
        )
        'mobile' = @(
            'Set up mobile development environment',
            'Design mobile UI/UX',
            'Implement navigation structure',
            'Add offline functionality',
            'Implement push notifications',
            'Set up app analytics',
            'Prepare for app store submission',
            'Implement security measures'
        )
        'ai-ml' = @(
            'Collect and prepare data',
            'Set up ML development environment',
            'Choose and implement algorithms',
            'Train and validate models',
            'Implement model serving',
            'Set up monitoring for model performance',
            'Create data pipelines',
            'Implement A/B testing framework'
        )
        'api' = @(
            'Design API architecture',
            'Implement authentication and authorization',
            'Add rate limiting and throttling',
            'Implement API documentation',
            'Set up API testing',
            'Configure API monitoring',
            'Implement API versioning',
            'Set up API security measures'
        )
    }
    
    return $taskSuggestions[$ProjectType] ?? @()
}

function Get-CurrentTaskRecommendations {
    param([array]$Tasks)
    
    $recommendations = @()
    
    # Check for overdue tasks
    $overdueTasks = $Tasks | Where-Object {
        if (-not $_.dueDate) { return $false }
        return (Get-DaysUntilDue -DueDate $_.dueDate) -lt 0
    }
    
    if ($overdueTasks.Count -gt 0) {
        $recommendations += "You have $($overdueTasks.Count) overdue tasks. Consider reprioritizing or adjusting deadlines."
    }
    
    # Check for tasks without dependencies
    $tasksWithoutDeps = $Tasks | Where-Object { -not $_.dependencies -or $_.dependencies.Count -eq 0 }
    if ($tasksWithoutDeps.Count -gt 0) {
        $recommendations += "Consider adding dependencies to $($tasksWithoutDeps.Count) tasks to better organize your workflow."
    }
    
    # Check for high complexity tasks
    $highComplexityTasks = $Tasks | Where-Object { $_.complexity -eq 'high' }
    if ($highComplexityTasks.Count -gt 0) {
        $recommendations += "You have $($highComplexityTasks.Count) high complexity tasks. Consider breaking them down into smaller tasks."
    }
    
    return $recommendations
}

function Save-Plan {
    param([object]$Plan)
    
    $planFile = Join-Path $PlansPath "$($Plan.id).json"
    $Plan | ConvertTo-Json -Depth 10 | Set-Content $planFile
}

function Get-Plan {
    param([string]$PlanId)
    
    $planFile = Join-Path $PlansPath "$PlanId.json"
    if (Test-Path $planFile) {
        return Get-Content $planFile | ConvertFrom-Json
    }
    return $null
}

function Get-AllPlans {
    $plans = @()
    $files = Get-ChildItem $PlansPath -Filter "*.json"
    
    $files | ForEach-Object {
        $plan = Get-Content $_.FullName | ConvertFrom-Json
        $plans += $plan
    }
    
    return $plans
}

function Update-Plan {
    param(
        [string]$PlanId,
        [object]$Updates
    )
    
    $plan = Get-Plan -PlanId $PlanId
    if (-not $plan) {
        throw "Plan $PlanId not found"
    }
    
    $updatedPlan = $plan.PSObject.Copy()
    $Updates.PSObject.Properties | ForEach-Object {
        $updatedPlan[$_.Name] = $_.Value
    }
    $updatedPlan.updatedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    
    Save-Plan -Plan $updatedPlan
    return $updatedPlan
}

function Export-Plan {
    param(
        [string]$PlanId,
        [string]$Format = 'json'
    )
    
    $plan = Get-Plan -PlanId $PlanId
    if (-not $plan) {
        throw "Plan $PlanId not found"
    }
    
    if ($Format -eq 'json') {
        return $plan | ConvertTo-Json -Depth 10
    } elseif ($Format -eq 'markdown') {
        return Convert-PlanToMarkdown -Plan $plan
    } elseif ($Format -eq 'csv') {
        return Convert-PlanToCSV -Plan $plan
    }
    
    throw "Unsupported format: $Format"
}

function Convert-PlanToMarkdown {
    param([object]$Plan)
    
    $markdown = "# $($Plan.projectName)`n`n"
    $markdown += "**Project Type:** $($Plan.projectType)`n"
    $markdown += "**Status:** $($Plan.status)`n"
    $markdown += "**Duration:** $($Plan.timeline.totalDuration) days`n`n"
    
    $markdown += "## Timeline`n`n"
    $markdown += "- **Start Date:** $([DateTime]::Parse($Plan.timeline.startDate).ToString('yyyy-MM-dd'))`n"
    $markdown += "- **End Date:** $([DateTime]::Parse($Plan.timeline.endDate).ToString('yyyy-MM-dd'))`n`n"
    
    $markdown += "## Phases`n`n"
    for ($i = 0; $i -lt $Plan.phases.Count; $i++) {
        $phase = $Plan.phases[$i]
        $markdown += "### $($i + 1). $($phase.name)`n"
        $markdown += "$($phase.description)`n`n"
        $markdown += "**Duration:** $($phase.duration) days`n"
        $markdown += "**Priority:** $($phase.priority)`n`n"
        
        if ($phase.tasks -and $phase.tasks.Count -gt 0) {
            $markdown += "**Tasks:**`n"
            $phase.tasks | ForEach-Object {
                $markdown += "- $_`n"
            }
            $markdown += "`n"
        }
    }
    
    if ($Plan.risks -and $Plan.risks.Count -gt 0) {
        $markdown += "## Risks`n`n"
        $Plan.risks | ForEach-Object {
            $markdown += "### $($_.description)`n"
            $markdown += "**Severity:** $($_.severity)`n"
            $markdown += "**Probability:** $([Math]::Round($_.probability * 100))%`n"
            $markdown += "**Mitigation:** $($_.mitigation)`n`n"
        }
    }
    
    return $markdown
}

function Convert-PlanToCSV {
    param([object]$Plan)
    
    $csv = "Phase,Description,Duration,Priority`n"
    $Plan.phases | ForEach-Object {
        $csv += "`"$($_.name)`",`"$($_.description)`",$($_.duration),`"$($_.priority)`"`n"
    }
    return $csv
}

# Main execution
Ensure-Directories

if ($Help -or $Command -eq "help" -or $Command -eq "--help" -or $Command -eq "-h") {
    Show-Help
} elseif ($Command -eq "create-task") {
    if (-not $Data) {
        Write-Error "❌ Task data is required"
        exit 1
    }
    $taskData = $Data | ConvertFrom-Json
    $task = New-Task -TaskData $taskData
    Write-Host "✅ Task created: $($task.id)"
    Write-Host ($task | ConvertTo-Json -Depth 3)
} elseif ($Command -eq "create-plan") {
    if (-not $Data) {
        Write-Error "❌ Project data is required"
        exit 1
    }
    $projectData = $Data | ConvertFrom-Json
    $plan = New-ProjectPlan -ProjectData $projectData
    Write-Host "✅ Plan created: $($plan.id)"
    Write-Host ($plan | ConvertTo-Json -Depth 3)
} elseif ($Command -eq "prioritize") {
    $criteria = if ($Data) { $Data | ConvertFrom-Json } else { @{} }
    $tasks = Get-AllTasks
    $prioritizedTasks = Get-TaskPriority -Tasks $tasks -Criteria $criteria
    Write-Host "📋 Prioritized Tasks:"
    for ($i = 0; $i -lt $prioritizedTasks.Count; $i++) {
        $task = $prioritizedTasks[$i]
        Write-Host "$($i + 1). $($task.task.title) (Score: $($task.priorityScore))"
    }
} elseif ($Command -eq "recommend") {
    if (-not $Data) {
        Write-Error "❌ Project data is required"
        exit 1
    }
    $projectData = $Data | ConvertFrom-Json
    $currentTasks = Get-AllTasks
    $recommendations = Get-Recommendations -ProjectData $projectData -CurrentTasks $currentTasks
    Write-Host "💡 Recommendations:"
    $recommendations | ForEach-Object {
        Write-Host "`n$($_.title):"
        $_.items | ForEach-Object {
            Write-Host "  - $_"
        }
    }
} elseif ($Command -eq "export") {
    if (-not $Data) {
        Write-Error "❌ Plan ID is required"
        exit 1
    }
    $planId = $Data
    $format = $Format ?? 'json'
    $exported = Export-Plan -PlanId $planId -Format $format
    Write-Host $exported
} elseif ($Command -eq "list") {
    $type = $Data ?? 'tasks'
    if ($type -eq 'tasks') {
        $tasks = Get-AllTasks
        Write-Host "📋 Tasks:"
        $tasks | ForEach-Object {
            Write-Host "$($_.id): $($_.title) ($($_.priority))"
        }
    } elseif ($type -eq 'plans') {
        $plans = Get-AllPlans
        Write-Host "📋 Plans:"
        $plans | ForEach-Object {
            Write-Host "$($_.id): $($_.projectName) ($($_.status))"
        }
    }
} elseif ($Command -eq "update") {
    if (-not $Data -or -not $Updates) {
        Write-Error "❌ ID and updates are required"
        exit 1
    }
    $id = $Data
    $updates = $Updates | ConvertFrom-Json
    try {
        $updated = Update-Task -TaskId $id -Updates $updates
        Write-Host "✅ Updated task: $id"
    } catch {
        try {
            $updated = Update-Plan -PlanId $id -Updates $updates
            Write-Host "✅ Updated plan: $id"
        } catch {
            Write-Host "❌ Not found: $id"
        }
    }
} else {
    Write-Error "❌ Unknown command: $Command"
    Write-Host "Use -Help for available commands"
    exit 1
}
