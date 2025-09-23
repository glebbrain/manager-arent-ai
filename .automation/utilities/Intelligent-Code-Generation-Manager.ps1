# 🤖 Intelligent Code Generation Manager v2.8.0
# PowerShell script for managing the Intelligent Code Generation service.
# Version: 2.8.0
# Last Updated: 2025-02-01

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "status", # Possible actions: status, start, stop, restart, deploy, get-config, generate-code, get-generations, get-analytics
    
    [Parameter(Mandatory=$false)]
    [string]$Language = "javascript", # Language for code generation
    
    [Parameter(Mandatory=$false)]
    [string]$Type = "function", # Type of code generation
    
    [Parameter(Mandatory=$false)]
    [string]$Name = "testFunction", # Name for generated code
    
    [Parameter(Mandatory=$false)]
    [string]$Description = "A test function", # Description for generated code
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceUrl = "http://localhost:3025",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host "🤖 Intelligent Code Generation Manager v2.8.0" -ForegroundColor Cyan
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
        Write-Host "Generations: $($response.generations)" -ForegroundColor Green
        Write-Host "Patterns: $($response.patterns)" -ForegroundColor Green
        Write-Host "Suggestions: $($response.suggestions)" -ForegroundColor Green
    } else {
        Write-Host "Service is not reachable or returned an error." -ForegroundColor Red
    }
}

function Get-ServiceConfig {
    Write-Host "Retrieving Intelligent Code Generation configuration from $ServiceUrl/api/config..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/config"
    if ($response) {
        Write-Host "Configuration:" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 5 | Write-Host
    } else {
        Write-Host "Failed to retrieve service config." -ForegroundColor Red
    }
}

function Generate-Code {
    param(
        [string]$Lang,
        [string]$CodeType,
        [string]$FunctionName,
        [string]$FunctionDescription
    )
    Write-Host "Generating $CodeType code in $Lang for '$FunctionName'..." -ForegroundColor Yellow
    
    $body = @{
        language = $Lang
        type = $CodeType
        requirements = @{
            name = $FunctionName
            description = $FunctionDescription
            logic = "// Generated logic for $FunctionName"
        }
        context = @{
            project = "test-project"
            framework = "nodejs"
        }
    }
    
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/generate" -Method "POST" -Body $body
    if ($response) {
        Write-Host "Code Generation Result:" -ForegroundColor Green
        Write-Host "Success: $($response.success)" -ForegroundColor Green
        Write-Host "Quality: $($response.generation.quality)" -ForegroundColor Green
        Write-Host "Confidence: $($response.generation.confidence)" -ForegroundColor Green
        Write-Host "Processing Time: $($response.metadata.processingTime)ms" -ForegroundColor Green
        Write-Host "Generated Code:" -ForegroundColor Yellow
        Write-Host $response.generation.generatedCode -ForegroundColor White
        if ($response.generation.suggestions.Count -gt 0) {
            Write-Host "Suggestions:" -ForegroundColor Cyan
            $response.generation.suggestions | ForEach-Object {
                Write-Host "  - $($_.message) ($($_.priority))" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "Code generation failed." -ForegroundColor Red
    }
}

function Get-Generations {
    Write-Host "Retrieving code generations..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/generations"
    if ($response) {
        Write-Host "Generations (Total: $($response.total)):" -ForegroundColor Green
        $response.generations | ForEach-Object {
            Write-Host "  ID: $($_.id)" -ForegroundColor White
            Write-Host "  Language: $($_.language)" -ForegroundColor White
            Write-Host "  Type: $($_.type)" -ForegroundColor White
            Write-Host "  Quality: $($_.quality)" -ForegroundColor White
            Write-Host "  Confidence: $($_.confidence)" -ForegroundColor White
            Write-Host "  Created: $($_.createdAt)" -ForegroundColor White
            Write-Host "  ---" -ForegroundColor Gray
        }
    } else {
        Write-Host "Failed to retrieve generations." -ForegroundColor Red
    }
}

function Get-Analytics {
    Write-Host "Retrieving service analytics..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/analytics"
    if ($response) {
        Write-Host "Analytics:" -ForegroundColor Green
        Write-Host "  Total Generations: $($response.analytics.totalGenerations)" -ForegroundColor White
        Write-Host "  Successful Generations: $($response.analytics.successfulGenerations)" -ForegroundColor White
        Write-Host "  Average Quality: $($response.analytics.averageQuality)" -ForegroundColor White
        Write-Host "  Success Rate: $([math]::Round(($response.analytics.successfulGenerations / $response.analytics.totalGenerations) * 100, 2))%" -ForegroundColor White
    } else {
        Write-Host "Failed to retrieve analytics." -ForegroundColor Red
    }
}

switch ($Action) {
    "status" {
        Get-ServiceStatus
    }
    "start" {
        Write-Host "Starting Intelligent Code Generation service (manual action required for actual process start)..." -ForegroundColor Yellow
        Write-Host "Please navigate to 'intelligent-code-generation' directory and run 'npm start' or 'npm run dev'." -ForegroundColor DarkYellow
    }
    "stop" {
        Write-Host "Stopping Intelligent Code Generation service (manual action required for actual process stop)..." -ForegroundColor Yellow
        Write-Host "Please manually stop the running Node.js process." -ForegroundColor DarkYellow
    }
    "restart" {
        Write-Host "Restarting Intelligent Code Generation service (manual action required)..." -ForegroundColor Yellow
        Write-Host "Please manually stop and then start the running Node.js process." -ForegroundColor DarkYellow
    }
    "deploy" {
        Write-Host "Deployment of Intelligent Code Generation service (placeholder - implement actual deployment logic)..." -ForegroundColor Yellow
        Write-Host "This would typically involve Docker/Kubernetes deployment scripts." -ForegroundColor DarkYellow
    }
    "get-config" {
        Get-ServiceConfig
    }
    "generate-code" {
        Generate-Code -Lang $Language -CodeType $Type -FunctionName $Name -FunctionDescription $Description
    }
    "get-generations" {
        Get-Generations
    }
    "get-analytics" {
        Get-Analytics
    }
    default {
        Write-Host "Invalid action specified. Supported actions: status, start, stop, restart, deploy, get-config, generate-code, get-generations, get-analytics." -ForegroundColor Red
    }
}

Write-Host "🤖 Intelligent Code Generation Manager finished." -ForegroundColor Cyan
