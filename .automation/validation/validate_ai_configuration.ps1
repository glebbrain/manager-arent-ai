param(
    [switch]$Detailed,
    [switch]$TestConnections,
    [switch]$CreateExample
)

Write-Host "🧠 LearnEnglishBot AI Configuration Validation" -ForegroundColor Cyan
Write-Host "Validating API keys, model endpoints, and bot tokens..." -ForegroundColor Yellow

$validationResults = @{
    passed = 0
    failed = 0
    warnings = 0
    critical = 0
}

# 1. Environment File Validation
Write-Host "`n🔧 Validating Environment Configuration..." -ForegroundColor Green

# Check for .env file
if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
    $envContent = Get-Content ".env" -Raw
    $validationResults.passed++
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    $validationResults.critical++
    
    if ($CreateExample -and (Test-Path ".env.example")) {
        Write-Host "🔧 Creating .env from .env.example..." -ForegroundColor Blue
        try {
            Copy-Item ".env.example" ".env"
            Write-Host "✅ .env created from template" -ForegroundColor Green
            $envContent = Get-Content ".env" -Raw
        } catch {
            Write-Host "❌ Failed to create .env file" -ForegroundColor Red
            $envContent = ""
        }
    } else {
        $envContent = ""
    }
}

# 2. Telegram Bot Token Validation
Write-Host "`n🤖 Validating Telegram Bot Configuration..." -ForegroundColor Green

if ($envContent -match "TELEGRAM_TOKEN\s*=\s*(.+)") {
    $telegramToken = $matches[1].Trim()
    
    # Check if token is properly formatted (should be like 123456789:ABCDEF...)
    if ($telegramToken -match "^\d+:[A-Za-z0-9_-]+$") {
        Write-Host "✅ Telegram token format is valid" -ForegroundColor Green
        $validationResults.passed++
        
        if ($TestConnections) {
            Write-Host "🔍 Testing Telegram Bot API connection..." -ForegroundColor Blue
            try {
                $testResult = & python -c @"
import os
import requests
import sys
from dotenv import load_dotenv

load_dotenv()
token = os.getenv('TELEGRAM_TOKEN')
if not token:
    print('ERROR: No token in environment')
    sys.exit(1)

try:
    response = requests.get(f'https://api.telegram.org/bot{token}/getMe', timeout=10)
    if response.status_code == 200:
        data = response.json()
        if data.get('ok'):
            bot_info = data.get('result', {})
            print(f'SUCCESS: Bot @{bot_info.get("username", "unknown")} is accessible')
            sys.exit(0)
        else:
            print(f'ERROR: Bot API returned error: {data.get("description", "unknown")}')
            sys.exit(1)
    else:
        print(f'ERROR: HTTP {response.status_code}')
        sys.exit(1)
except Exception as e:
    print(f'ERROR: Connection failed - {e}')
    sys.exit(1)
"@
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ Telegram Bot API connection successful" -ForegroundColor Green
                    if ($Detailed) { Write-Host "   $testResult" -ForegroundColor Gray }
                    $validationResults.passed++
                } else {
                    Write-Host "❌ Telegram Bot API connection failed" -ForegroundColor Red
                    if ($Detailed) { Write-Host "   $testResult" -ForegroundColor Gray }
                    $validationResults.failed++
                }
            } catch {
                Write-Host "❌ Failed to test Telegram connection" -ForegroundColor Red
                $validationResults.failed++
            }
        }
    } else {
        Write-Host "❌ Telegram token format is invalid" -ForegroundColor Red
        $validationResults.critical++
    }
} else {
    Write-Host "❌ TELEGRAM_TOKEN not found in .env" -ForegroundColor Red
    $validationResults.critical++
}

# 3. OpenAI API Key Validation
Write-Host "`n🧠 Validating OpenAI Configuration..." -ForegroundColor Green

if ($envContent -match "OPENAI_API_KEY\s*=\s*(.+)") {
    $openaiKey = $matches[1].Trim()
    
    # Check if key is properly formatted (should start with sk-)
    if ($openaiKey -match "^sk-[A-Za-z0-9]+$") {
        Write-Host "✅ OpenAI API key format is valid" -ForegroundColor Green
        $validationResults.passed++
        
        if ($TestConnections) {
            Write-Host "🔍 Testing OpenAI API connection..." -ForegroundColor Blue
            try {
                $testResult = & python -c @"
import os
import openai
import sys
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('OPENAI_API_KEY')
if not api_key:
    print('ERROR: No API key in environment')
    sys.exit(1)

try:
    client = openai.OpenAI(api_key=api_key)
    # Test with a simple completion
    response = client.chat.completions.create(
        model='gpt-3.5-turbo',
        messages=[{'role': 'user', 'content': 'Say "API test successful"'}],
        max_tokens=10
    )
    if response.choices[0].message.content:
        print('SUCCESS: OpenAI API is accessible and working')
        sys.exit(0)
    else:
        print('ERROR: OpenAI API returned empty response')
        sys.exit(1)
except Exception as e:
    print(f'ERROR: OpenAI connection failed - {e}')
    sys.exit(1)
"@
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ OpenAI API connection successful" -ForegroundColor Green
                    if ($Detailed) { Write-Host "   $testResult" -ForegroundColor Gray }
                    $validationResults.passed++
                } else {
                    Write-Host "❌ OpenAI API connection failed" -ForegroundColor Red
                    if ($Detailed) { Write-Host "   $testResult" -ForegroundColor Gray }
                    $validationResults.failed++
                }
            } catch {
                Write-Host "❌ Failed to test OpenAI connection" -ForegroundColor Red
                $validationResults.failed++
            }
        }
    } else {
        Write-Host "❌ OpenAI API key format is invalid (should start with sk-)" -ForegroundColor Red
        $validationResults.critical++
    }
} else {
    Write-Host "❌ OPENAI_API_KEY not found in .env" -ForegroundColor Red
    $validationResults.critical++
}

# 4. Whisper Model Validation
Write-Host "`n🎤 Validating Whisper Configuration..." -ForegroundColor Green

try {
    $whisperTest = & python -c @"
try:
    import whisper
    models = whisper.available_models()
    print(f'SUCCESS: Whisper available with models: {models}')
    exit(0)
except ImportError:
    print('ERROR: Whisper not installed')
    exit(1)
except Exception as e:
    print(f'ERROR: Whisper validation failed - {e}')
    exit(1)
"@
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Whisper is properly installed" -ForegroundColor Green
        if ($Detailed) { Write-Host "   $whisperTest" -ForegroundColor Gray }
        $validationResults.passed++
    } else {
        Write-Host "❌ Whisper validation failed" -ForegroundColor Red
        if ($Detailed) { Write-Host "   $whisperTest" -ForegroundColor Gray }
        $validationResults.failed++
    }
} catch {
    Write-Host "❌ Failed to validate Whisper installation" -ForegroundColor Red
    $validationResults.failed++
}

# 5. Environment Variables Security Check
Write-Host "`n🔐 Security Validation..." -ForegroundColor Green

$securityIssues = @()

# Check for example values
if ($envContent -match "your_.*_here|example|placeholder") {
    $securityIssues += "Example/placeholder values found in .env"
}

# Check for hardcoded secrets in code
$codeFiles = Get-ChildItem -Path "." -Include "*.py" -Recurse | Where-Object { $_.FullName -notmatch "venv|__pycache__" }
foreach ($file in $codeFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -match "sk-[A-Za-z0-9]+|bot[0-9]+:[A-Za-z0-9_-]+") {
        $securityIssues += "Potential hardcoded secrets in $($file.Name)"
    }
}

if ($securityIssues.Count -eq 0) {
    Write-Host "✅ No obvious security issues found" -ForegroundColor Green
    $validationResults.passed++
} else {
    Write-Host "⚠️ Security concerns detected:" -ForegroundColor Yellow
    foreach ($issue in $securityIssues) {
        Write-Host "   • $issue" -ForegroundColor Yellow
    }
    $validationResults.warnings += $securityIssues.Count
}

# Summary
Write-Host "`n📊 AI Configuration Validation Summary" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ Passed: $($validationResults.passed)" -ForegroundColor Green
Write-Host "⚠️ Warnings: $($validationResults.warnings)" -ForegroundColor Yellow
Write-Host "❌ Failed: $($validationResults.failed)" -ForegroundColor Red
Write-Host "🔴 Critical: $($validationResults.critical)" -ForegroundColor Magenta

$totalChecks = $validationResults.passed + $validationResults.warnings + $validationResults.failed + $validationResults.critical
$passRate = if ($totalChecks -gt 0) { [math]::Round(($validationResults.passed / $totalChecks) * 100, 1) } else { 0 }

Write-Host "`n🎯 Configuration Health: $passRate%" -ForegroundColor $(if ($passRate -ge 90) { "Green" } elseif ($passRate -ge 70) { "Yellow" } else { "Red" })

# Recommendations
if ($validationResults.critical -gt 0) {
    Write-Host "`n🚨 CRITICAL ISSUES FOUND:" -ForegroundColor Red
    Write-Host "1. Set up proper API keys in .env file" -ForegroundColor Red
    Write-Host "2. Ensure tokens are in correct format" -ForegroundColor Red
    Write-Host "3. Run with -CreateExample to generate .env template" -ForegroundColor Red
    return 2
} elseif ($validationResults.failed -gt 0) {
    Write-Host "`n⚠️ Issues found but not critical" -ForegroundColor Yellow
    Write-Host "Consider testing API connections with -TestConnections" -ForegroundColor Yellow
    return 1
} else {
    Write-Host "`n🎉 AI configuration is properly set up!" -ForegroundColor Green
    return 0
}
