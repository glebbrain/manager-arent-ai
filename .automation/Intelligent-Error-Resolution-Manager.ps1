# 🔍 Intelligent Error Resolution Manager v2.8.0
# PowerShell script for managing the Intelligent Error Resolution service.
# Version: 2.8.0
# Last Updated: 2025-02-01

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "status", # Possible actions: status, start, stop, restart, deploy, get-config, analyze-error, resolve-error, get-errors, get-resolutions, get-insights
    
    [Parameter(Mandatory=$false)]
    [string]$ErrorMessage = "TypeError: Cannot read property 'name' of undefined", # Error message to analyze
    
    [Parameter(Mandatory=$false)]
    [string]$StackTrace = "at Object.<anonymous> (/app/index.js:10:15)", # Stack trace
    
    [Parameter(Mandatory=$false)]
    [string]$ErrorId, # Error ID for resolution
    
    [Parameter(Mandatory=$false)]
    [string]$Solution = "Added null check before accessing object property", # Solution description
    
    [Parameter(Mandatory=$false)]
    [string]$Severity, # Error severity filter (critical, high, medium, low, info)
    
    [Parameter(Mandatory=$false)]
    [string]$Type, # Error type filter (syntax, runtime, logical, etc.)
    
    [Parameter(Mandatory=$false)]
    [string]$Status, # Resolution status filter (open, investigating, resolved, etc.)
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceUrl = "http://localhost:3029",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host "🔍 Intelligent Error Resolution Manager v2.8.0" -ForegroundColor Cyan
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
        Write-Host "Errors: $($response.errors)" -ForegroundColor Green
        Write-Host "Resolutions: $($response.resolutions)" -ForegroundColor Green
        Write-Host "Patterns: $($response.patterns)" -ForegroundColor Green
        Write-Host "Solutions: $($response.solutions)" -ForegroundColor Green
    } else {
        Write-Host "Service is not reachable or returned an error." -ForegroundColor Red
    }
}

function Get-ServiceConfig {
    Write-Host "Retrieving Intelligent Error Resolution configuration from $ServiceUrl/api/config..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/config"
    if ($response) {
        Write-Host "Configuration:" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 5 | Write-Host
    } else {
        Write-Host "Failed to retrieve service config." -ForegroundColor Red
    }
}

function Analyze-Error {
    param(
        [string]$Message,
        [string]$Stack
    )
    Write-Host "Analyzing error: $Message" -ForegroundColor Yellow
    
    $body = @{
        message = $Message
        stackTrace = $Stack
        context = @{
            environment = "production"
            version = "1.0.0"
            userAgent = "PowerShell/7.0"
        }
        logs = @(
            @{
                level = "error"
                message = $Message
                timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
            }
        )
    }
    
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/analyze" -Method "POST" -Body $body
    if ($response) {
        Write-Host "Error Analysis Result:" -ForegroundColor Green
        Write-Host "Success: $($response.success)" -ForegroundColor Green
        Write-Host "Error ID: $($response.error.id)" -ForegroundColor Green
        Write-Host "Severity: $($response.error.severity)" -ForegroundColor Green
        Write-Host "Category: $($response.error.category)" -ForegroundColor Green
        Write-Host "Confidence: $([math]::Round($response.error.confidence, 3))" -ForegroundColor Green
        Write-Host "Processing Time: $($response.metadata.processingTime)ms" -ForegroundColor Green
        
        if ($response.error.solutions -and $response.error.solutions.Count -gt 0) {
            Write-Host "Recommended Solutions:" -ForegroundColor Cyan
            $response.error.solutions | ForEach-Object {
                Write-Host "  - $($_.title) (Confidence: $([math]::Round($_.confidence, 3)), Priority: $($_.priority))" -ForegroundColor Yellow
                Write-Host "    $($_.description)" -ForegroundColor Gray
            }
        }
        
        if ($response.error.rootCause -and $response.error.rootCause.Count -gt 0) {
            Write-Host "Root Cause Analysis:" -ForegroundColor Magenta
            $response.error.rootCause | ForEach-Object {
                Write-Host "  - $($_.description) (Confidence: $([math]::Round($_.confidence, 3)))" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "Error analysis failed." -ForegroundColor Red
    }
}

function Resolve-Error {
    param(
        [string]$Id,
        [string]$SolutionText
    )
    Write-Host "Resolving error with ID: $Id" -ForegroundColor Yellow
    Write-Host "Solution: $SolutionText" -ForegroundColor Yellow
    
    $body = @{
        solution = $SolutionText
        description = "Error resolved via PowerShell script"
        assignedTo = "system@example.com"
        notes = "Automated resolution"
    }
    
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/resolve/$Id" -Method "POST" -Body $body
    if ($response) {
        Write-Host "Error Resolution Result:" -ForegroundColor Green
        Write-Host "Success: $($response.success)" -ForegroundColor Green
        Write-Host "Resolution ID: $($response.resolution.id)" -ForegroundColor Green
        Write-Host "Status: $($response.resolution.status)" -ForegroundColor Green
        Write-Host "Efficiency: $([math]::Round($response.efficiency, 3))" -ForegroundColor Green
        Write-Host "Created: $($response.resolution.createdAt)" -ForegroundColor Green
        if ($response.resolution.resolvedAt) {
            Write-Host "Resolved: $($response.resolution.resolvedAt)" -ForegroundColor Green
        }
    } else {
        Write-Host "Error resolution failed." -ForegroundColor Red
    }
}

function Get-Errors {
    Write-Host "Retrieving errors..." -ForegroundColor Yellow
    $uri = "$ServiceUrl/api/errors"
    $params = @()
    
    if ($Severity) { $params += "severity=$Severity" }
    if ($Type) { $params += "type=$Type" }
    if ($Status) { $params += "status=$Status" }
    
    if ($params.Count -gt 0) {
        $uri += "?" + ($params -join "&")
    }
    
    $response = Invoke-HttpRequest -Uri $uri
    if ($response) {
        Write-Host "Errors (Total: $($response.total)):" -ForegroundColor Green
        $response.errors | ForEach-Object {
            $color = switch ($_.severity) {
                "critical" { "Red" }
                "high" { "Red" }
                "medium" { "Yellow" }
                "low" { "Green" }
                "info" { "Cyan" }
                default { "White" }
            }
            
            Write-Host "  ID: $($_.id)" -ForegroundColor White
            Write-Host "  Message: $($_.message)" -ForegroundColor White
            Write-Host "  Severity: $($_.severity)" -ForegroundColor $color
            Write-Host "  Category: $($_.category)" -ForegroundColor White
            Write-Host "  Status: $($_.status)" -ForegroundColor White
            Write-Host "  Confidence: $([math]::Round($_.confidence, 3))" -ForegroundColor White
            Write-Host "  Created: $($_.createdAt)" -ForegroundColor White
            Write-Host "  ---" -ForegroundColor Gray
        }
    } else {
        Write-Host "Failed to retrieve errors." -ForegroundColor Red
    }
}

function Get-Resolutions {
    Write-Host "Retrieving resolutions..." -ForegroundColor Yellow
    $uri = "$ServiceUrl/api/resolutions"
    if ($Status) {
        $uri += "?status=$Status"
    }
    
    $response = Invoke-HttpRequest -Uri $uri
    if ($response) {
        Write-Host "Resolutions (Total: $($response.total)):" -ForegroundColor Green
        $response.resolutions | ForEach-Object {
            $color = switch ($_.status) {
                "resolved" { "Green" }
                "in_progress" { "Yellow" }
                "investigating" { "Cyan" }
                "open" { "White" }
                default { "White" }
            }
            
            Write-Host "  ID: $($_.id)" -ForegroundColor White
            Write-Host "  Error ID: $($_.errorId)" -ForegroundColor White
            Write-Host "  Status: $($_.status)" -ForegroundColor $color
            Write-Host "  Solution: $($_.solution)" -ForegroundColor White
            Write-Host "  Assigned To: $($_.assignedTo)" -ForegroundColor White
            Write-Host "  Created: $($_.createdAt)" -ForegroundColor White
            if ($_.resolvedAt) {
                Write-Host "  Resolved: $($_.resolvedAt)" -ForegroundColor Green
            }
            Write-Host "  ---" -ForegroundColor Gray
        }
    } else {
        Write-Host "Failed to retrieve resolutions." -ForegroundColor Red
    }
}

function Get-Insights {
    Write-Host "Retrieving error resolution insights..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/insights"
    if ($response) {
        Write-Host "Error Resolution Insights:" -ForegroundColor Green
        Write-Host "  Total Errors: $($response.insights.totalErrors)" -ForegroundColor White
        Write-Host "  Resolved Errors: $($response.insights.resolvedErrors)" -ForegroundColor White
        Write-Host "  Average Resolution Time: $([math]::Round($response.insights.averageResolutionTime, 2)) minutes" -ForegroundColor White
        
        if ($response.insights.commonErrorTypes -and $response.insights.commonErrorTypes.Count -gt 0) {
            Write-Host "  Common Error Types:" -ForegroundColor Cyan
            $response.insights.commonErrorTypes | ForEach-Object {
                Write-Host "    - $($_.type): $($_.count) occurrences" -ForegroundColor Yellow
            }
        }
        
        if ($response.insights.resolutionTrends -and $response.insights.resolutionTrends.Count -gt 0) {
            Write-Host "  Resolution Trends (Last 7 days):" -ForegroundColor Cyan
            $response.insights.resolutionTrends | ForEach-Object {
                Write-Host "    - $($_.date): $($_.count) resolutions" -ForegroundColor Yellow
            }
        }
        
        if ($response.insights.topSolutions -and $response.insights.topSolutions.Count -gt 0) {
            Write-Host "  Top Solutions:" -ForegroundColor Cyan
            $response.insights.topSolutions | ForEach-Object {
                Write-Host "    - $($_.solution): $($_.count) uses" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "Failed to retrieve insights." -ForegroundColor Red
    }
}

switch ($Action) {
    "status" {
        Get-ServiceStatus
    }
    "start" {
        Write-Host "Starting Intelligent Error Resolution service (manual action required for actual process start)..." -ForegroundColor Yellow
        Write-Host "Please navigate to 'intelligent-error-resolution' directory and run 'npm start' or 'npm run dev'." -ForegroundColor DarkYellow
    }
    "stop" {
        Write-Host "Stopping Intelligent Error Resolution service (manual action required for actual process stop)..." -ForegroundColor Yellow
        Write-Host "Please manually stop the running Node.js process." -ForegroundColor DarkYellow
    }
    "restart" {
        Write-Host "Restarting Intelligent Error Resolution service (manual action required)..." -ForegroundColor Yellow
        Write-Host "Please manually stop and then start the running Node.js process." -ForegroundColor DarkYellow
    }
    "deploy" {
        Write-Host "Deployment of Intelligent Error Resolution service (placeholder - implement actual deployment logic)..." -ForegroundColor Yellow
        Write-Host "This would typically involve Docker/Kubernetes deployment scripts." -ForegroundColor DarkYellow
    }
    "get-config" {
        Get-ServiceConfig
    }
    "analyze-error" {
        Analyze-Error -Message $ErrorMessage -Stack $StackTrace
    }
    "resolve-error" {
        if (-not $ErrorId) {
            Write-Error "ErrorId is required for 'resolve-error' action."
            break
        }
        Resolve-Error -Id $ErrorId -SolutionText $Solution
    }
    "get-errors" {
        Get-Errors
    }
    "get-resolutions" {
        Get-Resolutions
    }
    "get-insights" {
        Get-Insights
    }
    default {
        Write-Host "Invalid action specified. Supported actions: status, start, stop, restart, deploy, get-config, analyze-error, resolve-error, get-errors, get-resolutions, get-insights." -ForegroundColor Red
    }
}

Write-Host "🔍 Intelligent Error Resolution Manager finished." -ForegroundColor Cyan
