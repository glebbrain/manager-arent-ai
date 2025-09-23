# Advanced Project Management Automation Script
# Provides comprehensive automation for roles, analytics, and orchestration features

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("team", "analytics", "automation", "workflow", "deploy", "scale", "report")]
    [string]$Action = "help",

    [Parameter(Mandatory=$false)]
    [string]$ProjectId = "",

    [Parameter(Mandatory=$false)]
    [string]$UserId = "",

    [Parameter(Mandatory=$false)]
    [string]$Environment = "production",

    [Parameter(Mandatory=$false)]
    [string]$Version = "",

    [Parameter(Mandatory=$false)]
    [string]$ConfigFile = "",

    [Parameter(Mandatory=$false)]
    [switch]$Detailed,

    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Import required modules
try {
    Import-Module -Name ".\src\project_management" -Force -ErrorAction SilentlyContinue
} catch {
    Write-Warning "Could not import project management module. Using CLI interface instead."
}

# Configuration
$Script:Config = @{
    PythonPath = "python"
    ProjectRoot = $PSScriptRoot
    LogFile = ".\logs\advanced-project-management.log"
    TempDir = ".\temp"
}

# Ensure directories exist
$Config.LogFile | Split-Path -Parent | ForEach-Object { if (!(Test-Path $_)) { New-Item -ItemType Directory -Path $_ -Force } }
if (!(Test-Path $Config.TempDir)) { New-Item -ItemType Directory -Path $Config.TempDir -Force }

# Logging function
function Write-Log {
    param(
        [string]$Message,
        [ValidateSet("INFO", "WARN", "ERROR", "SUCCESS")]
        [string]$Level = "INFO"
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"

    # Write to console with colors
    switch ($Level) {
        "INFO" { Write-Host $logMessage -ForegroundColor White }
        "WARN" { Write-Host $logMessage -ForegroundColor Yellow }
        "ERROR" { Write-Host $logMessage -ForegroundColor Red }
        "SUCCESS" { Write-Host $logMessage -ForegroundColor Green }
    }

    # Write to log file
    Add-Content -Path $Config.LogFile -Value $logMessage -Encoding UTF8
}

# Helper function to run Python CLI commands
function Invoke-PythonCLI {
    param(
        [string]$Command,
        [hashtable]$Parameters = @{}
    )

    $pythonArgs = @()
    foreach ($key in $Parameters.Keys) {
        $pythonArgs += "--$key"
        $pythonArgs += $Parameters[$key]
    }

    $fullCommand = "$Command $($pythonArgs -join ' ')"
    Write-Log "Executing: $fullCommand" "INFO"

    try {
        $result = & $Config.PythonPath -m $Command @pythonArgs 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Command executed successfully" "SUCCESS"
            return $result
        } else {
            Write-Log "Command failed with exit code $LASTEXITCODE" "ERROR"
            return $null
        }
    } catch {
        Write-Log "Error executing command: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Team Management Functions
function Add-TeamMember {
    param(
        [string]$ProjectId,
        [string]$UserId,
        [string]$Email,
        [string]$Name,
        [string]$Role,
        [string]$AssignedBy
    )

    Write-Log "Adding team member: $Name ($Email) as $Role to project $ProjectId" "INFO"

    $result = Invoke-PythonCLI -Command "src.project_management.advanced_cli" -Parameters @{
        "team" = "add"
        "project-id" = $ProjectId
        "user-id" = $UserId
        "email" = $Email
        "name" = $Name
        "role" = $Role
        "assigned-by" = $AssignedBy
    }

    if ($result) {
        Write-Log "Team member added successfully" "SUCCESS"
        return $true
    } else {
        Write-Log "Failed to add team member" "ERROR"
        return $false
    }
}

function Get-TeamMembers {
    param(
        [string]$ProjectId,
        [string]$UserId
    )

    Write-Log "Retrieving team members for project $ProjectId" "INFO"

    $result = Invoke-PythonCLI -Command "src.project_management.advanced_cli" -Parameters @{
        "team" = "list"
        "project-id" = $ProjectId
        "user-id" = $UserId
    }

    if ($result) {
        Write-Log "Team members retrieved successfully" "SUCCESS"
        return $result
    } else {
        Write-Log "Failed to retrieve team members" "ERROR"
        return $null
    }
}

function Invite-TeamMember {
    param(
        [string]$ProjectId,
        [string]$Email,
        [string]$Role,
        [string]$InvitedBy
    )

    Write-Log "Inviting team member: $Email as $Role to project $ProjectId" "INFO"

    $result = Invoke-PythonCLI -Command "src.project_management.advanced_cli" -Parameters @{
        "team" = "invite"
        "project-id" = $ProjectId
        "email" = $Email
        "role" = $Role
        "invited-by" = $InvitedBy
    }

    if ($result) {
        Write-Log "Invitation sent successfully" "SUCCESS"
        return $true
    } else {
        Write-Log "Failed to send invitation" "ERROR"
        return $false
    }
}

# Analytics Functions
function Add-ProjectMetric {
    param(
        [string]$ProjectId,
        [string]$Name,
        [double]$Value,
        [string]$Type = "numeric",
        [string]$Unit = "",
        [string]$Category = "general",
        [string[]]$Tags = @()
    )

    Write-Log "Adding metric: $Name = $Value $Unit to project $ProjectId" "INFO"

    $params = @{
        "analytics" = "add-metric"
        "project-id" = $ProjectId
        "name" = $Name
        "value" = $Value
        "type" = $Type
        "category" = $Category
    }

    if ($Unit) { $params["unit"] = $Unit }
    if ($Tags.Count -gt 0) { $params["tags"] = $Tags -join " " }

    $result = Invoke-PythonCLI -Command "src.project_management.advanced_cli" -Parameters $params

    if ($result) {
        Write-Log "Metric added successfully" "SUCCESS"
        return $true
    } else {
        Write-Log "Failed to add metric" "ERROR"
        return $false
    }
}

function Get-ProjectReport {
    param(
        [string]$ProjectId,
        [string]$Type = "summary",
        [int]$PeriodDays = 30,
        [string]$OutputFile = ""
    )

    Write-Log "Generating $Type report for project $ProjectId (last $PeriodDays days)" "INFO"

    $params = @{
        "analytics" = "generate-report"
        "project-id" = $ProjectId
        "type" = $Type
        "period-days" = $PeriodDays
    }

    if ($OutputFile) { $params["output-file"] = $OutputFile }

    $result = Invoke-PythonCLI -Command "src.project_management.advanced_cli" -Parameters $params

    if ($result) {
        Write-Log "Report generated successfully" "SUCCESS"
        return $result
    } else {
        Write-Log "Failed to generate report" "ERROR"
        return $null
    }
}

function Get-MetricTrend {
    param(
        [string]$ProjectId,
        [string]$Metric,
        [int]$Days = 30
    )

    Write-Log "Calculating trend for metric $Metric in project $ProjectId" "INFO"

    $result = Invoke-PythonCLI -Command "src.project_management.advanced_cli" -Parameters @{
        "analytics" = "trend"
        "project-id" = $ProjectId
        "metric" = $Metric
        "days" = $Days
    }

    if ($result) {
        Write-Log "Trend calculated successfully" "SUCCESS"
        return $result
    } else {
        Write-Log "Failed to calculate trend" "ERROR"
        return $null
    }
}

function Get-MetricForecast {
    param(
        [string]$ProjectId,
        [string]$Metric,
        [int]$Days = 7,
        [int]$HistoricalDays = 90
    )

    Write-Log "Generating forecast for metric $Metric in project $ProjectId" "INFO"

    $result = Invoke-PythonCLI -Command "src.project_management.advanced_cli" -Parameters @{
        "analytics" = "forecast"
        "project-id" = $ProjectId
        "metric" = $Metric
        "days" = $Days
        "historical-days" = $HistoricalDays
    }

    if ($result) {
        Write-Log "Forecast generated successfully" "SUCCESS"
        return $result
    } else {
        Write-Log "Failed to generate forecast" "ERROR"
        return $null
    }
}

# Automation Functions
function Start-ProjectDeployment {
    param(
        [string]$ProjectId,
        [string]$Version,
        [string]$Environment,
        [string]$TriggeredBy
    )

    Write-Log "Starting deployment of version $Version to $Environment for project $ProjectId" "INFO"

    $result = Invoke-PythonCLI -Command "src.project_management.advanced_cli" -Parameters @{
        "automation" = "deploy"
        "project-id" = $ProjectId
        "version" = $Version
        "environment" = $Environment
        "triggered-by" = $TriggeredBy
    }

    if ($result) {
        Write-Log "Deployment started successfully" "SUCCESS"
        return $result
    } else {
        Write-Log "Failed to start deployment" "ERROR"
        return $null
    }
}

function Set-AutoScaling {
    param(
        [string]$ProjectId,
        [string]$RulesFile
    )

    Write-Log "Setting up auto scaling for project $ProjectId using rules from $RulesFile" "INFO"

    if (!(Test-Path $RulesFile)) {
        Write-Log "Scaling rules file not found: $RulesFile" "ERROR"
        return $false
    }

    $result = Invoke-PythonCLI -Command "src.project_management.advanced_cli" -Parameters @{
        "automation" = "setup-scaling"
        "project-id" = $ProjectId
        "rules-file" = $RulesFile
    }

    if ($result) {
        Write-Log "Auto scaling setup completed successfully" "SUCCESS"
        return $true
    } else {
        Write-Log "Failed to setup auto scaling" "ERROR"
        return $false
    }
}

function Test-ScalingConditions {
    param(
        [string]$ProjectId,
        [string]$MetricsFile
    )

    Write-Log "Checking scaling conditions for project $ProjectId" "INFO"

    if (!(Test-Path $MetricsFile)) {
        Write-Log "Metrics file not found: $MetricsFile" "ERROR"
        return $null
    }

    $result = Invoke-PythonCLI -Command "src.project_management.advanced_cli" -Parameters @{
        "automation" = "check-scaling"
        "project-id" = $ProjectId
        "metrics-file" = $MetricsFile
    }

    if ($result) {
        Write-Log "Scaling conditions checked successfully" "SUCCESS"
        return $result
    } else {
        Write-Log "Failed to check scaling conditions" "ERROR"
        return $null
    }
}

# Workflow Functions
function New-Workflow {
    param(
        [string]$ProjectId,
        [string]$Name,
        [string]$Description = "",
        [string]$TasksFile
    )

    Write-Log "Creating workflow '$Name' for project $ProjectId" "INFO"

    if (!(Test-Path $TasksFile)) {
        Write-Log "Tasks file not found: $TasksFile" "ERROR"
        return $null
    }

    $params = @{
        "workflow" = "create"
        "project-id" = $ProjectId
        "name" = $Name
        "tasks-file" = $TasksFile
    }

    if ($Description) { $params["description"] = $Description }

    $result = Invoke-PythonCLI -Command "src.project_management.advanced_cli" -Parameters $params

    if ($result) {
        Write-Log "Workflow created successfully" "SUCCESS"
        return $result
    } else {
        Write-Log "Failed to create workflow" "ERROR"
        return $null
    }
}

function Start-Workflow {
    param(
        [string]$WorkflowId,
        [string]$TriggeredBy,
        [string]$TriggerDataFile = ""
    )

    Write-Log "Starting workflow $WorkflowId" "INFO"

    $params = @{
        "workflow" = "execute"
        "workflow-id" = $WorkflowId
        "triggered-by" = $TriggeredBy
    }

    if ($TriggerDataFile -and (Test-Path $TriggerDataFile)) {
        $params["trigger-data"] = $TriggerDataFile
    }

    $result = Invoke-PythonCLI -Command "src.project_management.advanced_cli" -Parameters $params

    if ($result) {
        Write-Log "Workflow started successfully" "SUCCESS"
        return $result
    } else {
        Write-Log "Failed to start workflow" "ERROR"
        return $null
    }
}

function Get-WorkflowStatus {
    param(
        [string]$ExecutionId
    )

    Write-Log "Getting status for workflow execution $ExecutionId" "INFO"

    $result = Invoke-PythonCLI -Command "src.project_management.advanced_cli" -Parameters @{
        "workflow" = "status"
        "execution-id" = $ExecutionId
    }

    if ($result) {
        Write-Log "Workflow status retrieved successfully" "SUCCESS"
        return $result
    } else {
        Write-Log "Failed to get workflow status" "ERROR"
        return $null
    }
}

# Configuration Management Functions
function Export-ProjectConfiguration {
    param(
        [string]$ProjectId,
        [string]$UserId,
        [string]$OutputFile = ""
    )

    Write-Log "Exporting configuration for project $ProjectId" "INFO"

    $params = @{
        "team" = "export-config"
        "project-id" = $ProjectId
        "user-id" = $UserId
    }

    if ($OutputFile) { $params["output-file"] = $OutputFile }

    $result = Invoke-PythonCLI -Command "src.project_management.advanced_cli" -Parameters $params

    if ($result) {
        Write-Log "Configuration exported successfully" "SUCCESS"
        return $result
    } else {
        Write-Log "Failed to export configuration" "ERROR"
        return $null
    }
}

# Sample Configuration Generators
function New-SampleScalingRules {
    param(
        [string]$OutputFile = ".\temp\scaling-rules.json"
    )

    $scalingRules = @(
        @{
            resource_type = "cpu"
            metric_name = "cpu_usage"
            scale_up_threshold = 80.0
            scale_down_threshold = 20.0
            min_instances = 2
            max_instances = 10
            cooldown_period = 300
        },
        @{
            resource_type = "memory"
            metric_name = "memory_usage"
            scale_up_threshold = 85.0
            scale_down_threshold = 30.0
            min_instances = 2
            max_instances = 8
            cooldown_period = 300
        }
    )

    $scalingRules | ConvertTo-Json -Depth 3 | Out-File -FilePath $OutputFile -Encoding UTF8
    Write-Log "Sample scaling rules created: $OutputFile" "SUCCESS"
    return $OutputFile
}

function New-SampleWorkflowTasks {
    param(
        [string]$OutputFile = ".\temp\workflow-tasks.json"
    )

    $tasks = @(
        @{
            name = "Backup Database"
            task_type = "action"
            action = "backup"
            parameters = @{
                type = "database"
                location = "/backups/"
            }
        },
        @{
            name = "Deploy Application"
            task_type = "action"
            action = "deploy"
            parameters = @{
                version = "latest"
                environment = "production"
            }
            dependencies = @()
        },
        @{
            name = "Run Health Checks"
            task_type = "action"
            action = "test"
            parameters = @{
                test_suite = "health"
                url = "https://api.example.com/health"
            }
            dependencies = @()
        },
        @{
            name = "Notify Team"
            task_type = "action"
            action = "notify"
            parameters = @{
                channel = "slack"
                message = "Deployment completed successfully"
            }
            dependencies = @()
        }
    )

    $tasks | ConvertTo-Json -Depth 3 | Out-File -FilePath $OutputFile -Encoding UTF8
    Write-Log "Sample workflow tasks created: $OutputFile" "SUCCESS"
    return $OutputFile
}

function New-SampleMetrics {
    param(
        [string]$OutputFile = ".\temp\current-metrics.json"
    )

    $metrics = @{
        cpu_usage = 75.5
        memory_usage = 68.2
        disk_usage = 45.8
        network_usage = 23.1
        response_time = 245.7
        error_rate = 0.02
    }

    $metrics | ConvertTo-Json -Depth 2 | Out-File -FilePath $OutputFile -Encoding UTF8
    Write-Log "Sample metrics created: $OutputFile" "SUCCESS"
    return $OutputFile
}

# Main execution logic
function Show-Help {
    Write-Host @"
Advanced Project Management Automation Script

USAGE:
    .\Advanced-ProjectManagement.ps1 -Action <action> [parameters]

ACTIONS:
    team          - Team management (add, list, invite members)
    analytics     - Analytics and reporting (metrics, reports, trends)
    automation    - Automation features (deployment, scaling)
    workflow      - Workflow management (create, execute, status)
    deploy        - Quick deployment
    scale         - Quick scaling setup
    report        - Quick report generation
    help          - Show this help message

EXAMPLES:
    # Team Management
    .\Advanced-ProjectManagement.ps1 -Action team -ProjectId "proj123" -UserId "user456"

    # Add a metric
    .\Advanced-ProjectManagement.ps1 -Action analytics -ProjectId "proj123" -Name "performance" -Value 85.5

    # Generate report
    .\Advanced-ProjectManagement.ps1 -Action report -ProjectId "proj123" -Type "summary"

    # Deploy project
    .\Advanced-ProjectManagement.ps1 -Action deploy -ProjectId "proj123" -Version "1.2.3" -Environment "production"

    # Setup auto scaling
    .\Advanced-ProjectManagement.ps1 -Action scale -ProjectId "proj123" -ConfigFile "scaling-rules.json"

PARAMETERS:
    -Action       Action to perform (team, analytics, automation, workflow, deploy, scale, report, help)
    -ProjectId    Project ID for operations
    -UserId       User ID for operations
    -Environment  Target environment (development, staging, production)
    -Version      Version for deployment
    -ConfigFile   Configuration file path
    -Detailed     Show detailed output
    -Verbose      Show verbose logging

"@
}

# Main execution
try {
    Write-Log "Advanced Project Management Script Started" "INFO"
    Write-Log "Action: $Action" "INFO"

    switch ($Action.ToLower()) {
        "team" {
            if (!$ProjectId -or !$UserId) {
                Write-Log "ProjectId and UserId are required for team operations" "ERROR"
                exit 1
            }

            $teamMembers = Get-TeamMembers -ProjectId $ProjectId -UserId $UserId
            if ($teamMembers) {
                Write-Host $teamMembers
            }
        }

        "analytics" {
            if (!$ProjectId) {
                Write-Log "ProjectId is required for analytics operations" "ERROR"
                exit 1
            }

            # Generate sample report
            $report = Get-ProjectReport -ProjectId $ProjectId -Type "summary" -PeriodDays 30
            if ($report) {
                Write-Host $report
            }
        }

        "automation" {
            if (!$ProjectId) {
                Write-Log "ProjectId is required for automation operations" "ERROR"
                exit 1
            }

            # Check scaling conditions with sample metrics
            $metricsFile = New-SampleMetrics
            $scalingResult = Test-ScalingConditions -ProjectId $ProjectId -MetricsFile $metricsFile
            if ($scalingResult) {
                Write-Host $scalingResult
            }
        }

        "workflow" {
            if (!$ProjectId) {
                Write-Log "ProjectId is required for workflow operations" "ERROR"
                exit 1
            }

            # Create sample workflow
            $tasksFile = New-SampleWorkflowTasks
            $workflow = New-Workflow -ProjectId $ProjectId -Name "Sample Workflow" -TasksFile $tasksFile
            if ($workflow) {
                Write-Host $workflow
            }
        }

        "deploy" {
            if (!$ProjectId -or !$Version -or !$Environment) {
                Write-Log "ProjectId, Version, and Environment are required for deployment" "ERROR"
                exit 1
            }

            $deployment = Start-ProjectDeployment -ProjectId $ProjectId -Version $Version -Environment $Environment -TriggeredBy "automation-script"
            if ($deployment) {
                Write-Host $deployment
            }
        }

        "scale" {
            if (!$ProjectId) {
                Write-Log "ProjectId is required for scaling operations" "ERROR"
                exit 1
            }

            $rulesFile = if ($ConfigFile) { $ConfigFile } else { New-SampleScalingRules }
            $scalingSetup = Set-AutoScaling -ProjectId $ProjectId -RulesFile $rulesFile
            if ($scalingSetup) {
                Write-Log "Auto scaling setup completed" "SUCCESS"
            }
        }

        "report" {
            if (!$ProjectId) {
                Write-Log "ProjectId is required for report generation" "ERROR"
                exit 1
            }

            $report = Get-ProjectReport -ProjectId $ProjectId -Type "summary" -PeriodDays 30
            if ($report) {
                Write-Host $report
            }
        }

        "help" {
            Show-Help
        }

        default {
            Write-Log "Unknown action: $Action" "ERROR"
            Show-Help
            exit 1
        }
    }

    Write-Log "Advanced Project Management Script Completed Successfully" "SUCCESS"

} catch {
    Write-Log "Script execution failed: $($_.Exception.Message)" "ERROR"
    if ($Verbose) {
        Write-Log "Stack trace: $($_.ScriptStackTrace)" "ERROR"
    }
    exit 1
} finally {
    # Cleanup temporary files
    if (Test-Path $Config.TempDir) {
        Get-ChildItem -Path $Config.TempDir -File | Remove-Item -Force
    }
}
