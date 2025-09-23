# 📊 Custom Dashboards Manager v2.7.0
# PowerShell script for managing the Custom Dashboards service.
# Version: 2.7.0
# Last Updated: 2025-02-01

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "status", # Possible actions: status, start, stop, restart, deploy, create-dashboard, render-dashboard, create-widget, create-template, create-user, get-dashboards, get-widgets, get-templates, get-users, get-analytics, test-connection
    
    [Parameter(Mandatory=$false)]
    [string]$DashboardId = "", # Dashboard ID for specific operations
    
    [Parameter(Mandatory=$false)]
    [string]$WidgetId = "", # Widget ID for specific operations
    
    [Parameter(Mandatory=$false)]
    [string]$TemplateId = "", # Template ID for specific operations
    
    [Parameter(Mandatory=$false)]
    [string]$UserId = "", # User ID for specific operations
    
    [Parameter(Mandatory=$false)]
    [string]$DashboardName = "Test Dashboard", # Name for new dashboard
    
    [Parameter(Mandatory=$false)]
    [string]$WidgetType = "chart", # Type of widget to create
    
    [Parameter(Mandatory=$false)]
    [string]$TemplateName = "Test Template", # Name for new template
    
    [Parameter(Mandatory=$false)]
    [string]$UserName = "testuser", # Username for new user
    
    [Parameter(Mandatory=$false)]
    [string]$UserEmail = "test@example.com", # Email for new user
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceUrl = "http://localhost:3022",
    
    [Parameter(Mandatory=$false)]
    [string]$Period = "24h", # Period for analytics (1h, 24h, 7d, 30d)
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host "📊 Custom Dashboards Manager v2.7.0" -ForegroundColor Cyan
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
        Write-Host "Dashboards: $($response.dashboards)" -ForegroundColor Green
        Write-Host "Widgets: $($response.widgets)" -ForegroundColor Green
        Write-Host "Templates: $($response.templates)" -ForegroundColor Green
        Write-Host "Timestamp: $($response.timestamp)" -ForegroundColor Green
    } else {
        Write-Host "Service is not reachable or returned an error." -ForegroundColor Red
    }
}

function Get-ServiceConfig {
    Write-Host "Retrieving dashboard engine configuration from $ServiceUrl/api/config..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/config"
    if ($response) {
        Write-Host "Configuration:" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 5 | Write-Host
    } else {
        Write-Host "Failed to retrieve configuration." -ForegroundColor Red
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
            type = "grid"
            columns = 12
            rows = 8
        }
        theme = "modern"
        settings = @{
            refreshInterval = 300
            autoSave = $true
        }
        permissions = @{
            public = $false
            users = @("testuser")
        }
        widgets = @()
    }
    
    $body = @{
        dashboardData = $dashboardData
    }
    
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/dashboards" -Method "POST" -Body $body
    if ($response) {
        Write-Host "Dashboard created successfully:" -ForegroundColor Green
        Write-Host "Dashboard ID: $($response.id)" -ForegroundColor Cyan
        Write-Host "Name: $($response.name)" -ForegroundColor Cyan
        Write-Host "Layout: $($response.layout.type)" -ForegroundColor Cyan
        Write-Host "Theme: $($response.theme)" -ForegroundColor Cyan
        Write-Host "Status: $($response.status)" -ForegroundColor Cyan
        return $response.id
    } else {
        Write-Host "Failed to create dashboard." -ForegroundColor Red
        return $null
    }
}

function Render-Dashboard {
    param(
        [string]$Id,
        [hashtable]$Options = @{}
    )
    Write-Host "Rendering dashboard $Id..." -ForegroundColor Yellow
    
    $body = @{
        options = $Options
    }
    
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/dashboards/$Id/render" -Method "POST" -Body $body
    if ($response) {
        Write-Host "Dashboard rendered successfully:" -ForegroundColor Green
        Write-Host "Success: $($response.success)" -ForegroundColor Cyan
        Write-Host "Load Time: $($response.loadTime)ms" -ForegroundColor Cyan
        if ($response.dashboard) {
            Write-Host "Dashboard Name: $($response.dashboard.name)" -ForegroundColor Cyan
            Write-Host "Widgets: $($response.dashboard.widgets.Count)" -ForegroundColor Cyan
            Write-Host "Theme: $($response.dashboard.theme)" -ForegroundColor Cyan
        }
        return $response
    } else {
        Write-Host "Failed to render dashboard." -ForegroundColor Red
        return $null
    }
}

function Create-TestWidget {
    param(
        [string]$Type,
        [string]$Title
    )
    Write-Host "Creating test widget '$Title' of type '$Type'..." -ForegroundColor Yellow
    
    $widgetData = @{
        type = $Type
        title = $Title
        description = "Test widget created by PowerShell script"
        position = @{
            x = 0
            y = 0
            width = 4
            height = 3
        }
        configuration = @{
            chartType = "bar"
            dataPoints = 10
        }
        dataSource = @{
            type = "api"
            endpoint = "/api/test-data"
        }
        styling = @{
            backgroundColor = "#ffffff"
            borderColor = "#e0e0e0"
        }
    }
    
    $body = @{
        widgetData = $widgetData
    }
    
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/widgets" -Method "POST" -Body $body
    if ($response) {
        Write-Host "Widget created successfully:" -ForegroundColor Green
        Write-Host "Widget ID: $($response.id)" -ForegroundColor Cyan
        Write-Host "Type: $($response.type)" -ForegroundColor Cyan
        Write-Host "Title: $($response.title)" -ForegroundColor Cyan
        Write-Host "Position: $($response.position.width)x$($response.position.height)" -ForegroundColor Cyan
        Write-Host "Status: $($response.status)" -ForegroundColor Cyan
        return $response.id
    } else {
        Write-Host "Failed to create widget." -ForegroundColor Red
        return $null
    }
}

function Create-TestTemplate {
    param(
        [string]$Name
    )
    Write-Host "Creating test template '$Name'..." -ForegroundColor Yellow
    
    $templateData = @{
        name = $Name
        description = "Test template created by PowerShell script"
        category = "test"
        layout = @{
            type = "grid"
            columns = 12
            rows = 8
        }
        widgets = @(
            @{
                type = "kpi"
                title = "Sample KPI"
                position = @{ x = 0; y = 0; width = 3; height = 2 }
            },
            @{
                type = "chart"
                title = "Sample Chart"
                position = @{ x = 3; y = 0; width = 9; height = 4 }
            }
        )
        theme = "modern"
        isPublic = $true
    }
    
    $body = @{
        templateData = $templateData
    }
    
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/templates" -Method "POST" -Body $body
    if ($response) {
        Write-Host "Template created successfully:" -ForegroundColor Green
        Write-Host "Template ID: $($response.id)" -ForegroundColor Cyan
        Write-Host "Name: $($response.name)" -ForegroundColor Cyan
        Write-Host "Category: $($response.category)" -ForegroundColor Cyan
        Write-Host "Widgets: $($response.widgets.Count)" -ForegroundColor Cyan
        Write-Host "Public: $($response.isPublic)" -ForegroundColor Cyan
        return $response.id
    } else {
        Write-Host "Failed to create template." -ForegroundColor Red
        return $null
    }
}

function Create-TestUser {
    param(
        [string]$Username,
        [string]$Email
    )
    Write-Host "Creating test user '$Username' with email '$Email'..." -ForegroundColor Yellow
    
    $userData = @{
        username = $Username
        email = $Email
        role = "user"
        preferences = @{
            theme = "light"
            language = "en"
        }
        permissions = @{
            createDashboards = $true
            editDashboards = $true
            shareDashboards = $false
        }
    }
    
    $body = @{
        userData = $userData
    }
    
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/users" -Method "POST" -Body $body
    if ($response) {
        Write-Host "User created successfully:" -ForegroundColor Green
        Write-Host "User ID: $($response.id)" -ForegroundColor Cyan
        Write-Host "Username: $($response.username)" -ForegroundColor Cyan
        Write-Host "Email: $($response.email)" -ForegroundColor Cyan
        Write-Host "Role: $($response.role)" -ForegroundColor Cyan
        Write-Host "Status: $($response.status)" -ForegroundColor Cyan
        return $response.id
    } else {
        Write-Host "Failed to create user." -ForegroundColor Red
        return $null
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
            Write-Host "    Layout: $($dashboard.layout.type)" -ForegroundColor White
            Write-Host "    Theme: $($dashboard.theme)" -ForegroundColor White
            Write-Host "    Widgets: $($dashboard.widgets.Count)" -ForegroundColor White
            Write-Host "    Status: $($dashboard.status)" -ForegroundColor White
            Write-Host ""
        }
    } else {
        Write-Host "Failed to retrieve dashboards." -ForegroundColor Red
    }
}

function Get-Widgets {
    Write-Host "Retrieving widgets from $ServiceUrl/api/widgets..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/widgets"
    if ($response) {
        Write-Host "Widgets found: $($response.total)" -ForegroundColor Green
        foreach ($widget in $response.widgets) {
            Write-Host "  - ID: $($widget.id)" -ForegroundColor Cyan
            Write-Host "    Type: $($widget.type)" -ForegroundColor White
            Write-Host "    Title: $($widget.title)" -ForegroundColor White
            Write-Host "    Position: $($widget.position.width)x$($widget.position.height)" -ForegroundColor White
            Write-Host "    Status: $($widget.status)" -ForegroundColor White
            Write-Host ""
        }
    } else {
        Write-Host "Failed to retrieve widgets." -ForegroundColor Red
    }
}

function Get-Templates {
    Write-Host "Retrieving templates from $ServiceUrl/api/templates..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/templates"
    if ($response) {
        Write-Host "Templates found: $($response.total)" -ForegroundColor Green
        foreach ($template in $response.templates) {
            Write-Host "  - ID: $($template.id)" -ForegroundColor Cyan
            Write-Host "    Name: $($template.name)" -ForegroundColor White
            Write-Host "    Category: $($template.category)" -ForegroundColor White
            Write-Host "    Widgets: $($template.widgets.Count)" -ForegroundColor White
            Write-Host "    Public: $($template.isPublic)" -ForegroundColor White
            Write-Host ""
        }
    } else {
        Write-Host "Failed to retrieve templates." -ForegroundColor Red
    }
}

function Get-Users {
    Write-Host "Retrieving users from $ServiceUrl/api/users..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/users"
    if ($response) {
        Write-Host "Users found: $($response.total)" -ForegroundColor Green
        foreach ($user in $response.users) {
            Write-Host "  - ID: $($user.id)" -ForegroundColor Cyan
            Write-Host "    Username: $($user.username)" -ForegroundColor White
            Write-Host "    Email: $($user.email)" -ForegroundColor White
            Write-Host "    Role: $($user.role)" -ForegroundColor White
            Write-Host "    Status: $($user.status)" -ForegroundColor White
            Write-Host ""
        }
    } else {
        Write-Host "Failed to retrieve users." -ForegroundColor Red
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
        Write-Host "  Total Dashboards: $($response.overview.totalDashboards)" -ForegroundColor Cyan
        Write-Host "  Total Widgets: $($response.overview.totalWidgets)" -ForegroundColor Cyan
        Write-Host "  Total Users: $($response.overview.totalUsers)" -ForegroundColor Cyan
        Write-Host "  Average Load Time: $($response.overview.averageLoadTime)ms" -ForegroundColor Cyan
        Write-Host "  Success Rate: $([math]::Round($response.overview.successRate * 100, 2))%" -ForegroundColor Cyan
        Write-Host "  Error Rate: $([math]::Round($response.overview.errorRate * 100, 2))%" -ForegroundColor Cyan
    } else {
        Write-Host "Failed to retrieve analytics." -ForegroundColor Red
    }
}

function Test-ServiceConnection {
    Write-Host "Testing connection to custom dashboards service..." -ForegroundColor Yellow
    
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
        Write-Host "Starting Custom Dashboards service (manual action required for actual process start)..." -ForegroundColor Yellow
        Write-Host "Please navigate to 'custom-dashboards' directory and run 'npm start' or 'npm run dev'." -ForegroundColor DarkYellow
    }
    "stop" {
        Write-Host "Stopping Custom Dashboards service (manual action required for actual process stop)..." -ForegroundColor Yellow
        Write-Host "Please manually stop the running Node.js process." -ForegroundColor DarkYellow
    }
    "restart" {
        Write-Host "Restarting Custom Dashboards service (manual action required)..." -ForegroundColor Yellow
        Write-Host "Please manually stop and then start the running Node.js process." -ForegroundColor DarkYellow
    }
    "deploy" {
        Write-Host "Deployment of Custom Dashboards service (placeholder - implement actual deployment logic)..." -ForegroundColor Yellow
        Write-Host "This would typically involve Docker/Kubernetes deployment scripts." -ForegroundColor DarkYellow
    }
    "create-dashboard" {
        $dashboardId = Create-TestDashboard -Name $DashboardName
        if ($dashboardId) {
            Write-Host "Dashboard created with ID: $dashboardId" -ForegroundColor Green
        }
    }
    "render-dashboard" {
        if ($DashboardId) {
            $result = Render-Dashboard -Id $DashboardId -Options @{ includeData = $true; includeCharts = $true }
            if ($result) {
                Write-Host "Dashboard rendered successfully." -ForegroundColor Green
            }
        } else {
            Write-Host "DashboardId parameter is required for render-dashboard action." -ForegroundColor Red
        }
    }
    "create-widget" {
        $widgetId = Create-TestWidget -Type $WidgetType -Title "Test $WidgetType Widget"
        if ($widgetId) {
            Write-Host "Widget created with ID: $widgetId" -ForegroundColor Green
        }
    }
    "create-template" {
        $templateId = Create-TestTemplate -Name $TemplateName
        if ($templateId) {
            Write-Host "Template created with ID: $templateId" -ForegroundColor Green
        }
    }
    "create-user" {
        $userId = Create-TestUser -Username $UserName -Email $UserEmail
        if ($userId) {
            Write-Host "User created with ID: $userId" -ForegroundColor Green
        }
    }
    "get-dashboards" {
        Get-Dashboards
    }
    "get-widgets" {
        Get-Widgets
    }
    "get-templates" {
        Get-Templates
    }
    "get-users" {
        Get-Users
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
        Write-Host "  create-dashboard, render-dashboard, create-widget, create-template, create-user" -ForegroundColor Yellow
        Write-Host "  get-dashboards, get-widgets, get-templates, get-users, get-analytics, test-connection, get-config" -ForegroundColor Yellow
    }
}

Write-Host "🚀 Custom Dashboards Manager finished." -ForegroundColor Cyan
