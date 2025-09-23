# 🏢 Enterprise Integration Manager v2.7.0
# PowerShell script for managing the Enterprise Integration service.
# Version: 2.7.0
# Last Updated: 2025-02-01

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "status", # Possible actions: status, start, stop, restart, deploy, create-integration, execute-sync, get-integrations, get-sync-jobs, get-analytics, test-connection
    
    [Parameter(Mandatory=$false)]
    [string]$IntegrationId = "", # Integration ID for specific operations
    
    [Parameter(Mandatory=$false)]
    [string]$IntegrationName = "Test Integration", # Name for new integration
    
    [Parameter(Mandatory=$false)]
    [string]$IntegrationType = "api", # Type of integration to create
    
    [Parameter(Mandatory=$false)]
    [string]$SourceSystem = "SAP", # Source system for integration
    
    [Parameter(Mandatory=$false)]
    [string]$TargetSystem = "Salesforce", # Target system for integration
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceUrl = "http://localhost:3020",
    
    [Parameter(Mandatory=$false)]
    [string]$Period = "24h", # Period for analytics (1h, 24h, 7d, 30d)
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host "🏢 Enterprise Integration Manager v2.7.0" -ForegroundColor Cyan
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
        Write-Host "Integrations: $($response.integrations)" -ForegroundColor Green
        Write-Host "Timestamp: $($response.timestamp)" -ForegroundColor Green
    } else {
        Write-Host "Service is not reachable or returned an error." -ForegroundColor Red
    }
}

function Get-ServiceConfig {
    Write-Host "Retrieving integration engine configuration from $ServiceUrl/api/config..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/config"
    if ($response) {
        Write-Host "Configuration:" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 5 | Write-Host
    } else {
        Write-Host "Failed to retrieve configuration." -ForegroundColor Red
    }
}

function Create-TestIntegration {
    param(
        [string]$Name,
        [string]$Type,
        [string]$Source,
        [string]$Target
    )
    Write-Host "Creating test integration '$Name' of type '$Type' from '$Source' to '$Target'..." -ForegroundColor Yellow
    
    $integrationData = @{
        name = $Name
        description = "Test integration created by PowerShell script"
        type = $Type
        sourceSystem = $Source
        targetSystem = $Target
        configuration = @{
            sourceConfig = @{
                url = "https://$Source-api.example.com/data"
                method = "GET"
                headers = @{
                    "Authorization" = "Bearer test-token"
                }
            }
            targetConfig = @{
                url = "https://$Target-api.example.com/data"
                method = "POST"
                headers = @{
                    "Authorization" = "Bearer test-token"
                }
            }
            mapping = @{
                "source_id" = "target_id"
                "source_name" = "target_name"
                "source_email" = "target_email"
            }
        }
        mapping = @{
            "source_id" = "target_id"
            "source_name" = "target_name"
            "source_email" = "target_email"
        }
        schedule = "0 2 * * *"
    }
    
    $body = @{
        integrationData = $integrationData
    }
    
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/integrations" -Method "POST" -Body $body
    if ($response) {
        Write-Host "Integration created successfully:" -ForegroundColor Green
        Write-Host "Integration ID: $($response.id)" -ForegroundColor Cyan
        Write-Host "Name: $($response.name)" -ForegroundColor Cyan
        Write-Host "Type: $($response.type)" -ForegroundColor Cyan
        Write-Host "Source: $($response.sourceSystem)" -ForegroundColor Cyan
        Write-Host "Target: $($response.targetSystem)" -ForegroundColor Cyan
        Write-Host "Status: $($response.status)" -ForegroundColor Cyan
        return $response.id
    } else {
        Write-Host "Failed to create integration." -ForegroundColor Red
        return $null
    }
}

function Execute-IntegrationSync {
    param(
        [string]$Id,
        [hashtable]$Options = @{}
    )
    Write-Host "Executing integration sync for $Id..." -ForegroundColor Yellow
    
    $body = @{
        options = $Options
    }
    
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/integrations/$Id/sync" -Method "POST" -Body $body
    if ($response) {
        Write-Host "Integration sync started:" -ForegroundColor Green
        Write-Host "Sync Job ID: $($response.syncJobId)" -ForegroundColor Cyan
        Write-Host "Success: $($response.success)" -ForegroundColor Cyan
        if ($response.result) {
            Write-Host "Data Processed: $($response.result.dataProcessed) bytes" -ForegroundColor Cyan
            Write-Host "Records Processed: $($response.result.recordsProcessed)" -ForegroundColor Cyan
        }
        if ($response.duration) {
            Write-Host "Duration: $($response.duration)ms" -ForegroundColor Cyan
        }
        return $response.syncJobId
    } else {
        Write-Host "Failed to execute integration sync." -ForegroundColor Red
        return $null
    }
}

function Get-Integrations {
    Write-Host "Retrieving integrations from $ServiceUrl/api/integrations..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/integrations"
    if ($response) {
        Write-Host "Integrations found: $($response.total)" -ForegroundColor Green
        foreach ($integration in $response.integrations) {
            Write-Host "  - ID: $($integration.id)" -ForegroundColor Cyan
            Write-Host "    Name: $($integration.name)" -ForegroundColor White
            Write-Host "    Type: $($integration.type)" -ForegroundColor White
            Write-Host "    Source: $($integration.sourceSystem)" -ForegroundColor White
            Write-Host "    Target: $($integration.targetSystem)" -ForegroundColor White
            Write-Host "    Status: $($integration.status)" -ForegroundColor White
            Write-Host ""
        }
    } else {
        Write-Host "Failed to retrieve integrations." -ForegroundColor Red
    }
}

function Get-SyncJobs {
    Write-Host "Retrieving sync jobs from $ServiceUrl/api/sync-jobs..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/sync-jobs"
    if ($response) {
        Write-Host "Sync jobs found: $($response.total)" -ForegroundColor Green
        foreach ($syncJob in $response.syncJobs) {
            Write-Host "  - ID: $($syncJob.id)" -ForegroundColor Cyan
            Write-Host "    Integration ID: $($syncJob.integrationId)" -ForegroundColor White
            Write-Host "    Status: $($syncJob.status)" -ForegroundColor White
            Write-Host "    Start Time: $($syncJob.startTime)" -ForegroundColor White
            if ($syncJob.endTime) {
                Write-Host "    End Time: $($syncJob.endTime)" -ForegroundColor White
            }
            Write-Host "    Data Processed: $($syncJob.dataProcessed) bytes" -ForegroundColor White
            Write-Host "    Records Processed: $($syncJob.recordsProcessed)" -ForegroundColor White
            Write-Host ""
        }
    } else {
        Write-Host "Failed to retrieve sync jobs." -ForegroundColor Red
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
        Write-Host "  Total Integrations: $($response.overview.totalIntegrations)" -ForegroundColor Cyan
        Write-Host "  Total Syncs: $($response.overview.totalSyncs)" -ForegroundColor Cyan
        Write-Host "  Total Data Processed: $($response.overview.totalDataProcessed) bytes" -ForegroundColor Cyan
        Write-Host "  Average Sync Time: $($response.overview.averageSyncTime)ms" -ForegroundColor Cyan
        Write-Host "  Success Rate: $([math]::Round($response.overview.successRate * 100, 2))%" -ForegroundColor Cyan
        Write-Host "  Error Rate: $([math]::Round($response.overview.errorRate * 100, 2))%" -ForegroundColor Cyan
    } else {
        Write-Host "Failed to retrieve analytics." -ForegroundColor Red
    }
}

function Test-ServiceConnection {
    Write-Host "Testing connection to enterprise integration service..." -ForegroundColor Yellow
    
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
        Write-Host "Starting Enterprise Integration service (manual action required for actual process start)..." -ForegroundColor Yellow
        Write-Host "Please navigate to 'enterprise-integration' directory and run 'npm start' or 'npm run dev'." -ForegroundColor DarkYellow
    }
    "stop" {
        Write-Host "Stopping Enterprise Integration service (manual action required for actual process stop)..." -ForegroundColor Yellow
        Write-Host "Please manually stop the running Node.js process." -ForegroundColor DarkYellow
    }
    "restart" {
        Write-Host "Restarting Enterprise Integration service (manual action required)..." -ForegroundColor Yellow
        Write-Host "Please manually stop and then start the running Node.js process." -ForegroundColor DarkYellow
    }
    "deploy" {
        Write-Host "Deployment of Enterprise Integration service (placeholder - implement actual deployment logic)..." -ForegroundColor Yellow
        Write-Host "This would typically involve Docker/Kubernetes deployment scripts." -ForegroundColor DarkYellow
    }
    "create-integration" {
        $integrationId = Create-TestIntegration -Name $IntegrationName -Type $IntegrationType -Source $SourceSystem -Target $TargetSystem
        if ($integrationId) {
            Write-Host "Integration created with ID: $integrationId" -ForegroundColor Green
        }
    }
    "execute-sync" {
        if ($IntegrationId) {
            $syncJobId = Execute-IntegrationSync -Id $IntegrationId -Options @{ batchSize = 100; timeout = 30000 }
            if ($syncJobId) {
                Write-Host "Integration sync started with Job ID: $syncJobId" -ForegroundColor Green
            }
        } else {
            Write-Host "IntegrationId parameter is required for execute-sync action." -ForegroundColor Red
        }
    }
    "get-integrations" {
        Get-Integrations
    }
    "get-sync-jobs" {
        Get-SyncJobs
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
        Write-Host "  create-integration, execute-sync, get-integrations, get-sync-jobs" -ForegroundColor Yellow
        Write-Host "  get-analytics, test-connection, get-config" -ForegroundColor Yellow
    }
}

Write-Host "🚀 Enterprise Integration Manager finished." -ForegroundColor Cyan
