# ⚙️ Advanced Workflow Engine Manager v2.7.0
# PowerShell script for managing the Advanced Workflow Engine service.
# Version: 2.7.0
# Last Updated: 2025-02-01

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "status", # Possible actions: status, start, stop, restart, deploy, create-workflow, execute-workflow, get-workflows, get-executions, get-analytics, test-connection
    
    [Parameter(Mandatory=$false)]
    [string]$WorkflowId = "", # Workflow ID for specific operations
    
    [Parameter(Mandatory=$false)]
    [string]$WorkflowName = "Test Workflow", # Name for new workflow
    
    [Parameter(Mandatory=$false)]
    [string]$WorkflowType = "sequential", # Type of workflow to create
    
    [Parameter(Mandatory=$false)]
    [string]$InputData = '{"text": "Hello World"}', # Input data for workflow execution
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceUrl = "http://localhost:3019",
    
    [Parameter(Mandatory=$false)]
    [string]$Period = "24h", # Period for analytics (1h, 24h, 7d, 30d)
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host "⚙️ Advanced Workflow Engine Manager v2.7.0" -ForegroundColor Cyan
Write-Host "📅 Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

function Invoke-HttpRequest {
    param(
        [string]$Uri,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        $Body = $null
    )
    
    $params = @{
        Uri = $Uri
        Method = $Method
        Headers = $Headers
        ContentType = "application/json"
    }
    
    if ($Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 10)
    }
    
    try {
        $response = Invoke-RestMethod @params
        return $response
    } catch {
        Write-Error "HTTP Request failed: $($_.Exception.Message)"
        return $null
    }
}

function Get-ServiceStatus {
    Write-Host "Checking service status at $ServiceUrl/health..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/health"
    if ($response) {
        Write-Host "Service Status: $($response.status)" -ForegroundColor Green
        Write-Host "Version: $($response.version)" -ForegroundColor Green
        Write-Host "Features: $($response.features.Count) enabled" -ForegroundColor Green
        Write-Host "Workflows: $($response.workflows)" -ForegroundColor Green
        Write-Host "Timestamp: $($response.timestamp)" -ForegroundColor Green
    } else {
        Write-Host "Service is not reachable or returned an error." -ForegroundColor Red
    }
}

function Get-ServiceConfig {
    Write-Host "Retrieving workflow engine configuration from $ServiceUrl/api/config..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/config"
    if ($response) {
        Write-Host "Configuration:" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 5 | Write-Host
    } else {
        Write-Host "Failed to retrieve configuration." -ForegroundColor Red
    }
}

function Create-TestWorkflow {
    param(
        [string]$Name,
        [string]$Type
    )
    Write-Host "Creating test workflow '$Name' of type '$Type'..." -ForegroundColor Yellow
    
    $workflowData = @{
        name = $Name
        description = "Test workflow created by PowerShell script"
        type = $Type
        tasks = @(
            @{
                id = "task1"
                name = "Validate Input"
                type = "data"
                config = @{
                    operation = "validate"
                    data = "`$input"
                    config = @{
                        schema = "string"
                    }
                }
            },
            @{
                id = "task2"
                name = "Process Data"
                type = "data"
                config = @{
                    operation = "transform"
                    data = "`$task1.result"
                    config = @{
                        transform = "uppercase"
                    }
                }
            },
            @{
                id = "task3"
                name = "Send Notification"
                type = "notification"
                config = @{
                    type = "email"
                    recipient = "admin@example.com"
                    subject = "Workflow Completed"
                    message = "Workflow execution completed successfully"
                }
            }
        )
        connections = @(
            @{
                from = "task1"
                to = "task2"
            },
            @{
                from = "task2"
                to = "task3"
            }
        )
        variables = @{}
        settings = @{
            timeout = 30000
            retryCount = 3
        }
    }
    
    $body = @{
        workflowData = $workflowData
    }
    
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/workflows" -Method "POST" -Body $body
    if ($response) {
        Write-Host "Workflow created successfully:" -ForegroundColor Green
        Write-Host "Workflow ID: $($response.id)" -ForegroundColor Cyan
        Write-Host "Name: $($response.name)" -ForegroundColor Cyan
        Write-Host "Type: $($response.type)" -ForegroundColor Cyan
        Write-Host "Status: $($response.status)" -ForegroundColor Cyan
        return $response.id
    } else {
        Write-Host "Failed to create workflow." -ForegroundColor Red
        return $null
    }
}

function Execute-Workflow {
    param(
        [string]$Id,
        [string]$Input
    )
    Write-Host "Executing workflow $Id with input: $Input..." -ForegroundColor Yellow
    
    $body = @{
        inputData = ($Input | ConvertFrom-Json)
        options = @{
            timeout = 30000
        }
    }
    
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/workflows/$Id/execute" -Method "POST" -Body $body
    if ($response) {
        Write-Host "Workflow execution started:" -ForegroundColor Green
        Write-Host "Execution ID: $($response.executionId)" -ForegroundColor Cyan
        Write-Host "Success: $($response.success)" -ForegroundColor Cyan
        if ($response.result) {
            Write-Host "Result: $($response.result | ConvertTo-Json -Compress)" -ForegroundColor Cyan
        }
        if ($response.duration) {
            Write-Host "Duration: $($response.duration)ms" -ForegroundColor Cyan
        }
        return $response.executionId
    } else {
        Write-Host "Failed to execute workflow." -ForegroundColor Red
        return $null
    }
}

function Get-Workflows {
    Write-Host "Retrieving workflows from $ServiceUrl/api/workflows..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/workflows"
    if ($response) {
        Write-Host "Workflows found: $($response.total)" -ForegroundColor Green
        foreach ($workflow in $response.workflows) {
            Write-Host "  - ID: $($workflow.id)" -ForegroundColor Cyan
            Write-Host "    Name: $($workflow.name)" -ForegroundColor White
            Write-Host "    Type: $($workflow.type)" -ForegroundColor White
            Write-Host "    Status: $($workflow.status)" -ForegroundColor White
            Write-Host "    Tasks: $($workflow.tasks.Count)" -ForegroundColor White
            Write-Host ""
        }
    } else {
        Write-Host "Failed to retrieve workflows." -ForegroundColor Red
    }
}

function Get-Executions {
    Write-Host "Retrieving executions from $ServiceUrl/api/executions..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/executions"
    if ($response) {
        Write-Host "Executions found: $($response.total)" -ForegroundColor Green
        foreach ($execution in $response.executions) {
            Write-Host "  - ID: $($execution.id)" -ForegroundColor Cyan
            Write-Host "    Workflow ID: $($execution.workflowId)" -ForegroundColor White
            Write-Host "    Status: $($execution.status)" -ForegroundColor White
            Write-Host "    Start Time: $($execution.startTime)" -ForegroundColor White
            if ($execution.endTime) {
                Write-Host "    End Time: $($execution.endTime)" -ForegroundColor White
            }
            Write-Host "    Progress: $($execution.progress)%" -ForegroundColor White
            Write-Host ""
        }
    } else {
        Write-Host "Failed to retrieve executions." -ForegroundColor Red
    }
}

function Get-Analytics {
    param(
        [string]$Period
    )
    Write-Host "Retrieving analytics for period: $Period..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/analytics?period=$Period"
    if ($response) {
        Write-Host "Analytics for period $($response.period):" -ForegroundColor Green
        Write-Host "  Total Workflows: $($response.overview.totalWorkflows)" -ForegroundColor Cyan
        Write-Host "  Total Executions: $($response.overview.totalExecutions)" -ForegroundColor Cyan
        Write-Host "  Total Tasks: $($response.overview.totalTasks)" -ForegroundColor Cyan
        Write-Host "  Average Execution Time: $($response.overview.averageExecutionTime)ms" -ForegroundColor Cyan
        Write-Host "  Success Rate: $([math]::Round($response.overview.successRate * 100, 2))%" -ForegroundColor Cyan
        Write-Host "  Error Rate: $([math]::Round($response.overview.errorRate * 100, 2))%" -ForegroundColor Cyan
    } else {
        Write-Host "Failed to retrieve analytics." -ForegroundColor Red
    }
}

function Test-ServiceConnection {
    Write-Host "Testing connection to workflow engine service..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri "$ServiceUrl/health" -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Connection successful!" -ForegroundColor Green
            Write-Host "Service is responding on port $($ServiceUrl.Split(':')[2])" -ForegroundColor Green
        } else {
            Write-Host "❌ Connection failed with status: $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Connection failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

switch ($Action) {
    "status" {
        Get-ServiceStatus
    }
    "start" {
        Write-Host "Starting Advanced Workflow Engine service (manual action required for actual process start)..." -ForegroundColor Yellow
        Write-Host "Please navigate to 'advanced-workflow-engine' directory and run 'npm start' or 'npm run dev'." -ForegroundColor DarkYellow
    }
    "stop" {
        Write-Host "Stopping Advanced Workflow Engine service (manual action required for actual process stop)..." -ForegroundColor Yellow
        Write-Host "Please manually stop the running Node.js process." -ForegroundColor DarkYellow
    }
    "restart" {
        Write-Host "Restarting Advanced Workflow Engine service (manual action required)..." -ForegroundColor Yellow
        Write-Host "Please manually stop and then start the running Node.js process." -ForegroundColor DarkYellow
    }
    "deploy" {
        Write-Host "Deployment of Advanced Workflow Engine service (placeholder - implement actual deployment logic)..." -ForegroundColor Yellow
        Write-Host "This would typically involve Docker/Kubernetes deployment scripts." -ForegroundColor DarkYellow
    }
    "create-workflow" {
        $workflowId = Create-TestWorkflow -Name $WorkflowName -Type $WorkflowType
        if ($workflowId) {
            Write-Host "Workflow created with ID: $workflowId" -ForegroundColor Green
        }
    }
    "execute-workflow" {
        if ($WorkflowId) {
            $executionId = Execute-Workflow -Id $WorkflowId -Input $InputData
            if ($executionId) {
                Write-Host "Workflow execution started with ID: $executionId" -ForegroundColor Green
            }
        } else {
            Write-Host "WorkflowId parameter is required for execute-workflow action." -ForegroundColor Red
        }
    }
    "get-workflows" {
        Get-Workflows
    }
    "get-executions" {
        Get-Executions
    }
    "get-analytics" {
        Get-Analytics -Period $Period
    }
    "test-connection" {
        Test-ServiceConnection
    }
    "get-config" {
        Get-ServiceConfig
    }
    default {
        Write-Host "Invalid action specified. Supported actions:" -ForegroundColor Red
        Write-Host "  status, start, stop, restart, deploy" -ForegroundColor Yellow
        Write-Host "  create-workflow, execute-workflow, get-workflows, get-executions" -ForegroundColor Yellow
        Write-Host "  get-analytics, test-connection, get-config" -ForegroundColor Yellow
    }
}

Write-Host "🚀 Advanced Workflow Engine Manager finished." -ForegroundColor Cyan
