# External Integrations Management Script
# Manages integrations with GitHub, Slack, Telegram, Google Analytics, etc.

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("github", "slack", "telegram", "analytics", "stripe", "ads", "status", "test", "help")]
    [string]$Service = "help",

    [Parameter(Mandatory=$false)]
    [ValidateSet("connect", "disconnect", "test", "sync", "status", "config")]
    [string]$Action = "status",

    [Parameter(Mandatory=$false)]
    [string]$ConfigPath = "",

    [Parameter(Mandatory=$false)]
    [string]$Token = "",

    [Parameter(Mandatory=$false)]
    [string]$Channel = "",

    [Parameter(Mandatory=$false)]
    [string]$Message = "",

    [Parameter(Mandatory=$false)]
    [string]$Repository = "",

    [Parameter(Mandatory=$false)]
    [int]$Days = 7,

    [Parameter(Mandatory=$false)]
    [switch]$Detailed,

    [Parameter(Mandatory=$false)]
    [switch]$Force
)

# Set up paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$PythonPath = Join-Path $ProjectRoot "src"
$ConfigPath = if ($ConfigPath) { $ConfigPath } else { Join-Path $ProjectRoot "config" }

# Function to display help
function Show-Help {
    Write-Host "External Integrations Management Script" -ForegroundColor Green
    Write-Host "=======================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\Manage-Integrations.ps1 -Service <service> -Action <action> [parameters]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Services:" -ForegroundColor Cyan
    Write-Host "  github      - GitHub integration for repository tracking" -ForegroundColor White
    Write-Host "  slack       - Slack integration for notifications" -ForegroundColor White
    Write-Host "  telegram    - Telegram Bot API integration" -ForegroundColor White
    Write-Host "  analytics   - Google Analytics 4 integration" -ForegroundColor White
    Write-Host "  stripe      - Stripe payment integration" -ForegroundColor White
    Write-Host "  ads         - Advertising platforms integration" -ForegroundColor White
    Write-Host "  status      - Check status of all integrations" -ForegroundColor White
    Write-Host "  test        - Test all integrations" -ForegroundColor White
    Write-Host "  help        - Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Cyan
    Write-Host "  connect     - Connect to the service" -ForegroundColor White
    Write-Host "  disconnect  - Disconnect from the service" -ForegroundColor White
    Write-Host "  test        - Test the connection" -ForegroundColor White
    Write-Host "  sync        - Sync data from the service" -ForegroundColor White
    Write-Host "  status      - Check connection status" -ForegroundColor White
    Write-Host "  config      - Configure the service" -ForegroundColor White
    Write-Host ""
    Write-Host "Parameters:" -ForegroundColor Cyan
    Write-Host "  -ConfigPath  Path to configuration file" -ForegroundColor White
    Write-Host "  -Token       API token for the service" -ForegroundColor White
    Write-Host "  -Channel     Channel/chat ID for messaging" -ForegroundColor White
    Write-Host "  -Message     Message to send" -ForegroundColor White
    Write-Host "  -Repository  Repository name (for GitHub)" -ForegroundColor White
    Write-Host "  -Days        Number of days for data sync" -ForegroundColor White
    Write-Host "  -Detailed    Show detailed information" -ForegroundColor White
    Write-Host "  -Force       Force action without confirmation" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\Manage-Integrations.ps1 -Service github -Action connect -Token 'ghp_xxx'" -ForegroundColor White
    Write-Host "  .\Manage-Integrations.ps1 -Service slack -Action test -Channel '#general'" -ForegroundColor White
    Write-Host "  .\Manage-Integrations.ps1 -Service github -Action sync -Repository 'owner/repo' -Days 30" -ForegroundColor White
    Write-Host "  .\Manage-Integrations.ps1 -Service status" -ForegroundColor White
}

# Function to check Python environment
function Test-PythonEnvironment {
    try {
        $pythonVersion = python --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Python environment: $pythonVersion" -ForegroundColor Green
            return $true
        } else {
            Write-Host "✗ Python not found or not working" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "✗ Python not found or not working" -ForegroundColor Red
        return $false
    }
}

# Function to run Python script
function Invoke-PythonScript {
    param(
        [string]$ScriptPath,
        [string]$Arguments = ""
    )

    try {
        $fullPath = Join-Path $PythonPath $ScriptPath
        if (-not (Test-Path $fullPath)) {
            Write-Host "✗ Python script not found: $fullPath" -ForegroundColor Red
            return $null
        }

        $command = "python `"$fullPath`" $Arguments"
        Write-Host "Running: $command" -ForegroundColor Gray

        $result = Invoke-Expression $command 2>&1
        if ($LASTEXITCODE -eq 0) {
            return $result
        } else {
            Write-Host "✗ Python script failed with exit code: $LASTEXITCODE" -ForegroundColor Red
            Write-Host "Error: $result" -ForegroundColor Red
            return $null
        }
    } catch {
        Write-Host "✗ Error running Python script: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Function to manage GitHub integration
function Invoke-GitHubIntegration {
    param(
        [string]$Action,
        [string]$Token,
        [string]$Repository,
        [int]$Days
    )

    Write-Host "Managing GitHub integration..." -ForegroundColor Yellow

    $arguments = "--action $Action"
    if ($Token) { $arguments += " --token `"$Token`"" }
    if ($Repository) { $arguments += " --repository `"$Repository`"" }
    if ($Days) { $arguments += " --days $Days" }
    if ($Detailed) { $arguments += " --detailed" }

    $result = Invoke-PythonScript -ScriptPath "integrations/github_cli.py" -Arguments $arguments

    if ($result) {
        Write-Host "✓ GitHub operation completed" -ForegroundColor Green
        if ($Detailed) {
            Write-Host "Result: $result" -ForegroundColor Gray
        }
    } else {
        Write-Host "✗ GitHub operation failed" -ForegroundColor Red
    }
}

# Function to manage Slack integration
function Invoke-SlackIntegration {
    param(
        [string]$Action,
        [string]$Token,
        [string]$Channel,
        [string]$Message
    )

    Write-Host "Managing Slack integration..." -ForegroundColor Yellow

    $arguments = "--action $Action"
    if ($Token) { $arguments += " --token `"$Token`"" }
    if ($Channel) { $arguments += " --channel `"$Channel`"" }
    if ($Message) { $arguments += " --message `"$Message`"" }
    if ($Detailed) { $arguments += " --detailed" }

    $result = Invoke-PythonScript -ScriptPath "integrations/slack_cli.py" -Arguments $arguments

    if ($result) {
        Write-Host "✓ Slack operation completed" -ForegroundColor Green
        if ($Detailed) {
            Write-Host "Result: $result" -ForegroundColor Gray
        }
    } else {
        Write-Host "✗ Slack operation failed" -ForegroundColor Red
    }
}

# Function to manage Telegram integration
function Invoke-TelegramIntegration {
    param(
        [string]$Action,
        [string]$Token,
        [string]$Channel,
        [string]$Message
    )

    Write-Host "Managing Telegram integration..." -ForegroundColor Yellow

    $arguments = "--action $Action"
    if ($Token) { $arguments += " --token `"$Token`"" }
    if ($Channel) { $arguments += " --channel `"$Channel`"" }
    if ($Message) { $arguments += " --message `"$Message`"" }
    if ($Detailed) { $arguments += " --detailed" }

    $result = Invoke-PythonScript -ScriptPath "integrations/telegram_cli.py" -Arguments $arguments

    if ($result) {
        Write-Host "✓ Telegram operation completed" -ForegroundColor Green
        if ($Detailed) {
            Write-Host "Result: $result" -ForegroundColor Gray
        }
    } else {
        Write-Host "✗ Telegram operation failed" -ForegroundColor Red
    }
}

# Function to check integration status
function Get-IntegrationStatus {
    Write-Host "Checking integration status..." -ForegroundColor Yellow

    $services = @("github", "slack", "telegram", "analytics", "stripe", "ads")
    $status = @{}

    foreach ($service in $services) {
        $result = Invoke-PythonScript -ScriptPath "integrations/integration_status.py" -Arguments "--service $service"

        if ($result) {
            try {
                $statusData = $result | ConvertFrom-Json
                $status[$service] = $statusData
            } catch {
                $status[$service] = @{ connected = $false; error = "Failed to parse status" }
            }
        } else {
            $status[$service] = @{ connected = $false; error = "Failed to check status" }
        }
    }

    Write-Host "Integration Status:" -ForegroundColor Cyan
    foreach ($service in $services) {
        $serviceStatus = $status[$service]
        if ($serviceStatus.connected) {
            Write-Host "  ✓ $service - Connected" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $service - Not connected" -ForegroundColor Red
            if ($serviceStatus.error) {
                Write-Host "    Error: $($serviceStatus.error)" -ForegroundColor Red
            }
        }
    }
}

# Function to test all integrations
function Test-AllIntegrations {
    Write-Host "Testing all integrations..." -ForegroundColor Yellow

    $services = @("github", "slack", "telegram", "analytics", "stripe", "ads")
    $results = @{}

    foreach ($service in $services) {
        Write-Host "Testing $service..." -ForegroundColor Gray
        $result = Invoke-PythonScript -ScriptPath "integrations/test_integration.py" -Arguments "--service $service"

        if ($result) {
            try {
                $testData = $result | ConvertFrom-Json
                $results[$service] = $testData
            } catch {
                $results[$service] = @{ success = $false; error = "Failed to parse test result" }
            }
        } else {
            $results[$service] = @{ success = $false; error = "Test failed" }
        }
    }

    Write-Host "Integration Test Results:" -ForegroundColor Cyan
    foreach ($service in $services) {
        $testResult = $results[$service]
        if ($testResult.success) {
            Write-Host "  ✓ $service - Test passed" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $service - Test failed" -ForegroundColor Red
            if ($testResult.error) {
                Write-Host "    Error: $($testResult.error)" -ForegroundColor Red
            }
        }
    }
}

# Main execution
Write-Host "External Integrations Management Script" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""

# Check Python environment
if (-not (Test-PythonEnvironment)) {
    Write-Host "Please ensure Python is installed and accessible" -ForegroundColor Red
    exit 1
}

# Execute based on service and action
switch ($Service.ToLower()) {
    "github" {
        Invoke-GitHubIntegration -Action $Action -Token $Token -Repository $Repository -Days $Days
    }

    "slack" {
        Invoke-SlackIntegration -Action $Action -Token $Token -Channel $Channel -Message $Message
    }

    "telegram" {
        Invoke-TelegramIntegration -Action $Action -Token $Token -Channel $Channel -Message $Message
    }

    "analytics" {
        Write-Host "Google Analytics integration not yet implemented" -ForegroundColor Yellow
    }

    "stripe" {
        Write-Host "Stripe integration not yet implemented" -ForegroundColor Yellow
    }

    "ads" {
        Write-Host "Advertising platforms integration not yet implemented" -ForegroundColor Yellow
    }

    "status" {
        Get-IntegrationStatus
    }

    "test" {
        Test-AllIntegrations
    }

    "help" {
        Show-Help
    }

    default {
        Write-Host "✗ Unknown service: $Service" -ForegroundColor Red
        Show-Help
        exit 1
    }
}

Write-Host ""
Write-Host "Operation completed" -ForegroundColor Green
