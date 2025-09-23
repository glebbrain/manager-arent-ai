# 📊 Advanced Reporting Manager v2.7.0
# PowerShell script for managing the Advanced Reporting service.
# Version: 2.7.0
# Last Updated: 2025-02-01

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "status", # Possible actions: status, start, stop, restart, deploy, create-report, generate-report, create-dashboard, create-kpi, calculate-kpi, get-reports, get-dashboards, get-kpis, get-analytics, test-connection
    
    [Parameter(Mandatory=$false)]
    [string]$ReportId = "", # Report ID for specific operations
    
    [Parameter(Mandatory=$false)]
    [string]$DashboardId = "", # Dashboard ID for specific operations
    
    [Parameter(Mandatory=$false)]
    [string]$KpiId = "", # KPI ID for specific operations
    
    [Parameter(Mandatory=$false)]
    [string]$ReportName = "Test Report", # Name for new report
    
    [Parameter(Mandatory=$false)]
    [string]$ReportType = "executive", # Type of report to create
    
    [Parameter(Mandatory=$false)]
    [string]$DashboardName = "Test Dashboard", # Name for new dashboard
    
    [Parameter(Mandatory=$false)]
    [string]$KpiName = "Test KPI", # Name for new KPI
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceUrl = "http://localhost:3021",
    
    [Parameter(Mandatory=$false)]
    [string]$Period = "24h", # Period for analytics (1h, 24h, 7d, 30d)
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host "📊 Advanced Reporting Manager v2.7.0" -ForegroundColor Cyan
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
        Write-Host "Reports: $($response.reports)" -ForegroundColor Green
        Write-Host "Dashboards: $($response.dashboards)" -ForegroundColor Green
        Write-Host "KPIs: $($response.kpis)" -ForegroundColor Green
        Write-Host "Timestamp: $($response.timestamp)" -ForegroundColor Green
    } else {
        Write-Host "Service is not reachable or returned an error." -ForegroundColor Red
    }
}

function Get-ServiceConfig {
    Write-Host "Retrieving reporting engine configuration from $ServiceUrl/api/config..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/config"
    if ($response) {
        Write-Host "Configuration:" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 5 | Write-Host
    } else {
        Write-Host "Failed to retrieve configuration." -ForegroundColor Red
    }
}

function Create-TestReport {
    param(
        [string]$Name,
        [string]$Type
    )
    Write-Host "Creating test report '$Name' of type '$Type'..." -ForegroundColor Yellow
    
    $reportData = @{
        name = $Name
        description = "Test report created by PowerShell script"
        type = $Type
        category = "test"
        dataSource = @{
            type = "database"
            connection = "test_db"
        }
        configuration = @{
            template = "default"
            refreshInterval = 3600
        }
        visualizations = @(
            @{
                type = "chart"
                title = "Sample Chart"
                data = "sample_data"
            },
            @{
                type = "table"
                title = "Sample Table"
                data = "sample_table_data"
            }
        )
        filters = @{
            dateRange = "last_30_days"
            department = "all"
        }
    }
    
    $body = @{
        reportData = $reportData
    }
    
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/reports" -Method "POST" -Body $body
    if ($response) {
        Write-Host "Report created successfully:" -ForegroundColor Green
        Write-Host "Report ID: $($response.id)" -ForegroundColor Cyan
        Write-Host "Name: $($response.name)" -ForegroundColor Cyan
        Write-Host "Type: $($response.type)" -ForegroundColor Cyan
        Write-Host "Status: $($response.status)" -ForegroundColor Cyan
        return $response.id
    } else {
        Write-Host "Failed to create report." -ForegroundColor Red
        return $null
    }
}

function Generate-Report {
    param(
        [string]$Id,
        [hashtable]$Options = @{}
    )
    Write-Host "Generating report $Id..." -ForegroundColor Yellow
    
    $body = @{
        options = $Options
    }
    
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/reports/$Id/generate" -Method "POST" -Body $body
    if ($response) {
        Write-Host "Report generation started:" -ForegroundColor Green
        Write-Host "Generation ID: $($response.generationId)" -ForegroundColor Cyan
        Write-Host "Success: $($response.success)" -ForegroundColor Cyan
        if ($response.report) {
            Write-Host "Report Title: $($response.report.data.title)" -ForegroundColor Cyan
            Write-Host "Data Points: $($response.report.data.metrics.dataPoints)" -ForegroundColor Cyan
            Write-Host "Charts: $($response.report.data.metrics.charts)" -ForegroundColor Cyan
        }
        if ($response.duration) {
            Write-Host "Duration: $($response.duration)ms" -ForegroundColor Cyan
        }
        return $response.generationId
    } else {
        Write-Host "Failed to generate report." -ForegroundColor Red
        return $null
    }
}

function Create-TestDashboard {
    param(
        [string]$Name
    )
    Write-Host "Creating test dashboard '$Name'..." -ForegroundColor Yellow
    
    $dashboardData = @{
        name = $Name
        description = "Test dashboard created by PowerShell script"
        layout = @{
            columns = 3
            rows = 2
        }
        widgets = @(
            @{
                type = "kpi"
                title = "Total Sales"
                position = @{ x = 0; y = 0; width = 1; height = 1 }
            },
            @{
                type = "chart"
                title = "Sales Trend"
                position = @{ x = 1; y = 0; width = 2; height = 1 }
            },
            @{
                type = "table"
                title = "Top Products"
                position = @{ x = 0; y = 1; width = 3; height = 1 }
            }
        )
        filters = @{
            dateRange = "last_30_days"
            department = "all"
        }
        refreshInterval = 300
    }
    
    $body = @{
        dashboardData = $dashboardData
    }
    
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/dashboards" -Method "POST" -Body $body
    if ($response) {
        Write-Host "Dashboard created successfully:" -ForegroundColor Green
        Write-Host "Dashboard ID: $($response.id)" -ForegroundColor Cyan
        Write-Host "Name: $($response.name)" -ForegroundColor Cyan
        Write-Host "Widgets: $($response.widgets.Count)" -ForegroundColor Cyan
        Write-Host "Status: $($response.status)" -ForegroundColor Cyan
        return $response.id
    } else {
        Write-Host "Failed to create dashboard." -ForegroundColor Red
        return $null
    }
}

function Create-TestKpi {
    param(
        [string]$Name
    )
    Write-Host "Creating test KPI '$Name'..." -ForegroundColor Yellow
    
    $kpiData = @{
        name = $Name
        description = "Test KPI created by PowerShell script"
        category = "test"
        formula = "SUM(values) / COUNT(values)"
        target = 100
        unit = "percentage"
        dataSource = @{
            type = "api"
            endpoint = "/api/test-data"
        }
        calculation = @{
            frequency = "daily"
            aggregation = "average"
        }
    }
    
    $body = @{
        kpiData = $kpiData
    }
    
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/kpis" -Method "POST" -Body $body
    if ($response) {
        Write-Host "KPI created successfully:" -ForegroundColor Green
        Write-Host "KPI ID: $($response.id)" -ForegroundColor Cyan
        Write-Host "Name: $($response.name)" -ForegroundColor Cyan
        Write-Host "Category: $($response.category)" -ForegroundColor Cyan
        Write-Host "Target: $($response.target)" -ForegroundColor Cyan
        Write-Host "Unit: $($response.unit)" -ForegroundColor Cyan
        return $response.id
    } else {
        Write-Host "Failed to create KPI." -ForegroundColor Red
        return $null
    }
}

function Calculate-Kpi {
    param(
        [string]$Id,
        [hashtable]$Options = @{}
    )
    Write-Host "Calculating KPI $Id..." -ForegroundColor Yellow
    
    $body = @{
        options = $Options
    }
    
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/kpis/$Id/calculate" -Method "POST" -Body $body
    if ($response) {
        Write-Host "KPI calculation completed:" -ForegroundColor Green
        Write-Host "KPI Name: $($response.name)" -ForegroundColor Cyan
        Write-Host "Current Value: $($response.currentValue)" -ForegroundColor Cyan
        Write-Host "Target Value: $($response.targetValue)" -ForegroundColor Cyan
        Write-Host "Performance: $([math]::Round($response.performance, 2))%" -ForegroundColor Cyan
        Write-Host "Status: $($response.status)" -ForegroundColor Cyan
        Write-Host "Trend: $($response.trend.direction) ($($response.trend.change)%)" -ForegroundColor Cyan
        return $response
    } else {
        Write-Host "Failed to calculate KPI." -ForegroundColor Red
        return $null
    }
}

function Get-Reports {
    Write-Host "Retrieving reports from $ServiceUrl/api/reports..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/reports"
    if ($response) {
        Write-Host "Reports found: $($response.total)" -ForegroundColor Green
        foreach ($report in $response.reports) {
            Write-Host "  - ID: $($report.id)" -ForegroundColor Cyan
            Write-Host "    Name: $($report.name)" -ForegroundColor White
            Write-Host "    Type: $($report.type)" -ForegroundColor White
            Write-Host "    Category: $($report.category)" -ForegroundColor White
            Write-Host "    Status: $($report.status)" -ForegroundColor White
            Write-Host "    Visualizations: $($report.visualizations.Count)" -ForegroundColor White
            Write-Host ""
        }
    } else {
        Write-Host "Failed to retrieve reports." -ForegroundColor Red
    }
}

function Get-Dashboards {
    Write-Host "Retrieving dashboards from $ServiceUrl/api/dashboards..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/dashboards"
    if ($response) {
        Write-Host "Dashboards found: $($response.total)" -ForegroundColor Green
        foreach ($dashboard in $response.dashboards) {
            Write-Host "  - ID: $($dashboard.id)" -ForegroundColor Cyan
            Write-Host "    Name: $($dashboard.name)" -ForegroundColor White
            Write-Host "    Widgets: $($dashboard.widgets.Count)" -ForegroundColor White
            Write-Host "    Refresh Interval: $($dashboard.refreshInterval)s" -ForegroundColor White
            Write-Host "    Status: $($dashboard.status)" -ForegroundColor White
            Write-Host ""
        }
    } else {
        Write-Host "Failed to retrieve dashboards." -ForegroundColor Red
    }
}

function Get-Kpis {
    Write-Host "Retrieving KPIs from $ServiceUrl/api/kpis..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/kpis"
    if ($response) {
        Write-Host "KPIs found: $($response.total)" -ForegroundColor Green
        foreach ($kpi in $response.kpis) {
            Write-Host "  - ID: $($kpi.id)" -ForegroundColor Cyan
            Write-Host "    Name: $($kpi.name)" -ForegroundColor White
            Write-Host "    Category: $($kpi.category)" -ForegroundColor White
            Write-Host "    Target: $($kpi.target)" -ForegroundColor White
            Write-Host "    Unit: $($kpi.unit)" -ForegroundColor White
            Write-Host "    Status: $($kpi.status)" -ForegroundColor White
            Write-Host ""
        }
    } else {
        Write-Host "Failed to retrieve KPIs." -ForegroundColor Red
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
        Write-Host "  Total Reports: $($response.overview.totalReports)" -ForegroundColor Cyan
        Write-Host "  Total Dashboards: $($response.overview.totalDashboards)" -ForegroundColor Cyan
        Write-Host "  Total Generations: $($response.overview.totalGenerations)" -ForegroundColor Cyan
        Write-Host "  Average Generation Time: $($response.overview.averageGenerationTime)ms" -ForegroundColor Cyan
        Write-Host "  Success Rate: $([math]::Round($response.overview.successRate * 100, 2))%" -ForegroundColor Cyan
        Write-Host "  Error Rate: $([math]::Round($response.overview.errorRate * 100, 2))%" -ForegroundColor Cyan
    } else {
        Write-Host "Failed to retrieve analytics." -ForegroundColor Red
    }
}

function Test-ServiceConnection {
    Write-Host "Testing connection to advanced reporting service..." -ForegroundColor Yellow
    
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
        Write-Host "Starting Advanced Reporting service (manual action required for actual process start)..." -ForegroundColor Yellow
        Write-Host "Please navigate to 'advanced-reporting' directory and run 'npm start' or 'npm run dev'." -ForegroundColor DarkYellow
    }
    "stop" {
        Write-Host "Stopping Advanced Reporting service (manual action required for actual process stop)..." -ForegroundColor Yellow
        Write-Host "Please manually stop the running Node.js process." -ForegroundColor DarkYellow
    }
    "restart" {
        Write-Host "Restarting Advanced Reporting service (manual action required)..." -ForegroundColor Yellow
        Write-Host "Please manually stop and then start the running Node.js process." -ForegroundColor DarkYellow
    }
    "deploy" {
        Write-Host "Deployment of Advanced Reporting service (placeholder - implement actual deployment logic)..." -ForegroundColor Yellow
        Write-Host "This would typically involve Docker/Kubernetes deployment scripts." -ForegroundColor DarkYellow
    }
    "create-report" {
        $reportId = Create-TestReport -Name $ReportName -Type $ReportType
        if ($reportId) {
            Write-Host "Report created with ID: $reportId" -ForegroundColor Green
        }
    }
    "generate-report" {
        if ($ReportId) {
            $generationId = Generate-Report -Id $ReportId -Options @{ format = "pdf"; includeCharts = $true }
            if ($generationId) {
                Write-Host "Report generation started with ID: $generationId" -ForegroundColor Green
            }
        } else {
            Write-Host "ReportId parameter is required for generate-report action." -ForegroundColor Red
        }
    }
    "create-dashboard" {
        $dashboardId = Create-TestDashboard -Name $DashboardName
        if ($dashboardId) {
            Write-Host "Dashboard created with ID: $dashboardId" -ForegroundColor Green
        }
    }
    "create-kpi" {
        $kpiId = Create-TestKpi -Name $KpiName
        if ($kpiId) {
            Write-Host "KPI created with ID: $kpiId" -ForegroundColor Green
        }
    }
    "calculate-kpi" {
        if ($KpiId) {
            $result = Calculate-Kpi -Id $KpiId -Options @{ period = "last_30_days"; includeTrend = $true }
            if ($result) {
                Write-Host "KPI calculation completed successfully." -ForegroundColor Green
            }
        } else {
            Write-Host "KpiId parameter is required for calculate-kpi action." -ForegroundColor Red
        }
    }
    "get-reports" {
        Get-Reports
    }
    "get-dashboards" {
        Get-Dashboards
    }
    "get-kpis" {
        Get-Kpis
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
        Write-Host "  create-report, generate-report, create-dashboard, create-kpi, calculate-kpi" -ForegroundColor Yellow
        Write-Host "  get-reports, get-dashboards, get-kpis, get-analytics, test-connection, get-config" -ForegroundColor Yellow
    }
}

Write-Host "🚀 Advanced Reporting Manager finished." -ForegroundColor Cyan
