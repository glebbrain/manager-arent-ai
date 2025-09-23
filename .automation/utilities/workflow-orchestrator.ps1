# ManagerAgentAI Workflow Orchestrator - PowerShell Version
# System for orchestrating complex workflows

param(
    [Parameter(Position=0)]
    [string]$Command,
    
    [Parameter(Position=1)]
    [string]$WorkflowName,
    
    [Parameter(Position=2)]
    [string]$WorkflowFile,
    
    [Parameter(Position=3)]
    [string]$Context,
    
    [Parameter(Position=4)]
    [string]$ExecutionId,
    
    [switch]$Help
)

$WorkflowPath = Join-Path $PSScriptRoot ".." "workflows"
$Workflows = @{}
$ActiveWorkflows = @{}

function Show-Help {
    Write-Host @"
🔄 ManagerAgentAI Workflow Orchestrator

Usage:
  .\workflow-orchestrator.ps1 <command> [options]

Commands:
  define <name> <file>        Define workflow from JSON file
  execute <name> [context]    Execute workflow with optional context
  list                        List all workflows
  stop <execution-id>         Stop running workflow
  status                      Show active workflows
  init                        Initialize with predefined workflows

Examples:
  .\workflow-orchestrator.ps1 define my-workflow workflow.json
  .\workflow-orchestrator.ps1 execute create-project '{"projectName":"my-app"}'
  .\workflow-orchestrator.ps1 list
  .\workflow-orchestrator.ps1 init
"@
}

function Ensure-WorkflowDirectory {
    if (-not (Test-Path $WorkflowPath)) {
        New-Item -ItemType Directory -Path $WorkflowPath -Force | Out-Null
    }
}

function New-Workflow {
    param(
        [string]$Name,
        [object]$Definition
    )
    
    $workflow = @{
        name = $Name
        id = New-Guid
        definition = $Definition
        status = "defined"
        createdAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        updatedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    }
    
    $Workflows[$Name] = $workflow
    Save-Workflow -Workflow $workflow
    
    Write-Host "✅ Workflow '$Name' defined successfully"
    return $workflow
}

function Save-Workflow {
    param([object]$Workflow)
    
    $workflowFile = Join-Path $WorkflowPath "$($Workflow.name).json"
    $Workflow | ConvertTo-Json -Depth 10 | Set-Content $workflowFile
}

function Load-Workflow {
    param([string]$Name)
    
    $workflowFile = Join-Path $WorkflowPath "$Name.json"
    if (Test-Path $workflowFile) {
        $workflow = Get-Content $workflowFile | ConvertFrom-Json
        $Workflows[$Name] = $workflow
        return $workflow
    }
    return $null
}

function Start-Workflow {
    param(
        [string]$Name,
        [hashtable]$Context = @{}
    )
    
    $workflow = $Workflows[$Name]
    if (-not $workflow) {
        $workflow = Load-Workflow -Name $Name
    }
    
    if (-not $workflow) {
        throw "Workflow '$Name' not found"
    }
    
    $executionId = [System.Guid]::NewGuid().ToString()
    $execution = @{
        id = $executionId
        workflowName = $Name
        status = "running"
        context = $Context
        steps = @()
        startTime = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        endTime = $null
        error = $null
    }
    
    $ActiveWorkflows[$executionId] = $execution
    Write-Host "🚀 Starting workflow '$Name' (ID: $executionId)"
    
    try {
        Start-Steps -Steps $workflow.definition.steps -Execution $execution
        $execution.status = "completed"
        $execution.endTime = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        Write-Host "✅ Workflow '$Name' completed successfully"
    } catch {
        $execution.status = "failed"
        $execution.error = $_.Exception.Message
        $execution.endTime = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        Write-Host "❌ Workflow '$Name' failed: $($_.Exception.Message)"
        throw
    } finally {
        $ActiveWorkflows.Remove($executionId)
    }
    
    return $execution
}

function Start-Steps {
    param(
        [array]$Steps,
        [object]$Execution
    )
    
    foreach ($step in $Steps) {
        $stepExecution = @{
            id = [System.Guid]::NewGuid().ToString()
            name = $step.name
            type = $step.type
            status = "running"
            startTime = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            endTime = $null
            result = $null
            error = $null
        }
        
        $Execution.steps += $stepExecution
        Write-Host "  🔄 Executing step: $($step.name)"
        
        try {
            $stepExecution.result = Invoke-Step -Step $step -Context $Execution.context
            $stepExecution.status = "completed"
            $stepExecution.endTime = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            Write-Host "  ✅ Step completed: $($step.name)"
        } catch {
            $stepExecution.status = "failed"
            $stepExecution.error = $_.Exception.Message
            $stepExecution.endTime = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            Write-Host "  ❌ Step failed: $($step.name) - $($_.Exception.Message)"
            
            if ($step.onError -eq "stop") {
                throw
            } elseif ($step.onError -eq "continue") {
                continue
            } elseif ($step.onError -eq "retry") {
                $retryCount = $stepExecution.retryCount ?? 0
                if ($retryCount -lt ($step.maxRetries ?? 3)) {
                    $stepExecution.retryCount = $retryCount + 1
                    $stepExecution.status = "retrying"
                    Write-Host "  🔄 Retrying step: $($step.name) (attempt $($retryCount + 1))"
                    Start-Sleep -Milliseconds ($step.retryDelay ?? 1000)
                    continue
                } else {
                    throw
                }
            }
        }
    }
}

function Invoke-Step {
    param(
        [object]$Step,
        [hashtable]$Context
    )
    
    switch ($Step.type) {
        "command" {
            return Invoke-Command -Command $Step.command -Context $Context
        }
        "script" {
            return Invoke-Script -Script $Step.script -Context $Context
        }
        "condition" {
            return Test-Condition -Condition $Step.condition -Context $Context
        }
        "parallel" {
            return Invoke-Parallel -Steps $Step.steps -Context $Context
        }
        "sequential" {
            return Invoke-Sequential -Steps $Step.steps -Context $Context
        }
        "wait" {
            return Start-Wait -Duration $Step.duration -Context $Context
        }
        "http" {
            return Invoke-HttpRequest -Request $Step.request -Context $Context
        }
        "file" {
            return Invoke-FileOperation -Operation $Step.operation -Context $Context
        }
        "notification" {
            return Send-Notification -Notification $Step.notification -Context $Context
        }
        default {
            throw "Unknown step type: $($Step.type)"
        }
    }
}

function Invoke-Command {
    param(
        [string]$Command,
        [hashtable]$Context
    )
    
    $processedCommand = Expand-Template -Template $Command -Context $Context
    
    try {
        $result = Invoke-Expression $processedCommand
        return @{ success = $true; output = $result }
    } catch {
        return @{ success = $false; error = $_.Exception.Message; output = $_.Exception.Message }
    }
}

function Invoke-Script {
    param(
        [string]$Script,
        [hashtable]$Context
    )
    
    $scriptPath = Resolve-Path $Script
    if (-not (Test-Path $scriptPath)) {
        throw "Script not found: $scriptPath"
    }
    
    $envVars = @{}
    $Context.GetEnumerator() | ForEach-Object {
        if ($_.Key -like "env.*") {
            $envVars[$_.Key.Substring(4)] = $_.Value
        }
    }
    
    $originalEnv = @{}
    $envVars.GetEnumerator() | ForEach-Object {
        $originalEnv[$_.Key] = $env:($_.Key)
        $env:($_.Key) = $_.Value
    }
    
    try {
        $result = & $scriptPath
        return @{ success = $true; output = $result }
    } catch {
        return @{ success = $false; error = $_.Exception.Message }
    } finally {
        $originalEnv.GetEnumerator() | ForEach-Object {
            $env:($_.Key) = $_.Value
        }
    }
}

function Test-Condition {
    param(
        [string]$Condition,
        [hashtable]$Context
    )
    
    $processedCondition = Expand-Template -Template $Condition -Context $Context
    $result = Invoke-Expression $processedCondition
    return @{ success = $true; result = $result }
}

function Invoke-Parallel {
    param(
        [array]$Steps,
        [hashtable]$Context
    )
    
    $jobs = @()
    foreach ($step in $Steps) {
        $job = Start-Job -ScriptBlock {
            param($Step, $Context)
            return Invoke-Step -Step $Step -Context $Context
        } -ArgumentList $step, $Context
        $jobs += $job
    }
    
    $results = $jobs | Wait-Job | Receive-Job
    $jobs | Remove-Job
    
    $success = $results | ForEach-Object { $_.success } | All-True
    return @{ success = $success; results = $results }
}

function Invoke-Sequential {
    param(
        [array]$Steps,
        [hashtable]$Context
    )
    
    $results = @()
    foreach ($step in $Steps) {
        $result = Invoke-Step -Step $step -Context $Context
        $results += $result
    }
    return @{ success = $true; results = $results }
}

function Start-Wait {
    param(
        [int]$Duration,
        [hashtable]$Context
    )
    
    Start-Sleep -Milliseconds $Duration
    return @{ success = $true; message = "Waited $Duration ms" }
}

function Invoke-HttpRequest {
    param(
        [object]$Request,
        [hashtable]$Context
    )
    
    $processedRequest = Expand-Template -Template ($Request | ConvertTo-Json) -Context $Context
    $requestConfig = $processedRequest | ConvertFrom-Json
    
    try {
        $response = Invoke-RestMethod -Uri $requestConfig.url -Method $requestConfig.method -TimeoutSec 30
        return @{ success = $true; data = $response; status = 200 }
    } catch {
        return @{ success = $false; error = $_.Exception.Message; status = $_.Exception.Response.StatusCode }
    }
}

function Invoke-FileOperation {
    param(
        [object]$Operation,
        [hashtable]$Context
    )
    
    $op = $Operation.operation
    $filePath = Expand-Template -Template $Operation.path -Context $Context
    $content = if ($Operation.content) { Expand-Template -Template $Operation.content -Context $Context } else { $null }
    
    switch ($op) {
        "read" {
            if (-not (Test-Path $filePath)) {
                throw "File not found: $filePath"
            }
            return @{ success = $true; content = Get-Content $filePath -Raw }
        }
        "write" {
            $fileDir = Split-Path $filePath -Parent
            if ($fileDir -and -not (Test-Path $fileDir)) {
                New-Item -ItemType Directory -Path $fileDir -Force | Out-Null
            }
            Set-Content -Path $filePath -Value $content
            return @{ success = $true; message = "File written: $filePath" }
        }
        "append" {
            Add-Content -Path $filePath -Value $content
            return @{ success = $true; message = "File appended: $filePath" }
        }
        "delete" {
            if (Test-Path $filePath) {
                Remove-Item $filePath -Force
                return @{ success = $true; message = "File deleted: $filePath" }
            }
            return @{ success = $true; message = "File not found: $filePath" }
        }
        "copy" {
            $destPath = Expand-Template -Template $Operation.destination -Context $Context
            Copy-Item $filePath $destPath
            return @{ success = $true; message = "File copied: $filePath -> $destPath" }
        }
        "move" {
            $destPath = Expand-Template -Template $Operation.destination -Context $Context
            Move-Item $filePath $destPath
            return @{ success = $true; message = "File moved: $filePath -> $destPath" }
        }
        default {
            throw "Unknown file operation: $op"
        }
    }
}

function Send-Notification {
    param(
        [object]$Notification,
        [hashtable]$Context
    )
    
    $processedNotification = Expand-Template -Template ($Notification | ConvertTo-Json) -Context $Context
    $notificationData = $processedNotification | ConvertFrom-Json
    
    Write-Host "📢 Notification: $($notificationData.message)"
    return @{ success = $true; message = "Notification sent" }
}

function Expand-Template {
    param(
        [string]$Template,
        [hashtable]$Context
    )
    
    $result = $Template
    $Context.GetEnumerator() | ForEach-Object {
        $result = $result -replace "\{\{$($_.Key)\}\}", $_.Value
    }
    return $result
}

function All-True {
    param([array]$Values)
    return $Values | Where-Object { $_ -ne $true } | Measure-Object | Select-Object -ExpandProperty Count -eq 0
}

function Show-Workflows {
    Write-Host "`n📋 Available Workflows:`n"
    if ($Workflows.Count -eq 0) {
        Write-Host "No workflows defined"
    } else {
        $Workflows.GetEnumerator() | ForEach-Object {
            Write-Host "- $($_.Value.name) ($($_.Value.status))"
            Write-Host "  ID: $($_.Value.id)"
            Write-Host "  Created: $($_.Value.createdAt)`n"
        }
    }
}

function Show-ActiveWorkflows {
    Write-Host "`n🔄 Active Workflows:`n"
    if ($ActiveWorkflows.Count -eq 0) {
        Write-Host "No active workflows"
    } else {
        $ActiveWorkflows.GetEnumerator() | ForEach-Object {
            Write-Host "- $($_.Value.workflowName) ($($_.Value.status))"
            Write-Host "  ID: $($_.Value.id)"
            Write-Host "  Started: $($_.Value.startTime)`n"
        }
    }
}

function Stop-Workflow {
    param([string]$ExecutionId)
    
    if ($ActiveWorkflows.ContainsKey($ExecutionId)) {
        $ActiveWorkflows[$ExecutionId].status = "stopped"
        $ActiveWorkflows[$ExecutionId].endTime = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        $ActiveWorkflows.Remove($ExecutionId)
        Write-Host "✅ Workflow execution '$ExecutionId' stopped"
        return $true
    } else {
        Write-Host "❌ Workflow execution '$ExecutionId' not found"
        return $false
    }
}

function Initialize-PredefinedWorkflows {
    # Load predefined workflows from files
    $workflowFiles = Get-ChildItem $WorkflowPath -Filter "*.json"
    
    foreach ($file in $workflowFiles) {
        $workflowName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
        $workflowDefinition = Get-Content $file.FullName | ConvertFrom-Json
        New-Workflow -Name $workflowName -Definition $workflowDefinition
    }
    
    Write-Host "✅ Predefined workflows initialized"
}

# Main execution
Ensure-WorkflowDirectory

if ($Help -or $Command -eq "help" -or $Command -eq "--help" -or $Command -eq "-h") {
    Show-Help
} elseif ($Command -eq "define") {
    if (-not $WorkflowName -or -not $WorkflowFile) {
        Write-Error "❌ Workflow name and file are required for define command"
        exit 1
    }
    $workflowDefinition = Get-Content $WorkflowFile | ConvertFrom-Json
    New-Workflow -Name $WorkflowName -Definition $workflowDefinition
} elseif ($Command -eq "execute") {
    if (-not $WorkflowName) {
        Write-Error "❌ Workflow name is required for execute command"
        exit 1
    }
    $context = if ($Context) { $Context | ConvertFrom-Json } else { @{} }
    try {
        $result = Start-Workflow -Name $WorkflowName -Context $context
        Write-Host "✅ Workflow '$WorkflowName' completed successfully"
        Write-Host "Result: $($result | ConvertTo-Json -Depth 3)"
    } catch {
        Write-Error "❌ Workflow '$WorkflowName' failed: $($_.Exception.Message)"
        exit 1
    }
} elseif ($Command -eq "list") {
    Show-Workflows
} elseif ($Command -eq "stop") {
    if (-not $ExecutionId) {
        Write-Error "❌ Execution ID is required for stop command"
        exit 1
    }
    Stop-Workflow -ExecutionId $ExecutionId
} elseif ($Command -eq "status") {
    Show-ActiveWorkflows
} elseif ($Command -eq "init") {
    Initialize-PredefinedWorkflows
} else {
    Write-Error "❌ Unknown command: $Command"
    Write-Host "Use -Help for available commands"
    exit 1
}
