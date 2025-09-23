param(
    [switch]$Verbose,
    [switch]$Coverage
)

Write-Host "🎓 LearnEnglishBot Feature Testing" -ForegroundColor Cyan
Write-Host "Testing English learning specific functionality..." -ForegroundColor Yellow

$testResults = @{
    passed = 0
    failed = 0
    total = 0
}

# Activate virtual environment if available
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "`n🐍 Activating virtual environment..." -ForegroundColor Blue
    try {
        & .\venv\Scripts\Activate.ps1
        Write-Host "✅ Virtual environment activated" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Could not activate virtual environment" -ForegroundColor Yellow
    }
}

# Test 1: Exercise Manager Import and Basic Functionality
Write-Host "`n📚 Testing Exercise Manager..." -ForegroundColor Green
$testResults.total++
try {
    $exerciseTest = & python -c @"
try:
    from bot.exercise_manager import exercise_manager
    exercise = exercise_manager.get_exercise('irregular_verbs')
    if 'error' not in exercise:
        print('SUCCESS: Exercise system working')
        exit(0)
    else:
        print('ERROR: Exercise system returned error')
        exit(1)
except ImportError as e:
    print(f'ERROR: Import failed - {e}')
    exit(1)
except Exception as e:
    print(f'ERROR: Unexpected error - {e}')
    exit(1)
"@
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Exercise Manager test passed" -ForegroundColor Green
        $testResults.passed++
        if ($Verbose) { Write-Host "   $exerciseTest" -ForegroundColor Gray }
    } else {
        Write-Host "❌ Exercise Manager test failed" -ForegroundColor Red
        $testResults.failed++
        if ($Verbose) { Write-Host "   $exerciseTest" -ForegroundColor Gray }
    }
} catch {
    Write-Host "❌ Exercise Manager test failed with exception" -ForegroundColor Red
    $testResults.failed++
    if ($Verbose) { Write-Host "   $($_.Exception.Message)" -ForegroundColor Gray }
}

# Test 2: Main Bot Import
Write-Host "`n🤖 Testing Main Bot Import..." -ForegroundColor Green
$testResults.total++
try {
    $mainTest = & python -c @"
try:
    import main
    print('SUCCESS: Main bot module imports successfully')
    exit(0)
except ImportError as e:
    print(f'ERROR: Main import failed - {e}')
    exit(1)
except Exception as e:
    print(f'ERROR: Unexpected error - {e}')
    exit(1)
"@
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Main bot import test passed" -ForegroundColor Green
        $testResults.passed++
        if ($Verbose) { Write-Host "   $mainTest" -ForegroundColor Gray }
    } else {
        Write-Host "❌ Main bot import test failed" -ForegroundColor Red
        $testResults.failed++
        if ($Verbose) { Write-Host "   $mainTest" -ForegroundColor Gray }
    }
} catch {
    Write-Host "❌ Main bot import test failed with exception" -ForegroundColor Red
    $testResults.failed++
    if ($Verbose) { Write-Host "   $($_.Exception.Message)" -ForegroundColor Gray }
}

# Test 3: Dependencies Check
Write-Host "`n📦 Testing Critical Dependencies..." -ForegroundColor Green
$testResults.total++
try {
    $depsTest = & python -c @"
try:
    import telegram
    import openai
    print('SUCCESS: Critical dependencies available')
    exit(0)
except ImportError as e:
    print(f'ERROR: Dependency missing - {e}')
    exit(1)
except Exception as e:
    print(f'ERROR: Unexpected error - {e}')
    exit(1)
"@
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencies test passed" -ForegroundColor Green
        $testResults.passed++
        if ($Verbose) { Write-Host "   $depsTest" -ForegroundColor Gray }
    } else {
        Write-Host "❌ Dependencies test failed" -ForegroundColor Red
        $testResults.failed++
        if ($Verbose) { Write-Host "   $depsTest" -ForegroundColor Gray }
    }
} catch {
    Write-Host "❌ Dependencies test failed with exception" -ForegroundColor Red
    $testResults.failed++
    if ($Verbose) { Write-Host "   $($_.Exception.Message)" -ForegroundColor Gray }
}

# Test 4: Exercise Data Structure
Write-Host "`n📋 Testing Exercise Data Structure..." -ForegroundColor Green
$testResults.total++
try {
    $dataTest = & python -c @"
try:
    from bot.exercise_manager import exercise_manager
    exercises = exercise_manager.exercises
    if 'irregular_verbs' in exercises and 'interview_questions' in exercises:
        print('SUCCESS: Exercise categories properly configured')
        exit(0)
    else:
        print('ERROR: Missing exercise categories')
        exit(1)
except Exception as e:
    print(f'ERROR: {e}')
    exit(1)
"@
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Exercise data structure test passed" -ForegroundColor Green
        $testResults.passed++
        if ($Verbose) { Write-Host "   $dataTest" -ForegroundColor Gray }
    } else {
        Write-Host "❌ Exercise data structure test failed" -ForegroundColor Red
        $testResults.failed++
        if ($Verbose) { Write-Host "   $dataTest" -ForegroundColor Gray }
    }
} catch {
    Write-Host "❌ Exercise data structure test failed with exception" -ForegroundColor Red
    $testResults.failed++
    if ($Verbose) { Write-Host "   $($_.Exception.Message)" -ForegroundColor Gray }
}

# Run pytest if available and Coverage requested
if ($Coverage -and (Get-Command pytest -ErrorAction SilentlyContinue)) {
    Write-Host "`n🧪 Running pytest with coverage..." -ForegroundColor Green
    $testResults.total++
    try {
        $pytestResult = & pytest --cov=bot --cov-report=term-missing tests/ 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Pytest coverage test passed" -ForegroundColor Green
            $testResults.passed++
        } else {
            Write-Host "❌ Pytest coverage test failed" -ForegroundColor Red
            $testResults.failed++
        }
        if ($Verbose) { 
            Write-Host "   Pytest output:" -ForegroundColor Gray
            $pytestResult | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
        }
    } catch {
        Write-Host "❌ Pytest execution failed" -ForegroundColor Red
        $testResults.failed++
    }
}

# Summary
Write-Host "`n📊 Test Results Summary" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host "✅ Passed: $($testResults.passed)/$($testResults.total)" -ForegroundColor Green
Write-Host "❌ Failed: $($testResults.failed)/$($testResults.total)" -ForegroundColor Red

$passRate = if ($testResults.total -gt 0) { [math]::Round(($testResults.passed / $testResults.total) * 100, 1) } else { 0 }
Write-Host "🎯 Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } elseif ($passRate -ge 60) { "Yellow" } else { "Red" })

if ($testResults.failed -eq 0) {
    Write-Host "`n🎉 All English learning features are working correctly!" -ForegroundColor Green
    return 0
} else {
    Write-Host "`n❌ Some English learning features need attention" -ForegroundColor Red
    Write-Host "Please check the failed tests and fix the issues" -ForegroundColor Yellow
    return 1
}
