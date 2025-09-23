param(
    [switch]$Detailed,
    [switch]$Fix
)

Write-Host "🎓 LearnEnglishBot Feature Validation" -ForegroundColor Cyan
Write-Host "Checking English learning specific components..." -ForegroundColor Yellow

$validationResults = @{
    passed = 0
    failed = 0
    warnings = 0
}

# 1. Check Exercise Manager
Write-Host "`n📚 Validating Exercise System..." -ForegroundColor Green
if (Test-Path "bot/exercise_manager.py") {
    $exerciseContent = Get-Content "bot/exercise_manager.py" -Raw
    if ($exerciseContent -match "irregular_verbs|interview_questions") {
        Write-Host "✅ Exercise Manager contains English learning exercises" -ForegroundColor Green
        $validationResults.passed++
    } else {
        Write-Host "⚠️ Exercise Manager exists but may not have proper English content" -ForegroundColor Yellow
        $validationResults.warnings++
    }
} else {
    Write-Host "❌ Exercise Manager missing (bot/exercise_manager.py)" -ForegroundColor Red
    $validationResults.failed++
}

# 2. Check Main Bot Commands
Write-Host "`n🤖 Validating Bot Commands..." -ForegroundColor Green
if (Test-Path "main.py") {
    $mainContent = Get-Content "main.py" -Raw
    $englishCommands = @("/exercise", "/interview", "/verbs", "/progress")
    $foundCommands = 0
    
    foreach ($cmd in $englishCommands) {
        if ($mainContent -match [regex]::Escape($cmd)) {
            Write-Host "✅ Command $cmd found" -ForegroundColor Green
            $foundCommands++
        } else {
            Write-Host "⚠️ Command $cmd missing" -ForegroundColor Yellow
        }
    }
    
    if ($foundCommands -eq $englishCommands.Length) {
        $validationResults.passed++
    } elseif ($foundCommands -gt 0) {
        $validationResults.warnings++
    } else {
        $validationResults.failed++
    }
} else {
    Write-Host "❌ main.py not found" -ForegroundColor Red
    $validationResults.failed++
}

# 3. Check Required Dependencies for English Learning
Write-Host "`n📦 Validating English Learning Dependencies..." -ForegroundColor Green
if (Test-Path "requirements.txt") {
    $reqContent = Get-Content "requirements.txt" -Raw
    $requiredPackages = @("python-telegram-bot", "openai", "openai-whisper")
    
    foreach ($package in $requiredPackages) {
        if ($reqContent -match $package) {
            Write-Host "✅ $package dependency found" -ForegroundColor Green
            $validationResults.passed++
        } else {
            Write-Host "❌ $package dependency missing" -ForegroundColor Red
            $validationResults.failed++
        }
    }
} else {
    Write-Host "❌ requirements.txt not found" -ForegroundColor Red
    $validationResults.failed++
}

# 4. Check Environment Configuration
Write-Host "`n🔧 Validating Environment Configuration..." -ForegroundColor Green
if (Test-Path ".env.example") {
    $envContent = Get-Content ".env.example" -Raw
    if ($envContent -match "TELEGRAM_TOKEN|OPENAI_API_KEY") {
        Write-Host "✅ .env.example contains required API keys" -ForegroundColor Green
        $validationResults.passed++
    } else {
        Write-Host "⚠️ .env.example missing required API key configuration" -ForegroundColor Yellow
        $validationResults.warnings++
    }
} else {
    Write-Host "❌ .env.example not found" -ForegroundColor Red
    if ($Fix) {
        Write-Host "🔧 Creating .env.example..." -ForegroundColor Blue
        # Note: We can't create files blocked by globalIgnore here
        Write-Host "⚠️ Cannot create .env.example automatically (blocked)" -ForegroundColor Yellow
    }
    $validationResults.failed++
}

# 5. Check Data Directories
Write-Host "`n📁 Validating Data Structure..." -ForegroundColor Green
$requiredDirs = @("data", "config", "logs")
foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        Write-Host "✅ Directory $dir exists" -ForegroundColor Green
        $validationResults.passed++
    } else {
        Write-Host "⚠️ Directory $dir missing" -ForegroundColor Yellow
        if ($Fix) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Host "🔧 Created directory $dir" -ForegroundColor Blue
        }
        $validationResults.warnings++
    }
}

# 6. Check Test Structure for English Learning
Write-Host "`n🧪 Validating Test Structure..." -ForegroundColor Green
if (Test-Path "tests") {
    $testDirs = @("unit", "integration", "e2e")
    foreach ($testDir in $testDirs) {
        if (Test-Path "tests/$testDir") {
            Write-Host "✅ Test directory tests/$testDir exists" -ForegroundColor Green
            $validationResults.passed++
        } else {
            Write-Host "⚠️ Test directory tests/$testDir missing" -ForegroundColor Yellow
            $validationResults.warnings++
        }
    }
} else {
    Write-Host "❌ Tests directory not found" -ForegroundColor Red
    $validationResults.failed++
}

# Summary
Write-Host "`n📊 Validation Summary" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host "✅ Passed: $($validationResults.passed)" -ForegroundColor Green
Write-Host "⚠️ Warnings: $($validationResults.warnings)" -ForegroundColor Yellow
Write-Host "❌ Failed: $($validationResults.failed)" -ForegroundColor Red

$totalChecks = $validationResults.passed + $validationResults.warnings + $validationResults.failed
$passRate = if ($totalChecks -gt 0) { [math]::Round(($validationResults.passed / $totalChecks) * 100, 1) } else { 0 }

Write-Host "`n🎯 Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } elseif ($passRate -ge 60) { "Yellow" } else { "Red" })

if ($validationResults.failed -eq 0 -and $validationResults.warnings -le 2) {
    Write-Host "`n🎉 LearnEnglishBot is ready for development!" -ForegroundColor Green
    return 0
} elseif ($validationResults.failed -eq 0) {
    Write-Host "`n⚠️ LearnEnglishBot has minor issues but is functional" -ForegroundColor Yellow
    return 1
} else {
    Write-Host "`n❌ LearnEnglishBot has critical issues that need attention" -ForegroundColor Red
    return 2
}
