param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("timezone-scheduler", "cross-platform", "auto-tagging", "trend-content", "load-balancer", "cdn", "sharding", "microservices", "all")]
    [string]$System = "all",

    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "restart", "status", "deploy", "logs")]
    [string]$Action = "status",

    [switch]$Quiet,
    [switch]$Detailed
)

$ErrorActionPreference = "Stop"

# Get project root directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptPath)

# Colors for output
$Colors = @{
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Info = "Cyan"
    Header = "Magenta"
    Time = "Gray"
}

function Write-Status {
    param($Message, $Status = "Info", $NoNewline = $false)
    if (-not $Quiet) {
        $color = $Colors[$Status]
        $timestamp = Get-Date -Format "HH:mm:ss"
        $prefix = "[$timestamp]"
        if ($NoNewline) {
            Write-Host "$prefix $Message" -ForegroundColor $color -NoNewline
        } else {
            Write-Host "$prefix $Message" -ForegroundColor $color
        }
    }
}

function Test-ServiceHealth {
    param($ServiceName, $Port, $Endpoint = "/health")
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port$Endpoint" -TimeoutSec 5 -UseBasicParsing
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Get-SystemStatus {
    param($SystemName)

    $status = @{
        Name = $SystemName
        Running = $false
        Port = $null
        Health = $false
        LastCheck = Get-Date
    }

    switch ($SystemName) {
        "timezone-scheduler" {
            $status.Port = 8003
            $status.Health = Test-ServiceHealth -ServiceName $SystemName -Port 8003 -Endpoint "/api/scheduler/health"
            $status.Running = $status.Health
        }
        "cross-platform" {
            $status.Port = 8004
            $status.Health = Test-ServiceHealth -ServiceName $SystemName -Port 8004 -Endpoint "/api/cross-platform/health"
            $status.Running = $status.Health
        }
        "auto-tagging" {
            $status.Port = 8005
            $status.Health = Test-ServiceHealth -ServiceName $SystemName -Port 8005 -Endpoint "/api/auto-tagging/health"
            $status.Running = $status.Health
        }
        "trend-content" {
            $status.Port = 8006
            $status.Health = Test-ServiceHealth -ServiceName $SystemName -Port 8006 -Endpoint "/api/trend-content/health"
            $status.Running = $status.Health
        }
        "load-balancer" {
            $status.Port = 80
            $status.Health = Test-ServiceHealth -ServiceName $SystemName -Port 80 -Endpoint "/health"
            $status.Running = $status.Health
        }
        "cdn" {
            # CDN is external service, check configuration
            $status.Running = Test-Path "infra/cdn-config.yml"
            $status.Health = $status.Running
        }
        "sharding" {
            # Database sharding - check if configured
            $status.Running = Test-Path "infra/database-sharding.yml"
            $status.Health = $status.Running
        }
        "microservices" {
            # Microservices - check if configured
            $status.Running = Test-Path "infra/microservices-optimization.yml"
            $status.Health = $status.Running
        }
    }

    return $status
}

function Start-System {
    param($SystemName)

    Write-Status "Starting $SystemName..." "Info"

    switch ($SystemName) {
        "timezone-scheduler" {
            if (Test-Path "scripts/deploy-timezone-scheduler.sh") {
                & "scripts/deploy-timezone-scheduler.sh"
                Write-Status "Timezone Scheduler started" "Success"
            } else {
                Write-Status "Deployment script not found for timezone-scheduler" "Error"
            }
        }
        "cross-platform" {
            if (Test-Path "scripts/deploy-cross-platform.sh") {
                & "scripts/deploy-cross-platform.sh"
                Write-Status "Cross-Platform Posting System started" "Success"
            } else {
                Write-Status "Deployment script not found for cross-platform" "Error"
            }
        }
        "auto-tagging" {
            if (Test-Path "scripts/deploy-auto-tagging.sh") {
                & "scripts/deploy-auto-tagging.sh"
                Write-Status "Auto-Tagging System started" "Success"
            } else {
                Write-Status "Deployment script not found for auto-tagging" "Error"
            }
        }
        "trend-content" {
            if (Test-Path "scripts/deploy-trend-content.sh") {
                & "scripts/deploy-trend-content.sh"
                Write-Status "Trend Content System started" "Success"
            } else {
                Write-Status "Deployment script not found for trend-content" "Error"
            }
        }
        "load-balancer" {
            if (Test-Path "scripts/deploy-loadbalancer.sh") {
                & "scripts/deploy-loadbalancer.sh"
                Write-Status "Load Balancer started" "Success"
            } else {
                Write-Status "Deployment script not found for load-balancer" "Error"
            }
        }
        "cdn" {
            if (Test-Path "scripts/deploy-cdn.sh") {
                & "scripts/deploy-cdn.sh"
                Write-Status "CDN configured" "Success"
            } else {
                Write-Status "Deployment script not found for CDN" "Error"
            }
        }
        "sharding" {
            if (Test-Path "scripts/deploy-database-sharding.sh") {
                & "scripts/deploy-database-sharding.sh"
                Write-Status "Database Sharding configured" "Success"
            } else {
                Write-Status "Deployment script not found for database sharding" "Error"
            }
        }
        "microservices" {
            if (Test-Path "scripts/deploy-microservices.sh") {
                & "scripts/deploy-microservices.sh"
                Write-Status "Microservices configured" "Success"
            } else {
                Write-Status "Deployment script not found for microservices" "Error"
            }
        }
    }
}

function Stop-System {
    param($SystemName)

    Write-Status "Stopping $SystemName..." "Info"

    switch ($SystemName) {
        "timezone-scheduler" {
            docker-compose -f "infra/docker-compose.timezone-scheduler.yml" down
            Write-Status "Timezone Scheduler stopped" "Success"
        }
        "cross-platform" {
            docker-compose -f "infra/docker-compose.cross-platform.yml" down
            Write-Status "Cross-Platform Posting System stopped" "Success"
        }
        "auto-tagging" {
            docker-compose -f "infra/docker-compose.auto-tagging.yml" down
            Write-Status "Auto-Tagging System stopped" "Success"
        }
        "trend-content" {
            docker-compose -f "infra/docker-compose.trend-content.yml" down
            Write-Status "Trend Content System stopped" "Success"
        }
        "load-balancer" {
            docker-compose -f "infra/docker-compose.loadbalancer.yml" down
            Write-Status "Load Balancer stopped" "Success"
        }
        default {
            Write-Status "Stop action not implemented for $SystemName" "Warning"
        }
    }
}

function Restart-System {
    param($SystemName)

    Write-Status "Restarting $SystemName..." "Info"
    Stop-System -SystemName $SystemName
    Start-Sleep -Seconds 2
    Start-System -SystemName $SystemName
}

function Deploy-System {
    param($SystemName)

    Write-Status "Deploying $SystemName..." "Info"

    # Deploy is same as start for most systems
    Start-System -SystemName $SystemName
}

function Show-SystemLogs {
    param($SystemName)

    Write-Status "Showing logs for $SystemName..." "Info"

    switch ($SystemName) {
        "timezone-scheduler" {
            docker-compose -f "infra/docker-compose.timezone-scheduler.yml" logs -f
        }
        "cross-platform" {
            docker-compose -f "infra/docker-compose.cross-platform.yml" logs -f
        }
        "auto-tagging" {
            docker-compose -f "infra/docker-compose.auto-tagging.yml" logs -f
        }
        "trend-content" {
            docker-compose -f "infra/docker-compose.trend-content.yml" logs -f
        }
        "load-balancer" {
            docker-compose -f "infra/docker-compose.loadbalancer.yml" logs -f
        }
        default {
            Write-Status "Logs not available for $SystemName" "Warning"
        }
    }
}

function Show-SystemStatus {
    param($SystemName)

    $status = Get-SystemStatus -SystemName $SystemName

    $statusIcon = if ($status.Health) {"✅"} else {"❌"}
    $statusColor = if ($status.Health) {"Success"} else {"Error"}

    Write-Status "  $statusIcon $($status.Name)" $statusColor

    if ($status.Port) {
        Write-Status "    Port: $($status.Port)" "Info"
    }

    Write-Status "    Running: $(if($status.Running) {'Yes'} else {'No'})" $(if($status.Running) {"Success"} else {"Error"})
    Write-Status "    Health: $(if($status.Health) {'Healthy'} else {'Unhealthy'})" $(if($status.Health) {"Success"} else {"Error"})
    Write-Status "    Last Check: $($status.LastCheck.ToString('HH:mm:ss'))" "Info"

    if ($Detailed) {
        # Show additional details
        switch ($SystemName) {
            "timezone-scheduler" {
                if (Test-Path "data/scheduler.db") {
                    $dbSize = (Get-Item "data/scheduler.db").Length
                    Write-Status "    Database Size: $([math]::Round($dbSize/1KB, 1)) KB" "Info"
                }
            }
            "cross-platform" {
                if (Test-Path "logs/cross_platform.log") {
                    $logSize = (Get-Item "logs/cross_platform.log").Length
                    Write-Status "    Log Size: $([math]::Round($logSize/1KB, 1)) KB" "Info"
                }
            }
        }
    }
}

# Main execution
Write-Status "🔧 CyberSyn Advanced Systems Manager" "Header"
Write-Status "=====================================" "Header"

if ($System -eq "all") {
    $systems = @("timezone-scheduler", "cross-platform", "auto-tagging", "trend-content", "load-balancer", "cdn", "sharding", "microservices")
} else {
    $systems = @($System)
}

foreach ($systemName in $systems) {
    Write-Status "`n📋 System: $systemName" "Info"

    switch ($Action) {
        "start" {
            Start-System -SystemName $systemName
        }
        "stop" {
            Stop-System -SystemName $systemName
        }
        "restart" {
            Restart-System -SystemName $systemName
        }
        "deploy" {
            Deploy-System -SystemName $systemName
        }
        "logs" {
            Show-SystemLogs -SystemName $systemName
        }
        "status" {
            Show-SystemStatus -SystemName $systemName
        }
        default {
            Write-Status "Unknown action: $Action" "Error"
        }
    }
}

# Show overall summary
if ($Action -eq "status") {
    Write-Status "`n📊 Overall System Status:" "Header"

    $healthyCount = 0
    $totalCount = $systems.Count

    foreach ($systemName in $systems) {
        $status = Get-SystemStatus -SystemName $systemName
        if ($status.Health) {
            $healthyCount++
        }
    }

    $healthPercentage = [math]::Round(($healthyCount / $totalCount) * 100, 1)
    $overallStatus = if ($healthPercentage -ge 90) {"Excellent"} elseif ($healthPercentage -ge 70) {"Good"} else {"Needs Attention"}
    $statusColor = if ($healthPercentage -ge 90) {"Success"} elseif ($healthPercentage -ge 70) {"Warning"} else {"Error"}

    Write-Status "  Overall Health: $overallStatus ($healthPercentage%)" $statusColor
    Write-Status "  Healthy Systems: $healthyCount/$totalCount" "Info"
}

Write-Status "`n💡 Usage Examples:" "Info"
Write-Status "  - Check all systems: .\Manage-Advanced-Systems.ps1 -System all -Action status" "Info"
Write-Status "  - Start timezone scheduler: .\Manage-Advanced-Systems.ps1 -System timezone-scheduler -Action start" "Info"
Write-Status "  - Deploy load balancer: .\Manage-Advanced-Systems.ps1 -System load-balancer -Action deploy" "Info"
Write-Status "  - View logs: .\Manage-Advanced-Systems.ps1 -System cross-platform -Action logs" "Info"
Write-Status "  - Detailed status: .\Manage-Advanced-Systems.ps1 -System all -Action status -Detailed" "Info"

Write-Status "`nAdvanced Systems Management Complete! 🚀" "Success"
exit 0
