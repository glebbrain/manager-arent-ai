param(
    [switch]$Start,
    [switch]$Stop,
    [switch]$Status,
    [switch]$Test,
    [switch]$Generate,
    [string]$ContentType = "social_media_post",
    [string]$Topic = "",
    [string]$Platform = "all",
    [switch]$Quiet
)
$ErrorActionPreference = "Stop"

# Colors for output
$Colors = @{
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-Status {
    param($Message, $Status = "Info", $NoNewline = $false)
    if (-not $Quiet) {
        $color = $Colors[$Status]
        if ($NoNewline) {
            Write-Host $Message -ForegroundColor $color -NoNewline
        } else {
            Write-Host $Message -ForegroundColor $color
        }
    }
}

function Start-AIServices {
    Write-Status "🤖 Starting AI Services..." "Header"

    # Start content generation service
    if (Test-Path "src/social_media/ai_content_generation.py") {
        Write-Status "  Starting AI Content Generation Service..." "Info"
        Start-Process -FilePath "python" -ArgumentList "src/social_media/ai_content_generation.py" -WindowStyle Hidden
        Write-Status "  ✅ AI Content Generation Service started" "Success"
    }

    # Start sentiment analysis service
    if (Test-Path "src/social_media/sentiment_analysis.py") {
        Write-Status "  Starting Sentiment Analysis Service..." "Info"
        Start-Process -FilePath "python" -ArgumentList "src/social_media/sentiment_analysis.py" -WindowStyle Hidden
        Write-Status "  ✅ Sentiment Analysis Service started" "Success"
    }

    # Start predictive analytics service
    if (Test-Path "src/analytics/predictive_analytics.py") {
        Write-Status "  Starting Predictive Analytics Service..." "Info"
        Start-Process -FilePath "python" -ArgumentList "src/analytics/predictive_analytics.py" -WindowStyle Hidden
        Write-Status "  ✅ Predictive Analytics Service started" "Success"
    }

    Write-Status "🎯 All AI services started successfully!" "Success"
}

function Stop-AIServices {
    Write-Status "🛑 Stopping AI Services..." "Header"

    # Stop AI-related processes
    $aiProcesses = Get-Process | Where-Object {
        $_.ProcessName -eq "python" -and
        $_.CommandLine -match "(ai_content_generation|sentiment_analysis|predictive_analytics)"
    }

    foreach ($process in $aiProcesses) {
        Write-Status "  Stopping process: $($process.ProcessName) (PID: $($process.Id))" "Info"
        Stop-Process -Id $process.Id -Force
    }

    Write-Status "✅ All AI services stopped" "Success"
}

function Get-AIStatus {
    Write-Status "🔍 AI Services Status Check" "Header"
    Write-Status "=========================" "Header"

    # Check AI service processes
    $aiProcesses = Get-Process | Where-Object {
        $_.ProcessName -eq "python" -and
        $_.CommandLine -match "(ai_content_generation|sentiment_analysis|predictive_analytics)"
    }

    if ($aiProcesses.Count -gt 0) {
        Write-Status "`n🤖 Running AI Services:" "Info"
        foreach ($process in $aiProcesses) {
            Write-Status "  ✅ $($process.ProcessName) (PID: $($process.Id))" "Success"
        }
    } else {
        Write-Status "`n❌ No AI services currently running" "Error"
    }

    # Check AI model files
    Write-Status "`n📁 AI Model Status:" "Info"
    $modelFiles = @(
        "src/social_media/ai_content_generation.py",
        "src/social_media/sentiment_analysis.py",
        "src/analytics/predictive_analytics.py",
        "config/ai_content_config.json"
    )

    foreach ($file in $modelFiles) {
        $exists = Test-Path $file
        $status = if ($exists) {"✅"} else {"❌"}
        $color = if ($exists) {"Success"} else {"Error"}
        Write-Status "  $status $file" $color
    }

    # Check AI database
    Write-Status "`n💾 AI Database Status:" "Info"
    $aiDbPath = "data/ai_analytics.db"
    $dbExists = Test-Path $aiDbPath
    $status = if ($dbExists) {"✅"} else {"❌"}
    $color = if ($dbExists) {"Success"} else {"Error"}
    $size = if ($dbExists) {" ($([math]::Round((Get-Item $aiDbPath).Length/1KB, 1)) KB)"} else {""}
    Write-Status "  $status AI Analytics Database$size" $color
}

function Test-AIFeatures {
    Write-Status "🧪 Testing AI Features..." "Header"

    # Test content generation
    Write-Status "  Testing AI Content Generation..." "Info"
    try {
        $testResult = python -c "
import sys
sys.path.append('src')
from social_media.ai_content_generation import AIContentGenerator
generator = AIContentGenerator()
result = generator.generate_content('Test topic', 'social_media_post', ['twitter'])
print('SUCCESS: Content generation working')
" 2>$null

        if ($LASTEXITCODE -eq 0) {
            Write-Status "  ✅ AI Content Generation: Working" "Success"
        } else {
            Write-Status "  ❌ AI Content Generation: Failed" "Error"
        }
    } catch {
        Write-Status "  ❌ AI Content Generation: Error - $($_.Exception.Message)" "Error"
    }

    # Test sentiment analysis
    Write-Status "  Testing Sentiment Analysis..." "Info"
    try {
        $testResult = python -c "
import sys
sys.path.append('src')
from social_media.sentiment_analysis import SentimentAnalyzer
analyzer = SentimentAnalyzer()
result = analyzer.analyze_sentiment('This is a great product!')
print('SUCCESS: Sentiment analysis working')
" 2>$null

        if ($LASTEXITCODE -eq 0) {
            Write-Status "  ✅ Sentiment Analysis: Working" "Success"
        } else {
            Write-Status "  ❌ Sentiment Analysis: Failed" "Error"
        }
    } catch {
        Write-Status "  ❌ Sentiment Analysis: Error - $($_.Exception.Message)" "Error"
    }

    # Test predictive analytics
    Write-Status "  Testing Predictive Analytics..." "Info"
    try {
        $testResult = python -c "
import sys
sys.path.append('src')
from analytics.predictive_analytics import PredictiveAnalytics
predictor = PredictiveAnalytics()
result = predictor.predict_user_behavior('test_user')
print('SUCCESS: Predictive analytics working')
" 2>$null

        if ($LASTEXITCODE -eq 0) {
            Write-Status "  ✅ Predictive Analytics: Working" "Success"
        } else {
            Write-Status "  ❌ Predictive Analytics: Failed" "Error"
        }
    } catch {
        Write-Status "  ❌ Predictive Analytics: Error - $($_.Exception.Message)" "Error"
    }

    Write-Status "`n🎯 AI Features testing complete!" "Success"
}

function Generate-AIContent {
    param($ContentType, $Topic, $Platform)

    Write-Status "🎨 Generating AI Content..." "Header"
    Write-Status "  Content Type: $ContentType" "Info"
    Write-Status "  Topic: $Topic" "Info"
    Write-Status "  Platform: $Platform" "Info"

    try {
        $pythonScript = @"
import sys
sys.path.append('src')
from social_media.ai_content_generation import AIContentGenerator

generator = AIContentGenerator()
result = generator.generate_content(
    prompt='$Topic',
    content_type='$ContentType',
    platforms=['$Platform'] if '$Platform' != 'all' else ['twitter', 'facebook', 'instagram']
)

print('Generated Content:')
print('Text:', result.get('generated_text', 'No text generated'))
print('Hashtags:', result.get('hashtags', []))
print('Mentions:', result.get('mentions', []))
print('CTA:', result.get('call_to_action', 'No CTA generated'))
"@

        $result = python -c $pythonScript
        Write-Status "`n📝 Generated Content:" "Success"
        Write-Status $result "Info"

    } catch {
        Write-Status "❌ Error generating content: $($_.Exception.Message)" "Error"
    }
}

# Main execution
if ($Start) {
    Start-AIServices
} elseif ($Stop) {
    Stop-AIServices
} elseif ($Status) {
    Get-AIStatus
} elseif ($Test) {
    Test-AIFeatures
} elseif ($Generate) {
    if (-not $Topic) {
        Write-Status "❌ Please provide a topic using -Topic parameter" "Error"
        exit 1
    }
    Generate-AIContent -ContentType $ContentType -Topic $Topic -Platform $Platform
} else {
    Write-Status "🤖 CyberSyn AI Features Manager" "Header"
    Write-Status "=============================" "Header"
    Write-Status ""
    Write-Status "Usage:" "Info"
    Write-Status "  .\Manage-AI-Features.ps1 -Start          # Start all AI services" "Info"
    Write-Status "  .\Manage-AI-Features.ps1 -Stop           # Stop all AI services" "Info"
    Write-Status "  .\Manage-AI-Features.ps1 -Status         # Check AI services status" "Info"
    Write-Status "  .\Manage-AI-Features.ps1 -Test           # Test AI features" "Info"
    Write-Status "  .\Manage-AI-Features.ps1 -Generate -Topic 'Your Topic' -ContentType 'social_media_post' -Platform 'twitter'" "Info"
    Write-Status ""
    Write-Status "Parameters:" "Info"
    Write-Status "  -ContentType: social_media_post, article, email, etc." "Info"
    Write-Status "  -Platform: twitter, facebook, instagram, linkedin, all" "Info"
    Write-Status "  -Topic: Topic or prompt for content generation" "Info"
    Write-Status "  -Quiet: Suppress output messages" "Info"
}

exit 0
