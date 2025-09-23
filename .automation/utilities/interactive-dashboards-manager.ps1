# ManagerAgentAI Interactive Dashboards Manager v2.4
# PowerShell script for managing the Interactive Dashboards service

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "test", "deploy", "configure", "create-dashboard", "create-widget", "create-theme", "share-dashboard", "analytics")]
    [string]$Action,
    
    [Parameter(Mandatory=$false)]
    [string]$DashboardId,
    
    [Parameter(Mandatory=$false)]
    [string]$UserId,
    
    [Parameter(Mandatory=$false)]
    [string]$WidgetType = "chart",
    
    [Parameter(Mandatory=$false)]
    [string]$ThemeName = "default",
    
    [Parameter(Mandatory=$false)]
    [string]$ShareType = "view",
    
    [Parameter(Mandatory=$false)]
    [string]$ConfigFile = "config/interactive-dashboards.json",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Configuration
$ServiceName = "interactive-dashboards-service"
$ServicePort = 3017
$ServicePath = "interactive-dashboards"
$LogFile = "logs/interactive-dashboards-manager.log"
$ConfigPath = "config/interactive-dashboards.json"

# Colors for output
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    Write-ColorOutput $LogEntry $Level
    Add-Content -Path $LogFile -Value $LogEntry
}

function Test-ServiceRunning {
    try {
        $Response = Invoke-RestMethod -Uri "http://localhost:$ServicePort/health" -Method GET -TimeoutSec 5
        return $Response.status -eq "healthy"
    }
    catch {
        return $false
    }
}

function Start-InteractiveDashboardsService {
    Write-ColorOutput "Starting Interactive Dashboards Service..." "Header"
    
    if (Test-ServiceRunning) {
        Write-ColorOutput "Interactive Dashboards Service is already running" "Warning"
        return
    }
    
    try {
        # Check if Node.js is installed
        $NodeVersion = node --version 2>$null
        if (-not $NodeVersion) {
            throw "Node.js is not installed or not in PATH"
        }
        
        # Check if service directory exists
        if (-not (Test-Path $ServicePath)) {
            throw "Interactive Dashboards service directory not found: $ServicePath"
        }
        
        # Install dependencies if needed
        if (-not (Test-Path "$ServicePath/node_modules")) {
            Write-ColorOutput "Installing dependencies..." "Info"
            Set-Location $ServicePath
            npm install
            Set-Location ..
        }
        
        # Start the service
        Write-ColorOutput "Starting service on port $ServicePort..." "Info"
        Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $ServicePath -WindowStyle Hidden
        
        # Wait for service to start
        $MaxWait = 30
        $WaitCount = 0
        while (-not (Test-ServiceRunning) -and $WaitCount -lt $MaxWait) {
            Start-Sleep -Seconds 1
            $WaitCount++
        }
        
        if (Test-ServiceRunning) {
            Write-ColorOutput "Interactive Dashboards Service started successfully" "Success"
            Write-Log "Interactive Dashboards Service started successfully"
        } else {
            throw "Service failed to start within $MaxWait seconds"
        }
    }
    catch {
        Write-ColorOutput "Error starting Interactive Dashboards Service: $($_.Exception.Message)" "Error"
        Write-Log "Error starting Interactive Dashboards Service: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Stop-InteractiveDashboardsService {
    Write-ColorOutput "Stopping Interactive Dashboards Service..." "Header"
    
    if (-not (Test-ServiceRunning)) {
        Write-ColorOutput "Interactive Dashboards Service is not running" "Warning"
        return
    }
    
    try {
        # Find and kill the process
        $Processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
            $_.CommandLine -like "*$ServicePath*"
        }
        
        if ($Processes) {
            $Processes | Stop-Process -Force
            Write-ColorOutput "Interactive Dashboards Service stopped" "Success"
            Write-Log "Interactive Dashboards Service stopped"
        } else {
            Write-ColorOutput "No running Interactive Dashboards Service process found" "Warning"
        }
    }
    catch {
        Write-ColorOutput "Error stopping Interactive Dashboards Service: $($_.Exception.Message)" "Error"
        Write-Log "Error stopping Interactive Dashboards Service: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Get-ServiceStatus {
    Write-ColorOutput "Checking Interactive Dashboards Service Status..." "Header"
    
    try {
        if (Test-ServiceRunning) {
            $Response = Invoke-RestMethod -Uri "http://localhost:$ServicePort/status" -Method GET
            Write-ColorOutput "Service Status: RUNNING" "Success"
            Write-ColorOutput "Port: $ServicePort" "Info"
            Write-ColorOutput "Uptime: $($Response.uptime)" "Info"
            Write-ColorOutput "Version: $($Response.version)" "Info"
            Write-ColorOutput "Total Dashboards: $($Response.totalDashboards)" "Info"
            Write-ColorOutput "Total Widgets: $($Response.totalWidgets)" "Info"
            Write-ColorOutput "Active Connections: $($Response.activeConnections)" "Info"
            Write-ColorOutput "Real-time Subscriptions: $($Response.realTimeSubscriptions)" "Info"
        } else {
            Write-ColorOutput "Service Status: STOPPED" "Error"
        }
    }
    catch {
        Write-ColorOutput "Error checking service status: $($_.Exception.Message)" "Error"
        Write-Log "Error checking service status: $($_.Exception.Message)" "ERROR"
    }
}

function Get-ServiceLogs {
    Write-ColorOutput "Retrieving Interactive Dashboards Service Logs..." "Header"
    
    try {
        $LogFiles = @(
            "logs/interactive-dashboards.log",
            "logs/interactive-dashboards-error.log",
            "logs/interactive-dashboards-analytics.log",
            "logs/interactive-dashboards-websocket.log"
        )
        
        foreach ($LogFile in $LogFiles) {
            if (Test-Path $LogFile) {
                Write-ColorOutput "=== $LogFile ===" "Info"
                Get-Content $LogFile -Tail 20
                Write-ColorOutput "" "Info"
            }
        }
    }
    catch {
        Write-ColorOutput "Error retrieving logs: $($_.Exception.Message)" "Error"
        Write-Log "Error retrieving logs: $($_.Exception.Message)" "ERROR"
    }
}

function Test-InteractiveDashboardsService {
    Write-ColorOutput "Testing Interactive Dashboards Service..." "Header"
    
    try {
        if (-not (Test-ServiceRunning)) {
            throw "Service is not running"
        }
        
        # Test basic endpoints
        $Endpoints = @(
            "/health",
            "/status",
            "/dashboards",
            "/widgets",
            "/themes",
            "/preferences/test-user"
        )
        
        foreach ($Endpoint in $Endpoints) {
            try {
                $Response = Invoke-RestMethod -Uri "http://localhost:$ServicePort$Endpoint" -Method GET -TimeoutSec 5
                Write-ColorOutput "✓ $Endpoint - OK" "Success"
            }
            catch {
                Write-ColorOutput "✗ $Endpoint - FAILED: $($_.Exception.Message)" "Error"
            }
        }
        
        # Test dashboard creation
        Write-ColorOutput "Testing dashboard creation..." "Info"
        $TestDashboard = @{
            name = "Test Dashboard"
            description = "Test dashboard for validation"
            layout = "grid"
            theme = "default"
            widgets = @()
        }
        
        $Response = Invoke-RestMethod -Uri "http://localhost:$ServicePort/dashboards" -Method POST -Body ($TestDashboard | ConvertTo-Json) -ContentType "application/json"
        
        if ($Response.id) {
            Write-ColorOutput "✓ Dashboard creation test - OK" "Success"
            
            # Clean up test dashboard
            Invoke-RestMethod -Uri "http://localhost:$ServicePort/dashboards/$($Response.id)" -Method DELETE
        } else {
            Write-ColorOutput "✗ Dashboard creation test - FAILED" "Error"
        }
        
        Write-ColorOutput "Interactive Dashboards Service tests completed" "Success"
    }
    catch {
        Write-ColorOutput "Error testing service: $($_.Exception.Message)" "Error"
        Write-Log "Error testing service: $($_.Exception.Message)" "ERROR"
    }
}

function Deploy-InteractiveDashboardsService {
    Write-ColorOutput "Deploying Interactive Dashboards Service..." "Header"
    
    try {
        # Check if Docker is available
        $DockerVersion = docker --version 2>$null
        if (-not $DockerVersion) {
            throw "Docker is not installed or not in PATH"
        }
        
        # Build Docker image
        Write-ColorOutput "Building Docker image..." "Info"
        docker build -f Dockerfile.interactive-dashboards -t interactive-dashboards-service:latest .
        
        if ($LASTEXITCODE -ne 0) {
            throw "Docker build failed"
        }
        
        # Stop existing container
        $ExistingContainer = docker ps -q --filter "name=$ServiceName"
        if ($ExistingContainer) {
            Write-ColorOutput "Stopping existing container..." "Info"
            docker stop $ServiceName
            docker rm $ServiceName
        }
        
        # Run new container
        Write-ColorOutput "Starting new container..." "Info"
        docker run -d --name $ServiceName -p $ServicePort:$ServicePort interactive-dashboards-service:latest
        
        if ($LASTEXITCODE -ne 0) {
            throw "Docker run failed"
        }
        
        # Wait for service to start
        $MaxWait = 30
        $WaitCount = 0
        while (-not (Test-ServiceRunning) -and $WaitCount -lt $MaxWait) {
            Start-Sleep -Seconds 1
            $WaitCount++
        }
        
        if (Test-ServiceRunning) {
            Write-ColorOutput "Interactive Dashboards Service deployed successfully" "Success"
            Write-Log "Interactive Dashboards Service deployed successfully"
        } else {
            throw "Service failed to start after deployment"
        }
    }
    catch {
        Write-ColorOutput "Error deploying service: $($_.Exception.Message)" "Error"
        Write-Log "Error deploying service: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Configure-InteractiveDashboardsService {
    Write-ColorOutput "Configuring Interactive Dashboards Service..." "Header"
    
    try {
        # Create config directory if it doesn't exist
        if (-not (Test-Path "config")) {
            New-Item -ItemType Directory -Path "config" -Force
        }
        
        # Create default configuration
        $Config = @{
            interactiveDashboards = @{
                enableRealTime = $true
                enableAnalytics = $true
                enableSharing = $true
                enableThemes = $true
                enableWidgets = $true
                maxDashboards = 1000
                maxWidgetsPerDashboard = 50
                defaultLayout = "grid"
                defaultTheme = "default"
                updateInterval = 1000
                maxConnections = 1000
                enablePasswordProtection = $true
                enableExpiration = $true
                defaultExpirationDays = 30
            }
        }
        
        $Config | ConvertTo-Json -Depth 10 | Out-File -FilePath $ConfigPath -Encoding UTF8
        
        Write-ColorOutput "Configuration saved to $ConfigPath" "Success"
        Write-Log "Configuration saved to $ConfigPath"
    }
    catch {
        Write-ColorOutput "Error configuring service: $($_.Exception.Message)" "Error"
        Write-Log "Error configuring service: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function New-Dashboard {
    param(
        [string]$Name = "New Dashboard",
        [string]$Description = "Dashboard created via PowerShell",
        [string]$Layout = "grid",
        [string]$Theme = "default"
    )
    
    Write-ColorOutput "Creating Dashboard: $Name..." "Header"
    
    try {
        if (-not (Test-ServiceRunning)) {
            throw "Service is not running"
        }
        
        $DashboardData = @{
            name = $Name
            description = $Description
            layout = $Layout
            theme = $Theme
            widgets = @()
            settings = @{
                enableDragDrop = $true
                enableResize = $true
                enableSnapToGrid = $true
                gridSize = 20
                autoRefresh = $false
                refreshInterval = 30000
            }
        }
        
        $Response = Invoke-RestMethod -Uri "http://localhost:$ServicePort/dashboards" -Method POST -Body ($DashboardData | ConvertTo-Json) -ContentType "application/json"
        
        if ($Response.id) {
            Write-ColorOutput "Dashboard created successfully" "Success"
            Write-ColorOutput "Dashboard ID: $($Response.id)" "Info"
            Write-ColorOutput "Dashboard Name: $($Response.name)" "Info"
            Write-Log "Dashboard created: $($Response.id)"
        } else {
            throw "Dashboard creation failed"
        }
    }
    catch {
        Write-ColorOutput "Error creating dashboard: $($_.Exception.Message)" "Error"
        Write-Log "Error creating dashboard: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function New-Widget {
    param(
        [string]$DashboardId,
        [string]$Type = "chart",
        [string]$Title = "New Widget",
        [string]$Position = "0,0",
        [string]$Size = "400,300"
    )
    
    Write-ColorOutput "Creating Widget: $Title..." "Header"
    
    try {
        if (-not (Test-ServiceRunning)) {
            throw "Service is not running"
        }
        
        if (-not $DashboardId) {
            throw "DashboardId is required"
        }
        
        $PositionArray = $Position -split ","
        $SizeArray = $Size -split ","
        
        $WidgetData = @{
            type = $Type
            title = $Title
            position = @{
                x = [int]$PositionArray[0]
                y = [int]$PositionArray[1]
            }
            size = @{
                width = [int]$SizeArray[0]
                height = [int]$SizeArray[1]
            }
            config = @{
                chartType = "line"
                dataSource = "sampleData"
            }
        }
        
        $Response = Invoke-RestMethod -Uri "http://localhost:$ServicePort/dashboards/$DashboardId/widgets" -Method POST -Body ($WidgetData | ConvertTo-Json) -ContentType "application/json"
        
        if ($Response.id) {
            Write-ColorOutput "Widget created successfully" "Success"
            Write-ColorOutput "Widget ID: $($Response.id)" "Info"
            Write-ColorOutput "Widget Type: $($Response.type)" "Info"
            Write-Log "Widget created: $($Response.id) for dashboard: $DashboardId"
        } else {
            throw "Widget creation failed"
        }
    }
    catch {
        Write-ColorOutput "Error creating widget: $($_.Exception.Message)" "Error"
        Write-Log "Error creating widget: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function New-Theme {
    param(
        [string]$Name = "Custom Theme",
        [string]$Description = "Custom theme created via PowerShell"
    )
    
    Write-ColorOutput "Creating Theme: $Name..." "Header"
    
    try {
        if (-not (Test-ServiceRunning)) {
            throw "Service is not running"
        }
        
        $ThemeData = @{
            name = $Name
            description = $Description
            colors = @{
                primary = "#007bff"
                secondary = "#6c757d"
                success = "#28a745"
                danger = "#dc3545"
                warning = "#ffc107"
                info = "#17a2b8"
                background = "#ffffff"
                text = "#212529"
            }
            fonts = @{
                primary = "Inter, sans-serif"
                secondary = "Roboto, sans-serif"
            }
        }
        
        $Response = Invoke-RestMethod -Uri "http://localhost:$ServicePort/themes" -Method POST -Body ($ThemeData | ConvertTo-Json) -ContentType "application/json"
        
        if ($Response.id) {
            Write-ColorOutput "Theme created successfully" "Success"
            Write-ColorOutput "Theme ID: $($Response.id)" "Info"
            Write-ColorOutput "Theme Name: $($Response.name)" "Info"
            Write-Log "Theme created: $($Response.id)"
        } else {
            throw "Theme creation failed"
        }
    }
    catch {
        Write-ColorOutput "Error creating theme: $($_.Exception.Message)" "Error"
        Write-Log "Error creating theme: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Share-Dashboard {
    param(
        [string]$DashboardId,
        [string]$Type = "view",
        [string]$Password = "",
        [int]$ExpirationDays = 30
    )
    
    Write-ColorOutput "Sharing Dashboard: $DashboardId..." "Header"
    
    try {
        if (-not (Test-ServiceRunning)) {
            throw "Service is not running"
        }
        
        if (-not $DashboardId) {
            throw "DashboardId is required"
        }
        
        $ShareData = @{
            type = $Type
            isPublic = $false
            password = $Password
            expirationDays = $ExpirationDays
            canEdit = $false
            canShare = $false
            canDownload = $false
        }
        
        $Response = Invoke-RestMethod -Uri "http://localhost:$ServicePort/dashboards/$DashboardId/share" -Method POST -Body ($ShareData | ConvertTo-Json) -ContentType "application/json"
        
        if ($Response.token) {
            Write-ColorOutput "Dashboard shared successfully" "Success"
            Write-ColorOutput "Share Token: $($Response.token)" "Info"
            Write-ColorOutput "Share URL: http://localhost:$ServicePort/dashboards/shared/$($Response.token)" "Info"
            Write-Log "Dashboard shared: $DashboardId with token: $($Response.token)"
        } else {
            throw "Dashboard sharing failed"
        }
    }
    catch {
        Write-ColorOutput "Error sharing dashboard: $($_.Exception.Message)" "Error"
        Write-Log "Error sharing dashboard: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Get-Analytics {
    param(
        [string]$DashboardId = "",
        [string]$UserId = ""
    )
    
    Write-ColorOutput "Retrieving Analytics..." "Header"
    
    try {
        if (-not (Test-ServiceRunning)) {
            throw "Service is not running"
        }
        
        if ($DashboardId) {
            $Response = Invoke-RestMethod -Uri "http://localhost:$ServicePort/analytics/dashboard/$DashboardId" -Method GET
            Write-ColorOutput "Dashboard Analytics for $DashboardId:" "Info"
            Write-ColorOutput "Total Views: $($Response.views.total)" "Info"
            Write-ColorOutput "Unique Views: $($Response.views.unique)" "Info"
            Write-ColorOutput "Total Interactions: $($Response.interactions.total)" "Info"
        } elseif ($UserId) {
            $Response = Invoke-RestMethod -Uri "http://localhost:$ServicePort/analytics/user/$UserId" -Method GET
            Write-ColorOutput "User Analytics for $UserId:" "Info"
            Write-ColorOutput "Total Activity: $($Response.activity.total)" "Info"
            Write-ColorOutput "Last Activity: $($Response.activity.lastActivity)" "Info"
        } else {
            $Response = Invoke-RestMethod -Uri "http://localhost:$ServicePort/analytics/system" -Method GET
            Write-ColorOutput "System Analytics:" "Info"
            Write-ColorOutput "Total Events: $($Response.overview.totalEvents)" "Info"
            Write-ColorOutput "Total Dashboards: $($Response.overview.totalDashboards)" "Info"
            Write-ColorOutput "Total Users: $($Response.overview.totalUsers)" "Info"
        }
        
        Write-ColorOutput "Analytics retrieved successfully" "Success"
    }
    catch {
        Write-ColorOutput "Error retrieving analytics: $($_.Exception.Message)" "Error"
        Write-Log "Error retrieving analytics: $($_.Exception.Message)" "ERROR"
        throw
    }
}

# Main execution
try {
    Write-ColorOutput "ManagerAgentAI Interactive Dashboards Manager v2.4" "Header"
    Write-ColorOutput "Action: $Action" "Info"
    
    switch ($Action) {
        "start" {
            Start-InteractiveDashboardsService
        }
        "stop" {
            Stop-InteractiveDashboardsService
        }
        "restart" {
            Stop-InteractiveDashboardsService
            Start-Sleep -Seconds 2
            Start-InteractiveDashboardsService
        }
        "status" {
            Get-ServiceStatus
        }
        "logs" {
            Get-ServiceLogs
        }
        "test" {
            Test-InteractiveDashboardsService
        }
        "deploy" {
            Deploy-InteractiveDashboardsService
        }
        "configure" {
            Configure-InteractiveDashboardsService
        }
        "create-dashboard" {
            New-Dashboard -Name "PowerShell Dashboard" -Description "Dashboard created via PowerShell script"
        }
        "create-widget" {
            if (-not $DashboardId) {
                throw "DashboardId is required for widget creation"
            }
            New-Widget -DashboardId $DashboardId -Type $WidgetType -Title "PowerShell Widget"
        }
        "create-theme" {
            New-Theme -Name "PowerShell Theme" -Description "Theme created via PowerShell script"
        }
        "share-dashboard" {
            if (-not $DashboardId) {
                throw "DashboardId is required for dashboard sharing"
            }
            Share-Dashboard -DashboardId $DashboardId -Type $ShareType
        }
        "analytics" {
            Get-Analytics -DashboardId $DashboardId -UserId $UserId
        }
        default {
            throw "Unknown action: $Action"
        }
    }
    
    Write-ColorOutput "Operation completed successfully" "Success"
}
catch {
    Write-ColorOutput "Operation failed: $($_.Exception.Message)" "Error"
    Write-Log "Operation failed: $($_.Exception.Message)" "ERROR"
    exit 1
}
