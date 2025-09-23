# 🧠 AI-Powered Task Planning System
# Intelligent task prioritization and planning with AI assistance

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectPath = ".",
    
    [Parameter(Mandatory=$false)]
    [string]$TaskSource = "auto", # auto, todo, jira, github, trello
    
    [Parameter(Mandatory=$false)]
    [string]$PlanningHorizon = "sprint", # daily, weekly, sprint, monthly
    
    [Parameter(Mandatory=$false)]
    [switch]$GenerateSchedule = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$OptimizeResources = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$PredictRisks = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$GenerateReport = $true
)

# 🎯 Configuration
$Config = @{
    AIProvider = "openai"
    Model = "gpt-4"
    MaxTokens = 4000
    Temperature = 0.3
    PlanningModes = @{
        "daily" = "1 day"
        "weekly" = "1 week"
        "sprint" = "2 weeks"
        "monthly" = "1 month"
    }
    PriorityLevels = @("Critical", "High", "Medium", "Low")
    TaskTypes = @("Development", "Testing", "Documentation", "Review", "Deployment", "Maintenance")
    RiskFactors = @("Complexity", "Dependencies", "ResourceAvailability", "TechnicalDebt", "ExternalFactors")
}

# 🚀 Main Planning Function
function Start-AITaskPlanning {
    Write-Host "🧠 Starting AI Task Planning..." -ForegroundColor Cyan
    
    # 1. Collect tasks from various sources
    $Tasks = Collect-Tasks -ProjectPath $ProjectPath -Source $TaskSource
    Write-Host "📋 Collected $($Tasks.Count) tasks" -ForegroundColor Green
    
    # 2. Analyze project context
    $ProjectContext = Analyze-ProjectContext -ProjectPath $ProjectPath
    Write-Host "🔍 Project context analyzed" -ForegroundColor Yellow
    
    # 3. AI-powered task analysis
    $TaskAnalysis = Invoke-AITaskAnalysis -Tasks $Tasks -Context $ProjectContext
    Write-Host "🤖 AI task analysis completed" -ForegroundColor Magenta
    
    # 4. Prioritize tasks
    $PrioritizedTasks = Prioritize-Tasks -Tasks $Tasks -Analysis $TaskAnalysis
    Write-Host "📊 Tasks prioritized" -ForegroundColor Blue
    
    # 5. Generate schedule
    if ($GenerateSchedule) {
        $Schedule = Generate-TaskSchedule -Tasks $PrioritizedTasks -Horizon $PlanningHorizon
        Write-Host "📅 Schedule generated" -ForegroundColor Green
    }
    
    # 6. Optimize resource allocation
    if ($OptimizeResources) {
        $ResourcePlan = Optimize-ResourceAllocation -Tasks $PrioritizedTasks -Context $ProjectContext
        Write-Host "👥 Resource allocation optimized" -ForegroundColor Cyan
    }
    
    # 7. Predict risks
    if ($PredictRisks) {
        $RiskAssessment = Predict-TaskRisks -Tasks $PrioritizedTasks -Context $ProjectContext
        Write-Host "⚠️ Risk assessment completed" -ForegroundColor Red
    }
    
    # 8. Generate planning report
    if ($GenerateReport) {
        $ReportPath = Generate-PlanningReport -Tasks $PrioritizedTasks -Schedule $Schedule -ResourcePlan $ResourcePlan -RiskAssessment $RiskAssessment
        Write-Host "📋 Planning report generated: $ReportPath" -ForegroundColor Green
    }
    
    # 9. Update task management system
    Update-TaskManagementSystem -Tasks $PrioritizedTasks -Schedule $Schedule
    
    Write-Host "✅ AI Task Planning completed successfully!" -ForegroundColor Green
}

# 📋 Collect Tasks
function Collect-Tasks {
    param(
        [string]$ProjectPath,
        [string]$Source
    )
    
    $Tasks = @()
    
    switch ($Source) {
        "auto" {
            # Try multiple sources
            $Tasks += Get-TasksFromTODO -ProjectPath $ProjectPath
            $Tasks += Get-TasksFromGitHub -ProjectPath $ProjectPath
            $Tasks += Get-TasksFromJira -ProjectPath $ProjectPath
        }
        "todo" {
            $Tasks += Get-TasksFromTODO -ProjectPath $ProjectPath
        }
        "github" {
            $Tasks += Get-TasksFromGitHub -ProjectPath $ProjectPath
        }
        "jira" {
            $Tasks += Get-TasksFromJira -ProjectPath $ProjectPath
        }
        "trello" {
            $Tasks += Get-TasksFromTrello -ProjectPath $ProjectPath
        }
    }
    
    return $Tasks
}

# 📄 Get Tasks from TODO.md
function Get-TasksFromTODO {
    param([string]$ProjectPath)
    
    $Tasks = @()
    $TodoPath = Join-Path $ProjectPath "TODO.md"
    
    if (Test-Path $TodoPath) {
        $Content = Get-Content -Path $TodoPath -Raw
        $Lines = $Content -split "`n"
        
        foreach ($Line in $Lines) {
            if ($Line -match "^- \[ \] (.+)$") {
                $TaskDescription = $Matches[1].Trim()
                $Tasks += @{
                    Id = [System.Guid]::NewGuid().ToString()
                    Description = $TaskDescription
                    Source = "TODO.md"
                    Status = "Pending"
                    Priority = "Medium"
                    Type = "Development"
                    Created = Get-Date
                    EstimatedEffort = 0
                    Dependencies = @()
                    Tags = @()
                }
            }
        }
    }
    
    return $Tasks
}

# 🔍 Analyze Project Context
function Analyze-ProjectContext {
    param([string]$ProjectPath)
    
    $Context = @{
        ProjectType = "Unknown"
        TechnologyStack = @()
        TeamSize = 1
        Complexity = "Medium"
        Dependencies = @()
        Constraints = @()
        Resources = @{
            Developers = 1
            Testers = 0
            Designers = 0
            DevOps = 0
        }
        Timeline = @{
            StartDate = Get-Date
            EndDate = (Get-Date).AddDays(30)
            Milestones = @()
        }
    }
    
    # Detect project type
    $Context.ProjectType = Detect-ProjectType -ProjectPath $ProjectPath
    
    # Detect technology stack
    $Context.TechnologyStack = Detect-TechnologyStack -ProjectPath $ProjectPath
    
    # Analyze complexity
    $Context.Complexity = Analyze-ProjectComplexity -ProjectPath $ProjectPath
    
    # Detect dependencies
    $Context.Dependencies = Detect-ProjectDependencies -ProjectPath $ProjectPath
    
    return $Context
}

# 🤖 AI Task Analysis
function Invoke-AITaskAnalysis {
    param(
        [array]$Tasks,
        [hashtable]$Context
    )
    
    $Analysis = @{
        TaskComplexity = @{}
        EffortEstimates = @{}
        Dependencies = @{}
        Risks = @{}
        Opportunities = @{}
        Recommendations = @{}
    }
    
    foreach ($Task in $Tasks) {
        $AIPrompt = @"
Analyze this task for project planning:

Task: $($Task.Description)
Project Type: $($Context.ProjectType)
Technology Stack: $($Context.TechnologyStack -join ', ')
Team Size: $($Context.Resources.Developers)

Please provide:
1. Complexity level (1-10)
2. Effort estimate in hours
3. Required skills
4. Dependencies on other tasks
5. Potential risks
6. Optimization opportunities
7. Recommendations

Format as JSON:
{
  "complexity": number,
  "effortHours": number,
  "requiredSkills": ["skill1", "skill2"],
  "dependencies": ["task1", "task2"],
  "risks": ["risk1", "risk2"],
  "opportunities": ["opp1", "opp2"],
  "recommendations": ["rec1", "rec2"]
}
"@

        try {
            $AIResponse = Invoke-AIAPI -Content $AIPrompt -Provider $Config.AIProvider -Model $Config.Model
            $TaskAnalysis = $AIResponse | ConvertFrom-Json
            
            $Analysis.TaskComplexity[$Task.Id] = $TaskAnalysis.complexity
            $Analysis.EffortEstimates[$Task.Id] = $TaskAnalysis.effortHours
            $Analysis.Dependencies[$Task.Id] = $TaskAnalysis.dependencies
            $Analysis.Risks[$Task.Id] = $TaskAnalysis.risks
            $Analysis.Opportunities[$Task.Id] = $TaskAnalysis.opportunities
            $Analysis.Recommendations[$Task.Id] = $TaskAnalysis.recommendations
        }
        catch {
            Write-Warning "AI analysis failed for task $($Task.Id): $($_.Exception.Message)"
            # Fallback to basic analysis
            $Analysis.TaskComplexity[$Task.Id] = 5
            $Analysis.EffortEstimates[$Task.Id] = 8
            $Analysis.Dependencies[$Task.Id] = @()
            $Analysis.Risks[$Task.Id] = @("Unknown complexity")
            $Analysis.Opportunities[$Task.Id] = @()
            $Analysis.Recommendations[$Task.Id] = @("Manual review needed")
        }
    }
    
    return $Analysis
}

# 📊 Prioritize Tasks
function Prioritize-Tasks {
    param(
        [array]$Tasks,
        [hashtable]$Analysis
    )
    
    $PrioritizedTasks = @()
    
    foreach ($Task in $Tasks) {
        $PriorityScore = Calculate-PriorityScore -Task $Task -Analysis $Analysis
        $Task.Priority = Get-PriorityLevel -Score $PriorityScore
        $Task.EstimatedEffort = $Analysis.EffortEstimates[$Task.Id]
        $Task.Complexity = $Analysis.TaskComplexity[$Task.Id]
        $Task.Dependencies = $Analysis.Dependencies[$Task.Id]
        $Task.Risks = $Analysis.Risks[$Task.Id]
        $Task.Opportunities = $Analysis.Opportunities[$Task.Id]
        $Task.Recommendations = $Analysis.Recommendations[$Task.Id]
        
        $PrioritizedTasks += $Task
    }
    
    # Sort by priority score (descending)
    $PrioritizedTasks = $PrioritizedTasks | Sort-Object { $_.Priority } -Descending
    
    return $PrioritizedTasks
}

# 📅 Generate Task Schedule
function Generate-TaskSchedule {
    param(
        [array]$Tasks,
        [string]$Horizon
    )
    
    $Schedule = @{
        Horizon = $Horizon
        StartDate = Get-Date
        EndDate = (Get-Date).AddDays($Config.PlanningModes[$Horizon].Split(' ')[0] -as [int])
        Sprints = @()
        Milestones = @()
        Dependencies = @{}
    }
    
    # Create sprints based on horizon
    $SprintDuration = if ($Horizon -eq "sprint") { 14 } else { 7 }
    $SprintCount = [Math]::Ceiling($Config.PlanningModes[$Horizon].Split(' ')[0] -as [int] / $SprintDuration)
    
    for ($i = 0; $i -lt $SprintCount; $i++) {
        $SprintStart = $Schedule.StartDate.AddDays($i * $SprintDuration)
        $SprintEnd = $SprintStart.AddDays($SprintDuration)
        
        $Sprint = @{
            Number = $i + 1
            StartDate = $SprintStart
            EndDate = $SprintEnd
            Tasks = @()
            Capacity = 40 # hours per sprint
            UsedCapacity = 0
        }
        
        # Assign tasks to sprint based on priority and capacity
        foreach ($Task in $Tasks) {
            if ($Sprint.UsedCapacity + $Task.EstimatedEffort -le $Sprint.Capacity) {
                $Sprint.Tasks += $Task
                $Sprint.UsedCapacity += $Task.EstimatedEffort
                $Task.Sprint = $i + 1
                $Task.StartDate = $SprintStart
                $Task.EndDate = $SprintEnd
            }
        }
        
        $Schedule.Sprints += $Sprint
    }
    
    return $Schedule
}

# 👥 Optimize Resource Allocation
function Optimize-ResourceAllocation {
    param(
        [array]$Tasks,
        [hashtable]$Context
    )
    
    $ResourcePlan = @{
        TeamMembers = @()
        TaskAssignments = @{}
        Workload = @{}
        Conflicts = @()
    }
    
    # Create team members based on context
    for ($i = 1; $i -le $Context.Resources.Developers; $i++) {
        $Member = @{
            Id = "dev$i"
            Name = "Developer $i"
            Role = "Developer"
            Skills = @("Programming", "Problem Solving")
            Availability = 40 # hours per week
            CurrentWorkload = 0
        }
        $ResourcePlan.TeamMembers += $Member
    }
    
    # Assign tasks to team members
    foreach ($Task in $Tasks) {
        $BestMember = Find-BestTeamMember -Task $Task -TeamMembers $ResourcePlan.TeamMembers
        if ($BestMember) {
            $ResourcePlan.TaskAssignments[$Task.Id] = $BestMember.Id
            $ResourcePlan.Workload[$BestMember.Id] += $Task.EstimatedEffort
            $BestMember.CurrentWorkload += $Task.EstimatedEffort
        }
    }
    
    # Check for workload conflicts
    foreach ($Member in $ResourcePlan.TeamMembers) {
        if ($Member.CurrentWorkload -gt $Member.Availability) {
            $ResourcePlan.Conflicts += @{
                Member = $Member.Id
                Overload = $Member.CurrentWorkload - $Member.Availability
                Message = "Member $($Member.Id) is overloaded by $($Member.CurrentWorkload - $Member.Availability) hours"
            }
        }
    }
    
    return $ResourcePlan
}

# ⚠️ Predict Task Risks
function Predict-TaskRisks {
    param(
        [array]$Tasks,
        [hashtable]$Context
    )
    
    $RiskAssessment = @{
        OverallRisk = "Medium"
        TaskRisks = @{}
        MitigationStrategies = @{}
        ContingencyPlans = @{}
    }
    
    foreach ($Task in $Tasks) {
        $TaskRisks = @()
        $MitigationStrategies = @()
        
        # Analyze complexity risk
        if ($Task.Complexity -gt 7) {
            $TaskRisks += @{
                Type = "High Complexity"
                Probability = "High"
                Impact = "High"
                Description = "Task has high complexity which may lead to delays"
            }
            $MitigationStrategies += "Break down into smaller subtasks"
        }
        
        # Analyze dependency risk
        if ($Task.Dependencies.Count -gt 3) {
            $TaskRisks += @{
                Type = "High Dependencies"
                Probability = "Medium"
                Impact = "High"
                Description = "Task has many dependencies which may cause delays"
            }
            $MitigationStrategies += "Identify critical path and monitor dependencies closely"
        }
        
        # Analyze effort estimation risk
        if ($Task.EstimatedEffort -gt 40) {
            $TaskRisks += @{
                Type = "Large Effort"
                Probability = "Medium"
                Impact = "Medium"
                Description = "Large effort estimate may be inaccurate"
            }
            $MitigationStrategies += "Break down into smaller tasks for better estimation"
        }
        
        $RiskAssessment.TaskRisks[$Task.Id] = $TaskRisks
        $RiskAssessment.MitigationStrategies[$Task.Id] = $MitigationStrategies
    }
    
    return $RiskAssessment
}

# 📋 Generate Planning Report
function Generate-PlanningReport {
    param(
        [array]$Tasks,
        [hashtable]$Schedule,
        [hashtable]$ResourcePlan,
        [hashtable]$RiskAssessment
    )
    
    $ReportPath = ".\reports\ai-task-planning-$(Get-Date -Format 'yyyy-MM-dd-HHmm').md"
    $ReportDir = Split-Path -Parent $ReportPath
    
    if (-not (Test-Path $ReportDir)) {
        New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null
    }
    
    $Report = @"
# 🧠 AI Task Planning Report

**Generated**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  
**Planning Horizon**: $($Schedule.Horizon)  
**Total Tasks**: $($Tasks.Count)

## 📊 Executive Summary

- **High Priority Tasks**: $(($Tasks | Where-Object { $_.Priority -eq 'High' }).Count)
- **Medium Priority Tasks**: $(($Tasks | Where-Object { $_.Priority -eq 'Medium' }).Count)
- **Low Priority Tasks**: $(($Tasks | Where-Object { $_.Priority -eq 'Low' }).Count)
- **Total Estimated Effort**: $(($Tasks | Measure-Object -Property EstimatedEffort -Sum).Sum) hours
- **Sprints Planned**: $($Schedule.Sprints.Count)

## 🎯 Task Prioritization

### High Priority Tasks
"@

    foreach ($Task in ($Tasks | Where-Object { $_.Priority -eq 'High' })) {
        $Report += "`n- **$($Task.Description)**`n"
        $Report += "  - Effort: $($Task.EstimatedEffort) hours`n"
        $Report += "  - Complexity: $($Task.Complexity)/10`n"
        $Report += "  - Sprint: $($Task.Sprint)`n"
    }

    $Report += @"

### Medium Priority Tasks
"@

    foreach ($Task in ($Tasks | Where-Object { $_.Priority -eq 'Medium' })) {
        $Report += "`n- **$($Task.Description)**`n"
        $Report += "  - Effort: $($Task.EstimatedEffort) hours`n"
        $Report += "  - Complexity: $($Task.Complexity)/10`n"
        $Report += "  - Sprint: $($Task.Sprint)`n"
    }

    $Report += @"

## 📅 Sprint Schedule

"@

    foreach ($Sprint in $Schedule.Sprints) {
        $Report += "`n### Sprint $($Sprint.Number)`n"
        $Report += "**Duration**: $($Sprint.StartDate.ToString('yyyy-MM-dd')) to $($Sprint.EndDate.ToString('yyyy-MM-dd'))`n"
        $Report += "**Capacity**: $($Sprint.UsedCapacity)/$($Sprint.Capacity) hours`n"
        $Report += "**Tasks**: $($Sprint.Tasks.Count)`n"
    }

    $Report += @"

## 👥 Resource Allocation

### Team Members
"@

    foreach ($Member in $ResourcePlan.TeamMembers) {
        $Report += "`n- **$($Member.Name)** ($($Member.Id))`n"
        $Report += "  - Role: $($Member.Role)`n"
        $Report += "  - Workload: $($ResourcePlan.Workload[$Member.Id])/$($Member.Availability) hours`n"
    }

    if ($ResourcePlan.Conflicts.Count -gt 0) {
        $Report += "`n### ⚠️ Resource Conflicts`n"
        foreach ($Conflict in $ResourcePlan.Conflicts) {
            $Report += "- $($Conflict.Message)`n"
        }
    }

    $Report += @"

## ⚠️ Risk Assessment

### Overall Risk Level: $($RiskAssessment.OverallRisk)

### High Risk Tasks
"@

    foreach ($Task in $Tasks) {
        $TaskRisks = $RiskAssessment.TaskRisks[$Task.Id]
        if ($TaskRisks.Count -gt 0) {
            $Report += "`n- **$($Task.Description)**`n"
            foreach ($Risk in $TaskRisks) {
                $Report += "  - $($Risk.Type): $($Risk.Description)`n"
            }
        }
    }

    $Report += @"

## 🎯 Recommendations

1. **Immediate Actions**: Focus on high-priority tasks first
2. **Resource Management**: Address resource conflicts if any
3. **Risk Mitigation**: Implement mitigation strategies for high-risk tasks
4. **Monitoring**: Set up regular progress monitoring
5. **Adjustments**: Be prepared to adjust the plan based on progress

## 📈 Next Steps

1. Review and approve the task plan
2. Assign tasks to team members
3. Set up project tracking
4. Schedule regular reviews
5. Monitor progress and adjust as needed

---
*Generated by AI Task Planner v1.0*
"@

    $Report | Out-File -FilePath $ReportPath -Encoding UTF8
    return $ReportPath
}

# 🚀 Execute Planning
if ($MyInvocation.InvocationName -ne '.') {
    Start-AITaskPlanning
}
