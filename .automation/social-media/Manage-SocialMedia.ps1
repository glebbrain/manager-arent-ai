# Social Media Management Script
# Comprehensive social media management and analytics with AI features

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("post", "schedule", "analytics", "campaign", "templates", "status", "ai-generate", "ab-test", "sentiment", "trends", "help")]
    [string]$Action = "help",

    [Parameter(Mandatory=$false)]
    [string]$Platform = "",

    [Parameter(Mandatory=$false)]
    [string]$Content = "",

    [Parameter(Mandatory=$false)]
    [string]$MediaPath = "",

    [Parameter(Mandatory=$false)]
    [string]$ScheduledTime = "",

    [Parameter(Mandatory=$false)]
    [string]$CampaignId = "",

    [Parameter(Mandatory=$false)]
    [string]$TemplateId = "",

    [Parameter(Mandatory=$false)]
    [int]$Days = 7,

    [Parameter(Mandatory=$false)]
    [switch]$Detailed,

    [Parameter(Mandatory=$false)]
    [switch]$Export,

    [Parameter(Mandatory=$false)]
    [string]$OutputFormat = "json",

    [Parameter(Mandatory=$false)]
    [string]$Topic = "",

    [Parameter(Mandatory=$false)]
    [string]$ContentType = "social_media_post",

    [Parameter(Mandatory=$false)]
    [string]$Tone = "professional",

    [Parameter(Mandatory=$false)]
    [string]$TestId = "",

    [Parameter(Mandatory=$false)]
    [string]$Keywords = "",

    [Parameter(Mandatory=$false)]
    [int]$TimeRange = 7
)

# Set up paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$PythonPath = Join-Path $ProjectRoot "src"
$ConfigPath = Join-Path $ProjectRoot "config"
$DataPath = Join-Path $ProjectRoot "data"

# Ensure data directory exists
if (-not (Test-Path $DataPath)) {
    New-Item -ItemType Directory -Path $DataPath -Force | Out-Null
}

# Function to display help
function Show-Help {
    Write-Host "Social Media Management Script" -ForegroundColor Green
    Write-Host "==============================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\Manage-SocialMedia.ps1 -Action <action> [parameters]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Cyan
    Write-Host "  post        - Post content to social media platforms" -ForegroundColor White
    Write-Host "  schedule    - Schedule content for future posting" -ForegroundColor White
    Write-Host "  analytics   - View analytics and performance metrics" -ForegroundColor White
    Write-Host "  campaign    - Manage content campaigns" -ForegroundColor White
    Write-Host "  templates   - Manage content templates" -ForegroundColor White
    Write-Host "  status      - Check platform connection status" -ForegroundColor White
    Write-Host "  ai-generate - Generate AI-powered content" -ForegroundColor White
    Write-Host "  ab-test     - Manage A/B testing campaigns" -ForegroundColor White
    Write-Host "  sentiment   - Analyze sentiment of content/mentions" -ForegroundColor White
    Write-Host "  trends      - Analyze trending topics and hashtags" -ForegroundColor White
    Write-Host "  help        - Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Parameters:" -ForegroundColor Cyan
    Write-Host "  -Platform      Platform to use (facebook, instagram, twitter, linkedin, tiktok, youtube, vk, telegram)" -ForegroundColor White
    Write-Host "  -Content       Text content to post" -ForegroundColor White
    Write-Host "  -MediaPath     Path to media files (images/videos)" -ForegroundColor White
    Write-Host "  -ScheduledTime Scheduled time for posting (ISO format)" -ForegroundColor White
    Write-Host "  -CampaignId    Campaign ID for campaign operations" -ForegroundColor White
    Write-Host "  -TemplateId    Template ID for template operations" -ForegroundColor White
    Write-Host "  -Days          Number of days for analytics (default: 7)" -ForegroundColor White
    Write-Host "  -Detailed      Show detailed information" -ForegroundColor White
    Write-Host "  -Export        Export results to file" -ForegroundColor White
    Write-Host "  -OutputFormat  Output format (json, csv, xlsx)" -ForegroundColor White
    Write-Host "  -Topic         Topic for AI content generation" -ForegroundColor White
    Write-Host "  -ContentType   Type of content (social_media_post, article, email)" -ForegroundColor White
    Write-Host "  -Tone          Tone for AI generation (professional, casual, friendly)" -ForegroundColor White
    Write-Host "  -TestId        A/B test ID for testing operations" -ForegroundColor White
    Write-Host "  -Keywords      Keywords for trend analysis" -ForegroundColor White
    Write-Host "  -TimeRange     Time range in days for analysis (default: 7)" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\Manage-SocialMedia.ps1 -Action post -Platform facebook -Content 'Hello World!'" -ForegroundColor White
    Write-Host "  .\Manage-SocialMedia.ps1 -Action schedule -Content 'Scheduled post' -ScheduledTime '2025-01-28T10:00:00Z'" -ForegroundColor White
    Write-Host "  .\Manage-SocialMedia.ps1 -Action analytics -Days 30 -Detailed" -ForegroundColor White
    Write-Host "  .\Manage-SocialMedia.ps1 -Action ai-generate -Topic 'AI technology' -ContentType 'social_media_post' -Tone 'professional'" -ForegroundColor White
    Write-Host "  .\Manage-SocialMedia.ps1 -Action ab-test -TestId 'test123' -Detailed" -ForegroundColor White
    Write-Host "  .\Manage-SocialMedia.ps1 -Action sentiment -Content 'Great product!' -Platform twitter" -ForegroundColor White
    Write-Host "  .\Manage-SocialMedia.ps1 -Action trends -Keywords 'AI,technology' -TimeRange 7" -ForegroundColor White
    Write-Host "  .\Manage-SocialMedia.ps1 -Action status" -ForegroundColor White
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

# Function to post content
function Invoke-PostContent {
    param(
        [string]$Platform,
        [string]$Content,
        [string]$MediaPath
    )

    Write-Host "Posting content to $Platform..." -ForegroundColor Yellow

    $arguments = "--action post --platform `"$Platform`" --content `"$Content`""
    if ($MediaPath) {
        $arguments += " --media-path `"$MediaPath`""
    }

    $result = Invoke-PythonScript -ScriptPath "social_media/social_media_cli.py" -Arguments $arguments

    if ($result) {
        Write-Host "✓ Content posted successfully" -ForegroundColor Green
        if ($Detailed) {
            Write-Host "Result: $result" -ForegroundColor Gray
        }
    } else {
        Write-Host "✗ Failed to post content" -ForegroundColor Red
    }
}

# Function to schedule content
function Invoke-ScheduleContent {
    param(
        [string]$Content,
        [string]$ScheduledTime,
        [string]$Platform = "",
        [string]$MediaPath = ""
    )

    Write-Host "Scheduling content..." -ForegroundColor Yellow

    $arguments = "--action schedule --content `"$Content`" --scheduled-time `"$ScheduledTime`""
    if ($Platform) {
        $arguments += " --platform `"$Platform`""
    }
    if ($MediaPath) {
        $arguments += " --media-path `"$MediaPath`""
    }

    $result = Invoke-PythonScript -ScriptPath "social_media/social_media_cli.py" -Arguments $arguments

    if ($result) {
        Write-Host "✓ Content scheduled successfully" -ForegroundColor Green
        if ($Detailed) {
            Write-Host "Result: $result" -ForegroundColor Gray
        }
    } else {
        Write-Host "✗ Failed to schedule content" -ForegroundColor Red
    }
}

# Function to get analytics
function Get-Analytics {
    param(
        [int]$Days,
        [string]$Platform = ""
    )

    Write-Host "Getting analytics for the last $Days days..." -ForegroundColor Yellow

    $arguments = "--action analytics --days $Days"
    if ($Platform) {
        $arguments += " --platform `"$Platform`""
    }
    if ($Detailed) {
        $arguments += " --detailed"
    }
    if ($Export) {
        $arguments += " --export --output-format `"$OutputFormat`""
    }

    $result = Invoke-PythonScript -ScriptPath "social_media/social_media_cli.py" -Arguments $arguments

    if ($result) {
        Write-Host "✓ Analytics retrieved successfully" -ForegroundColor Green
        if ($Detailed) {
            Write-Host "Analytics: $result" -ForegroundColor Gray
        }
    } else {
        Write-Host "✗ Failed to get analytics" -ForegroundColor Red
    }
}

# Function to manage campaigns
function Invoke-CampaignManagement {
    param(
        [string]$CampaignId,
        [string]$Action
    )

    Write-Host "Managing campaigns..." -ForegroundColor Yellow

    $arguments = "--action campaign --campaign-action `"$Action`""
    if ($CampaignId) {
        $arguments += " --campaign-id `"$CampaignId`""
    }
    if ($Detailed) {
        $arguments += " --detailed"
    }

    $result = Invoke-PythonScript -ScriptPath "social_media/social_media_cli.py" -Arguments $arguments

    if ($result) {
        Write-Host "✓ Campaign operation completed" -ForegroundColor Green
        if ($Detailed) {
            Write-Host "Result: $result" -ForegroundColor Gray
        }
    } else {
        Write-Host "✗ Failed to manage campaign" -ForegroundColor Red
    }
}

# Function to manage templates
function Invoke-TemplateManagement {
    param(
        [string]$TemplateId,
        [string]$Action
    )

    Write-Host "Managing templates..." -ForegroundColor Yellow

    $arguments = "--action templates --template-action `"$Action`""
    if ($TemplateId) {
        $arguments += " --template-id `"$TemplateId`""
    }
    if ($Detailed) {
        $arguments += " --detailed"
    }

    $result = Invoke-PythonScript -ScriptPath "social_media/social_media_cli.py" -Arguments $arguments

    if ($result) {
        Write-Host "✓ Template operation completed" -ForegroundColor Green
        if ($Detailed) {
            Write-Host "Result: $result" -ForegroundColor Gray
        }
    } else {
        Write-Host "✗ Failed to manage template" -ForegroundColor Red
    }
}

# Function to check platform status
function Get-PlatformStatus {
    Write-Host "Checking platform connection status..." -ForegroundColor Yellow

    $result = Invoke-PythonScript -ScriptPath "social_media/social_media_cli.py" -Arguments "--action status"

    if ($result) {
        Write-Host "✓ Platform status retrieved" -ForegroundColor Green
        Write-Host "Status: $result" -ForegroundColor Gray
    } else {
        Write-Host "✗ Failed to get platform status" -ForegroundColor Red
    }
}

# Function to generate AI content
function Invoke-AIContentGeneration {
    param(
        [string]$Topic,
        [string]$ContentType,
        [string]$Tone,
        [string]$Platform = ""
    )

    Write-Host "Generating AI content..." -ForegroundColor Yellow

    $arguments = "--action ai-generate --topic `"$Topic`" --content-type `"$ContentType`" --tone `"$Tone`""
    if ($Platform) {
        $arguments += " --platform `"$Platform`""
    }
    if ($Detailed) {
        $arguments += " --detailed"
    }

    $result = Invoke-PythonScript -ScriptPath "social_media/social_media_cli.py" -Arguments $arguments

    if ($result) {
        Write-Host "✓ AI content generated successfully" -ForegroundColor Green
        if ($Detailed) {
            Write-Host "Generated Content: $result" -ForegroundColor Gray
        }
    } else {
        Write-Host "✗ Failed to generate AI content" -ForegroundColor Red
    }
}

# Function to manage A/B testing
function Invoke-ABTesting {
    param(
        [string]$TestId,
        [string]$Action
    )

    Write-Host "Managing A/B testing..." -ForegroundColor Yellow

    $arguments = "--action ab-test --test-action `"$Action`""
    if ($TestId) {
        $arguments += " --test-id `"$TestId`""
    }
    if ($Detailed) {
        $arguments += " --detailed"
    }

    $result = Invoke-PythonScript -ScriptPath "social_media/social_media_cli.py" -Arguments $arguments

    if ($result) {
        Write-Host "✓ A/B test operation completed" -ForegroundColor Green
        if ($Detailed) {
            Write-Host "Result: $result" -ForegroundColor Gray
        }
    } else {
        Write-Host "✗ Failed to manage A/B test" -ForegroundColor Red
    }
}

# Function to analyze sentiment
function Invoke-SentimentAnalysis {
    param(
        [string]$Content,
        [string]$Platform = ""
    )

    Write-Host "Analyzing sentiment..." -ForegroundColor Yellow

    $arguments = "--action sentiment --content `"$Content`""
    if ($Platform) {
        $arguments += " --platform `"$Platform`""
    }
    if ($Detailed) {
        $arguments += " --detailed"
    }

    $result = Invoke-PythonScript -ScriptPath "social_media/social_media_cli.py" -Arguments $arguments

    if ($result) {
        Write-Host "✓ Sentiment analysis completed" -ForegroundColor Green
        if ($Detailed) {
            Write-Host "Analysis: $result" -ForegroundColor Gray
        }
    } else {
        Write-Host "✗ Failed to analyze sentiment" -ForegroundColor Red
    }
}

# Function to analyze trends
function Invoke-TrendAnalysis {
    param(
        [string]$Keywords,
        [int]$TimeRange
    )

    Write-Host "Analyzing trends..." -ForegroundColor Yellow

    $arguments = "--action trends --keywords `"$Keywords`" --time-range $TimeRange"
    if ($Detailed) {
        $arguments += " --detailed"
    }
    if ($Export) {
        $arguments += " --export --output-format `"$OutputFormat`""
    }

    $result = Invoke-PythonScript -ScriptPath "social_media/social_media_cli.py" -Arguments $arguments

    if ($result) {
        Write-Host "✓ Trend analysis completed" -ForegroundColor Green
        if ($Detailed) {
            Write-Host "Trends: $result" -ForegroundColor Gray
        }
    } else {
        Write-Host "✗ Failed to analyze trends" -ForegroundColor Red
    }
}

# Main execution
Write-Host "Social Media Management Script" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green
Write-Host ""

# Check Python environment
if (-not (Test-PythonEnvironment)) {
    Write-Host "Please ensure Python is installed and accessible" -ForegroundColor Red
    exit 1
}

# Execute based on action
switch ($Action.ToLower()) {
    "post" {
        if (-not $Content) {
            Write-Host "✗ Content is required for posting" -ForegroundColor Red
            exit 1
        }
        if (-not $Platform) {
            Write-Host "✗ Platform is required for posting" -ForegroundColor Red
            exit 1
        }
        Invoke-PostContent -Platform $Platform -Content $Content -MediaPath $MediaPath
    }

    "schedule" {
        if (-not $Content) {
            Write-Host "✗ Content is required for scheduling" -ForegroundColor Red
            exit 1
        }
        if (-not $ScheduledTime) {
            Write-Host "✗ Scheduled time is required for scheduling" -ForegroundColor Red
            exit 1
        }
        Invoke-ScheduleContent -Content $Content -ScheduledTime $ScheduledTime -Platform $Platform -MediaPath $MediaPath
    }

    "analytics" {
        Get-Analytics -Days $Days -Platform $Platform
    }

    "campaign" {
        Invoke-CampaignManagement -CampaignId $CampaignId -Action "list"
    }

    "templates" {
        Invoke-TemplateManagement -TemplateId $TemplateId -Action "list"
    }

    "status" {
        Get-PlatformStatus
    }

    "ai-generate" {
        if (-not $Topic) {
            Write-Host "✗ Topic is required for AI content generation" -ForegroundColor Red
            exit 1
        }
        Invoke-AIContentGeneration -Topic $Topic -ContentType $ContentType -Tone $Tone -Platform $Platform
    }

    "ab-test" {
        Invoke-ABTesting -TestId $TestId -Action "list"
    }

    "sentiment" {
        if (-not $Content) {
            Write-Host "✗ Content is required for sentiment analysis" -ForegroundColor Red
            exit 1
        }
        Invoke-SentimentAnalysis -Content $Content -Platform $Platform
    }

    "trends" {
        if (-not $Keywords) {
            Write-Host "✗ Keywords are required for trend analysis" -ForegroundColor Red
            exit 1
        }
        Invoke-TrendAnalysis -Keywords $Keywords -TimeRange $TimeRange
    }

    "help" {
        Show-Help
    }

    default {
        Write-Host "✗ Unknown action: $Action" -ForegroundColor Red
        Show-Help
        exit 1
    }
}

Write-Host ""
Write-Host "Operation completed" -ForegroundColor Green
